








// Screens/police/PoliceSightingReportsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { useSafeReturn } from "../context/SafeReturnContext";

const COLORS = {
  bg: "#020B1F",
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
  yellow: "#FFB800",
  purple: "#8B3FF2",
};

const FILTERS = ["All", "Pending", "Verified", "Rejected"];

export default function PoliceSightingReportsScreen({ navigation }) {
  const route = useRoute();
  const { sightingReports = [], refresh } = useSafeReturn();
  const { width } = useWindowDimensions();

  // ── NEW: 2-column grid on phones, 4-column on tablets (same as PoliceReportsScreen) ──
  const filterColumns = width >= 720 ? 4 : 2;
  const filterGap = 10;
  const filterTileWidth = React.useMemo(() => {
    const horizontalPadding = 32;
    const availableWidth = Math.max(width - horizontalPadding, 0);
    return Math.max(
      0,
      Math.floor((availableWidth - filterGap * (filterColumns - 1)) / filterColumns)
    );
  }, [filterColumns, width]);

  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const initialFilter = route?.params?.initialFilter || "All";
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [sightings, setSightings] = useState([]);

  useEffect(() => {
    refresh?.();
  }, [refresh]);

  useEffect(() => {
    const normalizedSightings = Array.isArray(sightingReports)
      ? sightingReports.map((item) => normalizeSightingReport(item))
      : [];
    setSightings(normalizedSightings);
    setLoading(false);
  }, [sightingReports]);

  useEffect(() => {
    setSelectedFilter(initialFilter);
  }, [initialFilter]);

  const filteredSightings = sightings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item.location.toLowerCase().includes(searchText.toLowerCase());
    const matchesFilter =
      selectedFilter === "All" || getStatusGroup(item.status) === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  function getStatusGroup(status) {
    const value = String(status || "").toLowerCase();
    if (value.includes("not_found") || value.includes("reject")) return "Rejected";
    if (
      value.includes("confirm") ||
      value.includes("verif") ||
      value.includes("approve") ||
      value.includes("solv") ||
      value.includes("found")
    ) {
      return "Verified";
    }
    if (
      value.includes("pend") ||
      value.includes("review") ||
      value.includes("publish")
    ) {
      return "Pending";
    }
    return "Pending";
  }

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "verified":
        return COLORS.green;
      case "pending":
        return COLORS.orange;
      case "rejected":
        return COLORS.red;
      default:
        return COLORS.muted;
    }
  };

  const getIconColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "verified":
        return COLORS.green;
      case "pending":
        return COLORS.orange;
      case "rejected":
        return COLORS.red;
      default:
        return COLORS.blue;
    }
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("PoliceDashboard")
          }
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.logoShield}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.white} />
          </View>
          <Text style={styles.headerTitle}>Sighting Reports</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sightings by location"
            placeholderTextColor={COLORS.muted}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="funnel-outline" size={22} color={COLORS.blue} />
        </TouchableOpacity>
      </View>

      {/* ── REPLACED: horizontal ScrollView → flex-wrap grid, same as PoliceReportsScreen ── */}
      <View style={styles.filterGrid}>
        {FILTERS.map((filter) => {
          const isActive = selectedFilter === filter;

          // icon per filter (matches PoliceReportsScreen convention)
          const iconName =
            filter === "Pending"
              ? "time-outline"
              : filter === "Verified"
              ? "checkmark-circle-outline"
              : filter === "Rejected"
              ? "close-circle-outline"
              : null; // "All" has no icon

          // icon colour when inactive
          const iconColor = isActive
            ? COLORS.white
            : filter === "Pending"
            ? COLORS.orange
            : filter === "Verified"
            ? COLORS.green
            : filter === "Rejected"
            ? COLORS.red
            : COLORS.blue;

          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                { width: filterTileWidth },
                isActive && styles.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              {iconName && (
                <Ionicons name={iconName} size={16} color={iconColor} />
              )}
              <Text
                style={[
                  styles.filterText,
                  isActive ? styles.filterTextActive : styles.filterTextInactive,
                ]}
                numberOfLines={1}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sightings List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      >
        {filteredSightings.map((item) => (
          <SightingCard
            key={item.id}
            item={item}
            iconColor={getIconColor(item.status)}
            statusColor={getStatusColor(item.status)}
            onPress={() =>
              Alert.alert(
                "Sighting Details",
                "The detailed sighting view is not wired yet. The list and filters are active."
              )
            }
          />
        ))}
        {filteredSightings.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No sightings found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SightingCard({ item, iconColor, statusColor, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, styles.cardUniform]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name="eye" size={28} color={iconColor} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.muted} />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={14} color={COLORS.muted} />
          <Text style={styles.timeText}>{item.dateTime}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.caseId}>Case ID: {item.id}</Text>
        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <Ionicons
            name={
              item.status === "Verified"
                ? "checkmark-circle"
                : item.status === "Rejected"
                ? "close-circle"
                : "time-outline"
            }
            size={14}
            color={statusColor}
          />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function normalizeSightingReport(item = {}) {
  const rawStatus = item.status || item.reportStatus || item.verificationStatus || "Pending";
  const loweredStatus = String(rawStatus).toLowerCase();
  let status = "Pending";
  if (loweredStatus.includes("not_found") || loweredStatus.includes("reject")) {
    status = "Rejected";
  } else if (
    loweredStatus.includes("confirm") ||
    loweredStatus.includes("verif") ||
    loweredStatus.includes("approve") ||
    loweredStatus.includes("solv") ||
    loweredStatus.includes("found")
  ) {
    status = "Verified";
  } else if (
    loweredStatus.includes("pend") ||
    loweredStatus.includes("review") ||
    loweredStatus.includes("publish")
  ) {
    status = "Pending";
  } else if (typeof rawStatus === "string") {
    status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
  }
  const title =
    item.title ||
    item.locationName ||
    item.lastSeenPlace ||
    item.placeName ||
    item.seenAt ||
    "Sighting report";
  const location =
    item.location ||
    item.city ||
    item.address ||
    item.lastSeenLocation ||
    "Location not provided";
  const rawDate = item.dateTime || item.createdAt || item.updatedAt || item.seenDate;
  const dateTime =
    typeof rawDate === "string"
      ? rawDate
      : rawDate
        ? new Date(rawDate).toLocaleString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Unknown time";

  return {
    ...item,
    id: item.id || item.reportId || item.sightingId || item.caseId || `${title}-${dateTime}`,
    title,
    location,
    dateTime,
    status,
  };
}

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  logoShield: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
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
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 12,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── NEW filter styles (replaces filterScroll + old filterTab) ──
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: "900",
  },
  filterTextInactive: {
    color: COLORS.muted,
  },

  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
    alignItems: "center",
  },
  cardUniform: {
    minHeight: 108,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 6,
    width: 128,
    marginLeft: 10,
    flexShrink: 0,
  },
  caseId: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
    minWidth: 104,
    justifyContent: "center",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
});
