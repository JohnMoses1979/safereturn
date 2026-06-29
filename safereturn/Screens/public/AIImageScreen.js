


// Screens/public/AIImageScreen.js

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useSafeReturn, API_BASE_URL } from "../context/SafeReturnContext";
const { width } = Dimensions.get("window");

const isSmallPhone = width < 360;
const isMediumPhone = width >= 360 && width < 400;

const fs = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isMediumPhone) return medium;
  return large;
};

const STORAGE_KEYS_TO_SEARCH = [
  "@missing_person_reports",
  "@missing_persons",
  "@safereturn_missing_persons",
  "@reports",
];

const MAIN_MISSING_PERSON_KEY = "@missing_persons";
const SAFERETURN_MISSING_PERSON_KEY = "@safereturn_missing_persons";
const AI_MATCH_HISTORY_KEY = "@ai_image_match_history";

const COLORS = {
  bg: "#020B1F",
  card: "#062A63",
  card2: "#05265B",
  card3: "#082F6D",
  border: "rgba(42, 122, 255, 0.42)",
  white: "#FFFFFF",
  softWhite: "#DDE8FF",
  muted: "#9FAFD0",
  blue: "#2696FF",
  cyan: "#36CFFF",
  red: "#FF3048",
  green: "#22D66B",
  orange: "#FF9F12",
  purple: "#8B3FF2",
  yellow: "#FFD43B",
};

const STATUS = {
  MATCHED: "Matched",
  NOT_MATCHED: "Not Matched",
  REVIEW: "Needs Manual Review",
};

const DEFAULT_MISSING_PERSONS_DATA = [
  {
    id: "MP-001",
    reportType: "Missing Person",
    type: "Child",
    name: "Aarav Sharma",
    personName: "Aarav Sharma",
    missingPersonName: "Aarav Sharma",
    age: "8 Years",
    personAge: "8 Years",
    gender: "Male",
    location: "Delhi, India",
    date: "May 21, 2024",
    createdAt: "2024-05-21T16:30:00.000Z",
    lastSeen: "Last seen: 2 days ago",
    lastSeenPlace: "Near Connaught Place, Delhi",
    lastSeenLocation: "Near Connaught Place, Delhi",
    missingTime: "04:30 PM",
    height: "4 ft 2 in",
    weight: "28 kg",
    complexion: "Fair",
    hairColor: "Black",
    eyeColor: "Brown",
    clothing: "Blue t-shirt, black shorts, white shoes",
    clothes: "Blue t-shirt, black shorts, white shoes",
    identificationMarks: "Small birthmark on left cheek",
    guardianName: "Rajesh Sharma",
    contactNumber: "+91 98765 43210",
    phoneNumber: "+91 98765 43210",
    policeStation: "Connaught Place Police Station",
    caseNumber: "DL-MP-2024-001",
    reward: "₹25,000",
    status: "Active",
    priority: "High",
    color: "#1478FF",
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=700",
    imageUri:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=700",
    photoUri:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=700",
    description:
      "Aarav was last seen near Connaught Place wearing a blue t-shirt and black shorts. He is friendly and may respond to his name. Please contact authorities immediately if spotted.",
  },
  {
    id: "MP-002",
    reportType: "Missing Person",
    type: "Child",
    name: "Ananya Verma",
    personName: "Ananya Verma",
    missingPersonName: "Ananya Verma",
    age: "10 Years",
    personAge: "10 Years",
    gender: "Female",
    location: "Mumbai, India",
    date: "May 20, 2024",
    createdAt: "2024-05-20T18:15:00.000Z",
    lastSeen: "Last seen: 3 days ago",
    lastSeenPlace: "Near Andheri Railway Station, Mumbai",
    lastSeenLocation: "Near Andheri Railway Station, Mumbai",
    missingTime: "06:15 PM",
    height: "4 ft 5 in",
    weight: "31 kg",
    complexion: "Wheatish",
    hairColor: "Black",
    eyeColor: "Brown",
    clothing: "Pink frock, sandals, small school bag",
    clothes: "Pink frock, sandals, small school bag",
    identificationMarks: "Mole near right eyebrow",
    guardianName: "Sunita Verma",
    contactNumber: "+91 91234 56780",
    phoneNumber: "+91 91234 56780",
    policeStation: "Andheri Police Station",
    caseNumber: "MH-MP-2024-002",
    reward: "₹30,000",
    status: "Active",
    priority: "High",
    color: "#1478FF",
    image:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=700",
    imageUri:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=700",
    photoUri:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=700",
    description:
      "Ananya was last seen near Andheri Railway Station. She was carrying a small school bag. Anyone with information should report immediately.",
  },
  {
    id: "MP-003",
    reportType: "Missing Person",
    type: "Adult",
    name: "Rahul Mehta",
    personName: "Rahul Mehta",
    missingPersonName: "Rahul Mehta",
    age: "34 Years",
    personAge: "34 Years",
    gender: "Male",
    location: "Bangalore, India",
    date: "May 19, 2024",
    createdAt: "2024-05-19T21:00:00.000Z",
    lastSeen: "Last seen: 4 days ago",
    lastSeenPlace: "MG Road, Bangalore",
    lastSeenLocation: "MG Road, Bangalore",
    missingTime: "09:00 PM",
    height: "5 ft 9 in",
    weight: "72 kg",
    complexion: "Medium",
    hairColor: "Black",
    eyeColor: "Brown",
    clothing: "Grey shirt, blue jeans, black shoes",
    clothes: "Grey shirt, blue jeans, black shoes",
    identificationMarks: "Scar on right hand",
    guardianName: "Neha Mehta",
    contactNumber: "+91 99887 76655",
    phoneNumber: "+91 99887 76655",
    policeStation: "MG Road Police Station",
    caseNumber: "KA-MP-2024-003",
    reward: "₹15,000",
    status: "Under Search",
    priority: "Normal",
    color: "#16A34A",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700",
    imageUri:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700",
    photoUri:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700",
    description:
      "Rahul was last seen on MG Road. His phone has been switched off since the evening of May 19. Please share any useful information.",
  },
  {
    id: "MP-004",
    reportType: "Missing Person",
    type: "Senior",
    name: "Ramesh Singh",
    personName: "Ramesh Singh",
    missingPersonName: "Ramesh Singh",
    age: "68 Years",
    personAge: "68 Years",
    gender: "Male",
    location: "Lucknow, India",
    date: "May 18, 2024",
    createdAt: "2024-05-18T11:30:00.000Z",
    lastSeen: "Last seen: 5 days ago",
    lastSeenPlace: "Hazratganj Market, Lucknow",
    lastSeenLocation: "Hazratganj Market, Lucknow",
    missingTime: "11:30 AM",
    height: "5 ft 6 in",
    weight: "64 kg",
    complexion: "Fair",
    hairColor: "Grey",
    eyeColor: "Brown",
    clothing: "White kurta, brown sandals",
    clothes: "White kurta, brown sandals",
    identificationMarks: "Wears spectacles",
    guardianName: "Amit Singh",
    contactNumber: "+91 90909 12345",
    phoneNumber: "+91 90909 12345",
    policeStation: "Hazratganj Police Station",
    caseNumber: "UP-MP-2024-004",
    reward: "₹20,000",
    status: "Active",
    priority: "High",
    color: "#7C3AED",
    image:
      "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=700",
    imageUri:
      "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=700",
    photoUri:
      "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=700",
    description:
      "Ramesh Singh was last seen in Hazratganj Market. He may be confused and may need medical assistance. Please help report immediately.",
  },
  {
    id: "MP-005",
    reportType: "Missing Person",
    type: "Child",
    name: "Ishita Patel",
    personName: "Ishita Patel",
    missingPersonName: "Ishita Patel",
    age: "7 Years",
    personAge: "7 Years",
    gender: "Female",
    location: "Ahmedabad, India",
    date: "May 17, 2024",
    createdAt: "2024-05-17T17:45:00.000Z",
    lastSeen: "Last seen: 6 days ago",
    lastSeenPlace: "Near Sabarmati Riverfront",
    lastSeenLocation: "Near Sabarmati Riverfront",
    missingTime: "05:45 PM",
    height: "4 ft",
    weight: "24 kg",
    complexion: "Fair",
    hairColor: "Black",
    eyeColor: "Black",
    clothing: "Yellow top, blue skirt",
    clothes: "Yellow top, blue skirt",
    identificationMarks: "Small scar on forehead",
    guardianName: "Kiran Patel",
    contactNumber: "+91 93456 78901",
    phoneNumber: "+91 93456 78901",
    policeStation: "Riverfront Police Station",
    caseNumber: "GJ-MP-2024-005",
    reward: "₹25,000",
    status: "Active",
    priority: "High",
    color: "#1478FF",
    image:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=700",
    imageUri:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=700",
    photoUri:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=700",
    description:
      "Ishita was last seen near Sabarmati Riverfront. She was wearing a yellow top and blue skirt. Please contact the nearest police station if seen.",
  },
  {
    id: "MP-006",
    reportType: "Missing Person",
    type: "Adult",
    name: "Pooja Nair",
    personName: "Pooja Nair",
    missingPersonName: "Pooja Nair",
    age: "29 Years",
    personAge: "29 Years",
    gender: "Female",
    location: "Hyderabad, India",
    date: "May 16, 2024",
    createdAt: "2024-05-16T20:20:00.000Z",
    lastSeen: "Last seen: 7 days ago",
    lastSeenPlace: "Madhapur, Hyderabad",
    lastSeenLocation: "Madhapur, Hyderabad",
    missingTime: "08:20 PM",
    height: "5 ft 4 in",
    weight: "56 kg",
    complexion: "Wheatish",
    hairColor: "Black",
    eyeColor: "Brown",
    clothing: "Green kurti, black leggings",
    clothes: "Green kurti, black leggings",
    identificationMarks: "Tattoo on wrist",
    guardianName: "Arjun Nair",
    contactNumber: "+91 94567 12389",
    phoneNumber: "+91 94567 12389",
    policeStation: "Madhapur Police Station",
    caseNumber: "TS-MP-2024-006",
    reward: "₹18,000",
    status: "Under Review",
    priority: "Normal",
    color: "#16A34A",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700",
    imageUri:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700",
    photoUri:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700",
    description:
      "Pooja was last seen in Madhapur. Family has requested public help. Please share only verified information with authorities.",
  },
  {
    id: "MP-007",
    reportType: "Missing Person",
    type: "Adult",
    name: "Vikram Reddy",
    personName: "Vikram Reddy",
    missingPersonName: "Vikram Reddy",
    age: "41 Years",
    personAge: "41 Years",
    gender: "Male",
    location: "Chennai, India",
    date: "May 15, 2024",
    createdAt: "2024-05-15T19:10:00.000Z",
    lastSeen: "Last seen: 8 days ago",
    lastSeenPlace: "T Nagar, Chennai",
    lastSeenLocation: "T Nagar, Chennai",
    missingTime: "07:10 PM",
    height: "5 ft 10 in",
    weight: "78 kg",
    complexion: "Medium",
    hairColor: "Black",
    eyeColor: "Brown",
    clothing: "White shirt, formal pants",
    clothes: "White shirt, formal pants",
    identificationMarks: "Scar near chin",
    guardianName: "Lakshmi Reddy",
    contactNumber: "+91 98700 11223",
    phoneNumber: "+91 98700 11223",
    policeStation: "T Nagar Police Station",
    caseNumber: "TN-MP-2024-007",
    reward: "₹12,000",
    status: "Active",
    priority: "Normal",
    color: "#16A34A",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700",
    imageUri:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700",
    photoUri:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700",
    description:
      "Vikram was last seen around T Nagar. He was wearing a white shirt and formal pants. Any information can help the family.",
  },
  {
    id: "MP-008",
    reportType: "Missing Person",
    type: "Senior",
    name: "Kamala Devi",
    personName: "Kamala Devi",
    missingPersonName: "Kamala Devi",
    age: "72 Years",
    personAge: "72 Years",
    gender: "Female",
    location: "Jaipur, India",
    date: "May 14, 2024",
    createdAt: "2024-05-14T10:00:00.000Z",
    lastSeen: "Last seen: 9 days ago",
    lastSeenPlace: "Bapu Bazaar, Jaipur",
    lastSeenLocation: "Bapu Bazaar, Jaipur",
    missingTime: "10:00 AM",
    height: "5 ft 1 in",
    weight: "52 kg",
    complexion: "Fair",
    hairColor: "Grey",
    eyeColor: "Brown",
    clothing: "Red saree, black slippers",
    clothes: "Red saree, black slippers",
    identificationMarks: "Uses walking stick",
    guardianName: "Rohit Sharma",
    contactNumber: "+91 90123 45678",
    phoneNumber: "+91 90123 45678",
    policeStation: "Bapu Bazaar Police Station",
    caseNumber: "RJ-MP-2024-008",
    reward: "₹22,000",
    status: "Active",
    priority: "High",
    color: "#7C3AED",
    image:
      "https://images.unsplash.com/photo-1548142813-c348350df52b?w=700",
    imageUri:
      "https://images.unsplash.com/photo-1548142813-c348350df52b?w=700",
    photoUri:
      "https://images.unsplash.com/photo-1548142813-c348350df52b?w=700",
    description:
      "Kamala Devi was last seen in Bapu Bazaar. She uses a walking stick and may require assistance. Please report immediately if seen.",
  },
];

function safeText(value, fallback = "Not provided") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function getFileName(uri = "") {
  if (!uri) return "";
  try {
    const clean = String(uri).split("?")[0];
    return clean.substring(clean.lastIndexOf("/") + 1).toLowerCase();
  } catch {
    return "";
  }
}

function getImageUri(item = {}) {
  return (
    item.photoUri ||
    item.imageUri ||
    item.image ||
    item.photo ||
    item.personImage ||
    item.missingPersonImage ||
    item.profileImage ||
    item.avatar ||
    item.uri ||
    null
  );
}

function getImageBase64(item = {}) {
  return (
    item.base64 ||
    item.photoBase64 ||
    item.imageBase64 ||
    item.missingPersonBase64 ||
    null
  );
}

function normalizeMissingPerson(item = {}, index = 0, sourceKey = "") {
  const imageUri = getImageUri(item);
  const imageBase64 = getImageBase64(item);

  return {
    id: safeText(item.id || item.caseNumber || item.reportId || `missing-${index}`),
    sourceKey,
    raw: item,

    name: safeText(
      item.name ||
      item.personName ||
      item.missingPersonName ||
      item.fullName ||
      item.childName ||
      "Unknown Person"
    ),

    age: safeText(item.age || item.personAge || item.missingPersonAge),
    gender: safeText(item.gender || item.sex),
    guardianName: safeText(item.guardianName || item.parentName || item.contactPerson),
    phoneNumber: safeText(
      item.phoneNumber || item.mobile || item.contactNumber || item.phone
    ),
    lastSeenPlace: safeText(
      item.lastSeenPlace ||
      item.location ||
      item.lastSeenLocation ||
      item.address ||
      item.place
    ),
    clothes: safeText(item.clothes || item.clothing || item.dress),
    description: safeText(item.description || item.details || item.extraNote),
    status: safeText(item.status || item.reportStatus || "Missing"),
    priority: safeText(item.priority || "Normal"),
    createdAt: safeText(item.createdAt || item.date || item.reportedAt),
    caseNumber: safeText(item.caseNumber || item.id || item.reportId || `CASE-${index + 1}`),

    imageUri,
    imageBase64,
    imageFileName: getFileName(imageUri),
  };
}

function isMissingPersonRecord(item = {}) {
  const typeText = String(
    item.reportType ||
    item.reportTypeId ||
    item.type ||
    item.category ||
    item.status ||
    ""
  ).toLowerCase();

  const hasPersonName =
    !!item.name ||
    !!item.personName ||
    !!item.missingPersonName ||
    !!item.fullName ||
    !!item.childName;

  const hasImage = !!getImageUri(item) || !!getImageBase64(item);

  if (!hasPersonName && !hasImage) return false;

  if (
    typeText.includes("missing") ||
    typeText.includes("lost") ||
    typeText.includes("person") ||
    typeText.includes("under review") ||
    typeText.includes("ai_image_match")
  ) {
    return true;
  }

  return hasPersonName && hasImage;
}

async function seedDefaultMissingPersonsIfEmpty() {
  try {
    const existingMain = await AsyncStorage.getItem(MAIN_MISSING_PERSON_KEY);
    const existingSafereturn = await AsyncStorage.getItem(
      SAFERETURN_MISSING_PERSON_KEY
    );

    if (!existingMain) {
      await AsyncStorage.setItem(
        MAIN_MISSING_PERSON_KEY,
        JSON.stringify(DEFAULT_MISSING_PERSONS_DATA)
      );
    }

    if (!existingSafereturn) {
      await AsyncStorage.setItem(
        SAFERETURN_MISSING_PERSON_KEY,
        JSON.stringify(DEFAULT_MISSING_PERSONS_DATA)
      );
    }

    return true;
  } catch (error) {
    console.log("seedDefaultMissingPersonsIfEmpty error:", error);
    return false;
  }
}

function calculateMatchScore(uploadedImage, person) {
  if (!uploadedImage || !person) return 0;

  const uploadedUri = uploadedImage.uri || "";
  const uploadedFileName = uploadedImage.fileName || getFileName(uploadedUri);
  const uploadedBase64 = uploadedImage.base64 || "";

  const personUri = person.imageUri || "";
  const personFileName = person.imageFileName || getFileName(personUri);
  const personBase64 = person.imageBase64 || "";

  if (uploadedBase64 && personBase64 && uploadedBase64 === personBase64) {
    return 100;
  }

  if (uploadedUri && personUri && uploadedUri === personUri) {
    return 100;
  }

  if (uploadedFileName && personFileName && uploadedFileName === personFileName) {
    return 92;
  }

  if (
    uploadedFileName &&
    personUri &&
    String(personUri).toLowerCase().includes(uploadedFileName)
  ) {
    return 88;
  }

  if (
    personFileName &&
    uploadedUri &&
    String(uploadedUri).toLowerCase().includes(personFileName)
  ) {
    return 88;
  }

  return 0;
}

function buildResult(bestMatch, totalRecords) {
  if (!bestMatch || totalRecords === 0) {
    return {
      status: STATUS.NOT_MATCHED,
      score: 0,
      color: COLORS.red,
      icon: "x-circle",
      title: "No Missing Person Data Found",
      message:
        "There are no saved missing person records with photos in this app. Please add missing person details first.",
      matchedPerson: null,
    };
  }

  if (bestMatch.matched) {
    return {
      status: STATUS.MATCHED,
      score: bestMatch.score,
      color: COLORS.green,
      icon: "check-circle",
      title: "Matched Person Found",
      message:
        "This uploaded image matches a saved missing person image in your app. Please verify with admin or authorities before taking action.",
      matchedPerson: bestMatch.person,
    };
  }

  if (bestMatch.score >= 90) {
    return {
      status: STATUS.MATCHED,
      score: bestMatch.score,
      color: COLORS.green,
      icon: "check-circle",
      title: "Matched Person Found",
      message:
        "This uploaded image matches a saved missing person image in your app. Please verify with admin or authorities before taking action.",
      matchedPerson: bestMatch.person,
    };
  }

  if (bestMatch.score >= 70) {
    return {
      status: STATUS.REVIEW,
      score: bestMatch.score,
      color: COLORS.orange,
      icon: "alert-triangle",
      title: "Possible Person Found",
      message:
        "This image may be related to a saved missing person record. Manual admin verification is required.",
      matchedPerson: bestMatch.person,
    };
  }

  return {
    status: STATUS.NOT_MATCHED,
    score: 0,
    color: COLORS.red,
    icon: "x-circle",
    title: "Not Matched",
    message: `Checked ${totalRecords} missing person record(s). No matching saved missing person image was found.`,
    matchedPerson: null,
  };
}

export default function AIImageScreen({ navigation }) {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [missingPersons, setMissingPersons] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [checking, setChecking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState(null);
  const { faceMatchSearch, missingReports = [] } = useSafeReturn();
  const headerTitle = useMemo(() => "AI Missing Person Search", []);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    await seedDefaultMissingPersonsIfEmpty();
    await loadMissingPersons();
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.("PublicHome");
    }
  };

  const loadMissingPersons = async () => {
    setLoadingData(true);

    try {
      await seedDefaultMissingPersonsIfEmpty();

      let allRecords = [];

      for (const key of STORAGE_KEYS_TO_SEARCH) {
        const stored = await AsyncStorage.getItem(key);

        if (!stored) continue;

        let parsed = [];

        try {
          parsed = JSON.parse(stored);
        } catch {
          parsed = [];
        }

        if (Array.isArray(parsed)) {
          const normalized = parsed
            .filter(isMissingPersonRecord)
            .map((item, index) => normalizeMissingPerson(item, index, key));

          allRecords = [...allRecords, ...normalized];
        }
      }

      const uniqueMap = new Map();

      allRecords.forEach((person) => {
        const uniqueKey = `${person.id}-${person.imageUri || person.imageFileName || person.name
          }`;

        if (!uniqueMap.has(uniqueKey)) {
          uniqueMap.set(uniqueKey, person);
        }
      });

      const finalList = Array.from(uniqueMap.values()).filter(
        (person) => !!person.imageUri || !!person.imageBase64
      );

      setMissingPersons(finalList);
      return finalList;
    } catch (error) {
      console.log("loadMissingPersons error:", error);
      Alert.alert("Error", "Unable to load missing persons from this app.");
      return [];
    } finally {
      setLoadingData(false);
    }
  };

  const getFreshMissingPersons = async () => {
    try {
      await seedDefaultMissingPersonsIfEmpty();

      let freshRecords = [];

      for (const key of STORAGE_KEYS_TO_SEARCH) {
        const stored = await AsyncStorage.getItem(key);

        if (!stored) continue;

        let parsed = [];

        try {
          parsed = JSON.parse(stored);
        } catch {
          parsed = [];
        }

        if (Array.isArray(parsed)) {
          const normalized = parsed
            .filter(isMissingPersonRecord)
            .map((item, index) => normalizeMissingPerson(item, index, key))
            .filter((person) => !!person.imageUri || !!person.imageBase64);

          freshRecords = [...freshRecords, ...normalized];
        }
      }

      const uniqueMap = new Map();

      freshRecords.forEach((person) => {
        const uniqueKey = `${person.id}-${person.imageUri || person.imageFileName || person.name
          }`;

        if (!uniqueMap.has(uniqueKey)) {
          uniqueMap.set(uniqueKey, person);
        }
      });

      return Array.from(uniqueMap.values());
    } catch (error) {
      console.log("getFreshMissingPersons error:", error);
      return [];
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMissingPersons();
    setRefreshing(false);
  }, []);

  const requestGalleryPermission = async () => {
    const existing = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (existing.granted) return true;

    const request = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!request.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow photo access to upload image."
      );
      return false;
    }

    return true;
  };

  const pickImage = async () => {
    try {
      const allowed = await requestGalleryPermission();
      if (!allowed) return;

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.82,
        base64: true,
        selectionLimit: 1,
      });

      if (picked.canceled || !picked.assets?.length) return;

      const asset = picked.assets[0];

      setUploadedImage({
        uri: asset.uri,
        base64: asset.base64 || null,
        fileName: asset.fileName || getFileName(asset.uri),
        mimeType: asset.mimeType || "image/jpeg",
      });

      setResult(null);
    } catch (error) {
      console.log("pickImage error:", error);
      Alert.alert("Error", "Unable to pick image. Please try again.");
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setResult(null);
  };


  const searchInMissingPersons = async () => {
    if (!uploadedImage?.uri) {
      Alert.alert("Image Required", "Please upload a photo to search.");
      return;
    }

    setChecking(true);
    setResult(null);

    try {
      // Call real backend face match
      const apiResponse = await faceMatchSearch(uploadedImage.uri);

      // apiResponse shape:
      // { matches: [...], matchCount, totalSearched, threshold }
      // Each match: { reportId, fullName, photoUrl, distance, confidence }

      const totalSearched = apiResponse.totalSearched ?? 0;
      const matches = Array.isArray(apiResponse.matches) ? apiResponse.matches : [];

      // Backend already sorts by distance ascending — best match is first
      let bestMatch = null;
      if (matches.length > 0) {
        const top = matches[0];

        const mergedSource =
          [...(missingReports || []), ...(missingPersons || [])].find((item) => {
            const candidateIds = [item?.id, item?.reportId, item?.personId]
              .filter((value) => value !== undefined && value !== null)
              .map((value) => String(value));
            return candidateIds.includes(String(top.reportId));
          }) || null;

        // Prefix relative path with server base URL so image renders correctly
        const fullPhotoUrl = top.photoUrl
          ? top.photoUrl.startsWith("http")
            ? top.photoUrl
            : `${API_BASE_URL}${top.photoUrl}`
          : null;

        const normalizedPerson = normalizeMissingPerson(
          {
            ...(mergedSource?.raw || mergedSource || {}),
            id: mergedSource?.id || String(top.reportId),
            reportId: mergedSource?.reportId || top.reportId,
            name: mergedSource?.name || top.fullName,
            personName: mergedSource?.personName || top.fullName,
            photoUri: fullPhotoUrl || mergedSource?.imageUri || mergedSource?.image,
            imageUri: fullPhotoUrl || mergedSource?.imageUri || mergedSource?.image,
            image: fullPhotoUrl || mergedSource?.imageUri || mergedSource?.image,
            status: mergedSource?.status || "Active",
            reportType: "Missing Person",
          },
          0,
          "backend"
        );

        bestMatch = {
          // confidence is 0.0–1.0; multiply by 100 for existing score display
          score: Math.round((top.confidence ?? 0) * 100),
          matched: true,
          distance: top.distance ?? null,
          person: normalizedPerson,
        };
      }

      const nextResult = buildResult(bestMatch, totalSearched);
      setResult(nextResult);
      await saveMatchHistory(nextResult, uploadedImage);
    } catch (error) {
      console.log("searchInMissingPersons error:", error);
      Alert.alert("Error", error.message || "Unable to search missing persons.");
    } finally {
      setChecking(false);
    }
  };

  // const searchInMissingPersons = async () => {
  //   if (!uploadedImage?.uri) {
  //     Alert.alert("Image Required", "Please upload a photo to search.");
  //     return;
  //   }

  //   setChecking(true);
  //   setResult(null);

  //   try {
  //     const freshRecords = await getFreshMissingPersons();
  //     const recordsToCheck = freshRecords.length ? freshRecords : missingPersons;

  //     setMissingPersons(recordsToCheck);

  //     await new Promise((resolve) => setTimeout(resolve, 900));

  //     let bestMatch = null;

  //     recordsToCheck.forEach((person) => {
  //       const score = calculateMatchScore(uploadedImage, person);

  //       if (!bestMatch || score > bestMatch.score) {
  //         bestMatch = {
  //           score,
  //           person,
  //         };
  //       }
  //     });

  //     const nextResult = buildResult(bestMatch, recordsToCheck.length);

  //     setResult(nextResult);
  //     await saveMatchHistory(nextResult, uploadedImage);
  //   } catch (error) {
  //     console.log("searchInMissingPersons error:", error);
  //     Alert.alert("Error", "Unable to search missing persons.");
  //   } finally {
  //     setChecking(false);
  //   }
  // };

  const saveMatchHistory = async (matchResult, image) => {
    try {
      const item = {
        id: Date.now().toString(),
        uploadedImage: image?.uri || null,
        uploadedFileName: image?.fileName || null,
        status: matchResult.status,
        score: matchResult.score,
        matchedPerson: matchResult.matchedPerson || null,
        createdAt: new Date().toISOString(),
      };

      const oldData = await AsyncStorage.getItem(AI_MATCH_HISTORY_KEY);
      const oldList = oldData ? JSON.parse(oldData) : [];

      await AsyncStorage.setItem(
        AI_MATCH_HISTORY_KEY,
        JSON.stringify([item, ...oldList])
      );
    } catch (error) {
      console.log("Unable to save match history:", error);
    }
  };

  const openMatchedPersonDetails = () => {
    if (!result?.matchedPerson) return;

    navigation?.navigate?.("MissingPersonDetails", {
      person: result.matchedPerson.raw || result.matchedPerson,
      fromAIImageSearch: true,
    });
  };

  const submitForReview = async () => {
    if (!result) {
      Alert.alert("No Result", "Please search first.");
      return;
    }

    if (!uploadedImage?.uri) {
      Alert.alert("Image Required", "Please upload image first.");
      return;
    }

    try {
      const reviewItem = {
        id: Date.now().toString(),
        reportTypeId: "ai_missing_person_search",
        reportType: "AI Missing Person Search",
        priority:
          result.status === STATUS.MATCHED
            ? "Urgent"
            : result.status === STATUS.REVIEW
              ? "Normal"
              : "Normal",
        personName: result?.matchedPerson?.name || "Unknown Person",
        age: result?.matchedPerson?.age || "Not provided",
        gender: result?.matchedPerson?.gender || "Not provided",
        guardianName: result?.matchedPerson?.guardianName || "AI Search User",
        phoneNumber: result?.matchedPerson?.phoneNumber || "Not provided",
        lastSeenPlace: result?.matchedPerson?.lastSeenPlace || "Not provided",
        description: `AI Missing Person Search Result: ${result.status}. Score: ${result.score}%. ${result.message}`,
        clothes: result?.matchedPerson?.clothes || "Not provided",
        extraNote:
          "This is frontend local app search. Final match must be verified manually.",
        photoUri: uploadedImage.uri,
        referenceImage: result?.matchedPerson?.imageUri || null,
        matchStatus: result.status,
        matchScore: result.score,
        matchedPersonId: result?.matchedPerson?.id || null,
        status: "Under Review",
        createdAt: new Date().toISOString(),
      };

      const oldData = await AsyncStorage.getItem("@missing_person_reports");
      const oldReports = oldData ? JSON.parse(oldData) : [];

      await AsyncStorage.setItem(
        "@missing_person_reports",
        JSON.stringify([reviewItem, ...oldReports])
      );

      Alert.alert(
        "Submitted",
        "This AI search result has been submitted to Reports for manual review.",
        [
          {
            text: "View Reports",
            onPress: () => navigation?.navigate?.("Reports"),
          },
          {
            text: "OK",
            style: "cancel",
          },
        ]
      );
    } catch (error) {
      console.log("submitForReview error:", error);
      Alert.alert("Error", "Unable to submit for review.");
    }
  };

  const resetAll = () => {
    setUploadedImage(null);
    setResult(null);
    setChecking(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={goBack}
            style={styles.headerBtn}
          >
            <Feather
              name="arrow-left"
              size={fs(22, 24, 26)}
              color={COLORS.white}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {headerTitle}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={resetAll}
            style={styles.headerBtnRight}
          >
            <Feather
              name="refresh-cw"
              size={fs(18, 20, 22)}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.cyan}
            />
          }
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIconCircle}>
              <Feather
                name="search"
                size={fs(26, 29, 32)}
                color={COLORS.white}
              />
            </View>

            <View style={styles.heroTextBox}>
              <Text style={styles.heroTitle}>Search Missing Persons</Text>
              <Text style={styles.heroSubtitle}>
                Upload one photo. The app will search saved missing person
                records and show matched details.
              </Text>
            </View>
          </View>

          <View style={styles.noticeCard}>
            <Feather name="info" size={fs(17, 18, 20)} color={COLORS.orange} />
            <Text style={styles.noticeText}>
              This search uses the backend AI face-matching service and compares
              your uploaded face against published missing-person reports.
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{missingPersons.length}</Text>
              <Text style={styles.statLabel}>Missing Persons With Photos</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={loadMissingPersons}
              style={styles.reloadCard}
            >
              {loadingData ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Feather name="refresh-cw" size={18} color={COLORS.white} />
              )}
              <Text style={styles.reloadText}>Reload</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.singleUploadWrap}>
            <ImageSearchCard
              imageUri={uploadedImage?.uri}
              onPick={pickImage}
              onRemove={removeImage}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!uploadedImage?.uri || checking || loadingData}
            onPress={searchInMissingPersons}
            style={[
              styles.matchButton,
              (!uploadedImage?.uri || checking || loadingData) &&
              styles.disabledButton,
            ]}
          >
            {checking ? (
              <>
                <ActivityIndicator size="small" color={COLORS.white} />
                <Text style={styles.matchButtonText}>Searching...</Text>
              </>
            ) : (
              <>
                <Feather
                  name="search"
                  size={fs(18, 20, 22)}
                  color={COLORS.white}
                />
                <Text style={styles.matchButtonText}>
                  Search In Missing Persons
                </Text>
              </>
            )}
          </TouchableOpacity>

          {result && (
            <View
              style={[
                styles.resultCard,
                {
                  borderColor: result.color,
                  backgroundColor: `${result.color}18`,
                },
              ]}
            >
              <View
                style={[
                  styles.resultIconCircle,
                  { backgroundColor: result.color },
                ]}
              >
                <Feather
                  name={result.icon}
                  size={fs(26, 28, 30)}
                  color={COLORS.white}
                />
              </View>

              <Text style={styles.resultTitle}>{result.title}</Text>

              <Text style={[styles.resultStatus, { color: result.color }]}>
                {result.status}
              </Text>

              <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>AI Match Score</Text>

                <Text style={[styles.scoreValue, { color: result.color }]}>
                  {result.score}%
                </Text>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${result.score}%`,
                        backgroundColor: result.color,
                      },
                    ]}
                  />
                </View>
              </View>

              <Text style={styles.resultMessage}>{result.message}</Text>

              {result.matchedPerson && (
                <View style={styles.personCard}>
                  <View style={styles.personHeader}>
                    {result.matchedPerson.imageUri ? (
                      <Image
                        source={{ uri: result.matchedPerson.imageUri }}
                        style={styles.personImage}
                      />
                    ) : (
                      <View style={styles.personImagePlaceholder}>
                        <Feather name="user" size={28} color={COLORS.white} />
                      </View>
                    )}

                    <View style={styles.personHeaderText}>
                      <Text style={styles.personName} numberOfLines={1}>
                        {result.matchedPerson.name}
                      </Text>

                      <Text style={styles.personCase} numberOfLines={1}>
                        Case: {result.matchedPerson.caseNumber}
                      </Text>

                      <Text style={styles.personStatus} numberOfLines={1}>
                        Status: {result.matchedPerson.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoGrid}>
                    <InfoItem label="Age" value={result.matchedPerson.age} />
                    <InfoItem
                      label="Gender"
                      value={result.matchedPerson.gender}
                    />
                    <InfoItem
                      label="Guardian"
                      value={result.matchedPerson.guardianName}
                    />
                    <InfoItem
                      label="Phone"
                      value={result.matchedPerson.phoneNumber}
                    />
                    <InfoItem
                      label="Last Seen"
                      value={result.matchedPerson.lastSeenPlace}
                    />
                    <InfoItem
                      label="Clothes"
                      value={result.matchedPerson.clothes}
                    />
                  </View>

                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionLabel}>Description</Text>
                    <Text style={styles.descriptionText}>
                      {result.matchedPerson.description}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.resultButtonRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={resetAll}
                  style={styles.tryAgainButton}
                >
                  <Text style={styles.tryAgainText}>Try Again</Text>
                </TouchableOpacity>

                {result.matchedPerson && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={openMatchedPersonDetails}
                    style={styles.detailsButton}
                  >
                    <Text style={styles.detailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={submitForReview}
                  style={styles.submitButton}
                >
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>How it works</Text>

          <View style={styles.stepsCard}>
            <StepItem
              number="1"
              title="Upload photo"
              text="Upload the photo you want to check."
            />
            <StepItem
              number="2"
              title="Search missing persons"
              text="The app searches saved missing person records in local storage."
            />
            <StepItem
              number="3"
              title="Show matched details"
              text="If matched, it displays name, age, case number, last seen place, and contact details."
            />
            <StepItem
              number="4"
              title="Manual verification"
              text="Submit result for admin review before taking any final action."
              isLast
            />
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ImageSearchCard({ imageUri, onPick, onRemove }) {
  return (
    <View style={styles.imageCard}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPick}
        style={styles.imageBox}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.emptyContent}>
            <View style={styles.emptyCircle}>
              <Feather
                name="upload-cloud"
                size={fs(30, 34, 38)}
                color={COLORS.white}
              />
            </View>

            <Text style={styles.emptyTitle}>Upload Photo To Search</Text>
            <Text style={styles.emptySubtitle}>
              The image will be checked with saved missing person photos only.
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {imageUri ? (
        <View style={styles.imageActions}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPick}
            style={styles.changeBtn}
          >
            <Feather name="image" size={15} color={COLORS.cyan} />
            <Text style={styles.changeText}>Change Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onRemove}
            style={styles.removeBtn}
          >
            <Feather name="trash-2" size={15} color={COLORS.red} />
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPick}
          style={styles.uploadBtn}
        >
          <Feather name="plus" size={16} color={COLORS.white} />
          <Text style={styles.uploadText}>Upload Image</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function InfoItem({ label, value }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value || "Not provided"}
      </Text>
    </View>
  );
}

function StepItem({ number, title, text, isLast }) {
  return (
    <View style={[styles.stepRow, !isLast && styles.stepBorder]}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>

      <View style={styles.stepTextBox}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepText}>{text}</Text>
      </View>
    </View>
  );
}

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  header: {
    height: Platform.OS === "ios" ? 60 : 54,
    paddingHorizontal: 13,
    paddingTop: Platform.OS === "android" ? 3 : 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerBtnRight: {
    width: 36,
    height: 36,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: fs(18, 20, 22),
    lineHeight: fs(24, 26, 28),
    fontWeight: "900",
    textAlign: "center",
  },

  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 10,
  },

  heroCard: {
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: fs(11, 13, 15),
    paddingVertical: fs(12, 13, 15),
    flexDirection: "row",
    alignItems: "center",
  },

  heroIconCircle: {
    width: fs(50, 56, 62),
    height: fs(50, 56, 62),
    borderRadius: 100,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  heroTextBox: {
    flex: 1,
    minWidth: 0,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: fs(17, 19, 21),
    lineHeight: fs(23, 25, 27),
    fontWeight: "900",
    marginBottom: 3,
  },

  heroSubtitle: {
    color: COLORS.softWhite,
    fontSize: fs(10.5, 12, 13.5),
    lineHeight: fs(16, 18, 20),
    fontWeight: "400",
  },

  noticeCard: {
    marginTop: 12,
    borderRadius: CARD_RADIUS,
    backgroundColor: "rgba(255, 159, 18, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 159, 18, 0.35)",
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  noticeText: {
    flex: 1,
    color: COLORS.softWhite,
    fontSize: fs(10, 11, 12),
    lineHeight: fs(15, 16, 18),
    fontWeight: "500",
  },

  statsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },

  statCard: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  statValue: {
    color: COLORS.cyan,
    fontSize: fs(24, 28, 32),
    fontWeight: "900",
  },

  statLabel: {
    color: COLORS.softWhite,
    fontSize: fs(10, 11, 12),
    marginTop: 2,
    fontWeight: "700",
  },

  reloadCard: {
    width: 96,
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  reloadText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  singleUploadWrap: {
    marginTop: 14,
  },

  imageCard: {
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 11,
  },

  imageBox: {
    width: "100%",
    height: fs(220, 250, 280),
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(221,232,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  emptyContent: {
    alignItems: "center",
    paddingHorizontal: 18,
  },

  emptyCircle: {
    width: fs(60, 66, 74),
    height: fs(60, 66, 74),
    borderRadius: 100,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: fs(15, 17, 19),
    fontWeight: "900",
    textAlign: "center",
  },

  emptySubtitle: {
    color: COLORS.softWhite,
    fontSize: fs(11, 12, 13),
    lineHeight: fs(16, 18, 20),
    textAlign: "center",
    marginTop: 5,
  },

  imageActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 11,
  },

  uploadBtn: {
    marginTop: 11,
    height: 42,
    borderRadius: 11,
    backgroundColor: COLORS.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  uploadText: {
    color: COLORS.white,
    fontSize: fs(12, 13, 14),
    fontWeight: "900",
  },

  changeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 11,
    backgroundColor: "rgba(54,207,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(54,207,255,0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  changeText: {
    color: COLORS.cyan,
    fontSize: fs(11, 12, 13),
    fontWeight: "900",
  },

  removeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 11,
    backgroundColor: "rgba(255, 48, 72, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 48, 72, 0.4)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  removeText: {
    color: COLORS.red,
    fontSize: fs(11, 12, 13),
    fontWeight: "900",
  },

  matchButton: {
    marginTop: 14,
    height: fs(45, 48, 52),
    borderRadius: 13,
    backgroundColor: COLORS.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  disabledButton: {
    opacity: 0.45,
  },

  matchButtonText: {
    color: COLORS.white,
    fontSize: fs(13.5, 15, 16.5),
    fontWeight: "900",
  },

  resultCard: {
    marginTop: 14,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    paddingHorizontal: fs(12, 14, 16),
    paddingVertical: fs(15, 16, 18),
    alignItems: "center",
  },

  resultIconCircle: {
    width: fs(54, 60, 66),
    height: fs(54, 60, 66),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  resultTitle: {
    color: COLORS.white,
    fontSize: fs(17, 19, 21),
    lineHeight: fs(23, 25, 27),
    fontWeight: "900",
    textAlign: "center",
  },

  resultStatus: {
    fontSize: fs(13, 14, 15),
    lineHeight: fs(18, 19, 20),
    fontWeight: "900",
    marginTop: 3,
    marginBottom: 10,
    textAlign: "center",
  },

  scoreCard: {
    width: "100%",
    borderRadius: 13,
    backgroundColor: "rgba(2, 11, 31, 0.35)",
    paddingHorizontal: 11,
    paddingVertical: 9,
    alignItems: "center",
    marginBottom: 10,
  },

  scoreLabel: {
    color: COLORS.softWhite,
    fontSize: fs(10.5, 11.5, 12.5),
    fontWeight: "600",
    marginBottom: 2,
  },

  scoreValue: {
    fontSize: fs(23, 26, 30),
    fontWeight: "900",
  },

  progressTrack: {
    width: "100%",
    height: 7,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    marginTop: 8,
  },

  progressFill: {
    height: "100%",
    borderRadius: 100,
  },

  resultMessage: {
    color: COLORS.softWhite,
    fontSize: fs(11, 12.2, 13.2),
    lineHeight: fs(17, 18.5, 20),
    textAlign: "center",
    marginBottom: 12,
  },

  personCard: {
    width: "100%",
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 11,
    marginTop: 4,
    marginBottom: 12,
  },

  personHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },

  personImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    resizeMode: "cover",
    marginRight: 11,
  },

  personImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  personHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  personName: {
    color: COLORS.white,
    fontSize: fs(16, 18, 20),
    fontWeight: "900",
  },

  personCase: {
    color: COLORS.cyan,
    fontSize: fs(11, 12, 13),
    fontWeight: "800",
    marginTop: 3,
  },

  personStatus: {
    color: COLORS.softWhite,
    fontSize: fs(10, 11, 12),
    fontWeight: "700",
    marginTop: 3,
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  infoItem: {
    width: "48%",
    borderRadius: 11,
    backgroundColor: "rgba(2,11,31,0.28)",
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  infoLabel: {
    color: COLORS.muted,
    fontSize: fs(9.5, 10, 11),
    marginBottom: 2,
  },

  infoValue: {
    color: COLORS.white,
    fontSize: fs(10.5, 11.5, 12.5),
    fontWeight: "800",
  },

  descriptionBox: {
    marginTop: 10,
    borderRadius: 11,
    backgroundColor: "rgba(2,11,31,0.28)",
    padding: 9,
  },

  descriptionLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 4,
  },

  descriptionText: {
    color: COLORS.softWhite,
    fontSize: fs(10.5, 11.5, 12.5),
    lineHeight: fs(16, 17, 18),
    fontWeight: "500",
  },

  resultButtonRow: {
    width: "100%",
    flexDirection: isSmallPhone ? "column" : "row",
    gap: 9,
  },

  tryAgainButton: {
    flex: 1,
    height: fs(39, 42, 45),
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  tryAgainText: {
    color: COLORS.softWhite,
    fontSize: fs(11, 12, 13),
    fontWeight: "900",
  },

  detailsButton: {
    flex: 1,
    height: fs(39, 42, 45),
    borderRadius: 11,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },

  detailsButtonText: {
    color: COLORS.white,
    fontSize: fs(11, 12, 13),
    fontWeight: "900",
  },

  submitButton: {
    flex: 1,
    height: fs(39, 42, 45),
    borderRadius: 11,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
  },

  submitButtonText: {
    color: COLORS.white,
    fontSize: fs(11, 12, 13),
    fontWeight: "900",
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: fs(18, 20, 22),
    lineHeight: fs(24, 26, 28),
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 9,
  },

  stepsCard: {
    borderRadius: CARD_RADIUS,
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 11,
  },

  stepBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(65, 136, 255, 0.22)",
  },

  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 100,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    marginTop: 1,
  },

  stepNumberText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  stepTextBox: {
    flex: 1,
    minWidth: 0,
  },

  stepTitle: {
    color: COLORS.white,
    fontSize: fs(12.5, 13.5, 15),
    lineHeight: fs(17, 19, 21),
    fontWeight: "900",
    marginBottom: 2,
  },

  stepText: {
    color: COLORS.softWhite,
    fontSize: fs(10.5, 11.5, 12.5),
    lineHeight: fs(16, 17, 18),
    fontWeight: "400",
  },

  bottomSpace: {
    height: Platform.OS === "ios" ? 112 : 102,
  },
});
