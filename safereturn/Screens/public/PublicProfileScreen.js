











// Screens/public/PublicProfileScreen.js

import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Dimensions,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import { useSafeReturn } from "../../Screens/context/SafeReturnContext";

const { width } = Dimensions.get("window");

const isSmallPhone  = width < 360;
const isMediumPhone = width >= 360 && width < 400;

const fs = (small, medium, large) => {
  if (isSmallPhone)  return small;
  if (isMediumPhone) return medium;
  return large;
};

const COLORS = {
  bg: "#020B1F", card: "#062A63", card2: "#05265B",
  border: "rgba(42,122,255,0.42)", white: "#FFFFFF",
  softWhite: "#DDE8FF", muted: "#9FAFD0", blue: "#2696FF",
  cyan: "#36CFFF", red: "#FF3048", green: "#22D66B",
  orange: "#FF9F12", purple: "#8B3FF2", pink: "#E73380",
};

const LOGIN_ROUTE = "LoginScreen";
const ROUTES = {
  PUBLIC_HOME:  "PublicHome",
  REPORTS:      "PublicReports",
  PUBLIC_SAVED: "PublicSavedScreen",
  HELPLINE:     "HelplineScreen",
  SAFETY_TIPS:  "SafetyTips",
  LOGIN:        "LoginScreen",
};

function safeNumber(value) {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return "0";
  if (number > 999) return `${(number / 1000).toFixed(1)}K`;
  return String(number);
}

// ── User field extractors ────────────────────────────────────────────────────

function getUserName(u)    { return u?.fullName || u?.name || u?.displayName || u?.username || ""; }
function getUserPhone(u)   { return u?.phone || u?.phoneNumber || u?.mobile || ""; }
function getUserEmail(u)   { return u?.email || u?.emailAddress || ""; }
function getUserAddress(u) { return u?.address || ""; }
function getUserCity(u)    { return u?.city || ""; }
function getUserState(u)   { return u?.state || ""; }
function getUserCountry(u) { return u?.country || ""; }
function getUserEcName(u)  { return u?.emergencyContactName || ""; }
function getUserEcNumber(u){ return u?.emergencyContactNumber || ""; }
function getUserRole(u)    {
  return u?.role?.toString().toLowerCase().replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Public User";
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ────────────────────────────────────────────────────────────────────────────

export default function PublicProfileScreen({ navigation }) {
  const {
    currentUser,
    myReports       = [],
    sightingReports = [],
    savedPersons    = [],
    alerts          = [],
    alertUnreadCount = 0,
    setCurrentUser,
    fetchProfile,
    updateProfile,
  } = useSafeReturn();

  const [activeScreen,    setActiveScreen]    = useState("profile");
  const [securityCode,    setSecurityCode]    = useState("");
  const [savedSecurityCode, setSavedSecurityCode] = useState("1234");
  const [showCode,        setShowCode]        = useState(false);

  const userName  = getUserName(currentUser);
  const userPhone = getUserPhone(currentUser);
  const userEmail = getUserEmail(currentUser);
  const userRole  = getUserRole(currentUser);

  const stats = useMemo(() => ({
    reports:  Array.isArray(myReports)       ? myReports.length       : 0,
    sightings:Array.isArray(sightingReports) ? sightingReports.length : 0,
    saved:    Array.isArray(savedPersons)    ? savedPersons.length    : 0,
    alerts:   Number(alertUnreadCount || 0),
  }), [myReports, sightingReports, savedPersons, alertUnreadCount]);

  const profileStats = useMemo(() => [
    { id:"reports", icon:"file-text", number:safeNumber(stats.reports), label:"Reports", color:COLORS.blue, route:ROUTES.REPORTS, type:"route", params: { tab: "My" } },
    { id:"saved",   icon:"heart",     number:safeNumber(stats.saved),   label:"Saved",   color:COLORS.green, route:ROUTES.PUBLIC_SAVED, type:"route" },
    { id:"alerts",  icon:"bell",      number:safeNumber(stats.alerts),  label:"Alerts",  color:COLORS.red, screen:"alerts", type:"internal" },
  ], [stats]);

  const quickActions = useMemo(() => [
    { id:"myReports",  title:"My Reports",       subtitle:`${stats.reports} missing report${stats.reports===1?"":"s"}`,  icon:"clipboard", color:COLORS.blue,   route:ROUTES.REPORTS, type:"route", params: { tab: "My" } },
    { id:"savedCases", title:"Important Cases",  subtitle:`${stats.saved} saved case${stats.saved===1?"":"s"}`,          icon:"heart",     color:COLORS.purple, route:ROUTES.PUBLIC_SAVED, type:"route" },
    { id:"helplines",  title:"Helplines",        subtitle:"Important numbers",                                            icon:"phone",     color:COLORS.green,  route:ROUTES.HELPLINE, type:"route" },
    { id:"safetyTips", title:"Safety Tips",      subtitle:"Stay aware, stay safe",                                        icon:"shield",    color:COLORS.orange, route:ROUTES.SAFETY_TIPS, type:"route" },
  ], [stats]);

  const supportItems = useMemo(() => [
    { id:"notifications",  title:"Notifications",          subtitle:`${stats.alerts} alert${stats.alerts===1?"":"s"} and updates`, icon:"bell",  color:COLORS.blue,   screen:"alerts",   type:"internal" },
    { id:"importantCases", title:"Important Cases Saved",  subtitle:"Cases you marked as important",                               icon:"heart", color:COLORS.pink,   route:ROUTES.PUBLIC_SAVED, type:"route" },
    { id:"emergencyContacts",title:"Emergency Contacts",   subtitle:"Open helpline and emergency numbers",                         icon:"users", color:COLORS.green,  route:ROUTES.HELPLINE, type:"route" },
    { id:"privacy",        title:"Privacy & Security",     subtitle:"Security code and privacy protection",                        icon:"lock",  color:COLORS.purple, screen:"security", type:"internal" },
    { id:"about",          title:"About App",              subtitle:"Learn more about SafeReturn",                                 icon:"info",  color:COLORS.blue,   screen:"about",    type:"internal" },
  ], [stats]);

  const handleLogout = () => {
    if (typeof setCurrentUser === "function") setCurrentUser(null);
    const reset = CommonActions.reset({ index:0, routes:[{ name:LOGIN_ROUTE }] });
    const parent = navigation?.getParent?.();
    if (parent?.dispatch)     { parent.dispatch(reset); return; }
    if (navigation?.dispatch) { navigation.dispatch(reset); return; }
    navigation?.navigate?.(LOGIN_ROUTE);
  };

  const safeNavigate = (itemOrRoute) => {
    const item = typeof itemOrRoute === "string" ? { route: itemOrRoute } : itemOrRoute;
    if (!item) return;
    if (item.type === "internal" && item.screen) { setActiveScreen(item.screen); return; }
    if (!item.route) return;
    navigation?.navigate?.(item.route, item.params);
  };

  const goBack = () => {
    if (activeScreen !== "profile") { setActiveScreen("profile"); return; }
    if (navigation?.canGoBack?.()) { navigation.goBack(); return; }
    navigation?.navigate?.(ROUTES.PUBLIC_HOME);
  };

  const makeSOSCall = async () => {
    try {
      const phoneUrl = "tel:112";
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) await Linking.openURL(phoneUrl);
      else Alert.alert("Call not supported", "Your device does not support phone calls.");
    } catch { Alert.alert("Error", "Unable to call right now."); }
  };

  const saveSecurityCode = () => {
    const code = securityCode.trim();
    if (code.length < 4) { Alert.alert("Invalid Code", "Please enter at least 4 digits."); return; }
    setSavedSecurityCode(code);
    setSecurityCode("");
    Alert.alert("Saved", "Security code updated successfully.");
  };

  // ── Sub-screen routing ────────────────────────────────────────────────────

  if (activeScreen === "edit") {
    return (
      <EditProfileScreen
        goBack={goBack}
        currentUser={currentUser}
        fetchProfile={fetchProfile}
        updateProfile={updateProfile}
        onSaved={(updatedUser) => {
          // context already updated by updateProfile inside SafeReturnContext
          setActiveScreen("profile");
        }}
      />
    );
  }

  if (activeScreen === "security") {
    return (
      <SecurityScreen
        goBack={goBack}
        securityCode={securityCode}
        setSecurityCode={setSecurityCode}
        savedSecurityCode={savedSecurityCode}
        showCode={showCode}
        setShowCode={setShowCode}
        saveSecurityCode={saveSecurityCode}
      />
    );
  }

  if (activeScreen === "about")  return <AboutAppScreen   goBack={goBack} />;
  if (activeScreen === "alerts") return <AlertsScreen     goBack={goBack} alerts={alerts} />;

  // ── Main Profile screen ───────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.container}>

        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={goBack} style={styles.headerIconButton}>
            <Feather name="arrow-left" size={fs(22,24,26)} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveScreen("security")} style={styles.settingsButton}>
            <Feather name="settings" size={fs(19,21,23)} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* ── Profile Card ── */}
          <View style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarEmoji}>👨‍💼</Text>
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.profileName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {userName || "Your Name"}
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Feather name="check" size={fs(11,12,13)} color={COLORS.white} />
                  </View>
                </View>
                <Text style={styles.userRole}>{userRole}</Text>
                {userPhone ? (
                  <View style={styles.infoLine}>
                    <Feather name="phone" size={fs(12,13,14)} color={COLORS.blue} />
                    <Text style={styles.infoText}>{userPhone}</Text>
                  </View>
                ) : null}
                {userEmail ? (
                  <View style={styles.infoLine}>
                    <Feather name="mail" size={fs(12,13,14)} color={COLORS.blue} />
                    <Text style={styles.infoText} numberOfLines={1}>{userEmail}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={() => setActiveScreen("edit")} style={styles.editButton}>
              <Feather name="edit-2" size={fs(12,13,14)} color={COLORS.blue} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              {profileStats.map((item, index) => (
                <TouchableOpacity key={item.id} activeOpacity={0.85} style={styles.statItem} onPress={() => safeNavigate(item)}>
                  <View style={[styles.statIconCircle, { backgroundColor:`${item.color}25` }]}>
                    <Feather name={item.icon} size={fs(18,20,22)} color={item.color} />
                  </View>
                  <View style={styles.statTextBox}>
                    <Text style={styles.statNumber}>{item.number}</Text>
                    <Text style={styles.statLabel}>{item.label}</Text>
                  </View>
                  {index !== profileStats.length - 1 && <View style={styles.statSeparator} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Quick Actions ── */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            {quickActions.map((item) => (
              <TouchableOpacity key={item.id} activeOpacity={0.85} style={styles.quickCard} onPress={() => safeNavigate(item)}>
                <View style={[styles.quickIconCircle, { backgroundColor:item.color }]}>
                  <Feather name={item.icon} size={fs(19,21,23)} color={COLORS.white} />
                </View>
                <View style={styles.quickTextBox}>
                  <Text style={styles.quickTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{item.title}</Text>
                  <Text style={styles.quickSubtitle} numberOfLines={2}>{item.subtitle}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Account & Support ── */}
          <Text style={styles.sectionTitle}>Account & Support</Text>
          <View style={styles.supportCard}>
            {supportItems.map((item, index) => (
              <TouchableOpacity key={item.id} activeOpacity={0.85}
                style={[styles.supportRow, index !== supportItems.length - 1 && styles.supportBorder]}
                onPress={() => safeNavigate(item)}
              >
                <View style={[styles.supportIconCircle, { backgroundColor:item.color }]}>
                  <Feather name={item.icon} size={fs(17,19,21)} color={COLORS.white} />
                </View>
                <View style={styles.supportTextBox}>
                  <Text style={styles.supportTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.supportSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── SOS ── */}
          <View style={styles.sosCard}>
            <View style={styles.sosLeft}>
              <View style={styles.sosIconCircle}>
                <Text style={styles.sosIcon}>SOS</Text>
              </View>
              <View style={styles.sosTextBox}>
                <Text style={styles.sosTitle}>Need urgent help?</Text>
                <Text style={styles.sosSubtitle}>Call emergency helpline now</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.85} style={styles.sosButton} onPress={makeSOSCall}>
              <Feather name="phone" size={fs(16,18,20)} color={COLORS.white} />
              <Text style={styles.sosButtonText}>SOS CALL</Text>
            </TouchableOpacity>
          </View>

          {/* ── Important Cases Banner ── */}
          <TouchableOpacity activeOpacity={0.9} style={styles.importantCaseBanner} onPress={() => safeNavigate({ route:ROUTES.PUBLIC_SAVED })}>
            <View style={styles.importantIcon}>
              <Ionicons name="heart" size={22} color={COLORS.white} />
            </View>
            <View style={styles.importantTextBox}>
              <Text style={styles.importantTitle}>Important Cases Saved</Text>
              <Text style={styles.importantSubtitle}>View {stats.saved} saved missing person case{stats.saved===1?"":"s"}.</Text>
            </View>
            <Feather name="chevron-right" size={22} color={COLORS.white} />
          </TouchableOpacity>

          {/* ── Logout ── */}
          <TouchableOpacity activeOpacity={0.85} style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutIconCircle}>
              <Feather name="log-out" size={fs(18,20,22)} color={COLORS.red} />
            </View>
            <Text style={styles.logoutButtonText}>Logout</Text>
            <Text style={styles.logoutChevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// EDIT PROFILE SCREEN
// ────────────────────────────────────────────────────────────────────────────

function EditProfileScreen({ goBack, currentUser, fetchProfile, updateProfile, onSaved }) {
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  // Form state — initialised from currentUser, then re-synced after fetch
  const [form, setForm] = useState({
    fullName:             getUserName(currentUser),
    email:                getUserEmail(currentUser),
    address:              getUserAddress(currentUser),
    city:                 getUserCity(currentUser),
    state:                getUserState(currentUser),
    country:              getUserCountry(currentUser),
    emergencyContactName:   getUserEcName(currentUser),
    emergencyContactNumber: getUserEcNumber(currentUser),
  });

  // Fetch latest profile from server on mount so form is always fresh
  useEffect(() => {
    let mounted = true;
    setFetching(true);
    fetchProfile()
      .then((data) => {
        if (!mounted) return;
        setForm({
          fullName:             data.fullName             || "",
          email:                data.email                || "",
          address:              data.address              || "",
          city:                 data.city                 || "",
          state:                data.state                || "",
          country:              data.country              || "",
          emergencyContactName:   data.emergencyContactName   || "",
          emergencyContactNumber: data.emergencyContactNumber || "",
        });
      })
      .catch(() => { /* use currentUser values already in form */ })
      .finally(() => { if (mounted) setFetching(false); });
    return () => { mounted = false; };
  }, []);

  const setField = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const name = form.fullName.trim();
    if (!name || name.length < 2) return "Full name must be at least 2 characters.";
    const email = form.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
    const ecNum = form.emergencyContactNumber.trim();
    if (ecNum && !/^[+]?[0-9\s\-]{7,15}$/.test(ecNum)) return "Emergency contact number is not valid.";
    return null;
  };

  const handleSave = async () => {
    if (saving) return;
    setError("");
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    try {
      const payload = {
        fullName:             form.fullName.trim()             || undefined,
        email:                form.email.trim()                || undefined,
        address:              form.address.trim()              || undefined,
        city:                 form.city.trim()                 || undefined,
        state:                form.state.trim()                || undefined,
        country:              form.country.trim()              || undefined,
        emergencyContactName:   form.emergencyContactName.trim()   || undefined,
        emergencyContactNumber: form.emergencyContactNumber.trim() || undefined,
      };

      const updated = await updateProfile(payload);
      Alert.alert("Profile Updated", "Your profile has been saved successfully.", [
        { text: "OK", onPress: () => onSaved(updated) }
      ]);
    } catch (err) {
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const phoneDisplay = getUserPhone(currentUser);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.container}>

        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={goBack} style={styles.headerIconButton}>
            <Feather name="arrow-left" size={fs(22,24,26)} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.settingsButton}>
            <Feather name="edit-2" size={fs(19,21,23)} color={COLORS.white} />
          </View>
        </View>

        {fetching ? (
          <View style={styles.fetchingWrap}>
            <ActivityIndicator size="large" color={COLORS.blue} />
            <Text style={styles.fetchingText}>Loading profile...</Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={{ flex:1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Hero ── */}
              <View style={styles.editHero}>
                <View style={styles.editHeroAvatar}>
                  <Text style={styles.editHeroEmoji}>👨‍💼</Text>
                </View>
                <Text style={styles.editHeroName}>{form.fullName || "Your Name"}</Text>
                <Text style={styles.editHeroRole}>{getUserRole(currentUser)}</Text>
              </View>

              {/* ── Error banner ── */}
              {!!error && (
                <View style={styles.errorBanner}>
                  <Feather name="alert-circle" size={16} color={COLORS.red} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* ── Personal Info ── */}
              <Text style={styles.editSectionTitle}>Personal Information</Text>
              <View style={styles.editCard}>

                <EditField
                  label="Full Name"
                  icon="user"
                  value={form.fullName}
                  onChangeText={setField("fullName")}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                />

                <EditField
                  label="Email Address"
                  icon="mail"
                  value={form.email}
                  onChangeText={setField("email")}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {/* Mobile — read-only */}
                <View style={styles.editFieldWrap}>
                  <Text style={styles.editFieldLabel}>Mobile Number</Text>
                  <View style={[styles.editInputRow, styles.editInputReadOnly]}>
                    <Feather name="phone" size={17} color={COLORS.muted} style={styles.editInputIcon} />
                    <Text style={styles.editReadOnlyText}>
                      {phoneDisplay || "Not available"}
                    </Text>
                    <View style={styles.lockedBadge}>
                      <Feather name="lock" size={11} color={COLORS.muted} />
                      <Text style={styles.lockedBadgeText}>Verified</Text>
                    </View>
                  </View>
                  <Text style={styles.editFieldHint}>Mobile number cannot be changed after OTP verification.</Text>
                </View>
              </View>

              {/* ── Address ── */}
              <Text style={styles.editSectionTitle}>Address</Text>
              <View style={styles.editCard}>
                <EditField
                  label="Address"
                  icon="map-pin"
                  value={form.address}
                  onChangeText={setField("address")}
                  placeholder="Street / area / landmark"
                  multiline
                  numberOfLines={2}
                />
                <EditField
                  label="City"
                  icon="navigation"
                  value={form.city}
                  onChangeText={setField("city")}
                  placeholder="City"
                  autoCapitalize="words"
                />
                <EditField
                  label="State"
                  icon="map"
                  value={form.state}
                  onChangeText={setField("state")}
                  placeholder="State"
                  autoCapitalize="words"
                />
                <EditField
                  label="Country"
                  icon="globe"
                  value={form.country}
                  onChangeText={setField("country")}
                  placeholder="Country"
                  autoCapitalize="words"
                  isLast
                />
              </View>

              {/* ── Emergency Contact ── */}
              <Text style={styles.editSectionTitle}>Emergency Contact</Text>
              <View style={styles.editCard}>
                <EditField
                  label="Contact Name"
                  icon="user-check"
                  value={form.emergencyContactName}
                  onChangeText={setField("emergencyContactName")}
                  placeholder="Emergency contact person's name"
                  autoCapitalize="words"
                />
                <EditField
                  label="Contact Number"
                  icon="phone-call"
                  value={form.emergencyContactNumber}
                  onChangeText={setField("emergencyContactNumber")}
                  placeholder="+91 98765 43210"
                  keyboardType="phone-pad"
                  isLast
                />
              </View>

              {/* ── Save Button ── */}
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.saveProfileButton, saving && styles.saveProfileButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <ActivityIndicator size="small" color={COLORS.white} />
                    <Text style={styles.saveProfileButtonText}>Saving...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                    <Text style={styles.saveProfileButtonText}>Save Profile</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.cancelEditButton}
                onPress={goBack}
                disabled={saving}
              >
                <Text style={styles.cancelEditButtonText}>Cancel</Text>
              </TouchableOpacity>

              <View style={styles.bottomSpace} />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Reusable field component ──────────────────────────────────────────────────

function EditField({
  label, icon, value, onChangeText, placeholder,
  keyboardType = "default", autoCapitalize = "none",
  multiline = false, numberOfLines = 1, isLast = false,
}) {
  return (
    <View style={[styles.editFieldWrap, !isLast && styles.editFieldBorder]}>
      <Text style={styles.editFieldLabel}>{label}</Text>
      <View style={[styles.editInputRow, multiline && styles.editInputRowMulti]}>
        <Feather name={icon} size={17} color={COLORS.blue} style={styles.editInputIcon} />
        <TextInput
          style={[styles.editInput, multiline && styles.editInputMulti]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.muted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          textAlignVertical={multiline ? "top" : "center"}
        />
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SECURITY SCREEN (unchanged from original)
// ────────────────────────────────────────────────────────────────────────────

function SecurityScreen({ goBack, securityCode, setSecurityCode, savedSecurityCode, showCode, setShowCode, saveSecurityCode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={goBack} style={styles.headerIconButton}>
            <Feather name="arrow-left" size={fs(22,24,26)} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy & Security</Text>
          <View style={styles.settingsButton}>
            <Feather name="lock" size={fs(19,21,23)} color={COLORS.white} />
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.securityHero}>
            <View style={styles.securityHeroIcon}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.securityHeroLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.securityHeroTitle}>Security Code</Text>
            <Text style={styles.securityHeroSubtitle}>
              Add a private code to protect important app actions and saved case information.
            </Text>
          </View>
          <View style={styles.securityCard}>
            <View style={styles.securityRowTop}>
              <View style={{ flex:1 }}>
                <Text style={styles.securityLabel}>Current Security Code</Text>
                <Text style={styles.securitySubLabel}>This code is stored only in this screen state.</Text>
              </View>
              <TouchableOpacity activeOpacity={0.85} style={styles.eyeButton} onPress={() => setShowCode((p) => !p)}>
                <Feather name={showCode ? "eye-off" : "eye"} size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.codeDisplayBox}>
              <Text style={styles.codeDisplayText}>
                {showCode ? savedSecurityCode : "•".repeat(savedSecurityCode.length)}
              </Text>
            </View>
            <Text style={styles.inputLabel}>Create New Security Code</Text>
            <View style={styles.securityInputBox}>
              <Feather name="key" size={20} color={COLORS.blue} />
              <TextInput
                style={styles.securityInput}
                placeholder="Enter 4 digit code"
                placeholderTextColor={COLORS.muted}
                value={securityCode}
                onChangeText={(t) => setSecurityCode(t.replace(/[^0-9]/g, "").slice(0,6))}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
              />
            </View>
            <TouchableOpacity activeOpacity={0.9} style={styles.saveCodeButton} onPress={saveSecurityCode}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              <Text style={styles.saveCodeText}>Save Security Code</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.securityTipsCard}>
            <Text style={styles.securityTipsTitle}>Security Tips</Text>
            <SecurityTip icon="shield"  text="Do not share your security code with anyone." />
            <SecurityTip icon="lock"    text="Use a code that is easy for you but hard for others." />
            <SecurityTip icon="eye-off" text="Protect your saved important cases from unwanted access." />
          </View>
          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SecurityTip({ icon, text }) {
  return (
    <View style={styles.securityTipRow}>
      <View style={styles.securityTipIcon}>
        <Feather name={icon} size={16} color={COLORS.green} />
      </View>
      <Text style={styles.securityTipText}>{text}</Text>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ABOUT APP SCREEN (unchanged)
// ────────────────────────────────────────────────────────────────────────────

function AboutAppScreen({ goBack }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={goBack} style={styles.headerIconButton}>
            <Feather name="arrow-left" size={fs(22,24,26)} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About App</Text>
          <View style={styles.settingsButton}>
            <Feather name="info" size={fs(19,21,23)} color={COLORS.white} />
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.aboutHero}>
            <View style={styles.aboutLogo}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.aboutLogoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.aboutTitle}>SafeReturn</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <Text style={styles.aboutDescription}>
              SafeReturn helps the public view missing person alerts, report sightings,
              save important cases, access helplines, and stay aware with safety information.
            </Text>
          </View>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutSectionTitle}>Main Features</Text>
            <AboutFeature icon="search"    title="Missing Persons" text="Browse missing person cases and view complete case details." />
            <AboutFeature icon="heart"     title="Important Cases" text="Save important missing person cases for quick access later." />
            <AboutFeature icon="file-text" title="Reports"         text="Report sightings with image, contact, address, and live location." />
            <AboutFeature icon="phone-call"title="Helplines"       text="Quick access to emergency and public safety numbers." />
            <AboutFeature icon="shield"    title="Safety"          text="Safety tips and awareness support for public users." />
          </View>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutSectionTitle}>Our Purpose</Text>
            <Text style={styles.aboutText}>
              This app is designed to support families, public users, and community volunteers
              by making missing person alerts easier to view, save, and report.
            </Text>
          </View>
          <View style={styles.aboutFooter}>
            <Text style={styles.aboutFooterText}>Built for public safety and community help.</Text>
          </View>
          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function AboutFeature({ icon, title, text }) {
  return (
    <View style={styles.aboutFeatureRow}>
      <View style={styles.aboutFeatureIcon}>
        <Feather name={icon} size={18} color={COLORS.white} />
      </View>
      <View style={styles.aboutFeatureTextBox}>
        <Text style={styles.aboutFeatureTitle}>{title}</Text>
        <Text style={styles.aboutFeatureText}>{text}</Text>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ALERTS SCREEN (unchanged)
// ────────────────────────────────────────────────────────────────────────────

function AlertsScreen({ goBack, alerts = [] }) {
  const list = Array.isArray(alerts) ? alerts : [];
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={goBack} style={styles.headerIconButton}>
            <Feather name="arrow-left" size={fs(22,24,26)} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.settingsButton}>
            <Feather name="bell" size={fs(19,21,23)} color={COLORS.white} />
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.aboutHero}>
            <View style={styles.aboutLogo}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.aboutLogoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.aboutTitle}>SafeReturn Alerts</Text>
            <Text style={styles.aboutDescription}>View your latest important alerts and safety updates here.</Text>
          </View>
          {list.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="inbox" size={38} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>No alerts yet</Text>
              <Text style={styles.emptyText}>New missing person alerts and app updates will appear here.</Text>
            </View>
          ) : (
            list.map((item, index) => (
              <View key={item?.id || index} style={styles.alertCard}>
                <View style={styles.alertIcon}>
                  <Feather name="bell" size={18} color={COLORS.white} />
                </View>
                <View style={styles.alertTextBox}>
                  <Text style={styles.alertTitle}>{item?.title || item?.name || "Important Alert"}</Text>
                  <Text style={styles.alertText}>{item?.message || item?.description || "Please check this update."}</Text>
                </View>
              </View>
            ))
          )}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  safeArea:  { flex:1, backgroundColor:COLORS.bg },
  container: { flex:1, backgroundColor:COLORS.bg },

  header: {
    height: Platform.OS === "ios" ? 60 : 54,
    paddingHorizontal: 13,
    paddingTop: Platform.OS === "android" ? 3 : 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconButton: { width:36, height:36, alignItems:"flex-start", justifyContent:"center" },
  headerTitle: { color:COLORS.white, fontSize:fs(20,22,24), lineHeight:fs(26,28,30), fontWeight:"900" },
  settingsButton: {
    width:fs(36,38,40), height:fs(36,38,40), borderRadius:100,
    backgroundColor:"rgba(38,150,255,0.14)", borderWidth:1,
    borderColor:"rgba(54,207,255,0.22)", alignItems:"center", justifyContent:"center",
  },
  scrollContent: { paddingHorizontal:10, paddingTop:6, paddingBottom:10 },

  // ── Profile Card ──────────────────────────────────────────────────────────
  profileCard: {
    borderRadius:CARD_RADIUS, backgroundColor:COLORS.card, borderWidth:1,
    borderColor:COLORS.border, paddingHorizontal:fs(10,12,14), paddingVertical:fs(12,13,15),
  },
  profileTopRow: { flexDirection:"row", alignItems:"center", paddingRight:fs(54,58,64) },
  avatarWrap: {
    width:fs(64,72,82), height:fs(64,72,82), borderRadius:100,
    backgroundColor:"#8FD3FF", borderWidth:2, borderColor:"rgba(255,255,255,0.24)",
    alignItems:"center", justifyContent:"center", marginRight:fs(9,10,12), overflow:"hidden",
  },
  avatarEmoji: { fontSize:fs(36,42,48) },
  profileInfo: { flex:1, minWidth:0 },
  nameRow: { flexDirection:"row", alignItems:"center", marginBottom:2 },
  profileName: { flexShrink:1, color:COLORS.white, fontSize:fs(18,20,23), lineHeight:fs(23,25,29), fontWeight:"900", marginRight:6 },
  verifiedBadge: { width:fs(18,20,22), height:fs(18,20,22), borderRadius:100, backgroundColor:COLORS.blue, alignItems:"center", justifyContent:"center" },
  userRole: { color:COLORS.blue, fontSize:fs(12,13,15), lineHeight:fs(17,18,20), fontWeight:"700", marginBottom:5 },
  infoLine: { flexDirection:"row", alignItems:"center", marginBottom:3 },
  infoText: { color:COLORS.softWhite, fontSize:fs(10.5,11.5,12.5), lineHeight:fs(15,16,18), marginLeft:6, flex:1 },
  editButton: {
    position:"absolute", right:fs(10,12,14), top:fs(12,13,15),
    minHeight:fs(30,32,34), borderRadius:10, borderWidth:1, borderColor:COLORS.blue,
    paddingHorizontal:fs(8,9,10), flexDirection:"row", alignItems:"center", gap:5,
    backgroundColor:"rgba(2,11,31,0.22)",
  },
  editButtonText: { color:COLORS.blue, fontSize:fs(10.5,11.5,12.5), fontWeight:"800" },
  divider: { height:1, backgroundColor:"rgba(221,232,255,0.14)", marginTop:12, marginBottom:11 },
  statsRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  statItem: { flex:1, flexDirection:"row", alignItems:"center", position:"relative", minWidth:0 },
  statIconCircle: { width:fs(34,38,44), height:fs(34,38,44), borderRadius:100, alignItems:"center", justifyContent:"center", marginRight:fs(6,7,8) },
  statTextBox: { flex:1, minWidth:0 },
  statNumber: { color:COLORS.white, fontSize:fs(17,20,23), lineHeight:fs(22,25,28), fontWeight:"900" },
  statLabel: { color:COLORS.softWhite, fontSize:fs(9.5,10.5,11.5), lineHeight:fs(13,14,15), fontWeight:"500" },
  statSeparator: { position:"absolute", right:6, width:1, height:"70%", backgroundColor:"rgba(221,232,255,0.14)" },

  sectionTitle: { color:COLORS.white, fontSize:fs(18,20,22), lineHeight:fs(24,26,28), fontWeight:"900", marginTop:18, marginBottom:9 },

  // ── Quick Grid ────────────────────────────────────────────────────────────
  quickGrid: { flexDirection:"row", flexWrap:"wrap", justifyContent:"space-between", rowGap:9 },
  quickCard: { width:"48.5%", minHeight:fs(82,90,98), borderRadius:CARD_RADIUS, backgroundColor:COLORS.card2, borderWidth:1, borderColor:COLORS.border, paddingHorizontal:fs(8,9,10), paddingVertical:fs(8,9,10), flexDirection:"row", alignItems:"center" },
  quickIconCircle: { width:fs(34,39,44), height:fs(34,39,44), borderRadius:12, alignItems:"center", justifyContent:"center", marginRight:fs(7,8,9) },
  quickTextBox: { flex:1, minWidth:0 },
  quickTitle: { color:COLORS.white, fontSize:fs(11.5,13,14.5), lineHeight:fs(16,18,20), fontWeight:"900", marginBottom:2 },
  quickSubtitle: { color:COLORS.softWhite, fontSize:fs(9.5,10.5,11.5), lineHeight:fs(14,15,16), fontWeight:"400" },

  // ── Support Card ──────────────────────────────────────────────────────────
  supportCard: { borderRadius:CARD_RADIUS, backgroundColor:COLORS.card2, borderWidth:1, borderColor:COLORS.border, overflow:"hidden" },
  supportRow: { minHeight:fs(58,62,68), paddingHorizontal:fs(9,10,12), paddingVertical:fs(8,9,10), flexDirection:"row", alignItems:"center" },
  supportBorder: { borderBottomWidth:1, borderBottomColor:"rgba(65,136,255,0.22)" },
  supportIconCircle: { width:fs(34,38,42), height:fs(34,38,42), borderRadius:11, alignItems:"center", justifyContent:"center", marginRight:9 },
  supportTextBox: { flex:1, minWidth:0 },
  supportTitle: { color:COLORS.white, fontSize:fs(12,13.5,15), lineHeight:fs(17,19,21), fontWeight:"900", marginBottom:1 },
  supportSubtitle: { color:COLORS.softWhite, fontSize:fs(9.5,10.8,12), lineHeight:fs(14,16,17), fontWeight:"400" },
  chevron: { color:COLORS.softWhite, fontSize:fs(21,24,27), lineHeight:fs(21,24,27), fontWeight:"300", marginLeft:4 },

  // ── SOS ───────────────────────────────────────────────────────────────────
  sosCard: { marginTop:18, borderRadius:CARD_RADIUS, backgroundColor:"rgba(255,48,72,0.20)", borderWidth:1, borderColor:"rgba(255,48,72,0.6)", paddingHorizontal:fs(9,10,12), paddingVertical:fs(10,11,12), flexDirection:isSmallPhone?"column":"row", alignItems:isSmallPhone?"stretch":"center", justifyContent:"space-between", gap:10 },
  sosLeft: { flexDirection:"row", alignItems:"center", flex:1, minWidth:0 },
  sosIconCircle: { width:fs(42,48,54), height:fs(42,48,54), borderRadius:100, backgroundColor:COLORS.red, borderWidth:2, borderColor:"rgba(255,255,255,0.15)", alignItems:"center", justifyContent:"center", marginRight:9 },
  sosIcon: { color:COLORS.white, fontSize:fs(11.5,13,15), fontWeight:"900" },
  sosTextBox: { flex:1, minWidth:0 },
  sosTitle: { color:COLORS.white, fontSize:fs(14,15.5,17), lineHeight:fs(19,21,23), fontWeight:"900", marginBottom:1 },
  sosSubtitle: { color:COLORS.softWhite, fontSize:fs(10.5,11.5,12.5), lineHeight:fs(15,17,18), fontWeight:"400" },
  sosButton: { height:fs(39,42,46), minWidth:isSmallPhone?"100%":fs(108,120,136), borderRadius:11, backgroundColor:COLORS.red, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:7, paddingHorizontal:11 },
  sosButtonText: { color:COLORS.white, fontSize:fs(12,13.5,15), fontWeight:"900" },

  // ── Important Cases Banner ────────────────────────────────────────────────
  importantCaseBanner: { marginTop:18, borderRadius:CARD_RADIUS, backgroundColor:"rgba(139,63,242,0.22)", borderWidth:1, borderColor:"rgba(139,63,242,0.62)", paddingHorizontal:fs(10,12,14), paddingVertical:fs(12,13,14), flexDirection:"row", alignItems:"center" },
  importantIcon: { width:fs(44,48,52), height:fs(44,48,52), borderRadius:100, backgroundColor:COLORS.purple, alignItems:"center", justifyContent:"center", marginRight:10 },
  importantTextBox: { flex:1, minWidth:0 },
  importantTitle: { color:COLORS.white, fontSize:fs(14,15.5,17), lineHeight:fs(19,21,23), fontWeight:"900" },
  importantSubtitle: { color:COLORS.softWhite, fontSize:fs(10.5,11.5,12.5), lineHeight:fs(15,17,18), fontWeight:"500", marginTop:2 },

  // ── Logout ────────────────────────────────────────────────────────────────
  logoutButton: { marginTop:18, borderRadius:CARD_RADIUS, backgroundColor:"rgba(255,48,72,0.10)", borderWidth:1, borderColor:"rgba(255,48,72,0.45)", paddingHorizontal:fs(9,10,12), paddingVertical:fs(13,14,16), flexDirection:"row", alignItems:"center", marginBottom:56 },
  logoutIconCircle: { width:fs(34,38,42), height:fs(34,38,42), borderRadius:11, backgroundColor:"rgba(255,48,72,0.15)", alignItems:"center", justifyContent:"center", marginRight:10 },
  logoutButtonText: { flex:1, color:COLORS.red, fontSize:fs(14,15.5,17), fontWeight:"900" },
  logoutChevron: { color:COLORS.red, fontSize:fs(21,24,27), lineHeight:fs(21,24,27), fontWeight:"300", marginLeft:4 },

  // ── Edit Profile Screen ───────────────────────────────────────────────────
  fetchingWrap: { flex:1, alignItems:"center", justifyContent:"center", gap:14 },
  fetchingText: { color:COLORS.softWhite, fontSize:14, fontWeight:"600" },

  editHero: { borderRadius:CARD_RADIUS, backgroundColor:COLORS.card, borderWidth:1, borderColor:COLORS.border, padding:18, alignItems:"center", marginBottom:4 },
  editHeroAvatar: { width:76, height:76, borderRadius:100, backgroundColor:"#8FD3FF", alignItems:"center", justifyContent:"center", marginBottom:10 },
  editHeroEmoji: { fontSize:42 },
  editHeroName: { color:COLORS.white, fontSize:fs(18,20,22), fontWeight:"900", marginBottom:3 },
  editHeroRole: { color:COLORS.blue, fontSize:13, fontWeight:"700" },

  errorBanner: { flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"rgba(255,48,72,0.14)", borderWidth:1, borderColor:"rgba(255,48,72,0.5)", borderRadius:12, paddingHorizontal:12, paddingVertical:10, marginTop:10 },
  errorText: { flex:1, color:COLORS.red, fontSize:13, lineHeight:18, fontWeight:"600" },

  editSectionTitle: { color:COLORS.white, fontSize:fs(16,17,18), fontWeight:"900", marginTop:16, marginBottom:8 },

  editCard: { borderRadius:CARD_RADIUS, backgroundColor:COLORS.card2, borderWidth:1, borderColor:COLORS.border, overflow:"hidden", paddingHorizontal:12 },

  editFieldWrap: { paddingVertical:11 },
  editFieldBorder: { borderBottomWidth:1, borderBottomColor:"rgba(65,136,255,0.18)" },
  editFieldLabel: { color:COLORS.softWhite, fontSize:fs(10.5,11.5,12.5), fontWeight:"700", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 },
  editFieldHint:  { color:COLORS.muted, fontSize:11, marginTop:5, lineHeight:15 },

  editInputRow: { flexDirection:"row", alignItems:"center", backgroundColor:"rgba(2,11,31,0.35)", borderRadius:11, borderWidth:1, borderColor:"rgba(42,122,255,0.32)", minHeight:44, paddingHorizontal:10 },
  editInputRowMulti: { alignItems:"flex-start", paddingVertical:10 },
  editInputIcon: { marginRight:8 },
  editInput: { flex:1, color:COLORS.white, fontSize:14, fontWeight:"500", paddingVertical:0 },
  editInputMulti: { minHeight:52 },

  editInputReadOnly: { borderColor:"rgba(159,175,208,0.22)", backgroundColor:"rgba(2,11,31,0.20)" },
  editReadOnlyText: { flex:1, color:COLORS.muted, fontSize:14, fontWeight:"500" },
  lockedBadge: { flexDirection:"row", alignItems:"center", gap:4, backgroundColor:"rgba(159,175,208,0.12)", borderRadius:8, paddingHorizontal:8, paddingVertical:4 },
  lockedBadgeText: { color:COLORS.muted, fontSize:11, fontWeight:"700" },

  saveProfileButton: { marginTop:20, height:52, borderRadius:14, backgroundColor:COLORS.blue, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:9 },
  saveProfileButtonDisabled: { backgroundColor:"rgba(38,150,255,0.5)" },
  saveProfileButtonText: { color:COLORS.white, fontSize:16, fontWeight:"900" },

  cancelEditButton: { marginTop:10, height:46, borderRadius:14, borderWidth:1, borderColor:"rgba(221,232,255,0.22)", alignItems:"center", justifyContent:"center" },
  cancelEditButtonText: { color:COLORS.muted, fontSize:15, fontWeight:"700" },

  // ── Security Screen ───────────────────────────────────────────────────────
  securityHero: { borderRadius:CARD_RADIUS, backgroundColor:COLORS.card, borderWidth:1, borderColor:COLORS.border, padding:18, alignItems:"center" },
  securityHeroIcon: { width:84, height:84, borderRadius:28, backgroundColor:"transparent", alignItems:"center", justifyContent:"center", marginBottom:14, overflow:"hidden" },
  securityHeroLogo: { width:"100%", height:"100%" },
  securityHeroTitle: { color:COLORS.white, fontSize:fs(22,24,26), fontWeight:"900", marginBottom:6 },
  securityHeroSubtitle: { color:COLORS.softWhite, fontSize:fs(12,13,14), lineHeight:fs(18,19,20), textAlign:"center" },
  securityCard: { marginTop:16, borderRadius:CARD_RADIUS, backgroundColor:COLORS.card2, borderWidth:1, borderColor:COLORS.border, padding:14 },
  securityRowTop: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  securityLabel: { color:COLORS.white, fontSize:fs(14,15,16), fontWeight:"900" },
  securitySubLabel: { color:COLORS.muted, fontSize:fs(10.5,11.5,12.5), marginTop:3 },
  eyeButton: { width:40, height:40, borderRadius:12, backgroundColor:"rgba(255,255,255,0.09)", alignItems:"center", justifyContent:"center", marginLeft:10 },
  codeDisplayBox: { marginTop:14, marginBottom:16, minHeight:48, borderRadius:13, backgroundColor:"rgba(2,11,31,0.40)", borderWidth:1, borderColor:"rgba(221,232,255,0.18)", alignItems:"center", justifyContent:"center" },
  codeDisplayText: { color:COLORS.white, fontSize:24, fontWeight:"900", letterSpacing:4 },
  inputLabel: { color:COLORS.white, fontSize:fs(13,14,15), fontWeight:"900", marginBottom:8 },
  securityInputBox: { height:50, borderRadius:13, backgroundColor:"rgba(2,11,31,0.38)", borderWidth:1, borderColor:"rgba(42,122,255,0.38)", flexDirection:"row", alignItems:"center", paddingHorizontal:12, gap:10 },
  securityInput: { flex:1, color:COLORS.white, fontSize:16, fontWeight:"700", paddingVertical:0 },
  saveCodeButton: { marginTop:14, height:50, borderRadius:13, backgroundColor:COLORS.blue, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8 },
  saveCodeText: { color:COLORS.white, fontSize:15, fontWeight:"900" },
  securityTipsCard: { marginTop:16, borderRadius:CARD_RADIUS, backgroundColor:COLORS.card2, borderWidth:1, borderColor:COLORS.border, padding:14 },
  securityTipsTitle: { color:COLORS.white, fontSize:fs(16,17,18), fontWeight:"900", marginBottom:10 },
  securityTipRow: { flexDirection:"row", alignItems:"center", marginTop:10 },
  securityTipIcon: { width:32, height:32, borderRadius:10, backgroundColor:"rgba(34,214,107,0.12)", alignItems:"center", justifyContent:"center", marginRight:10 },
  securityTipText: { flex:1, color:COLORS.softWhite, fontSize:fs(11.5,12.5,13.5), lineHeight:fs(17,18,19) },

  // ── About App Screen ──────────────────────────────────────────────────────
  aboutHero: { borderRadius:CARD_RADIUS, backgroundColor:COLORS.card, borderWidth:1, borderColor:COLORS.border, padding:18, alignItems:"center" },
  aboutLogo: { width:86, height:86, borderRadius:30, backgroundColor:"transparent", alignItems:"center", justifyContent:"center", marginBottom:14, overflow:"hidden" },
  aboutLogoImage: { width:"100%", height:"100%" },
  aboutTitle: { color:COLORS.white, fontSize:fs(24,26,28), fontWeight:"900" },
  aboutVersion: { color:COLORS.cyan, fontSize:13, fontWeight:"800", marginTop:4 },
  aboutDescription: { color:COLORS.softWhite, fontSize:fs(12,13,14), lineHeight:fs(18,19,20), textAlign:"center", marginTop:10 },
  aboutCard: { marginTop:16, borderRadius:CARD_RADIUS, backgroundColor:COLORS.card2, borderWidth:1, borderColor:COLORS.border, padding:14 },
  aboutSectionTitle: { color:COLORS.white, fontSize:fs(16,17,18), fontWeight:"900", marginBottom:10 },
  aboutFeatureRow: { flexDirection:"row", alignItems:"flex-start", marginTop:12 },
  aboutFeatureIcon: { width:36, height:36, borderRadius:12, backgroundColor:COLORS.blue, alignItems:"center", justifyContent:"center", marginRight:10 },
  aboutFeatureTextBox: { flex:1 },
  aboutFeatureTitle: { color:COLORS.white, fontSize:fs(13,14,15), fontWeight:"900" },
  aboutFeatureText: { color:COLORS.softWhite, fontSize:fs(11,12,13), lineHeight:fs(16,17,18), marginTop:2 },
  aboutText: { color:COLORS.softWhite, fontSize:fs(12,13,14), lineHeight:fs(18,19,20) },
  aboutFooter: { marginTop:16, alignItems:"center" },
  aboutFooterText: { color:COLORS.muted, fontSize:12, fontWeight:"700" },

  // ── Alerts Screen ─────────────────────────────────────────────────────────
  emptyCard: { marginTop:16, borderRadius:CARD_RADIUS, backgroundColor:COLORS.card2, borderWidth:1, borderColor:COLORS.border, padding:22, alignItems:"center" },
  emptyTitle: { color:COLORS.white, fontSize:17, fontWeight:"900", marginTop:10 },
  emptyText:  { color:COLORS.softWhite, fontSize:12, lineHeight:18, textAlign:"center", marginTop:5 },
  alertCard:  { marginTop:12, borderRadius:CARD_RADIUS, backgroundColor:COLORS.card2, borderWidth:1, borderColor:COLORS.border, padding:12, flexDirection:"row", alignItems:"flex-start" },
  alertIcon:  { width:36, height:36, borderRadius:12, backgroundColor:COLORS.red, alignItems:"center", justifyContent:"center", marginRight:10 },
  alertTextBox: { flex:1 },
  alertTitle: { color:COLORS.white, fontSize:14, fontWeight:"900" },
  alertText:  { color:COLORS.softWhite, fontSize:12, lineHeight:18, marginTop:3 },

  bottomSpace: { height:34 },
});
