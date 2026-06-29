// Screens/police/AnalyticsScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { useSafeReturn } from "../context/SafeReturnContext";

const COLORS = {
  bg: "#020B1F",
  card: "#062A63",
  cardSoft: "rgba(255,255,255,0.05)",
  border: "rgba(42, 122, 255, 0.42)",
  white: "#FFFFFF",
  muted: "#9FAFD0",
  blue: "#2696FF",
  cyan: "#36CFFF",
  green: "#22D66B",
  red: "#FF3048",
  amber: "#FFB800",
};

export default function AnalyticsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const {
    fetchPoliceAnalytics,
    fetchPoliceReports,
    sightingReports = [],
  } = useSafeReturn();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [sightings, setSightings] = useState([]);

  const loadData = async () => {
    try {
      const [analyticsData, reportsData, sightingsData] = await Promise.all([
        fetchPoliceAnalytics?.(),
        fetchPoliceReports?.(0, 100),
        Promise.resolve(sightingReports),
      ]);

      setAnalytics(normalizeAnalytics(analyticsData));
      setReports(extractList(reportsData));
      setSightings(extractList(sightingsData));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const summary = useMemo(() => {
    const allReports = reports.length;
    const allSightings = sightings.length;
    const solvedReports = reports.filter((item) => isSolved(item.status)).length;
    const pendingReports = reports.filter((item) => isPending(item.status)).length;
    const pendingSightings = sightings.filter((item) => isPending(item.status)).length;
    const reportSeries = normalizeSeries(analytics?.dailyReports, reports.length);
    const sightingSeries = normalizeSeries(analytics?.dailySightings, sightings.length);

    return {
      totalReports: analytics?.totalReports ?? allReports,
      solvedCases: analytics?.solvedReports ?? solvedReports,
      pending: analytics?.pendingReports ?? pendingReports,
      sightings: analytics?.totalSightings ?? allSightings,
      pendingSightings,
      reportTrend: analytics?.reportTrend ?? trendFromSeries(reportSeries),
      solvedTrend: analytics?.solvedTrend ?? trendFromSeries(reportSeries),
      pendingTrend: analytics?.pendingTrend ?? trendFromSeries(reportSeries, true),
      sightingTrend: analytics?.sightingTrend ?? trendFromSeries(sightingSeries),
    };
  }, [analytics, reports, sightings]);

  const chartData = useMemo(() => {
    const reportSeries = normalizeSeries(analytics?.dailyReports, reports.length);
    const sightingSeries = normalizeSeries(analytics?.dailySightings, sightings.length);

    return {
      labels: analytics?.labels?.length === 7
        ? analytics.labels
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          data: reportSeries,
          color: () => COLORS.blue,
          strokeWidth: 2,
        },
        {
          data: sightingSeries,
          color: () => COLORS.cyan,
          strokeWidth: 2,
        },
      ],
      legend: ["Reports", "Sightings"],
    };
  }, [analytics, reports.length, sightings.length]);

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
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("PoliceDashboard")
            }
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.cyan}
              colors={[COLORS.cyan]}
            />
          }
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reports Overview</Text>
            <View style={styles.chartWrap}>
              <LineChart
                data={chartData}
                width={Math.max(width - 44, 300)}
                height={220}
                withDots={false}
                withInnerLines={false}
                withOuterLines={false}
                withHorizontalLabels
                withVerticalLabels
                withShadow={false}
                fromZero
                yAxisSuffix=""
                chartConfig={{
                  backgroundGradientFrom: "#173A7A",
                  backgroundGradientTo: "#173A7A",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(221, 232, 255, ${opacity})`,
                  propsForDots: { r: "0" },
                }}
                style={styles.chart}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Trends</Text>
            <AnalyticsItem
              label="Total Reports"
              value={formatNumber(summary.totalReports)}
              trend={formatTrend(summary.reportTrend)}
              color={COLORS.blue}
            />
            <AnalyticsItem
              label="Solved Cases"
              value={formatNumber(summary.solvedCases)}
              trend={formatTrend(summary.solvedTrend)}
              color={COLORS.green}
            />
            <AnalyticsItem
              label="Pending"
              value={formatNumber(summary.pending)}
              trend={formatTrend(summary.pendingTrend)}
              color={COLORS.red}
            />
            <AnalyticsItem
              label="Sightings"
              value={formatNumber(summary.sightings)}
              trend={formatTrend(summary.sightingTrend)}
              color={COLORS.amber}
              isLast
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function AnalyticsItem({ label, value, trend, color, isLast = false }) {
  return (
    <View style={[styles.analyticsItem, isLast && styles.analyticsItemLast]}>
      <Text style={styles.analyticsLabel}>{label}</Text>
      <View style={styles.analyticsRight}>
        <Text style={styles.analyticsValue}>{value}</Text>
        <Text style={[styles.analyticsTrend, { color }]}>{trend}</Text>
      </View>
    </View>
  );
}

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function normalizeAnalytics(data) {
  if (!data || Array.isArray(data)) return null;
  return {
    ...data,
    dailyReports: Array.isArray(data.dailyReports) ? data.dailyReports : null,
    dailySightings: Array.isArray(data.dailySightings) ? data.dailySightings : null,
    labels: Array.isArray(data.labels) ? data.labels : null,
  };
}

function normalizeSeries(values, fallbackCount) {
  if (Array.isArray(values) && values.length > 0) {
    return values.map((value) => Number(value) || 0);
  }
  const base = Math.max(Number(fallbackCount) || 0, 1);
  return [base - 2, base - 1, base, base + 1, base + 2, base + 1, base];
}

function isSolved(status) {
  const value = String(status || "").toLowerCase();
  return value.includes("solv") || value.includes("found") || value.includes("confirm") || value.includes("verif");
}

function isPending(status) {
  const value = String(status || "").toLowerCase();
  return value.includes("pend") || value.includes("review") || value.includes("publish");
}

function formatNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  return new Intl.NumberFormat("en-IN").format(numeric);
}

function formatTrend(value, fallback) {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value}%`;
  }
  return "+0%";
}

function trendFromSeries(series, invert = false) {
  if (!Array.isArray(series) || series.length < 2) return 0;
  const previous = Number(series[series.length - 2]) || 0;
  const current = Number(series[series.length - 1]) || 0;
  if (previous === 0) {
    if (current === 0) return 0;
    return invert ? -100 : 100;
  }
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  return Math.round(invert ? -delta : delta);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  placeholder: { width: 44 },
  content: { padding: 14, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { color: COLORS.white, fontSize: 16, fontWeight: "900", marginBottom: 14 },
  chartWrap: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  chart: {
    marginLeft: -10,
    marginRight: -10,
    borderRadius: 12,
  },
  analyticsItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  analyticsItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  analyticsLabel: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  analyticsRight: { alignItems: "flex-end" },
  analyticsValue: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  analyticsTrend: { fontSize: 12, fontWeight: "800", marginTop: 2 },
});
