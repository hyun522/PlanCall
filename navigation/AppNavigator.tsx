import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useEvents } from "../contexts/EventContext";

// Screens
import AddEventScreen from "../screens/AddEventScreen";
import EditEventScreen from "../screens/EditEventScreen";
import EventListScreen from "../screens/EventListScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import SettingsScreen from "../screens/SettingsScreen";

export type RootStackParamList = {
  Onboarding: undefined;
  EventList: undefined;
  AddEvent: undefined;
  EditEvent: { eventId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { settings } = useEvents();

  return (
    // <NavigationContainer>
    <Stack.Navigator
      initialRouteName={
        settings.hasCompletedOnboarding ? "EventList" : "Onboarding"
      }
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="EventList" component={EventListScreen} />
      <Stack.Screen name="AddEvent" component={AddEventScreen} />
      <Stack.Screen name="EditEvent" component={EditEventScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
    // </NavigationContainer>
  );
}
