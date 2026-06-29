// screens/OtpVerificationScreen.js
// Shown after PublicRegisterScreen Step-1 succeeds.
// Navigation params: { phone, maskedPhone, expiresAtEpochMs, resendsRemaining }

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, ActivityIndicator, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeReturn } from "../Screens/context/SafeReturnContext";

const COLORS = {
  bg: "#061A40", blue: "#2F8CFF", blue2: "#4C9EFF",
  white: "#FFFFFF", muted: "#92B0D8", soft: "#BFD5F7",
  danger: "#FF4B5F", success: "#1EDB8C", button: "#FF4058",
  card: "rgba(255,255,255,0.055)", border: "rgba(91,148,226,0.32)",
};

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

function getSecondsRemaining(expiresAtEpochMs) {
  if (!expiresAtEpochMs) return 0;
  return Math.max(0, Math.floor((Number(expiresAtEpochMs) - Date.now()) / 1000));
}

export default function OtpVerificationScreen({ navigation, route }) {
  const { verifyOtp, resendOtp } = useSafeReturn();
  const {
    phone,
    maskedPhone,
    expiresAtEpochMs,
    resendsRemaining: initialResends,
  } = route.params;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading]   = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [apiError, setApiError]     = useState("");
  const [resendsLeft, setResendsLeft] = useState(initialResends ?? 3);
  const [expiryEpochMs, setExpiryEpochMs] = useState(expiresAtEpochMs);
  const [countdown, setCountdown]   = useState(() => getSecondsRemaining(expiresAtEpochMs));
  const [cooldown, setCooldown]     = useState(0);  // seconds until resend allowed

  const inputRefs = useRef([]);

  // ─── Expiry countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      setCountdown(getSecondsRemaining(expiryEpochMs));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiryEpochMs]);

  // ─── Resend cooldown ───────────────────────────────────────────────────────
  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    const id = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ─── OTP input ─────────────────────────────────────────────────────────────
  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setApiError("");
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ─── Verify ────────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    const code = otp.join("");
    if (countdown <= 0) {
      setApiError("OTP has expired. Please resend a new OTP.");
      return;
    }
    if (code.length < OTP_LENGTH) {
      setApiError("Please enter the complete 6-digit OTP.");
      return;
    }
    setIsLoading(true);
    setApiError("");
    try {
      await verifyOtp(phone, code);
      navigation.reset({ index: 0, routes: [{ name: "PublicHome" }] });
    } catch (err) {
      setApiError(err.message || "OTP verification failed.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Resend ────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0 || resendsLeft <= 0) return;
    setIsResending(true);
    setApiError("");
    try {
      const res = await resendOtp(phone);
      setResendsLeft(res.resendsRemaining);
      if (res.expiresAtEpochMs) {
        setExpiryEpochMs(res.expiresAtEpochMs);
        setCountdown(getSecondsRemaining(res.expiresAtEpochMs));
      }
      startCooldown();
      Alert.alert("OTP Sent", `A new OTP has been sent to ${maskedPhone}.`);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setApiError(err.message || "Failed to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>

          {/* Back */}
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="phone-portrait-outline" size={48} color={COLORS.white} />
          </View>

          <Text style={styles.title}>Verify Mobile</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit OTP sent to{"\n"}
            <Text style={styles.phone}>{maskedPhone}</Text>
          </Text>

          {/* Error */}
          {apiError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          ) : null}

          {/* OTP Boxes */}
          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={ref => { inputRefs.current[i] = ref; }}
                style={[styles.otpBox, digit && styles.otpBoxFilled]}
                value={digit}
                onChangeText={v => handleOtpChange(v, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Expiry countdown */}
          <Text style={[styles.expiry, countdown < 60 && styles.expiryWarning]}>
            {countdown > 0 ? `OTP expires in ${formatTime(countdown)}` : "OTP has expired"}
          </Text>

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.verifyBtn, isLoading && { opacity: 0.75 }]}
            onPress={handleVerify}
            disabled={isLoading || countdown <= 0}
            activeOpacity={0.9}
          >
            {isLoading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.verifyBtnText}>Verify OTP</Text>}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive the OTP? </Text>
            <TouchableOpacity
            onPress={handleResend}
            disabled={cooldown > 0 || resendsLeft <= 0 || isResending}
          >
              {isResending
                ? <ActivityIndicator size="small" color={COLORS.blue2} />
                : (
                  <Text style={[
                    styles.resendLink,
                    (cooldown > 0 || resendsLeft <= 0) && styles.resendDisabled,
                  ]}>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : resendsLeft > 0 ? "Resend OTP" : "No resends left"}
                  </Text>
                )}
            </TouchableOpacity>
          </View>

          {resendsLeft > 0 && (
            <Text style={styles.resendsLeft}>{resendsLeft} resend(s) remaining</Text>
          )}

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  safe: { flex: 1 },
  container: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: Platform.OS === "ios" ? 12 : 24 },
  back: { alignSelf: "flex-start", width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: COLORS.blue, backgroundColor: "rgba(47,140,255,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { color: COLORS.white, fontSize: 28, fontWeight: "900", marginBottom: 10 },
  subtitle: { color: COLORS.soft, fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  phone: { color: COLORS.blue2, fontWeight: "900" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,75,95,0.45)", backgroundColor: "rgba(255,75,95,0.12)", padding: 12, width: "100%", marginBottom: 16 },
  errorText: { flex: 1, color: COLORS.white, fontSize: 13, fontWeight: "700" },
  otpRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  otpBox: { width: 46, height: 56, borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(100,154,226,0.36)", backgroundColor: "rgba(5,25,65,0.62)", color: COLORS.white, fontSize: 22, fontWeight: "900", textAlign: "center" },
  otpBoxFilled: { borderColor: COLORS.blue, backgroundColor: "rgba(47,140,255,0.12)" },
  expiry: { color: COLORS.muted, fontSize: 13, fontWeight: "700", marginBottom: 24 },
  expiryWarning: { color: COLORS.danger },
  verifyBtn: { width: "100%", height: 56, borderRadius: 17, backgroundColor: COLORS.button, alignItems: "center", justifyContent: "center", marginBottom: 20, shadowColor: COLORS.button, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 9 },
  verifyBtnText: { color: COLORS.white, fontSize: 17, fontWeight: "900" },
  resendRow: { flexDirection: "row", alignItems: "center" },
  resendLabel: { color: COLORS.muted, fontSize: 13, fontWeight: "600" },
  resendLink: { color: COLORS.blue2, fontSize: 13, fontWeight: "900" },
  resendDisabled: { color: COLORS.muted },
  resendsLeft: { color: COLORS.muted, fontSize: 12, marginTop: 6 },
});
