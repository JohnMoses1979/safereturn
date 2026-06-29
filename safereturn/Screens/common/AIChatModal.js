














// Screens/common/AIChatModal.js
//
// CHANGES FROM ORIGINAL:
//  - Groq API key and direct Groq calls REMOVED from frontend entirely.
//  - AI chat messages now routed through POST /api/ai/chat (authenticated backend).
//  - Voice transcription still uses Groq directly (audio → text only, no data access).
//  - buildGroqMessages() replaced by buildBackendPayload().
//  - getFallbackAnswer() kept only as a last-resort network-error fallback.
//  - API_BASE_URL imported from SafeReturnContext so it stays in sync.

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Alert,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { Feather, Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../context/SafeReturnContext";

const { width } = Dimensions.get("window");
const isSmallPhone = width < 360;

const CHAT_HISTORY_KEY = "@safereturn_ai_chat_history";

// ─── Voice transcription (Groq Whisper) ───────────────────────────────────────
// This key is ONLY used for audio-to-text conversion — it never touches DB data.
// For production, proxy this through the backend too (/api/ai/transcribe).
const GROQ_API_KEY = process.env.GROQ_API_KEY; // replace with a fresh key
const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_TRANSCRIPTION_MODEL = "whisper-large-v3-turbo";
// ──────────────────────────────────────────────────────────────────────────────

// ─── Backend AI endpoint ───────────────────────────────────────────────────────
// All chat requests go here — the backend holds the Groq chat key securely.
const AI_CHAT_ENDPOINT = `${API_BASE_URL}/api/ai/chat`;
// ──────────────────────────────────────────────────────────────────────────────

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
};

const quickActions = [
  "Show my reports",
  "Show unresolved cases",
  "How many sightings today?",
  "Show my alerts",
  "Show my saved persons",
  "Show reward cases",
  "How many reports resolved?",
  "Show helpline numbers",
  "Safety tips",
];

function cleanAIText(text = "") {
  return String(text)
    .replace(/```html/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```js/gi, "")
    .replace(/```/g, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getFallbackAnswer(question = "") {
  const q = question.toLowerCase();
  if (q.includes("helpline") || q.includes("emergency")) {
    return "For emergency help, call 112 immediately. Open the Helpline screen to see Police 112, Ambulance 108, Fire 101, Women Helpline 1091, and Child Helpline 1098.";
  }
  if (q.includes("safety")) {
    return "Open Safety Tips to see personal and digital safety tips. Stay aware, avoid isolated areas, share your live location with trusted people, and call emergency services if needed.";
  }
  return "I'm unable to reach the server right now. Please check your connection and try again.";
}

// ─── Recording Options ────────────────────────────────────────────────────────
const RECORDING_OPTIONS = {
  android: {
    extension: ".m4a",
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: ".m4a",
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
};

function getAudioFileInfo(audioUri) {
  const uriLower = String(audioUri || "").toLowerCase();
  if (Platform.OS === "web") return { fileName: `voice-${Date.now()}.webm`, mimeType: "audio/webm" };
  if (uriLower.endsWith(".wav")) return { fileName: `voice-${Date.now()}.wav`, mimeType: "audio/wav" };
  if (uriLower.endsWith(".mp4")) return { fileName: `voice-${Date.now()}.mp4`, mimeType: "audio/mp4" };
  if (uriLower.endsWith(".aac")) return { fileName: `voice-${Date.now()}.aac`, mimeType: "audio/aac" };
  if (uriLower.endsWith(".webm")) return { fileName: `voice-${Date.now()}.webm`, mimeType: "audio/webm" };
  if (uriLower.endsWith(".mp3")) return { fileName: `voice-${Date.now()}.mp3`, mimeType: "audio/mpeg" };
  return { fileName: `voice-${Date.now()}.m4a`, mimeType: "audio/m4a" };
}

export default function AIChatModal({ visible, onClose, authToken }) {
  const scrollRef = useRef(null);
  const recordingRef = useRef(null);
  const messagesRef = useRef([]);

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I am SafeReturn AI Assistant. I can answer questions using your live app data — try asking about your reports, sightings, saved persons, alerts, or rewards. You can also type or speak.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    if (visible) {
      loadHistory();
    } else {
      stopSpeaking();
      forceStopRecording();
      setPendingImage(null);
    }
    return () => { stopSpeaking(); forceStopRecording(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 120);
  }, [messages, loading, transcribing, isRecording]);

  // ── History persistence ───────────────────────────────────────────────────

  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch (e) { console.log("AI history load error:", e); }
  };

  const saveHistory = async (nextMessages) => {
    try {
      await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(nextMessages));
    } catch (e) { console.log("AI history save error:", e); }
  };

  const clearHistory = async () => {
    await stopSpeaking();
    await forceStopRecording();
    setPendingImage(null);
    const fresh = [{
      id: "welcome",
      role: "assistant",
      text: "Chat cleared. Ask me about SafeReturn reports, helplines, safety tips, alerts, or use voice input.",
    }];
    setMessages(fresh);
    await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(fresh));
  };

  // ── Speaker ───────────────────────────────────────────────────────────────

  // force=true is used by the manual Speak button — bypasses the speakerEnabled toggle.
  const speakText = async (text, messageId, force = false) => {
    if (!force && !speakerEnabled) return;
    if (!text) return;
    try {
      await Speech.stop();
      setSpeakingMessageId(messageId);
      Speech.speak(cleanAIText(text), {
        language: "en", pitch: 1, rate: 0.92,
        onDone: () => setSpeakingMessageId(null),
        onStopped: () => setSpeakingMessageId(null),
        onError: () => setSpeakingMessageId(null),
      });
    } catch { setSpeakingMessageId(null); }
  };

  const stopSpeaking = async () => {
    try { await Speech.stop(); } catch { /* ignore */ }
    setSpeakingMessageId(null);
  };

  const toggleSpeaker = async () => {
    if (speakerEnabled) { await stopSpeaking(); setSpeakerEnabled(false); }
    else setSpeakerEnabled(true);
  };

  // ── Audio recording ───────────────────────────────────────────────────────

  const resetAudioSession = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false, playsInSilentModeIOS: true,
        shouldDuckAndroid: false, playThroughEarpieceAndroid: false,
      });
    } catch { /* ignore */ }
  };

  const forceStopRecording = async () => {
    const recording = recordingRef.current;
    recordingRef.current = null;
    setIsRecording(false);
    if (!recording) return;
    try {
      const status = await recording.getStatusAsync();
      if (status?.isRecording || status?.canRecord) await recording.stopAndUnloadAsync();
    } catch { /* ignore */ }
    await resetAudioSession();
  };

  const requestMicPermission = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Microphone Permission Required",
          "Please allow microphone access in device settings to use voice input.");
        return false;
      }
      return true;
    } catch {
      Alert.alert("Permission Error", "Unable to request microphone permission.");
      return false;
    }
  };

  const startVoiceRecording = async () => {
    if (loading || transcribing || isRecording) return;
    await stopSpeaking();
    if (!(await requestMicPermission())) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true, playsInSilentModeIOS: true,
        staysActiveInBackground: false, shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {
      recordingRef.current = null;
      setIsRecording(false);
      await resetAudioSession();
      Alert.alert("Recording Error", "Unable to start voice recording. Please check microphone permission.");
    }
  };

  const stopVoiceRecordingAndTranscribe = async () => {
    const recording = recordingRef.current;
    if (!recording) { setIsRecording(false); return; }
    recordingRef.current = null;
    setIsRecording(false);
    let audioUri = null;
    try {
      await recording.stopAndUnloadAsync();
      audioUri = recording.getURI();
    } catch {
      Alert.alert("Recording Error", "Unable to stop recording. Please try again.");
    } finally {
      await resetAudioSession();
    }
    if (!audioUri) {
      Alert.alert("Recording Error", "No audio captured. Please speak clearly and try again.");
      return;
    }
    await transcribeAudioAndSend(audioUri);
  };

  const toggleVoiceRecording = async () => {
    if (loading || transcribing) return;
    if (isRecording) await stopVoiceRecordingAndTranscribe();
    else await startVoiceRecording();
  };

  // ── Groq Whisper transcription (audio-to-text only) ────────────────────────

  const transcribeAudioAndSend = async (audioUri) => {
    setTranscribing(true);
    try {
      const { fileName, mimeType } = getAudioFileInfo(audioUri);
      const formData = new FormData();
      if (Platform.OS === "web") {
        const audioResponse = await fetch(audioUri);
        if (!audioResponse.ok) throw new Error("Unable to read recorded audio blob.");
        const audioBlob = await audioResponse.blob();
        if (!audioBlob || audioBlob.size <= 0) throw new Error("Recorded audio file is empty.");
        formData.append("file", audioBlob, fileName);
      } else {
        formData.append("file", { uri: audioUri, name: fileName, type: mimeType });
      }
      formData.append("model", GROQ_TRANSCRIPTION_MODEL);
      formData.append("language", "en");
      formData.append("response_format", "json");

      const response = await fetch(GROQ_TRANSCRIPTION_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_TRANSCRIPTION_KEY}` },
        body: formData,
      });

      const rawText = await response.text();
      let data = null;
      try { data = JSON.parse(rawText); } catch {
        throw new Error("Voice transcription returned invalid response.");
      }
      if (!response.ok) throw new Error(data?.error?.message || "Unable to convert voice to text.");

      const transcript = cleanAIText(data?.text || "");
      if (!transcript.trim()) {
        Alert.alert("No Voice Detected", "I could not hear clear speech. Please speak closer to the mic.");
        return;
      }

      setInput(transcript);
      await sendMessageWithText(transcript, null);
    } catch (error) {
      Alert.alert("Voice Input Error", error?.message || "Voice transcription failed. Please try again.");
    } finally {
      setTranscribing(false);
    }
  };

  // ── Image picker ──────────────────────────────────────────────────────────

  const pickIdentifyImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Please allow photo access to identify a person.");
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
      });
      if (picked.canceled || !picked.assets?.length) return;
      const asset = picked.assets[0];
      setPendingImage({ uri: asset.uri, base64: asset.base64 || null, mimeType: asset.mimeType || "image/jpeg" });
    } catch {
      Alert.alert("Error", "Unable to pick image. Please try again.");
    }
  };

  const cancelPendingImage = () => setPendingImage(null);

  // ── Build payload for backend /api/ai/chat ─────────────────────────────────

  /**
   * Converts the local messages array into the history format the backend
   * expects: [{role, content}] — max 8 recent turns (16 messages) to stay
   * within token budget.
   */
  const buildBackendPayload = (chatList, userText, hasImage, imageBase64) => {
    const history = chatList
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-8)
      .map((m) => ({ role: m.role, content: cleanAIText(m.text || "") }));

    const message = hasImage
      ? `${userText}\n\n[User has attached a photo for person identification.]`
      : userText;

    // Include base64 image data if present; backend can handle or ignore safely.
    const payload = { message, history };
if (hasImage && imageBase64) {
  payload.image = imageBase64;
}
// Force backend to fetch latest DB data
payload.realTime = true;
return payload;
  };

  // ── Send message ──────────────────────────────────────────────────────────

  const sendMessageWithText = useCallback(
    async (userText, imageOverride) => {
      const trimmed = cleanAIText(userText || "");
      if (!trimmed) return;

      const currentMessages = messagesRef.current;
      const imageToUse = imageOverride === undefined ? pendingImage : imageOverride;
      const hasImage = !!imageToUse;

      const userMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmed,
        imageUri: hasImage ? imageToUse.uri : null,
      };

      const nextWithUser = [...currentMessages, userMessage];
      setMessages(nextWithUser);
      setInput("");
      setPendingImage(null);
      setLoading(true);

      try {
        const imageBase64 = hasImage && imageToUse.base64 ? imageToUse.base64 : null;
        const payload = buildBackendPayload(currentMessages, trimmed, hasImage, imageBase64);

        const response = await fetch(`${AI_CHAT_ENDPOINT}?t=${Date.now()}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
  body: JSON.stringify(payload),
});

        if (!response.ok) {
          let errMsg = "AI service error. Please try again.";
          try {
            const errData = await response.json();
            if (errData?.message) errMsg = errData.message;
          } catch { /* ignore */ }
          throw new Error(errMsg);
        }

        const data = await response.json();
        const aiText = cleanAIText(data?.reply || "Sorry, I could not generate a response.");

        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: aiText,
        };

        const finalMessages = [...nextWithUser, assistantMessage];
        setMessages(finalMessages);
        await saveHistory(finalMessages);


      } catch (error) {
        console.log("AI response error:", error);
        const fallback = cleanAIText(getFallbackAnswer(trimmed));

        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: `${fallback}\n\nError: ${error?.message || "Unknown error"}`,
        };

        const finalMessages = [...nextWithUser, assistantMessage];
        setMessages(finalMessages);
        await saveHistory(finalMessages);
        await speakText(assistantMessage.text, assistantMessage.id);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingImage, speakerEnabled, authToken],
  );

  const sendMessage = () => sendMessageWithText(input, undefined);

  const handleQuickAction = (item) => {
    sendMessageWithText(item, null);
  };

  const handleClose = async () => {
    await stopSpeaking();
    await forceStopRecording();
    setPendingImage(null);
    onClose?.();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.botIcon}>
                  <Ionicons name="sparkles-outline" size={isSmallPhone ? 20 : 22} color={COLORS.white} />
                </View>
                <View style={styles.headerTextBox}>
                  <Text style={styles.title}>SafeReturn AI</Text>
                  <Text style={styles.subtitle}>Live Data · Voice · Image Help</Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity activeOpacity={0.8} onPress={toggleSpeaker} style={styles.headerButton}>
                  <Feather name={speakerEnabled ? "volume-2" : "volume-x"} size={18}
                    color={speakerEnabled ? COLORS.green : COLORS.muted} />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={stopSpeaking} style={styles.headerButton}>
                  <Feather name="square" size={16} color={COLORS.orange} />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={clearHistory} style={styles.headerButton}>
                  <Feather name="trash-2" size={17} color={COLORS.red} />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={handleClose} style={styles.closeButton}>
                  <Feather name="x" size={21} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick actions */}
            <View style={styles.quickRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickContent}>
                {quickActions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.85}
                    style={styles.quickChip}
                    onPress={() => handleQuickAction(item)}
                    disabled={loading || transcribing || isRecording}
                  >
                    <Text style={styles.quickChipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Chat messages */}
            <ScrollView ref={scrollRef} style={styles.chatScroll}
              contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>

              {messages.map((item) => {
                const isUser = item.role === "user";
                return (
                  <View key={item.id}
                    style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                    {isUser && item.imageUri && (
                      <Image source={{ uri: item.imageUri }} style={styles.attachedThumb} />
                    )}
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
                      {item.text}
                    </Text>
                    {!isUser && (
                      <TouchableOpacity activeOpacity={0.8} style={styles.speakButton}
                        onPress={() => speakText(item.text, item.id, true)}>
                        <Feather name={speakingMessageId === item.id ? "volume-2" : "play-circle"}
                          size={15} color={COLORS.cyan} />
                        <Text style={styles.speakText}>
                          {speakingMessageId === item.id ? "Speaking" : "Speak"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              {loading && (
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={COLORS.cyan} />
                    <Text style={styles.loadingText}>Checking live data...</Text>
                  </View>
                </View>
              )}

              {transcribing && (
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={COLORS.orange} />
                    <Text style={styles.loadingText}>Converting voice to text...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Pending image preview */}
            {pendingImage && (
              <View style={styles.pendingImageRow}>
                <Image source={{ uri: pendingImage.uri }} style={styles.pendingThumb} />
                <View style={styles.pendingTextBox}>
                  <Text style={styles.pendingTitle}>📷 Photo attached</Text>
                  <Text style={styles.pendingSubtitle}>Type or speak your question, then send</Text>
                </View>
                <TouchableOpacity activeOpacity={0.8} onPress={cancelPendingImage} style={styles.pendingRemove}>
                  <Feather name="x" size={16} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            )}

            {/* Recording indicator */}
            {isRecording && (
              <View style={styles.recordingBar}>
                <View style={styles.recordDot} />
                <Text style={styles.recordingText}>Listening... tap square to convert voice to text</Text>
              </View>
            )}

            {/* Input bar */}
            <View style={styles.inputWrap}>
              <TouchableOpacity activeOpacity={0.85} onPress={pickIdentifyImage}
                style={styles.cameraButton} disabled={loading || transcribing || isRecording}>
                <Feather name="camera" size={20} color={pendingImage ? COLORS.purple : COLORS.muted} />
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.85} onPress={toggleVoiceRecording}
                style={[styles.micButton, isRecording && styles.micButtonActive,
                (loading || transcribing) && styles.disabledButton]}
                disabled={loading || transcribing}>
                <Feather name={isRecording ? "square" : "mic"} size={20}
                  color={isRecording ? COLORS.white : COLORS.cyan} />
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder={isRecording ? "Listening..." : pendingImage
                  ? "Ask about this person..." : "Ask about your reports, sightings..."}
                placeholderTextColor={COLORS.muted}
                multiline
                maxLength={500}
                editable={!loading && !transcribing && !isRecording}
              />

              <TouchableOpacity activeOpacity={0.85}
                style={[styles.sendButton,
                (!input.trim() || loading || transcribing || isRecording) && styles.sendButtonDisabled]}
                disabled={!input.trim() || loading || transcribing || isRecording}
                onPress={sendMessage}>
                <Feather name="send" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// Styles are identical to the original — no visual changes needed.
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.bg },
  keyboardView: { flex: 1, width: "100%" },
  modalCard: { flex: 1, width: "100%", backgroundColor: COLORS.bg, overflow: "hidden" },
  header: {
    minHeight: Platform.OS === "android" ? 86 : 78,
    paddingTop: Platform.OS === "android" ? 28 : 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(42,122,255,0.25)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 },
  headerTextBox: { flex: 1, minWidth: 0 },
  botIcon: {
    width: 42, height: 42, borderRadius: 100, backgroundColor: COLORS.blue,
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  title: { color: COLORS.white, fontSize: isSmallPhone ? 17 : 19, fontWeight: "900" },
  subtitle: { color: COLORS.muted, fontSize: isSmallPhone ? 10 : 11, marginTop: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerButton: {
    width: 34, height: 34, borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center", justifyContent: "center",
  },
  closeButton: {
    width: 36, height: 36, borderRadius: 100,
    backgroundColor: COLORS.red, alignItems: "center", justifyContent: "center",
  },
  quickRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(42,122,255,0.18)" },
  quickContent: { paddingHorizontal: 12, gap: 8 },
  quickChip: {
    borderRadius: 100, backgroundColor: COLORS.card2, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: "row", alignItems: "center",
  },
  quickChipText: { color: COLORS.softWhite, fontSize: isSmallPhone ? 11 : 12, fontWeight: "800" },
  chatScroll: { flex: 1 },
  chatContent: { padding: 12, paddingBottom: 16 },
  messageBubble: { maxWidth: "88%", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  userBubble: { alignSelf: "flex-end", backgroundColor: COLORS.blue, borderBottomRightRadius: 4 },
  assistantBubble: {
    alignSelf: "flex-start", backgroundColor: COLORS.card2,
    borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: isSmallPhone ? 12 : 13, lineHeight: isSmallPhone ? 18 : 20 },
  userText: { color: COLORS.white, fontWeight: "700" },
  assistantText: { color: COLORS.softWhite, fontWeight: "500" },
  attachedThumb: { width: "100%", height: 120, borderRadius: 10, marginBottom: 8, resizeMode: "cover" },
  speakButton: { marginTop: 8, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5 },
  speakText: { color: COLORS.cyan, fontSize: 11, fontWeight: "800" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  loadingText: { color: COLORS.softWhite, fontSize: 12, fontWeight: "700" },
  pendingImageRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12,
    paddingVertical: 8, backgroundColor: "rgba(139,63,242,0.14)",
    borderTopWidth: 1, borderTopColor: "rgba(139,63,242,0.35)", gap: 10,
  },
  pendingThumb: { width: 44, height: 44, borderRadius: 8, resizeMode: "cover" },
  pendingTextBox: { flex: 1 },
  pendingTitle: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  pendingSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  pendingRemove: { padding: 6 },
  recordingBar: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: "rgba(255,48,72,0.16)", borderTopWidth: 1,
    borderTopColor: "rgba(255,48,72,0.35)", gap: 8,
  },
  recordDot: { width: 9, height: 9, borderRadius: 100, backgroundColor: COLORS.red },
  recordingText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  inputWrap: {
    paddingHorizontal: 12, paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 18 : 10,
    backgroundColor: COLORS.card,
    borderTopWidth: 1, borderTopColor: "rgba(42,122,255,0.25)",
    flexDirection: "row", alignItems: "flex-end", gap: 8,
  },
  cameraButton: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.card2,
    borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center",
  },
  micButton: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.card2,
    borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center",
  },
  micButtonActive: { backgroundColor: COLORS.red, borderColor: "rgba(255,48,72,0.8)" },
  disabledButton: { opacity: 0.45 },
  input: {
    flex: 1, maxHeight: 96, minHeight: 44, borderRadius: 14,
    backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 10, color: COLORS.white,
    fontSize: 13, lineHeight: 18,
  },
  sendButton: { width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.blue, alignItems: "center", justifyContent: "center" },
  sendButtonDisabled: { opacity: 0.45 },
});