


import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Platform,
} from "react-native";

const { width } = Dimensions.get("window");

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Onboarding");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#061A40" />
      <View style={styles.container}>

        {/* Logo + App Name */}
        <View style={styles.logoSection}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          {/* <View style={styles.appNameRow}>
            <Text style={styles.safe}>Safe</Text>
            <Text style={styles.ret}>Return</Text>
          </View> */}
          <Text style={styles.tagline}>BRINGING THEM BACK HOME</Text>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <View style={styles.starBadge}>
            <Text style={styles.star}>★</Text>
          </View>
          <View style={styles.line} />
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Helping families, police, NGOs and citizens report sightings,
          support missing person cases and build a safer India.
        </Text>

        {/* Feature Cards */}
        <View style={styles.featuresRow}>
          {[
            { icon: "🛡️", title: "REPORT", sub: "Sightings" },
            { icon: "🤝", title: "SUPPORT", sub: "Families" },
            { icon: "👥", title: "BUILD", sub: "Safety" },
          ].map((f) => (
            <View key={f.title} style={styles.card}>
              <View style={styles.iconCircle}>
                <Text style={styles.icon}>{f.icon}</Text>
              </View>
              <Text style={styles.cardTitle}>{f.title}</Text>
              <Text style={styles.cardSub}>{f.sub}</Text>
            </View>
          ))}
        </View>

        {/* India stripe */}
        <View style={styles.indiaStripe}>
          <View style={[styles.stripe, { backgroundColor: "#FF9933" }]} />
          <View style={[styles.stripe, { backgroundColor: "#FFFFFF" }]} />
          <View style={[styles.stripe, { backgroundColor: "#138808" }]} />
        </View>

        <Text style={styles.highlight}>Together, WeCan Make a Difference</Text>

        {/* Loader */}
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#F1C15A" />
          <Text style={styles.loadingText}>
            Loading <Text style={styles.loadingBrand}>SafeReturn</Text>...
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#061A40",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 22,
    paddingVertical: Platform.OS === "ios" ? 20 : 28,
    backgroundColor: "#061A40",
  },

  /* Logo */
  logoSection: {
    alignItems: "center",
  },
  logo: {
    width: width * 0.98,
    height: width * 0.98,
    marginBottom: -95,

  },

  tagline: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 6,
  },

  /* Divider */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  starBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1C15A",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  star: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  /* Description */
  description: {
    color: "#D6E8FF",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 22,
    textAlign: "center",
  },

  /* Cards */
  featuresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  card: {
    width: "31%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 16,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(96,165,250,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  icon: { fontSize: 22 },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  cardSub: {
    color: "#F1C15A",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },

  /* India stripe */
  indiaStripe: {
    flexDirection: "row",
    width: width * 0.6,
    height: 5,
    borderRadius: 10,
    overflow: "hidden",
  },
  stripe: { flex: 1 },

  highlight: {
    color: "#F1C15A",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },

  /* Loader */
  loader: { alignItems: "center" },
  loadingText: {
    color: "#D6E8FF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  loadingBrand: {
    color: "#F1C15A",
    fontWeight: "800",
  },
});






































