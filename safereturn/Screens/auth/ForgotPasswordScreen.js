// Screens/auth/ForgotPasswordScreen.js
//
// 3-step forgot-password flow rendered in a single screen with animated
// step transitions. Design matches LoginScreen / OtpVerificationScreen exactly.
//
// Step 1 — Enter registered mobile number → send OTP
// Step 2 — Enter 6-digit OTP              → receive reset token
// Step 3 — Enter new password             → reset + navigate to LoginScreen

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
  Image,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeReturn } from "../context/SafeReturnContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const { width } = Dimensions.get("window");
const isSmall     = width < 380;
const isVerySmall = width < 350;

const COLORS = {
  bg:           "#061A40",
  card:         "rgba(255,255,255,0.055)",
  border:       "rgba(91,148,226,0.34)",
  inputBg:      "rgba(5,25,65,0.38)",
  inputBorder:  "rgba(100,154,226,0.4)",
  white:        "#FFFFFF",
  muted:        "#B4C7E9",
  placeholder:  "#6B8CB8",
  gold:         "#F1C15A",
  blue:         "#2F8CFF",
  blueDark:     "#1460EE",
  blue2:        "#4C9EFF",
  danger:       "#FF4058",
  success:      "#22C55E",
  soft:         "#BFD5F7",
};

const OTP_LENGTH            = 6;
const RESEND_COOLDOWN_SECS  = 30;

// ─── Password validation (mirrors backend regex) ──────────────────────────────

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
const PHONE_REGEX    = /^[1-9][0-9]{9}$/;

function getSecondsRemaining(epochMs) {
  if (!epochMs) return 0;
  return Math.max(0, Math.floor((Number(epochMs) - Date.now()) / 1000));
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen({ navigation }) {
  const {
    forgotPasswordInitiate,
    forgotPasswordVerifyOtp,
    forgotPasswordReset,
    forgotPasswordResendOtp,
  } = useSafeReturn();

  // ── Step state (1 | 2 | 3) ──────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Step 1 state ─────────────────────────────────────────────────────────────
  const [phone,      setPhone]      = useState("");
  const [step1Error, setStep1Error] = useState("");
  const [loading1,   setLoading1]   = useState(false);

  // ── Step 2 state ─────────────────────────────────────────────────────────────
  const [otp,            setOtp]            = useState(["", "", "", "", "", ""]);
  const [maskedPhone,    setMaskedPhone]    = useState("");
  const [expiryEpochMs,  setExpiryEpochMs]  = useState(null);
  const [countdown,      setCountdown]      = useState(0);
  const [cooldown,       setCooldown]       = useState(0);
  const [resendsLeft,    setResendsLeft]    = useState(3);
  const [step2Error,     setStep2Error]     = useState("");
  const [loading2,       setLoading2]       = useState(false);
  const [isResending,    setIsResending]    = useState(false);
  const inputRefs = useRef([]);

  // ── Step 3 state ─────────────────────────────────────────────────────────────
  const [resetToken,       setResetToken]       = useState("");
  const [newPassword,      setNewPassword]      = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showNew,          setShowNew]          = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [step3Error,       setStep3Error]       = useState("");
  const [loading3,         setLoading3]         = useState(false);
  const [successMsg,       setSuccessMsg]       = useState("");

  // ── Fade animation between steps ─────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const transitionToStep = useCallback((nextStep) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  // ── OTP expiry countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2) return;
    const tick = () => setCountdown(getSecondsRemaining(expiryEpochMs));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [step, expiryEpochMs]);

  // ── Resend cooldown ───────────────────────────────────────────────────────────
  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN_SECS);
    const id = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1 — Submit phone number
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSendOtp = async () => {
    const trimmed = phone.trim();

    if (!trimmed) {
      setStep1Error("Please enter your registered mobile number.");
      return;
    }
    if (!PHONE_REGEX.test(trimmed)) {
      setStep1Error("Enter a valid 10-digit mobile number (cannot start with 0).");
      return;
    }

    setLoading1(true);
    setStep1Error("");
    try {
      const res = await forgotPasswordInitiate(trimmed);
      setMaskedPhone(res.maskedPhone);
      setExpiryEpochMs(res.expiresAtEpochMs);
      setResendsLeft(res.resendsRemaining ?? 3);
      setCountdown(getSecondsRemaining(res.expiresAtEpochMs));
      setOtp(["", "", "", "", "", ""]);
      transitionToStep(2);
    } catch (err) {
      setStep1Error(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading1(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2 — OTP box handlers
  // ─────────────────────────────────────────────────────────────────────────────

  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setStep2Error("");
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (countdown <= 0) {
      setStep2Error("OTP has expired. Please resend a new OTP.");
      return;
    }
    if (code.length < OTP_LENGTH) {
      setStep2Error("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading2(true);
    setStep2Error("");
    try {
      const res = await forgotPasswordVerifyOtp(phone.trim(), code);
      setResetToken(res.resetToken);
      transitionToStep(3);
    } catch (err) {
      setStep2Error(err.message || "OTP verification failed.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading2(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendsLeft <= 0) return;
    setIsResending(true);
    setStep2Error("");
    try {
      const res = await forgotPasswordResendOtp(phone.trim());
      setResendsLeft(res.resendsRemaining ?? 0);
      if (res.expiresAtEpochMs) {
        setExpiryEpochMs(res.expiresAtEpochMs);
        setCountdown(getSecondsRemaining(res.expiresAtEpochMs));
      }
      startCooldown();
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setStep2Error(err.message || "Failed to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3 — Reset password
  // ─────────────────────────────────────────────────────────────────────────────

  const handleResetPassword = async () => {
    if (!newPassword) {
      setStep3Error("Please enter a new password.");
      return;
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      setStep3Error(
        "Password must be 8–64 characters and include uppercase, lowercase, a digit, and a special character."
      );
      return;
    }
    if (!confirmPassword) {
      setStep3Error("Please confirm your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStep3Error("Passwords do not match.");
      return;
    }

    setLoading3(true);
    setStep3Error("");
    setSuccessMsg("");
    try {
      await forgotPasswordReset(
        phone.trim(),
        resetToken,
        newPassword,
        confirmPassword
      );
      setSuccessMsg("Password reset successfully! Redirecting to login…");
      setTimeout(() => {
        navigation?.reset?.({
          index: 0,
          routes: [{ name: "LoginScreen" }],
        });
      }, 1800);
    } catch (err) {
      setStep3Error(err.message || "Password reset failed. Please try again.");
    } finally {
      setLoading3(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // BACK button logic per step
  // ─────────────────────────────────────────────────────────────────────────────

  const handleBack = () => {
    if (step === 1) {
      if (navigation?.canGoBack?.()) {
        navigation.goBack();
      } else {
        navigation?.replace?.("LoginScreen");
      }
    } else if (step === 2) {
      transitionToStep(1);
    } else {
      // Step 3 — going back from reset form would let someone reuse
      // the reset token, which is acceptable since it's still valid.
      transitionToStep(2);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP INDICATORS
  // ─────────────────────────────────────────────────────────────────────────────

  const StepIndicator = () => (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
            {step > s ? (
              <Ionicons name="checkmark" size={12} color={COLORS.white} />
            ) : (
              <Text style={[styles.stepDotText, step === s && styles.stepDotTextActive]}>
                {s}
              </Text>
            )}
          </View>
          {s < 3 && (
            <View style={[styles.stepLine, step > s && styles.stepLineActive]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.8}
              onPress={handleBack}
            >
              <Ionicons name="chevron-back" size={27} color={COLORS.white} />
            </TouchableOpacity>

            {/* Top Icon */}
            <View style={styles.topIconCircle}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.topLogo}
                resizeMode="contain"
              />
              <View style={styles.shieldBadge}>
                <Ionicons
                  name="checkmark"
                  size={15}
                  color={COLORS.white}
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {step === 1
                ? "Forgot Password"
                : step === 2
                ? "Verify Mobile"
                : "Reset Password"}
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              {step === 1
                ? "Enter your registered mobile number to receive a verification OTP."
                : step === 2
                ? `Enter the 6-digit OTP sent to\n${maskedPhone}`
                : "Create a strong new password for your account."}
            </Text>

            {/* Step Indicators */}
            <StepIndicator />

            {/* ── Animated card ────────────────────────────────────────────── */}
            <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>

              {/* ── STEP 1 ─────────────────────────────────────────────────── */}
              {step === 1 && (
                <>
                  <MessageBox message={step1Error} type="error" />

                  <InputBox
                    label="Registered Mobile Number"
                    icon="phone"
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    keyboardType="phone-pad"
                    onChangeText={(v) => {
                      setPhone(v.replace(/\D/g, "").slice(0, 10));
                      setStep1Error("");
                    }}
                    maxLength={10}
                  />

                  <Text style={styles.hintText}>
                    We'll send a one-time password to this number.
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[styles.primaryButton, loading1 && styles.buttonDisabled]}
                    onPress={handleSendOtp}
                    disabled={loading1}
                  >
                    {loading1 ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="send-outline" size={21} color={COLORS.white} />
                        <Text style={styles.primaryButtonText}>Send OTP</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.secondaryButton}
                    onPress={() => navigation?.navigate?.("LoginScreen")}
                  >
                    <Feather name="arrow-left" size={20} color={COLORS.blue} />
                    <Text style={styles.secondaryButtonText}>Back to Login</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ── STEP 2 ─────────────────────────────────────────────────── */}
              {step === 2 && (
                <>
                  <MessageBox message={step2Error} type="error" />

                  {/* OTP Boxes */}
                  <View style={styles.otpRow}>
                    {otp.map((digit, i) => (
                      <TextInput
                        key={i}
                        ref={(ref) => { inputRefs.current[i] = ref; }}
                        style={[styles.otpBox, digit && styles.otpBoxFilled]}
                        value={digit}
                        onChangeText={(v) => handleOtpChange(v, i)}
                        onKeyPress={(e) => handleKeyPress(e, i)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  {/* Expiry countdown */}
                  <Text
                    style={[
                      styles.expiryText,
                      countdown < 60 && styles.expiryWarning,
                    ]}
                  >
                    {countdown > 0
                      ? `OTP expires in ${formatTime(countdown)}`
                      : "OTP has expired"}
                  </Text>

                  {/* Verify button */}
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[
                      styles.primaryButton,
                      (loading2 || countdown <= 0) && styles.buttonDisabled,
                    ]}
                    onPress={handleVerifyOtp}
                    disabled={loading2 || countdown <= 0}
                  >
                    {loading2 ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={21} color={COLORS.white} />
                        <Text style={styles.primaryButtonText}>Verify OTP</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Resend row */}
                  <View style={styles.resendRow}>
                    <Text style={styles.resendLabel}>Didn't receive the OTP?  </Text>
                    <TouchableOpacity
                      onPress={handleResend}
                      disabled={cooldown > 0 || resendsLeft <= 0 || isResending}
                    >
                      {isResending ? (
                        <ActivityIndicator size="small" color={COLORS.blue2} />
                      ) : (
                        <Text
                          style={[
                            styles.resendLink,
                            (cooldown > 0 || resendsLeft <= 0) && styles.resendDisabled,
                          ]}
                        >
                          {cooldown > 0
                            ? `Resend in ${cooldown}s`
                            : resendsLeft > 0
                            ? "Resend OTP"
                            : "No resends left"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {resendsLeft > 0 && (
                    <Text style={styles.resendsLeftText}>
                      {resendsLeft} resend(s) remaining
                    </Text>
                  )}
                </>
              )}

              {/* ── STEP 3 ─────────────────────────────────────────────────── */}
              {step === 3 && (
                <>
                  <MessageBox message={step3Error} type="error" />
                  <MessageBox message={successMsg} type="success" />

                  <InputBox
                    label="New Password"
                    icon="lock"
                    placeholder="Enter new password"
                    value={newPassword}
                    secureTextEntry={!showNew}
                    onChangeText={(v) => {
                      setNewPassword(v);
                      setStep3Error("");
                    }}
                    rightIcon={showNew ? "eye-off" : "eye"}
                    onRightPress={() => setShowNew(!showNew)}
                  />

                  <InputBox
                    label="Confirm New Password"
                    icon="lock"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    secureTextEntry={!showConfirm}
                    onChangeText={(v) => {
                      setConfirmPassword(v);
                      setStep3Error("");
                    }}
                    rightIcon={showConfirm ? "eye-off" : "eye"}
                    onRightPress={() => setShowConfirm(!showConfirm)}
                  />

                  {/* Password requirements hint */}
                  <View style={styles.requirementsBox}>
                    <Text style={styles.requirementsTitle}>Password requirements:</Text>
                    {[
                      "8–64 characters",
                      "At least 1 uppercase letter (A–Z)",
                      "At least 1 lowercase letter (a–z)",
                      "At least 1 digit (0–9)",
                      "At least 1 special character (!@#$ etc.)",
                    ].map((req) => (
                      <Text key={req} style={styles.requirementItem}>
                        {"  ·  "}{req}
                      </Text>
                    ))}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[
                      styles.primaryButton,
                      (loading3 || !!successMsg) && styles.buttonDisabled,
                    ]}
                    onPress={handleResetPassword}
                    disabled={loading3 || !!successMsg}
                  >
                    {loading3 ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={21} color={COLORS.white} />
                        <Text style={styles.primaryButtonText}>Reset Password</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}

            </Animated.View>
            {/* ── End card ────────────────────────────────────────────────── */}

            {/* Bottom login link */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.bottomLink}
              onPress={() =>
                navigation?.reset?.({
                  index: 0,
                  routes: [{ name: "LoginScreen" }],
                })
              }
            >
              <Text style={styles.bottomText}>
                Remembered your password?{" "}
                <Text style={styles.bottomLinkText}>Login</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function MessageBox({ message, type }) {
  if (!message) return null;
  const isError   = type === "error";
  const isSuccess = type === "success";
  return (
    <View
      style={[
        styles.messageBox,
        isError   && styles.messageBoxError,
        isSuccess && styles.messageBoxSuccess,
      ]}
    >
      <Ionicons
        name={isSuccess ? "checkmark-circle-outline" : "information-circle-outline"}
        size={18}
        color={isSuccess ? COLORS.success : COLORS.danger}
      />
      <Text style={styles.messageText}>{message}</Text>
    </View>
  );
}

function InputBox({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  secureTextEntry,
  rightIcon,
  onRightPress,
  maxLength,
}) {
  return (
    <View style={styles.inputBlock}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Feather
          name={icon}
          size={22}
          color={COLORS.blue}
          style={styles.leftIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || "default"}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          cursorColor={COLORS.blue}
          selectionColor={COLORS.blue}
          maxLength={maxLength}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} activeOpacity={0.7}>
            <Feather name={rightIcon} size={23} color="#9BB5DD" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  safeArea: { flex: 1 },

  scrollContent: {
    paddingHorizontal: isVerySmall ? 14 : 18,
    paddingTop:        Platform.OS === "ios" ? 10 : 20,
    paddingBottom:     42,
  },

  // ── Back button (matches LoginScreen exactly) ──────────────────────────────
  backButton: {
    width:           isVerySmall ? 46 : 52,
    height:          isVerySmall ? 46 : 52,
    borderRadius:    26,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth:     1,
    borderColor:     "rgba(84,145,230,0.3)",
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    10,
  },

  // ── Top icon circle (matches LoginScreen exactly) ──────────────────────────
  topIconCircle: {
    alignSelf:       "center",
    width:           isSmall ? 116 : 136,
    height:          isSmall ? 116 : 136,
    borderRadius:    80,
    borderWidth:     2.6,
    borderColor:     COLORS.gold,
    alignItems:      "center",
    justifyContent:  "center",
    backgroundColor: "rgba(47,140,255,0.08)",
    shadowColor:     COLORS.gold,
    shadowOpacity:   0.35,
    shadowRadius:    16,
    shadowOffset:    { width: 0, height: 0 },
    elevation:       8,
    marginBottom:    24,
  },

  topLogo: {
    width: "86%",
    height: "86%",
  },

  shieldBadge: {
    position:        "absolute",
    bottom:          18,
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: COLORS.gold,
    borderWidth:     3,
    borderColor:     COLORS.white,
    alignItems:      "center",
    justifyContent:  "center",
  },

  title: {
    color:      COLORS.white,
    fontSize:   isVerySmall ? 27 : isSmall ? 30 : 36,
    fontWeight: "900",
    textAlign:  "center",
    marginBottom: 12,
  },

  subtitle: {
    color:           COLORS.muted,
    fontSize:        isVerySmall ? 13 : isSmall ? 15 : 17,
    lineHeight:      isVerySmall ? 20 : isSmall ? 23 : 26,
    textAlign:       "center",
    paddingHorizontal: 12,
    marginBottom:    20,
  },

  // ── Step indicator ─────────────────────────────────────────────────────────
  stepRow: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    marginBottom:   24,
  },

  stepDot: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: "rgba(47,140,255,0.1)",
    borderWidth:     1.5,
    borderColor:     "rgba(100,154,226,0.4)",
    alignItems:      "center",
    justifyContent:  "center",
  },

  stepDotActive: {
    backgroundColor: COLORS.blue,
    borderColor:     COLORS.blue,
  },

  stepDotText: {
    color:      COLORS.muted,
    fontSize:   13,
    fontWeight: "700",
  },

  stepDotTextActive: {
    color: COLORS.white,
  },

  stepLine: {
    width:           36,
    height:          2,
    backgroundColor: "rgba(100,154,226,0.25)",
    marginHorizontal: 4,
  },

  stepLineActive: {
    backgroundColor: COLORS.blue,
  },

  // ── Form card (matches LoginScreen exactly) ────────────────────────────────
  formCard: {
    backgroundColor:  COLORS.card,
    borderWidth:      1.2,
    borderColor:      COLORS.border,
    borderRadius:     25,
    paddingHorizontal: isSmall ? 16 : 20,
    paddingTop:       22,
    paddingBottom:    28,
  },

  // ── Message box ────────────────────────────────────────────────────────────
  messageBox: {
    borderRadius:    12,
    borderWidth:     1,
    padding:         10,
    flexDirection:   "row",
    alignItems:      "center",
    marginBottom:    16,
  },

  messageBoxError: {
    borderColor:     "rgba(255,64,88,0.45)",
    backgroundColor: "rgba(255,64,88,0.12)",
  },

  messageBoxSuccess: {
    borderColor:     "rgba(34,197,94,0.45)",
    backgroundColor: "rgba(34,197,94,0.12)",
  },

  messageText: {
    flex:       1,
    color:      COLORS.white,
    fontSize:   isVerySmall ? 11 : 12,
    fontWeight: "700",
    lineHeight: 17,
    marginLeft: 7,
  },

  // ── Input block (matches LoginScreen exactly) ──────────────────────────────
  inputBlock: { marginBottom: 20 },

  inputLabel: {
    color:        COLORS.white,
    fontSize:     isVerySmall ? 14 : isSmall ? 16 : 18,
    fontWeight:   "900",
    marginBottom: 10,
  },

  inputWrapper: {
    height:          isVerySmall ? 52 : isSmall ? 58 : 66,
    borderRadius:    15,
    borderWidth:     1.5,
    borderColor:     COLORS.inputBorder,
    backgroundColor: COLORS.inputBg,
    flexDirection:   "row",
    alignItems:      "center",
    paddingHorizontal: isVerySmall ? 12 : 16,
  },

  leftIcon: { marginRight: isVerySmall ? 10 : 16 },

  input: {
    flex:       1,
    color:      COLORS.white,
    fontSize:   isVerySmall ? 13 : isSmall ? 15 : 17,
    fontWeight: "500",
    paddingVertical: 0,
  },

  hintText: {
    color:        COLORS.muted,
    fontSize:     isVerySmall ? 12 : 14,
    lineHeight:   20,
    marginTop:    -8,
    marginBottom: 20,
  },

  // ── Primary button (matches LoginScreen exactly) ───────────────────────────
  primaryButton: {
    height:          isVerySmall ? 52 : isSmall ? 58 : 66,
    borderRadius:    16,
    backgroundColor: COLORS.blue,
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    16,
    flexDirection:   "row",
    gap:             8,
    shadowColor:     "#1E6FFF",
    shadowOpacity:   0.5,
    shadowRadius:    12,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       8,
  },

  buttonDisabled: { opacity: 0.65 },

  primaryButtonText: {
    color:      COLORS.white,
    fontSize:   isVerySmall ? 13 : isSmall ? 15 : 18,
    fontWeight: "900",
  },

  // ── Secondary button ───────────────────────────────────────────────────────
  secondaryButton: {
    height:          isVerySmall ? 52 : isSmall ? 58 : 66,
    borderRadius:    15,
    borderWidth:     1.5,
    borderColor:     COLORS.blue,
    backgroundColor: "rgba(47,140,255,0.05)",
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "center",
    gap:             10,
  },

  secondaryButtonText: {
    color:      COLORS.blue,
    fontSize:   isVerySmall ? 14 : isSmall ? 16 : 18,
    fontWeight: "900",
  },

  // ── OTP boxes (matches OtpVerificationScreen exactly) ─────────────────────
  otpRow: {
    flexDirection:  "row",
    gap:            10,
    marginBottom:   16,
    justifyContent: "center",
  },

  otpBox: {
    width:           isVerySmall ? 40 : 46,
    height:          isVerySmall ? 50 : 56,
    borderRadius:    14,
    borderWidth:     1.5,
    borderColor:     "rgba(100,154,226,0.36)",
    backgroundColor: "rgba(5,25,65,0.62)",
    color:           COLORS.white,
    fontSize:        22,
    fontWeight:      "900",
    textAlign:       "center",
  },

  otpBoxFilled: {
    borderColor:     COLORS.blue,
    backgroundColor: "rgba(47,140,255,0.12)",
  },

  expiryText: {
    color:        COLORS.muted,
    fontSize:     13,
    fontWeight:   "700",
    marginBottom: 20,
    textAlign:    "center",
  },

  expiryWarning: { color: COLORS.danger },

  // ── Resend row ─────────────────────────────────────────────────────────────
  resendRow: {
    flexDirection: "row",
    alignItems:    "center",
    justifyContent: "center",
    marginTop:     4,
  },

  resendLabel:   { color: COLORS.muted, fontSize: 13, fontWeight: "600" },
  resendLink:    { color: COLORS.blue2, fontSize: 13, fontWeight: "900" },
  resendDisabled:{ color: COLORS.muted },
  resendsLeftText: {
    color:     COLORS.muted,
    fontSize:  12,
    marginTop: 6,
    textAlign: "center",
  },

  // ── Password requirements box ──────────────────────────────────────────────
  requirementsBox: {
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     "rgba(91,148,226,0.25)",
    backgroundColor: "rgba(47,140,255,0.05)",
    padding:         14,
    marginBottom:    22,
    marginTop:       -4,
  },

  requirementsTitle: {
    color:        COLORS.soft,
    fontSize:     13,
    fontWeight:   "800",
    marginBottom: 6,
  },

  requirementItem: {
    color:      COLORS.muted,
    fontSize:   12,
    lineHeight: 20,
  },

  // ── Bottom login link ──────────────────────────────────────────────────────
  bottomLink: {
    marginTop:  28,
    alignItems: "center",
  },

  bottomText: {
    color:      COLORS.muted,
    fontSize:   isVerySmall ? 13 : isSmall ? 15 : 17,
    fontWeight: "500",
    textAlign:  "center",
  },

  bottomLinkText: {
    color:      COLORS.blue,
    fontWeight: "900",
  },
});
