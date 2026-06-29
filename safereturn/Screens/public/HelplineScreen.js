

// HelplineScreen.js

import React from "react";
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
} from "react-native";

const { width, height } = Dimensions.get("window");

const isVerySmallPhone = width < 330;
const isSmallPhone = width < 360;
const isMediumPhone = width >= 360 && width < 400;
const isLargePhone = width >= 400;

const size = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isMediumPhone) return medium;
  return large;
};

const responsivePadding = size(10, 12, 14);
const bottomNavHeight = Platform.OS === "ios" ? size(70, 74, 78) : size(64, 68, 72);

const COLORS = {
  bgDark: "#020B1F",
  card: "#062A63",
  cardLight: "#082F6D",
  border: "rgba(60, 135, 255, 0.35)",
  white: "#FFFFFF",
  textSoft: "#D8E4F8",
  textMuted: "#AAB9D6",
  red: "#FF3048",
  green: "#25D970",
  orange: "#FF9F12",
  purple: "#A855F7",
  blue: "#2696FF",
};

const emergencyHelplines = [
  {
    id: "1",
    title: "Police Emergency",
    subtitle: "For immediate police assistance",
    number: "112",
    icon: "👮",
    color: COLORS.red,
  },
  {
    id: "2",
    title: "Ambulance",
    subtitle: "Medical emergency services",
    number: "108",
    icon: "🚑",
    color: COLORS.green,
  },
  {
    id: "3",
    title: "Fire Emergency",
    subtitle: "For fire and rescue services",
    number: "101",
    icon: "🔥",
    color: COLORS.orange,
  },
  {
    id: "4",
    title: "Women Helpline",
    subtitle: "Support for women in distress",
    number: "1091",
    icon: "♀",
    color: COLORS.purple,
  },
];

const otherHelplines = [
  {
    id: "1",
    title: "Child Helpline",
    number: "1098",
    icon: "👥",
    color: COLORS.blue,
  },
  {
    id: "2",
    title: "Mental Health",
    number: "9152987821",
    icon: "💚",
    color: COLORS.green,
  },
  {
    id: "3",
    title: "Disaster Management",
    number: "1078",
    icon: "📍",
    color: COLORS.orange,
  },
  {
    id: "4",
    title: "Highway Helpline",
    number: "1033",
    icon: "🛣️",
    color: COLORS.purple,
  },
];

export default function HelplineScreen({ navigation }) {
  const makeCall = async (number) => {
    try {
      const phoneUrl = `tel:${number}`;
      const canCall = await Linking.canOpenURL(phoneUrl);

      if (canCall) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert(
          "Calling not supported",
          "Your device does not support phone calls."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Unable to make a call right now.");
    }
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.("Home");
    }
  };

  const safeNavigate = (screenName) => {
    try {
      navigation?.navigate?.(screenName);
    } catch (error) {
      console.log("Navigation error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={goBack}
            style={styles.backBtn}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <Text
            style={styles.headerTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            Helpline
          </Text>

          <View style={styles.headerRight} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.sosCard}>
            <View style={styles.sosMainRow}>
              <View style={styles.sosIconBox}>
                <Text style={styles.sosIcon}>☎</Text>
              </View>

              <View style={styles.sosTextBox}>
                <Text
                  style={styles.sosTitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  In Emergency?
                </Text>

                <Text style={styles.sosSubtitle} numberOfLines={3}>
                  Quick access to important helpline numbers
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.sosButton}
              onPress={() => makeCall("112")}
            >
              <Text style={styles.sosButtonIcon}>☎</Text>
              <Text style={styles.sosButtonText}>SOS</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.warningCard}>
            <Text
              style={styles.warningTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              See someone missing?
            </Text>

            <Text style={styles.warningText}>
              If you see someone missing,{" "}
              <Text style={styles.warningHighlight}>
                report it immediately.
              </Text>
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Emergency Helplines</Text>

          {emergencyHelplines.map((item) => (
            <View key={item.id} style={styles.emergencyCard}>
              <View style={styles.emergencyInfo}>
                <View style={[styles.iconCircle, { borderColor: item.color }]}>
                  <Text
                    style={[
                      styles.mainIcon,
                      item.title === "Women Helpline" && {
                        color: item.color,
                        fontWeight: "800",
                      },
                    ]}
                  >
                    {item.icon}
                  </Text>
                </View>

                <View style={styles.textInfo}>
                  <Text
                    style={styles.helplineTitle}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={[
                      styles.helplineSubtitle,
                      item.id === "1" && { color: COLORS.red },
                    ]}
                    numberOfLines={2}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </View>

              <View style={styles.callInfo}>
                <Text
                  style={[styles.helplineNumber, { color: item.color }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {item.number}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.callBtn, { backgroundColor: item.color }]}
                  onPress={() => makeCall(item.number)}
                >
                  <Text style={styles.callIcon}>☎</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Other Useful Helplines</Text>

          <View style={styles.grid}>
            {otherHelplines.map((item) => (
              <View key={item.id} style={styles.gridCard}>
                <View
                  style={[styles.gridIconCircle, { borderColor: item.color }]}
                >
                  <Text style={styles.gridIcon}>{item.icon}</Text>
                </View>

                <Text
                  style={styles.gridTitle}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {item.title}
                </Text>

                <Text
                  style={[styles.gridNumber, { color: item.color }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.55}
                >
                  {item.number}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.gridCallBtn, { backgroundColor: item.color }]}
                  onPress={() => makeCall(item.number)}
                >
                  <Text style={styles.gridCallIcon}>☎</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.safetyCard}>
            <View style={styles.safetyIconBox}>
              <Text style={styles.safetyIcon}>🛡️</Text>
            </View>

            <View style={styles.safetyTextBox}>
              <Text
                style={styles.safetyTitle}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
              >
                Your Safety is Important
              </Text>

              <Text style={styles.safetySubtitle} numberOfLines={3}>
                If you or someone you know is in danger, don’t hesitate to call
                for help.
              </Text>
            </View>

            <Text style={styles.safetyBgIcon}>💙</Text>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.tabItem}
            onPress={() => safeNavigate("Home")}
          >
            <Text style={styles.tabIcon}>⌂</Text>
            <Text
              style={styles.tabText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.tabItem}
            onPress={() => safeNavigate("Reports")}
          >
            <Text style={styles.tabIcon}>▤</Text>
            <Text
              style={styles.tabText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              Reports
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.centerTabItem}
            onPress={() => safeNavigate("Helpline")}
          >
            <View style={styles.activeSos}>
              <Text style={styles.activeSosText}>SOS</Text>
            </View>
            <Text
              style={styles.activeTabText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              Helpline
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.tabItem}
            onPress={() => safeNavigate("Community")}
          >
            <Text style={styles.tabIcon}>👥</Text>
            <Text
              style={styles.tabText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              Community
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.tabItem}
            onPress={() => safeNavigate("Profile")}
          >
            <Text style={styles.tabIcon}>○</Text>
            <Text
              style={styles.tabText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },

  header: {
    height: Platform.OS === "ios" ? size(56, 60, 62) : size(52, 56, 58),
    paddingHorizontal: responsivePadding,
    paddingTop: Platform.OS === "android" ? 4 : 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bgDark,
  },

  backBtn: {
    width: size(32, 36, 38),
    height: size(32, 36, 38),
    alignItems: "flex-start",
    justifyContent: "center",
  },

  backIcon: {
    color: COLORS.white,
    fontSize: size(30, 33, 35),
    lineHeight: size(30, 33, 35),
    fontWeight: "300",
  },

  headerTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: size(20, 21, 23),
    lineHeight: size(25, 26, 28),
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
  },

  headerRight: {
    width: size(32, 36, 38),
  },

  scrollContent: {
    paddingHorizontal: responsivePadding,
    paddingTop: size(6, 8, 10),
    paddingBottom: bottomNavHeight + size(34, 42, 50),
  },

  sosCard: {
    width: "100%",
    minHeight: isSmallPhone ? 146 : 122,
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: size(11, 13, 15),
    paddingVertical: size(12, 14, 15),
    flexDirection: isSmallPhone ? "column" : "row",
    alignItems: isSmallPhone ? "stretch" : "center",
    justifyContent: "space-between",
    gap: size(10, 12, 12),
    overflow: "hidden",
  },

  sosMainRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  sosIconBox: {
    width: size(50, 58, 66),
    height: size(50, 58, 66),
    borderRadius: 100,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    marginRight: size(9, 11, 12),
    flexShrink: 0,
  },

  sosIcon: {
    color: COLORS.white,
    fontSize: size(23, 27, 30),
    fontWeight: "800",
  },

  sosTextBox: {
    flex: 1,
    minWidth: 0,
  },

  sosTitle: {
    color: COLORS.white,
    fontSize: size(19, 22, 24),
    lineHeight: size(24, 27, 29),
    fontWeight: "800",
    marginBottom: 4,
  },

  sosSubtitle: {
    color: COLORS.textSoft,
    fontSize: size(11.5, 13, 14),
    lineHeight: size(16, 18, 20),
    fontWeight: "400",
  },

  sosButton: {
    height: size(44, 47, 50),
    minWidth: isSmallPhone ? "100%" : size(96, 106, 116),
    borderRadius: 12,
    backgroundColor: COLORS.red,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
  },

  sosButtonIcon: {
    color: COLORS.white,
    fontSize: size(18, 20, 22),
    fontWeight: "800",
  },

  sosButtonText: {
    color: COLORS.white,
    fontSize: size(16, 18, 19),
    fontWeight: "800",
  },

  warningCard: {
    marginTop: size(10, 12, 13),
    borderRadius: 14,
    backgroundColor: "rgba(255, 48, 72, 0.11)",
    borderWidth: 1,
    borderColor: "rgba(255, 48, 72, 0.32)",
    paddingHorizontal: size(11, 13, 14),
    paddingVertical: size(10, 11, 12),
  },

  warningTitle: {
    color: COLORS.white,
    fontSize: size(14, 15, 16),
    lineHeight: size(19, 20, 21),
    fontWeight: "800",
    marginBottom: 4,
  },

  warningText: {
    color: COLORS.textSoft,
    fontSize: size(11.5, 12.5, 13),
    lineHeight: size(17, 19, 20),
    fontWeight: "400",
  },

  warningHighlight: {
    color: COLORS.red,
    fontWeight: "800",
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: size(18, 20, 22),
    lineHeight: size(24, 26, 28),
    fontWeight: "800",
    marginTop: size(20, 23, 25),
    marginBottom: size(10, 12, 13),
  },

  emergencyCard: {
    width: "100%",
    minHeight: size(96, 108, 116),
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: size(9, 10, 11),
    paddingHorizontal: size(9, 11, 12),
    paddingVertical: size(10, 12, 12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },

  emergencyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    paddingRight: size(5, 7, 8),
  },

  iconCircle: {
    width: size(46, 54, 62),
    height: size(46, 54, 62),
    borderRadius: 100,
    borderWidth: 1.2,
    backgroundColor: "rgba(6, 28, 70, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: size(8, 10, 11),
    flexShrink: 0,
  },

  mainIcon: {
    fontSize: size(22, 25, 29),
  },

  textInfo: {
    flex: 1,
    minWidth: 0,
  },

  helplineTitle: {
    color: COLORS.white,
    fontSize: size(15, 17, 19),
    lineHeight: size(20, 22, 24),
    fontWeight: "800",
    marginBottom: 3,
  },

  helplineSubtitle: {
    color: COLORS.textSoft,
    fontSize: size(10.5, 12, 13.5),
    lineHeight: size(15, 17, 19),
    fontWeight: "400",
  },

  callInfo: {
    alignItems: "center",
    justifyContent: "center",
    width: size(56, 64, 74),
    flexShrink: 0,
  },

  helplineNumber: {
    fontSize: size(20, 24, 28),
    lineHeight: size(25, 29, 33),
    fontWeight: "800",
    marginBottom: size(6, 7, 8),
    textAlign: "center",
    maxWidth: "100%",
  },

  callBtn: {
    width: size(42, 48, 56),
    height: size(42, 48, 56),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },

  callIcon: {
    color: COLORS.white,
    fontSize: size(19, 22, 26),
    fontWeight: "800",
  },

  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: size(10, 12, 13),
  },

  gridCard: {
    width: isVerySmallPhone ? "100%" : "48.3%",
    minHeight: isVerySmallPhone ? 154 : size(170, 188, 204),
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: size(9, 10, 11),
    paddingVertical: size(12, 13, 14),
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },

  gridIconCircle: {
    width: size(48, 55, 62),
    height: size(48, 55, 62),
    borderRadius: 100,
    borderWidth: 1.2,
    backgroundColor: "rgba(6, 28, 70, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  gridIcon: {
    fontSize: size(22, 25, 28),
  },

  gridTitle: {
    color: COLORS.white,
    fontSize: size(13, 15, 16),
    lineHeight: size(18, 20, 21),
    fontWeight: "800",
    textAlign: "center",
    marginTop: 8,
    minHeight: size(36, 40, 42),
    width: "100%",
  },

  gridNumber: {
    fontSize: size(15, 18, 21),
    lineHeight: size(20, 23, 26),
    fontWeight: "800",
    textAlign: "center",
    maxWidth: "100%",
    width: "100%",
  },

  gridCallBtn: {
    width: size(40, 46, 50),
    height: size(40, 46, 50),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  gridCallIcon: {
    color: COLORS.white,
    fontSize: size(19, 22, 24),
    fontWeight: "800",
  },

  safetyCard: {
    marginTop: size(18, 20, 22),
    minHeight: size(96, 104, 112),
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: size(11, 13, 14),
    paddingVertical: size(12, 14, 15),
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },

  safetyIconBox: {
    width: size(48, 58, 66),
    height: size(48, 58, 66),
    alignItems: "center",
    justifyContent: "center",
    marginRight: size(8, 10, 11),
    flexShrink: 0,
  },

  safetyIcon: {
    fontSize: size(38, 46, 52),
  },

  safetyTextBox: {
    flex: 1,
    zIndex: 2,
    minWidth: 0,
  },

  safetyTitle: {
    color: COLORS.white,
    fontSize: size(15, 17, 18),
    lineHeight: size(20, 22, 23),
    fontWeight: "800",
    marginBottom: 4,
  },

  safetySubtitle: {
    color: COLORS.textSoft,
    fontSize: size(11.5, 13, 14),
    lineHeight: size(17, 19, 20),
    fontWeight: "400",
  },

  safetyBgIcon: {
    position: "absolute",
    right: 18,
    bottom: 4,
    fontSize: size(48, 58, 64),
    opacity: 0.14,
  },

  bottomSpace: {
    height: bottomNavHeight + size(30, 36, 42),
  },

  bottomBar: {
    position: "absolute",
    left: size(8, 10, 12),
    right: size(8, 10, 12),
    bottom: Platform.OS === "ios" ? size(8, 10, 12) : size(6, 8, 10),
    height: bottomNavHeight,
    paddingHorizontal: size(3, 4, 5),
    backgroundColor: "rgba(5, 34, 82, 0.98)",
    borderRadius: size(18, 20, 22),
    borderWidth: 1,
    borderColor: "rgba(54, 135, 255, 0.38)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  tabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 1,
  },

  centerTabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -size(14, 16, 18),
    paddingHorizontal: 1,
  },

  tabIcon: {
    fontSize: size(17, 20, 22),
    color: "rgba(255,255,255,0.72)",
    marginBottom: size(2, 3, 4),
  },

  tabText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: size(8.5, 10.5, 12),
    lineHeight: size(11, 13, 15),
    fontWeight: "600",
    textAlign: "center",
    maxWidth: "100%",
  },

  activeSos: {
    width: size(46, 52, 58),
    height: size(46, 52, 58),
    borderRadius: 100,
    backgroundColor: COLORS.blue,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: size(2, 3, 4),
  },

  activeSosText: {
    color: COLORS.white,
    fontSize: size(11, 13, 14),
    fontWeight: "800",
  },

  activeTabText: {
    color: COLORS.red,
    fontSize: size(8.5, 10.5, 12),
    lineHeight: size(11, 13, 15),
    fontWeight: "800",
    textAlign: "center",
  },
});