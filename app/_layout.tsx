import { Redirect, Slot } from "expo-router";
import React from "react";
import { EventProvider, useEvents } from "../contexts/EventContext";

function RootLayoutContent() {
  const { settings } = useEvents();

  if (!settings.hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <EventProvider>
      <RootLayoutContent />
    </EventProvider>
  );
}
