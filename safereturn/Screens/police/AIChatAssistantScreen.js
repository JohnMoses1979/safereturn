// // Screens/police/AIChatAssistantScreen.js
// import React, { useState, useRef, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   SafeAreaView,
//   StatusBar,
//   TouchableOpacity,
//   TextInput,
//   useWindowDimensions,
//   Platform,
//   KeyboardAvoidingView,
//   ActivityIndicator,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { API_BASE_URL, useSafeReturn } from "../context/SafeReturnContext";

// const COLORS = {
//   bg: "#0a1628",
//   bgSecondary: "#0f1f3d",
//   card: "#1a2f4a",
//   cardLight: "#254066",
//   border: "rgba(66, 133, 244, 0.3)",
//   primary: "#4285f4",
//   primaryLight: "#5a9bff",
//   success: "#34a853",
//   warning: "#fbbc04",
//   danger: "#ea4335",
//   white: "#ffffff",
//   text: "#e8f0fe",
//   textMuted: "#9aaec9",
//   textSecondary: "#b4c7e0",
//   inputBg: "#1a2f4a",
//   botBubble: "#1a2f4a",
//   userBubble: "#4285f4",
// };

// const QUICK_ACTIONS = [
//   {
//     id: "reports-today",
//     icon: "analytics",
//     text: "How many reports today?",
//     query: "How many reports were received today?",
//     color: COLORS.primary,
//   },
//   {
//     id: "recent-sightings",
//     icon: "eye-outline",
//     text: "Show recent sightings",
//     query: "Show me recent sightings",
//     color: COLORS.success,
//   },
//   {
//     id: "solved-week",
//     icon: "checkmark-circle-outline",
//     text: "How many solved this week?",
//     query: "How many cases were solved this week?",
//     color: COLORS.success,
//   },
//   {
//     id: "urgent-reports",
//     icon: "warning-outline",
//     text: "Find urgent reports",
//     query: "Show me urgent reports",
//     color: COLORS.danger,
//   },
//   {
//     id: "ai-matches",
//     icon: "images-outline",
//     text: "Show AI image match results",
//     query: "Show AI image matching results",
//     color: COLORS.warning,
//   },
// ];

// export default function AIChatAssistantScreen({ navigation }) {
//   const {
//     authToken,
//     fetchPoliceStats,
//     fetchPoliceReports,
//     fetchPoliceSightings,
//     fetchPoliceAnalytics,
//     sightingReports = [],
//     missingReports = [],
//     dashboardStats,
//   } = useSafeReturn();
//   const { width } = useWindowDimensions();

//   // Responsive helpers derived from live window width
//   const isTablet = width >= 768;
//   const isSmall = width < 375;
//   const rs = (small, medium, large, tablet) => {
//     if (isTablet) return tablet || large;
//     if (isSmall) return small;
//     if (width < 414) return medium;
//     return large;
//   };

//   // Quick action chip width: 2-per-row on phone, 3-per-row on tablet
//   const chipColumns = isTablet ? 3 : 2;
//   const chipGap = 10;
//   const chipWidth =
//     (width - rs(24, 32, 40, 48) * 2 - chipGap * (chipColumns - 1)) /
//     chipColumns;
//   // Last chip goes full-width when total chips is odd on phone
//   const isOddChip = (index) =>
//     !isTablet && index === QUICK_ACTIONS.length - 1 && QUICK_ACTIONS.length % 2 !== 0;

//   const [messages, setMessages] = useState([]);
//   const [inputText, setInputText] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [typing, setTyping] = useState(false);
//   const [contextSnapshot, setContextSnapshot] = useState(null);
//   const scrollViewRef = useRef(null);

//   useEffect(() => {
//     setMessages([
//       {
//         id: "welcome",
//         role: "assistant",
//         text: "Hello! I can help you with reports, sightings, trends, matches, and more.\nWhat would you like to know?",
//         timestamp: new Date().toISOString(),
//       },
//     ]);
//   }, []);

//   const loadPoliceContextSnapshot = useCallback(async () => {
//     try {
//       const [statsData, reportsData, sightingsData, analyticsData] = await Promise.all([
//         fetchPoliceStats?.(),
//         fetchPoliceReports?.(0, 25),
//         fetchPoliceSightings?.(),
//         fetchPoliceAnalytics?.(),
//       ]);

//       return buildPoliceContextSnapshot({
//         statsData,
//         reportsData,
//         sightingsData,
//         analyticsData,
//         fallbackSightings: sightingReports,
//         fallbackMissingReports: missingReports,
//         fallbackDashboardStats: dashboardStats,
//       });
//     } catch {
//       return buildPoliceContextSnapshot({
//         fallbackSightings: sightingReports,
//         fallbackMissingReports: missingReports,
//         fallbackDashboardStats: dashboardStats,
//       });
//     }
//   }, [
//     dashboardStats,
//     fetchPoliceAnalytics,
//     fetchPoliceReports,
//     fetchPoliceSightings,
//     fetchPoliceStats,
//     missingReports,
//     sightingReports,
//   ]);

//   useEffect(() => {
//     let mounted = true;
//     loadPoliceContextSnapshot().then((snapshot) => {
//       if (mounted) {
//         setContextSnapshot(snapshot);
//       }
//     });
//     return () => {
//       mounted = false;
//     };
//   }, [loadPoliceContextSnapshot]);

//   useEffect(() => {
//     if (scrollViewRef.current) {
//       setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
//     }
//   }, [messages]);

//   const sendMessage = useCallback(
//     async (text) => {
//       if (!text.trim() || loading) return;

//       const userMessage = {
//         id: Date.now().toString(),
//         role: "user",
//         text: text.trim(),
//         timestamp: new Date().toISOString(),
//       };

//       setMessages((prev) => [...prev, userMessage]);
//       setInputText("");
//       setLoading(true);
//       setTyping(true);

//       try {
//         const history = messages.slice(-10).map((msg) => ({
//           role: msg.role,
//           content: msg.text,
//         }));
//         const liveContext = (await loadPoliceContextSnapshot()) || contextSnapshot;

//         const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${authToken}`,
//           },
//           body: JSON.stringify({
//             message: text.trim(),
//             history,
//             context: liveContext,
//             role: "police",
//             source: "police-ai-assistant",
//           }),
//         });

//         if (!response.ok) throw new Error("Failed to get response");

//         const data = await response.json();

//         setMessages((prev) => [
//           ...prev,
//           {
//             id: (Date.now() + 1).toString(),
//             role: "assistant",
//             text: data.reply || "I'm sorry, I couldn't process your request.",
//             timestamp: new Date().toISOString(),
//             contextUsed: data.contextUsed,
//           },
//         ]);
//       } catch {
//         setMessages((prev) => [
//           ...prev,
//           {
//             id: (Date.now() + 1).toString(),
//             role: "assistant",
//             text: "I'm sorry, I encountered an error. Please try again.",
//             timestamp: new Date().toISOString(),
//             isError: true,
//           },
//         ]);
//       } finally {
//         setLoading(false);
//         setTyping(false);
//       }
//     },
//     [messages, authToken, loading, contextSnapshot, loadPoliceContextSnapshot]
//   );

//   const formatTime = (timestamp) =>
//     new Date(timestamp).toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "2-digit",
//       hour12: true,
//     });

//   const renderMessage = (message) => {
//     const isUser = message.role === "user";
//     return (
//       <View
//         key={message.id}
//         style={[
//           styles.messageContainer,
//           isUser ? styles.userMessageContainer : styles.botMessageContainer,
//         ]}
//       >
//         {!isUser && (
//           <View style={styles.botAvatar}>
//             <Ionicons name="chatbubbles" size={rs(18, 20, 22)} color={COLORS.primary} />
//           </View>
//         )}
//         <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
//           <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.botMessageText]}>
//             {message.text}
//           </Text>
//           <View style={styles.messageFooter}>
//             <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
//             {isUser && <Ionicons name="checkmark-done" size={14} color={COLORS.textMuted} />}
//           </View>
//         </View>
//       </View>
//     );
//   };

//   const hPad = rs(12, 16, 20, 24);

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

//       {/* Header */}
//       <View style={[styles.header, { paddingHorizontal: hPad }]}>
//         <TouchableOpacity
//           style={[styles.backButton, { width: rs(36, 40, 44), height: rs(36, 40, 44), borderRadius: rs(8, 10, 12) }]}
//           onPress={() => navigation.goBack()}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="arrow-back" size={rs(22, 24, 26)} color={COLORS.white} />
//         </TouchableOpacity>

//         <Text style={[styles.headerTitle, { fontSize: rs(16, 18, 20) }]}>AI Chat Assistant</Text>

//         <TouchableOpacity
//           style={[styles.notificationButton, { width: rs(36, 40, 44), height: rs(36, 40, 44), borderRadius: rs(8, 10, 12) }]}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="notifications-outline" size={rs(22, 24, 26)} color={COLORS.white} />
//           <View style={[styles.notificationBadge, { minWidth: rs(16, 18, 20), height: rs(16, 18, 20), borderRadius: rs(8, 9, 10) }]}>
//             <Text style={[styles.notificationBadgeText, { fontSize: rs(9, 10, 11) }]}>3</Text>
//           </View>
//         </TouchableOpacity>
//       </View>

//       {/* Welcome Section */}
//       <View style={[styles.welcomeSection, { paddingHorizontal: hPad, paddingVertical: rs(14, 18, 22) }]}>
//         {/* Icon */}
//         <View style={styles.welcomeIconContainer}>
//           <View style={[styles.iconGlow, { width: rs(72, 88, 104), height: rs(72, 88, 104), borderRadius: rs(36, 44, 52) }]}>
//             <Ionicons name="chatbubbles" size={rs(36, 44, 52)} color={COLORS.primary} />
//           </View>
//         </View>

//         <Text style={[styles.welcomeTitle, { fontSize: rs(17, 20, 22) }]}>Hello! I'm your AI Assistant.</Text>
//         <Text style={[styles.welcomeSubtitle, { fontSize: rs(12, 13, 14) }]}>
//           Ask about reports, sightings, trends, or matches.
//         </Text>

//         {/* Quick Actions — flex-wrap 2-col grid */}
//         <View style={styles.quickActionsContainer}>
//           {QUICK_ACTIONS.map((action, index) => (
//             <TouchableOpacity
//               key={action.id}
//               style={[
//                 styles.quickActionButton,
//                 {
//                   width: isOddChip(index) ? "100%" : chipWidth,
//                   paddingVertical: rs(10, 12, 14),
//                   paddingHorizontal: rs(10, 12, 14),
//                   borderRadius: rs(10, 12, 14),
//                   gap: rs(6, 8, 10),
//                 },
//               ]}
//               onPress={() => sendMessage(action.query)}
//               activeOpacity={0.7}
//             >
//               <Ionicons name={action.icon} size={rs(16, 18, 20)} color={action.color} />
//               <Text style={[styles.quickActionText, { fontSize: rs(11, 12, 13) }]} numberOfLines={2}>
//                 {action.text}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </View>

//       {/* Chat Messages */}
//       <ScrollView
//         ref={scrollViewRef}
//         style={styles.messagesContainer}
//         contentContainerStyle={[styles.messagesContent, { padding: hPad }]}
//         showsVerticalScrollIndicator={false}
//       >
//         {messages.map(renderMessage)}
//         {typing && (
//           <View style={[styles.messageContainer, styles.botMessageContainer]}>
//             <View style={styles.botAvatar}>
//               <Ionicons name="chatbubbles" size={rs(18, 20, 22)} color={COLORS.primary} />
//             </View>
//             <View style={[styles.messageBubble, styles.botBubble]}>
//               <View style={styles.typingIndicator}>
//                 <View style={styles.typingDot} />
//                 <View style={styles.typingDot} />
//                 <View style={styles.typingDot} />
//               </View>
//             </View>
//           </View>
//         )}
//       </ScrollView>

//       {/* Input Area */}
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
//       >
//         <View style={[styles.inputContainer, { paddingHorizontal: hPad, paddingVertical: rs(10, 12, 14), gap: rs(8, 10, 12) }]}>
//           <View style={[styles.inputWrapper, { borderRadius: rs(20, 24, 28), paddingHorizontal: rs(12, 14, 16), paddingVertical: rs(10, 12, 14), gap: rs(8, 10, 12) }]}>
//             <Ionicons name="sparkles" size={rs(18, 20, 22)} color={COLORS.textMuted} />
//             <TextInput
//               style={[styles.input, { fontSize: rs(13, 14, 15), maxHeight: rs(100, 120, 140) }]}
//               placeholder="Ask anything about reports, sightings, or trends..."
//               placeholderTextColor={COLORS.textMuted}
//               value={inputText}
//               onChangeText={setInputText}
//               multiline
//               maxLength={500}
//               editable={!loading}
//             />
//           </View>
//           <TouchableOpacity
//             style={[
//               styles.sendButton,
//               { width: rs(44, 48, 52), height: rs(44, 48, 52), borderRadius: rs(22, 24, 26) },
//               (!inputText.trim() || loading) && styles.sendButtonDisabled,
//             ]}
//             onPress={() => inputText.trim() && sendMessage(inputText)}
//             disabled={!inputText.trim() || loading}
//             activeOpacity={0.7}
//           >
//             {loading ? (
//               <ActivityIndicator size="small" color={COLORS.white} />
//             ) : (
//               <Ionicons name="send" size={rs(18, 20, 22)} color={COLORS.white} />
//             )}
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// function buildPoliceContextSnapshot({
//   statsData,
//   reportsData,
//   sightingsData,
//   analyticsData,
//   fallbackSightings = [],
//   fallbackMissingReports = [],
//   fallbackDashboardStats = null,
// }) {
//   const reports = extractItems(reportsData);
//   const pendingSightings = extractItems(sightingsData);
//   const recentSightings = Array.isArray(fallbackSightings) ? fallbackSightings.slice(0, 10) : [];
//   const recentMissingReports = Array.isArray(fallbackMissingReports)
//     ? fallbackMissingReports.slice(0, 10)
//     : [];

//   return {
//     scope: "police",
//     fetchedAt: new Date().toISOString(),
//     stats: {
//       ...(fallbackDashboardStats || {}),
//       ...(statsData && typeof statsData === "object" ? statsData : {}),
//     },
//     analytics: analyticsData && typeof analyticsData === "object" ? analyticsData : null,
//     reportsSummary: {
//       total: reports.length,
//       recent: reports.slice(0, 10).map(summarizeReportItem),
//       counts: summarizeReportCounts(reports),
//     },
//     sightingsSummary: {
//       total: recentSightings.length,
//       recent: recentSightings.map(summarizeSightingItem),
//       pending: pendingSightings.slice(0, 10).map(summarizeSightingItem),
//     },
//     missingReportsSummary: {
//       total: recentMissingReports.length,
//       recent: recentMissingReports.map(summarizeReportItem),
//     },
//   };
// }

// function extractItems(data) {
//   if (Array.isArray(data)) return data;
//   if (Array.isArray(data?.content)) return data.content;
//   if (Array.isArray(data?.items)) return data.items;
//   return [];
// }

// function summarizeReportCounts(items = []) {
//   return items.reduce(
//     (acc, item) => {
//       const status = String(item?.status || "").toLowerCase();
//       const type = String(item?.reportType || item?.type || "").toLowerCase();
//       const isSighting = type === "sighting" || status.includes("sighting");
//       const isSolved = status.includes("resolved") || status.includes("solved") || status.includes("found");

//       if (isSighting) acc.sightings += 1;
//       else if (isSolved) acc.solved += 1;
//       else acc.pending += 1;

//       acc.total += 1;
//       return acc;
//     },
//     { total: 0, solved: 0, pending: 0, sightings: 0 }
//   );
// }

// function summarizeReportItem(item = {}) {
//   return {
//     id: item.id || item.reportId || item.caseNumber || "",
//     title: item.title || item.fullName || item.name || item.location || "Unknown report",
//     status: item.status || item.reportStatus || "Unknown",
//     location: item.location || item.city || item.address || "Location not provided",
//     createdAt: item.createdAt || item.updatedAt || null,
//   };
// }

// function summarizeSightingItem(item = {}) {
//   return {
//     id: item.id || item.sightingId || item.caseId || "",
//     title: item.title || item.location || item.lastSeenPlace || "Unknown sighting",
//     status: item.status || item.verificationStatus || "Unknown",
//     location: item.location || item.city || item.address || "Location not provided",
//     createdAt: item.createdAt || item.updatedAt || null,
//   };
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.bg,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.border,
//   },
//   backButton: {
//     backgroundColor: COLORS.card,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   headerTitle: {
//     color: COLORS.white,
//     fontWeight: "700",
//     flex: 1,
//     textAlign: "center",
//   },
//   notificationButton: {
//     backgroundColor: COLORS.card,
//     alignItems: "center",
//     justifyContent: "center",
//     position: "relative",
//   },
//   notificationBadge: {
//     position: "absolute",
//     top: -2,
//     right: -2,
//     backgroundColor: COLORS.danger,
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 2,
//     borderColor: COLORS.bg,
//   },
//   notificationBadgeText: {
//     color: COLORS.white,
//     fontWeight: "700",
//   },
//   welcomeSection: {
//     backgroundColor: COLORS.bgSecondary,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.border,
//   },
//   welcomeIconContainer: {
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   iconGlow: {
//     backgroundColor: "rgba(66, 133, 244, 0.2)",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   welcomeTitle: {
//     color: COLORS.white,
//     fontWeight: "700",
//     textAlign: "center",
//     marginBottom: 6,
//   },
//   welcomeSubtitle: {
//     color: COLORS.textMuted,
//     textAlign: "center",
//     marginBottom: 16,
//   },
//   // KEY FIX: flexWrap + row direction — no CSS string flex values
//   quickActionsContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 10,
//   },
//   quickActionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: COLORS.card,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   quickActionText: {
//     color: COLORS.text,
//     fontWeight: "600",
//     flex: 1,
//   },
//   messagesContainer: {
//     flex: 1,
//   },
//   messagesContent: {
//     paddingBottom: 20,
//   },
//   messageContainer: {
//     flexDirection: "row",
//     marginBottom: 14,
//     alignItems: "flex-end",
//   },
//   userMessageContainer: {
//     justifyContent: "flex-end",
//   },
//   botMessageContainer: {
//     justifyContent: "flex-start",
//   },
//   botAvatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: COLORS.card,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 10,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   messageBubble: {
//     maxWidth: "75%",
//     padding: 12,
//     borderRadius: 14,
//   },
//   userBubble: {
//     backgroundColor: COLORS.userBubble,
//     borderBottomRightRadius: 4,
//   },
//   botBubble: {
//     backgroundColor: COLORS.botBubble,
//     borderBottomLeftRadius: 4,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   messageText: {
//     fontSize: 14,
//     lineHeight: 20,
//   },
//   userMessageText: {
//     color: COLORS.white,
//     fontWeight: "500",
//   },
//   botMessageText: {
//     color: COLORS.text,
//   },
//   messageFooter: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 6,
//     gap: 4,
//   },
//   messageTime: {
//     color: COLORS.textMuted,
//     fontSize: 11,
//   },
//   typingIndicator: {
//     flexDirection: "row",
//     gap: 4,
//     paddingVertical: 6,
//   },
//   typingDot: {
//     width: 7,
//     height: 7,
//     borderRadius: 4,
//     backgroundColor: COLORS.textMuted,
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "flex-end",
//     backgroundColor: COLORS.bgSecondary,
//     borderTopWidth: 1,
//     borderTopColor: COLORS.border,
//   },
//   inputWrapper: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: COLORS.inputBg,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   input: {
//     flex: 1,
//     color: COLORS.white,
//     paddingVertical: 0,
//   },
//   sendButton: {
//     backgroundColor: COLORS.primary,
//     alignItems: "center",
//     justifyContent: "center",
//     elevation: 6,
//   },
//   sendButtonDisabled: {
//     backgroundColor: COLORS.cardLight,
//     elevation: 0,
//   },
// });



























// // Screens/police/AIChatAssistantScreen.js
// import React, { useState, useRef, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   SafeAreaView,
//   StatusBar,
//   TouchableOpacity,
//   TextInput,
//   useWindowDimensions,
//   Platform,
//   KeyboardAvoidingView,
//   ActivityIndicator,
//   Animated,
//   Keyboard,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { API_BASE_URL, useSafeReturn } from "../context/SafeReturnContext";

// const COLORS = {
//   bg: "#0a1628",
//   bgSecondary: "#0f1f3d",
//   card: "#1a2f4a",
//   cardLight: "#254066",
//   border: "rgba(66, 133, 244, 0.3)",
//   borderActive: "rgba(66, 133, 244, 0.7)",
//   primary: "#4285f4",
//   primaryLight: "#5a9bff",
//   success: "#34a853",
//   warning: "#fbbc04",
//   danger: "#ea4335",
//   white: "#ffffff",
//   text: "#e8f0fe",
//   textMuted: "#9aaec9",
//   textSecondary: "#b4c7e0",
//   inputBg: "#1a2f4a",
//   botBubble: "#1a2f4a",
//   userBubble: "#4285f4",
// };

// const QUICK_ACTIONS = [
//   { id: "reports-today",    icon: "analytics",               text: "How many reports today?",     query: "How many reports were received today?", color: COLORS.primary },
//   { id: "recent-sightings", icon: "eye-outline",             text: "Show recent sightings",        query: "Show me recent sightings",              color: COLORS.success },
//   { id: "solved-week",      icon: "checkmark-circle-outline",text: "How many solved this week?",  query: "How many cases were solved this week?", color: COLORS.success },
//   { id: "urgent-reports",   icon: "warning-outline",         text: "Find urgent reports",          query: "Show me urgent reports",                color: COLORS.danger  },
//   { id: "ai-matches",       icon: "images-outline",          text: "Show AI image match results",  query: "Show AI image matching results",         color: COLORS.warning },
// ];

// export default function AIChatAssistantScreen({ navigation }) {
//   const {
//     authToken,
//     fetchPoliceStats,
//     fetchPoliceReports,
//     fetchPoliceSightings,
//     fetchPoliceAnalytics,
//     sightingReports = [],
//     missingReports = [],
//     dashboardStats,
//   } = useSafeReturn();

//   const { width } = useWindowDimensions();
//   const isTablet = width >= 768;
//   const isSmall  = width < 375;
//   const rs = (small, medium, large, tablet) => {
//     if (isTablet) return tablet || large;
//     if (isSmall)  return small;
//     if (width < 414) return medium;
//     return large;
//   };

//   const chipColumns = isTablet ? 3 : 2;
//   const chipGap     = 10;
//   const hPad        = rs(12, 16, 20, 24);
//   const chipWidth   = (width - hPad * 2 - chipGap * (chipColumns - 1)) / chipColumns;
//   const isOddChip   = (i) => !isTablet && i === QUICK_ACTIONS.length - 1 && QUICK_ACTIONS.length % 2 !== 0;

//   const [messages,        setMessages]        = useState([]);
//   const [inputText,       setInputText]       = useState("");
//   const [loading,         setLoading]         = useState(false);
//   const [typing,          setTyping]          = useState(false);
//   const [contextSnapshot, setContextSnapshot] = useState(null);
//   const [inputFocused,    setInputFocused]    = useState(false);

//   const scrollViewRef    = useRef(null);
//   const inputRef         = useRef(null);
//   const headerAnim       = useRef(new Animated.Value(0)).current;
//   const headerCollapsed  = useRef(false);

//   // Welcome section animates from full height to 0
//   const WELCOME_H = rs(290, 330, 370, 400);

//   const welcomeHeight = headerAnim.interpolate({
//     inputRange:  [0, 1],
//     outputRange: [WELCOME_H, 0],
//     extrapolate: "clamp",
//   });
//   const welcomeOpacity = headerAnim.interpolate({
//     inputRange:  [0, 0.5, 1],
//     outputRange: [1, 0.2, 0],
//     extrapolate: "clamp",
//   });
//   const hintOpacity = headerAnim.interpolate({
//     inputRange:  [0.7, 1],
//     outputRange: [0, 1],
//     extrapolate: "clamp",
//   });
//   const hintHeight = headerAnim.interpolate({
//     inputRange:  [0.7, 1],
//     outputRange: [0, 32],
//     extrapolate: "clamp",
//   });

//   const collapseHeader = useCallback(() => {
//     if (headerCollapsed.current) return;
//     headerCollapsed.current = true;
//     Animated.spring(headerAnim, { toValue: 1, useNativeDriver: false, tension: 80, friction: 12 }).start();
//   }, [headerAnim]);

//   const expandHeader = useCallback(() => {
//     if (!headerCollapsed.current) return;
//     headerCollapsed.current = false;
//     Animated.spring(headerAnim, { toValue: 0, useNativeDriver: false, tension: 60, friction: 14 }).start();
//   }, [headerAnim]);

//   // Collapse on keyboard show, expand on hide (only if just welcome msg)
//   useEffect(() => {
//     const show = Keyboard.addListener("keyboardDidShow", () => collapseHeader());
//     const hide = Keyboard.addListener("keyboardDidHide", () => {
//       if (messages.length <= 1) expandHeader();
//     });
//     return () => { show.remove(); hide.remove(); };
//   }, [collapseHeader, expandHeader, messages.length]);

//   // Welcome message
//   useEffect(() => {
//     setMessages([{
//       id: "welcome",
//       role: "assistant",
//       text: "Hello! I can help you with reports, sightings, trends, matches, and more.\nWhat would you like to know?",
//       timestamp: new Date().toISOString(),
//     }]);
//   }, []);

//   // Auto-scroll + collapse when conversation grows
//   useEffect(() => {
//     if (scrollViewRef.current) {
//       setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
//     }
//     if (messages.length > 1) collapseHeader();
//   }, [messages, collapseHeader]);

//   // Context snapshot
//   const loadContext = useCallback(async () => {
//     try {
//       const [statsData, reportsData, sightingsData, analyticsData] = await Promise.all([
//         fetchPoliceStats?.(), fetchPoliceReports?.(0, 25), fetchPoliceSightings?.(), fetchPoliceAnalytics?.(),
//       ]);
//       return buildContextSnapshot({ statsData, reportsData, sightingsData, analyticsData, fallbackSightings: sightingReports, fallbackMissingReports: missingReports, fallbackDashboardStats: dashboardStats });
//     } catch {
//       return buildContextSnapshot({ fallbackSightings: sightingReports, fallbackMissingReports: missingReports, fallbackDashboardStats: dashboardStats });
//     }
//   }, [dashboardStats, fetchPoliceAnalytics, fetchPoliceReports, fetchPoliceSightings, fetchPoliceStats, missingReports, sightingReports]);

//   useEffect(() => {
//     let alive = true;
//     loadContext().then((s) => { if (alive) setContextSnapshot(s); });
//     return () => { alive = false; };
//   }, [loadContext]);

//   const sendMessage = useCallback(async (text) => {
//     if (!text.trim() || loading) return;
//     Keyboard.dismiss();
//     collapseHeader();

//     const userMsg = { id: Date.now().toString(), role: "user", text: text.trim(), timestamp: new Date().toISOString() };
//     setMessages((p) => [...p, userMsg]);
//     setInputText("");
//     setLoading(true);
//     setTyping(true);

//     try {
//       const history  = messages.slice(-10).map((m) => ({ role: m.role, content: m.text }));
//       const liveCtx  = (await loadContext()) || contextSnapshot;
//       const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
//         body: JSON.stringify({ message: text.trim(), history, context: liveCtx, role: "police", source: "police-ai-assistant" }),
//       });
//       if (!response.ok) throw new Error("Bad response");
//       const data = await response.json();
//       setMessages((p) => [...p, {
//         id: (Date.now() + 1).toString(), role: "assistant",
//         text: data.reply || "I'm sorry, I couldn't process your request.",
//         timestamp: new Date().toISOString(), contextUsed: data.contextUsed,
//       }]);
//     } catch {
//       setMessages((p) => [...p, {
//         id: (Date.now() + 1).toString(), role: "assistant",
//         text: "I'm sorry, I encountered an error. Please try again.",
//         timestamp: new Date().toISOString(), isError: true,
//       }]);
//     } finally {
//       setLoading(false);
//       setTyping(false);
//     }
//   }, [messages, authToken, loading, contextSnapshot, loadContext, collapseHeader]);

//   // Scroll handler
//   const onScroll = useCallback((e) => {
//     const y = e.nativeEvent.contentOffset.y;
//     if (y > 40 && !headerCollapsed.current) collapseHeader();
//     if (y < 10 && headerCollapsed.current && messages.length <= 1) expandHeader();
//   }, [collapseHeader, expandHeader, messages.length]);

//   const formatTime = (ts) =>
//     new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

//   const renderMessage = (message) => {
//     const isUser = message.role === "user";
//     return (
//       <View key={message.id} style={[styles.messageContainer, isUser ? styles.userMsgRow : styles.botMsgRow]}>
//         {!isUser && (
//           <View style={styles.botAvatar}>
//             <Ionicons name="chatbubbles" size={18} color={COLORS.primary} />
//           </View>
//         )}
//         <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble, message.isError && styles.errorBubble]}>
//           <Text style={[styles.messageText, isUser ? styles.userMsgText : styles.botMsgText]}>
//             {message.text}
//           </Text>
//           <View style={styles.messageFooter}>
//             <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
//             {isUser && <Ionicons name="checkmark-done" size={13} color={COLORS.textMuted} />}
//           </View>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

//       {/* Fixed header */}
//       <View style={[styles.header, { paddingHorizontal: hPad }]}>
//         <TouchableOpacity
//           style={[styles.iconBtn, { width: rs(36,40,44), height: rs(36,40,44), borderRadius: rs(8,10,12) }]}
//           onPress={() => navigation.goBack()}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="arrow-back" size={rs(20,22,24)} color={COLORS.white} />
//         </TouchableOpacity>

//         <View style={styles.headerCenter}>
//           <View style={styles.headerDot} />
//           <Text style={[styles.headerTitle, { fontSize: rs(15,17,19) }]}>AI Chat Assistant</Text>
//         </View>

//         <TouchableOpacity
//           style={[styles.iconBtn, { width: rs(36,40,44), height: rs(36,40,44), borderRadius: rs(8,10,12) }]}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="notifications-outline" size={rs(20,22,24)} color={COLORS.white} />
//           <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
//         </TouchableOpacity>
//       </View>

//       {/* Animated welcome + quick actions */}
//       <Animated.View style={[styles.welcomeSection, { height: welcomeHeight, opacity: welcomeOpacity, paddingHorizontal: hPad }]}>
//         <View style={styles.welcomeIconContainer}>
//           <View style={[styles.iconGlow, { width: rs(64,80,96), height: rs(64,80,96), borderRadius: rs(32,40,48) }]}>
//             <Ionicons name="chatbubbles" size={rs(32,40,48)} color={COLORS.primary} />
//           </View>
//         </View>
//         <Text style={[styles.welcomeTitle, { fontSize: rs(16,19,21) }]}>Hello! I'm your AI Assistant.</Text>
//         <Text style={[styles.welcomeSubtitle, { fontSize: rs(11,12,13) }]}>
//           Ask about reports, sightings, trends, or matches.
//         </Text>
//         <View style={styles.quickGrid}>
//           {QUICK_ACTIONS.map((action, index) => (
//             <TouchableOpacity
//               key={action.id}
//               style={[styles.quickBtn, {
//                 width: isOddChip(index) ? "100%" : chipWidth,
//                 paddingVertical: rs(10,11,12),
//                 paddingHorizontal: rs(10,12,14),
//                 borderRadius: rs(10,12,14),
//               }]}
//               onPress={() => sendMessage(action.query)}
//               activeOpacity={0.7}
//             >
//               <View style={[styles.quickIconWrap, { backgroundColor: `${action.color}20` }]}>
//                 <Ionicons name={action.icon} size={rs(15,16,18)} color={action.color} />
//               </View>
//               <Text style={[styles.quickText, { fontSize: rs(11,12,13) }]} numberOfLines={2}>
//                 {action.text}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </Animated.View>

//       {/* "Show quick actions" hint when collapsed */}
//       <Animated.View style={[styles.collapsedHint, { opacity: hintOpacity, height: hintHeight }]}>
//         <TouchableOpacity style={styles.collapsedHintInner} onPress={expandHeader} activeOpacity={0.7}>
//           <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
//           <Text style={styles.collapsedHintText}>Show quick actions</Text>
//           <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
//         </TouchableOpacity>
//       </Animated.View>

//       {/* Messages + input inside KeyboardAvoidingView */}
//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
//       >
//         <ScrollView
//           ref={scrollViewRef}
//           style={styles.messagesList}
//           contentContainerStyle={[styles.messagesContent, { paddingHorizontal: hPad }]}
//           showsVerticalScrollIndicator={false}
//           onScroll={onScroll}
//           scrollEventThrottle={16}
//           keyboardShouldPersistTaps="handled"
//           keyboardDismissMode="interactive"
//         >
//           {messages.map(renderMessage)}
//           {typing && (
//             <View style={[styles.messageContainer, styles.botMsgRow]}>
//               <View style={styles.botAvatar}>
//                 <Ionicons name="chatbubbles" size={18} color={COLORS.primary} />
//               </View>
//               <View style={[styles.messageBubble, styles.botBubble]}>
//                 <View style={styles.typingRow}>
//                   {[0, 1, 2].map((i) => <TypingDot key={i} delay={i * 160} />)}
//                 </View>
//               </View>
//             </View>
//           )}
//         </ScrollView>

//         {/* Input bar — lives inside KAV so it rides up with keyboard */}
//         <View style={[styles.inputBar, { paddingHorizontal: hPad, paddingVertical: rs(10,12,14) }]}>
//           <View style={[
//             styles.inputWrapper,
//             inputFocused && styles.inputWrapperFocused,
//             { borderRadius: rs(22,24,26), paddingHorizontal: rs(12,14,16), paddingVertical: rs(8,10,12) },
//           ]}>
//             <Ionicons name="sparkles" size={rs(16,18,20)} color={inputFocused ? COLORS.primary : COLORS.textMuted} />
//             <TextInput
//               ref={inputRef}
//               style={[styles.input, { fontSize: rs(13,14,15), maxHeight: rs(90,110,130) }]}
//               placeholder="Ask anything about reports or sightings..."
//               placeholderTextColor={COLORS.textMuted}
//               value={inputText}
//               onChangeText={setInputText}
//               onFocus={() => { setInputFocused(true); collapseHeader(); }}
//               onBlur={() => setInputFocused(false)}
//               multiline
//               maxLength={500}
//               editable={!loading}
//               blurOnSubmit={false}
//             />
//             {inputText.length > 0 && (
//               <TouchableOpacity onPress={() => setInputText("")} activeOpacity={0.7}>
//                 <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
//               </TouchableOpacity>
//             )}
//           </View>

//           <TouchableOpacity
//             style={[
//               styles.sendBtn,
//               { width: rs(44,48,52), height: rs(44,48,52), borderRadius: rs(22,24,26) },
//               (!inputText.trim() || loading) && styles.sendBtnDisabled,
//             ]}
//             onPress={() => sendMessage(inputText)}
//             disabled={!inputText.trim() || loading}
//             activeOpacity={0.8}
//           >
//             {loading
//               ? <ActivityIndicator size="small" color={COLORS.white} />
//               : <Ionicons name="send" size={rs(16,18,20)} color={COLORS.white} />
//             }
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// // Animated bouncing typing dot
// function TypingDot({ delay }) {
//   const anim = useRef(new Animated.Value(0)).current;
//   useEffect(() => {
//     const loop = Animated.loop(
//       Animated.sequence([
//         Animated.delay(delay),
//         Animated.timing(anim, { toValue: -6, duration: 280, useNativeDriver: true }),
//         Animated.timing(anim, { toValue:  0, duration: 280, useNativeDriver: true }),
//         Animated.delay(500),
//       ])
//     );
//     loop.start();
//     return () => loop.stop();
//   }, [anim, delay]);
//   return <Animated.View style={[styles.typingDot, { transform: [{ translateY: anim }] }]} />;
// }

// // Context helpers
// function buildContextSnapshot({ statsData, reportsData, sightingsData, analyticsData, fallbackSightings = [], fallbackMissingReports = [], fallbackDashboardStats = null }) {
//   const reports          = extractItems(reportsData);
//   const pendingSightings = extractItems(sightingsData);
//   const recentSightings  = Array.isArray(fallbackSightings)      ? fallbackSightings.slice(0, 10)      : [];
//   const recentMissing    = Array.isArray(fallbackMissingReports) ? fallbackMissingReports.slice(0, 10) : [];
//   return {
//     scope: "police", fetchedAt: new Date().toISOString(),
//     stats: { ...(fallbackDashboardStats || {}), ...(statsData && typeof statsData === "object" ? statsData : {}) },
//     analytics: analyticsData && typeof analyticsData === "object" ? analyticsData : null,
//     reportsSummary:        { total: reports.length,         recent: reports.slice(0, 10).map(summarizeReport),  counts: summarizeCounts(reports) },
//     sightingsSummary:      { total: recentSightings.length, recent: recentSightings.map(summarizeSighting),     pending: pendingSightings.slice(0, 10).map(summarizeSighting) },
//     missingReportsSummary: { total: recentMissing.length,   recent: recentMissing.map(summarizeReport) },
//   };
// }
// function extractItems(d) {
//   if (Array.isArray(d))          return d;
//   if (Array.isArray(d?.content)) return d.content;
//   if (Array.isArray(d?.items))   return d.items;
//   return [];
// }
// function summarizeCounts(items = []) {
//   return items.reduce((a, i) => {
//     const s = String(i?.status || "").toLowerCase();
//     const t = String(i?.reportType || i?.type || "").toLowerCase();
//     if (t === "sighting" || s.includes("sighting")) a.sightings++;
//     else if (s.includes("resolved") || s.includes("solved") || s.includes("found")) a.solved++;
//     else a.pending++;
//     a.total++;
//     return a;
//   }, { total: 0, solved: 0, pending: 0, sightings: 0 });
// }
// function summarizeReport(i = {})   { return { id: i.id || i.reportId || "", title: i.title || i.fullName || "Unknown", status: i.status || "Unknown", location: i.location || i.city || "Unknown", createdAt: i.createdAt || null }; }
// function summarizeSighting(i = {}) { return { id: i.id || i.sightingId || "", title: i.title || i.location || "Unknown", status: i.status || "Unknown", location: i.location || i.city || "Unknown", createdAt: i.createdAt || null }; }

// const styles = StyleSheet.create({
//   container:        { flex: 1, backgroundColor: COLORS.bg },
//   header:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.bg, zIndex: 10 },
//   headerCenter:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
//   headerDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
//   headerTitle:      { color: COLORS.white, fontWeight: "700" },
//   iconBtn:          { backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center" },
//   badge:            { position: "absolute", top: -2, right: -2, backgroundColor: COLORS.danger, minWidth: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.bg },
//   badgeText:        { color: COLORS.white, fontSize: 10, fontWeight: "700" },

//   welcomeSection:        { backgroundColor: COLORS.bgSecondary, borderBottomWidth: 1, borderBottomColor: COLORS.border, overflow: "hidden", paddingTop: 14, paddingBottom: 14 },
//   welcomeIconContainer:  { alignItems: "center", marginBottom: 10 },
//   iconGlow:              { backgroundColor: "rgba(66,133,244,0.18)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(66,133,244,0.25)" },
//   welcomeTitle:          { color: COLORS.white, fontWeight: "700", textAlign: "center", marginBottom: 4 },
//   welcomeSubtitle:       { color: COLORS.textMuted, textAlign: "center", marginBottom: 14 },
//   quickGrid:             { flexDirection: "row", flexWrap: "wrap", gap: 10 },
//   quickBtn:              { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
//   quickIconWrap:         { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
//   quickText:             { color: COLORS.text, fontWeight: "600", flex: 1 },

//   collapsedHint:         { backgroundColor: COLORS.bgSecondary, borderBottomWidth: 1, borderBottomColor: COLORS.border, overflow: "hidden" },
//   collapsedHintInner:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
//   collapsedHintText:     { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },

//   messagesList:          { flex: 1 },
//   messagesContent:       { paddingTop: 16, paddingBottom: 8 },
//   messageContainer:      { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
//   userMsgRow:            { justifyContent: "flex-end" },
//   botMsgRow:             { justifyContent: "flex-start" },
//   botAvatar:             { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center", marginRight: 8, borderWidth: 1, borderColor: COLORS.border, flexShrink: 0 },
//   messageBubble:         { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
//   userBubble:            { backgroundColor: COLORS.userBubble, borderBottomRightRadius: 4 },
//   botBubble:             { backgroundColor: COLORS.botBubble, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
//   errorBubble:           { borderColor: "rgba(234,67,53,0.4)" },
//   messageText:           { fontSize: 14, lineHeight: 21 },
//   userMsgText:           { color: COLORS.white, fontWeight: "500" },
//   botMsgText:            { color: COLORS.text },
//   messageFooter:         { flexDirection: "row", alignItems: "center", marginTop: 5, gap: 4 },
//   messageTime:           { color: COLORS.textMuted, fontSize: 11 },
//   typingRow:             { flexDirection: "row", gap: 5, paddingVertical: 4, paddingHorizontal: 2 },
//   typingDot:             { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.textMuted },

//   inputBar:              { flexDirection: "row", alignItems: "flex-end", backgroundColor: COLORS.bgSecondary, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10 },
//   inputWrapper:          { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.border, gap: 10 },
//   inputWrapperFocused:   { borderColor: COLORS.borderActive },
//   input:                 { flex: 1, color: COLORS.white, paddingVertical: 0 },
//   sendBtn:               { backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", elevation: 4, flexShrink: 0 },
//   sendBtnDisabled:       { backgroundColor: COLORS.cardLight, elevation: 0 },
// });

























// Screens/police/AIChatAssistantScreen.js
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
  Keyboard,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, useSafeReturn } from "../context/SafeReturnContext";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:           "#08111f",
  surface:      "#0e1c30",
  surfaceHigh:  "#162540",
  card:         "#1c2f46",
  cardMid:      "#233655",
  border:       "rgba(66,133,244,0.18)",
  borderStrong: "rgba(66,133,244,0.42)",
  primary:      "#4285f4",
  primaryDim:   "rgba(66,133,244,0.14)",
  success:      "#34a853",
  successDim:   "rgba(52,168,83,0.14)",
  warning:      "#fbbc04",
  warningDim:   "rgba(251,188,4,0.14)",
  danger:       "#ea4335",
  dangerDim:    "rgba(234,67,53,0.14)",
  white:        "#ffffff",
  text:         "#dce8fb",
  textSub:      "#8da8c8",
  textMuted:    "#5c7a9b",
  inputBg:      "#0e1c30",
  userBubble:   "#2557c7",
  botBubble:    "#162540",
};

const QUICK_ACTIONS = [
  { id: "reports-today",    icon: "bar-chart",        text: "Reports today",     query: "How many reports were received today?",  color: C.primary,  dim: C.primaryDim  },
  { id: "recent-sightings", icon: "eye",              text: "Recent sightings",  query: "Show me recent sightings",               color: C.success,  dim: C.successDim  },
  { id: "solved-week",      icon: "checkmark-circle", text: "Solved this week",  query: "How many cases were solved this week?",  color: C.success,  dim: C.successDim  },
  { id: "urgent-reports",   icon: "alert-circle",     text: "Urgent reports",    query: "Show me urgent reports",                 color: C.danger,   dim: C.dangerDim   },
  { id: "ai-matches",       icon: "images",           text: "AI match results",  query: "Show AI image matching results",         color: C.warning,  dim: C.warningDim  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIChatAssistantScreen({ navigation }) {
  const {
    authToken,
    fetchPoliceStats,
    fetchPoliceReports,
    fetchPoliceSightings,
    fetchPoliceAnalytics,
    sightingReports = [],
    missingReports = [],
    dashboardStats,
  } = useSafeReturn();

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isSmall  = width < 375;
  const rs = (s, m, l, t) => isTablet ? (t ?? l) : isSmall ? s : width < 414 ? m : l;

  // ── State ──
  const [messages,        setMessages]        = useState([]);
  const [inputText,       setInputText]       = useState("");
  const [loading,         setLoading]         = useState(false);
  const [typing,          setTyping]          = useState(false);
  const [contextSnapshot, setContextSnapshot] = useState(null);
  const [inputFocused,    setInputFocused]    = useState(false);
  const [showScrollBtn,   setShowScrollBtn]   = useState(false);
  const [selectedMsg,     setSelectedMsg]     = useState(null); // for timestamp reveal

  // ── Refs ──
  const scrollViewRef  = useRef(null);
  const inputRef       = useRef(null);
  const isNearBottom   = useRef(true);
  const sendAnim       = useRef(new Animated.Value(1)).current;
  const scrollBtnAnim  = useRef(new Animated.Value(0)).current;

  const hPad = rs(14, 16, 20, 24);

  // ── Welcome ──
  useEffect(() => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      text: "Hello! I can help you with reports, sightings, trends, matches, and more.\nWhat would you like to know?",
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  // ── Auto-scroll ──
  useEffect(() => {
    if (isNearBottom.current && scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // ── Scroll-to-bottom FAB visibility ──
  const toggleScrollBtn = useCallback((visible) => {
    Animated.spring(scrollBtnAnim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    }).start();
    setShowScrollBtn(visible);
  }, [scrollBtnAnim]);

  const onScroll = useCallback((e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    isNearBottom.current = distFromBottom < 80;
    toggleScrollBtn(distFromBottom > 200);
  }, [toggleScrollBtn]);

  // ── Context ──
  const loadContext = useCallback(async () => {
    try {
      const [statsData, reportsData, sightingsData, analyticsData] = await Promise.all([
        fetchPoliceStats?.(), fetchPoliceReports?.(0, 25),
        fetchPoliceSightings?.(), fetchPoliceAnalytics?.(),
      ]);
      return buildContextSnapshot({ statsData, reportsData, sightingsData, analyticsData, fallbackSightings: sightingReports, fallbackMissingReports: missingReports, fallbackDashboardStats: dashboardStats });
    } catch {
      return buildContextSnapshot({ fallbackSightings: sightingReports, fallbackMissingReports: missingReports, fallbackDashboardStats: dashboardStats });
    }
  }, [dashboardStats, fetchPoliceAnalytics, fetchPoliceReports, fetchPoliceSightings, fetchPoliceStats, missingReports, sightingReports]);

  useEffect(() => {
    let alive = true;
    loadContext().then((s) => { if (alive) setContextSnapshot(s); });
    return () => { alive = false; };
  }, [loadContext]);

  // ── Send ──
  const animateSend = () => {
    Animated.sequence([
      Animated.timing(sendAnim, { toValue: 0.82, duration: 90, useNativeDriver: true }),
      Animated.spring(sendAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
  };

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    Keyboard.dismiss();
    animateSend();

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      text: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((p) => [...p, userMsg]);
    setInputText("");
    setLoading(true);
    setTyping(true);
    isNearBottom.current = true;

    try {
      const history  = messages.slice(-10).map((m) => ({ role: m.role, content: m.text }));
      const liveCtx  = (await loadContext()) || contextSnapshot;
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ message: trimmed, history, context: liveCtx, role: "police", source: "police-ai-assistant" }),
      });
      if (!response.ok) throw new Error("Bad response");
      const data = await response.json();
      setMessages((p) => [...p, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: data.reply || "I couldn't process your request. Please try again.",
        timestamp: new Date().toISOString(),
        contextUsed: data.contextUsed,
      }]);
    } catch {
      setMessages((p) => [...p, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "Something went wrong. Please check your connection and try again.",
        timestamp: new Date().toISOString(),
        isError: true,
      }]);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  }, [messages, authToken, loading, contextSnapshot, loadContext]);

  // ── Render message ──
  const renderMessage = (message, index) => {
    const isUser    = message.role === "user";
    const prevMsg   = messages[index - 1];
    const nextMsg   = messages[index + 1];
    const isFirst   = !prevMsg || prevMsg.role !== message.role;
    const isLast    = !nextMsg || nextMsg.role !== message.role;
    const showTime  = selectedMsg === message.id || isLast;
    const isSelected = selectedMsg === message.id;

    return (
      <View
        key={message.id}
        style={[
          styles.messageGroup,
          isUser ? styles.groupRight : styles.groupLeft,
          !isFirst && { marginTop: 2 },
        ]}
      >
        {/* Bot avatar — only on first of a group */}
        {!isUser && (
          <View style={[styles.avatarCol, !isFirst && styles.avatarColHidden]}>
            {isFirst && (
              <View style={styles.botAvatar}>
                <Ionicons name="sparkles" size={15} color={C.primary} />
                <View style={styles.avatarDot} />
              </View>
            )}
          </View>
        )}

        <Pressable
          style={[styles.bubbleWrap, isUser && styles.bubbleWrapUser]}
          onPress={() => setSelectedMsg(isSelected ? null : message.id)}
        >
          <View style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.botBubble,
            message.isError && styles.errorBubble,
            isFirst  && !isUser && styles.bubbleFirstBot,
            isFirst  && isUser  && styles.bubbleFirstUser,
            isLast   && !isUser && styles.bubbleLastBot,
            isLast   && isUser  && styles.bubbleLastUser,
            !isFirst && !isLast && styles.bubbleMid,
          ]}>
            <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextBot]}>
              {message.text}
            </Text>
          </View>

          {showTime && (
            <View style={[styles.timeRow, isUser && styles.timeRowRight]}>
              {isUser && (
                <Ionicons
                  name={loading && index === messages.length - 1 ? "time-outline" : "checkmark-done"}
                  size={12}
                  color={C.textMuted}
                />
              )}
              <Text style={styles.timeText}>{formatTime(message.timestamp)}</Text>
            </View>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </TouchableOpacity>

        <View style={styles.headerMeta}>
          <View style={styles.headerAvatarSmall}>
            <Ionicons name="sparkles" size={13} color={C.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <View style={styles.headerStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.headerStatusText}>Online · Ready to help</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="ellipsis-horizontal" size={20} color={C.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* ── Message list ── */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.msgList}
          contentContainerStyle={[styles.msgContent, { paddingHorizontal: hPad }]}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Date divider */}
          <View style={styles.dateDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Today</Text>
            <View style={styles.dividerLine} />
          </View>

          {messages.map((m, i) => renderMessage(m, i))}

          {/* Typing indicator */}
          {typing && (
            <View style={[styles.messageGroup, styles.groupLeft]}>
              <View style={styles.avatarCol}>
                <View style={styles.botAvatar}>
                  <Ionicons name="sparkles" size={15} color={C.primary} />
                  <View style={styles.avatarDot} />
                </View>
              </View>
              <View style={[styles.bubble, styles.botBubble, styles.bubbleFirstBot, styles.bubbleLastBot]}>
                <View style={styles.typingRow}>
                  <TypingDot delay={0}   color={C.textMuted} />
                  <TypingDot delay={160} color={C.textMuted} />
                  <TypingDot delay={320} color={C.textMuted} />
                </View>
              </View>
            </View>
          )}
          <View style={{ height: 8 }} />
        </ScrollView>

        {/* ── Scroll to bottom FAB ── */}
        <Animated.View
          style={[
            styles.scrollFab,
            {
              opacity: scrollBtnAnim,
              transform: [{ scale: scrollBtnAnim }, { translateY: scrollBtnAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            },
          ]}
          pointerEvents={showScrollBtn ? "auto" : "none"}
        >
          <TouchableOpacity
            style={styles.scrollFabBtn}
            onPress={() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
              isNearBottom.current = true;
              toggleScrollBtn(false);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-down" size={18} color={C.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Quick action chips ── */}
        <View style={[styles.chipsContainer, { paddingHorizontal: hPad }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
            keyboardShouldPersistTaps="always"
          >
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[styles.chip, { backgroundColor: a.dim, borderColor: `${a.color}40` }]}
                onPress={() => sendMessage(a.query)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Ionicons name={a.icon} size={13} color={a.color} />
                <Text style={[styles.chipText, { color: a.color }]}>{a.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Input bar ── */}
        <View style={[styles.inputBar, { paddingHorizontal: hPad, paddingBottom: rs(12, 14, 16) }]}>
          <View style={[styles.inputWrapper, inputFocused && styles.inputWrapperFocused]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { fontSize: rs(13, 14, 15), maxHeight: rs(100, 110, 120) }]}
              placeholder="Message AI Assistant…"
              placeholderTextColor={C.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              multiline
              maxLength={500}
              editable={!loading}
              blurOnSubmit={false}
            />

            {/* Char count (shows when typing) */}
            {inputText.length > 400 && (
              <Text style={[styles.charCount, inputText.length > 480 && styles.charCountWarn]}>
                {500 - inputText.length}
              </Text>
            )}

            {inputText.length > 0 && (
              <TouchableOpacity onPress={() => setInputText("")} style={styles.clearBtn} activeOpacity={0.6}>
                <Ionicons name="close-circle" size={17} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <Animated.View style={{ transform: [{ scale: sendAnim }] }}>
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnOff]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator size="small" color={C.white} />
                : <Ionicons name="arrow-up" size={rs(17, 18, 19)} color={C.white} />
              }
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Typing dot ───────────────────────────────────────────────────────────────
function TypingDot({ delay, color }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: -5, duration: 260, useNativeDriver: true }),
        Animated.timing(anim, { toValue:  0, duration: 260, useNativeDriver: true }),
        Animated.delay(460),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);
  return <Animated.View style={[styles.typingDot, { backgroundColor: color, transform: [{ translateY: anim }] }]} />;
}

// ─── Context helpers ──────────────────────────────────────────────────────────
function buildContextSnapshot({ statsData, reportsData, sightingsData, analyticsData, fallbackSightings = [], fallbackMissingReports = [], fallbackDashboardStats = null }) {
  const reports          = extractItems(reportsData);
  const pendingSightings = extractItems(sightingsData);
  const recentSightings  = Array.isArray(fallbackSightings)      ? fallbackSightings.slice(0, 10)      : [];
  const recentMissing    = Array.isArray(fallbackMissingReports) ? fallbackMissingReports.slice(0, 10) : [];
  return {
    scope: "police",
    fetchedAt: new Date().toISOString(),
    stats: { ...(fallbackDashboardStats || {}), ...(statsData && typeof statsData === "object" ? statsData : {}) },
    analytics: analyticsData && typeof analyticsData === "object" ? analyticsData : null,
    reportsSummary:        { total: reports.length,          recent: reports.slice(0, 10).map(summarizeReport),          counts: summarizeCounts(reports) },
    sightingsSummary:      { total: recentSightings.length,  recent: recentSightings.map(summarizeSighting),              pending: pendingSightings.slice(0, 10).map(summarizeSighting) },
    missingReportsSummary: { total: recentMissing.length,    recent: recentMissing.map(summarizeReport) },
  };
}
function extractItems(d) {
  if (Array.isArray(d))          return d;
  if (Array.isArray(d?.content)) return d.content;
  if (Array.isArray(d?.items))   return d.items;
  return [];
}
function summarizeCounts(items = []) {
  return items.reduce((a, i) => {
    const s = String(i?.status || "").toLowerCase();
    const t = String(i?.reportType || i?.type || "").toLowerCase();
    if (t === "sighting" || s.includes("sighting")) a.sightings++;
    else if (s.includes("resolved") || s.includes("solved") || s.includes("found")) a.solved++;
    else a.pending++;
    a.total++;
    return a;
  }, { total: 0, solved: 0, pending: 0, sightings: 0 });
}
function summarizeReport(i = {})   { return { id: i.id || i.reportId || "", title: i.title || i.fullName || "Unknown", status: i.status || "Unknown", location: i.location || i.city || "Unknown", createdAt: i.createdAt || null }; }
function summarizeSighting(i = {}) { return { id: i.id || i.sightingId || "", title: i.title || i.location || "Unknown", status: i.status || "Unknown", location: i.location || i.city || "Unknown", createdAt: i.createdAt || null }; }

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },

  // Header
  header:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  navBtn:           { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  headerMeta:       { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatarSmall:{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.primaryDim, borderWidth: 1, borderColor: `${C.primary}35`, alignItems: "center", justifyContent: "center" },
  headerTitle:      { color: C.text, fontSize: 15, fontWeight: "700", letterSpacing: 0.1 },
  headerStatus:     { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 },
  statusDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  headerStatusText: { color: C.textSub, fontSize: 11, fontWeight: "500" },

  // Message list
  msgList:    { flex: 1 },
  msgContent: { paddingTop: 18, paddingBottom: 4 },

  // Date divider
  dateDivider:  { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: C.border },
  dividerText:  { color: C.textMuted, fontSize: 11, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },

  // Message groups
  messageGroup:     { flexDirection: "row", alignItems: "flex-end", marginBottom: 2 },
  groupLeft:        { justifyContent: "flex-start" },
  groupRight:       { justifyContent: "flex-end" },
  bubbleWrap:       { maxWidth: "75%", alignItems: "flex-start" },
  bubbleWrapUser:   { alignItems: "flex-end" },

  // Avatar
  avatarCol:        { width: 34, marginRight: 8, alignSelf: "flex-end" },
  avatarColHidden:  { opacity: 0 },
  botAvatar:        { width: 34, height: 34, borderRadius: 10, backgroundColor: C.surfaceHigh, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  avatarDot:        { position: "absolute", bottom: 2, right: 2, width: 7, height: 7, borderRadius: 4, backgroundColor: C.success, borderWidth: 1.5, borderColor: C.surface },

  // Bubbles
  bubble:          { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 4 },
  userBubble:      { backgroundColor: C.userBubble },
  botBubble:       { backgroundColor: C.botBubble, borderWidth: 1, borderColor: C.border },
  errorBubble:     { borderColor: `${C.danger}55`, backgroundColor: `${C.danger}10` },

  // Bubble shape — grouped bubbles use WhatsApp-style tight radii
  bubbleFirstBot:  { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 16 },
  bubbleLastBot:   { borderBottomLeftRadius: 4 },
  bubbleFirstUser: { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 16 },
  bubbleLastUser:  { borderBottomRightRadius: 4 },
  bubbleMid:       { borderRadius: 4 },

  msgText:         { fontSize: 14, lineHeight: 21 },
  msgTextBot:      { color: C.text },
  msgTextUser:     { color: C.white, fontWeight: "450" },

  // Timestamp
  timeRow:         { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, marginLeft: 2 },
  timeRowRight:    { justifyContent: "flex-end", marginRight: 2 },
  timeText:        { color: C.textMuted, fontSize: 11 },

  // Typing
  typingRow:       { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 4, paddingVertical: 6 },
  typingDot:       { width: 7, height: 7, borderRadius: 4 },

  // Scroll FAB
  scrollFab:       { position: "absolute", bottom: 140, alignSelf: "center" },
  scrollFabBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: C.cardMid, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6 },

  // Quick action chips
  chipsContainer:  { paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  chipsScroll:     { gap: 8, paddingRight: 4 },
  chip:            { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText:        { fontSize: 12, fontWeight: "600" },

  // Input bar
  inputBar:        { flexDirection: "row", alignItems: "flex-end", gap: 10, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
  inputWrapper:    { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border, borderRadius: 22, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 10 : 6, gap: 8 },
  inputWrapperFocused: { borderColor: C.borderStrong },
  input:           { flex: 1, color: C.text, paddingVertical: 0 },
  charCount:       { color: C.textMuted, fontSize: 11, fontWeight: "600" },
  charCountWarn:   { color: C.danger },
  clearBtn:        { padding: 2 },

  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", elevation: 4, shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6 },
  sendBtnOff:      { backgroundColor: C.cardMid, elevation: 0, shadowOpacity: 0 },
});
