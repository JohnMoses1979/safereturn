import React from "react";
import { View, StyleSheet } from "react-native";
import AIChatModal from "../common/AIChatModal";
import { useSafeReturn } from "../context/SafeReturnContext";
import { useNavigation } from "@react-navigation/native";

export default function AIChatScreen() {
  const navigation = useNavigation();
  const { authToken } = useSafeReturn();

  const handleClose = () => navigation.goBack();

  return (
    <View style={styles.container}>
      <AIChatModal visible={true} onClose={handleClose} authToken={authToken} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#061A40",
  },
});
