// Screens/auth/LoginScreen.js

import React, { useState } from "react";
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
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeReturn } from "../context/SafeReturnContext";

const { width } = Dimensions.get("window");
const isSmall = width < 380;
const isVerySmall = width < 350;

const COLORS = {
  bg: "#061A40",
  card: "rgba(255,255,255,0.055)",
  border: "rgba(91,148,226,0.34)",
  inputBg: "rgba(5,25,65,0.38)",
  inputBorder: "rgba(100,154,226,0.4)",
  white: "#FFFFFF",
  muted: "#B4C7E9",
  placeholder: "#6B8CB8",
  blue: "#2F8CFF",
  blueDark: "#1460EE",
  danger: "#FF4058",
  success: "#22C55E",
};

export default function LoginScreen({ navigation }) {
  const { login } = useSafeReturn();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage("");
  };

  // ✅ Back goes to Onboarding (matching App.js route name)
  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.replace?.("Onboarding");
    }
  };

  // ✅ On login success → navigate based on role
  const handleLogin = async () => {
    if (!form.email.trim()) {
      setMessage("Please enter email address.");
      return;
    }

    if (!form.password.trim()) {
      setMessage("Please enter password.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const user = await login(form.email.trim(), form.password);
      const homeRoute =
        user?.role === "POLICE" || user?.role === "ADMIN"
          ? "PoliceHome"
          : "PublicHome";

      navigation?.reset?.({
        index: 0,
        routes: [{ name: homeRoute }],
      });
    } catch (err) {
      setMessage(err.message || "Invalid email address or password.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Navigate to PublicRegister (matching App.js route name)
  const handleCreateAccount = () => {
    navigation?.navigate?.("PublicRegister");
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
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.8}
              onPress={handleBack}
            >
              <Ionicons name="chevron-back" size={27} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.topIconCircle}>
              <Ionicons
                name="people-outline"
                size={isSmall ? 48 : 56}
                color={COLORS.white}
              />

              <View style={styles.shieldBadge}>
                <Ionicons name="checkmark" size={17} color={COLORS.white} />
              </View>
            </View>

            <Text style={styles.title}>Secure Login</Text>

            <Text style={styles.subtitle}>
              Public users and police officers can sign in here with their
              assigned credentials.
            </Text>

            <View style={styles.formCard}>
              {message ? (
                <View style={styles.messageBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={COLORS.danger}
                  />
                  <Text style={styles.messageText}>{message}</Text>
                </View>
              ) : null}

              <InputBox
                label="Email Address"
                icon="mail"
                placeholder="Enter your email address"
                value={form.email}
                keyboardType="email-address"
                onChangeText={(v) => updateField("email", v)}
              />

              <InputBox
                label="Password"
                icon="lock"
                placeholder="Enter your password"
                value={form.password}
                secureTextEntry={!showPassword}
                onChangeText={(v) => updateField("password", v)}
                rightIcon={showPassword ? "eye-off" : "eye"}
                onRightPress={() => setShowPassword(!showPassword)}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.forgotWrap}
                onPress={() => navigation?.navigate?.("ForgotPassword")}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.rememberRow}
                onPress={() => setRemember(!remember)}
              >
                <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                  {remember && (
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  )}
                </View>

                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons
                      name="log-in-outline"
                      size={22}
                      color={COLORS.white}
                    />
                    <Text style={styles.loginButtonText}>Login</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.createAccountButton}
                onPress={handleCreateAccount}
              >
                <Feather name="user-plus" size={22} color={COLORS.blue} />
                <Text style={styles.createAccountText}>Create Public Account</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.registerBottom}
              onPress={() => navigation?.navigate?.("PublicRegister")}
            >
              <Text style={styles.bottomText}>
                Don't have an account?{" "}
                <Text style={styles.bottomLink}>Register</Text>
              </Text>
            </TouchableOpacity>
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

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: isVerySmall ? 14 : 18,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 42,
  },

  backButton: {
    width: isVerySmall ? 46 : 52,
    height: isVerySmall ? 46 : 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(84,145,230,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  topIconCircle: {
    alignSelf: "center",
    width: isSmall ? 116 : 136,
    height: isSmall ? 116 : 136,
    borderRadius: 80,
    borderWidth: 2.6,
    borderColor: COLORS.blueDark,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(47,140,255,0.08)",
    shadowColor: COLORS.blueDark,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    marginBottom: 24,
  },

  shieldBadge: {
    position: "absolute",
    bottom: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.blue,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: COLORS.white,
    fontSize: isVerySmall ? 27 : isSmall ? 30 : 36,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 13 : isSmall ? 15 : 17,
    lineHeight: isVerySmall ? 20 : isSmall ? 23 : 26,
    textAlign: "center",
    paddingHorizontal: 12,
    marginBottom: 20,
  },

  formCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    borderRadius: 25,
    paddingHorizontal: isSmall ? 16 : 20,
    paddingTop: 22,
    paddingBottom: 28,
  },

  messageBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,64,88,0.45)",
    backgroundColor: "rgba(255,64,88,0.12)",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  messageText: {
    flex: 1,
    color: COLORS.white,
    fontSize: isVerySmall ? 11 : 12,
    fontWeight: "700",
    lineHeight: 17,
    marginLeft: 7,
  },

  inputBlock: {
    marginBottom: 20,
  },

  inputLabel: {
    color: COLORS.white,
    fontSize: isVerySmall ? 14 : isSmall ? 16 : 18,
    fontWeight: "900",
    marginBottom: 10,
  },

  inputWrapper: {
    height: isVerySmall ? 52 : isSmall ? 58 : 66,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.inputBg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: isVerySmall ? 12 : 16,
  },

  leftIcon: {
    marginRight: isVerySmall ? 10 : 16,
  },

  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: isVerySmall ? 13 : isSmall ? 15 : 17,
    fontWeight: "500",
    paddingVertical: 0,
  },

  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: -2,
    marginBottom: 22,
  },

  forgotText: {
    color: COLORS.blue,
    fontSize: isVerySmall ? 12 : isSmall ? 14 : 16,
    fontWeight: "900",
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  checkbox: {
    width: isVerySmall ? 24 : 27,
    height: isVerySmall ? 24 : 27,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#7898C8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  checkboxOn: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },

  rememberText: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 13 : isSmall ? 15 : 17,
    fontWeight: "500",
  },

  loginButton: {
    height: isVerySmall ? 52 : isSmall ? 58 : 66,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    flexDirection: "row",
    gap: 8,
    shadowColor: "#1E6FFF",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  loginButtonText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 13 : isSmall ? 15 : 18,
    fontWeight: "900",
  },

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(166,190,232,0.24)",
  },

  orText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "900",
    marginHorizontal: 18,
  },

  createAccountButton: {
    height: isVerySmall ? 52 : isSmall ? 58 : 66,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: COLORS.blue,
    backgroundColor: "rgba(47,140,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  createAccountText: {
    color: COLORS.blue,
    fontSize: isVerySmall ? 14 : isSmall ? 16 : 18,
    fontWeight: "900",
  },

  registerBottom: {
    marginTop: 28,
    alignItems: "center",
  },

  bottomText: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 13 : isSmall ? 15 : 17,
    fontWeight: "500",
    textAlign: "center",
  },

  bottomLink: {
    color: COLORS.blue,
    fontWeight: "900",
  },
});
