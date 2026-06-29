



// Screens/public/RecentSightingsScreen.js

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
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeReturn } from "../../Screens/context/SafeReturnContext";

const { width, height } = Dimensions.get("window");

const isSmall = width < 380;
const isVerySmall = width < 350;
const isTinyHeight = height < 700;

const COLORS = {
  bg: "#03102B",
  card: "rgba(255,255,255,0.055)",
  input: "rgba(2,14,36,0.72)",
  border: "rgba(91,148,226,0.32)",
  borderSoft: "rgba(91,148,226,0.18)",
  white: "#FFFFFF",
  muted: "#AFC4E8",
  soft: "#C8D8F4",
  blue: "#2F8CFF",
  blue2: "#4C9EFF",
  green: "#78F15E",
  red: "#FF4058",
  orange: "#F59E0B",
  purple: "#A855F7",
};

function getStatusColor(status, verified) {
  const value = String(status || "").toLowerCase();

  if (verified || value.includes("verified")) return COLORS.blue;
  if (value.includes("review")) return COLORS.orange;
  if (value.includes("closed")) return COLORS.purple;
  if (value.includes("new")) return COLORS.green;

  return COLORS.green;
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

function normalizeSighting(item, formatTimeAgo) {
  const createdAt = item?.createdAt || new Date().toISOString();
  const status = item?.status || "New";
  const statusColor = item?.statusColor || getStatusColor(status, item?.verified);

  return {
    ...item,
    id: item?.id || item?.sightingId || `${Date.now()}`,
    personName: item?.personName || item?.name || "Unknown Person",
    age: item?.age || "Age N/A",
    gender: item?.gender || "Gender N/A",
    location:
      item?.location ||
      item?.seenAddress ||
      item?.lastSeenPlace ||
      "Sighting location not provided",
    dateTime:
      item?.dateTime ||
      [item?.seenDate, item?.seenTime].filter(Boolean).join(", ") ||
      (formatTimeAgo ? formatTimeAgo(createdAt) : "Just now"),
    reportedBy: item?.reportedBy || item?.contactName || "Community Member",
    status,
    statusColor,
    image: getSightingImage(item),
    details: item?.details || "No additional details provided.",
    contactName: item?.contactName || item?.reportedBy || "Community Member",
    phone: item?.phone || item?.phoneNumber || item?.contactNumber || "Not provided",
    verified: item?.verified || false,
    createdAt,
  };
}

export default function RecentSightingsScreen({ navigation, route }) {
  const { sightingReports = [], alerts = [], alertUnreadCount = 0, formatTimeAgo } = useSafeReturn();

  const [selectedSighting, setSelectedSighting] = useState(
    route?.params?.sighting || null
  );

  const alertCount = alertUnreadCount;

  const sightings = useMemo(() => {
    return [...sightingReports]
      .map((item) => normalizeSighting(item, formatTimeAgo))
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
  }, [sightingReports, formatTimeAgo]);

  const goTo = (screen, params) => {
    if (navigation && screen) {
      navigation.navigate(screen, params);
    }
  };

  const goBack = () => {
    if (selectedSighting) {
      setSelectedSighting(null);
      return;
    }

    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      goTo("PublicHome");
    }
  };

  if (selectedSighting) {
    return (
      <SightingDetailsView
        sighting={normalizeSighting(selectedSighting, formatTimeAgo)}
        onBack={goBack}
        goTo={goTo}
        alertCount={alertCount}
      />
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.headerButton}
              onPress={goBack}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Recent Sightings</Text>

            <TouchableOpacity activeOpacity={0.85} style={styles.headerButton}>
              <Ionicons name="filter-outline" size={25} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoBanner}>
            <Ionicons
              name="information-circle-outline"
              size={26}
              color={COLORS.blue}
            />

            <Text style={styles.infoBannerText}>
              These are the latest sightings reported by the community.
            </Text>
          </View>

          {sightings.length > 0 ? (
            <View style={styles.listWrap}>
              {sightings.map((item) => (
                <SightingCard
                  key={item.id}
                  item={item}
                  onPress={() => setSelectedSighting(item)}
                />
              ))}
            </View>
          ) : (
            <EmptySightingsBox onPress={() => goTo("ReportNowScreen")} />
          )}

          <View style={styles.thankBox}>
            <View style={styles.thankIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={30}
                color={COLORS.white}
              />
            </View>

            <View style={styles.thankTextBox}>
              <Text style={styles.thankTitle}>Thank you!</Text>
              <Text style={styles.thankSub}>
                Your reports help keep our community safe.
              </Text>
            </View>
          </View>
        </ScrollView>

        <BottomNavigation goTo={goTo} active="Report" alertCount={alertCount} />
      </SafeAreaView>
    </View>
  );
}

function SightingCard({ item, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.sightingCard}
      onPress={onPress}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.sightingImage} />
      ) : (
        <View style={styles.sightingImagePlaceholder}>
          <Ionicons name="image-outline" size={28} color={COLORS.muted} />
        </View>
      )}

      <View style={styles.sightingInfo}>
        <Text style={styles.sightingName} numberOfLines={1}>
          {item.personName}
        </Text>

        <Text style={styles.sightingMeta} numberOfLines={1}>
          {item.age}  •  {item.gender}
        </Text>

        <InfoLine
          icon="location-outline"
          color={COLORS.green}
          text={item.location}
        />

        <InfoLine
          icon="calendar-outline"
          color={COLORS.blue}
          text={item.dateTime}
        />

        <InfoLine
          icon="person-outline"
          color={COLORS.blue}
          text={`Reported by ${item.reportedBy}`}
        />
      </View>

      <View style={styles.cardRight}>
        <View
          style={[
            styles.statusBadge,
            {
              borderColor: item.statusColor,
              backgroundColor: `${item.statusColor}18`,
            },
          ]}
        >
          <Text
            style={[styles.statusBadgeText, { color: item.statusColor }]}
            numberOfLines={1}
          >
            {item.status}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={26} color={COLORS.white} />
      </View>
    </TouchableOpacity>
  );
}

function InfoLine({ icon, color, text }) {
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={styles.infoLineText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function EmptySightingsBox({ onPress }) {
  return (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIcon}>
        <Ionicons name="eye-outline" size={34} color={COLORS.blue2} />
      </View>

      <Text style={styles.emptyTitle}>No sightings yet</Text>

      <Text style={styles.emptySub}>
        Sighting reports submitted by users will appear here.
      </Text>

      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.emptyButton}
        onPress={onPress}
      >
        <Ionicons name="add" size={18} color={COLORS.white} />
        <Text style={styles.emptyButtonText}>Report Sighting</Text>
      </TouchableOpacity>
    </View>
  );
}

function SightingDetailsView({ sighting, onBack, goTo, alertCount }) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.headerButton}
              onPress={onBack}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Sighting Details</Text>

            <TouchableOpacity activeOpacity={0.85} style={styles.headerButton}>
              <Ionicons
                name="share-social-outline"
                size={23}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsHeroCard}>
            {sighting.image ? (
              <Image source={{ uri: sighting.image }} style={styles.detailsImage} />
            ) : (
              <View style={styles.detailsImagePlaceholder}>
                <Ionicons name="image-outline" size={34} color={COLORS.muted} />
              </View>
            )}

            <View style={styles.detailsHeroInfo}>
              <View
                style={[
                  styles.detailsStatusBadge,
                  {
                    borderColor: sighting.statusColor,
                    backgroundColor: `${sighting.statusColor}18`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.detailsStatusText,
                    { color: sighting.statusColor },
                  ]}
                  numberOfLines={1}
                >
                  {sighting.status}
                </Text>
              </View>

              <Text style={styles.detailsName} numberOfLines={2}>
                {sighting.personName}
              </Text>

              <Text style={styles.detailsMeta} numberOfLines={1}>
                {sighting.age}  •  {sighting.gender}
              </Text>

              <View style={styles.verifiedRow}>
                <Ionicons
                  name={sighting.verified ? "checkmark-circle" : "time-outline"}
                  size={17}
                  color={sighting.verified ? COLORS.green : COLORS.orange}
                />

                <Text style={styles.verifiedText} numberOfLines={1}>
                  {sighting.verified
                    ? "Verified sighting"
                    : "Pending verification"}
                </Text>
              </View>
            </View>
          </View>

          <DetailSection icon="location-outline" title="Sighting Location">
            <Text style={styles.detailMainText}>{sighting.location}</Text>
          </DetailSection>

          <DetailSection icon="calendar-outline" title="Date & Time">
            <Text style={styles.detailMainText}>{sighting.dateTime}</Text>
          </DetailSection>

          <DetailSection icon="document-text-outline" title="Sighting Details">
            <Text style={styles.detailDescription}>{sighting.details}</Text>
          </DetailSection>

          <DetailSection icon="person-outline" title="Reported By">
            <View style={styles.reporterRow}>
              <View style={styles.reporterAvatar}>
                <Ionicons name="person" size={26} color={COLORS.white} />
              </View>

              <View style={styles.reporterInfo}>
                <Text style={styles.reporterName} numberOfLines={1}>
                  {sighting.contactName}
                </Text>

                <Text style={styles.reporterPhone} numberOfLines={1}>
                  {sighting.phone}
                </Text>
              </View>

              <TouchableOpacity activeOpacity={0.85} style={styles.callButton}>
                <Feather name="phone" size={15} color={COLORS.blue2} />
                <Text style={styles.callText}>Call</Text>
              </TouchableOpacity>
            </View>
          </DetailSection>

          <View style={styles.noticeBox}>
            <Ionicons
              name="information-circle-outline"
              size={28}
              color={COLORS.blue}
            />

            <Text style={styles.noticeText}>
              This sighting will be reviewed and shared with the original report owner.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.primaryButton}
            onPress={() => goTo("ReportNowScreen", { person: sighting })}
          >
            <Ionicons name="send-outline" size={22} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>Report Another Sighting</Text>
          </TouchableOpacity>
        </ScrollView>

        <BottomNavigation goTo={goTo} active="Report" alertCount={alertCount} />
      </SafeAreaView>
    </View>
  );
}

function DetailSection({ icon, title, children }) {
  return (
    <View style={styles.detailSection}>
      <View style={styles.detailHeader}>
        <Ionicons name={icon} size={21} color={COLORS.green} />
        <Text style={styles.detailTitle}>{title}</Text>
      </View>

      <View style={styles.detailBody}>{children}</View>
    </View>
  );
}

function BottomNavigation({ goTo, active, alertCount }) {
  const badge =
    alertCount && alertCount > 0 ? (alertCount > 9 ? "9+" : String(alertCount)) : "";

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
        <Ionicons name="add" size={34} color={COLORS.green} />
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
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.bottomItem}
      onPress={onPress}
    >
      <View>
        <Ionicons
          name={icon}
          size={23}
          color={active ? COLORS.green : COLORS.muted}
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
    paddingHorizontal: isVerySmall ? 10 : isSmall ? 12 : 14,
    paddingTop: Platform.OS === "android" ? 12 : 8,
    paddingBottom: Platform.OS === "ios" ? 108 : 94,
  },

  header: {
    minHeight: isTinyHeight ? 54 : 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerButton: {
    width: isVerySmall ? 38 : 42,
    height: isVerySmall ? 38 : 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: isVerySmall ? 18 : isSmall ? 20 : 23,
    fontWeight: "900",
  },

  infoBanner: {
    borderRadius: 14,
    borderWidth: 1.1,
    borderColor: COLORS.blue,
    backgroundColor: "rgba(47,140,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  infoBannerText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 14,
    lineHeight: isVerySmall ? 17 : 19,
    fontWeight: "600",
    marginLeft: 10,
    flex: 1,
  },

  listWrap: {
    gap: 10,
  },

  sightingCard: {
    borderRadius: 15,
    borderWidth: 1.1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: isVerySmall ? 9 : 10,
    flexDirection: "row",
    alignItems: "center",
  },

  sightingImage: {
    width: isVerySmall ? 76 : isSmall ? 84 : 92,
    height: isVerySmall ? 76 : isSmall ? 84 : 92,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  sightingImagePlaceholder: {
    width: isVerySmall ? 76 : isSmall ? 84 : 92,
    height: isVerySmall ? 76 : isSmall ? 84 : 92,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  sightingInfo: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 10,
  },

  sightingName: {
    color: COLORS.white,
    fontSize: isVerySmall ? 14 : isSmall ? 15 : 17,
    fontWeight: "900",
    marginBottom: 3,
  },

  sightingMeta: {
    color: COLORS.soft,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 14,
    fontWeight: "600",
    marginBottom: 6,
  },

  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    minWidth: 0,
  },

  infoLineText: {
    color: COLORS.soft,
    fontSize: isVerySmall ? 10.5 : isSmall ? 11.5 : 12.5,
    fontWeight: "600",
    marginLeft: 6,
    flex: 1,
  },

  cardRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: isSmall ? 88 : 96,
    marginLeft: 6,
  },

  statusBadge: {
    borderWidth: 1.1,
    borderRadius: 8,
    paddingHorizontal: isVerySmall ? 7 : 9,
    paddingVertical: 5,
    maxWidth: 90,
  },

  statusBadgeText: {
    fontSize: isVerySmall ? 10 : 11,
    fontWeight: "900",
  },

  emptyBox: {
    borderRadius: 16,
    borderWidth: 1.1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 20,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(47,140,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: isSmall ? 16 : 18,
    fontWeight: "900",
  },

  emptySub: {
    color: COLORS.muted,
    fontSize: isSmall ? 12 : 13,
    fontWeight: "600",
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
  },

  emptyButton: {
    marginTop: 14,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 7,
  },

  thankBox: {
    borderRadius: 14,
    borderWidth: 1.1,
    borderColor: COLORS.blue,
    backgroundColor: "rgba(47,140,255,0.10)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  thankIcon: {
    width: isSmall ? 46 : 52,
    height: isSmall ? 46 : 52,
    borderRadius: 14,
    backgroundColor: "rgba(47,140,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  thankTextBox: {
    flex: 1,
  },

  thankTitle: {
    color: COLORS.white,
    fontSize: isSmall ? 14 : 16,
    fontWeight: "900",
  },

  thankSub: {
    color: COLORS.soft,
    fontSize: isSmall ? 12 : 13,
    fontWeight: "600",
    marginTop: 2,
  },

  detailsHeroCard: {
    borderRadius: 17,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 12,
    flexDirection: "row",
    marginBottom: 12,
  },

  detailsImage: {
    width: isVerySmall ? 100 : isSmall ? 112 : 126,
    height: isVerySmall ? 118 : isSmall ? 130 : 145,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  detailsImagePlaceholder: {
    width: isVerySmall ? 100 : isSmall ? 112 : 126,
    height: isVerySmall ? 118 : isSmall ? 130 : 145,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  detailsHeroInfo: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "center",
    minWidth: 0,
  },

  detailsStatusBadge: {
    alignSelf: "flex-start",
    borderWidth: 1.1,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 8,
    maxWidth: 120,
  },

  detailsStatusText: {
    fontSize: 11,
    fontWeight: "900",
  },

  detailsName: {
    color: COLORS.white,
    fontSize: isVerySmall ? 20 : isSmall ? 22 : 25,
    fontWeight: "900",
  },

  detailsMeta: {
    color: COLORS.soft,
    fontSize: isSmall ? 13 : 15,
    fontWeight: "700",
    marginTop: 5,
  },

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },

  verifiedText: {
    color: COLORS.soft,
    fontSize: isSmall ? 11 : 12.5,
    fontWeight: "700",
    marginLeft: 6,
  },

  detailSection: {
    borderRadius: 15,
    borderWidth: 1.1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    marginBottom: 11,
    overflow: "hidden",
  },

  detailHeader: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  detailTitle: {
    color: COLORS.white,
    fontSize: isSmall ? 14 : 15.5,
    fontWeight: "900",
    marginLeft: 9,
  },

  detailBody: {
    padding: 12,
  },

  detailMainText: {
    color: COLORS.soft,
    fontSize: isSmall ? 13 : 14.5,
    fontWeight: "700",
    lineHeight: isSmall ? 19 : 21,
  },

  detailDescription: {
    color: COLORS.soft,
    fontSize: isSmall ? 12.5 : 14,
    fontWeight: "600",
    lineHeight: isSmall ? 19 : 21,
  },

  reporterRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  reporterAvatar: {
    width: isSmall ? 46 : 52,
    height: isSmall ? 46 : 52,
    borderRadius: 26,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  reporterInfo: {
    flex: 1,
    minWidth: 0,
  },

  reporterName: {
    color: COLORS.white,
    fontSize: isSmall ? 13.5 : 15,
    fontWeight: "900",
  },

  reporterPhone: {
    color: COLORS.blue2,
    fontSize: isSmall ? 12 : 13,
    fontWeight: "700",
    marginTop: 3,
  },

  callButton: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.blue,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  callText: {
    color: COLORS.blue2,
    fontSize: 12.5,
    fontWeight: "900",
    marginLeft: 5,
  },

  noticeBox: {
    borderRadius: 14,
    borderWidth: 1.1,
    borderColor: COLORS.blue,
    backgroundColor: "rgba(47,140,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
  },

  noticeText: {
    flex: 1,
    color: COLORS.white,
    fontSize: isSmall ? 12 : 13,
    lineHeight: isSmall ? 18 : 20,
    fontWeight: "600",
    marginLeft: 10,
  },

  primaryButton: {
    height: isSmall ? 52 : 56,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 10,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: isSmall ? 14 : 16,
    fontWeight: "900",
    marginLeft: 8,
  },

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: Platform.OS === "ios" ? 92 : 78,
    backgroundColor: "rgba(5,25,65,0.98)",
    borderTopWidth: 1.2,
    borderColor: COLORS.borderSoft,
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
    color: COLORS.green,
  },

  fabButton: {
    width: isVerySmall ? 54 : isSmall ? 58 : 64,
    height: isVerySmall ? 54 : isSmall ? 58 : 64,
    borderRadius: 32,
    backgroundColor: "#112338",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.32)",
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
