

// Screens/public/MissingPersonDetailsScreen.js

import React, { useMemo, useState, useCallback } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { useSafeReturn } from "../../Screens/context/SafeReturnContext";

const { width, height } = Dimensions.get("window");

const isSmall = width < 380;
const isVerySmall = width < 350;
const isTinyHeight = height < 700;

const COLORS = {
  bg: "#03102B",
  card: "rgba(255,255,255,0.055)",
  cardStrong: "rgba(5,25,65,0.82)",
  border: "rgba(91,148,226,0.32)",
  borderSoft: "rgba(91,148,226,0.18)",
  white: "#FFFFFF",
  muted: "#AFC4E8",
  soft: "#C8D8F4",
  blue: "#2F8CFF",
  blue2: "#4C9EFF",
  red: "#FF4058",
  green: "#19C970",
  purple: "#5833B8",
  yellow: "#FACC15",
};

function getValue(...values) {
  const found = values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== ""
  );

  return found !== undefined && found !== null ? found : "";
}

function getRewardNumber(value) {
  const cleaned = String(value || "").replace(/[^0-9]/g, "");
  const parsed = parseInt(cleaned, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getPersonImage(person) {
  return getValue(
    person?.image,
    person?.photoUrl,
    person?.photoUri,
    person?.imageUri,
    person?.personImage,
    person?.missingPersonImage
  );
}

function getPersonName(person) {
  return getValue(
    person?.name,
    person?.fullName,
    person?.personName,
    person?.missingPersonName,
    "Unknown Person"
  );
}

function getPersonLocation(person) {
  return getValue(
    person?.location,
    person?.lastSeenPlace,
    person?.address,
    "Location not provided"
  );
}

function normalizePerson(rawPerson, missingReports = [], formatTimeAgo) {
  const routePerson = rawPerson || {};
  const routeId = routePerson.id || routePerson.reportId || routePerson.personId;

  const routeKeys = [routePerson.id, routePerson.reportId, routePerson.personId]
    .filter(Boolean)
    .map(String);

  const contextPerson =
    routeKeys.length && Array.isArray(missingReports)
      ? missingReports.find((item) => {
          const itemKeys = [item?.id, item?.reportId, item?.personId]
            .filter(Boolean)
            .map(String);

          return itemKeys.some((key) => routeKeys.includes(key));
        })
      : null;

  const person = {
    ...routePerson,
    ...(contextPerson || {}),
  };

  const createdAt = person.createdAt || new Date().toISOString();

  const name = getPersonName(person);
  const image = getPersonImage(person);
  const age = getValue(person.age, "Age N/A");
  const gender = getValue(person.gender, "Gender N/A");
  const location = getPersonLocation(person);

  const rewardAmount = getRewardNumber(
    person.rewardAmount ||
      person.reward ||
      person.rewardMoney ||
      person.rewardValue ||
      person.rewardText
  );

  const rewardEnabled =
    person.rewardEnabled !== undefined ? person.rewardEnabled : rewardAmount > 0;

  const rewardText =
    person.rewardText ||
    (rewardAmount > 0 ? `₹${rewardAmount}` : "No reward added");

  const personalInfo = {
    age,
    gender,
    height: getValue(person.height, person.personalInfo?.height, "Not provided"),
    weight: getValue(person.weight, person.personalInfo?.weight, "Not provided"),
    complexion: getValue(
      person.complexion,
      person.personalInfo?.complexion,
      "Not provided"
    ),
    hairColor: getValue(
      person.hairColor,
      person.personalInfo?.hairColor,
      "Not provided"
    ),
    eyeColor: getValue(
      person.eyeColor,
      person.personalInfo?.eyeColor,
      "Not provided"
    ),
    bodyType: getValue(
      person.bodyType,
      person.personalInfo?.bodyType,
      "Not provided"
    ),
  };

  const lastSeenPlace = getValue(
    person.lastSeenPlace,
    person.address,
    person.lastSeen?.place,
    person.location,
    "Last seen place not provided"
  );

  const lastSeenDateTime = getValue(
    person.lastSeen?.dateTime,
    person.lastSeen,
    person.date && person.missingTime
      ? `${person.date} • ${person.missingTime}`
      : "",
    person.lastSeenDate && person.lastSeenTime
      ? `${person.lastSeenDate} • ${person.lastSeenTime}`
      : "",
    person.lastSeenDate,
    "Last seen date/time not provided"
  );

  const wearing = getValue(
    person.lastSeen?.wearing,
    person.clothing ? `Last seen wearing ${person.clothing}.` : "",
    person.wearing ? `Last seen wearing ${person.wearing}.` : "",
    "Clothing details not provided."
  );

  const additionalInfo = Array.isArray(person.additionalInfo)
    ? person.additionalInfo.filter(Boolean)
    : [
        person.description,
        person.physicalDetails,
        person.otherDetails,
        person.identificationMarks,
      ].filter(Boolean);

  const reporterName = getValue(
    person.reportedBy?.name,
    person.reporterName,
    person.guardianName,
    "Not provided"
  );

  const reporterRelation = getValue(
    person.reportedBy?.relation,
    person.relationship,
    person.relation,
    "Not provided"
  );

  const reporterPhone = getValue(
    person.reportedBy?.phone,
    person.contactNumber,
    person.phoneNumber,
    person.phone,
    "Not provided"
  );

  return {
    ...person,
    id: person.id || person.reportId || routeId || "",
    reportId: person.reportId || person.id || routeId || "",
    name,
    age,
    gender,
    location,
    image,
    status: getValue(person.status, "Missing"),

    rewardAmount,
    rewardCurrency: person.rewardCurrency || "INR",
    rewardEnabled,
    rewardText,

    reportedTime: getValue(
      person.reportedTime,
      createdAt && formatTimeAgo ? `Reported ${formatTimeAgo(createdAt)}` : "",
      "Reported recently"
    ),
    lastSeenTimeShort: getValue(
      person.lastSeenTimeShort,
      person.time,
      createdAt && formatTimeAgo ? `Last seen ${formatTimeAgo(createdAt)}` : "",
      "Last seen details not provided"
    ),
    personalInfo,
    lastSeen: {
      place: lastSeenPlace,
      dateTime: lastSeenDateTime,
      wearing,
    },
    additionalInfo:
      additionalInfo.length > 0
        ? additionalInfo
        : ["No additional details provided."],
    reportedBy: {
      name: reporterName,
      relation: reporterRelation,
      phone: reporterPhone,
    },
  };
}

export default function MissingPersonDetailsScreen({ navigation, route }) {
  const {
    currentUser,
    missingReports = [],
    sightingReports = [],
    alerts = [],
    alertUnreadCount = 0,
    formatTimeAgo,
    toggleSavedPerson,
    isPersonSaved,
    moveToUnderReview,
    verifySighting,
    refresh,
  } = useSafeReturn();

  const [verifyingSightingId, setVerifyingSightingId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      refresh?.();
    }, [refresh])
  );

  const person = useMemo(
    () =>
      normalizePerson(
        route?.params?.person || route?.params?.missingPerson || null,
        missingReports,
        formatTimeAgo
      ),
    [route?.params, missingReports, formatTimeAgo]
  );

  const alertCount = alertUnreadCount;
  const saved = person.id ? isPersonSaved?.(person.id) : false;
  const hasPerson = !!person.id || person.name !== "Unknown Person";
  const rewardAmount = Number(person.rewardAmount || 0);

  const isOwner = currentUser && person.userId && Number(currentUser.id) === Number(person.userId);

  const linkedSightings = useMemo(() => {
    const personKeys = [person.id, person.reportId].filter(Boolean).map(String);

    return sightingReports.filter((sighting) => {
      const sightingKeys = [
        sighting?.personId,
        sighting?.missingReportId,
        sighting?.reportId,
      ]
        .filter(Boolean)
        .map(String);

      return sightingKeys.some((key) => personKeys.includes(key));
    });
  }, [sightingReports, person.id, person.reportId]);

  const goTo = (screen, params) => {
    if (navigation && screen) {
      navigation.navigate(screen, params);
    }
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      goTo("PublicReports");
    }
  };

  if (!hasPerson) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.emptyScreen}>
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.headerIconButton}
                onPress={goBack}
              >
                <Ionicons name="arrow-back" size={22} color={COLORS.white} />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Person Details</Text>

              <View style={styles.headerIconButton} />
            </View>

            <View style={styles.emptyBox}>
              <Ionicons name="person-outline" size={48} color={COLORS.blue2} />
              <Text style={styles.emptyTitle}>No person selected</Text>
              <Text style={styles.emptySub}>
                Please open a report from the Reports screen.
              </Text>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.emptyButton}
                onPress={() => goTo("PublicReports")}
              >
                <Text style={styles.emptyButtonText}>Go to Reports</Text>
              </TouchableOpacity>
            </View>
          </View>

          <BottomNavigation
            goTo={goTo}
            active="Reports"
            alertCount={alertCount}
          />
        </SafeAreaView>
      </View>
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
              style={styles.headerIconButton}
              onPress={goBack}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Person Details</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.headerIconButton}
              onPress={() => toggleSavedPerson?.(person)}
            >
              <Ionicons
                name={saved ? "bookmark" : "bookmark-outline"}
                size={22}
                color={saved ? COLORS.blue2 : COLORS.white}
              />
            </TouchableOpacity>
          </View>

          {person.status === "Resolved" && (
            <View style={styles.resolvedBanner}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resolvedTitle}>Safely Located</Text>
                <Text style={styles.resolvedText}>
                  This missing person has been verified as found. Thank you to everyone who helped search.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.heroSection}>
            <View style={styles.imageCard}>
              {person.image ? (
                <Image source={{ uri: person.image }} style={styles.personImage} />
              ) : (
                <View style={styles.personImagePlaceholder}>
                  <Ionicons
                    name="person-outline"
                    size={58}
                    color={COLORS.muted}
                  />
                </View>
              )}

              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>
                  {String(person.status || "NEW").toUpperCase().slice(0, 10)}
                </Text>
              </View>

              {rewardAmount > 0 && (
                <View style={styles.photoRewardBadge}>
                  <Ionicons name="gift" size={14} color={COLORS.bg} />
                  <Text style={styles.photoRewardText}>₹{rewardAmount}</Text>
                </View>
              )}
            </View>

            <View style={styles.heroInfo}>
              <Text style={styles.personName} numberOfLines={2}>
                {person.name}
              </Text>

              <Text style={styles.personMeta}>
                {person.age}
                {"  •  "}
                {person.gender}
              </Text>

              {rewardAmount > 0 && (
                <View style={styles.heroRewardBadge}>
                  <Ionicons name="gift-outline" size={15} color={COLORS.yellow} />
                  <Text style={styles.heroRewardText} numberOfLines={1}>
                    Reward ₹{rewardAmount}
                  </Text>
                </View>
              )}

              <InfoLine
                icon="location-sharp"
                iconType="ion"
                color={COLORS.red}
                text={person.location}
              />

              <InfoLine
                icon="clock"
                iconType="feather"
                color={COLORS.muted}
                text={person.reportedTime}
              />

              <InfoLine
                icon="eye-outline"
                iconType="ion"
                color={COLORS.blue}
                text={person.lastSeenTimeShort}
              />

              <View style={styles.statusBox}>
                <View style={styles.statusIconWrap}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={32}
                    color={COLORS.green}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.statusLabel}>Status</Text>
                  <Text style={styles.statusValue} numberOfLines={1}>
                    {person.status}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {rewardAmount > 0 && (
            <SectionCard
              icon="gift-outline"
              iconColor={COLORS.yellow}
              title="Reward Information"
            >
              <View style={styles.rewardCard}>
                <View style={styles.rewardIconBox}>
                  <Ionicons name="gift" size={28} color={COLORS.bg} />
                </View>

                <View style={styles.rewardInfoBox}>
                  <Text style={styles.rewardLabel}>Reward Amount</Text>
                  <Text style={styles.rewardValue}>₹{rewardAmount}</Text>
                  <Text style={styles.rewardNote}>
                    This reward amount is offered by the reporter for helpful
                    information.
                  </Text>
                </View>
              </View>
            </SectionCard>
          )}

          <SectionCard icon="person-outline" title="Personal Information">
            <View style={styles.infoGrid}>
              <View style={styles.infoColumn}>
                <DetailItem label="Age" value={person.personalInfo.age} />
                <DetailItem label="Gender" value={person.personalInfo.gender} />
                <DetailItem label="Height" value={person.personalInfo.height} />
                <DetailItem
                  label="Weight"
                  value={person.personalInfo.weight}
                  last
                />
              </View>

              <View style={styles.verticalDivider} />

              <View style={styles.infoColumn}>
                <DetailItem
                  label="Complexion"
                  value={person.personalInfo.complexion}
                />
                <DetailItem
                  label="Hair Color"
                  value={person.personalInfo.hairColor}
                />
                <DetailItem
                  label="Eye Color"
                  value={person.personalInfo.eyeColor}
                />
                <DetailItem
                  label="Body Type"
                  value={person.personalInfo.bodyType}
                  last
                />
              </View>
            </View>
          </SectionCard>

          <SectionCard
            icon="eye-outline"
            iconColor={COLORS.blue}
            title="Last Seen Information"
          >
            <View style={styles.lastSeenContent}>
              <IconTextRow
                icon="location-sharp"
                color={COLORS.red}
                text={person.lastSeen.place}
              />

              <IconTextRow
                icon="time-outline"
                color={COLORS.blue}
                text={person.lastSeen.dateTime}
              />

              <IconTextRow
                icon="document-text-outline"
                color={COLORS.blue}
                text={person.lastSeen.wearing}
              />
            </View>
          </SectionCard>

          <SectionCard
            icon="information-circle-outline"
            title="Additional Information"
          >
            <View style={styles.additionalBox}>
              {person.additionalInfo.map((item, index) => (
                <Text key={`info-${index}`} style={styles.bulletText}>
                  • {item}
                </Text>
              ))}
            </View>
          </SectionCard>

          <SectionCard icon="person-outline" title="Reported By">
            <View style={styles.reporterRow}>
              <View style={styles.reporterAvatar}>
                <Ionicons name="person" size={26} color={COLORS.white} />
              </View>

              <View style={styles.reporterInfo}>
                <Text style={styles.reporterName} numberOfLines={1}>
                  {person.reportedBy.name}{" "}
                  <Text style={styles.reporterRelation}>
                    ({person.reportedBy.relation})
                  </Text>
                </Text>

                <View style={styles.phoneRow}>
                  <Feather name="phone" size={14} color={COLORS.muted} />
                  <Text style={styles.phoneText} numberOfLines={1}>
                    {person.reportedBy.phone}
                  </Text>
                </View>
              </View>

              <TouchableOpacity activeOpacity={0.85} style={styles.callButton}>
                <Feather name="phone" size={16} color={COLORS.blue2} />
                <Text style={styles.callText}>Call</Text>
              </TouchableOpacity>
            </View>
          </SectionCard>

          {/* Sighting Reports Section Card */}
          <SectionCard icon="eye-outline" iconColor={COLORS.blue} title={`Sightings reported (${linkedSightings.length})`}>
            {linkedSightings.length === 0 ? (
              <Text style={styles.noSightingsText}>No sightings reported yet for this case.</Text>
            ) : (
              <View style={styles.sightingsList}>
                {linkedSightings.map((sighting) => {
                  const statusColors = {
                    PENDING_VERIFICATION: COLORS.yellow,
                    UNDER_REVIEW: COLORS.blue,
                    CONFIRMED: COLORS.green,
                    NOT_FOUND: COLORS.red,
                  };
                  const statusLabel = {
                    PENDING_VERIFICATION: "PENDING REVIEW",
                    UNDER_REVIEW: "UNDER REVIEW",
                    CONFIRMED: "CONFIRMED",
                    NOT_FOUND: "NOT FOUND / DISMISSED",
                  };
                  const statusColor = statusColors[sighting.status] || COLORS.muted;

                  return (
                    <View key={sighting.id} style={styles.sightingCard}>
                      <View style={styles.sightingHeader}>
                        <View style={styles.sightingReporterBox}>
                          <Text style={styles.sightingReporterName}>{sighting.reportedBy || "Community Member"}</Text>
                          <Text style={styles.sightingTime}>{sighting.time}</Text>
                        </View>
                        <View style={[styles.sightingStatusBadge, { borderColor: statusColor }]}>
                          <Text style={[styles.sightingStatusText, { color: statusColor }]}>
                            {statusLabel[sighting.status] || sighting.status}
                          </Text>
                        </View>
                      </View>

                      {sighting.image ? (
                        <Image source={{ uri: sighting.image }} style={styles.sightingImage} resizeMode="cover" />
                      ) : null}

                      <Text style={styles.sightingLocation}>
                        📍 {sighting.location}
                      </Text>
                      <Text style={styles.sightingDateTime}>
                        ⏰ Seen: {sighting.dateTime}
                      </Text>
                      <Text style={styles.sightingDetails}>
                        {sighting.details}
                      </Text>

                      {/* Verification actions for report owner */}
                      {isOwner && (
                        <View style={styles.ownerActionsWrapper}>
                          {sighting.status === "PENDING_VERIFICATION" && (
                            <TouchableOpacity
                              activeOpacity={0.8}
                              style={styles.reviewButton}
                              onPress={() => moveToUnderReview(sighting.id)}
                            >
                              <Feather name="eye" size={14} color={COLORS.white} />
                              <Text style={styles.reviewButtonText}>Mark Under Review</Text>
                            </TouchableOpacity>
                          )}

                          {(sighting.status === "PENDING_VERIFICATION" || sighting.status === "UNDER_REVIEW") && (
                            <>
                              {verifyingSightingId === sighting.id ? (
                                <View style={styles.verifyRewardConfirmBlock}>
                                  <Text style={styles.verifyRewardConfirmTitle}>
                                    Confirm Sighting & Award Reward?
                                  </Text>
                                  <Text style={styles.verifyRewardConfirmDesc}>
                                    Do you want to award the reward of ₹{person.rewardAmount || 0} to this contributor?
                                  </Text>
                                  <View style={styles.verifyConfirmButtonsRow}>
                                    <TouchableOpacity
                                      activeOpacity={0.8}
                                      style={[styles.verifyConfirmBtn, { backgroundColor: COLORS.green }]}
                                      onPress={() => {
                                        verifySighting(sighting.id, "CONFIRM", true, person.rewardAmount);
                                        setVerifyingSightingId(null);
                                      }}
                                    >
                                      <Text style={styles.verifyConfirmBtnText}>Yes (Reward)</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      activeOpacity={0.8}
                                      style={[styles.verifyConfirmBtn, { backgroundColor: COLORS.blue }]}
                                      onPress={() => {
                                        verifySighting(sighting.id, "CONFIRM", false, 0);
                                        setVerifyingSightingId(null);
                                      }}
                                    >
                                      <Text style={styles.verifyConfirmBtnText}>No Reward</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      activeOpacity={0.8}
                                      style={[styles.verifyConfirmBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
                                      onPress={() => setVerifyingSightingId(null)}
                                    >
                                      <Text style={styles.verifyConfirmBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ) : (
                                <View style={styles.ownerVerifyButtonsRow}>
                                  <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={[styles.verifyActionBtn, { borderColor: COLORS.green }]}
                                    onPress={() => {
                                      if (person.rewardAmount > 0) {
                                        setVerifyingSightingId(sighting.id);
                                      } else {
                                        verifySighting(sighting.id, "CONFIRM", false, 0);
                                      }
                                    }}
                                  >
                                    <Ionicons name="checkmark-circle-outline" size={15} color={COLORS.green} />
                                    <Text style={[styles.verifyActionBtnText, { color: COLORS.green }]}>Confirm</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={[styles.verifyActionBtn, { borderColor: COLORS.red }]}
                                    onPress={() => verifySighting(sighting.id, "NOT_FOUND", false, 0)}
                                  >
                                    <Ionicons name="close-circle-outline" size={15} color={COLORS.red} />
                                    <Text style={[styles.verifyActionBtnText, { color: COLORS.red }]}>Not Found</Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </>
                          )}

                          {sighting.status === "CONFIRMED" && (
                            <View style={styles.verifiedSightingMeta}>
                              <Text style={styles.verifiedSightingMetaText}>
                                Sighting confirmed by you. Reward offered: {sighting.sightingRewardOffered ? `₹${sighting.sightingRewardAmount}` : "None"}.
                              </Text>
                            </View>
                          )}

                          {sighting.status === "NOT_FOUND" && (
                            <View style={styles.verifiedSightingMeta}>
                              <Text style={styles.verifiedSightingMetaText}>
                                Marked as Not Found / Dismissed by you.
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </SectionCard>

          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.reportButton}
              onPress={() => goTo("ReportNowScreen", { person })}
            >
              <Ionicons name="warning" size={22} color={COLORS.red} />
              <Text style={styles.reportButtonText}>Report Sighting</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.shareButton}
              onPress={() => toggleSavedPerson?.(person)}
            >
              <Ionicons
                name={saved ? "bookmark" : "bookmark-outline"}
                size={22}
                color={COLORS.soft}
              />
              <Text style={styles.shareButtonText}>
                {saved ? "Saved Profile" : "Save This Profile"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <BottomNavigation goTo={goTo} active="Reports" alertCount={alertCount} />
      </SafeAreaView>
    </View>
  );
}

function InfoLine({ icon, iconType, color, text }) {
  return (
    <View style={styles.infoLine}>
      {iconType === "feather" ? (
        <Feather name={icon} size={16} color={color} />
      ) : (
        <Ionicons name={icon} size={17} color={color} />
      )}

      <Text style={styles.infoLineText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function SectionCard({ icon, iconColor, title, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={21} color={iconColor || COLORS.muted} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function DetailItem({ label, value, last }) {
  return (
    <View style={[styles.detailItem, last && styles.detailItemLast]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value || "Not provided"}
      </Text>
    </View>
  );
}

function IconTextRow({ icon, color, text }) {
  return (
    <View style={styles.iconTextRow}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.iconText}>{text || "Not provided"}</Text>
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
        active={active === "Reports"}
        icon="document-text-outline"
        label="Reports"
        onPress={() => goTo("PublicReports")}
      />

      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.fabButton}
        onPress={() => goTo("ReportMissingStep1")}
      >
        <Ionicons name="add" size={36} color="#FFFFFF" />
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
          size={26}
          color={active ? COLORS.blue2 : COLORS.muted}
        />

        {!!badge && (
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>{badge}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>
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

  emptyScreen: {
    flex: 1,
    paddingHorizontal: isVerySmall ? 12 : isSmall ? 14 : 18,
    paddingTop: Platform.OS === "android" ? 14 : 6,
    paddingBottom: Platform.OS === "ios" ? 120 : 108,
  },

  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 20,
    marginBottom: 10,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12,
  },

  emptySub: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
  },

  emptyButton: {
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 16,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },

  scrollContent: {
    paddingHorizontal: isVerySmall ? 12 : isSmall ? 14 : 18,
    paddingTop: Platform.OS === "android" ? 14 : 6,
    paddingBottom: Platform.OS === "ios" ? 120 : 108,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: isTinyHeight ? 16 : 22,
  },

  headerIconButton: {
    width: isVerySmall ? 44 : isSmall ? 48 : 52,
    height: isVerySmall ? 44 : isSmall ? 48 : 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1.2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: isVerySmall ? 17 : isSmall ? 19 : 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  heroSection: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
    alignItems: "flex-start",
  },

  imageCard: {
    width: isVerySmall ? 130 : isSmall ? 145 : 160,
    height: isVerySmall ? 170 : isSmall ? 188 : 208,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    flexShrink: 0,
  },

  personImage: {
    width: "100%",
    height: "100%",
  },

  personImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.cardStrong,
    alignItems: "center",
    justifyContent: "center",
  },

  newBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: COLORS.red,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    maxWidth: 90,
  },

  newBadgeText: {
    color: COLORS.white,
    fontSize: isSmall ? 10 : 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  photoRewardBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    maxWidth: "88%",
    borderRadius: 999,
    backgroundColor: COLORS.yellow,
    borderWidth: 2,
    borderColor: "rgba(5,25,65,0.95)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  photoRewardText: {
    color: COLORS.bg,
    fontSize: isVerySmall ? 10 : 11,
    fontWeight: "900",
    marginLeft: 4,
  },

  heroInfo: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 2,
    minWidth: 0,
  },

  personName: {
    color: COLORS.white,
    fontSize: isVerySmall ? 22 : isSmall ? 25 : 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: isVerySmall ? 28 : isSmall ? 31 : 34,
    marginBottom: 4,
  },

  personMeta: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 13 : isSmall ? 14 : 15,
    fontWeight: "800",
    marginBottom: 10,
  },

  heroRewardBadge: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.55)",
    backgroundColor: "rgba(250,204,21,0.12)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 9,
  },

  heroRewardText: {
    color: COLORS.yellow,
    fontSize: isVerySmall ? 11 : 12,
    fontWeight: "900",
    marginLeft: 5,
  },

  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  infoLineText: {
    color: COLORS.soft,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 13,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },

  statusBox: {
    marginTop: 10,
    minHeight: isSmall ? 66 : 74,
    borderRadius: 14,
    backgroundColor: "rgba(5,25,65,0.70)",
    borderWidth: 1.2,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: isSmall ? 12 : 14,
  },

  statusIconWrap: {
    width: isSmall ? 44 : 50,
    height: isSmall ? 44 : 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },

  statusLabel: {
    color: COLORS.muted,
    fontSize: isSmall ? 12 : 13,
    fontWeight: "700",
  },

  statusValue: {
    color: COLORS.red,
    fontSize: isSmall ? 16 : 18,
    fontWeight: "900",
    marginTop: 1,
  },

  sectionCard: {
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: 14,
  },

  sectionHeader: {
    minHeight: isSmall ? 52 : 58,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: isSmall ? 14 : 18,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: isVerySmall ? 14 : isSmall ? 15 : 16,
    fontWeight: "800",
    marginLeft: 10,
  },

  sectionBody: {
    paddingHorizontal: isSmall ? 14 : 18,
    paddingVertical: isSmall ? 14 : 16,
  },

  rewardCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.42)",
    backgroundColor: "rgba(250,204,21,0.10)",
    padding: isVerySmall ? 12 : 14,
    flexDirection: "row",
    alignItems: "center",
  },

  rewardIconBox: {
    width: isVerySmall ? 52 : 58,
    height: isVerySmall ? 52 : 58,
    borderRadius: 29,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },

  rewardInfoBox: {
    flex: 1,
    minWidth: 0,
  },

  rewardLabel: {
    color: COLORS.soft,
    fontSize: isVerySmall ? 11 : 12,
    fontWeight: "800",
  },

  rewardValue: {
    color: COLORS.yellow,
    fontSize: isVerySmall ? 24 : isSmall ? 27 : 30,
    fontWeight: "900",
    marginTop: 2,
  },

  rewardNote: {
    color: COLORS.soft,
    fontSize: isVerySmall ? 11 : 12,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 3,
  },

  infoGrid: {
    flexDirection: "row",
  },

  infoColumn: {
    flex: 1,
  },

  verticalDivider: {
    width: 1,
    backgroundColor: COLORS.borderSoft,
    marginHorizontal: isSmall ? 12 : 18,
  },

  detailItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
    paddingBottom: isSmall ? 11 : 13,
    marginBottom: isSmall ? 11 : 13,
  },

  detailItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: 0,
  },

  detailLabel: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 11 : isSmall ? 12 : 13,
    fontWeight: "700",
    marginBottom: 3,
  },

  detailValue: {
    color: COLORS.white,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 14,
    fontWeight: "700",
  },

  lastSeenContent: {
    gap: isSmall ? 10 : 12,
  },

  iconTextRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  iconText: {
    color: COLORS.soft,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 14,
    fontWeight: "600",
    lineHeight: isVerySmall ? 18 : isSmall ? 20 : 22,
    marginLeft: 10,
    flex: 1,
  },

  additionalBox: {
    gap: 6,
  },

  bulletText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 14,
    lineHeight: isVerySmall ? 19 : isSmall ? 21 : 22,
    fontWeight: "500",
  },

  reporterRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  reporterAvatar: {
    width: isVerySmall ? 50 : isSmall ? 54 : 60,
    height: isVerySmall ? 50 : isSmall ? 54 : 60,
    borderRadius: 30,
    backgroundColor: COLORS.purple,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },

  reporterInfo: {
    flex: 1,
    minWidth: 0,
  },

  reporterName: {
    color: COLORS.white,
    fontSize: isVerySmall ? 13 : isSmall ? 14 : 15,
    fontWeight: "900",
  },

  reporterRelation: {
    color: COLORS.soft,
    fontWeight: "600",
  },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  phoneText: {
    color: COLORS.blue2,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 14,
    fontWeight: "800",
    marginLeft: 6,
    flex: 1,
  },

  callButton: {
    height: isSmall ? 44 : 50,
    minWidth: isSmall ? 76 : 88,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: COLORS.blue,
    backgroundColor: "rgba(47,140,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginLeft: 8,
  },

  callText: {
    color: COLORS.blue2,
    fontSize: isSmall ? 13 : 14,
    fontWeight: "800",
    marginLeft: 6,
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  reportButton: {
    flex: 1,
    minHeight: isSmall ? 54 : 60,
    borderRadius: 16,
    borderWidth: 1.3,
    borderColor: COLORS.red,
    backgroundColor: "rgba(255,64,88,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  reportButtonText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 14,
    fontWeight: "800",
  },

  shareButton: {
    flex: 1,
    minHeight: isSmall ? 54 : 60,
    borderRadius: 16,
    borderWidth: 1.3,
    borderColor: COLORS.blue,
    backgroundColor: "rgba(47,140,255,0.13)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  shareButtonText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 14,
    fontWeight: "800",
  },

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: Platform.OS === "ios" ? 94 : 80,
    backgroundColor: "rgba(5,25,65,0.98)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1.2,
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: Platform.OS === "ios" ? 16 : 6,
    paddingTop: 10,
  },

  bottomItem: {
    width: "18%",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomLabel: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 10 : isSmall ? 11 : 12,
    fontWeight: "700",
    marginTop: 4,
  },

  bottomLabelActive: {
    color: COLORS.blue2,
  },

  navBadge: {
    position: "absolute",
    top: -8,
    right: -10,
    minWidth: 20,
    height: 20,
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
    fontSize: 10,
    fontWeight: "900",
  },

  fabButton: {
    width: isVerySmall ? 56 : isSmall ? 62 : 68,
    height: isVerySmall ? 56 : isSmall ? 62 : 68,
    borderRadius: 34,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -36,
    borderWidth: 4,
    borderColor: COLORS.bg,
    shadowColor: COLORS.blue,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  resolvedBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(25,201,112,0.15)",
    borderWidth: 1.2,
    borderColor: COLORS.green,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 12,
    alignItems: "center",
  },
  resolvedTitle: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "900",
  },
  resolvedText: {
    color: COLORS.soft,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 2,
  },
  noSightingsText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 10,
  },
  sightingsList: {
    gap: 12,
  },
  sightingCard: {
    backgroundColor: "rgba(5,25,65,0.72)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  sightingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  sightingReporterBox: {
    flex: 1,
  },
  sightingReporterName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
  sightingTime: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  sightingStatusBadge: {
    borderRadius: 6,
    borderWidth: 1.2,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  sightingStatusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  sightingImage: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
  },
  sightingLocation: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  sightingDateTime: {
    color: COLORS.soft,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  sightingDetails: {
    color: COLORS.soft,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "500",
  },
  ownerActionsWrapper: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
    gap: 8,
  },
  reviewButton: {
    backgroundColor: "#1460EE",
    height: 38,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  reviewButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  ownerVerifyButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  verifyActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  verifyActionBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },
  verifyRewardConfirmBlock: {
    backgroundColor: "rgba(250,204,21,0.08)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.3)",
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  verifyRewardConfirmTitle: {
    color: COLORS.yellow,
    fontSize: 13,
    fontWeight: "900",
  },
  verifyRewardConfirmDesc: {
    color: COLORS.soft,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  verifyConfirmButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  verifyConfirmBtn: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyConfirmBtnText: {
    color: COLORS.white,
    fontSize: 10.5,
    fontWeight: "900",
  },
  verifiedSightingMeta: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  verifiedSightingMetaText: {
    color: COLORS.muted,
    fontSize: 11.5,
    fontWeight: "600",
    lineHeight: 16,
  },
});
