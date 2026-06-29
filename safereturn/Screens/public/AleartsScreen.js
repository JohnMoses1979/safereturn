


// Screens/public/AlertsScreen.js

import React, { useEffect, useMemo, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useSafeReturn } from "../../Screens/context/SafeReturnContext";

const { width, height } = Dimensions.get("window");

const isSmall = width < 380;
const isVerySmall = width < 350;
const isTinyHeight = height < 700;

const wp = (size) => (width / 375) * size;
const responsive = (size, min, max) => {
  const value = wp(size);
  return Math.max(min, Math.min(value, max));
};

const COLORS = {
  bg: "#03102B",
  card: "rgba(255,255,255,0.055)",
  card2: "rgba(5,25,65,0.82)",
  border: "rgba(91,148,226,0.30)",
  borderStrong: "rgba(47,140,255,0.50)",
  gold: "#F1C15A",
  white: "#FFFFFF",
  muted: "#AFC4E8",
  soft: "#C8D8F4",
  blue: "#2F8CFF",
  blue2: "#4C9EFF",
  red: "#FF4058",
  green: "#19C970",
  purple: "#8B4DFF",
  orange: "#FF8A1F",
  yellow: "#FFC928",
};

const FILTERS = ["All", "Sightings", "Updates", "Community"];

function getAlertImage(alert) {
  return (
    alert?.image ||
    alert?.personImage ||
    alert?.source?.image ||
    alert?.source?.photoUri ||
    alert?.source?.imageUri ||
    alert?.source?.sightingImage ||
    alert?.source?.missingPersonImage ||
    alert?.person?.image ||
    ""
  );
}

function getAlertColor(alert) {
  if (alert?.color) return alert.color;

  if (alert?.type === "Sightings") return COLORS.blue;
  if (alert?.type === "Updates") return COLORS.green;
  if (alert?.type === "Community") return COLORS.orange;

  return COLORS.blue;
}

function getAlertIcon(alert) {
  if (alert?.icon) return alert.icon;

  if (alert?.type === "Sightings") return "eye-outline";
  if (alert?.type === "Updates") return "checkmark-circle-outline";
  if (alert?.type === "Community") return "people-outline";

  return "notifications-outline";
}

function normalizeAlert(alert, formatTimeAgo) {
  const createdAt =
    alert?.source?.createdAt || alert?.createdAt || new Date().toISOString();

  const type = alert?.type || "Updates";
  const color = getAlertColor(alert);

  return {
    ...alert,
    id: alert?.id || `alert-${createdAt}-${Math.random()}`,
    type,
    title: alert?.title || "New update available",
    subtitle: alert?.subtitle || "Tap to view more details.",
    time: alert?.time || (formatTimeAgo ? formatTimeAgo(createdAt) : "Just now"),
    status: alert?.status || "UPDATE",
    color,
    icon: getAlertIcon(alert),
    image: getAlertImage(alert),
    source: alert?.source || null,
    person: alert?.person || alert?.source || null,
    createdAt,
  };
}

export default function AlertsScreen({ navigation }) {
  const {
    alerts = [],
    currentUser,
    formatTimeAgo,
    markAlertsRead,
    alertUnreadCount = 0,
    missingReports = [],
    sightingReports = [],
    refresh,
  } = useSafeReturn();

  useEffect(() => {
    let isActive = true;

    const syncAlerts = async () => {
      if (typeof markAlertsRead === "function") {
        await markAlertsRead();
      }
      if (!isActive) return;
      if (typeof refresh === "function") {
        await refresh();
      }
    };

    syncAlerts();

    const unsubscribe = navigation?.addListener?.("focus", () => {
      syncAlerts();
    });

    return () => {
      isActive = false;
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [navigation, markAlertsRead, refresh]);

  const [activeFilter, setActiveFilter] = useState("All");

  const normalizedAlerts = useMemo(() => {
    return Array.isArray(alerts)
      ? alerts.map((item) => normalizeAlert(item, formatTimeAgo))
      : [];
  }, [alerts, formatTimeAgo]);

  const unreadCount = alertUnreadCount;

  const filteredAlerts = useMemo(() => {
    if (activeFilter === "All") return normalizedAlerts;
    return normalizedAlerts.filter((item) => item.type === activeFilter);
  }, [activeFilter, normalizedAlerts]);

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    const parentNavigation = navigation?.getParent?.();

    if (parentNavigation?.navigate) {
      parentNavigation.navigate("Dashboard");
      return;
    }

    navigation?.navigate?.("PublicHome");
  };

  const goTo = (screen, params) => {
    if (!navigation || !screen) return;
    navigation.navigate(screen, params);
  };

  const goToHome = () => {
    const parentNavigation = navigation?.getParent?.();

    if (parentNavigation?.navigate) {
      parentNavigation.navigate("Dashboard");
      return;
    }

    navigation?.navigate?.("PublicHome");
  };

  const goToReports = () => {
    const parentNavigation = navigation?.getParent?.();

    if (parentNavigation?.navigate) {
      parentNavigation.navigate("Reports", {
        screen: "ReportsMain",
      });
      return;
    }

    navigation?.navigate?.("PublicReports");
  };

  const goToProfile = () => {
    const parentNavigation = navigation?.getParent?.();

    if (parentNavigation?.navigate) {
      parentNavigation.navigate("Profile", {
        screen: "ProfileMain",
      });
      return;
    }

    navigation?.navigate?.("PublicProfile");
  };

  const goToAlerts = () => {
    const parentNavigation = navigation?.getParent?.();

    if (parentNavigation?.navigate) {
      parentNavigation.navigate("Alerts", {
        screen: "AlertsMain",
      });
      return;
    }

    navigation?.navigate?.("PublicAlerts");
  };

  const openAlert = (alert) => {
    // For sighting alerts: always try to navigate to the linked missing person report
    // so the report owner can see all sightings and use Confirm / Not Found actions
    if (alert.type === "Sightings") {
      const personId = alert.missingReportId;

      // If we can find the linked missing person report, navigate there
      if (personId) {
        const person = missingReports.find(
          (p) => p.id === personId || String(p.reportId) === String(personId)
        );
        if (person) {
          goTo("MissingPersonDetails", { person });
          return;
        }
      }

      // Fallback: navigate to RecentSightings if the missing report can't be found
      const sighting = sightingReports.find(
        (s) => s.id === alert.sightingReportId || String(s.sightingId) === String(alert.sightingReportId)
      ) || alert.source || alert;

      goTo("RecentSightings", {
        sighting,
        alert,
      });
      return;
    }

    // For Updates / Community alerts — navigate to the person details
    const personId = alert.missingReportId;
    if (personId) {
      const person = missingReports.find(
        (p) => p.id === personId || String(p.reportId) === String(personId)
      ) || alert.person || alert.source || null;

      if (person) {
        goTo("MissingPersonDetails", {
          person,
        });
        return;
      }
    }

    goToReports();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.statusTop}>
            <Text style={styles.timeText}>9:41</Text>

            <View style={styles.statusIcons}>
              <Ionicons name="cellular" size={14} color={COLORS.white} />
              <Ionicons name="wifi" size={14} color={COLORS.white} />
              <Ionicons name="battery-full" size={18} color={COLORS.white} />
            </View>
          </View>

          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.backButton}
              onPress={goBack}
            >
              <Ionicons
                name="chevron-back"
                size={responsive(24, 22, 26)}
                color={COLORS.white}
              />
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
              onPress={() => setActiveFilter("All")}
            >
              <Ionicons
                name="notifications-outline"
                size={responsive(22, 20, 24)}
                color={COLORS.white}
              />

              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.pageTitle}>Alerts</Text>

            <Text style={styles.pageSubtitle}>
              Stay updated on sightings, report progress, and important
              community notifications.
            </Text>
          </View>

          <View style={styles.filterOuter}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {FILTERS.map((item) => {
                const active = activeFilter === item;

                return (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.85}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
                    onPress={() => setActiveFilter(item)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.updatesCard}
            onPress={() => setActiveFilter("All")}
          >
            <View style={styles.updatesIconCircle}>
              <Ionicons
                name="notifications-outline"
                size={responsive(28, 25, 31)}
                color={COLORS.white}
              />

              {unreadCount > 0 && (
                <View style={styles.updatesBadge}>
                  <Text style={styles.updatesBadgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.updatesTextBox}>
              <Text style={styles.updatesTitle} numberOfLines={2}>
                {unreadCount > 0
                  ? `You have ${unreadCount} new update${
                      unreadCount > 1 ? "s" : ""
                    }`
                  : "No new updates"}
              </Text>

              <Text style={styles.updatesSub} numberOfLines={2}>
                {unreadCount > 0
                  ? "Tap to view your latest alerts and activities."
                  : "New sightings and report updates will appear here."}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={responsive(23, 21, 25)}
              color={COLORS.white}
            />
          </TouchableOpacity>

          {filteredAlerts.length > 0 ? (
            <View style={styles.alertList}>
              {filteredAlerts.map((item) => (
                <AlertCard
                  key={item.id}
                  item={item}
                  onPress={() => openAlert(item)}
                />
              ))}
            </View>
          ) : (
            <EmptyAlertsBox
              activeFilter={activeFilter}
              onReportMissing={() => goTo("ReportMissingStep1")}
              onReportSighting={() => goTo("ReportNowScreen")}
            />
          )}
        </ScrollView>

        <BottomNavigation
          active="Alerts"
          alertCount={unreadCount}
          goToHome={goToHome}
          goToReports={goToReports}
          goToAlerts={goToAlerts}
          goToProfile={goToProfile}
          onReportMissing={() => goTo("ReportMissingStep1")}
        />
      </SafeAreaView>
    </View>
  );
}

function AlertCard({ item, onPress }) {
  const hasImage = !!item.image;
  const color = item.color || COLORS.blue;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.alertCard}
      onPress={onPress}
    >
      <View style={[styles.sideLine, { backgroundColor: color }]} />

      <View style={styles.alertLeft}>
        {hasImage ? (
          <View style={styles.imageWrap}>
            <Image source={{ uri: item.image }} style={styles.alertImage} />

            <View style={[styles.imageIconBadge, { backgroundColor: color }]}>
              <Ionicons
                name={item.icon}
                size={responsive(15, 13, 17)}
                color={COLORS.white}
              />
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.iconOnlyCircle,
              {
                backgroundColor: `${color}25`,
                borderColor: `${color}70`,
              },
            ]}
          >
            <Ionicons
              name={item.icon}
              size={responsive(23, 20, 26)}
              color={COLORS.white}
            />
          </View>
        )}
      </View>

      <View style={styles.alertContent}>
        <Text style={styles.alertTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.alertSubtitle} numberOfLines={2}>
          {item.subtitle}
        </Text>

        <View style={styles.alertTimeRow}>
          <Ionicons
            name="time-outline"
            size={responsive(12, 11, 13)}
            color={COLORS.muted}
          />

          <Text style={styles.alertTime} numberOfLines={1}>
            {item.time}
          </Text>
        </View>
      </View>

      <View style={styles.alertRight}>
        <View
          style={[
            styles.statusBadge,
            {
              borderColor: color,
              backgroundColor: `${color}12`,
            },
          ]}
        >
          <Text style={[styles.statusText, { color }]} numberOfLines={1}>
            {item.status}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={responsive(20, 18, 22)}
          color={COLORS.muted}
        />
      </View>
    </TouchableOpacity>
  );
}

function EmptyAlertsBox({ activeFilter, onReportMissing, onReportSighting }) {
  return (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIcon}>
        <Ionicons name="notifications-outline" size={34} color={COLORS.blue2} />
      </View>

      <Text style={styles.emptyTitle}>
        {activeFilter === "All" ? "No alerts yet" : `No ${activeFilter} alerts`}
      </Text>

      <Text style={styles.emptySub}>
        Submit missing reports or sighting reports to see real-time alerts here.
      </Text>

      <View style={styles.emptyActions}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.emptyButton}
          onPress={onReportMissing}
        >
          <Ionicons name="person-add-outline" size={16} color={COLORS.white} />
          <Text style={styles.emptyButtonText}>Report Missing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.emptyButton, styles.emptyButtonOutline]}
          onPress={onReportSighting}
        >
          <Ionicons name="eye-outline" size={16} color={COLORS.blue2} />
          <Text style={styles.emptyButtonTextOutline}>Report Sighting</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function BottomNavigation({
  active,
  alertCount,
  goToHome,
  goToReports,
  goToAlerts,
  goToProfile,
  onReportMissing,
}) {
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
        onPress={goToHome}
      />

      <BottomItem
        icon="document-text-outline"
        label="Reports"
        active={active === "Reports"}
        onPress={goToReports}
      />

      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.fabButton}
        onPress={onReportMissing}
      >
        <Ionicons
          name="add"
          size={responsive(28, 25, 30)}
          color={COLORS.white}
        />
      </TouchableOpacity>

      <BottomItem
        icon="notifications"
        label="Alerts"
        badge={badge}
        active={active === "Alerts"}
        onPress={goToAlerts}
      />

      <BottomItem
        icon="person-outline"
        label="Profile"
        active={active === "Profile"}
        onPress={goToProfile}
      />
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
          size={responsive(21, 19, 23)}
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

  scrollContent: {
    paddingHorizontal: isVerySmall ? 12 : isSmall ? 16 : 18,
    paddingTop: Platform.OS === "android" ? 6 : 4,
    paddingBottom: Platform.OS === "ios" ? 118 : 104,
  },

  statusTop: {
    height: isTinyHeight ? 28 : 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  timeText: {
    color: COLORS.white,
    fontSize: responsive(16, 14, 17),
    fontWeight: "900",
    marginLeft: 2,
  },

  statusIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginRight: 2,
  },

  header: {
    marginTop: isTinyHeight ? 8 : 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: responsive(44, 40, 48),
    height: responsive(44, 40, 48),
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.035)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
    minWidth: 0,
  },

  logoBox: {
    width: responsive(50, 44, 52),
    height: responsive(50, 44, 52),
    borderRadius: responsive(17, 15, 18),
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
    fontSize: responsive(22, 19, 24),
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  brandBlue: {
    color: COLORS.gold,
  },

  brandSub: {
    color: COLORS.muted,
    fontSize: responsive(11.5, 10, 12.5),
    fontWeight: "700",
    marginTop: 1,
  },

  bellButton: {
    width: responsive(50, 44, 54),
    height: responsive(50, 44, 54),
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.035)",
    alignItems: "center",
    justifyContent: "center",
  },

  bellBadge: {
    position: "absolute",
    top: 1,
    right: 1,
    minWidth: responsive(22, 20, 24),
    height: responsive(22, 20, 24),
    borderRadius: 13,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
    paddingHorizontal: 3,
  },

  bellBadgeText: {
    color: COLORS.white,
    fontSize: responsive(11, 10, 12),
    fontWeight: "900",
  },

  titleBlock: {
    marginTop: isTinyHeight ? 24 : 32,
    marginBottom: 18,
  },

  pageTitle: {
    color: COLORS.white,
    fontSize: responsive(42, 34, 44),
    fontWeight: "900",
    letterSpacing: -0.9,
  },

  pageSubtitle: {
    color: COLORS.muted,
    fontSize: responsive(16, 13.5, 17),
    fontWeight: "600",
    lineHeight: responsive(24, 20, 25),
    marginTop: 6,
  },

  filterOuter: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.025)",
    padding: 5,
    marginBottom: 18,
  },

  filterScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  filterChip: {
    height: responsive(43, 38, 45),
    minWidth: responsive(72, 64, 84),
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
  },

  filterChipActive: {
    backgroundColor: COLORS.blue,
    shadowColor: COLORS.blue,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },

  filterText: {
    color: COLORS.soft,
    fontSize: responsive(13, 11.5, 14),
    fontWeight: "800",
  },

  filterTextActive: {
    color: COLORS.white,
    fontWeight: "900",
  },

  updatesCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: "rgba(47,140,255,0.10)",
    minHeight: responsive(100, 88, 108),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsive(14, 12, 16),
    paddingVertical: 12,
    marginBottom: 16,
  },

  updatesIconCircle: {
    width: responsive(68, 58, 72),
    height: responsive(68, 58, 72),
    borderRadius: 100,
    backgroundColor: "rgba(47,140,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  updatesBadge: {
    position: "absolute",
    top: 0,
    right: -2,
    minWidth: responsive(24, 21, 26),
    height: responsive(24, 21, 26),
    borderRadius: 13,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },

  updatesBadgeText: {
    color: COLORS.white,
    fontSize: responsive(12, 10.5, 13),
    fontWeight: "900",
  },

  updatesTextBox: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },

  updatesTitle: {
    color: COLORS.white,
    fontSize: responsive(20, 17, 22),
    fontWeight: "900",
    lineHeight: responsive(26, 22, 28),
  },

  updatesSub: {
    color: COLORS.muted,
    fontSize: responsive(13.5, 12, 14.5),
    fontWeight: "600",
    lineHeight: responsive(19, 17, 20),
    marginTop: 3,
  },

  alertList: {
    gap: 12,
  },

  alertCard: {
    position: "relative",
    minHeight: responsive(112, 100, 122),
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 10,
    overflow: "hidden",
  },

  sideLine: {
    position: "absolute",
    left: 10,
    top: 16,
    bottom: 16,
    width: 4,
    borderRadius: 10,
  },

  alertLeft: {
    width: responsive(68, 58, 72),
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  imageWrap: {
    width: responsive(62, 54, 68),
    height: responsive(62, 54, 68),
    borderRadius: 13,
    overflow: "hidden",
  },

  alertImage: {
    width: "100%",
    height: "100%",
  },

  imageIconBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    width: responsive(28, 24, 30),
    height: responsive(28, 24, 30),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },

  iconOnlyCircle: {
    width: responsive(62, 54, 68),
    height: responsive(62, 54, 68),
    borderRadius: 100,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },

  alertContent: {
    flex: 1,
    paddingLeft: 10,
    minWidth: 0,
  },

  alertTitle: {
    color: COLORS.white,
    fontSize: responsive(14.5, 12.5, 15.5),
    fontWeight: "900",
    lineHeight: responsive(20, 17, 21),
  },

  alertSubtitle: {
    color: COLORS.muted,
    fontSize: responsive(12, 10.5, 12.5),
    fontWeight: "600",
    lineHeight: responsive(17, 15, 18),
    marginTop: 3,
  },

  alertTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  alertTime: {
    color: COLORS.muted,
    fontSize: responsive(11.5, 10, 12),
    fontWeight: "700",
    marginLeft: 5,
  },

  alertRight: {
    width: responsive(68, 58, 78),
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: responsive(78, 68, 84),
    marginLeft: 5,
  },

  statusBadge: {
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 5,
    maxWidth: "100%",
  },

  statusText: {
    fontSize: responsive(8.3, 7.5, 9),
    fontWeight: "900",
  },

  emptyBox: {
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 18,
    alignItems: "center",
    marginTop: 2,
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(47,140,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: responsive(18, 16, 20),
    fontWeight: "900",
    textAlign: "center",
  },

  emptySub: {
    color: COLORS.muted,
    fontSize: responsive(13, 12, 14),
    fontWeight: "600",
    lineHeight: responsive(19, 17, 20),
    textAlign: "center",
    marginTop: 6,
  },

  emptyActions: {
    flexDirection: isVerySmall ? "column" : "row",
    gap: 9,
    marginTop: 14,
  },

  emptyButton: {
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyButtonOutline: {
    backgroundColor: "rgba(47,140,255,0.12)",
    borderWidth: 1,
    borderColor: COLORS.blue,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 6,
  },

  emptyButtonTextOutline: {
    color: COLORS.blue2,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 6,
  },

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: Platform.OS === "ios" ? 92 : 76,
    backgroundColor: "rgba(5,25,65,0.98)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: Platform.OS === "ios" ? 16 : 6,
    paddingTop: 7,
  },

  bottomItem: {
    width: "18%",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomLabel: {
    color: COLORS.muted,
    fontSize: responsive(10, 8.5, 10.5),
    fontWeight: "800",
    marginTop: 3,
  },

  bottomLabelActive: {
    color: COLORS.blue,
  },

  fabButton: {
    width: responsive(60, 54, 64),
    height: responsive(60, 54, 64),
    borderRadius: 100,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -36,
    borderWidth: 4,
    borderColor: COLORS.bg,
    shadowColor: COLORS.blue,
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },

  navBadge: {
    position: "absolute",
    top: -8,
    right: -9,
    minWidth: responsive(18, 16, 19),
    height: responsive(18, 16, 19),
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
    fontSize: responsive(8.5, 7.5, 9),
    fontWeight: "900",
  },
});
