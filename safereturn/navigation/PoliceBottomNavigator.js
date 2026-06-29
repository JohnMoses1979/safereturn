import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import PoliceDashboardScreen from "../Screens/police/PoliceDashboardScreen";
import PoliceReportsScreen from "../Screens/police/PoliceReportsScreen";
import PoliceSightingReportsScreen from "../Screens/police/PoliceSightingReportsScreen";
import AIImageCheckScreen from "../Screens/police/AIImageCheckScreen";
import AIChatAssistantScreen from "../Screens/police/AIChatAssistantScreen";
import AnalyticsScreen from "../Screens/police/AnalyticsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const COLORS = {
  card: "#08224F",
  border: "rgba(91,148,226,0.38)",
  muted: "#AFC4E8",
  blue: "#2F8CFF",
};

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PoliceDashboardMain" component={PoliceDashboardScreen} />
    </Stack.Navigator>
  );
}

function ReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PoliceReportsMain" component={PoliceReportsScreen} />
    </Stack.Navigator>
  );
}

function SightingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="PoliceSightingsMain"
        component={PoliceSightingReportsScreen}
      />
    </Stack.Navigator>
  );
}

function AIToolsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PoliceAIToolsMain" component={AIImageCheckScreen} />
      <Stack.Screen name="PoliceAIChatMain" component={AIChatAssistantScreen} />
    </Stack.Navigator>
  );
}

function AnalyticsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PoliceAnalyticsMain" component={AnalyticsScreen} />
    </Stack.Navigator>
  );
}

export default function PoliceBottomNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "grid-outline";
          if (route.name === "PoliceDashboard") iconName = focused ? "grid" : "grid-outline";
          else if (route.name === "PoliceReports") iconName = focused ? "document-text" : "document-text-outline";
          else if (route.name === "PoliceSightings") iconName = focused ? "eye" : "eye-outline";
          else if (route.name === "PoliceAITools") iconName = focused ? "scan" : "scan-outline";
          else if (route.name === "PoliceAnalytics") iconName = focused ? "bar-chart" : "bar-chart-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.blue,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 78,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="PoliceDashboard" component={DashboardStack} />
      <Tab.Screen name="PoliceReports" component={ReportsStack} />
      <Tab.Screen name="PoliceSightings" component={SightingsStack} />
      <Tab.Screen name="PoliceAITools" component={AIToolsStack} />
      <Tab.Screen name="PoliceAnalytics" component={AnalyticsStack} />
    </Tab.Navigator>
  );
}
