

// Screens/public/ReportMissingStep1Screen.js

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

const SCREEN_PADDING = isVerySmall ? 10 : isSmall ? 12 : 14;
const PHOTO_SIZE = isVerySmall ? 90 : isSmall ? 100 : 112;

const COLORS = {
  bg: "#03102B",
  card: "rgba(255,255,255,0.055)",
  input: "rgba(2,14,36,0.72)",
  border: "rgba(150,170,205,0.36)",
  borderBlue: "rgba(47,140,255,0.45)",
  borderSoft: "rgba(91,148,226,0.18)",
  white: "#FFFFFF",
  muted: "#AFC4E8",
  soft: "#C8D8F4",
  blue: "#1478FF",
  blue2: "#4C9EFF",
  red: "#FF4058",
  green: "#22C55E",
  yellow: "#FACC15",
};

const GENDERS = ["Male", "Female", "Other"];
const COMPLEXIONS = ["Fair", "Wheatish", "Medium", "Dark"];
const HAIR_COLORS = ["Black", "Brown", "Blonde", "Grey", "Bald"];
const EYE_COLORS = ["Black", "Brown", "Blue", "Green", "Grey"];
const BODY_TYPES = ["Average", "Slim", "Athletic", "Heavy"];

const HEIGHTS = [
  "Below 3 ft",
  "3 ft - 4 ft",
  "4 ft - 5 ft",
  "5 ft - 6 ft",
  "Above 6 ft",
];

const CITIES = [
  "Bangalore",
  "Mysore",
  "Tumakuru",
  "Hyderabad",
  "Chennai",
  "Mumbai",
  "Delhi",
  "Other",
];

const STATES = [
  "Karnataka",
  "Telangana",
  "Andhra Pradesh",
  "Tamil Nadu",
  "Maharashtra",
  "Delhi",
  "Other",
];

const RELATIONSHIPS = [
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Guardian",
  "Friend",
  "Other",
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function getCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
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

  if (parts.length) return parts.join(", ");

  if (coords.latitude && coords.longitude) {
    return `Lat: ${coords.latitude}, Lng: ${coords.longitude}`;
  }

  return "";
}

export default function ReportMissingStep1Screen({ navigation }) {
  const { addMissingReport } = useSafeReturn();

  const [step, setStep] = useState(1);

  const [photoUri, setPhotoUri] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [heightValue, setHeightValue] = useState("");
  const [complexion, setComplexion] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [weightValue, setWeightValue] = useState("");
  const [lastSeenDate, setLastSeenDate] = useState("");
  const [lastSeenTime, setLastSeenTime] = useState("");

  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [liveLocation, setLiveLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [physicalDetails, setPhysicalDetails] = useState("");
  const [otherDetails, setOtherDetails] = useState("");
  const [extraPhotos, setExtraPhotos] = useState([]);

  const [reporterName, setReporterName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateModal, setDateModal] = useState(false);
  const [timeModal, setTimeModal] = useState(false);

  const [dropdownModal, setDropdownModal] = useState({
    visible: false,
    title: "",
    options: [],
    onSelect: null,
  });

  const [successModal, setSuccessModal] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  const cleanRewardAmount = Number(rewardAmount || 0);

  const goTo = (screen, params) => {
    if (navigation && screen) navigation.navigate(screen, params);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const resetForm = () => {
    setStep(1);
    setPhotoUri("");
    setPhotoLoading(false);

    setFullName("");
    setAge("");
    setGender("");
    setHeightValue("");
    setComplexion("");
    setHairColor("");
    setEyeColor("");
    setBodyType("");
    setWeightValue("");
    setLastSeenDate("");
    setLastSeenTime("");

    setAddress("");
    setLandmark("");
    setCity("");
    setStateName("");
    setPincode("");
    setLiveLocation(null);
    setLoadingLocation(false);

    setPhysicalDetails("");
    setOtherDetails("");
    setExtraPhotos([]);

    setReporterName("");
    setRelationship("");
    setPhoneNumber("");
    setEmailAddress("");
    setRewardAmount("");
    setConfirmed(false);

    setSelectedDate(new Date());
    setMessage({ type: "", text: "" });
  };

  const goBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      setMessage({ type: "", text: "" });
      return;
    }

    if (navigation?.canGoBack?.()) navigation.goBack();
    else goTo("PublicHome");
  };

  const openDropdown = (title, options, onSelect) => {
    setDropdownModal({
      visible: true,
      title,
      options,
      onSelect,
    });
  };

  const closeDropdown = () => {
    setDropdownModal({
      visible: false,
      title: "",
      options: [],
      onSelect: null,
    });
  };

  const handleRewardChange = (text) => {
    const onlyNumbers = text.replace(/[^0-9]/g, "");
    setRewardAmount(onlyNumbers);
  };

  const pickMainPhoto = async () => {
    try {
      setPhotoLoading(true);
      setMessage({ type: "", text: "" });

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setPhotoLoading(false);
        showMessage("error", "Photo permission is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.length) {
        setPhotoUri(result.assets[0].uri);
      }

      setPhotoLoading(false);
    } catch (error) {
      console.log("pickMainPhoto error:", error);
      setPhotoLoading(false);
      showMessage("error", "Unable to upload photo.");
    }
  };

  const pickExtraPhoto = async () => {
    try {
      setPhotoLoading(true);
      setMessage({ type: "", text: "" });

      if (extraPhotos.length >= 3) {
        setPhotoLoading(false);
        showMessage("error", "Maximum 3 additional photos allowed.");
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setPhotoLoading(false);
        showMessage("error", "Photo permission is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.length) {
        setExtraPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 3));
      }

      setPhotoLoading(false);
    } catch (error) {
      console.log("pickExtraPhoto error:", error);
      setPhotoLoading(false);
      showMessage("error", "Unable to upload additional photo.");
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      setMessage({ type: "", text: "" });

      const serviceEnabled = await Location.hasServicesEnabledAsync();

      if (!serviceEnabled) {
        setLoadingLocation(false);
        showMessage("error", "Please turn on GPS/location services.");
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
        showMessage("error", "Unable to fetch location.");
        return;
      }

      let locationAddress = `Lat: ${latitude}, Lng: ${longitude}`;

      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (reverse?.length) {
          locationAddress = buildAddressFromGeocode(reverse[0], {
            latitude,
            longitude,
          });

          if (reverse[0]?.city) setCity(reverse[0].city);
          if (reverse[0]?.region) setStateName(reverse[0].region);
          if (reverse[0]?.postalCode) setPincode(reverse[0].postalCode);
        }
      } catch (geoError) {
        console.log("reverseGeocode error:", geoError);
      }

      setAddress(locationAddress);
      setLiveLocation({
        latitude,
        longitude,
        accuracy: current?.coords?.accuracy || null,
        timestamp: current?.timestamp || Date.now(),
      });

      setLoadingLocation(false);
      showMessage("success", "Current location added successfully.");
    } catch (error) {
      console.log("fetchCurrentLocation error:", error);
      setLoadingLocation(false);
      showMessage("error", "Unable to fetch current location.");
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!photoUri) {
        showMessage("error", "Please upload missing person photo.");
        return false;
      }

      if (!fullName.trim()) {
        showMessage("error", "Please enter full name.");
        return false;
      }

      if (!age.trim()) {
        showMessage("error", "Please enter age.");
        return false;
      }

      if (!gender) {
        showMessage("error", "Please select gender.");
        return false;
      }

      if (!heightValue) {
        showMessage("error", "Please select approximate height.");
        return false;
      }

      if (!lastSeenDate) {
        showMessage("error", "Please select last seen date.");
        return false;
      }

      if (!lastSeenTime) {
        showMessage("error", "Please select last seen time.");
        return false;
      }
    }

    if (step === 2) {
      if (!address.trim()) {
        showMessage("error", "Please enter address or use current location.");
        return false;
      }

      if (!city) {
        showMessage("error", "Please select city.");
        return false;
      }

      if (!stateName) {
        showMessage("error", "Please select state.");
        return false;
      }

      if (!pincode.trim()) {
        showMessage("error", "Please enter pincode.");
        return false;
      }
    }

    if (step === 3) {
      if (!physicalDetails.trim()) {
        showMessage("error", "Please enter physical characteristics.");
        return false;
      }

      if (!otherDetails.trim()) {
        showMessage("error", "Please enter other details.");
        return false;
      }
    }

    if (step === 4) {
      if (!reporterName.trim()) {
        showMessage("error", "Please enter your name.");
        return false;
      }

      if (!relationship) {
        showMessage("error", "Please select relationship.");
        return false;
      }

      if (!phoneNumber.trim()) {
        showMessage("error", "Please enter phone number.");
        return false;
      }

      if (rewardAmount && Number(rewardAmount) <= 0) {
        showMessage("error", "Please enter a valid reward amount.");
        return false;
      }

      if (!confirmed) {
        showMessage("error", "Please confirm the information.");
        return false;
      }
    }

    setMessage({ type: "", text: "" });
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (step < 4) {
      setStep((prev) => prev + 1);
      return;
    }

    handlePublishReport();
  };

  const handlePublishReport = async () => {
    try {
      setSubmitting(true);
      setMessage({ type: "", text: "" });

      const now = new Date().toISOString();
      const reportId = `MP-${Date.now()}`;
      const rewardValue = Number(rewardAmount || 0);

      const report = {
        id: reportId,
        reportId,
        type: "Missing Person",
        reportType: "Missing Person",
        status: "Published",

        paymentStatus: "Not Required",
        paymentAmount: 0,
        paymentCurrency: "INR",

        rewardAmount: rewardValue,
        rewardCurrency: "INR",
        rewardText: rewardValue > 0 ? `₹${rewardValue}` : "No reward added",
        rewardEnabled: rewardValue > 0,

        name: fullName.trim(),
        fullName: fullName.trim(),
        age: age.trim(),
        gender,
        height: heightValue,
        complexion,
        hairColor,
        eyeColor,
        bodyType,
        weight: weightValue,
        photoUri,
        image: photoUri,
        imageUri: photoUri,

        date: lastSeenDate,
        lastSeenDate,
        lastSeenTime,
        lastSeen: `Last seen on ${lastSeenDate} at ${lastSeenTime}`,

        address: address.trim(),
        lastSeenPlace: address.trim(),
        landmark: landmark.trim(),
        city,
        state: stateName,
        stateName,
        location: `${city}, ${stateName}`,
        pincode: pincode.trim(),
        liveLocation,
        latitude: liveLocation?.latitude || null,
        longitude: liveLocation?.longitude || null,

        physicalDetails: physicalDetails.trim(),
        otherDetails: otherDetails.trim(),
        description: `${physicalDetails.trim()} ${otherDetails.trim()}`.trim(),
        identificationMarks: physicalDetails.trim(),
        extraPhotos,

        guardianName: reporterName.trim(),
        reporterName: reporterName.trim(),
        relationship,
        relation: relationship,
        contactNumber: phoneNumber.trim(),
        phoneNumber: phoneNumber.trim(),
        emailAddress: emailAddress.trim(),

        createdAt: now,
        updatedAt: now,
      };

      await addMissingReport(report);
      setSubmitting(false);
      setSuccessModal(true);
    } catch (error) {
      console.log("handlePublishReport error:", error);
      setSubmitting(false);
      showMessage("error", error.message || "Unable to publish report. Please try again.");
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
                <Ionicons name="arrow-back" size={22} color={COLORS.white} />
              </TouchableOpacity>

              <View style={styles.brandBox}>
                <View style={styles.logoSmall}>
                  <Ionicons name="people" size={15} color={COLORS.white} />
                </View>
                <Text style={styles.brandText}>SafeReturn</Text>
              </View>

              <View style={styles.headerButton}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={24}
                  color={COLORS.blue2}
                />
              </View>
            </View>

            <Text style={styles.title}>Report Missing Person</Text>

            <Text style={styles.stepText}>Step {step} of 4</Text>

            <ProgressBar step={step} />

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
                  size={18}
                  color={message.type === "success" ? COLORS.green : COLORS.red}
                />
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            ) : null}

            {step === 1 && (
              <SectionCard icon="person-outline" title="Person Details">
                <View style={styles.stepOneGrid}>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={styles.mainPhotoBox}
                    onPress={pickMainPhoto}
                  >
                    {photoLoading ? (
                      <ActivityIndicator color={COLORS.blue} />
                    ) : photoUri ? (
                      <Image
                        source={{ uri: photoUri }}
                        style={styles.mainPhotoPreview}
                      />
                    ) : (
                      <>
                        <View style={styles.uploadCircle}>
                          <Ionicons
                            name="cloud-upload-outline"
                            size={26}
                            color={COLORS.blue}
                          />
                        </View>
                        <Text style={styles.uploadMainText}>Upload Photo</Text>
                        <Text style={styles.uploadSubText}>Tap to upload</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.nameAgeBox}>
                    <InputBox
                      icon="person-outline"
                      placeholder="Full Name"
                      value={fullName}
                      onChangeText={setFullName}
                    />

                    <InputBox
                      icon="calendar-outline"
                      placeholder="Age"
                      value={age}
                      onChangeText={setAge}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <SelectBox
                  icon="person-outline"
                  label="Gender"
                  value={gender}
                  placeholder="Select Gender"
                  onPress={() =>
                    openDropdown("Select Gender", GENDERS, setGender)
                  }
                />

                <SelectBox
                  icon="resize-outline"
                  label="Height"
                  value={heightValue}
                  placeholder="Select Height"
                  onPress={() =>
                    openDropdown("Select Height", HEIGHTS, setHeightValue)
                  }
                />

                <SelectBox
                  icon="color-palette-outline"
                  label="Complexion"
                  value={complexion}
                  placeholder="Select Complexion"
                  onPress={() =>
                    openDropdown("Select Complexion", COMPLEXIONS, setComplexion)
                  }
                />

                <SelectBox
                  icon="cut-outline"
                  label="Hair Color"
                  value={hairColor}
                  placeholder="Select Hair Color"
                  onPress={() =>
                    openDropdown("Select Hair Color", HAIR_COLORS, setHairColor)
                  }
                />

                <SelectBox
                  icon="eye-outline"
                  label="Eye Color"
                  value={eyeColor}
                  placeholder="Select Eye Color"
                  onPress={() =>
                    openDropdown("Select Eye Color", EYE_COLORS, setEyeColor)
                  }
                />

                <SelectBox
                  icon="man-outline"
                  label="Body Type"
                  value={bodyType}
                  placeholder="Select Body Type"
                  onPress={() =>
                    openDropdown("Select Body Type", BODY_TYPES, setBodyType)
                  }
                />

                <InputBox
                  icon="speedometer-outline"
                  placeholder="Weight (in Kg), e.g. 60"
                  value={weightValue}
                  onChangeText={(t) => setWeightValue(t.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                />

                <SelectBox
                  icon="calendar-outline"
                  label="Last Seen Date"
                  value={lastSeenDate}
                  placeholder="Select Date"
                  onPress={() => setDateModal(true)}
                  rightIcon="calendar-outline"
                />

                <SelectBox
                  icon="time-outline"
                  label="Last Seen Time"
                  value={lastSeenTime}
                  placeholder="Select Time"
                  onPress={() => setTimeModal(true)}
                  rightIcon="time-outline"
                />
              </SectionCard>
            )}

            {step === 2 && (
              <SectionCard icon="location-outline" title="Last Seen Location">
                <LabelText label="Address" />
                <TextArea
                  placeholder="Enter full address"
                  value={address}
                  onChangeText={setAddress}
                  height={82}
                />

                <LabelText label="Landmark" optional />
                <InputBox
                  placeholder="Enter landmark"
                  value={landmark}
                  onChangeText={setLandmark}
                />

                <LabelText label="City" />
                <SelectOnly
                  value={city}
                  placeholder="Select City"
                  onPress={() => openDropdown("Select City", CITIES, setCity)}
                />

                <LabelText label="State" />
                <SelectOnly
                  value={stateName}
                  placeholder="Select State"
                  onPress={() =>
                    openDropdown("Select State", STATES, setStateName)
                  }
                />

                <LabelText label="Pincode" />
                <InputBox
                  placeholder="Enter pincode"
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="number-pad"
                />

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.locationButton}
                  onPress={fetchCurrentLocation}
                  disabled={loadingLocation}
                >
                  {loadingLocation ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Ionicons
                      name="navigate-circle-outline"
                      size={19}
                      color={COLORS.white}
                    />
                  )}
                  <Text style={styles.locationButtonText}>
                    {loadingLocation
                      ? "Getting Location..."
                      : "Use Current Location"}
                  </Text>
                </TouchableOpacity>

                {liveLocation?.latitude && liveLocation?.longitude ? (
                  <Text style={styles.coordinatesText} numberOfLines={1}>
                    Lat: {liveLocation.latitude}, Lng: {liveLocation.longitude}
                  </Text>
                ) : null}
              </SectionCard>
            )}

            {step === 3 && (
              <SectionCard
                icon="document-text-outline"
                title="Additional Details"
              >
                <LabelText label="Physical Characteristics" />
                <TextArea
                  placeholder="e.g. color of clothes, marks"
                  value={physicalDetails}
                  onChangeText={setPhysicalDetails}
                  height={92}
                />

                <LabelText label="Other Details" />
                <TextArea
                  placeholder="e.g. health condition, special information"
                  value={otherDetails}
                  onChangeText={setOtherDetails}
                  height={92}
                />

                <Text style={styles.additionalPhotoTitle}>
                  Upload Additional Photos
                </Text>
                <Text style={styles.additionalPhotoSub}>Maximum 3 photos</Text>

                <View style={styles.extraPhotoRow}>
                  {[0, 1, 2].map((index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.88}
                      style={styles.extraPhotoBox}
                      onPress={pickExtraPhoto}
                    >
                      {extraPhotos[index] ? (
                        <Image
                          source={{ uri: extraPhotos[index] }}
                          style={styles.extraPhotoImage}
                        />
                      ) : (
                        <>
                          <Ionicons name="add" size={24} color={COLORS.blue} />
                          <Text style={styles.extraPhotoText}>Add</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </SectionCard>
            )}

            {step === 4 && (
              <SectionCard icon="person-outline" title="Contact Details">
                <InputBox
                  icon="person-outline"
                  placeholder="Your Name"
                  value={reporterName}
                  onChangeText={setReporterName}
                />

                <SelectBox
                  icon="people-outline"
                  label="Relationship"
                  value={relationship}
                  placeholder="Select Relationship"
                  onPress={() =>
                    openDropdown(
                      "Select Relationship",
                      RELATIONSHIPS,
                      setRelationship
                    )
                  }
                />

                <InputBox
                  icon="call-outline"
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />

                <InputBox
                  icon="mail-outline"
                  placeholder="Email Address"
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                  keyboardType="email-address"
                />

                <LabelText label="Reward Amount" optional />
                <InputBox
                  icon="gift-outline"
                  placeholder="Enter reward amount, e.g. 5000"
                  value={rewardAmount}
                  onChangeText={handleRewardChange}
                  keyboardType="number-pad"
                />

                <View style={styles.rewardPreviewBox}>
                  <Ionicons
                    name="gift-outline"
                    size={18}
                    color={COLORS.yellow}
                  />
                  <Text style={styles.rewardPreviewText}>
                    {cleanRewardAmount > 0
                      ? `Reward to be shown: ₹${cleanRewardAmount}`
                      : "No reward amount added. You can leave it empty if not needed."}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.confirmRow}
                  onPress={() => setConfirmed((prev) => !prev)}
                >
                  <View
                    style={[styles.checkbox, confirmed && styles.checkboxActive]}
                  >
                    {confirmed && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={COLORS.white}
                      />
                    )}
                  </View>

                  <Text style={styles.confirmText}>
                    I confirm that the above information is true to the best of
                    my knowledge.
                  </Text>
                </TouchableOpacity>

                <View style={styles.paymentNote}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={COLORS.blue2}
                  />
                  <Text style={styles.paymentNoteText}>
                    No payment required. After submit, this missing person report
                    will be published directly.
                  </Text>
                </View>
              </SectionCard>
            )}

            <>
              <TouchableOpacity
                activeOpacity={0.9}
                style={step < 4 ? styles.nextButton : styles.submitButton}
                onPress={handleNext}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    {step === 4 && (
                      <Ionicons
                        name="cloud-upload-outline"
                        size={20}
                        color={COLORS.white}
                        style={{ marginRight: 6 }}
                      />
                    )}

                    <Text
                      style={
                        step < 4 ? styles.nextButtonText : styles.submitButtonText
                      }
                    >
                      {step < 4 ? "Next" : "Submit & Publish"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {step > 1 && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.backTextButton}
                  onPress={goBack}
                  disabled={submitting}
                >
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
              )}
            </>
          </ScrollView>
        </KeyboardAvoidingView>

        <DropdownModal
          visible={dropdownModal.visible}
          title={dropdownModal.title}
          options={dropdownModal.options}
          onClose={closeDropdown}
          onSelect={(item) => {
            dropdownModal.onSelect?.(item);
            closeDropdown();
          }}
        />

        <CalendarModal
          visible={dateModal}
          selectedDate={selectedDate}
          onClose={() => setDateModal(false)}
          onSelect={(date) => {
            setSelectedDate(date);
            setLastSeenDate(formatDate(date));
            setDateModal(false);
          }}
        />

        <TimeModal
          visible={timeModal}
          selectedTime={lastSeenTime}
          onClose={() => setTimeModal(false)}
          onSelect={(time) => {
            setLastSeenTime(time);
            setTimeModal(false);
          }}
        />

        <SuccessModal
          visible={successModal}
          rewardAmount={cleanRewardAmount}
          onClose={() => {
            setSuccessModal(false);
            resetForm();
            goTo("PublicReports");
          }}
        />
      </SafeAreaView>
    </View>
  );
}

function ProgressBar({ step }) {
  return (
    <View style={styles.progressWrap}>
      {[1, 2, 3, 4].map((item, index) => {
        const active = item <= step;

        return (
          <React.Fragment key={item}>
            <View
              style={[styles.progressDot, active && styles.progressDotActive]}
            >
              <Text
                style={[styles.progressText, active && styles.progressTextActive]}
              >
                {item}
              </Text>
            </View>

            {index < 3 && (
              <View
                style={[
                  styles.progressLine,
                  item < step && styles.progressLineActive,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function SectionCard({ icon, title, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={20} color={COLORS.blue} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function LabelText({ label, optional }) {
  return (
    <Text style={styles.labelText}>
      {label}{" "}
      {optional ? <Text style={styles.optionalText}>(Optional)</Text> : null}
    </Text>
  );
}

function InputBox({ icon, placeholder, value, onChangeText, keyboardType }) {
  return (
    <View style={styles.inputBox}>
      {!!icon && (
        <Ionicons
          name={icon}
          size={17}
          color={COLORS.muted}
          style={styles.inputIcon}
        />
      )}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8C9DBD"
        style={styles.input}
        keyboardType={keyboardType || "default"}
        cursorColor={COLORS.blue}
        selectionColor={COLORS.blue}
      />
    </View>
  );
}

function TextArea({ placeholder, value, onChangeText, height }) {
  return (
    <View style={[styles.textAreaBox, { minHeight: height }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8C9DBD"
        style={styles.textArea}
        multiline
        textAlignVertical="top"
        cursorColor={COLORS.blue}
        selectionColor={COLORS.blue}
      />
    </View>
  );
}

function SelectOnly({ value, placeholder, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.selectOnlyBox}
      onPress={onPress}
    >
      <Text style={[styles.selectOnlyText, !value && styles.placeholderText]}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={18} color={COLORS.muted} />
    </TouchableOpacity>
  );
}

function SelectBox({ icon, label, value, placeholder, onPress, rightIcon }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.selectBox}
      onPress={onPress}
    >
      {!!icon && (
        <Ionicons
          name={icon}
          size={18}
          color={COLORS.blue}
          style={styles.inputIcon}
        />
      )}

      <View style={styles.selectContent}>
        <Text style={styles.selectLabel}>{label}</Text>
        <Text style={[styles.selectValue, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
      </View>

      <Ionicons
        name={rightIcon || "chevron-down"}
        size={18}
        color={rightIcon ? COLORS.blue : COLORS.muted}
      />
    </TouchableOpacity>
  );
}

function DropdownModal({ visible, title, options, onClose, onSelect }) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>

          {options.map((item) => (
            <TouchableOpacity
              key={item}
              activeOpacity={0.85}
              style={styles.optionItem}
              onPress={() => onSelect(item)}
            >
              <Text style={styles.optionItemText}>{item}</Text>
              <Ionicons name="chevron-forward" size={17} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
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
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
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
                <Ionicons name="chevron-back" size={17} color={COLORS.white} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.monthButton}
                onPress={() => changeMonth(1)}
              >
                <Ionicons name="chevron-forward" size={17} color={COLORS.white} />
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
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
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
                    size={16}
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

function SuccessModal({ visible, rewardAmount, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.paymentOverlay}>
        <View style={styles.paymentCard}>
          <Ionicons name="checkmark-circle" size={58} color={COLORS.green} />

          <Text style={styles.paymentTitle}>Report Published</Text>

          <Text style={styles.paymentText}>
            The missing person report has been submitted and published
            successfully. No payment was required.
          </Text>

          <View style={styles.successReceiptBox}>
            <Text style={styles.successReceiptLabel}>Publish Status</Text>
            <Text style={styles.successReceiptValue}>Uploaded</Text>

            <Text style={styles.successRewardText}>
              Reward: {rewardAmount > 0 ? `₹${rewardAmount}` : "Not Added"}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.payButton}
            onPress={onClose}
          >
            <Ionicons name="eye-outline" size={18} color={COLORS.white} />
            <Text style={styles.payButtonText}>View Reports</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: Platform.OS === "android" ? 10 : 6,
    paddingBottom: 28,
  },

  header: {
    minHeight: isTinyHeight ? 48 : 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  brandBox: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoSmall: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },

  brandText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 17 : isSmall ? 18 : 20,
    fontWeight: "900",
  },

  title: {
    color: COLORS.white,
    fontSize: isVerySmall ? 20 : isSmall ? 22 : 24,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
  },

  stepText: {
    color: COLORS.blue2,
    fontSize: isVerySmall ? 12 : isSmall ? 13 : 14,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 5,
  },

  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },

  progressDot: {
    width: isVerySmall ? 25 : 28,
    height: isVerySmall ? 25 : 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(175,196,232,0.55)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#061A40",
  },

  progressDotActive: {
    borderColor: COLORS.blue,
    backgroundColor: COLORS.blue,
  },

  progressText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
  },

  progressTextActive: {
    color: COLORS.white,
  },

  progressLine: {
    width: isVerySmall ? 42 : isSmall ? 50 : 58,
    height: 3,
    backgroundColor: "rgba(175,196,232,0.30)",
  },

  progressLineActive: {
    backgroundColor: COLORS.blue,
  },

  messageBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 9,
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
    fontSize: isVerySmall ? 10.5 : 11.5,
    fontWeight: "700",
    marginLeft: 7,
    lineHeight: 16,
  },

  sectionCard: {
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1.2,
    borderColor: COLORS.borderBlue,
    padding: isVerySmall ? 10 : 12,
    marginBottom: 14,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: isVerySmall ? 15 : isSmall ? 16 : 17,
    fontWeight: "900",
    marginLeft: 8,
  },

  stepOneGrid: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 8,
  },

  mainPhotoBox: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    borderWidth: 1.3,
    borderStyle: "dashed",
    borderColor: COLORS.blue,
    backgroundColor: COLORS.input,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },

  uploadCircle: {
    width: isVerySmall ? 44 : 48,
    height: isVerySmall ? 44 : 48,
    borderRadius: 24,
    backgroundColor: "rgba(20,120,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },

  uploadMainText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 10 : 11,
    fontWeight: "900",
    marginTop: 7,
  },

  uploadSubText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
  },

  mainPhotoPreview: {
    width: "100%",
    height: "100%",
  },

  nameAgeBox: {
    flex: 1,
  },

  inputBox: {
    minHeight: isVerySmall ? 42 : 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.input,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 8,
  },

  inputIcon: {
    marginRight: 7,
  },

  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: isVerySmall ? 12 : 13,
    fontWeight: "600",
    paddingVertical: 0,
  },

  labelText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 12 : 13,
    fontWeight: "900",
    marginBottom: 6,
  },

  optionalText: {
    color: COLORS.muted,
    fontWeight: "600",
  },

  textAreaBox: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.input,
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 8,
    marginBottom: 13,
  },

  textArea: {
    flex: 1,
    color: COLORS.white,
    fontSize: isVerySmall ? 12 : 13,
    fontWeight: "600",
    lineHeight: 18,
  },

  selectOnlyBox: {
    minHeight: isVerySmall ? 42 : 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.input,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    marginBottom: 11,
  },

  selectOnlyText: {
    flex: 1,
    color: COLORS.white,
    fontSize: isVerySmall ? 12 : 13,
    fontWeight: "600",
  },

  selectBox: {
    minHeight: isVerySmall ? 48 : 52,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.input,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    marginBottom: 8,
  },

  selectContent: {
    flex: 1,
  },

  selectLabel: {
    color: COLORS.white,
    fontSize: isVerySmall ? 10.5 : 11.5,
    fontWeight: "900",
    marginBottom: 2,
  },

  selectValue: {
    color: COLORS.white,
    fontSize: isVerySmall ? 12 : 13,
    fontWeight: "600",
  },

  placeholderText: {
    color: COLORS.muted,
  },

  locationButton: {
    height: isVerySmall ? 42 : 46,
    borderRadius: 11,
    backgroundColor: COLORS.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  locationButtonText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 12 : 13,
    fontWeight: "900",
    marginLeft: 7,
  },

  coordinatesText: {
    color: COLORS.blue2,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 7,
  },

  additionalPhotoTitle: {
    color: COLORS.white,
    fontSize: isVerySmall ? 14 : 15,
    fontWeight: "900",
    marginTop: 2,
  },

  additionalPhotoSub: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 11 : 12,
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 10,
  },

  extraPhotoRow: {
    flexDirection: "row",
    gap: 8,
  },

  extraPhotoBox: {
    flex: 1,
    height: isVerySmall ? 74 : isSmall ? 82 : 90,
    borderRadius: 11,
    borderWidth: 1.3,
    borderStyle: "dashed",
    borderColor: COLORS.blue,
    backgroundColor: COLORS.input,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  extraPhotoImage: {
    width: "100%",
    height: "100%",
  },

  extraPhotoText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },

  confirmRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 11,
  },

  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1.2,
    borderColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: COLORS.input,
  },

  checkboxActive: {
    backgroundColor: COLORS.blue,
  },

  confirmText: {
    flex: 1,
    color: COLORS.white,
    fontSize: isVerySmall ? 11.5 : 12.5,
    fontWeight: "700",
    lineHeight: 18,
  },

  paymentNote: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(47,140,255,0.50)",
    backgroundColor: "rgba(47,140,255,0.10)",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  paymentNoteText: {
    flex: 1,
    color: COLORS.soft,
    fontSize: isVerySmall ? 10.5 : 11.5,
    fontWeight: "700",
    lineHeight: 16,
    marginLeft: 7,
  },

  rewardPreviewBox: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.40)",
    backgroundColor: "rgba(250,204,21,0.10)",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  rewardPreviewText: {
    flex: 1,
    color: COLORS.white,
    fontSize: isVerySmall ? 11 : 12,
    fontWeight: "800",
    marginLeft: 7,
    lineHeight: 17,
  },

  nextButton: {
    height: isVerySmall ? 48 : 52,
    borderRadius: 13,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  nextButtonText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 15 : 16,
    fontWeight: "900",
  },

  submitButton: {
    height: isVerySmall ? 48 : 52,
    borderRadius: 13,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    flexDirection: "row",
  },

  submitButtonText: {
    color: COLORS.white,
    fontSize: isVerySmall ? 14 : 15,
    fontWeight: "900",
    marginLeft: 8,
  },

  backTextButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },

  backText: {
    color: COLORS.blue,
    fontSize: isVerySmall ? 13 : 14,
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
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 14,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 12,
  },

  modalTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 10,
  },

  optionItem: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 7,
  },

  optionItemText: {
    color: COLORS.white,
    fontSize: 12.5,
    fontWeight: "800",
    flex: 1,
  },

  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  monthControls: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 10,
  },

  monthButton: {
    width: 32,
    height: 32,
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
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  calendarDayActive: {
    backgroundColor: COLORS.blue,
    borderRadius: 10,
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
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  modalCloseText: {
    color: COLORS.white,
    fontSize: 12.5,
    fontWeight: "900",
  },

  timeList: {
    maxHeight: 370,
  },

  timeListContent: {
    paddingBottom: 8,
  },

  timeItem: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 7,
  },

  timeItemActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },

  timeItemText: {
    color: COLORS.white,
    fontSize: 12.5,
    fontWeight: "900",
    marginLeft: 8,
  },

  timeItemTextActive: {
    color: COLORS.white,
  },

  paymentOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  paymentCard: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#071A3A",
    borderWidth: 1.2,
    borderColor: COLORS.borderBlue,
    padding: 18,
    alignItems: "center",
  },

  paymentTitle: {
    color: COLORS.white,
    fontSize: isVerySmall ? 17 : 19,
    fontWeight: "900",
    textAlign: "center",
  },

  paymentText: {
    color: COLORS.muted,
    fontSize: isVerySmall ? 12 : 13,
    fontWeight: "600",
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },

  successReceiptBox: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
    marginTop: 14,
    marginBottom: 14,
    alignItems: "center",
  },

  successReceiptLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
  },

  successReceiptValue: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },

  successRewardText: {
    color: COLORS.yellow,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 3,
    textAlign: "center",
  },

  payButton: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  payButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 7,
  },
});