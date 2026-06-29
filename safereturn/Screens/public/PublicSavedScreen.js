

// Screens/public/PublicSavedScreen.js

import React, { useMemo } from "react";
import {
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeReturn } from "../../Screens/context/SafeReturnContext";

const { width } = Dimensions.get("window");

const isSmall = width < 380;
const isVerySmall = width < 350;

const COLORS = {
  bg: "#061A40",
  card: "rgba(255,255,255,0.055)",
  card2: "rgba(255,255,255,0.075)",
  border: "rgba(91,148,226,0.35)",
  white: "#FFFFFF",
  muted: "#8FAFD4",
  softWhite: "#D8E5FF",
  blue: "#1478FF",
  red: "#FF4D5F",
  green: "#00E884",
  amber: "#F59E0B",
};

function safeText(value, fallback = "Not provided") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function getCaseId(item = {}) {
  return String(item.id || item.caseNumber || item.reportId || item.name || "");
}

function getImage(item = {}) {
  return (
    item.image ||
    item.imageUri ||
    item.photoUri ||
    item.photo ||
    item.personImage ||
    item.missingPersonImage ||
    item.profileImage ||
    item.avatar ||
    ""
  );
}

function normalizeCase(item = {}) {
  return {
    ...item,
    id: item.id || item.caseNumber || item.reportId || Date.now().toString(),
    name: safeText(
      item.name || item.personName || item.missingPersonName || item.fullName,
      "Unknown Person"
    ),
    type: safeText(item.type || item.reportType || item.category || "Missing Person"),
    age: safeText(item.age || item.personAge || item.missingPersonAge),
    gender: safeText(item.gender || item.sex),
    location: safeText(
      item.location || item.lastSeenPlace || item.lastSeenLocation || item.address
    ),
    lastSeenPlace: safeText(
      item.lastSeenPlace || item.lastSeenLocation || item.location || item.address
    ),
    date: safeText(item.date || item.createdAt || item.reportedAt),
    status: safeText(item.status || item.reportStatus || "Active"),
    caseNumber: safeText(item.caseNumber || item.id || item.reportId),
    guardianName: safeText(item.guardianName || item.parentName || item.contactPerson),
    contactNumber: safeText(
      item.contactNumber || item.phoneNumber || item.mobile || item.phone
    ),
    image: getImage(item),
    color: item.color || COLORS.blue,
    savedAt: item.savedAt || item.updatedAt || item.createdAt || new Date().toISOString(),
  };
}

function formatSavedDate(value) {
  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Saved";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Saved";
  }
}

export default function PublicSavedScreen({ navigation }) {
  const {
    savedPersons = [],
    alerts = [],
    alertUnreadCount = 0,
    toggleSavedPerson,
  } = useSafeReturn();

  const alertCount = alertUnreadCount;

  const savedCases = useMemo(() => {
    const source = Array.isArray(savedPersons) ? savedPersons : [];

    const uniqueMap = new Map();

    source.map(normalizeCase).forEach((item) => {
      const id = getCaseId(item);
      if (id && !uniqueMap.has(id)) {
        uniqueMap.set(id, item);
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => {
      const aTime = new Date(a.savedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.savedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [savedPersons]);

  const latestSavedText = useMemo(() => {
    if (!savedCases.length) return "No saved cases yet";
    return formatSavedDate(savedCases[0]?.savedAt);
  }, [savedCases]);

  const goTo = (screen, params) => {
    if (navigation && screen) {
      navigation.navigate(screen, params);
    }
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    goTo("PublicProfile");
  };

  const openDetails = (person) => {
    goTo("MissingPersonDetails", { person });
  };

  const removeSavedCase = (person) => {
    toggleSavedPerson?.(person);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={goBack}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Important Cases</Text>
            <Text style={styles.headerSubtitle}>Saved missing person alerts</Text>
          </View>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => goTo("PublicAlerts")}
            activeOpacity={0.85}
          >
            <Ionicons name="notifications-outline" size={21} color={COLORS.white} />

            {alertCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {alertCount > 9 ? "9+" : alertCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="heart" size={34} color={COLORS.white} />
            </View>

            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle}>Saved Important Cases</Text>
              <Text style={styles.heroSubtitle}>
                Cases you saved from reports and person details screen.
              </Text>
            </View>

            <View style={styles.totalBox}>
              <Text style={styles.totalNumber}>{savedCases.length}</Text>
              <Text style={styles.totalLabel}>Saved</Text>
            </View>
          </View>

          <View style={styles.latestCard}>
            <View style={styles.latestLeft}>
              <Ionicons name="time-outline" size={18} color={COLORS.amber} />
              <Text style={styles.latestLabel}>Latest Saved</Text>
            </View>

            <Text style={styles.latestText} numberOfLines={1}>
              {latestSavedText}
            </Text>
          </View>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Saved Cases</Text>
            <Text style={styles.countText}>
              {savedCases.length} case{savedCases.length === 1 ? "" : "s"}
            </Text>
          </View>

          {savedCases.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons
                  name="heart-broken-outline"
                  size={48}
                  color={COLORS.red}
                />
              </View>

              <Text style={styles.emptyTitle}>No Important Cases Saved</Text>

              <Text style={styles.emptySubtitle}>
                Tap the bookmark icon on any missing person report to save it here.
              </Text>

              <TouchableOpacity
                style={styles.emptyButton}
                activeOpacity={0.88}
                onPress={() => goTo("PublicReports")}
              >
                <Ionicons name="search" size={18} color={COLORS.white} />
                <Text style={styles.emptyButtonText}>Browse Reports</Text>
              </TouchableOpacity>
            </View>
          ) : (
            savedCases.map((item) => (
              <SavedCaseCard
                key={getCaseId(item)}
                item={item}
                onPress={() => openDetails(item)}
                onRemove={() => removeSavedCase(item)}
              />
            ))
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <BottomNavigation goTo={goTo} active="Profile" alertCount={alertCount} />
      </SafeAreaView>
    </View>
  );
}

function SavedCaseCard({ item, onPress, onRemove }) {
  const image = getImage(item);

  return (
    <TouchableOpacity style={styles.caseCard} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.caseImage} />
        ) : (
          <View style={styles.caseImagePlaceholder}>
            <Ionicons name="person-outline" size={54} color={COLORS.muted} />
          </View>
        )}

        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: item.color || COLORS.blue }]} />
          <Text style={styles.statusText} numberOfLines={1}>
            {item.status}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.removeBtn}
          activeOpacity={0.85}
          onPress={onRemove}
        >
          <Ionicons name="heart" size={19} color={COLORS.red} />
        </TouchableOpacity>
      </View>

      <View style={styles.caseBody}>
        <View style={styles.caseTopRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.caseName} numberOfLines={1}>
              {item.name}
            </Text>

            <Text style={styles.caseType} numberOfLines={1}>
              {item.type} • {item.age} • {item.gender}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </View>

        <InfoRow icon="map-pin" value={item.location} />
        <InfoRow icon="clock" value={item.lastSeenPlace} />
        <InfoRow icon="phone" value={item.contactNumber} />
        <InfoRow icon="file-text" value={item.caseNumber} />

        <View style={styles.savedDatePill}>
          <Ionicons name="bookmark" size={14} color={COLORS.green} />
          <Text style={styles.savedDateText}>
            Saved on {formatSavedDate(item.savedAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function InfoRow({ icon, value }) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={13} color={COLORS.muted} />
      <Text style={styles.infoText} numberOfLines={1}>
        {safeText(value)}
      </Text>
    </View>
  );
}

function BottomNavigation({ goTo, active, alertCount }) {
  const badge =
    alertCount && alertCount > 0
      ? alertCount > 9
        ? "9+"
        : String(alertCount)
      : "";

  return (
    <View style={styles.bottomNav}>
      <BottomItem
        icon="home-outline"
        label="Home"
        active={active === "Home"}
        onPress={() => goTo("PublicHome")}
      />

      <BottomItem
        icon="document-text-outline"
        label="Reports"
        active={active === "Reports"}
        onPress={() => goTo("PublicReports")}
      />

      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.fabButton}
        onPress={() => goTo("ReportMissingStep1")}
      >
        <Ionicons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>

      <BottomItem
        icon="notifications-outline"
        label="Alerts"
        badge={badge}
        active={active === "Alerts"}
        onPress={() => goTo("PublicAlerts")}
      />

      <BottomItem
        icon="person-outline"
        label="Profile"
        active={active === "Profile"}
        onPress={() => goTo("PublicProfile")}
      />
    </View>
  );
}

function BottomItem({ icon, label, active, badge, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.bottomItem} onPress={onPress}>
      <View>
        <Ionicons
          name={icon}
          size={23}
          color={active ? COLORS.blue : COLORS.muted}
        />

        {!!badge && (
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>{badge}</Text>
          </View>
        )}
      </View>

      <Text
        style={[styles.bottomLabel, active && styles.bottomLabelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  header: {
    height: Platform.OS === "ios" ? 76 : 72,
    paddingHorizontal: 14,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.red,
    borderWidth: 2,
    borderColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },

  headerBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "900",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: isSmall ? 18 : 21,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: COLORS.muted,
    fontSize: isSmall ? 11 : 12,
    fontWeight: "700",
    marginTop: 2,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 118 : 104,
  },

  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },

  heroIcon: {
    width: isSmall ? 56 : 64,
    height: isSmall ? 56 : 64,
    borderRadius: 22,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  heroTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: isVerySmall ? 16 : isSmall ? 17 : 20,
    fontWeight: "900",
  },

  heroSubtitle: {
    color: COLORS.muted,
    fontSize: isSmall ? 11.5 : 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 4,
  },

  totalBox: {
    minWidth: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  totalNumber: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
  },

  totalLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
  },

  latestCard: {
    marginTop: 12,
    backgroundColor: "rgba(255,77,95,0.13)",
    borderWidth: 1,
    borderColor: "rgba(255,77,95,0.32)",
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  latestLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  latestLabel: {
    color: COLORS.white,
    fontSize: 12.5,
    fontWeight: "900",
    marginLeft: 7,
  },

  latestText: {
    flex: 1,
    color: "#FFD0D6",
    textAlign: "right",
    marginLeft: 10,
    fontSize: 12,
    fontWeight: "800",
  },

  sectionRow: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "900",
  },

  countText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "800",
  },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 42,
    paddingHorizontal: 18,
    alignItems: "center",
  },

  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.045)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 18,
    textAlign: "center",
  },

  emptySubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
  },

  emptyButton: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 17,
    backgroundColor: COLORS.red,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 8,
  },

  caseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    overflow: "hidden",
  },

  imageWrap: {
    height: isSmall ? 190 : 220,
    backgroundColor: COLORS.card2,
  },

  caseImage: {
    width: "100%",
    height: "100%",
  },

  caseImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.card2,
    alignItems: "center",
    justifyContent: "center",
  },

  statusBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    maxWidth: "74%",
    backgroundColor: "rgba(0,0,0,0.48)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },

  removeBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.48)",
    alignItems: "center",
    justifyContent: "center",
  },

  caseBody: {
    padding: 14,
  },

  caseTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  caseName: {
    color: COLORS.white,
    fontSize: isSmall ? 16 : 18,
    fontWeight: "900",
  },

  caseType: {
    color: COLORS.red,
    fontSize: isSmall ? 11.5 : 12.5,
    fontWeight: "800",
    marginTop: 3,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },

  infoText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: isSmall ? 11.5 : 12.5,
    fontWeight: "700",
    marginLeft: 7,
  },

  savedDatePill: {
    alignSelf: "flex-start",
    marginTop: 13,
    backgroundColor: "rgba(0,232,132,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,232,132,0.28)",
    borderRadius: 100,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  savedDateText: {
    color: COLORS.green,
    fontSize: 11.5,
    fontWeight: "900",
    marginLeft: 6,
  },

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: Platform.OS === "ios" ? 92 : 78,
    backgroundColor: "rgba(5,25,65,0.98)",
    borderTopWidth: 1.2,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: Platform.OS === "ios" ? 16 : 7,
    paddingTop: 8,
  },

  bottomItem: {
    width: "18%",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomLabel: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 9 : isSmall ? 10 : 11,
    fontWeight: "800",
    marginTop: 4,
  },

  bottomLabelActive: {
    color: COLORS.blue,
  },

  fabButton: {
    width: isVerySmall ? 54 : isSmall ? 58 : 64,
    height: isVerySmall ? 54 : isSmall ? 58 : 64,
    borderRadius: 32,
    backgroundColor: COLORS.blue,
    borderWidth: 3,
    borderColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -32,
  },

  navBadge: {
    position: "absolute",
    top: -8,
    right: -9,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(5,25,65,0.98)",
    paddingHorizontal: 3,
  },

  navBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "900",
  },
});
