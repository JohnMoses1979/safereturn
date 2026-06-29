import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

export default function AIOptionsScreen() {
  const navigation = useNavigation();

  const goToChat = () => navigation.navigate("AIChat");
  const goToImage = () => navigation.navigate("AIImage");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Assistant</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={goToChat}>
          <Feather name="message-circle" size={24} color="#fff" />
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={goToImage}>
          <Feather name="image" size={24} color="#fff" />
          <Text style={styles.buttonText}>Image</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#061A40",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    color: "#fff",
    marginBottom: 30,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 20,
  },
  button: {
    backgroundColor: "#1460EE",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
