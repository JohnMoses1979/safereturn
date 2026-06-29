



























// SafetyTipsScreen.js

import React, { useMemo, useEffect, useState, useCallback } from "react";
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

const { width } = Dimensions.get("window");

const isVerySmallPhone = width < 330;
const isSmallPhone = width < 360;
const isMediumPhone = width >= 360 && width < 400;

const fs = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isMediumPhone) return medium;
  return large;
};

const COLORS = {
  bg: "#020B1F",
  card: "#062A63",
  card2: "#05265B",
  card3: "#082F6D",
  border: "rgba(42, 122, 255, 0.42)",
  white: "#FFFFFF",
  softWhite: "#DDE8FF",
  muted: "#9FAFD0",
  blue: "#2696FF",
  cyan: "#36CFFF",
  red: "#FF3048",
  green: "#22D66B",
  orange: "#FF9F12",
  purple: "#8B3FF2",
  pink: "#E73380",
};

const personalTips = [
  {
    id: "1",
    icon: "📍",
    title: "Stay Aware",
    text: "Be aware of your surroundings at all times.",
    color: COLORS.pink,
  },
  {
    id: "2",
    icon: "👥",
    title: "Avoid Isolated Areas",
    text: "Avoid dark and isolated places, especially at night.",
    color: COLORS.purple,
  },
  {
    id: "3",
    icon: "📱",
    title: "Share Location",
    text: "Share your live location with trusted family.",
    color: COLORS.blue,
  },
  {
    id: "4",
    icon: "📣",
    title: "Trust Instincts",
    text: "If something feels wrong, move away quickly.",
    color: COLORS.orange,
  },
  {
    id: "5",
    icon: "🔔",
    title: "Emergency Numbers",
    text: "Save important emergency numbers in your phone.",
    color: COLORS.green,
  },
  {
    id: "6",
    icon: "👜",
    title: "Protect Belongings",
    text: "Keep your belongings close and secure.",
    color: COLORS.pink,
  },
];

const digitalTips = [
  {
    id: "privacy",
    icon: "🛡️",
    title: "Keep Personal Information Private",
    text: "Don’t share personal details with strangers online.",
    color: COLORS.blue,
    hero: "Protect your identity online",
    points: [
      "Never share your address, OTP, password, Aadhaar details, bank details, or personal photos with unknown people.",
      "Avoid posting your live location publicly on social media.",
      "Keep your profile private and allow only trusted people to view your details.",
      "Do not fill forms from unknown links asking for personal information.",
      "Check app permissions regularly and remove unnecessary access.",
    ],
    dangerSigns: [
      "Someone asking for OTP or password.",
      "Unknown person asking for your location.",
      "Fake reward, job, lottery, or gift messages.",
      "Links asking you to login again.",
    ],
  },
  {
    id: "passwords",
    icon: "🔗",
    title: "Use Strong Passwords",
    text: "Use strong, unique passwords for your accounts.",
    color: COLORS.green,
    hero: "Secure your accounts",
    points: [
      "Use a strong password with letters, numbers, and symbols.",
      "Do not use your name, birthday, phone number, or simple passwords like 123456.",
      "Use different passwords for different apps.",
      "Enable two-factor authentication wherever possible.",
      "Change your password immediately if you think someone knows it.",
    ],
    dangerSigns: [
      "Login alerts from unknown devices.",
      "Password reset messages you did not request.",
      "Your account sending messages automatically.",
      "Unknown email or phone added to your account.",
    ],
  },
  {
    id: "messages",
    icon: "💬",
    title: "Be Cautious with Messages",
    text: "Avoid clicking on suspicious links or attachments.",
    color: COLORS.orange,
    hero: "Think before you click",
    points: [
      "Do not open unknown links from SMS, WhatsApp, email, or social media.",
      "Avoid downloading attachments from unknown people.",
      "Check spelling mistakes and fake-looking sender names.",
      "Do not trust messages saying urgent payment, prize, job offer, or account blocked.",
      "Confirm with the real person before sending money or sharing information.",
    ],
    dangerSigns: [
      "Message creates fear or urgency.",
      "Unknown link asking payment or login.",
      "Sender says not to tell anyone.",
      "Fake customer care number or fake support chat.",
    ],
  },
  {
    id: "report",
    icon: "👥",
    title: "Report Suspicious Activity",
    text: "Report suspicious activity to the authorities.",
    color: COLORS.purple,
    hero: "Take action quickly",
    points: [
      "Report suspicious messages, profiles, calls, or links immediately.",
      "Block unknown users who harass or threaten you.",
      "Take screenshots as proof before deleting messages.",
      "Inform a trusted family member or friend.",
      "For cyber fraud, contact cyber crime helpline or local police.",
    ],
    dangerSigns: [
      "Threatening messages.",
      "Blackmail using photos or videos.",
      "Money demand from unknown people.",
      "Fake police, bank, or government calls.",
    ],
  },
];

const EmojiText = ({ children, style }) => (
  <Text allowFontScaling={false} style={style}>
    {children}
  </Text>
);

export default function SafetyTipsScreen({ navigation }) {
  const [selectedDigitalTip, setSelectedDigitalTip] = useState(null);

  const makeSOSCall = async () => {
    try {
      const phoneUrl = "tel:112";
      const supported = await Linking.canOpenURL(phoneUrl);

      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert(
          "Call not supported",
          "Your device does not support phone calls."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Unable to make a call right now.");
    }
  };

  const goBack = () => {
    if (selectedDigitalTip) {
      setSelectedDigitalTip(null);
      return;
    }

    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.("PublicHome");
    }
  };

  const renderDigitalDetails = () => {
    const item = selectedDigitalTip;

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={goBack}
              style={styles.backButton}
            >
              <Text allowFontScaling={false} style={styles.backIcon}>
                ‹
              </Text>
            </TouchableOpacity>

            <Text
              style={styles.headerTitleSmall}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Digital Safety
            </Text>

            <View style={styles.headerShield}>
              <EmojiText style={styles.headerShieldIcon}>{item.icon}</EmojiText>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.detailsScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.detailHeroCard, { borderColor: item.color }]}>
              <View
                style={[
                  styles.detailIconCircle,
                  { backgroundColor: item.color },
                ]}
              >
                <EmojiText style={styles.detailHeroIcon}>{item.icon}</EmojiText>
              </View>

              <Text
                style={styles.detailTitle}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
              >
                {item.title}
              </Text>

              <Text style={styles.detailSubTitle}>{item.hero}</Text>
              <Text style={styles.detailDescription}>{item.text}</Text>
            </View>

            <Text style={styles.sectionTitle}>What You Should Do</Text>

            <View style={styles.detailListCard}>
              {item.points.map((point, index) => (
                <View
                  key={`point-${index}`}
                  style={[
                    styles.detailPointRow,
                    index !== item.points.length - 1 &&
                      styles.detailPointBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.numberCircle,
                      { backgroundColor: item.color },
                    ]}
                  >
                    <Text allowFontScaling={false} style={styles.numberText}>
                      {index + 1}
                    </Text>
                  </View>

                  <Text style={styles.detailPointText}>{point}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Danger Signs</Text>

            <View style={styles.warningDetailsCard}>
              {item.dangerSigns.map((sign, index) => (
                <View
                  key={`sign-${index}`}
                  style={[
                    styles.warningRow,
                    index !== item.dangerSigns.length - 1 && {
                      marginBottom: 10,
                    },
                  ]}
                >
                  <EmojiText style={styles.warningIcon}>⚠️</EmojiText>
                  <Text style={styles.dangerText}>{sign}</Text>
                </View>
              ))}
            </View>

            <View style={styles.quickActionCard}>
              <View style={styles.quickActionLeft}>
                <View style={styles.quickActionIconCircle}>
                  <EmojiText style={styles.quickActionIcon}>☎</EmojiText>
                </View>

                <View style={styles.quickActionTextBox}>
                  <Text
                    style={styles.quickActionTitle}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                  >
                    Need urgent help?
                  </Text>

                  <Text style={styles.quickActionText}>
                    Call emergency helpline immediately.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.quickActionButton}
                onPress={makeSOSCall}
              >
                <Text style={styles.quickActionButtonText}>Call 112</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpace} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  };

  if (selectedDigitalTip) {
    return renderDigitalDetails();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={goBack}
            style={styles.backButton}
          >
            <Text allowFontScaling={false} style={styles.backIcon}>
              ‹
            </Text>
          </TouchableOpacity>

          <Text
            style={styles.headerTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            Safety Tips
          </Text>

          <View style={styles.headerShield}>
            <EmojiText style={styles.headerShieldIcon}>🛡️</EmojiText>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces
        >
          <View style={styles.heroCard}>
            <View style={styles.heroLeft}>
              <Text
                style={styles.heroTitle}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
              >
                Stay Aware,{"\n"}Stay <Text style={styles.heroBlue}>Safe</Text>
              </Text>

              <Text style={styles.heroSubtitle} numberOfLines={3}>
                Follow these safety tips to protect yourself and others.
              </Text>
            </View>

            <View style={styles.heroRight}>
              <EmojiText style={styles.sparkOne}>✦</EmojiText>
              <EmojiText style={styles.sparkTwo}>✦</EmojiText>
              <EmojiText style={styles.heroShieldEmoji}>🛡️</EmojiText>
              <EmojiText style={styles.heroLockEmoji}>🔒</EmojiText>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Personal Safety Tips</Text>

          <View style={styles.grid}>
            {personalTips.map((item) => (
              <View key={item.id} style={styles.tipCard}>
                <View
                  style={[
                    styles.tipIconCircle,
                    { backgroundColor: item.color },
                  ]}
                >
                  <EmojiText style={styles.tipIcon}>{item.icon}</EmojiText>
                </View>

                <Text
                  style={styles.tipTitle}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.78}
                >
                  {item.title}
                </Text>

                <Text style={styles.tipText} numberOfLines={3}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Digital Safety Tips</Text>

          <View style={styles.digitalCard}>
            {digitalTips.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => setSelectedDigitalTip(item)}
                style={[
                  styles.digitalRow,
                  index !== digitalTips.length - 1 && styles.digitalRowBorder,
                ]}
              >
                <View
                  style={[
                    styles.digitalIconCircle,
                    { backgroundColor: item.color },
                  ]}
                >
                  <EmojiText style={styles.digitalIcon}>{item.icon}</EmojiText>
                </View>

                <View style={styles.digitalTextBox}>
                  <Text
                    style={styles.digitalTitle}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {item.title}
                  </Text>

                  <Text style={styles.digitalText} numberOfLines={2}>
                    {item.text}
                  </Text>
                </View>

                <View style={styles.chevronBox}>
                  <Text allowFontScaling={false} style={styles.chevron}>
                    ›
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.emergencyCard}>
            <View style={styles.emergencyLeft}>
              <View style={styles.emergencyIconCircle}>
                <EmojiText style={styles.emergencyIcon}>☎</EmojiText>
              </View>

              <View style={styles.emergencyTextBox}>
                <Text
                  style={styles.emergencyTitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.78}
                >
                  Emergency?
                </Text>

                <Text style={styles.emergencyText} numberOfLines={2}>
                  Contact helpline immediately.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.sosButton}
              onPress={makeSOSCall}
            >
              <EmojiText style={styles.sosIcon}>☎</EmojiText>
              <Text style={styles.sosText}>Call SOS</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  header: {
    height: Platform.OS === "ios" ? fs(56, 60, 62) : fs(52, 56, 58),
    paddingHorizontal: fs(10, 13, 15),
    paddingTop: Platform.OS === "android" ? 4 : 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: fs(32, 36, 38),
    height: fs(32, 36, 38),
    alignItems: "flex-start",
    justifyContent: "center",
    flexShrink: 0,
  },

  backIcon: {
    color: COLORS.white,
    fontSize: fs(30, 34, 36),
    lineHeight: fs(30, 34, 36),
    fontWeight: "300",
  },

  headerTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: fs(20, 23, 25),
    lineHeight: fs(25, 29, 31),
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
  },

  headerTitleSmall: {
    flex: 1,
    color: COLORS.white,
    fontSize: fs(18, 20, 22),
    lineHeight: fs(24, 26, 28),
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
  },

  headerShield: {
    width: fs(32, 36, 38),
    height: fs(32, 36, 38),
    alignItems: "flex-end",
    justifyContent: "center",
    flexShrink: 0,
  },

  headerShieldIcon: {
    fontSize: fs(21, 24, 27),
    lineHeight: fs(25, 28, 31),
    textAlign: "center",
  },

  scrollContent: {
    paddingHorizontal: fs(10, 12, 14),
    paddingTop: fs(6, 8, 10),
    paddingBottom: Platform.OS === "ios" ? 52 : 46,
    flexGrow: 1,
  },

  detailsScrollContent: {
    paddingHorizontal: fs(10, 12, 14),
    paddingTop: fs(6, 8, 10),
    paddingBottom: Platform.OS === "ios" ? 52 : 46,
    flexGrow: 1,
  },

  heroCard: {
    width: "100%",
    minHeight: fs(138, 158, 176),
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: fs(11, 14, 18),
    paddingVertical: fs(12, 15, 18),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },

  heroLeft: {
    flex: 1,
    zIndex: 2,
    minWidth: 0,
    paddingRight: fs(4, 8, 10),
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: fs(24, 29, 34),
    lineHeight: fs(30, 36, 41),
    fontWeight: "900",
    marginBottom: fs(6, 8, 8),
  },

  heroBlue: {
    color: COLORS.cyan,
  },

  heroSubtitle: {
    color: COLORS.softWhite,
    fontSize: fs(11.5, 13, 15),
    lineHeight: fs(17, 20, 23),
    fontWeight: "400",
    maxWidth: "98%",
  },

  heroRight: {
    width: fs(82, 104, 128),
    height: "100%",
    minHeight: fs(112, 128, 142),
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  heroShieldEmoji: {
    fontSize: fs(50, 66, 82),
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  heroLockEmoji: {
    position: "absolute",
    right: fs(-2, 0, 4),
    bottom: fs(6, 8, 10),
    fontSize: fs(22, 29, 36),
    lineHeight: fs(28, 35, 42),
  },

  sparkOne: {
    position: "absolute",
    top: fs(8, 10, 12),
    left: fs(4, 6, 10),
    color: COLORS.cyan,
    fontSize: fs(10, 13, 15),
    lineHeight: fs(14, 17, 19),
  },

  sparkTwo: {
    position: "absolute",
    right: fs(6, 8, 12),
    top: fs(34, 44, 50),
    color: COLORS.cyan,
    fontSize: fs(9, 11, 13),
    lineHeight: fs(13, 15, 17),
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: fs(18, 20, 22),
    lineHeight: fs(24, 26, 28),
    fontWeight: "800",
    marginTop: fs(18, 20, 22),
    marginBottom: fs(10, 11, 12),
  },

  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: fs(9, 10, 11),
  },

  tipCard: {
    width: isVerySmallPhone ? "100%" : "48.3%",
    minHeight: isVerySmallPhone ? 126 : fs(132, 148, 164),
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: fs(8, 9, 10),
    paddingVertical: fs(10, 11, 12),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  tipIconCircle: {
    width: fs(42, 50, 58),
    height: fs(42, 50, 58),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: fs(7, 8, 9),
    overflow: "hidden",
  },

  tipIcon: {
    fontSize: fs(20, 23, 27),
    lineHeight: fs(25, 29, 33),
    textAlign: "center",
  },

  tipTitle: {
    color: COLORS.white,
    fontSize: fs(12.5, 14, 16),
    lineHeight: fs(17, 18, 21),
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 5,
    width: "100%",
  },

  tipText: {
    color: COLORS.softWhite,
    fontSize: fs(10.5, 12, 13),
    lineHeight: fs(15, 17, 19),
    fontWeight: "400",
    textAlign: "center",
    width: "100%",
  },

  digitalCard: {
    width: "100%",
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  digitalRow: {
    minHeight: fs(68, 74, 82),
    paddingHorizontal: fs(8, 10, 12),
    paddingVertical: fs(9, 10, 12),
    flexDirection: "row",
    alignItems: "center",
  },

  digitalRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(65, 136, 255, 0.22)",
  },

  digitalIconCircle: {
    width: fs(36, 40, 46),
    height: fs(36, 40, 46),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: fs(8, 10, 11),
    flexShrink: 0,
    overflow: "hidden",
  },

  digitalIcon: {
    fontSize: fs(16, 18, 21),
    lineHeight: fs(21, 23, 27),
    textAlign: "center",
  },

  digitalTextBox: {
    flex: 1,
    minWidth: 0,
  },

  digitalTitle: {
    color: COLORS.white,
    fontSize: fs(12, 13.5, 15),
    lineHeight: fs(17, 18, 20),
    fontWeight: "800",
    marginBottom: 2,
  },

  digitalText: {
    color: COLORS.softWhite,
    fontSize: fs(10.5, 12, 13),
    lineHeight: fs(15, 17, 19),
    fontWeight: "400",
  },

  chevronBox: {
    width: fs(16, 20, 24),
    alignItems: "flex-end",
    justifyContent: "center",
    flexShrink: 0,
  },

  chevron: {
    color: COLORS.softWhite,
    fontSize: fs(24, 28, 34),
    lineHeight: fs(24, 28, 34),
    fontWeight: "300",
  },

  emergencyCard: {
    marginTop: fs(18, 20, 22),
    minHeight: fs(104, 106, 110),
    borderRadius: CARD_RADIUS,
    backgroundColor: "rgba(255, 48, 72, 0.24)",
    borderWidth: 1,
    borderColor: "rgba(255, 48, 72, 0.45)",
    paddingHorizontal: fs(10, 12, 14),
    paddingVertical: fs(10, 12, 14),
    flexDirection: isSmallPhone ? "column" : "row",
    alignItems: isSmallPhone ? "stretch" : "center",
    justifyContent: "space-between",
    gap: isSmallPhone ? 10 : 8,
    overflow: "hidden",
  },

  emergencyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    paddingRight: isSmallPhone ? 0 : 8,
  },

  emergencyIconCircle: {
    width: fs(42, 50, 58),
    height: fs(42, 50, 58),
    borderRadius: 100,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    marginRight: fs(8, 10, 10),
    flexShrink: 0,
    overflow: "hidden",
  },

  emergencyIcon: {
    color: COLORS.white,
    fontSize: fs(19, 23, 27),
    lineHeight: fs(24, 29, 33),
    fontWeight: "800",
    textAlign: "center",
  },

  emergencyTextBox: {
    flex: 1,
    minWidth: 0,
  },

  emergencyTitle: {
    color: COLORS.white,
    fontSize: fs(15, 17, 19),
    lineHeight: fs(20, 22, 25),
    fontWeight: "800",
    marginBottom: 2,
  },

  emergencyText: {
    color: COLORS.softWhite,
    fontSize: fs(10.5, 12, 13),
    lineHeight: fs(15, 17, 19),
    fontWeight: "400",
  },

  sosButton: {
    height: fs(40, 44, 50),
    minWidth: isSmallPhone ? "100%" : fs(102, 116, 136),
    borderRadius: 11,
    backgroundColor: COLORS.red,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: fs(10, 12, 14),
  },

  sosIcon: {
    color: COLORS.white,
    fontSize: fs(16, 19, 22),
    lineHeight: fs(21, 24, 28),
    fontWeight: "800",
    textAlign: "center",
  },

  sosText: {
    color: COLORS.white,
    fontSize: fs(13.5, 16, 18),
    fontWeight: "800",
  },

  detailHeroCard: {
    width: "100%",
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    paddingHorizontal: fs(12, 16, 18),
    paddingVertical: fs(16, 20, 22),
    alignItems: "center",
    overflow: "hidden",
  },

  detailIconCircle: {
    width: fs(54, 64, 74),
    height: fs(54, 64, 74),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: fs(10, 12, 12),
    overflow: "hidden",
  },

  detailHeroIcon: {
    fontSize: fs(24, 29, 34),
    lineHeight: fs(30, 36, 42),
    textAlign: "center",
  },

  detailTitle: {
    color: COLORS.white,
    fontSize: fs(18, 22, 24),
    lineHeight: fs(24, 28, 31),
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
    width: "100%",
  },

  detailSubTitle: {
    color: COLORS.cyan,
    fontSize: fs(12.5, 14, 16),
    lineHeight: fs(18, 20, 22),
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },

  detailDescription: {
    color: COLORS.softWhite,
    fontSize: fs(11.5, 13, 14),
    lineHeight: fs(18, 20, 22),
    textAlign: "center",
  },

  detailListCard: {
    width: "100%",
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  detailPointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: fs(9, 12, 14),
    paddingVertical: fs(11, 13, 14),
  },

  detailPointBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(65, 136, 255, 0.22)",
  },

  numberCircle: {
    width: fs(24, 27, 30),
    height: fs(24, 27, 30),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: fs(8, 10, 10),
    marginTop: 1,
    flexShrink: 0,
  },

  numberText: {
    color: COLORS.white,
    fontSize: fs(10.5, 12, 13),
    lineHeight: fs(14, 16, 17),
    fontWeight: "900",
  },

  detailPointText: {
    flex: 1,
    minWidth: 0,
    color: COLORS.softWhite,
    fontSize: fs(11.5, 13, 14),
    lineHeight: fs(18, 20, 22),
    fontWeight: "500",
  },

  warningDetailsCard: {
    width: "100%",
    borderRadius: CARD_RADIUS,
    backgroundColor: "rgba(255, 48, 72, 0.13)",
    borderWidth: 1,
    borderColor: "rgba(255, 48, 72, 0.35)",
    paddingHorizontal: fs(9, 12, 14),
    paddingVertical: fs(10, 12, 14),
    overflow: "hidden",
  },

  warningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  warningIcon: {
    fontSize: fs(13, 15, 17),
    lineHeight: fs(18, 20, 22),
    marginRight: 8,
    marginTop: 1,
    flexShrink: 0,
  },

  dangerText: {
    flex: 1,
    minWidth: 0,
    color: COLORS.softWhite,
    fontSize: fs(11.5, 13, 14),
    lineHeight: fs(18, 20, 22),
    fontWeight: "500",
  },

  quickActionCard: {
    marginTop: fs(18, 20, 22),
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card3,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: fs(10, 12, 14),
    paddingVertical: fs(12, 14, 16),
    flexDirection: isSmallPhone ? "column" : "row",
    alignItems: isSmallPhone ? "stretch" : "center",
    justifyContent: "space-between",
    gap: 12,
    overflow: "hidden",
  },

  quickActionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  quickActionIconCircle: {
    width: fs(40, 48, 54),
    height: fs(40, 48, 54),
    borderRadius: 100,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    marginRight: fs(8, 10, 10),
    flexShrink: 0,
    overflow: "hidden",
  },

  quickActionIcon: {
    color: COLORS.white,
    fontSize: fs(17, 21, 24),
    lineHeight: fs(23, 28, 32),
    fontWeight: "800",
    textAlign: "center",
  },

  quickActionTextBox: {
    flex: 1,
    minWidth: 0,
  },

  quickActionTitle: {
    color: COLORS.white,
    fontSize: fs(13.5, 16, 18),
    lineHeight: fs(19, 21, 23),
    fontWeight: "800",
    marginBottom: 2,
  },

  quickActionText: {
    color: COLORS.softWhite,
    fontSize: fs(10.5, 12, 13),
    lineHeight: fs(16, 18, 20),
    fontWeight: "400",
  },

  quickActionButton: {
    height: fs(40, 44, 48),
    minWidth: isSmallPhone ? "100%" : fs(100, 112, 126),
    borderRadius: 11,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  quickActionButtonText: {
    color: COLORS.white,
    fontSize: fs(13, 15, 16),
    fontWeight: "900",
  },

  bottomSpace: {
    height: Platform.OS === "ios" ? 52 : 46,
  },
});