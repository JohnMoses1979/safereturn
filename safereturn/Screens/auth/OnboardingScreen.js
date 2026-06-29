
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
} from "react-native";

const { width, height } = Dimensions.get("window");

/*
  IMPORTANT:
  Your Stack.Screen name must be same as this.
  Example:
  <Stack.Screen name="RegistrationScreen" component={RegistrationScreen} />
*/
const REGISTRATION_ROUTE = "PublicRegister";

const onboardingData = [
  {
    id: "1",
    image: require("../../assets/images/onboarding1.png"),
    logo: require("../../assets/images/onboardinglogo1.png"),
    title: "Find Missing\nLoved Ones Faster",
    description:
      "Helping families report missing children and elderly persons quickly and safely.",
    points: [
      {
        icon: "🛡️",
        title: "Verified alerts",
        text: "All reports are reviewed for accuracy and authenticity.",
      },
      {
        icon: "⏱️",
        title: "Fast reporting",
        text: "Report missing loved ones in minutes with an easy process.",
      },
      {
        icon: "👥",
        title: "Community support",
        text: "Connect with trusted people and local authorities in real-time.",
      },
    ],
  },
  {
    id: "2",
    image: require("../../assets/images/onboarding2.png"),
    logo: require("../../assets/images/onboardinglogo2.png"),
    title: "Report Sightings\nSecurely",
    description:
      "Citizens can share trusted sightings with location, photo and time details.",
    points: [
      {
        icon: "⚡",
        title: "Quick updates",
        text: "Send real-time sightings in just a few taps.",
      },
      {
        icon: "🔒",
        title: "Private & safe",
        text: "Sensitive details are reviewed and shared responsibly.",
      },
      {
        icon: "📍",
        title: "Location support",
        text: "Add place and time information for better tracking.",
      },
    ],
  },
  {
    id: "3",
    image: require("../../assets/images/onboarding3.png"),
    logo: require("../../assets/images/onboardinglogo3.png"),
    title: "Support Families\n& Authorities",
    description:
      "Families, NGOs and police can work together through verified case updates.",
    points: [
      {
        icon: "🤝",
        title: "Trusted collaboration",
        text: "Families, NGOs and police stay connected.",
      },
      {
        icon: "📋",
        title: "Case tracking",
        text: "Follow updates and progress clearly.",
      },
      {
        icon: "🏛️",
        title: "Safer communities",
        text: "Build awareness and faster response together.",
      },
    ],
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const openPublicRegistration = () => {
    navigation.replace(REGISTRATION_ROUTE);
  };

  const openLogin = () => {
    navigation.navigate("LoginScreen");
  };

  const goNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      openPublicRegistration();
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const item = onboardingData[currentIndex];

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ImageBackground source={item.image} style={styles.bg} resizeMode="cover">
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topSection}>
            <Image
              source={item.logo}
              style={styles.onboardLogo}
              resizeMode="contain"
            />

            <Text style={styles.appName}>
              <Text style={styles.appSafe}>Safe</Text>
              <Text style={styles.appReturn}>Return</Text>
            </Text>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          <View style={styles.spacer} />

          <View style={styles.bottomSection}>
            <View style={styles.infoCard}>
              {item.points.map((point, index) => (
                <View
                  key={point.title}
                  style={[
                    styles.pointRow,
                    index !== item.points.length - 1 && styles.pointBorder,
                  ]}
                >
                  <View style={styles.iconCircle}>
                    <Text style={styles.pointIcon}>{point.icon}</Text>
                  </View>

                  <View style={styles.pointTextBox}>
                    <Text style={styles.pointTitle}>{point.title} —</Text>
                    <Text style={styles.pointText}>{point.text}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.navBar}>
              <TouchableOpacity
                onPress={currentIndex === 0 ? openLogin : goBack}
                style={styles.sideBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.skipText}>
                  {currentIndex === 0 ? "Login" : "Back"}
                </Text>
              </TouchableOpacity>

              <View style={styles.dotsRow}>
                {onboardingData.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      currentIndex === i && styles.activeDot,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={goNext}
                style={styles.nextBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.nextText}>
                  {currentIndex === onboardingData.length - 1
                    ? "Get Started"
                    : "Next"}
                </Text>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => navigation?.navigate?.("LoginScreen")}
              style={styles.officerAccessBtn}
            >
              <Text style={styles.officerAccessText}>
                Police officer? Login with assigned credentials
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#061A40",
  },

  bg: {
    flex: 1,
    width,
    height,
  },

 
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  topSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 12,
  },

  onboardLogo: {
    width: width * 0.45,
    height: width * 0.35,
    marginBottom: -40,
  },

  appName: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
  },

  appSafe: {
    color: "#FFFFFF",
  },

  appReturn: {
    color: "#3B9EFF",
  },

  title: {
    color: "#FFFFFF",
    fontSize: width < 380 ? 28 : 34,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: width < 380 ? 35 : 42,
    letterSpacing: -0.3,
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  description: {
    marginTop: 6,
    color: "#C8DFFF",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 10,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },

  spacer: {
    flex: 1,
  },

  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 28 : 18,
  },

  infoCard: {
    backgroundColor: "rgba(4, 16, 50, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(49,151,255,0.40)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
    shadowColor: "#1E6FFF",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  pointRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  pointBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.09)",
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(30,144,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(96,190,255,0.30)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  pointIcon: {
    fontSize: 19,
  },

  pointTextBox: {
    flex: 1,
  },

  pointTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 2,
  },

  pointText: {
    color: "#B0CFFF",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
  },

  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },

  sideBtn: {
    minWidth: 60,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  skipText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 17,
    fontWeight: "700",
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.28)",
  },

  activeDot: {
    width: 28,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1E90FF",
    shadowColor: "#1E90FF",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },

  nextBtn: {
    height: 52,
    borderRadius: 15,
    backgroundColor: "#1460EE",
    borderWidth: 1.5,
    borderColor: "rgba(140,200,255,0.55)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    shadowColor: "#1E6FFF",
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },

  nextText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  arrow: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    marginLeft: 6,
    marginTop: -1,
  },

  officerAccessBtn: {
    alignSelf: "center",
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  officerAccessText: {
    color: "rgba(223,238,255,0.82)",
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

