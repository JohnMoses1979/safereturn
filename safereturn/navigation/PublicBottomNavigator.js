










// navigation/PublicBottomNavigator.js

import React from "react";
import AIOptionsScreen from "../Screens/public/AIOptionsScreen";
import { useSafeReturn } from "../Screens/context/SafeReturnContext";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather, Ionicons } from "@expo/vector-icons";

// ── Real Screens ──────────────────────────────────────────────────────────────
import PublicDashboardScreen from "../Screens/public/PublicDashboardScreen";
import ReportsScreen from "../Screens/public/ReportsScreen";
import ReportNowScreen from "../Screens/public/ReportNowScreen";
import MissingPersonDetailsScreen from "../Screens/public/MissingPersonDetailsScreen";
import PublicSavedScreen from "../Screens/public/PublicSavedScreen";
import HelplineScreen from "../Screens/public/HelplineScreen";
import SafetyTipsScreen from "../Screens/public/SafetyTipsScreen";
import AlertsScreen from "../Screens/public/AleartsScreen";
import PublicProfileScreen from "../Screens/public/PublicProfileScreen";

// ── Route Names ───────────────────────────────────────────────────────────────
// Use these same names in all screens while navigating.
export const ROUTE_NAMES = {
  PUBLIC_DASHBOARD: "PublicDashboard",

  REPORT_NOW: "ReportNowScreen",
  REPORTS: "Reports",

  MISSING_DETAILS: "MissingPersonDetails",

  PUBLIC_SAVED: "PublicSavedScreen",

  HELPLINE: "Helpline",
  SAFETY_TIPS: "SafetyTips",

  ALERTS_MAIN: "AlertsMain",
  PROFILE_MAIN: "ProfileMain",
};

// ── Common Screens ────────────────────────────────────────────────────────────
// These screens are added inside every tab stack.
// So Saved Cases, Reports, Report Now, Missing Details, Donate, Helpline etc.
// can open from any tab.

function addCommonScreens(StackNavigator) {
  return (
    <>
      <StackNavigator.Screen
        name={ROUTE_NAMES.REPORT_NOW}
        component={ReportNowScreen}
      />

      <StackNavigator.Screen
        name={ROUTE_NAMES.REPORTS}
        component={ReportsScreen}
      />

      <StackNavigator.Screen
        name={ROUTE_NAMES.MISSING_DETAILS}
        component={MissingPersonDetailsScreen}
      />

      <StackNavigator.Screen
        name={ROUTE_NAMES.PUBLIC_SAVED}
        component={PublicSavedScreen}
      />



      <StackNavigator.Screen
        name={ROUTE_NAMES.HELPLINE}
        component={HelplineScreen}
      />

      <StackNavigator.Screen
        name={ROUTE_NAMES.SAFETY_TIPS}
        component={SafetyTipsScreen}
      />
    </>
  );
}

// ── Dashboard Stack ───────────────────────────────────────────────────────────

const DashboardStack = createNativeStackNavigator();

function DashboardStackScreen() {
  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#061A40" },
      }}
    >
      <DashboardStack.Screen
        name={ROUTE_NAMES.PUBLIC_DASHBOARD}
        component={PublicDashboardScreen}
      />

      {addCommonScreens(DashboardStack)}
    </DashboardStack.Navigator>
  );
}

// ── Reports Stack ─────────────────────────────────────────────────────────────

const ReportsStack = createNativeStackNavigator();

function ReportsStackScreen() {
  return (
    <ReportsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#061A40" },
      }}
    >
      <ReportsStack.Screen name="ReportsMain" component={ReportsScreen} />

      {addCommonScreens(ReportsStack)}
    </ReportsStack.Navigator>
  );
}

// ── Alerts Stack ──────────────────────────────────────────────────────────────

const AlertsStack = createNativeStackNavigator();

function AlertsStackScreen() {
  return (
    <AlertsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#061A40" },
      }}
    >
      <AlertsStack.Screen
        name={ROUTE_NAMES.ALERTS_MAIN}
        component={AlertsScreen}
      />

      {addCommonScreens(AlertsStack)}
    </AlertsStack.Navigator>
  );
}

// ── Profile Stack ─────────────────────────────────────────────────────────────

const ProfileStack = createNativeStackNavigator();

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#061A40" },
      }}
    >
      <ProfileStack.Screen
        name={ROUTE_NAMES.PROFILE_MAIN}
        component={PublicProfileScreen}
      />

      {addCommonScreens(ProfileStack)}
    </ProfileStack.Navigator>
  );
}

// ── Dummy Screen For Center Report Tab ────────────────────────────────────────

function ReportDummyScreen() {
  return <View style={{ flex: 1, backgroundColor: "#061A40" }} />;
}

// ── Bottom Tabs ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

const TABS = [
  {
    name: "Dashboard",
    icon: "home",
    label: "Home",
  },
  {
    name: "Reports",
    icon: "file-text",
    label: "Reports",
  },
  {
    name: "PublicReport",
    icon: "plus",
    label: "AI",
    isCenter: true,
  },
  {
    name: "Alerts",
    icon: "bell",
    label: "Alerts",
  },
  {
    name: "Profile",
    icon: "user",
    label: "Profile",
  },
];

function CustomTabBar({ state, navigation }) {
  const { alertUnreadCount = 0 } = useSafeReturn();

  const handleTabPress = (route, focused) => {
    if (route.name === "PublicReport") {
      // Directly navigate to the AI Options screen (tab itself)
      navigation.navigate(route.name);
      return;
    }

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!focused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route) => {
        const tabConfig = TABS.find((item) => item.name === route.name);
        const focused = state.routes[state.index].key === route.key;

        if (tabConfig?.isCenter) {
          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.9}
              onPress={() => handleTabPress(route, focused)}
              style={styles.centerButtonWrap}
            >
              <View style={styles.centerButton}>
                <Ionicons name="shield-outline" size={34} color="#FFFFFF" />

                <View style={styles.plusBadge}>
                  <Feather name="plus" size={13} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.centerText}>AI</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.82}
            onPress={() => handleTabPress(route, focused)}
            style={styles.tabItem}
          >
            <View>
              <Feather
                name={tabConfig?.icon || "circle"}
                size={23}
                color={focused ? "#2F8CFF" : "#AFC4E8"}
              />

              {tabConfig?.name === "Alerts" && alertUnreadCount > 0 && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>
                    {alertUnreadCount > 9 ? "9+" : alertUnreadCount}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.tabText, focused && styles.tabTextActive]}>
              {tabConfig?.label || route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function PublicBottomNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Dashboard" component={DashboardStackScreen} />
      <Tab.Screen name="Reports" component={ReportsStackScreen} />
      <Tab.Screen name="PublicReport" component={AIOptionsScreen} />
      <Tab.Screen name="Alerts" component={AlertsStackScreen} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />

    </Tab.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: Platform.OS === "ios" ? 8 : 6,
    height: 78,
    borderRadius: 22,
    backgroundColor: "#08224F",
    borderWidth: 1,
    borderColor: "rgba(91,148,226,0.38)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 62,
  },

  tabText: {
    color: "#AFC4E8",
    fontSize: 12,
    marginTop: 5,
    fontWeight: "600",
  },

  tabTextActive: {
    color: "#2F8CFF",
    fontWeight: "900",
  },

  centerButtonWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 72,
    marginTop: -35,
  },

  centerButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#1460EE",
    borderWidth: 5,
    borderColor: "#08224F",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1460EE",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },

  centerText: {
    color: "#AFC4E8",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },

  plusBadge: {
    position: "absolute",
    right: 13,
    top: 16,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2F8CFF",
    alignItems: "center",
    justifyContent: "center",
  },

  navBadge: {
    position: "absolute",
    right: -8,
    top: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF3548",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#08224F",
  },

  navBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
});
