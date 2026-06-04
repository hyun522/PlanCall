import { Redirect, Slot, useSegments } from "expo-router";
import React from "react";
import { EventProvider, useEvents } from "../contexts/EventContext";

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
    <EventProvider>
      <RootLayoutContent />
    </EventProvider>
  );
}
