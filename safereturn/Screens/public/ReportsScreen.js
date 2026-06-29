


// Screens/public/ReportsScreen.js

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeReturn } from "../../Screens/context/SafeReturnContext";

const { width, height } = Dimensions.get("window");

const isSmall = width < 380;
const isVerySmall = width < 350;
const isTinyHeight = height < 700;

const COLORS = {
  bg: "#03102B",
  bg2: "#061A40",
  card: "rgba(255,255,255,0.055)",
  cardStrong: "rgba(5,25,65,0.82)",
  border: "rgba(91,148,226,0.30)",
  borderStrong: "rgba(91,148,226,0.45)",
  gold: "#F1C15A",
  white: "#FFFFFF",
  muted: "#AFC4E8",
  soft: "#C8D8F4",
  blue: "#2F8CFF",
  blue2: "#4C9EFF",
  red: "#FF4058",
  green: "#19C970",
  cyan: "#20D4FF",
  yellow: "#FACC15",
};

const FILTERS = ["All", "Children", "Adults", "Seniors", "Today", "Reward"];

function getAgeNumber(age) {
  const parsed = parseInt(String(age || "").replace(/\D/g, ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getCategoryFromAge(age) {
  const value = getAgeNumber(age);

  if (value > 0 && value < 18) return "Children";
  if (value >= 60) return "Seniors";
  return "Adults";
}

function getRewardNumber(value) {
  const cleaned = String(value || "").replace(/[^0-9]/g, "");
  const parsed = parseInt(cleaned, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isCreatedToday(createdAt) {
  if (!createdAt) return true;

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) return true;

  return date.toDateString() === new Date().toDateString();
}

function getPersonImage(person) {
  return (
    person?.image ||
    person?.photoUrl ||
    person?.photoUri ||
    person?.imageUri ||
    person?.personImage ||
    person?.missingPersonImage ||
    ""
  );
}

function getPersonName(person) {
  return (
    person?.name ||
    person?.fullName ||
    person?.personName ||
    person?.missingPersonName ||
    "Unknown Person"
  );
}

function getPersonLocation(person) {
  return (
    person?.location ||
    person?.lastSeenPlace ||
    person?.address ||
    "Location not provided"
  );
}

function getPersonTime(person, formatTimeAgo) {
  return (
    person?.time ||
    person?.reportedTime ||
    person?.lastSeenTimeShort ||
    (person?.createdAt ? formatTimeAgo(person.createdAt) : "Just now")
  );
}

function normalizeReportForScreen(person, formatTimeAgo) {
  const age = person?.age || "Age N/A";
  const rewardAmount = getRewardNumber(
    person?.rewardAmount ||
    person?.reward ||
    person?.rewardMoney ||
    person?.rewardValue ||
    person?.rewardText
  );

  return {
    ...person,
    id: person?.id || person?.reportId || `${Date.now()}`,
    reportId: person?.reportId || person?.id || `${Date.now()}`,
    name: getPersonName(person),
    age,
    gender: person?.gender || "Gender N/A",
    location: getPersonLocation(person),
    time: getPersonTime(person, formatTimeAgo),
    image: getPersonImage(person),
    category: person?.category || getCategoryFromAge(age),
    isToday:
      person?.isToday !== undefined
        ? person.isToday
        : isCreatedToday(person?.createdAt),
    isNew:
      person?.isNew !== undefined
        ? person.isNew
        : isCreatedToday(person?.createdAt),
    rewardAmount,
    rewardCurrency: person?.rewardCurrency || "INR",
    rewardText:
      person?.rewardText ||
      (rewardAmount > 0 ? `₹${rewardAmount}` : "No reward added"),
    rewardEnabled:
      person?.rewardEnabled !== undefined
        ? person.rewardEnabled
        : rewardAmount > 0,
    height: person?.height || "Not provided",
    weight: person?.weight || "Not provided",
    complexion: person?.complexion || "Not provided",
    hairColor: person?.hairColor || "Not provided",
    eyeColor: person?.eyeColor || "Not provided",
    bodyType: person?.bodyType || "Not provided",
    physicalDetails: person?.physicalDetails || "",
    otherDetails: person?.otherDetails || "",
    description:
      person?.description ||
      [person?.physicalDetails, person?.otherDetails].filter(Boolean).join(" ") ||
      "No extra details provided.",
    identificationMarks:
      person?.identificationMarks || person?.physicalDetails || "Not provided",
    reporterName: person?.reporterName || person?.guardianName || "Not provided",
    guardianName: person?.guardianName || person?.reporterName || "Not provided",
    relationship: person?.relationship || person?.relation || "Not provided",
    relation: person?.relation || person?.relationship || "Not provided",
    contactNumber:
      person?.contactNumber || person?.phoneNumber || person?.phone || "Not provided",
    phoneNumber:
      person?.phoneNumber || person?.contactNumber || person?.phone || "Not provided",
    emailAddress: person?.emailAddress || "",
    lastSeenDate: person?.lastSeenDate || person?.date || "",
    lastSeenTime: person?.lastSeenTime || person?.missingTime || "",
    lastSeen: person?.lastSeen || "",
    lastSeenPlace: person?.lastSeenPlace || person?.address || "",
    address: person?.address || person?.lastSeenPlace || "",
    city: person?.city || "",
    state: person?.state || person?.stateName || "",
    pincode: person?.pincode || "",
    photoUrl: person?.photoUrl || person?.image || "",
    createdAt: person?.createdAt || new Date().toISOString(),
    status: person?.status || "Published",
  };
}

export default function ReportsScreen({ navigation, route }) {
  const {
    myReports = [],
    communityReports = [],
    alerts = [],
    alertUnreadCount = 0,
    formatTimeAgo,
  } = useSafeReturn();

  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [sortType, setSortType] = useState("Latest");
  const [activeTab, setActiveTab] = useState("Community"); // "Community" or "My"

  // Pre-select tab if passed from profile screen
  React.useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route?.params?.tab]);

  React.useEffect(() => {
    if (route?.params?.tab) return;

    const hasMyReports = Array.isArray(myReports) && myReports.length > 0;
    const hasCommunityReports = Array.isArray(communityReports) && communityReports.length > 0;

    if (activeTab === "Community" && hasMyReports && !hasCommunityReports) {
      setActiveTab("My");
    }
  }, [route?.params?.tab, myReports, communityReports, activeTab]);

  const alertCount = alertUnreadCount;

  const sourceReports = useMemo(() => {
    if (activeTab === "My") {
      return Array.isArray(myReports) ? myReports : [];
    } else {
      return Array.isArray(communityReports) ? communityReports : [];
    }
  }, [activeTab, myReports, communityReports]);

  const reports = useMemo(() => {
    return sourceReports.map((item) =>
      normalizeReportForScreen(
        item,
        typeof formatTimeAgo === "function" ? formatTimeAgo : () => "Just now"
      )
    );
  }, [sourceReports, formatTimeAgo]);

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate?.("PublicHome");
  };

  const goTo = (screen, params) => {
    if (navigation && screen) {
      navigation.navigate(screen, params);
    }
  };

  const goToAlerts = () => {
    navigation?.navigate?.("Alerts", {
      screen: "AlertsMain",
    });
  };

  const goToProfile = () => {
    navigation?.navigate?.("Profile", {
      screen: "ProfileMain",
    });
  };

  const filteredPersons = useMemo(() => {
    const text = searchText.trim().toLowerCase();

    const filtered = reports.filter((person) => {
      const name = String(person.name || "").toLowerCase();
      const age = String(person.age || "").toLowerCase();
      const gender = String(person.gender || "").toLowerCase();
      const location = String(person.location || "").toLowerCase();
      const status = String(person.status || "").toLowerCase();
      const rewardAmount = Number(person.rewardAmount || 0);
      const rewardText = String(person.rewardText || "").toLowerCase();

      const matchesSearch =
        !text ||
        name.includes(text) ||
        age.includes(text) ||
        gender.includes(text) ||
        location.includes(text) ||
        status.includes(text) ||
        rewardText.includes(text) ||
        String(rewardAmount).includes(text) ||
        `reward ${rewardAmount}`.includes(text);

      const matchesFilter =
        selectedFilter === "All" ||
        person.category === selectedFilter ||
        (selectedFilter === "Today" && person.isToday) ||
        (selectedFilter === "Reward" && rewardAmount > 0);

      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();

      if (sortType === "Latest") return bTime - aTime;
      return aTime - bTime;
    });
  }, [reports, searchText, selectedFilter, sortType]);

  const toggleSort = () => {
    setSortType((prev) => (prev === "Latest" ? "Oldest" : "Latest"));
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.backButton}
              onPress={goBack}
            >
              <Ionicons name="chevron-back" size={25} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.brandRow}>
              <View style={styles.logoBox}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.brandTextBox}>
                <Text style={styles.brandTitle} numberOfLines={1}>
                  Safe<Text style={styles.brandBlue}>Return</Text>
                </Text>

                <Text style={styles.brandSub} numberOfLines={1}>
                  Missing Person Network
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.bellButton}
              onPress={goToAlerts}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />

              {alertCount > 0 && (
                <View style={styles.topBadge}>
                  <Text style={styles.badgeText}>
                    {alertCount > 9 ? "9+" : alertCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.pageTitle}>Recently Reported</Text>

          <Text style={styles.pageSub}>
            Browse newly reported missing persons in your community.
          </Text>

          {/* My Reports vs Community Reports Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.tabButton, activeTab === "Community" && styles.tabButtonActive]}
              onPress={() => setActiveTab("Community")}
            >
              <Ionicons
                name="people-outline"
                size={16}
                color={activeTab === "Community" ? COLORS.white : COLORS.muted}
              />
              <Text style={[styles.tabButtonText, activeTab === "Community" && styles.tabButtonTextActive]}>
                Community Cases
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.tabButton, activeTab === "My" && styles.tabButtonActive]}
              onPress={() => setActiveTab("My")}
            >
              <Ionicons
                name="clipboard-outline"
                size={16}
                color={activeTab === "My" ? COLORS.white : COLORS.muted}
              />
              <Text style={[styles.tabButtonText, activeTab === "My" && styles.tabButtonTextActive]}>
                My Cases
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Feather name="search" size={18} color={COLORS.muted} />

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              style={styles.searchInput}
              placeholder="Search name, age, location, reward"
              placeholderTextColor="#8299C4"
              autoCapitalize="none"
              autoCorrect={false}
              cursorColor={COLORS.blue}
              selectionColor={COLORS.blue}
            />

            {searchText.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setSearchText("")}
              >
                <Ionicons name="close-circle" size={18} color={COLORS.muted} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {FILTERS.map((filter) => {
              const active = selectedFilter === filter;

              return (
                <TouchableOpacity
                  key={filter}
                  activeOpacity={0.85}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>
              {filteredPersons.length} Result
              {filteredPersons.length !== 1 ? "s" : ""}
            </Text>

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.sortButton}
              onPress={toggleSort}
            >
              <Text style={styles.sortText}>{sortType}</Text>
              <Ionicons name="swap-vertical" size={15} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.listWrapper}>
            {filteredPersons.map((person) => (
              <ReportedPersonCard
                key={person.id}
                person={person}
                onPress={() => goTo("PersonDetails", { person })}
              />
            ))}
          </View>

          {filteredPersons.length === 0 && (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}>
                <Ionicons
                  name={
                    reports.length === 0
                      ? "person-add-outline"
                      : "search-outline"
                  }
                  size={30}
                  color={COLORS.blue2}
                />
              </View>

              <Text style={styles.emptyTitle}>
                {reports.length === 0 ? "No reports yet" : "No reports found"}
              </Text>

              <Text style={styles.emptySub}>
                {reports.length === 0
                  ? "Submit a missing person report to see it here."
                  : "Try another name, age, location, reward, or filter."}
              </Text>

              {reports.length === 0 && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.emptyButton}
                  onPress={() => goTo("ReportMissingStep1")}
                >
                  <Ionicons name="add" size={17} color={COLORS.white} />
                  <Text style={styles.emptyButtonText}>Report Missing</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomNav}>
          <BottomItem
            icon="home-outline"
            label="Home"
            onPress={() => goTo("PublicHome")}
          />

          <BottomItem
            active
            icon="document-text-outline"
            label="Reports"
            onPress={() => goTo("PublicReports")}
          />

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.fabButton}
            onPress={() => goTo("ReportMissingStep1")}
          >
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>

          <BottomItem
            icon="notifications-outline"
            label="Alerts"
            badge={
              alertCount > 0 ? (alertCount > 9 ? "9+" : String(alertCount)) : ""
            }
            onPress={goToAlerts}
          />

          <BottomItem
            icon="person-outline"
            label="Profile"
            onPress={goToProfile}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function ReportedPersonCard({ person, onPress }) {
  const rewardAmount = Number(person.rewardAmount || 0);

  return (
    <View style={styles.personCard}>
      <View style={styles.imageWrap}>
        {person.image ? (
          <Image source={{ uri: person.image }} style={styles.personImage} />
        ) : (
          <View style={styles.personImagePlaceholder}>
            <Ionicons name="person-outline" size={32} color={COLORS.muted} />
          </View>
        )}

        {String(person.status || "").toLowerCase() === "resolved" ? (
          <View style={[styles.newBadge, { backgroundColor: COLORS.green }]}>
            <Text style={styles.newBadgeText}>FOUND</Text>
          </View>
        ) : (person.isNew || String(person.status || "").toLowerCase() === "published") ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        ) : null}

        {rewardAmount > 0 && (
          <View style={styles.imageRewardBadge}>
            <Ionicons name="gift" size={11} color={COLORS.bg} />
          </View>
        )}
      </View>

      <View style={styles.personInfo}>
        <Text style={styles.personName} numberOfLines={1}>
          {person.name}
        </Text>

        <Text style={styles.personMeta} numberOfLines={1}>
          {person.age}  •  {person.gender}
        </Text>

        {rewardAmount > 0 && (
          <View style={styles.rewardBadge}>
            <Ionicons name="gift-outline" size={13} color={COLORS.yellow} />
            <Text style={styles.rewardText} numberOfLines={1}>
              Reward ₹{rewardAmount}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="location-sharp" size={13} color={COLORS.red} />

          <Text style={styles.infoText} numberOfLines={1}>
            {person.location}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={13} color={COLORS.muted} />

          <Text style={styles.infoText} numberOfLines={1}>
            {person.time}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.detailButton}
        onPress={onPress}
      >
        <Text style={styles.detailButtonText}>View{"\n"}Details</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
      </TouchableOpacity>
    </View>
  );
}

function BottomItem({ icon, label, active, badge, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.bottomItem}
      onPress={onPress}
    >
      <View>
        <Ionicons
          name={icon}
          size={23}
          color={active ? COLORS.blue2 : COLORS.muted}
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

const H_PAD = isVerySmall ? 14 : isSmall ? 15 : 16;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingTop: Platform.OS === "android" ? 14 : 8,
    paddingBottom: Platform.OS === "ios" ? 110 : 96,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: isTinyHeight ? 18 : 24,
  },

  backButton: {
    width: isVerySmall ? 42 : 46,
    height: isVerySmall ? 42 : 46,
    borderRadius: 23,
    borderWidth: 1.4,
    borderColor: COLORS.borderStrong,
    backgroundColor: "rgba(255,255,255,0.035)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  logoBox: {
    width: isVerySmall ? 42 : isSmall ? 46 : 50,
    height: isVerySmall ? 42 : isSmall ? 46 : 50,
    borderRadius: isVerySmall ? 13 : 16,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: isVerySmall ? 9 : 11,
    overflow: "hidden",
  },

  logoImage: {
    width: "100%",
    height: "100%",
  },

  brandTextBox: {
    flex: 1,
    minWidth: 0,
  },

  brandTitle: {
    color: COLORS.white,
    fontSize: isVerySmall ? 18 : isSmall ? 20 : 23,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  brandBlue: {
    color: COLORS.gold,
  },

  brandSub: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 10 : 11,
    fontWeight: "700",
    marginTop: 2,
  },

  bellButton: {
    width: isVerySmall ? 42 : 46,
    height: isVerySmall ? 42 : 46,
    borderRadius: 23,
    borderWidth: 1.4,
    borderColor: COLORS.borderStrong,
    backgroundColor: "rgba(255,255,255,0.035)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  topBadge: {
    position: "absolute",
    top: -2,
    right: -2,
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

  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
  },

  pageTitle: {
    color: COLORS.white,
    fontSize: isVerySmall ? 24 : isSmall ? 28 : 34,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginBottom: 7,
  },

  pageSub: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 12 : 13,
    fontWeight: "600",
    lineHeight: isVerySmall ? 18 : 20,
    marginBottom: 18,
  },

  searchBox: {
    height: isVerySmall ? 46 : isSmall ? 50 : 56,
    borderRadius: isVerySmall ? 14 : 17,
    backgroundColor: "rgba(5,25,65,0.72)",
    borderWidth: 1.2,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: isVerySmall ? 13 : 16,
    marginBottom: 14,
    gap: 10,
  },

  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: isVerySmall ? 13 : isSmall ? 14 : 15,
    fontWeight: "600",
    paddingVertical: 0,
  },

  filterScroll: {
    gap: isVerySmall ? 8 : 10,
    paddingRight: 4,
    marginBottom: 14,
  },

  filterPill: {
    height: isVerySmall ? 36 : isSmall ? 38 : 42,
    paddingHorizontal: isVerySmall ? 14 : 17,
    borderRadius: isVerySmall ? 18 : 21,
    backgroundColor: "rgba(5,25,65,0.70)",
    borderWidth: 1.2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  filterPillActive: {
    backgroundColor: "#1460EE",
    borderColor: COLORS.blue2,
  },

  filterText: {
    color: COLORS.soft,
    fontSize: isVerySmall ? 12 : 13,
    fontWeight: "900",
  },

  filterTextActive: {
    color: COLORS.white,
  },

  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  resultsText: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 13 : 14,
    fontWeight: "900",
  },

  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  sortText: {
    color: COLORS.soft,
    fontSize: isVerySmall ? 13 : 14,
    fontWeight: "900",
  },

  listWrapper: {
    gap: isVerySmall ? 10 : 12,
  },

  personCard: {
    borderRadius: isVerySmall ? 16 : 18,
    backgroundColor: "rgba(5,25,65,0.72)",
    borderWidth: 1.2,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    padding: isVerySmall ? 10 : 12,
    gap: isVerySmall ? 10 : 12,
  },

  imageWrap: {
    width: isVerySmall ? 80 : isSmall ? 88 : 96,
    height: isVerySmall ? 80 : isSmall ? 88 : 96,
    borderRadius: isVerySmall ? 12 : 14,
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: "rgba(255,255,255,0.08)",
    position: "relative",
  },

  personImage: {
    width: "100%",
    height: "100%",
  },

  personImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  newBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: COLORS.red,
    paddingHorizontal: isVerySmall ? 5 : 7,
    paddingVertical: 3,
    borderRadius: 5,
  },

  newBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "900",
  },

  imageRewardBadge: {
    position: "absolute",
    left: 5,
    bottom: 5,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(5,25,65,0.95)",
  },

  personInfo: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },

  personName: {
    color: COLORS.white,
    fontSize: isVerySmall ? 14 : isSmall ? 15 : 17,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 3,
  },

  personMeta: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 11 : 12,
    fontWeight: "700",
    marginBottom: 6,
  },

  rewardBadge: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.50)",
    backgroundColor: "rgba(250,204,21,0.12)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 5,
  },

  rewardText: {
    color: COLORS.yellow,
    fontSize: isVerySmall ? 10.5 : 11.5,
    fontWeight: "900",
    marginLeft: 4,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },

  infoText: {
    color: COLORS.soft,
    fontSize: isVerySmall ? 11 : 12,
    fontWeight: "600",
    flex: 1,
  },

  detailButton: {
    width: isVerySmall ? 72 : isSmall ? 80 : 88,
    height: isVerySmall ? 52 : isSmall ? 56 : 62,
    borderRadius: isVerySmall ? 12 : 14,
    backgroundColor: "rgba(5,25,65,0.70)",
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: isVerySmall ? 6 : 8,
    gap: 2,
    flexShrink: 0,
  },

  detailButtonText: {
    color: COLORS.blue2,
    fontSize: isVerySmall ? 11 : 12,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 16,
  },

  emptyBox: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
    marginTop: 8,
  },

  emptyIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(47,140,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },

  emptySub: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },

  emptyButton: {
    marginTop: 8,
    height: 42,
    borderRadius: 13,
    paddingHorizontal: 14,
    backgroundColor: COLORS.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: Platform.OS === "ios" ? 88 : 74,
    backgroundColor: "rgba(5,25,65,0.98)",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1.2,
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: Platform.OS === "ios" ? 14 : 4,
    paddingTop: 8,
  },

  bottomItem: {
    width: "18%",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomLabel: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 10 : 11,
    fontWeight: "800",
    marginTop: 4,
  },

  bottomLabelActive: {
    color: COLORS.blue2,
  },

  navBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
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

  fabButton: {
    width: isVerySmall ? 54 : isSmall ? 58 : 64,
    height: isVerySmall ? 54 : isSmall ? 58 : 64,
    borderRadius: isVerySmall ? 27 : 32,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
    borderWidth: 3,
    borderColor: COLORS.bg,
    shadowColor: COLORS.blue,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(5,25,65,0.70)",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: "#1460EE",
  },
  tabButtonText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  tabButtonTextActive: {
    color: COLORS.white,
  },
});
