




































// Screens/common/AIFloatingButtons.js

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const isSmallPhone = width < 360;

/**
 * AIFloatingButtons
 *
 * Props:
 *  - navigation   — React Navigation object (used to navigate to AIImage screen)
 *  - onOpenChat   — callback to open the AIChatModal
 *  - bottomOffset — custom bottom position (optional)
 *  - showImage    — show/hide AI Image button (default: true)
 *  - showChat     — show/hide AI Chat button (default: true)
 *
 * Usage:
 *  <AIFloatingButtons navigation={navigation} onOpenChat={() => setShowChat(true)} />
 */
export default function AIFloatingButtons({
  navigation,
  onOpenChat,
  bottomOffset,
  showImage = true,
  showChat = true,
}) {
  const openAIImage = () => {
    navigation?.navigate?.("AIImage");
  };

  const openAIChat = () => {
    onOpenChat?.();
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { bottom: bottomOffset ?? (Platform.OS === "ios" ? 112 : 100) },
      ]}
    >
      {showImage && (
        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.button, styles.imageButton]}
          onPress={openAIImage}
        >
          <View style={styles.iconCircle}>
            <Feather name="cpu" size={isSmallPhone ? 17 : 19} color="#FFFFFF" />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.buttonTitle}>AI Image</Text>
            <Text style={styles.buttonSub}>Photo match</Text>
          </View>
        </TouchableOpacity>
      )}

      {showChat && (
        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.button, styles.chatButton]}
          onPress={openAIChat}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubble-ellipses-outline" size={isSmallPhone ? 18 : 20} color="#FFFFFF" />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.buttonTitle}>AI Chat</Text>
            <Text style={styles.buttonSub}>Ask help</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 12,
    alignItems: "flex-end",
    gap: 10,
    zIndex: 999,
    elevation: 999,
  },
  button: {
    minWidth: isSmallPhone ? 126 : 142,
    height: isSmallPhone ? 48 : 52,
    borderRadius: 100,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 9,
  },
  imageButton: { backgroundColor: "#8B3FF2" },
  chatButton: { backgroundColor: "#2477FF" },
  iconCircle: {
    width: isSmallPhone ? 34 : 38,
    height: isSmallPhone ? 34 : 38,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  textBox: { flex: 1, minWidth: 0 },
  buttonTitle: {
    color: "#FFFFFF",
    fontSize: isSmallPhone ? 12 : 13,
    fontWeight: "900",
    lineHeight: isSmallPhone ? 15 : 16,
  },
  buttonSub: {
    color: "rgba(255,255,255,0.78)",
    fontSize: isSmallPhone ? 9 : 10,
    fontWeight: "600",
    marginTop: 1,
  },
});