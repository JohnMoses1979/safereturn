












// App.js

import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { SafeReturnProvider, useSafeReturn } from "./Screens/context/SafeReturnContext";

import SplashScreen from "./Screens/auth/SplashScreen";
import OnboardingScreen from "./Screens/auth/OnboardingScreen";
import PublicRegisterScreen from "./Screens/auth/PublicRegisterScreen";
import LoginScreen from "./Screens/auth/LoginScreen";
import ForgotPasswordScreen from "./Screens/auth/ForgotPasswordScreen";

import PublicBottomNavigator from "./navigation/PublicBottomNavigator";

import MissingPersonDetailsScreen from "./Screens/public/MissingPersonDetailsScreen";

import ReportNowScreen from "./Screens/public/ReportNowScreen";
import ReportsScreen from "./Screens/public/ReportsScreen";
import AIImageScreen from "./Screens/public/AIImageScreen";
import HelplineScreen from "./Screens/public/HelplineScreen";
import SafetyTipsScreen from "./Screens/public/SafetyTipsScreen";
import PublicProfileScreen from "./Screens/public/PublicProfileScreen";
import AIChatScreen from "./Screens/public/AIChatScreen";


import PublicSavedScreen from "./Screens/public/PublicSavedScreen";
import ReportMissingStep1Screen from "./Screens/public/ReportMissingStep1Screen";
import RecentSightingsScreen from "./Screens/public/RecentSightingsScreen";

import OtpVerificationScreen from "./Screens/OtpVerificationScreen";

import PoliceBottomNavigator from "./navigation/PoliceBottomNavigator";

const Stack = createNativeStackNavigator();

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#061A40",
  },
};

const HIDE_AI_ON = [
  "Splash",
  "Onboarding",
  "PublicRegister",
  "LoginScreen",
  "OtpVerificationScreen",
  "ForgotPassword",
  "AIImage",
];

function AppNavigator() {
  const navigationRef = useNavigationContainerRef();
  const [currentRoute, setCurrentRoute] = useState("Splash");
  const { authToken, currentUser } = useSafeReturn();

  const initialRouteName =
    currentUser?.role === "POLICE" || currentUser?.role === "ADMIN"
      ? "PoliceHome"
      : authToken
        ? "PublicHome"
        : "Splash";

  const navigation = {
    navigate: (...args) => navigationRef?.current?.navigate?.(...args),
    canGoBack: () => navigationRef?.current?.canGoBack?.() ?? false,
    goBack: () => navigationRef?.current?.goBack?.(),
  };

  const updateCurrentRoute = () => {
    const route = navigationRef?.current?.getCurrentRoute?.();
    if (route?.name) {
      setCurrentRoute(route.name);
    }
  };

  const showAI = !HIDE_AI_ON.includes(currentRoute);

  useEffect(() => {
    if (!authToken || !currentUser) return;

    const isAuthScreen = [
      "Splash",
      "Onboarding",
      "LoginScreen",
      "PublicRegister",
      "ForgotPassword",
      "OtpVerificationScreen",
    ].includes(currentRoute);

    if (!isAuthScreen) return;

    const homeRoute =
      currentUser.role === "POLICE" || currentUser.role === "ADMIN"
        ? "PoliceHome"
        : "PublicHome";

    navigationRef.current?.reset?.({
      index: 0,
      routes: [{ name: homeRoute }],
    });
  }, [authToken, currentUser, currentRoute, navigationRef]);

  return (
    <View style={styles.root}>
      <NavigationContainer
        theme={AppTheme}
        ref={navigationRef}
        onReady={updateCurrentRoute}
        onStateChange={updateCurrentRoute}
      >
        <Stack.Navigator
          initialRouteName={initialRouteName}
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: { backgroundColor: "#061A40" },
          }}
        >
          {/* Auth Screens */}
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="PublicRegister" component={PublicRegisterScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

          <Stack.Screen
            name="OtpVerificationScreen"
            component={OtpVerificationScreen}
            options={{ headerShown: false }}
          />

          {/* Main App */}
          <Stack.Screen name="PublicHome" component={PublicBottomNavigator} />
          <Stack.Screen name="PoliceHome" component={PoliceBottomNavigator} />

          {/* Missing Person Screens */}
          <Stack.Screen
            name="MissingPersonDetails"
            component={MissingPersonDetailsScreen}
          />
          <Stack.Screen
            name="PersonDetails"
            component={MissingPersonDetailsScreen}
          />

          {/* Report Screens */}
          <Stack.Screen
            name="ReportMissingStep1"
            component={ReportMissingStep1Screen}
          />
          <Stack.Screen name="ReportNowScreen" component={ReportNowScreen} />
          <Stack.Screen name="ReportSighting" component={ReportNowScreen} />

          {/* Reports */}
          <Stack.Screen name="PublicReports" component={ReportsScreen} />
          <Stack.Screen name="ReportsScreen" component={ReportsScreen} />
          <Stack.Screen name="ReportsMain" component={ReportsScreen} />

          {/* Support / Info Screens */}
          <Stack.Screen name="HelplineScreen" component={HelplineScreen} />
          <Stack.Screen name="SafetyTips" component={SafetyTipsScreen} />
          <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
          <Stack.Screen name="PublicSavedScreen" component={PublicSavedScreen} />
          <Stack.Screen name="RecentSightings" component={RecentSightingsScreen} />

          {/* AI Image Screen */}
          <Stack.Screen name="AIChat" component={AIChatScreen} />
          <Stack.Screen name="AIImage" component={AIImageScreen} />
        </Stack.Navigator>

      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeReturnProvider>
      <AppNavigator />
    </SafeReturnProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#061A40",
  },
});
