// PublicRegisterScreen.js

import React, { useMemo, useState } from "react";
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
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeReturn } from "../context/SafeReturnContext";

const { width, height } = Dimensions.get("window");

const isSmall = width < 380;
const isTiny = height < 700;

const COLORS = {
  bg: "#061A40",
  bg2: "#03102B",
  card: "rgba(255,255,255,0.055)",
  cardStrong: "rgba(5,25,65,0.62)",
  border: "rgba(91,148,226,0.32)",
  blue: "#2F8CFF",
  blue2: "#4C9EFF",
  gold: "#F1C15A",
  white: "#FFFFFF",
  muted: "#92B0D8",
  soft: "#BFD5F7",
  danger: "#FF4B5F",
  success: "#1EDB8C",
  button: "#FF4058",
};

export default function PublicRegisterScreen({ navigation }) {
  const { initiateRegistration } = useSafeReturn();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setApiError("");
  };

  const passwordChecks = useMemo(() => {
    const password = form.password;
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    };
  }, [form.password]);

  const isPasswordStrong =
    passwordChecks.length &&
    passwordChecks.upper &&
    passwordChecks.number &&
    passwordChecks.symbol;

  const isValidEmail = (email) => {
    if (!email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const isValidPhone = (phone) => {
    return /^[0-9]{10}$/.test(phone.trim());
  };

  const validateForm = () => {
    if (!form.fullName.trim()) {
      Alert.alert("Missing Name 👤", "Please enter your full name.");
      return false;
    }

    if (!form.phone.trim()) {
      Alert.alert("Missing Mobile Number 📱", "Please enter your mobile number.");
      return false;
    }

    if (!isValidPhone(form.phone)) {
      Alert.alert(
        "Invalid Mobile Number 📱",
        "Please enter a valid 10-digit mobile number."
      );
      return false;
    }

    if (!form.email.trim()) {
      Alert.alert("Missing Email 📧", "Please enter your email address.");
      return false;
    }

    if (!isValidEmail(form.email)) {
      Alert.alert("Invalid Email 📧", "Please enter a valid email address.");
      return false;
    }

    if (!form.password.trim()) {
      Alert.alert("Missing Password 🔒", "Please create a password.");
      return false;
    }

    if (!isPasswordStrong) {
      Alert.alert(
        "Weak Password 🔐",
        "Password must contain 8+ characters, 1 uppercase letter, 1 number, and 1 symbol."
      );
      return false;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert(
        "Password Mismatch ⚠️",
        "Password and confirm password do not match."
      );
      return false;
    }

    if (!accepted) {
      Alert.alert(
        "Terms Required ✅",
        "Please accept the Terms of Service and Privacy Policy."
      );
      return false;
    }

    return true;
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation.replace("LoginScreen");
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError("");

    try {
      const result = await initiateRegistration(
        form.fullName.trim(),
        form.phone.trim(),
        form.email.trim(),
        form.password,
        form.confirmPassword,
      );

      // Navigate to OTP verification screen, passing the session metadata
      navigation.navigate("OtpVerificationScreen", {
        phone: form.phone.trim(),
        maskedPhone: result.maskedPhone,
        expiresAtEpochMs: result.expiresAtEpochMs,
        resendsRemaining: result.resendsRemaining,
      });

    } catch (err) {
      setApiError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
            {/* Header */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.8}
                onPress={handleBack}
              >
                <Ionicons name="chevron-back" size={24} color={COLORS.white} />
              </TouchableOpacity>

              <View style={styles.brandBox}>
                <View style={styles.logoBox}>
                  <Image
                    source={require("../../assets/images/logo.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>

                <View>
                  <Text style={styles.brandTitle}>
                    Safe<Text style={styles.brandBlue}>Return</Text>
                  </Text>
                  <Text style={styles.brandSub}>Family Safety Network</Text>
                </View>
              </View>
            </View>

            {/* Hero */}
            <View style={styles.hero}>
              <View style={styles.heroTextBox}>
                <Text style={styles.kicker}>👋 Welcome</Text>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>
                  Public users can register here and help keep families,
                  children, and communities safe. Police accounts are
                  provisioned separately by administrators.
                </Text>
              </View>

              <View style={styles.heroIconCircle}>
                <Ionicons
                  name="people-outline"
                  size={isSmall ? 44 : 52}
                  color={COLORS.white}
                />
                <View style={styles.shieldBadge}>
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                </View>
              </View>
            </View>

            {/* Info Chips */}
            <View style={styles.chipRow}>
              <InfoChip emoji="🚨" text="Report" />
              <InfoChip emoji="📍" text="Sightings" />
              <InfoChip emoji="🤝" text="Support" />
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Public Registration 📝</Text>
                <Text style={styles.cardSub}>
                  Public users can register here. Police accounts are provisioned separately by administrators.
                </Text>
              </View>

              {/* API Error Box */}
              {apiError ? (
                <View style={styles.errorBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={COLORS.danger}
                  />
                  <Text style={styles.errorText}>{apiError}</Text>
                </View>
              ) : null}

              <InputBox
                label="Full Name"
                icon="user"
                placeholder="Enter your full name"
                value={form.fullName}
                onChangeText={(v) => updateField("fullName", v)}
                autoCapitalize="words"
              />

              <InputBox
                label="Mobile Number"
                icon="phone"
                placeholder="Enter 10-digit mobile number"
                value={form.phone}
                keyboardType="phone-pad"
                maxLength={10}
                onChangeText={(v) =>
                  updateField("phone", v.replace(/[^0-9]/g, ""))
                }
              />

              <InputBox
                label="Email Address"
                icon="mail"
                placeholder="Enter your email address"
                value={form.email}
                keyboardType="email-address"
                onChangeText={(v) => updateField("email", v)}
                autoCapitalize="none"
              />

              <InputBox
                label="Password"
                icon="lock"
                placeholder="Create a password"
                value={form.password}
                secureTextEntry={!showPassword}
                onChangeText={(v) => updateField("password", v)}
                rightIcon={showPassword ? "eye-off" : "eye"}
                onRightPress={() => setShowPassword((prev) => !prev)}
                autoCapitalize="none"
              />

              <InputBox
                label="Confirm Password"
                icon="lock"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                secureTextEntry={!showConfirm}
                onChangeText={(v) => updateField("confirmPassword", v)}
                rightIcon={showConfirm ? "eye-off" : "eye"}
                onRightPress={() => setShowConfirm((prev) => !prev)}
                autoCapitalize="none"
              />

              <Text style={styles.rulesHeading}>🔐 Password must contain</Text>

              <View style={styles.rulesGrid}>
                <Rule text="8+ characters" active={passwordChecks.length} />
                <Rule text="1 uppercase" active={passwordChecks.upper} />
                <Rule text="1 number" active={passwordChecks.number} />
                <Rule text="1 symbol" active={passwordChecks.symbol} />
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.termsRow}
                onPress={() => setAccepted((prev) => !prev)}
              >
                <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
                  {accepted && (
                    <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                  )}
                </View>

                <Text style={styles.termsText}>
                  I agree to the{" "}
                  <Text style={styles.linkText}>Terms of Service</Text> and{" "}
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.createButton, isLoading && { opacity: 0.75 }]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.createButtonText}>Register Now</Text>
                    <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.loginButton}
                onPress={() => navigation.navigate("LoginScreen")}
              >
                <Text style={styles.loginButtonText}>
                  Already registered? Login
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <View style={styles.footerIcon}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.footerLogo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.footerText}>
                Together, we keep every family safe.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  autoCapitalize,
  maxLength,
}) {
  return (
    <View style={styles.inputBlock}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View style={styles.inputWrapper}>
        <Feather
          name={icon}
          size={20}
          color={COLORS.blue}
          style={styles.leftIcon}
        />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#6B8CB8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || "default"}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize || "none"}
          autoCorrect={false}
          maxLength={maxLength}
        />

        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} activeOpacity={0.7}>
            <Feather name={rightIcon} size={20} color="#8EAAD2" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function Rule({ text, active }) {
  return (
    <View style={[styles.ruleItem, active && styles.ruleItemActive]}>
      <Ionicons
        name={active ? "checkmark-circle" : "ellipse-outline"}
        size={16}
        color={active ? COLORS.success : "#6B8CB8"}
      />
      <Text style={[styles.ruleText, active && styles.ruleTextActive]}>
        {text}
      </Text>
    </View>
  );
}

function InfoChip({ emoji, text }) {
  return (
    <View style={styles.infoChip}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: COLORS.bg },
  safeArea: { flex: 1 },

  scrollContent: {
    paddingHorizontal: isSmall ? 14 : 18,
    paddingTop: Platform.OS === "ios" ? 12 : 22,
    paddingBottom: 34,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: isTiny ? 16 : 22,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(84,145,230,0.32)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  brandBox: { flexDirection: "row", alignItems: "center", flex: 1 },

  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },

  logoImage: {
    width: "100%",
    height: "100%",
  },

  brandTitle: {
    color: COLORS.white,
    fontSize: isSmall ? 20 : 23,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  brandBlue: { color: COLORS.gold },

  brandSub: {
    color: COLORS.muted,
    fontSize: isSmall ? 11 : 12,
    fontWeight: "700",
    marginTop: 1,
  },

  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  heroTextBox: { flex: 1, paddingRight: 10 },

  kicker: {
    color: COLORS.blue2,
    fontSize: isSmall ? 15 : 17,
    fontWeight: "900",
    marginBottom: 8,
  },

  title: {
    color: COLORS.white,
    fontSize: isSmall ? 29 : 36,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 8,
  },

  subtitle: {
    color: COLORS.soft,
    fontSize: isSmall ? 13 : 15,
    lineHeight: isSmall ? 20 : 23,
    fontWeight: "600",
  },

  heroIconCircle: {
    width: isSmall ? 96 : 112,
    height: isSmall ? 96 : 112,
    borderRadius: isSmall ? 48 : 56,
    borderWidth: 2,
    borderColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(47,140,255,0.08)",
    shadowColor: COLORS.blue,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  shieldBadge: {
    position: "absolute",
    bottom: 7,
    right: 7,
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    borderWidth: 2.5,
    borderColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  chipRow: { flexDirection: "row", gap: 8, marginBottom: 16 },

  infoChip: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(91,148,226,0.25)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 8,
  },

  infoEmoji: { fontSize: 16, marginRight: 6 },

  infoText: {
    color: COLORS.white,
    fontSize: isSmall ? 11 : 12,
    fontWeight: "900",
  },

  formCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 26,
    paddingHorizontal: isSmall ? 14 : 18,
    paddingTop: 20,
    paddingBottom: 22,
    shadowColor: "#1E6FFF",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  cardHeader: { marginBottom: 16 },

  cardTitle: {
    color: COLORS.white,
    fontSize: isSmall ? 18 : 20,
    fontWeight: "900",
  },

  cardSub: {
    color: COLORS.muted,
    fontSize: isSmall ? 12 : 13,
    fontWeight: "600",
    marginTop: 4,
  },

  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,75,95,0.45)",
    backgroundColor: "rgba(255,75,95,0.12)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },

  errorText: {
    flex: 1,
    color: COLORS.white,
    fontSize: isSmall ? 12 : 13,
    fontWeight: "700",
    lineHeight: 18,
  },

  inputBlock: { marginBottom: 14 },

  inputLabel: {
    color: COLORS.white,
    fontSize: isSmall ? 13 : 14,
    fontWeight: "900",
    marginBottom: 8,
  },

  inputWrapper: {
    height: isSmall ? 52 : 56,
    borderRadius: 15,
    borderWidth: 1.4,
    borderColor: "rgba(100,154,226,0.36)",
    backgroundColor: COLORS.cardStrong,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  leftIcon: { marginRight: 12 },

  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: isSmall ? 14 : 15,
    fontWeight: "600",
    paddingVertical: 0,
  },

  rulesHeading: {
    color: COLORS.blue2,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 10,
    marginTop: 2,
  },

  rulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },

  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(120,160,220,0.18)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },

  ruleItemActive: {
    backgroundColor: "rgba(30,219,140,0.09)",
    borderColor: "rgba(30,219,140,0.32)",
  },

  ruleText: {
    color: COLORS.muted,
    fontSize: isSmall ? 11 : 12,
    fontWeight: "700",
    marginLeft: 6,
  },

  ruleTextActive: { color: "#D9FFF0" },

  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#6E8CBF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
    marginTop: 1,
  },

  checkboxOn: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },

  termsText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: isSmall ? 12 : 13,
    lineHeight: 19,
    fontWeight: "600",
  },

  linkText: { color: COLORS.blue2, fontWeight: "900" },

  createButton: {
    height: isSmall ? 54 : 58,
    borderRadius: 17,
    backgroundColor: COLORS.button,
    borderWidth: 1.3,
    borderColor: "rgba(255,180,190,0.45)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: COLORS.button,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 9,
    flexDirection: "row",
    gap: 8,
  },

  createButtonText: {
    color: COLORS.white,
    fontSize: isSmall ? 16 : 18,
    fontWeight: "900",
  },

  loginButton: {
    height: isSmall ? 50 : 54,
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: COLORS.blue,
    backgroundColor: "rgba(47,140,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },

  loginButtonText: {
    color: COLORS.blue2,
    fontSize: isSmall ? 14 : 15,
    fontWeight: "900",
  },

  footer: { alignItems: "center", marginTop: 22 },

  footerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "transparent",
    borderWidth: 1.2,
    borderColor: "rgba(91,148,226,0.28)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },

  footerLogo: {
    width: "100%",
    height: "100%",
  },

  footerText: {
    color: COLORS.soft,
    fontSize: isSmall ? 13 : 14,
    fontWeight: "700",
    textAlign: "center",
  },
});
