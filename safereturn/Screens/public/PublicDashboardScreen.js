


// Screens/public/PublicDashboardScreen.js

import React, { useMemo } from "react";
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
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeReturn } from "../../Screens/context/SafeReturnContext";

const { width, height } = Dimensions.get("window");

const isSmall = width < 380;
const isVerySmall = width < 350;
const isTiny = height < 700;

const H_PADDING = isVerySmall ? 10 : isSmall ? 12 : 14;
const GAP = isVerySmall ? 6 : 8;

const quickCardWidth = (width - H_PADDING * 2 - GAP * 3) / 4;
const statCardWidth = (width - H_PADDING * 2 - 26 - GAP * 3) / 4;

const COLORS = {
  bg: "#061A40",
  bgDark: "#03102B",
  card: "rgba(255,255,255,0.055)",
  border: "rgba(91,148,226,0.28)",
  gold: "#F1C15A",
  blue: "#2F8CFF",
  blue2: "#4C9EFF",
  white: "#FFFFFF",
  muted: "#AFC4E8",
  soft: "#C8D8F4",
  red: "#FF4058",
  green: "#19C970",
  purple: "#8B4DFF",
  cyan: "#20D4FF",
};

function safeCount(value) {
  const number = Number(value || 0);
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return String(number);
}

function getUserName(currentUser) {
  return (
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.displayName ||
    currentUser?.phoneNumber ||
    "User"
  );
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

function getSightingImage(item) {
  return (
    item?.image ||
    item?.imageUri ||
    item?.photoUri ||
    item?.sightingImage ||
    item?.missingPersonImage ||
    ""
  );
}

export default function PublicDashboardScreen({ navigation }) {
  // ── Local state (populated from API responses) ──
  const {
    currentUser,
    dashboardStats: sharedDashboardStats = {
      reported: 0,
      sightings: 0,
      found: 0,
      members: 0,
      rewardReports: 0,
      totalRewardAmount: 0,
    },
    myReports = [],
    communityReports = [],
    recentSightings = [],
    alertUnreadCount = 0,
  } = useSafeReturn();

  const userName = getUserName(currentUser);
  const alertCount = alertUnreadCount;
  const stats = sharedDashboardStats;

  const reportedList = useMemo(() => {
    return Array.isArray(communityReports) ? communityReports.slice(0, 10) : [];
  }, [communityReports]);

  const sightingsList = useMemo(() => {
    return Array.isArray(recentSightings) ? recentSightings.slice(0, 5) : [];
  }, [recentSightings]);

  const getParentNavigation = () => {
    return navigation?.getParent?.();
  };

  const goTo = (routeName, params) => {
    if (!navigation || !routeName) return;
    navigation.navigate(routeName, params);
  };

  const goToHome = () => {
    const parentNavigation = getParentNavigation();

    if (parentNavigation?.navigate) {
      parentNavigation.navigate("Dashboard");
      return;
    }

    navigation?.navigate?.("PublicHome");
  };

  const goToReports = () => {
    const parentNavigation = getParentNavigation();

    if (parentNavigation?.navigate) {
      parentNavigation.navigate("Reports", {
        screen: "ReportsMain",
      });
      return;
    }

    navigation?.navigate?.("PublicReports");
  };

  const goToAlerts = () => {
    const parentNavigation = getParentNavigation();

    if (parentNavigation?.navigate) {
      parentNavigation.navigate("Alerts", {
        screen: "AlertsMain",
      });
      return;
    }

    navigation?.navigate?.("PublicAlerts");
  };

  const goToProfile = () => {
    const parentNavigation = getParentNavigation();

    if (parentNavigation?.navigate) {
      parentNavigation.navigate("Profile", {
        screen: "ProfileMain",
      });
      return;
    }

    navigation?.navigate?.("PublicProfile");
  };

  const goToReportMissing = () => {
    navigation?.navigate?.("ReportMissingStep1");
  };

  const goToReportSighting = () => {
    navigation?.navigate?.("ReportNowScreen");
  };

  const openPersonDetails = (person) => {
    navigation?.navigate?.("MissingPersonDetails", { person });
  };

  const openSightingDetails = (sighting) => {
    navigation?.navigate?.("RecentSightings", { sighting });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
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
                  Together, we keep our community safe.
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
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {alertCount > 9 ? "9+" : alertCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeRow}>
            <View style={styles.welcomeLeft}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {userName}! 👋
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.myReportsCard}
              onPress={goToReports}
            >
              <View style={styles.myReportsIcon}>
                <Feather name="briefcase" size={18} color={COLORS.blue2} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.myReportsTitle} numberOfLines={1}>
                  My Reports
                </Text>
                <Text style={styles.myReportsCount}>
                  {Array.isArray(myReports) ? myReports.length : 0}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.quickGrid}>
            <ActionCard
              title="Report"
              title2="Missing"
              subtitle="Upload"
              icon="person-add-outline"
              color={COLORS.red}
              bg="rgba(255,64,88,0.16)"
              onPress={goToReportMissing}
            />

            <ActionCard
              title="Report"
              title2="Sighting"
              subtitle="Seen?"
              icon="eye-outline"
              color={COLORS.blue}
              bg="rgba(47,140,255,0.14)"
              onPress={goToReportSighting}
            />

            <ActionCard
              title="Alerts"
              title2=""
              subtitle="Updates"
              icon="notifications"
              color={COLORS.green}
              bg="rgba(25,201,112,0.14)"
              onPress={goToAlerts}
            />

            <ActionCard
              title="Community"
              title2=""
              subtitle="Help"
              icon="people"
              color={COLORS.purple}
              bg="rgba(139,77,255,0.16)"
              onPress={goToProfile}
            />
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Feather name="trending-up" size={18} color="#fff" />
                <Text style={styles.sectionTitle}>Community Impact</Text>
              </View>

              <TouchableOpacity activeOpacity={0.75} style={styles.monthButton}>
                <Text style={styles.monthText}>This Month</Text>
                <Ionicons name="chevron-down" size={13} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                count={safeCount(stats.reported)}
                label="Reported"
                icon="person-add-outline"
                color={COLORS.red}
                bg="rgba(255,64,88,0.14)"
                borderColor="rgba(255,64,88,0.34)"
              />

              <StatCard
                count={safeCount(stats.sightings)}
                label="Sightings"
                icon="eye-outline"
                color={COLORS.blue2}
                bg="rgba(47,140,255,0.12)"
                borderColor="rgba(47,140,255,0.3)"
              />

              <StatCard
                count={safeCount(stats.found)}
                label="Found"
                icon="checkmark-circle-outline"
                color={COLORS.green}
                bg="rgba(25,201,112,0.12)"
                borderColor="rgba(25,201,112,0.3)"
              />

              <StatCard
                count={safeCount(stats.members)}
                label="Members"
                icon="people-outline"
                color={COLORS.purple}
                bg="rgba(139,77,255,0.14)"
                borderColor="rgba(139,77,255,0.32)"
              />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Feather name="search" size={18} color="#fff" />
                <Text style={styles.sectionTitle}>Recently Reported</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.viewAllButton}
                onPress={goToReports}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>

            {reportedList.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.personsScroll}
              >
                {reportedList.map((person, index) => (
                  <PersonCard
                    key={person.id || person.reportId || `person-${index}`}
                    person={person}
                    onPress={() => openPersonDetails(person)}
                  />
                ))}
              </ScrollView>
            ) : (
              <EmptyBox
                icon="person-add-outline"
                title="No missing reports yet"
                subtitle="Tap Report Missing to create the first report."
                buttonText="Report Missing"
                onPress={goToReportMissing}
              />
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="eye-outline" size={18} color={COLORS.blue2} />
                <Text style={styles.sectionTitle}>Recent Sightings</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.viewAllButton}
                onPress={() => goTo("RecentSightings")}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>

            {sightingsList.length > 0 ? (
              sightingsList.map((item, index) => (
                <TouchableOpacity
                  key={item.id || item.sightingId || `sighting-${index}`}
                  activeOpacity={0.85}
                  style={styles.sightingCard}
                  onPress={() => openSightingDetails(item)}
                >
                  {getSightingImage(item) ? (
                    <Image
                      source={{ uri: getSightingImage(item) }}
                      style={styles.sightingImage}
                    />
                  ) : (
                    <View style={styles.sightingImagePlaceholder}>
                      <Ionicons
                        name="image-outline"
                        size={23}
                        color={COLORS.muted}
                      />
                    </View>
                  )}

                  <View style={styles.sightingInfo}>
                    <Text style={styles.sightingName} numberOfLines={1}>
                      {item.personName || item.name || "Unknown Person"}
                    </Text>

                    <Text style={styles.sightingPlace} numberOfLines={2}>
                      {item.location ||
                        item.seenAddress ||
                        item.lastSeenPlace ||
                        "Sighting location not provided"}
                    </Text>

                    <View style={styles.sightingTimeRow}>
                      <Ionicons
                        name="time-outline"
                        size={13}
                        color={COLORS.cyan}
                      />
                      <Text style={styles.sightingTime} numberOfLines={1}>
                        {item.time || item.dateTime || "Just now"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.newSightingBadge}>
                    <Text style={styles.newSightingText}>
                      {item.status || "NEW"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyBox
                icon="eye-outline"
                title="No sightings yet"
                subtitle="Sightings submitted by users will appear here."
                buttonText="Report Sighting"
                onPress={goToReportSighting}
              />
            )}
          </View>

          {alertCount > 0 && (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.alertBanner}
              onPress={goToAlerts}
            >
              <View style={styles.alertIconCircle}>
                <Ionicons name="notifications" size={23} color="#fff" />
              </View>

              <View style={styles.alertTextBox}>
                <Text style={styles.alertTitle} numberOfLines={2}>
                  You have {alertCount} new update{alertCount > 1 ? "s" : ""}.
                </Text>
              </View>

              <View style={styles.alertButton}>
                <Text style={styles.alertButtonText}>View</Text>
                <Ionicons name="chevron-forward" size={17} color="#fff" />
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.bottomNav}>
          <BottomItem
            active
            icon="home-outline"
            label="Home"
            onPress={goToHome}
          />

          <BottomItem
            icon="document-text-outline"
            label="Reports"
            onPress={goToReports}
          />

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.fabButton}
            onPress={goToReportMissing}
          >
            <Ionicons name="add" size={31} color="#fff" />
          </TouchableOpacity>

          <BottomItem
            icon="notifications-outline"
            label="Alerts"
            badge={alertCount > 0 ? (alertCount > 9 ? "9+" : String(alertCount)) : ""}
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

function ActionCard({
  title,
  title2,
  subtitle,
  icon,
  color,
  bg,
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.actionCard, { borderColor: color, backgroundColor: bg }]}
      onPress={onPress}
    >
      <View style={[styles.actionIconCircle, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={isVerySmall ? 18 : 20} color="#fff" />
      </View>

      <Text style={styles.actionTitle} numberOfLines={1}>
        {title}
      </Text>

      {!!title2 && (
        <Text style={styles.actionTitle} numberOfLines={1}>
          {title2}
        </Text>
      )}

      <Text style={styles.actionSub} numberOfLines={1}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

function StatCard({ count, label, icon, color, bg, borderColor }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg, borderColor }]}>
      <View style={[styles.statIconCircle, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={isVerySmall ? 16 : 18} color={color} />
      </View>

      <Text style={[styles.statCount, { color }]} numberOfLines={1}>
        {count}
      </Text>

      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function PersonCard({ person, onPress }) {
  const image = getPersonImage(person);
  const rewardAmount = Number(String(person.rewardAmount || person.rewardText || 0).replace(/[^0-9]/g, "")) || 0;

  return (
    <View style={styles.personCard}>
      <View>
        {image ? (
          <Image source={{ uri: image }} style={styles.personImage} />
        ) : (
          <View style={styles.personImagePlaceholder}>
            <Ionicons name="person-outline" size={34} color={COLORS.muted} />
          </View>
        )}

        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>
            {person.status || "NEW"}
          </Text>
        </View>
      </View>

      <View style={styles.personBody}>
        <Text style={styles.personName} numberOfLines={1}>
          {person.name || person.fullName || "Unknown Person"}
        </Text>

        <Text style={styles.personMeta} numberOfLines={1}>
          {person.age || "Age N/A"} • {person.gender || "Gender N/A"}
        </Text>

        <View style={styles.personInfoRow}>
          <Ionicons name="location-sharp" size={13} color={COLORS.red} />
          <Text style={styles.personInfoText} numberOfLines={1}>
            {person.location || person.lastSeenPlace || "Location not provided"}
          </Text>
        </View>

        <View style={styles.personInfoRow}>
          <Ionicons name="time-outline" size={13} color={COLORS.muted} />
          <Text style={styles.personInfoText} numberOfLines={1}>
            {person.time ||
              person.reportedTime ||
              person.lastSeenTimeShort ||
              "Just now"}
          </Text>
        </View>

        {rewardAmount > 0 && (
          <View style={styles.rewardRow}>
            <Ionicons name="gift-outline" size={13} color={COLORS.yellow} />
            <Text style={styles.rewardRowText} numberOfLines={1}>
              Reward {"\u20B9"}{rewardAmount}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.detailsButton}
        onPress={onPress}
      >
        <Text style={styles.detailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.red} />
      </TouchableOpacity>
    </View>
  );
}

function EmptyBox({ icon, title, subtitle, buttonText, onPress }) {
  return (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={24} color={COLORS.blue2} />
      </View>

      <View style={styles.emptyTextBox}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.emptyButton}
        onPress={onPress}
      >
        <Text style={styles.emptyButtonText}>{buttonText}</Text>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },

  scrollContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: Platform.OS === "android" ? 14 : 8,
    paddingBottom: Platform.OS === "ios" ? 112 : 98,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: isTiny ? 14 : 18,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  logoBox: {
    width: isSmall ? 44 : 50,
    height: isSmall ? 44 : 50,
    borderRadius: 14,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
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
    fontSize: isVerySmall ? 18 : isSmall ? 20 : 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  brandBlue: {
    color: COLORS.gold,
  },

  brandSub: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 10 : isSmall ? 11 : 12,
    fontWeight: "700",
    marginTop: 2,
  },

  bellButton: {
    width: isSmall ? 44 : 50,
    height: isSmall ? 44 : 50,
    borderRadius: 25,
    borderWidth: 1.4,
    borderColor: "rgba(91,148,226,0.35)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bgDark,
    paddingHorizontal: 3,
  },

  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
  },

  welcomeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },

  welcomeLeft: {
    flex: 1,
    minWidth: 0,
  },

  welcomeText: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 13 : isSmall ? 14 : 16,
    fontWeight: "700",
    marginBottom: 2,
  },

  userName: {
    color: COLORS.white,
    fontSize: isVerySmall ? 25 : isSmall ? 28 : 34,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  myReportsCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1.3,
    borderColor: COLORS.border,
    paddingHorizontal: 9,
    paddingVertical: 9,
    width: isVerySmall ? 126 : isSmall ? 138 : 155,
    gap: 7,
  },

  myReportsIcon: {
    width: isSmall ? 34 : 38,
    height: isSmall ? 34 : 38,
    borderRadius: 11,
    backgroundColor: "rgba(47,140,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },

  myReportsTitle: {
    color: COLORS.white,
    fontSize: isVerySmall ? 10 : isSmall ? 11 : 13,
    fontWeight: "800",
  },

  myReportsCount: {
    color: COLORS.blue2,
    fontSize: isVerySmall ? 15 : 17,
    fontWeight: "900",
    marginTop: 1,
  },

  quickGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: GAP,
    marginBottom: 16,
  },

  actionCard: {
    width: quickCardWidth,
    minHeight: isVerySmall ? 98 : isSmall ? 106 : 124,
    borderRadius: isVerySmall ? 14 : 16,
    borderWidth: 1.3,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: isVerySmall ? 3 : 4,
    paddingVertical: 10,
  },

  actionIconCircle: {
    width: isVerySmall ? 34 : isSmall ? 38 : 46,
    height: isVerySmall ? 34 : isSmall ? 38 : 46,
    borderRadius: isVerySmall ? 17 : isSmall ? 19 : 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: isVerySmall ? 6 : 8,
  },

  actionTitle: {
    color: COLORS.white,
    fontSize: isVerySmall ? 9 : isSmall ? 10 : 12,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: isVerySmall ? 12 : isSmall ? 13 : 16,
  },

  actionSub: {
    color: COLORS.soft,
    fontSize: isVerySmall ? 8 : isSmall ? 9 : 10,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },

  sectionCard: {
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    padding: isSmall ? 11 : 13,
    marginBottom: 14,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: isVerySmall ? 14 : isSmall ? 15 : 17,
    fontWeight: "900",
    marginLeft: 8,
  },

  monthButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  monthText: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 10 : isSmall ? 11 : 13,
    fontWeight: "700",
    marginRight: 3,
  },

  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  viewAllText: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 10 : isSmall ? 11 : 13,
    fontWeight: "700",
  },

  statsGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: GAP,
  },

  statCard: {
    width: statCardWidth,
    minHeight: isVerySmall ? 88 : isSmall ? 94 : 108,
    borderRadius: isVerySmall ? 13 : 14,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 3,
  },

  statIconCircle: {
    width: isVerySmall ? 30 : isSmall ? 32 : 36,
    height: isVerySmall ? 30 : isSmall ? 32 : 36,
    borderRadius: isVerySmall ? 15 : isSmall ? 16 : 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },

  statCount: {
    fontSize: isVerySmall ? 15 : isSmall ? 17 : 22,
    fontWeight: "900",
  },

  statLabel: {
    color: COLORS.soft,
    fontSize: isVerySmall ? 8 : isSmall ? 9 : 10,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 3,
  },

  personsScroll: {
    gap: 12,
    paddingRight: 4,
  },

  personCard: {
    width: isVerySmall ? 158 : isSmall ? 162 : 185,
    borderRadius: 14,
    backgroundColor: "rgba(5,25,65,0.72)",
    borderWidth: 1.2,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  personImage: {
    width: "100%",
    height: isVerySmall ? 108 : isSmall ? 115 : 135,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  personImagePlaceholder: {
    width: "100%",
    height: isVerySmall ? 108 : isSmall ? 115 : 135,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  newBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    backgroundColor: COLORS.red,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 90,
  },

  newBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "900",
  },

  personBody: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
  },

  personName: {
    color: COLORS.white,
    fontSize: isSmall ? 14 : 16,
    fontWeight: "900",
    marginBottom: 3,
  },

  personMeta: {
    color: COLORS.muted,
    fontSize: isSmall ? 11 : 13,
    fontWeight: "700",
    marginBottom: 8,
  },

  personInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(250,204,21,0.12)",
    alignSelf: "flex-start",
  },

  rewardRowText: {
    color: COLORS.yellow,
    fontSize: isSmall ? 10 : 11,
    fontWeight: "800",
    marginLeft: 4,
  },

  personInfoText: {
    color: COLORS.soft,
    fontSize: isSmall ? 11 : 12,
    fontWeight: "600",
    marginLeft: 5,
    flex: 1,
  },

  detailsButton: {
    borderTopWidth: 1,
    borderTopColor: "rgba(91,148,226,0.22)",
    height: 40,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  detailsText: {
    color: COLORS.red,
    fontSize: isSmall ? 12 : 13,
    fontWeight: "900",
  },

  sightingCard: {
    borderRadius: 14,
    backgroundColor: "rgba(5,25,65,0.65)",
    borderWidth: 1,
    borderColor: "rgba(91,148,226,0.22)",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  sightingImage: {
    width: isSmall ? 58 : 70,
    height: isSmall ? 58 : 70,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  sightingImagePlaceholder: {
    width: isSmall ? 58 : 70,
    height: isSmall ? 58 : 70,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  sightingInfo: {
    flex: 1,
    minWidth: 0,
  },

  sightingName: {
    color: COLORS.white,
    fontSize: isSmall ? 14 : 16,
    fontWeight: "900",
    marginBottom: 3,
  },

  sightingPlace: {
    color: COLORS.soft,
    fontSize: isSmall ? 11 : 12,
    fontWeight: "600",
    lineHeight: isSmall ? 16 : 18,
  },

  sightingTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  sightingTime: {
    color: COLORS.cyan,
    fontSize: isSmall ? 11 : 13,
    fontWeight: "800",
    marginLeft: 4,
  },

  newSightingBadge: {
    backgroundColor: "rgba(25,201,112,0.12)",
    borderWidth: 1.2,
    borderColor: COLORS.green,
    paddingHorizontal: isSmall ? 7 : 9,
    paddingVertical: 7,
    borderRadius: 10,
    maxWidth: 84,
  },

  newSightingText: {
    color: COLORS.green,
    fontSize: isSmall ? 8 : 9,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(91,148,226,0.22)",
    backgroundColor: "rgba(5,25,65,0.50)",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(47,140,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTextBox: {
    flex: 1,
    minWidth: 0,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: isSmall ? 13 : 14,
    fontWeight: "900",
  },

  emptySubtitle: {
    color: COLORS.muted,
    fontSize: isSmall ? 10 : 11,
    fontWeight: "600",
    marginTop: 2,
    lineHeight: isSmall ? 15 : 17,
  },

  emptyButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 9,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: isSmall ? 10 : 11,
    fontWeight: "900",
  },

  alertBanner: {
    borderRadius: 18,
    backgroundColor: "rgba(255,64,88,0.13)",
    borderWidth: 1.2,
    borderColor: "rgba(255,64,88,0.38)",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },

  alertIconCircle: {
    width: isSmall ? 48 : 56,
    height: isSmall ? 48 : 56,
    borderRadius: isSmall ? 24 : 28,
    backgroundColor: "rgba(255,64,88,0.25)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  alertTextBox: {
    flex: 1,
    minWidth: 0,
  },

  alertTitle: {
    color: COLORS.white,
    fontSize: isSmall ? 12 : 14,
    fontWeight: "800",
    lineHeight: isSmall ? 18 : 21,
  },

  alertButton: {
    height: isSmall ? 40 : 46,
    borderRadius: 13,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 10,
    gap: 2,
    flexShrink: 0,
  },

  alertButtonText: {
    color: COLORS.white,
    fontSize: isSmall ? 12 : 14,
    fontWeight: "900",
  },

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: Platform.OS === "ios" ? 90 : 76,
    backgroundColor: "rgba(5,25,65,0.98)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.2,
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderColor: "rgba(91,148,226,0.28)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: Platform.OS === "ios" ? 16 : 6,
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
    color: COLORS.blue2,
  },

  navBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 18,
    height: 18,
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
    width: isSmall ? 56 : 64,
    height: isSmall ? 56 : 64,
    borderRadius: isSmall ? 28 : 32,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -32,
    borderWidth: 3.5,
    borderColor: COLORS.bgDark,
    shadowColor: COLORS.blue,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
});
