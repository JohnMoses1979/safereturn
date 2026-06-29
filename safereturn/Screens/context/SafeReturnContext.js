

























// context/SafeReturnContext.js

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";

const SafeReturnContext = createContext(null);

const CURRENT_USER_KEY = "@safereturn/current-user";
const AUTH_TOKEN_KEY = "@safereturn/auth-token";

// ─── Change this to your machine IP when testing on a physical device ─────────
function getApiBaseUrl() {
  const envUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "";

  if (envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  if (Platform.OS === "web") {
    return "http://localhost:8080";
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080";
  }

  return "http://localhost:8080";
}

export const API_BASE_URL = getApiBaseUrl();

function normalizeImageUrl(value) {
  if (!value) return "";

  const raw = String(value).trim();
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("file:")) return raw;
  if (raw.startsWith("/api/images/")) return `${API_BASE_URL}${raw}`;

  try {
    const parsed = new URL(raw);
    if (parsed.pathname.startsWith("/api/images/")) {
      return `${API_BASE_URL}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    if (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      /^192\.168\./.test(parsed.hostname)
    ) {
      if (parsed.pathname.startsWith("/api/images/")) {
        return `${API_BASE_URL}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    }
  } catch {
    const index = raw.indexOf("/api/images/");
    if (index >= 0) {
      return `${API_BASE_URL}${raw.slice(index)}`;
    }
  }

  return raw;
}

function normalizeReportImages(item) {
  if (!item || typeof item !== "object") return item;

  const normalized = { ...item };
  const imageFields = [
    "photoUrl",
    "photoUri",
    "image",
    "imageUri",
    "sightingImage",
    "personImage",
    "missingPersonImage",
  ];

  imageFields.forEach((field) => {
    if (normalized[field]) {
      normalized[field] = normalizeImageUrl(normalized[field]);
    }
  });

  if (Array.isArray(normalized.extraPhotoUrls)) {
    normalized.extraPhotoUrls = normalized.extraPhotoUrls
      .map(normalizeImageUrl)
      .filter(Boolean);
  }

  if (Array.isArray(normalized.extraPhotos)) {
    normalized.extraPhotos = normalized.extraPhotos
      .map(normalizeImageUrl)
      .filter(Boolean);
  }

  return normalized;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function readJsonResponse(response) {
  const raw = await response.text();
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return { message: raw.trim() }; }
}

function getFriendlyError(data, fallback, response) {
  if (!data) return fallback;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors).find(Boolean);
    if (first) return String(first);
  }
  if (data.message && String(data.message).trim()) return String(data.message).trim();
  if (response?.status === 401) return "Your session has expired. Please sign in again.";
  if (response?.status === 403) return "You do not have permission.";
  if (response?.status >= 500) return "Server error. Please try again in a moment.";
  return fallback;
}

async function requestJson(url, options, fallback) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error("Unable to reach the server. Please check your connection.");
  }
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(getFriendlyError(data, fallback, response));
  return data ?? {};
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function extractNumericId(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const text = String(value).trim();
  if (!text) return null;

  const match = text.match(/(\d+)/);
  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveMissingReportId(sightingData = {}) {
  const candidates = [
    sightingData.missingReportId,
    sightingData.missingPersonId,
    sightingData.personId,
    sightingData.reportId,
    sightingData.id,
  ];

  for (const candidate of candidates) {
    const numericId = extractNumericId(candidate);
    if (numericId !== null) {
      return numericId;
    }
  }

  return null;
}

// ─── Time formatter (kept local for offline use) ──────────────────────────────

export function formatTimeAgo(dateValue) {
  if (!dateValue) return "Just now";
  const date = new Date(dateValue);
  const now = new Date();
  if (Number.isNaN(date.getTime())) return "Just now";
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Image upload helper ──────────────────────────────────────────────────────

/**
 * Uploads a local image URI to the backend.
 * Returns the public URL string or throws on error.
 *
 * Usage: const url = await uploadImage(localUri, authToken);
 */
export async function uploadImage(localUri, token) {
  if (!localUri) return null;

  const filename = localUri.split("/").pop();
  const ext = filename.split(".").pop().toLowerCase();
  const mimeTypes = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
  const type = mimeTypes[ext] || "image/jpeg";

  const formData = new FormData();
  if (Platform.OS === "web") {
    const res = await fetch(localUri);
    const blob = await res.blob();
    const file = new File([blob], filename, { type });
    formData.append("file", file);
  } else {
    formData.append("file", { uri: localUri, name: filename, type });
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/images/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type manually for multipart — let fetch handle it
      },
      body: formData,
    });
  } catch {
    throw new Error("Unable to reach the server. Please check your connection.");
  }

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(getFriendlyError(data, "Failed to upload image.", response));
  }

  const result = await response.json();
  return normalizeImageUrl(result.url || result.relativeUrl || result.path || "");
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SafeReturnProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // ── Local state (populated from API responses) ──
  const [missingReports, setMissingReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [sightingReports, setSightingReports] = useState([]);
  const [savedPersons, setSavedPersons] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertUnreadCount, setAlertUnreadCount] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    reported: 0, sightings: 0, found: 0, members: 0,
    rewardReports: 0, totalRewardAmount: 0,
  });

  // ─── Restore session ────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem(CURRENT_USER_KEY),
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
        ]);
        if (!mounted) return;
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
        if (storedToken) setAuthToken(storedToken);
      } catch {
        if (mounted) { setCurrentUser(null); setAuthToken(null); }
      }
    };
    restore();
    return () => { mounted = false; };
  }, []);

  // ─── Persist user ────────────────────────────────────────────────────────────

  useEffect(() => {
    const persist = async () => {
      try {
        if (currentUser) {
          await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
        } else {
          await Promise.all([
            AsyncStorage.removeItem(CURRENT_USER_KEY),
            AsyncStorage.removeItem(AUTH_TOKEN_KEY),
          ]);
          setAuthToken(null);
        }
      } catch { }
    };
    persist();
  }, [currentUser]);

  useEffect(() => {
    const persist = async () => {
      try {
        if (authToken) await AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken);
      } catch { }
    };
    persist();
  }, [authToken]);

  // ─── Load data on login ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!authToken) return;
    refreshAll(authToken);
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return;

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshAlertUnreadCount(authToken);
      }
    });

    return () => {
      subscription?.remove?.();
    };
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return;

    const intervalId = setInterval(() => {
      refreshAlertUnreadCount(authToken);
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [authToken]);

  const refreshAll = useCallback(async (token) => {
    try {
      await Promise.all([
        refreshMissingReports(token),
        refreshMyReports(token),
        refreshCommunityReports(token),
        refreshSightingReports(token),
        refreshAlerts(token),
        refreshAlertUnreadCount(token),
        refreshDashboardStats(token),
        refreshSavedPersons(token),
      ]);
    } catch (err) {
      console.log("refreshAll error:", err.message);
    }
  }, []);

  // ─── Refresh helpers ──────────────────────────────────────────────────────────

  const refreshMissingReports = useCallback(async (token) => {
    try {
      const data = await requestJson(
        `${API_BASE_URL}/api/reports/missing?page=0&size=50`,
        { method: "GET", headers: authHeaders(token) },
        "Failed to load reports."
      );
      setMissingReports(
        Array.isArray(data.content) ? data.content.map(normalizeReportImages) : []
      );
    } catch (err) {
      console.log("refreshMissingReports error:", err.message);
    }
  }, []);

  const refreshMyReports = useCallback(async (token) => {
    try {
      const data = await requestJson(
        `${API_BASE_URL}/api/reports/missing/my`,
        { method: "GET", headers: authHeaders(token) },
        "Failed to load my reports."
      );
      setMyReports(Array.isArray(data) ? data.map(normalizeReportImages) : []);
    } catch (err) {
      console.log("refreshMyReports error:", err.message);
    }
  }, []);

  const refreshCommunityReports = useCallback(async (token) => {
    try {
      const data = await requestJson(
        `${API_BASE_URL}/api/reports/missing/community?page=0&size=50`,
        { method: "GET", headers: authHeaders(token) },
        "Failed to load community reports."
      );
      setCommunityReports(
        Array.isArray(data.content) ? data.content.map(normalizeReportImages) : []
      );
    } catch (err) {
      console.log("refreshCommunityReports error:", err.message);
    }
  }, []);

  const refreshSightingReports = useCallback(async (token) => {
    try {
      const data = await requestJson(
        `${API_BASE_URL}/api/reports/sightings?page=0&size=50`,
        { method: "GET", headers: authHeaders(token) },
        "Failed to load sightings."
      );
      setSightingReports(
        Array.isArray(data.content) ? data.content.map(normalizeReportImages) : []
      );
    } catch (err) {
      console.log("refreshSightingReports error:", err.message);
    }
  }, []);

  const refreshAlerts = useCallback(async (token) => {
    try {
      const data = await requestJson(
        `${API_BASE_URL}/api/alerts`,
        { method: "GET", headers: authHeaders(token) },
        "Failed to load alerts."
      );
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("refreshAlerts error:", err.message);
    }
  }, []);

  const refreshAlertUnreadCount = useCallback(async (token) => {
    try {
      const data = await requestJson(
        `${API_BASE_URL}/api/alerts/count`,
        { method: "GET", headers: authHeaders(token) },
        "Failed to load unread alert count."
      );

      const nextCount = Number(data?.count ?? 0);
      setAlertUnreadCount(Number.isFinite(nextCount) && nextCount > 0 ? nextCount : 0);
    } catch (err) {
      console.log("refreshAlertUnreadCount error:", err.message);
    }
  }, []);

  const refreshDashboardStats = useCallback(async (token) => {
    try {
      const data = await requestJson(
        `${API_BASE_URL}/api/dashboard/stats`,
        { method: "GET", headers: authHeaders(token) },
        "Failed to load dashboard stats."
      );
      setDashboardStats(data);
    } catch (err) {
      console.log("refreshDashboardStats error:", err.message);
    }
  }, []);

  const refreshSavedPersons = useCallback(async (token) => {
    try {
      const data = await requestJson(
        `${API_BASE_URL}/api/saved`,
        { method: "GET", headers: authHeaders(token) },
        "Failed to load saved reports."
      );
      setSavedPersons(Array.isArray(data) ? data.map(normalizeReportImages) : []);
    } catch (err) {
      console.log("refreshSavedPersons error:", err.message);
    }
  }, []);

  // ─── Auth ─────────────────────────────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    const data = await requestJson(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }, "Invalid email or password.");
    setAuthToken(data.token);
    setCurrentUser(data.user);
    return data.user;
  }, []);

  const initiateRegistration = useCallback(async (fullName, phone, email, password, confirmPassword) => {
    return await requestJson(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone, email, password, confirmPassword }),
    }, "Registration failed.");
  }, []);

  const verifyOtp = useCallback(async (phone, otp) => {
    const data = await requestJson(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    }, "OTP verification failed.");
    setAuthToken(data.token);
    setCurrentUser(data.user);
    return data.user;
  }, []);

  const resendOtp = useCallback(async (phone) => {
    return await requestJson(`${API_BASE_URL}/api/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    }, "Failed to resend OTP.");
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        CURRENT_USER_KEY,
        AUTH_TOKEN_KEY,
      ]);
    } catch (e) {
      console.log("logout storage cleanup error:", e);
    }

    setCurrentUser(null);
    setAuthToken(null);

    setMissingReports([]);
    setMyReports([]);
    setCommunityReports([]);
    setSightingReports([]);
    setSavedPersons([]);
    setAlerts([]);
    setAlertUnreadCount(0);

    setDashboardStats({
      reported: 0,
      sightings: 0,
      found: 0,
      members: 0,
      rewardReports: 0,
      totalRewardAmount: 0,
    });
  }, []);

  // ─── Forgot Password ──────────────────────────────────────────────────────────

  const forgotPasswordInitiate = useCallback(async (phone) => {
    return await requestJson(`${API_BASE_URL}/api/auth/forgot-password/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    }, "Failed to send OTP.");
  }, []);

  const forgotPasswordVerifyOtp = useCallback(async (phone, otp) => {
    return await requestJson(`${API_BASE_URL}/api/auth/forgot-password/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    }, "OTP verification failed.");
  }, []);

  const forgotPasswordReset = useCallback(async (phone, resetToken, newPassword, confirmPassword) => {
    return await requestJson(`${API_BASE_URL}/api/auth/forgot-password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, resetToken, newPassword, confirmPassword }),
    }, "Password reset failed.");
  }, []);

  const forgotPasswordResendOtp = useCallback(async (phone) => {
    return await requestJson(`${API_BASE_URL}/api/auth/forgot-password/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    }, "Failed to resend OTP.");
  }, []);

  // ─── Profile ──────────────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async (token) => {
    const bearerToken = token || authToken;
    if (!bearerToken) throw new Error("Not authenticated.");
    const data = await requestJson(`${API_BASE_URL}/api/profile`, {
      method: "GET",
      headers: authHeaders(bearerToken),
    }, "Failed to load profile.");
    setCurrentUser((prev) => ({ ...(prev || {}), ...data }));
    return data;
  }, [authToken]);

  const updateProfile = useCallback(async (profileData) => {
    if (!authToken) throw new Error("Not authenticated.");
    const data = await requestJson(`${API_BASE_URL}/api/profile`, {
      method: "PUT",
      headers: authHeaders(authToken),
      body: JSON.stringify(profileData),
    }, "Failed to update profile.");
    setCurrentUser((prev) => ({ ...(prev || {}), ...data }));
    return data;
  }, [authToken]);

  // ─── Missing Person Reports ───────────────────────────────────────────────────

  /**
   * Creates a missing person report.
   * photoUri and extraPhotoUris are local URIs from ImagePicker.
   * They are uploaded first, then the report is submitted with the returned URLs.
   */
  const addMissingReport = useCallback(async (reportData) => {
    if (!authToken) throw new Error("Not authenticated.");

    // 1. Upload primary photo
    let photoUrl = null;
    if (reportData.photoUri && !reportData.photoUri.startsWith("http")) {
      photoUrl = await uploadImage(reportData.photoUri, authToken);
    } else {
      photoUrl = reportData.photoUri || null;
    }

    // 2. Upload extra photos
    let extraPhotoUrls = [];
    if (Array.isArray(reportData.extraPhotos)) {
      for (const uri of reportData.extraPhotos) {
        if (uri && !uri.startsWith("http")) {
          try {
            const url = await uploadImage(uri, authToken);
            if (url) extraPhotoUrls.push(url);
          } catch (err) {
            console.log("Extra photo upload failed:", err.message);
          }
        } else if (uri) {
          extraPhotoUrls.push(uri);
        }
      }
    }

    // 3. Submit the report
    const body = {
      fullName: reportData.fullName || reportData.name,
      age: reportData.age,
      gender: reportData.gender,
      height: reportData.height,
      complexion: reportData.complexion,
      hairColor: reportData.hairColor,
      eyeColor: reportData.eyeColor,
      bodyType: reportData.bodyType,
      weight: reportData.weight,
      lastSeenDate: reportData.lastSeenDate,
      lastSeenTime: reportData.lastSeenTime,
      address: reportData.address,
      landmark: reportData.landmark,
      city: reportData.city,
      state: reportData.state || reportData.stateName,
      pincode: reportData.pincode,
      latitude: reportData.liveLocation?.latitude || reportData.latitude || null,
      longitude: reportData.liveLocation?.longitude || reportData.longitude || null,
      physicalDetails: reportData.physicalDetails,
      otherDetails: reportData.otherDetails,
      reporterName: reportData.reporterName || reportData.guardianName,
      relationship: reportData.relationship,
      phoneNumber: reportData.phoneNumber || reportData.contactNumber,
      emailAddress: reportData.emailAddress,
      rewardAmount: reportData.rewardAmount || 0,
      photoUrl,
      extraPhotoUrls,
    };

    const data = await requestJson(`${API_BASE_URL}/api/reports/missing`, {
      method: "POST",
      headers: authHeaders(authToken),
      body: JSON.stringify(body),
    }, "Failed to submit report.");

    // 4. Refresh local state
    await Promise.all([
      refreshMissingReports(authToken),
      refreshMyReports(authToken),
      refreshCommunityReports(authToken),
      refreshAlerts(authToken),
      refreshAlertUnreadCount(authToken),
      refreshDashboardStats(authToken),
    ]);

    return data;
  }, [authToken, refreshMissingReports, refreshMyReports, refreshCommunityReports, refreshAlerts, refreshAlertUnreadCount, refreshDashboardStats]);

  /**
   * Creates a sighting report.
   * photoUri is a local URI and will be uploaded automatically.
   */
  const addSightingReport = useCallback(async (sightingData) => {
    if (!authToken) throw new Error("Not authenticated.");

    // Upload photo if present
    let photoUrl = null;
    if (sightingData.photoUri && !sightingData.photoUri.startsWith("http")) {
      try {
        photoUrl = await uploadImage(sightingData.photoUri, authToken);
      } catch (err) {
        console.log("Sighting photo upload failed:", err.message);
      }
    } else {
      photoUrl = sightingData.photoUri || null;
    }

    const missingReportId = resolveMissingReportId(sightingData);
    if (missingReportId === null) {
      throw new Error("Missing report ID is required to submit a sighting.");
    }

    const body = {
      missingReportId,
      seenDate: sightingData.seenDate,
      seenTime: sightingData.seenTime,
      location: sightingData.location || sightingData.seenAddress,
      latitude: sightingData.liveLocation?.latitude || sightingData.latitude || null,
      longitude: sightingData.liveLocation?.longitude || sightingData.longitude || null,
      seenOption: sightingData.seenOption,
      details: sightingData.details,
      photoUrl,
      contactName: sightingData.contactName || null,
      contactPhone: sightingData.contactPhone || null,
    };

    const data = await requestJson(`${API_BASE_URL}/api/reports/sightings`, {
      method: "POST",
      headers: authHeaders(authToken),
      body: JSON.stringify(body),
    }, "Failed to submit sighting.");

    // Refresh
    await Promise.all([
      refreshSightingReports(authToken),
      refreshAlerts(authToken),
      refreshAlertUnreadCount(authToken),
      refreshDashboardStats(authToken),
    ]);

    return data;
  }, [authToken, refreshSightingReports, refreshAlerts, refreshAlertUnreadCount, refreshDashboardStats]);

  /**
   * Move sighting to under review state.
   */
  const moveToUnderReview = useCallback(async (sightingId) => {
    if (!authToken) throw new Error("Not authenticated.");
    const data = await requestJson(`${API_BASE_URL}/api/reports/sightings/${sightingId}/under-review`, {
      method: "PUT",
      headers: authHeaders(authToken),
    }, "Failed to update review status.");

    await refreshSightingReports(authToken);
    return data;
  }, [authToken, refreshSightingReports]);

  /**
   * Confirm or reject a sighting report with reward details.
   */
  const verifySighting = useCallback(async (sightingId, action, provideReward = false, rewardAmount = 0) => {
    if (!authToken) throw new Error("Not authenticated.");
    const body = {
      action,
      provideReward,
      rewardAmount,
    };
    const data = await requestJson(`${API_BASE_URL}/api/reports/sightings/${sightingId}/verify`, {
      method: "POST",
      headers: authHeaders(authToken),
      body: JSON.stringify(body),
    }, "Failed to verify sighting.");

    await Promise.all([
      refreshMissingReports(authToken),
      refreshMyReports(authToken),
      refreshCommunityReports(authToken),
      refreshSightingReports(authToken),
      refreshAlerts(authToken),
      refreshAlertUnreadCount(authToken),
      refreshDashboardStats(authToken),
    ]);
    return data;
  }, [authToken, refreshMissingReports, refreshMyReports, refreshCommunityReports, refreshSightingReports, refreshAlerts, refreshAlertUnreadCount, refreshDashboardStats]);

  // ─── Saved Persons ────────────────────────────────────────────────────────────

  const toggleSavedPerson = useCallback(async (person) => {
    if (!authToken) throw new Error("Not authenticated.");
    const reportId = person.id;
    if (!reportId) return;

    const data = await requestJson(`${API_BASE_URL}/api/saved/${reportId}`, {
      method: "POST",
      headers: authHeaders(authToken),
    }, "Failed to update saved report.");

    await refreshSavedPersons(authToken);
    return data;
  }, [authToken, refreshSavedPersons]);

  const isPersonSaved = useCallback(
    (id) => savedPersons.some((item) => item.id === id || item.reportId === String(id)),
    [savedPersons]
  );


  // ─── AI Face Match ────────────────────────────────────────────────────────────

  // const faceMatchSearch = useCallback(async (localImageUri) => {
  //   if (!authToken) throw new Error("Not authenticated. Please log in first.");
  //   if (!localImageUri) throw new Error("No image provided.");

  //   const filename = localImageUri.split("/").pop();
  //   const ext = filename.split(".").pop().toLowerCase();
  //   const mimeTypes = {
  //     jpg: "image/jpeg",
  //     jpeg: "image/jpeg",
  //     png: "image/png",
  //     webp: "image/webp",
  //   };
  //   const type = mimeTypes[ext] || "image/jpeg";

  //   const formData = new FormData();
  //   if (Platform.OS === "web") {
  //     const res = await fetch(localImageUri);
  //     const blob = await res.blob();
  //     const file = new File([blob], filename, { type });
  //     formData.append("photo", file);
  //   } else {
  //     formData.append("photo", { uri: localImageUri, name: filename, type });
  //   }

  //   let response;
  //   try {
  //     response = await fetch(`${API_BASE_URL}/api/face-match/search`, {
  //       method: "POST",
  //       headers: {
  //         Authorization: `Bearer ${authToken}`,
  //         // Do NOT set Content-Type — fetch sets multipart boundary automatically
  //       },
  //       body: formData,
  //     });
  //   } catch {
  //     throw new Error("Unable to reach the server. Please check your connection.");
  //   }

  //   if (!response.ok) {
  //     const data = await readJsonResponse(response);
  //     throw new Error(getFriendlyError(data, "Face match search failed.", response));
  //   }

  //   return await response.json();
  // }, [authToken]);

  // ─── Alerts ───────────────────────────────────────────────────────────────────

  const markAlertsRead = useCallback(async () => {
    if (!authToken) return;
    try {
      await requestJson(`${API_BASE_URL}/api/alerts/read-all`, {
        method: "POST",
        headers: authHeaders(authToken),
      }, "Failed to mark alerts as read.");
      setAlertUnreadCount(0);
      await refreshAlerts(authToken);
    } catch (err) {
      console.log("markAlertsRead error:", err.message);
    }
  }, [authToken, refreshAlerts]);

  // ─── AI Face Match ────────────────────────────────────────────────────────────

  const faceMatchSearch = useCallback(async (localImageUri) => {
    if (!authToken) throw new Error("Not authenticated.");
    if (!localImageUri) throw new Error("No image provided.");

    const filename = localImageUri.split("/").pop();
    const ext = filename.split(".").pop().toLowerCase();
    const mimeTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };
    const type = mimeTypes[ext] || "image/jpeg";

    const formData = new FormData();
    if (Platform.OS === "web") {
      const res = await fetch(localImageUri);
      const blob = await res.blob();
      const file = new File([blob], filename, { type });
      formData.append("photo", file);
    } else {
      formData.append("photo", { uri: localImageUri, name: filename, type });
    }

    let response;
    try {
      response = await fetch(`${API_BASE_URL}/api/face-match/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          // Do NOT set Content-Type — let fetch set multipart boundary automatically
        },
        body: formData,
      });
    } catch {
      throw new Error("Unable to reach the server. Please check your connection.");
    }

    if (!response.ok) {
      const data = await readJsonResponse(response);
      throw new Error(
        getFriendlyError(data, "Face match search failed.", response)
      );
    }

    return await response.json(); // FaceMatchResponse shape
  }, [authToken]);

  // ─── Refresh (public) ─────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    if (authToken) await refreshAll(authToken);
  }, [authToken, refreshAll]);

  // ─── Clear ────────────────────────────────────────────────────────────────────

  const clearAllData = useCallback(() => {
    setMissingReports([]);
    setMyReports([]);
    setCommunityReports([]);
    setSightingReports([]);
    setSavedPersons([]);
    setCurrentUser(null);
    setAlerts([]);
    setAlertUnreadCount(0);
  }, []);

  // â”€â”€â”€ Police APIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const fetchPoliceStats = useCallback(async () => {
    if (!authToken) return null;
    try {
      return await requestJson(
        `${API_BASE_URL}/api/police/dashboard/stats`,
        { method: "GET", headers: authHeaders(authToken) },
        "Failed to load police dashboard stats."
      );
    } catch (err) {
      console.log("fetchPoliceStats error:", err.message);
      return null;
    }
  }, [authToken]);

  const fetchPoliceReports = useCallback(async (page = 0, size = 20) => {
    if (!authToken) return null;
    try {
      return await requestJson(
        `${API_BASE_URL}/api/police/reports/all?page=${page}&size=${size}`,
        { method: "GET", headers: authHeaders(authToken) },
        "Failed to load police reports."
      );
    } catch (err) {
      console.log("fetchPoliceReports error:", err.message);
      return null;
    }
  }, [authToken]);

  const verifyPoliceReport = useCallback(async (id, status) => {
    if (!authToken) return false;
    try {
      const approved =
        typeof status === "boolean"
          ? status
          : ["approved", "approve", "yes", "true", "resolved", "solved", "found"].includes(
              String(status).toLowerCase()
            );
      await requestJson(
        `${API_BASE_URL}/api/police/reports/${id}/verify?approved=${approved}`,
        { method: "POST", headers: authHeaders(authToken) },
        "Failed to verify police report."
      );
      return true;
    } catch (err) {
      console.log("verifyPoliceReport error:", err.message);
      return false;
    }
  }, [authToken]);

  const fetchPoliceSightings = useCallback(async () => {
    if (!authToken) return null;
    try {
      return await requestJson(
        `${API_BASE_URL}/api/police/sightings/pending`,
        { method: "GET", headers: authHeaders(authToken) },
        "Failed to load police sightings."
      );
    } catch (err) {
      console.log("fetchPoliceSightings error:", err.message);
      return null;
    }
  }, [authToken]);

  const verifyPoliceSighting = useCallback(async (id, action) => {
    if (!authToken) return false;
    try {
      await requestJson(
        `${API_BASE_URL}/api/police/sightings/${id}/verify?action=${action}`,
        { method: "POST", headers: authHeaders(authToken) },
        "Failed to verify police sighting."
      );
      return true;
    } catch (err) {
      console.log("verifyPoliceSighting error:", err.message);
      return false;
    }
  }, [authToken]);

  const fetchPoliceAnalytics = useCallback(async () => {
    if (!authToken) return null;
    try {
      return await requestJson(
        `${API_BASE_URL}/api/police/analytics/trends`,
        { method: "GET", headers: authHeaders(authToken) },
        "Failed to load police analytics."
      );
    } catch (err) {
      console.log("fetchPoliceAnalytics error:", err.message);
      return null;
    }
  }, [authToken]);


  // Add these functions inside SafeReturnProvider, near the other API calls:

  // ... inside the `value` useMemo object, add these:
  // fetchPoliceStats,
  // fetchPoliceReports,
  // verifyPoliceReport,

  // ─── Context value ────────────────────────────────────────────────────────────
  const value = useMemo(
    () => ({
      // Auth state
      currentUser,
      setCurrentUser,
      authToken,

      // Auth actions
      login,
      initiateRegistration,
      verifyOtp,
      resendOtp,
      logout,
      forgotPasswordInitiate,
      forgotPasswordVerifyOtp,
      forgotPasswordReset,
      forgotPasswordResendOtp,

      // Profile
      fetchProfile,
      updateProfile,

      // Data
      missingReports,
      myReports,
      communityReports,
      sightingReports,
      savedPersons,
      reportedPersons: missingReports,     // alias used by ReportsScreen
      recentlyReported: missingReports,    // alias used by DashboardScreen
      recentSightings: sightingReports,    // alias used by DashboardScreen
      alerts,
      alertUnreadCount,
      dashboardStats,

      // Report actions
      addMissingReport,
      addSightingReport,
      moveToUnderReview,
      verifySighting,

      // Saved
      toggleSavedPerson,
      isPersonSaved,

      // Alerts
      markAlertsRead,

      // Refresh
      refresh,
      clearAllData,

      // Utilities
      formatTimeAgo,
      uploadImage: (uri) => uploadImage(uri, authToken),
      faceMatchSearch,

      // Police
      fetchPoliceStats,
      fetchPoliceReports,
      verifyPoliceReport,
      fetchPoliceSightings,
      verifyPoliceSighting,
      fetchPoliceAnalytics,

    }),
    [
      currentUser, authToken,
      login, initiateRegistration, verifyOtp, resendOtp, logout,
      forgotPasswordInitiate, forgotPasswordVerifyOtp,
      forgotPasswordReset, forgotPasswordResendOtp,
      fetchProfile, updateProfile,
      missingReports, myReports, communityReports, sightingReports, savedPersons,
      alerts, alertUnreadCount, dashboardStats,
      addMissingReport, addSightingReport, moveToUnderReview, verifySighting,
      toggleSavedPerson, isPersonSaved,
      markAlertsRead, refresh, clearAllData,
      fetchPoliceStats, fetchPoliceReports, verifyPoliceReport,
      fetchPoliceSightings, verifyPoliceSighting, fetchPoliceAnalytics,
    ]
  );

  return (
    <SafeReturnContext.Provider value={value}>
      {children}
    </SafeReturnContext.Provider>
  );
}

export function useSafeReturn() {
  const context = useContext(SafeReturnContext);
  if (!context) {
    throw new Error("useSafeReturn must be used inside SafeReturnProvider");
  }
  return context;
}

export default SafeReturnContext;
