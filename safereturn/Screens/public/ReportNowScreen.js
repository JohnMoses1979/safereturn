


// Screens/public/ReportNowScreen.js

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
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useSafeReturn } from "../../Screens/context/SafeReturnContext";

const { width, height } = Dimensions.get("window");

const isSmall = width < 380;
const isVerySmall = width < 350;
const isTinyHeight = height < 700;

const COLORS = {
  bg: "#03102B",
  card: "rgba(255,255,255,0.055)",
  input: "rgba(2,14,36,0.72)",
  border: "rgba(150,170,205,0.42)",
  borderSoft: "rgba(91,148,226,0.20)",
  white: "#FFFFFF",
  muted: "#AFC4E8",
  soft: "#C8D8F4",
  blue: "#2F8CFF",
  blue2: "#4C9EFF",
  red: "#FF4058",
  success: "#22C55E",
  yellow: "#FACC15",
};

const SIGHTING_OPTIONS = [
  "Walking alone",
  "With another person",
  "In a vehicle",
  "At bus stop / railway station",
  "Near school / public place",
  "Other",
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getRewardNumber(value) {
  const cleaned = String(value || "").replace(/[^0-9]/g, "");
  const parsed = parseInt(cleaned, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizePerson(rawPerson) {
  const person = rawPerson || {};

  const rewardAmount = getRewardNumber(
    person.rewardAmount ||
      person.reward ||
      person.rewardMoney ||
      person.rewardValue ||
      person.rewardText
  );

  return {
    id: person.id || person.reportId || person.personId || "",
    reportId: person.reportId || person.id || person.personId || "",
    name:
      person.name ||
      person.personName ||
      person.fullName ||
      person.missingPersonName ||
      "Unknown Person",
    age: person.age || "Age N/A",
    gender: person.gender || "Gender N/A",
    location:
      person.location ||
      person.lastSeenPlace ||
      person.originalLocation ||
      "Location not provided",
    lastSeen:
      person.lastSeenTimeShort ||
      person.lastSeen ||
      person.reportedTime ||
      person.dateTime ||
      "Last seen details not provided",
    status: person.status || "NEW",
    image:
      person.image ||
      person.photoUrl ||
      person.imageUri ||
      person.photoUri ||
      person.personImage ||
      person.missingPersonImage ||
      "",
    rewardAmount,
    rewardCurrency: person.rewardCurrency || "INR",
    rewardText:
      person.rewardText ||
      (rewardAmount > 0 ? `₹${rewardAmount}` : "No reward added"),
    rewardEnabled:
      person.rewardEnabled !== undefined
        ? person.rewardEnabled
        : rewardAmount > 0,
  };
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildAddressFromGeocode(geo = {}, coords = {}) {
  const parts = [
    geo.name,
    geo.street,
    geo.district,
    geo.city,
    geo.region,
    geo.postalCode,
    geo.country,
  ].filter(Boolean);

  const address = parts.join(", ");

  if (address) return address;

  if (coords.latitude && coords.longitude) {
    return `Lat: ${coords.latitude}, Lng: ${coords.longitude}`;
  }

  return "";
}

function getCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days = [];

  for (let i = 0; i < startPadding; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function getTimeOptions() {
  const options = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      const date = new Date();
      date.setHours(hour);
      date.setMinutes(minute);
      date.setSeconds(0);
      options.push(formatTime(date));
    }
  }

  return options;
}

export default function ReportNowScreen({ navigation, route }) {
  const { addSightingReport, alerts = [], alertUnreadCount = 0 } = useSafeReturn();

  const person = useMemo(
    () =>
      normalizePerson(
        route?.params?.person ||
          route?.params?.missingPerson ||
          route?.params?.sighting ||
          null
      ),
    [route?.params]
  );

  const alertCount = alertUnreadCount;
  const rewardAmount = Number(String(person.rewardAmount || person.rewardText || 0).replace(/[^0-9]/g, "")) || 0;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [seenDate, setSeenDate] = useState(formatDate(new Date()));
  const [seenTime, setSeenTime] = useState(formatTime(new Date()));

  const [locationText, setLocationText] = useState("");
  const [liveLocation, setLiveLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [seenOption, setSeenOption] = useState("");
  const [details, setDetails] = useState("");
  const [photoUri, setPhotoUri] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);

  const [dateModal, setDateModal] = useState(false);
  const [timeModal, setTimeModal] = useState(false);
  const [optionModal, setOptionModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const goTo = (screen, params) => {
    if (navigation && screen) {
      navigation.navigate(screen, params);
    }
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      goTo("PublicHome");
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const resetForm = () => {
    setSelectedDate(new Date());
    setSeenDate(formatDate(new Date()));
    setSeenTime(formatTime(new Date()));
    setLocationText("");
    setLiveLocation(null);
    setLoadingLocation(false);
    setSeenOption("");
    setDetails("");
    setPhotoUri("");
    setPhotoLoading(false);
    setSubmitting(false);
    setMessage({ type: "", text: "" });
  };

  const pickPhoto = async () => {
    try {
      setPhotoLoading(true);
      setMessage({ type: "", text: "" });

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setPhotoLoading(false);
        showMessage("error", "Photo permission is required to upload an image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.length) {
        setPhotoUri(result.assets[0].uri);
        showMessage("success", "Photo uploaded successfully.");
      }

      setPhotoLoading(false);
    } catch (error) {
      console.log("pickPhoto error:", error);
      setPhotoLoading(false);
      showMessage("error", "Unable to upload photo. Please try again.");
    }
  };

  const fetchLiveLocation = async () => {
    try {
      setLoadingLocation(true);
      setMessage({ type: "", text: "" });

      const serviceEnabled = await Location.hasServicesEnabledAsync();

      if (!serviceEnabled) {
        setLoadingLocation(false);
        showMessage("error", "Please turn on GPS / location services.");
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setLoadingLocation(false);
        showMessage("error", "Location permission is required.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = Number(current?.coords?.latitude || 0);
      const longitude = Number(current?.coords?.longitude || 0);

      if (!latitude || !longitude) {
        setLoadingLocation(false);
        showMessage("error", "Unable to fetch location. Please try again.");
        return;
      }

      let address = `Lat: ${latitude}, Lng: ${longitude}`;

      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (reverse?.length) {
          address = buildAddressFromGeocode(reverse[0], {
            latitude,
            longitude,
          });
        }
      } catch (geoError) {
        console.log("reverseGeocode error:", geoError);
      }

      const liveData = {
        latitude,
        longitude,
        accuracy: current?.coords?.accuracy || null,
        timestamp: current?.timestamp || Date.now(),
      };

      setLiveLocation(liveData);
      setLocationText(address);
      setLoadingLocation(false);
      showMessage("success", "Live location added successfully.");
    } catch (error) {
      console.log("fetchLiveLocation error:", error);
      setLoadingLocation(false);
      showMessage("error", "Unable to fetch live location.");
    }
  };

  const validateForm = () => {
    if (!seenDate) {
      showMessage("error", "Please select sighting date.");
      return false;
    }

    if (!seenTime) {
      showMessage("error", "Please select sighting time.");
      return false;
    }

    if (!locationText.trim()) {
      showMessage("error", "Please enter location or use live location.");
      return false;
    }

    if (!seenOption) {
      showMessage("error", "Please select how you saw the person.");
      return false;
    }

    return true;
  };

  const submitReport = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const now = new Date().toISOString();
      const reportId = `SG-${Date.now()}`;

      const report = {
        id: reportId,
        sightingId: reportId,
        reportType: "Sighting",
        type: "Sighting",
        status: "New",
        verified: false,

        personId: person.id,
        missingPersonId: person.id,
        missingReportId: person.reportId,
        personName: person.name,
        name: person.name,
        age: person.age,
        gender: person.gender,
        originalLocation: person.location,
        missingPersonImage: person.image,

        rewardAmount: rewardAmount,
        rewardCurrency: person.rewardCurrency || "INR",
        rewardText:
          rewardAmount > 0 ? `₹${rewardAmount}` : "No reward added",
        rewardEnabled: rewardAmount > 0,

        seenDate,
        seenTime,
        dateTime: `${seenDate}, ${seenTime}`,

        location: locationText.trim(),
        seenAddress: locationText.trim(),
        lastSeenPlace: locationText.trim(),

        liveLocation,
        latitude: liveLocation?.latitude || null,
        longitude: liveLocation?.longitude || null,

        seenOption,
        details: details.trim() || "No additional details provided.",

        photoUri,
        imageUri: photoUri,
        image: photoUri || person.image,
        sightingImage: photoUri,

        reportedBy: "Community Member",
        contactName: "Community Member",
        phone: "Not provided",

        createdAt: now,
        updatedAt: now,
      };

      await addSightingReport(report);

      setSubmitting(false);
      setSuccessModal(true);
      showMessage("success", "Sighting submitted successfully.");
    } catch (error) {
      console.log("submitReport error:", error);
      setSubmitting(false);
      showMessage("error", error.message || "Unable to submit report. Please try again.");
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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

              <Text style={styles.headerTitle}>Report Sighting</Text>

              <View style={styles.shieldIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={29}
                  color={COLORS.blue}
                />
              </View>
            </View>

            <View style={styles.personCard}>
              <View style={styles.personImageWrap}>
                {person.image ? (
                  <Image source={{ uri: person.image }} style={styles.personImage} />
                ) : (
                  <View style={styles.personImagePlaceholder}>
                    <Ionicons
                      name="person-outline"
                      size={32}
                      color={COLORS.muted}
                    />
                  </View>
                )}

                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>{person.status || "NEW"}</Text>
                </View>

                {rewardAmount > 0 && (
                  <View style={styles.photoRewardBadge}>
                    <Ionicons name="gift" size={12} color={COLORS.bg} />
                  </View>
                )}
              </View>

              <View style={styles.personInfo}>
                <Text style={styles.personName} numberOfLines={1}>
                  {person.name}
                </Text>

                <Text style={styles.personMeta}>
                  {person.age} • {person.gender}
                </Text>

                {rewardAmount > 0 && (
                  <View style={styles.rewardBadge}>
                    <Ionicons
                      name="gift-outline"
                      size={14}
                      color={COLORS.yellow}
                    />
                    <Text style={styles.rewardText} numberOfLines={1}>
                      Reward ₹{rewardAmount}
                    </Text>
                  </View>
                )}

                <View style={styles.personLine}>
                  <Ionicons name="location-outline" size={17} color={COLORS.blue} />
                  <Text style={styles.personLineText} numberOfLines={1}>
                    {person.location}
                  </Text>
                </View>

                <View style={styles.personLine}>
                  <Ionicons name="time-outline" size={17} color={COLORS.blue} />
                  <Text style={styles.personLineText} numberOfLines={1}>
                    {person.lastSeen}
                  </Text>
                </View>
              </View>
            </View>

            {rewardAmount > 0 && (
              <View style={styles.rewardInfoBox}>
                <Ionicons name="gift-outline" size={22} color={COLORS.yellow} />
                <Text style={styles.rewardInfoText}>
                  This case has a reward of ₹{rewardAmount}. Submit accurate
                  sighting information to help find the person.
                </Text>
              </View>
            )}

            {message.text ? (
              <View
                style={[
                  styles.messageBox,
                  message.type === "success"
                    ? styles.messageSuccess
                    : styles.messageError,
                ]}
              >
                <Ionicons
                  name={
                    message.type === "success"
                      ? "checkmark-circle-outline"
                      : "information-circle-outline"
                  }
                  size={20}
                  color={
                    message.type === "success" ? COLORS.success : COLORS.red
                  }
                />

                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            ) : null}

            <View style={styles.formSection}>
              <FieldTitle
                icon="calendar-outline"
                title="When did you see the person?"
              />

              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.dateTimeBox}
                  onPress={() => setDateModal(true)}
                >
                  <Ionicons name="calendar-outline" size={19} color={COLORS.muted} />
                  <Text style={styles.dateTimeText}>
                    {seenDate || "Select date"}
                  </Text>
                  <Ionicons name="chevron-down" size={17} color={COLORS.muted} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.dateTimeBox}
                  onPress={() => setTimeModal(true)}
                >
                  <Ionicons name="time-outline" size={20} color={COLORS.muted} />
                  <Text style={styles.dateTimeText}>
                    {seenTime || "Select time"}
                  </Text>
                  <Ionicons name="chevron-down" size={17} color={COLORS.muted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <FieldTitle
                icon="location-outline"
                title="Where did you see the person?"
              />

              <View style={styles.inputBox}>
                <TextInput
                  value={locationText}
                  onChangeText={setLocationText}
                  placeholder="Enter location or area"
                  placeholderTextColor="#8C9DBD"
                  style={styles.input}
                  cursorColor={COLORS.blue}
                  selectionColor={COLORS.blue}
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.locationIconButton}
                  onPress={fetchLiveLocation}
                  disabled={loadingLocation}
                >
                  {loadingLocation ? (
                    <ActivityIndicator size="small" color={COLORS.blue} />
                  ) : (
                    <Ionicons name="locate-outline" size={21} color={COLORS.blue} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.liveLocationButton}
                onPress={fetchLiveLocation}
                disabled={loadingLocation}
              >
                {loadingLocation ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons
                    name="navigate-circle-outline"
                    size={20}
                    color={COLORS.white}
                  />
                )}

                <Text style={styles.liveLocationButtonText}>
                  {loadingLocation
                    ? "Getting Live Location..."
                    : "Use Live Location"}
                </Text>
              </TouchableOpacity>

              {liveLocation?.latitude && liveLocation?.longitude ? (
                <Text style={styles.coordinatesText} numberOfLines={1}>
                  Lat: {liveLocation.latitude}, Lng: {liveLocation.longitude}
                </Text>
              ) : null}

              <Text style={styles.helperText}>
                Be specific, e.g., Near MG Road Metro Station.
              </Text>
            </View>

            <View style={styles.formSection}>
              <FieldTitle
                icon="eye-outline"
                title="How did you see the person?"
              />

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.selectBox}
                onPress={() => setOptionModal(true)}
              >
                <Text
                  style={[styles.selectText, !seenOption && styles.placeholderText]}
                >
                  {seenOption || "Select an option"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
              <FieldTitle icon="reader-outline" title="Additional Details" />

              <View style={styles.detailsBox}>
                <TextInput
                  value={details}
                  onChangeText={(text) => setDetails(text.slice(0, 500))}
                  placeholder="Provide any additional details..."
                  placeholderTextColor="#8C9DBD"
                  multiline
                  style={styles.detailsInput}
                  cursorColor={COLORS.blue}
                  selectionColor={COLORS.blue}
                  maxLength={500}
                />

                <Text style={styles.counterText}>{details.length}/500</Text>
              </View>
            </View>

            <View style={styles.formSection}>
              <FieldTitle
                icon="image-outline"
                title="Upload Photo"
                optional="(Optional)"
              />

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.uploadBox}
                onPress={pickPhoto}
              >
                {photoLoading ? (
                  <ActivityIndicator size="large" color={COLORS.blue} />
                ) : photoUri ? (
                  <>
                    <Image source={{ uri: photoUri }} style={styles.uploadPreview} />
                    <View style={styles.changePhotoOverlay}>
                      <Ionicons
                        name="camera-outline"
                        size={17}
                        color={COLORS.white}
                      />
                      <Text style={styles.changePhotoText}>Change Photo</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.uploadContent}>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={31}
                      color={COLORS.blue}
                    />
                    <Text style={styles.uploadTitle}>Tap to upload a photo</Text>
                    <Text style={styles.uploadSub}>
                      Supports JPG, PNG up to 5MB
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={30}
                color={COLORS.blue}
              />

              <Text style={styles.infoText}>
                Your report will be reviewed by our team.{"\n"}
                Thank you for helping us.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.submitButton}
              onPress={submitReport}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="send-outline" size={25} color={COLORS.white} />
                  <Text style={styles.submitText}>Submit Report</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.bottomNav}>
            <BottomItem
              icon="home-outline"
              label="Home"
              onPress={() => goTo("PublicHome")}
            />

            <BottomItem
              icon="document-text-outline"
              label="Reports"
              onPress={() => goTo("PublicReports")}
            />

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.fabButton}
              onPress={() => goTo("ReportNowScreen")}
            >
              <Ionicons name="add" size={32} color={COLORS.blue} />
            </TouchableOpacity>

            <BottomItem
              active
              icon="notifications-outline"
              label="Alerts"
              badge={
                alertCount > 0 ? (alertCount > 9 ? "9+" : String(alertCount)) : ""
              }
              onPress={() => goTo("PublicAlerts")}
            />

            <BottomItem
              icon="person-outline"
              label="Profile"
              onPress={() => goTo("PublicProfile")}
            />
          </View>
        </KeyboardAvoidingView>

        <CalendarModal
          visible={dateModal}
          selectedDate={selectedDate}
          onClose={() => setDateModal(false)}
          onSelect={(date) => {
            setSelectedDate(date);
            setSeenDate(formatDate(date));
            setDateModal(false);
          }}
        />

        <TimeModal
          visible={timeModal}
          selectedTime={seenTime}
          onClose={() => setTimeModal(false)}
          onSelect={(time) => {
            setSeenTime(time);
            setTimeModal(false);
          }}
        />

        <OptionModal
          visible={optionModal}
          onClose={() => setOptionModal(false)}
          onSelect={(value) => {
            setSeenOption(value);
            setOptionModal(false);
          }}
        />

        <SuccessModal
          visible={successModal}
          rewardAmount={rewardAmount}
          onClose={() => {
            setSuccessModal(false);
            resetForm();
            goTo("RecentSightings");
          }}
        />
      </SafeAreaView>
    </View>
  );
}

function FieldTitle({ icon, title, optional }) {
  return (
    <View style={styles.fieldTitleRow}>
      <Ionicons name={icon} size={22} color={COLORS.blue} />
      <Text style={styles.fieldTitle}>{title}</Text>
      {!!optional && <Text style={styles.optionalText}> {optional}</Text>}
    </View>
  );
}

function CalendarModal({ visible, selectedDate, onClose, onSelect }) {
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);

  const monthTitle = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const changeMonth = (direction) => {
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + direction, 1)
    );
  };

  const isSelectedDay = (day) => {
    if (!day || !selectedDate) return false;

    return (
      day.getFullYear() === selectedDate.getFullYear() &&
      day.getMonth() === selectedDate.getMonth() &&
      day.getDate() === selectedDate.getDate()
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>{monthTitle}</Text>

            <View style={styles.monthControls}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.monthButton}
                onPress={() => changeMonth(-1)}
              >
                <Ionicons name="chevron-back" size={18} color={COLORS.white} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.monthButton}
                onPress={() => changeMonth(1)}
              >
                <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weekRow}>
            {WEEK_DAYS.map((day) => (
              <Text key={day} style={styles.weekText}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              const selected = isSelectedDay(day);

              return (
                <TouchableOpacity
                  key={`${day?.toISOString?.() || "empty"}-${index}`}
                  activeOpacity={day ? 0.85 : 1}
                  style={[
                    styles.calendarDay,
                    selected && styles.calendarDayActive,
                  ]}
                  disabled={!day}
                  onPress={() => day && onSelect(day)}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      selected && styles.calendarDayTextActive,
                    ]}
                  >
                    {day ? day.getDate() : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function TimeModal({ visible, selectedTime, onClose, onSelect }) {
  const times = useMemo(() => getTimeOptions(), []);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>Select Time</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.timeList}
            contentContainerStyle={styles.timeListContent}
          >
            {times.map((time) => {
              const active = time === selectedTime;

              return (
                <TouchableOpacity
                  key={time}
                  activeOpacity={0.85}
                  style={[styles.timeItem, active && styles.timeItemActive]}
                  onPress={() => onSelect(time)}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={active ? COLORS.white : COLORS.muted}
                  />
                  <Text
                    style={[
                      styles.timeItemText,
                      active && styles.timeItemTextActive,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function OptionModal({ visible, onClose, onSelect }) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>Select Sighting Type</Text>

          {SIGHTING_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item}
              activeOpacity={0.85}
              style={styles.optionItem}
              onPress={() => onSelect(item)}
            >
              <Text style={styles.optionItemText}>{item}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function SuccessModal({ visible, rewardAmount, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.successOverlay}>
        <View style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={62} color={COLORS.success} />

          <Text style={styles.successTitle}>Sighting Submitted</Text>

          <Text style={styles.successText}>
            Thank you. Your sighting report has been saved and added to recent
            sightings.
          </Text>

          {Number(rewardAmount || 0) > 0 && (
            <View style={styles.successRewardBox}>
              <Ionicons name="gift-outline" size={18} color={COLORS.yellow} />
              <Text style={styles.successRewardText}>
                Reward linked: ₹{rewardAmount}
              </Text>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.successButton}
            onPress={onClose}
          >
            <Text style={styles.successButtonText}>View Recent Sightings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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

      <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

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
    paddingBottom: Platform.OS === "ios" ? 118 : 104,
  },

  header: {
    minHeight: isTinyHeight ? 56 : 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  headerButton: {
    width: isVerySmall ? 38 : 42,
    height: isVerySmall ? 38 : 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: COLORS.blue,
    fontSize: isVerySmall ? 18 : isSmall ? 20 : 22,
    fontWeight: "900",
  },

  shieldIcon: {
    width: isVerySmall ? 38 : 42,
    height: isVerySmall ? 38 : 42,
    alignItems: "center",
    justifyContent: "center",
  },

  personCard: {
    borderRadius: 15,
    backgroundColor: COLORS.card,
    borderWidth: 1.1,
    borderColor: COLORS.border,
    padding: isVerySmall ? 9 : 11,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },

  personImageWrap: {
    width: isVerySmall ? 78 : isSmall ? 86 : 96,
    height: isVerySmall ? 78 : isSmall ? 86 : 96,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: isVerySmall ? 10 : 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    flexShrink: 0,
  },

  personImage: {
    width: "100%",
    height: "100%",
  },

  personImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  newBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: COLORS.red,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    maxWidth: 74,
  },

  newBadgeText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 8 : 9,
    fontWeight: "900",
  },

  photoRewardBadge: {
    position: "absolute",
    right: 5,
    bottom: 5,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: COLORS.yellow,
    borderWidth: 2,
    borderColor: "rgba(3,16,43,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },

  personInfo: {
    flex: 1,
    minWidth: 0,
  },

  personName: {
    color: COLORS.blue,
    fontSize: isVerySmall ? 18 : isSmall ? 20 : 22,
    fontWeight: "900",
    marginBottom: 4,
  },

  personMeta: {
    color: COLORS.soft,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 14,
    fontWeight: "600",
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

  rewardInfoBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.45)",
    backgroundColor: "rgba(250,204,21,0.10)",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  rewardInfoText: {
    flex: 1,
    color: COLORS.white,
    fontSize: isVerySmall ? 11 : isSmall ? 12 : 13,
    fontWeight: "700",
    lineHeight: 18,
    marginLeft: 8,
  },

  personLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    minWidth: 0,
  },

  personLineText: {
    color: COLORS.soft,
    fontSize: isVerySmall ? 11 : isSmall ? 12 : 13,
    fontWeight: "600",
    marginLeft: 6,
    flex: 1,
  },

  messageBox: {
    borderRadius: 11,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  messageSuccess: {
    borderColor: "rgba(34,197,94,0.45)",
    backgroundColor: "rgba(34,197,94,0.12)",
  },

  messageError: {
    borderColor: "rgba(255,64,88,0.45)",
    backgroundColor: "rgba(255,64,88,0.12)",
  },

  messageText: {
    flex: 1,
    color: COLORS.white,
    fontSize: isSmall ? 11 : 12,
    fontWeight: "700",
    lineHeight: 17,
    marginLeft: 8,
  },

  formSection: {
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1.1,
    borderColor: COLORS.border,
    paddingHorizontal: isVerySmall ? 10 : 12,
    paddingVertical: isVerySmall ? 10 : 12,
    marginBottom: 9,
  },

  fieldTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  fieldTitle: {
    color: COLORS.white,
    fontSize: isVerySmall ? 13 : isSmall ? 14 : 15,
    fontWeight: "900",
    marginLeft: 9,
    flexShrink: 1,
  },

  optionalText: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 11 : isSmall ? 12 : 13,
    fontWeight: "500",
  },

  dateTimeRow: {
    flexDirection: "row",
    gap: 8,
  },

  dateTimeBox: {
    flex: 1,
    height: isVerySmall ? 42 : isSmall ? 45 : 48,
    borderRadius: 8,
    borderWidth: 1.1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.input,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: isVerySmall ? 8 : 10,
  },

  dateTimeText: {
    flex: 1,
    color: COLORS.soft,
    fontSize: isVerySmall ? 11 : isSmall ? 12 : 13,
    fontWeight: "600",
    marginLeft: 6,
  },

  inputBox: {
    minHeight: isVerySmall ? 42 : isSmall ? 46 : 50,
    borderRadius: 8,
    borderWidth: 1.1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.input,
    justifyContent: "center",
    paddingLeft: isVerySmall ? 10 : 12,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 14,
    fontWeight: "600",
    paddingVertical: 0,
  },

  locationIconButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  liveLocationButton: {
    marginTop: 8,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: COLORS.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  liveLocationButtonText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 11 : isSmall ? 12 : 13,
    fontWeight: "900",
    marginLeft: 6,
  },

  coordinatesText: {
    color: COLORS.blue2,
    fontSize: isSmall ? 10 : 11,
    fontWeight: "800",
    marginTop: 7,
  },

  helperText: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 10 : isSmall ? 10.5 : 11.5,
    fontWeight: "600",
    marginTop: 7,
    lineHeight: 15,
  },

  selectBox: {
    minHeight: isVerySmall ? 42 : isSmall ? 46 : 50,
    borderRadius: 8,
    borderWidth: 1.1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.input,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: isVerySmall ? 10 : 12,
  },

  selectText: {
    flex: 1,
    color: COLORS.white,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 14,
    fontWeight: "600",
  },

  placeholderText: {
    color: COLORS.muted,
  },

  detailsBox: {
    minHeight: isVerySmall ? 78 : isSmall ? 86 : 94,
    borderRadius: 8,
    borderWidth: 1.1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.input,
    paddingHorizontal: isVerySmall ? 10 : 12,
    paddingTop: 10,
    paddingBottom: 20,
  },

  detailsInput: {
    color: COLORS.white,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 14,
    fontWeight: "600",
    textAlignVertical: "top",
    minHeight: 48,
  },

  counterText: {
    position: "absolute",
    right: 11,
    bottom: 7,
    color: COLORS.muted,
    fontSize: isVerySmall ? 10 : 11,
    fontWeight: "700",
  },

  uploadBox: {
    minHeight: isVerySmall ? 86 : isSmall ? 96 : 106,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.blue,
    backgroundColor: COLORS.input,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  uploadContent: {
    alignItems: "center",
    justifyContent: "center",
  },

  uploadTitle: {
    color: COLORS.blue,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 14,
    fontWeight: "800",
    marginTop: 6,
  },

  uploadSub: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 10 : isSmall ? 11 : 12,
    fontWeight: "600",
    marginTop: 4,
  },

  uploadPreview: {
    width: "100%",
    height: "100%",
  },

  changePhotoOverlay: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(3,16,43,0.85)",
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  changePhotoText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 5,
  },

  infoBox: {
    borderRadius: 9,
    borderWidth: 1.2,
    borderColor: COLORS.blue,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    padding: isVerySmall ? 10 : 12,
    marginTop: 3,
    marginBottom: 12,
  },

  infoText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 11 : isSmall ? 12 : 13,
    lineHeight: isVerySmall ? 17 : isSmall ? 18 : 19,
    fontWeight: "500",
    marginLeft: 10,
    flex: 1,
  },

  submitButton: {
    height: isVerySmall ? 50 : isSmall ? 54 : 58,
    borderRadius: 13,
    backgroundColor: COLORS.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  submitText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 15 : isSmall ? 17 : 18,
    fontWeight: "900",
    marginLeft: 10,
  },

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: Platform.OS === "ios" ? 92 : 78,
    backgroundColor: "rgba(5,25,65,0.98)",
    borderTopWidth: 1.2,
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
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
    color: COLORS.blue,
  },

  fabButton: {
    width: isVerySmall ? 54 : isSmall ? 58 : 64,
    height: isVerySmall ? 54 : isSmall ? 58 : 64,
    borderRadius: 32,
    backgroundColor: "#111F32",
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },

  modalSheet: {
    maxHeight: "82%",
    backgroundColor: "#071A3A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 14,
  },

  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
  },

  monthControls: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  monthButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  weekRow: {
    flexDirection: "row",
    marginBottom: 6,
  },

  weekText: {
    width: `${100 / 7}%`,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },

  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  calendarDay: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  calendarDayActive: {
    backgroundColor: COLORS.blue,
    borderRadius: 11,
  },

  calendarDayText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  calendarDayTextActive: {
    color: COLORS.white,
    fontWeight: "900",
  },

  modalCloseButton: {
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },

  modalCloseText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },

  timeList: {
    maxHeight: 390,
  },

  timeListContent: {
    paddingBottom: 8,
  },

  timeItem: {
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginBottom: 8,
  },

  timeItemActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },

  timeItemText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 9,
  },

  timeItemTextActive: {
    color: COLORS.white,
  },

  optionItem: {
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginBottom: 8,
  },

  optionItemText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
  },

  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  successCard: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#071A3A",
    borderWidth: 1.2,
    borderColor: "rgba(34,197,94,0.45)",
    padding: 20,
    alignItems: "center",
  },

  successTitle: {
    color: COLORS.white,
    fontSize: isSmall ? 18 : 20,
    fontWeight: "900",
    marginTop: 10,
  },

  successText: {
    color: COLORS.muted,
    fontSize: isSmall ? 12 : 13,
    fontWeight: "600",
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 12,
  },

  successRewardBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.45)",
    backgroundColor: "rgba(250,204,21,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  successRewardText: {
    color: COLORS.yellow,
    fontSize: isSmall ? 12 : 13,
    fontWeight: "900",
    marginLeft: 7,
  },

  successButton: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
  },

  successButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },
});
