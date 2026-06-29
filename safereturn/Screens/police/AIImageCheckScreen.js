// Screens/police/AIImageCheckScreen.js
import React, { useState, useCallback } from "react";
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
    ActivityIndicator,
    Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeReturn, API_BASE_URL } from "../context/SafeReturnContext";

const { width } = Dimensions.get("window");
const isSmall = width < 380;

const COLORS = {
    bg: "#020B1F",
    card: "#062A63",
    card2: "#05265B",
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

export default function AIImageCheckScreen({ navigation }) {
    const { authToken, faceMatchSearch } = useSafeReturn();
    const [uploadedImage, setUploadedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    const pickImage = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Permission Required", "Please allow photo access to upload image.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets?.length) {
                setUploadedImage({
                    uri: result.assets[0].uri,
                    base64: result.assets[0].base64,
                });
                setResults(null);
            }
        } catch (error) {
            console.log("pickImage error:", error);
            Alert.alert("Error", "Unable to pick image. Please try again.");
        }
    };

    const handleSearch = async () => {
        if (!uploadedImage?.uri) {
            Alert.alert("Image Required", "Please upload a photo to search.");
            return;
        }

        setLoading(true);
        try {
            // Use the faceMatchSearch function from context
            const response = await faceMatchSearch(uploadedImage.uri);
            setResults(response);
        } catch (error) {
            console.log("handleSearch error:", error);
            Alert.alert("Error", error.message || "Face match search failed");
        } finally {
            setLoading(false);
        }
    };

    const removeImage = () => {
        setUploadedImage(null);
        setResults(null);
    };

    const openPersonDetails = (reportId) => {
        navigation.navigate("MissingPersonDetails", { reportId });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Face Match</Text>
                <TouchableOpacity
                    onPress={() => {
                        setUploadedImage(null);
                        setResults(null);
                    }}
                    style={styles.resetButton}
                >
                    <Feather name="refresh-cw" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="scan-outline" size={32} color={COLORS.cyan} />
                    <Text style={styles.infoTitle}>AI Face Matching</Text>
                    <Text style={styles.infoText}>
                        Upload a photo to search against published missing person reports
                        using AI face recognition technology.
                    </Text>
                </View>

                {/* Upload Section */}
                <View style={styles.uploadCard}>
                    <Text style={styles.sectionTitle}>Upload Photo</Text>

                    {uploadedImage ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: uploadedImage.uri }} style={styles.previewImage} />
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={removeImage}
                            >
                                <Ionicons name="close-circle" size={28} color={COLORS.red} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                            <Ionicons name="cloud-upload-outline" size={48} color={COLORS.blue} />
                            <Text style={styles.uploadText}>Tap to Upload Photo</Text>
                            <Text style={styles.uploadSubtext}>
                                Select an image from your gallery
                            </Text>
                        </TouchableOpacity>
                    )}

                    {uploadedImage && !results && (
                        <TouchableOpacity
                            style={[styles.searchButton, loading && styles.buttonDisabled]}
                            onPress={handleSearch}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <>
                                    <Ionicons name="search" size={20} color={COLORS.white} />
                                    <Text style={styles.searchButtonText}>Search Face</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Results */}
                {results && (
                    <View style={styles.resultsCard}>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsTitle}>Search Results</Text>
                            <View style={styles.statsRow}>
                                <Text style={styles.statText}>
                                    {results.matchCount} match{results.matchCount !== 1 ? "es" : ""} found
                                </Text>
                                <Text style={styles.statText}>
                                    ({results.totalSearched} searched)
                                </Text>
                            </View>
                        </View>

                        {results.matches && results.matches.length > 0 ? (
                            results.matches.map((match, index) => (
                                <MatchCard
                                    key={index}
                                    match={match}
                                    index={index + 1}
                                    onPress={() => openPersonDetails(match.reportId)}
                                />
                            ))
                        ) : (
                            <View style={styles.noResults}>
                                <Ionicons name="search-outline" size={48} color={COLORS.muted} />
                                <Text style={styles.noResultsText}>No matches found</Text>
                                <Text style={styles.noResultsSubtext}>
                                    The uploaded photo does not match any published missing person
                                    reports in our database.
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

function MatchCard({ match, index, onPress }) {
    const confidence = Math.round((match.confidence || 0) * 100);
    const distance = match.distance || 0;

    return (
        <TouchableOpacity style={styles.matchCard} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.matchNumber}>
                <Text style={styles.matchNumberText}>#{index}</Text>
            </View>

            {match.photoUrl ? (
                <Image source={{ uri: match.photoUrl }} style={styles.matchImage} />
            ) : (
                <View style={styles.matchImagePlaceholder}>
                    <Ionicons name="person-outline" size={32} color={COLORS.muted} />
                </View>
            )}

            <View style={styles.matchInfo}>
                <Text style={styles.matchName} numberOfLines={1}>
                    {match.fullName || "Unknown"}
                </Text>

                <View style={styles.confidenceRow}>
                    <View style={styles.confidenceBar}>
                        <View
                            style={[
                                styles.confidenceFill,
                                {
                                    width: `${confidence}%`,
                                    backgroundColor:
                                        confidence > 80 ? COLORS.green : confidence > 60 ? COLORS.orange : COLORS.red,
                                },
                            ]}
                        />
                    </View>
                    <Text
                        style={[
                            styles.confidenceText,
                            {
                                color:
                                    confidence > 80 ? COLORS.green : confidence > 60 ? COLORS.orange : COLORS.red,
                            },
                        ]}
                    >
                        {confidence}% match
                    </Text>
                </View>

                <Text style={styles.matchDetails}>
                    Distance: {distance.toFixed(3)} (threshold: {match.threshold || 0.6})
                </Text>

                <Text style={styles.tapText}>Tap to view details</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: "900",
    },
    resetButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center",
        justifyContent: "center",
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    infoCard: {
        backgroundColor: COLORS.card2,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        alignItems: "center",
        marginBottom: 16,
    },
    infoTitle: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: "900",
        marginTop: 12,
        marginBottom: 8,
    },
    infoText: {
        color: COLORS.softWhite,
        fontSize: 13,
        fontWeight: "500",
        textAlign: "center",
        lineHeight: 20,
    },
    uploadCard: {
        backgroundColor: COLORS.card2,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "900",
        marginBottom: 16,
    },
    uploadBox: {
        height: 200,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: COLORS.blue,
        backgroundColor: "rgba(38,150,255,0.05)",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    uploadText: {
        color: COLORS.blue,
        fontSize: 16,
        fontWeight: "900",
    },
    uploadSubtext: {
        color: COLORS.muted,
        fontSize: 13,
        fontWeight: "500",
    },
    imagePreviewContainer: {
        position: "relative",
        marginBottom: 16,
    },
    previewImage: {
        width: "100%",
        height: 250,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.05)",
    },
    removeButton: {
        position: "absolute",
        top: 10,
        right: 10,
    },
    searchButton: {
        height: 50,
        borderRadius: 12,
        backgroundColor: COLORS.blue,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginTop: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    searchButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "900",
    },
    resultsCard: {
        backgroundColor: COLORS.card2,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
    },
    resultsHeader: {
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    resultsTitle: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "900",
        marginBottom: 6,
    },
    statsRow: {
        flexDirection: "row",
        gap: 8,
    },
    statText: {
        color: COLORS.muted,
        fontSize: 13,
        fontWeight: "600",
    },
    matchCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    matchNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.blue,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    matchNumberText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "900",
    },
    matchImage: {
        width: 70,
        height: 70,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.05)",
        marginRight: 12,
    },
    matchImagePlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.05)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    matchInfo: {
        flex: 1,
    },
    matchName: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "900",
        marginBottom: 8,
    },
    confidenceRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 6,
    },
    confidenceBar: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(255,255,255,0.1)",
        overflow: "hidden",
    },
    confidenceFill: {
        height: "100%",
        borderRadius: 3,
    },
    confidenceText: {
        fontSize: 12,
        fontWeight: "900",
        minWidth: 60,
        textAlign: "right",
    },
    matchDetails: {
        color: COLORS.muted,
        fontSize: 11,
        fontWeight: "500",
        marginBottom: 4,
    },
    tapText: {
        color: COLORS.cyan,
        fontSize: 11,
        fontWeight: "700",
    },
    noResults: {
        alignItems: "center",
        paddingVertical: 40,
    },
    noResultsText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "900",
        marginTop: 16,
        marginBottom: 8,
    },
    noResultsSubtext: {
        color: COLORS.muted,
        fontSize: 13,
        fontWeight: "500",
        textAlign: "center",
        paddingHorizontal: 20,
        lineHeight: 20,
    },
});