

// Screens/police/PoliceDashboardScreen.js
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { useSafeReturn } from "../context/SafeReturnContext";

const { width } = Dimensions.get("window");
const isSmall = width < 380;

const COLORS = {
  bg: "#020B1F",
  sidebarBg: "#051E47",
  card: "#062A63",
  card2: "#05265B",
  border: "rgba(42, 122, 255, 0.42)",
  borderSoft: "rgba(42, 122, 255, 0.18)",
  white: "#FFFFFF",
  softWhite: "#DDE8FF",
  muted: "#9FAFD0",
  blue: "#2696FF",
  cyan: "#36CFFF",
  red: "#FF3048",
  green: "#22D66B",
  orange: "#FF9F12",
  purple: "#8B3FF2",
};

// ── Chart data (last 7 days) ──────────────────────────────────────────────────
const CHART_DATA = {
  labels: ["May 14", "May 15", "May 16", "May 17", "May 18", "May 19", "May 20"],
  datasets: [{ data: [18, 34, 62, 44, 72, 50, 65] }],
};

// ── Sidebar menu items ────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "grid", route: "PoliceDashboard" },
  { id: "allReports", label: "All Reports", icon: "document-text", route: "PoliceReports" },
  { id: "missingReports", label: "Missing Reports", icon: "person", route: "PoliceReports" },
  { id: "sightingReports", label: "Sighting Reports", icon: "eye", route: "PoliceSightings" },
  { id: "solvedReports", label: "Solved Reports", icon: "checkmark-circle", route: "PoliceReports" },
  { id: "aiImageCheck", label: "AI Image Check", icon: "scan", route: "PoliceAITools", screen: "PoliceAIToolsMain" },
  { id: "aiChat", label: "AI Chat Assistant", icon: "chatbubble-ellipses", route: "PoliceAITools", screen: "PoliceAIChatMain" },
  { id: "analytics", label: "Analytics", icon: "bar-chart", route: "PoliceAnalytics" },
  { id: "settings", label: "Settings", icon: "settings", route: "PoliceDashboard" },
  { id: "logout", label: "Logout", icon: "log-out", route: "Logout", color: COLORS.red },
];

export default function PoliceDashboardScreen({ navigation }) {
  const {
    fetchPoliceStats,
    fetchPoliceReports,
    fetchPoliceSightings,
    fetchPoliceAnalytics,
    logout,
  } = useSafeReturn();
  const { width: screenWidth } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [stats, setStats] = useState({
    totalReports: 0,
    missingReports: 0,
    sightingReports: 0,
    solvedReports: 0,
    pendingVerification: 0,
    aiChatQueries: 0,
    aiImageChecks: 0,
    urgentReports: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [recentSightings, setRecentSightings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const isSmallScreen = screenWidth < 380;

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [statsData, reportsData, sightingsData, analyticsData] = await Promise.all([
        fetchPoliceStats?.(),
        fetchPoliceReports?.(0, 5),
        fetchPoliceSightings?.(),
        fetchPoliceAnalytics?.(),
      ]);

      const reportsList = Array.isArray(reportsData?.content)
        ? reportsData.content
        : Array.isArray(reportsData)
          ? reportsData
          : [];
      const sightingsList = Array.isArray(sightingsData)
        ? sightingsData
        : Array.isArray(sightingsData?.content)
          ? sightingsData.content
          : [];

      const countSolved = reportsList.filter((report) => {
        const status = (report.status || "").toLowerCase();
        return status === "resolved" || status === "solved" || status === "found";
      }).length;
      const countMissing = reportsList.filter((report) => {
        const status = (report.status || "").toLowerCase();
        const type = (report.reportType || "").toLowerCase();
        return type !== "sighting" && status !== "resolved" && status !== "solved" && status !== "found";
      }).length;
      const countSightings = reportsList.filter((report) => {
        const status = (report.status || "").toLowerCase();
        const type = (report.reportType || "").toLowerCase();
        return type === "sighting" || status === "sighting";
      }).length;

      setStats({
        totalReports: statsData?.totalReports ?? reportsList.length,
        missingReports: countMissing,
        sightingReports: countSightings,
        solvedReports: statsData?.solvedReports ?? countSolved,
        pendingVerification: sightingsList.length,
        aiChatQueries: statsData?.aiChatQueries ?? 0,
        aiImageChecks: statsData?.aiImageChecks ?? 0,
        urgentReports: statsData?.urgentReports ?? 0,
      });

      setRecentReports(reportsList.slice(0, 3));
      setRecentSightings(sightingsList.slice(0, 3));
      setAnalytics(analyticsData || null);
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const chartData = useMemo(() => {
    const reports = analytics?.dailyReports || [18, 34, 62, 44, 72, 50, 65];
    const sightings = analytics?.dailySightings || [10, 16, 28, 20, 32, 24, 29];
    return {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          data: reports,
          color: () => COLORS.blue,
          strokeWidth: 2,
        },
        {
          data: sightings,
          color: () => COLORS.cyan,
          strokeWidth: 2,
        },
      ],
      legend: ["Reports", "Sightings"],
    };
  }, [analytics]);

  const getReportHeading = (report) => {
    const type = (report.reportType || "").toLowerCase();
    const status = (report.status || "").toLowerCase();
    if (type === "sighting" || status === "sighting") return "Sighting Report";
    if (status === "resolved" || status === "solved" || status === "found") return "Solved Case";
    const age = parseInt(report.age || "0", 10);
    if (age > 0 && age < 18) return "Missing Person - Child";
    if (age >= 60) return "Missing Person - Senior";
    return "Missing Person - Adult";
  };

  const getReportLocation = (report) => {
    return report.city || report.location || report.lastSeenPlace || report.address || "Location not provided";
  };

  const getReportTime = (dateString) => {
    if (!dateString) return "Unknown time";
    const date = new Date(dateString);
    return `${date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}, ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const getSightingTitle = (item) => item.lastSeenPlace || item.location || item.seenAddress || "Recent sighting";
  const getSightingTime = (item) => item.dateTime || `${item.seenDate || ""} ${item.seenTime || ""}`.trim() || getReportTime(item.createdAt);

  const performLogout = async () => {
    try {
      await logout?.();
    } catch (error) {
      console.log("logout error:", error);
    }

    setSidebarVisible(false);

    const rootNavigation =
      navigation?.getParent?.()?.getParent?.() ||
      navigation?.getParent?.() ||
      navigation;

    const resetAction = CommonActions.reset({
      index: 0,
      routes: [{ name: "LoginScreen" }],
    });

    if (rootNavigation?.dispatch) {
      rootNavigation.dispatch(resetAction);
      return;
    }

    if (rootNavigation?.reset) {
      rootNavigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
      return;
    }

    navigation?.navigate?.("LoginScreen");
  };

  const navigateToSidebarTarget = (item) => {
    if (item.id === "logout") {
      performLogout();
      return;
    }

    setActiveMenu(item.id);
    setSidebarVisible(false);

    if (!item.route || item.route === "PoliceDashboard") return;

    const routeParams = {
      allReports: { initialFilter: "All" },
      missingReports: { initialFilter: "Missing" },
      sightingReports: { initialFilter: "Pending" },
      solvedReports: { initialFilter: "Solved" },
    };

    const params = routeParams[item.id];

    if (item.route === "PoliceAITools" && item.screen) {
      navigation.navigate(item.route, { screen: item.screen });
      return;
    }

    if (item.route === "PoliceReports" && params) {
      navigation.navigate(item.route, {
        screen: "PoliceReportsMain",
        params,
      });
      return;
    }

    if (item.route === "PoliceSightings" && params) {
      navigation.navigate(item.route, {
        screen: "PoliceSightingsMain",
        params,
      });
      return;
    }

    navigation.navigate(item.route);
  };

  const handleMenuPress = (item) => {
    navigateToSidebarTarget(item);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Header with Hamburger ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSidebarVisible(true)}
          style={styles.hamburgerButton}
        >
          <Ionicons name="menu" size={26} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <View style={styles.logoShield}>
            <Ionicons name="shield-checkmark" size={22} color={COLORS.white} />
          </View>
          <Text style={styles.headerTitle}>Police Monitor</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>3</Text>
          </View>
        </TouchableOpacity>

      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.cyan}
            colors={[COLORS.cyan]}
          />
        }
      >
        {/* ── Today Overview ──────────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={20} color={COLORS.blue} />
            <Text style={styles.sectionTitle}>Today Overview</Text>
          </View>

          <View style={[styles.statsGrid, isSmallScreen && styles.statsGridCompact]}>
            <StatCard
              icon="clipboard-outline"
              title="Total Reports"
              value={stats.totalReports}
              trend="+12%"
              subtitle="vs yesterday"
              color={COLORS.blue}
            />
            <StatCard
              icon="person-outline"
              title="Missing Reports"
              value={stats.missingReports}
              trend="+8%"
              subtitle="vs yesterday"
              color={COLORS.red}
            />
            <StatCard
              icon="eye-outline"
              title="Sighting Reports"
              value={stats.sightingReports}
              trend="+15%"
              subtitle="vs yesterday"
              color={COLORS.cyan}
            />
            <StatCard
              icon="checkmark-circle"
              title="Solved Reports"
              value={stats.solvedReports}
              trend="+10%"
              subtitle="vs yesterday"
              color={COLORS.green}
            />
          </View>

          <View style={[styles.statsGrid, isSmallScreen && styles.statsGridCompact]}>
            <StatCard
              icon="shield-checkmark"
              title="Pending Verification"
              value={stats.pendingVerification}
              trend="+9%"
              subtitle="vs yesterday"
              color={COLORS.orange}
            />
            <StatCard
              icon="chatbubble-ellipses"
              title="AI Chat Queries"
              value={stats.aiChatQueries}
              trend="+14%"
              subtitle="vs yesterday"
              color={COLORS.purple}
            />
            <StatCard
              icon="image-outline"
              title="AI Image Checks"
              value={stats.aiImageChecks}
              trend="+18%"
              subtitle="vs yesterday"
              color={COLORS.cyan}
            />
            <StatCard
              icon="alert-triangle"
              title="Urgent Reports"
              value={stats.urgentReports}
              trend="+5%"
              subtitle="vs yesterday"
              color={COLORS.red}
            />
          </View>
        </View>

        {/* ── Reports Overview Chart (GRAPH) ──────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.chartHeader}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up" size={20} color={COLORS.blue} />
              <Text style={styles.sectionTitle}>Reports Overview</Text>
            </View>
            <TouchableOpacity style={styles.dropdownBtn}>
              <Text style={styles.dropdownText}>7 Days</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          <LineChart
            data={chartData}
            width={Math.max(screenWidth - 48, 280)}
            height={200}
            chartConfig={{
              backgroundColor: "transparent",
              backgroundGradientFrom: COLORS.bg,
              backgroundGradientTo: COLORS.bg,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(38, 150, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(159, 175, 208, ${opacity})`,
              style: { borderRadius: 12 },
              propsForDots: {
                r: "5",
                strokeWidth: "2",
                stroke: COLORS.cyan,
              },
              propsForBackgroundLines: {
                stroke: "rgba(42, 122, 255, 0.15)",
                strokeDasharray: "4 4",
              },
            }}
            bezier={false}
            withDots={true}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            style={{
              marginVertical: 8,
              borderRadius: 12,
            }}
            fromZero
          />
        </View>

        {/* ── Recent Reports ──────────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.listHeader}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color={COLORS.blue} />
              <Text style={styles.sectionTitle}>Recent Reports</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("PoliceReports")}>
              <Text style={styles.viewAll}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.blue} />
            </TouchableOpacity>
          </View>

          {recentReports.length === 0 ? (
            <EmptyMini label="No recent reports yet" />
          ) : (
            recentReports.map((report) => {
              const status = (report.status || "").toLowerCase();
              const type = (report.reportType || "").toLowerCase();
              const isSighting = type === "sighting" || status === "sighting";
              const isSolved = status === "resolved" || status === "solved" || status === "found";

              return (
                <ReportRow
                  key={report.id}
                  icon={isSighting ? "eye" : "person"}
                  iconColor={isSighting ? COLORS.blue : isSolved ? COLORS.green : COLORS.red}
                  title={getReportHeading(report)}
                  location={getReportLocation(report)}
                  time={getReportTime(report.createdAt)}
                  status={isSolved ? "Solved" : isSighting ? "Sighting" : "Missing"}
                  statusColor={isSolved ? COLORS.green : isSighting ? COLORS.blue : COLORS.red}
                />
              );
            })
          )}
        </View>

        {/* ── Recent Sightings ─────────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.listHeader}>
            <View style={styles.sectionHeader}>
              <Ionicons name="eye" size={20} color={COLORS.cyan} />
              <Text style={styles.sectionTitle}>Recent Sightings</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("PoliceSightings")}>
              <Text style={styles.viewAll}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.blue} />
            </TouchableOpacity>
          </View>

          {recentSightings.length === 0 ? (
            <EmptyMini label="No recent sightings yet" />
          ) : (
            recentSightings.map((item) => {
              const status = (item.status || "").toLowerCase();
              const isVerified = status === "confirmed";
              const isRejected = status === "not_found";
              return (
                <SightingRow
                  key={item.id}
                  iconColor={isVerified ? COLORS.green : isRejected ? COLORS.red : COLORS.orange}
                  title={getSightingTitle(item)}
                  time={getSightingTime(item)}
                  status={isVerified ? "Verified" : isRejected ? "Rejected" : "Pending"}
                  statusColor={isVerified ? COLORS.green : isRejected ? COLORS.red : COLORS.orange}
                  statusIcon={isVerified ? "checkmark-circle" : isRejected ? "close-circle" : "time-outline"}
                />
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Navigation ──────────────────────────────────────────────── */}
      {/* ── Sidebar Modal ──────────────────────────────────────────────────── */}
      <Modal
        visible={sidebarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSidebarVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.overlay}
          onPress={() => setSidebarVisible(false)}
        >
          <View style={styles.sidebar}>
            {/* Sidebar Header */}
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarLogo}>
                <Ionicons name="shield-checkmark" size={32} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.sidebarTitle}>Police Monitor</Text>
                <Text style={styles.sidebarSubtitle}>Monitoring Dashboard</Text>
              </View>
            </View>

            {/* Menu Items */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.menuScroll}
              contentContainerStyle={styles.menuContainer}
            >
              {MENU_ITEMS.map((item) => {
                const isActive = activeMenu === item.id;
                const itemColor = item.color || (isActive ? COLORS.cyan : COLORS.muted);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      isActive && styles.menuItemActive,
                    ]}
                    onPress={() => handleMenuPress(item)}
                    activeOpacity={0.8}
                  >
                    {/* Active Glow Effect */}
                    {isActive && <View style={styles.activeGlow} />}

                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name={isActive ? item.icon : `${item.icon}-outline`}
                        size={22}
                        color={isActive ? COLORS.white : itemColor}
                      />
                    </View>
                    <Text
                      style={[
                        styles.menuText,
                        isActive && styles.menuTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, title, value, trend, subtitle, color }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={26} color={color} style={{ marginBottom: 8 }} />
      <Text style={styles.statTitle}>{title}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color: COLORS.white }]}>{value}</Text>
        <View style={styles.trendBadge}>
          <Ionicons name="arrow-up" size={10} color={COLORS.green} />
          <Text style={styles.trendText}>{trend}</Text>
        </View>
      </View>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );
}

function ReportRow({ icon, iconColor, title, location, time, status, statusColor }) {
  return (
    <TouchableOpacity style={styles.reportRow} activeOpacity={0.8}>
      <View style={[styles.rowIcon, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text numberOfLines={1} style={styles.rowTitle}>{title}</Text>
        <View style={styles.rowMeta}>
          <Ionicons name="location-outline" size={12} color={COLORS.muted} />
          <Text numberOfLines={1} style={styles.rowLocation}>{location}</Text>
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text numberOfLines={1} style={styles.rowTime}>{time}</Text>
        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SightingRow({ iconColor, title, time, status, statusColor, statusIcon }) {
  return (
    <TouchableOpacity style={styles.reportRow} activeOpacity={0.8}>
      <View style={[styles.rowIcon, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name="eye" size={20} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text numberOfLines={1} style={styles.rowTitle}>{title}</Text>
        <Text numberOfLines={1} style={styles.rowTimeSmall}>{time}</Text>
      </View>
      <View style={[styles.statusBadge, { borderColor: statusColor }]}>
        <Ionicons name={statusIcon} size={12} color={statusColor} />
        <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyMini({ label }) {
  return (
    <View style={styles.emptyMini}>
      <Ionicons name="document-text-outline" size={26} color={COLORS.muted} />
      <Text style={styles.emptyMiniText}>{label}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    padding: 14,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  hamburgerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  logoShield: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  notifBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  notifBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },

  /* Section cards */
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  viewAll: {
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: "800",
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(2,11,31,0.4)",
  },
  dropdownText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },

  /* Stats grid */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  statsGridCompact: {
    gap: 8,
  },
  statCard: {
    width: "48%",
    backgroundColor: COLORS.card2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    padding: 12,
    alignItems: "center",
  },
  statTitle: {
    color: COLORS.softWhite,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  trendText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "800",
  },
  statSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "600",
  },

  emptyMini: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMiniText: {
    color: COLORS.muted,
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  /* Report rows */
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rowLocation: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
    maxWidth: 132,
  },
  rowTime: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  rowTimeSmall: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
  },

  /* Sidebar */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sidebar: {
    width: width * 0.78,
    maxWidth: 320,
    height: "100%",
    backgroundColor: COLORS.sidebarBg,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sidebarLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  sidebarTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
  },
  sidebarSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  menuScroll: {
    flex: 1,
  },
  menuContainer: {
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
    position: "relative",
  },
  menuItemActive: {
    backgroundColor: "rgba(38, 150, 255, 0.15)",
  },
  activeGlow: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    backgroundColor: COLORS.cyan,
    borderRadius: 4,
  },
  menuIconContainer: {
    width: 24,
    alignItems: "center",
    marginRight: 16,
  },
  menuText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "700",
  },
  menuTextActive: {
    color: COLORS.white,
    fontWeight: "900",
  },
});
