import * as Notifications from "expo-notifications";
import { Redirect, Slot, useSegments } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { EventProvider, useEvents } from "../contexts/EventContext";

Notifications.setNotificationHandler({
  //"알림이 왔을 때 어떻게 보여줄까?"
  handleNotification: async () => ({
    shouldPlaySound: false, //소리 재생
    shouldSetBadge: false,
    shouldShowBanner: true, //배너 표시
    shouldShowList: true,
  }),
});

function RootLayoutContent() {
  const { settings, isLoaded } = useEvents();
  const segments = useSegments();

  if (!isLoaded) {
    return null;
  }

  const isOnboardingRoute = segments[0] === "onboarding";

  if (!settings.hasCompletedOnboarding && !isOnboardingRoute) {
    return <Redirect href="/onboarding" />;
  }

  return <Slot />; //현재경로 화면 보여줌
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <EventProvider>
        <RootLayoutContent />
      </EventProvider>
    </GestureHandlerRootView>
  );
}
