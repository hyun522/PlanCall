export type TransportMethod = "car" | "transit" | "walk";

export interface Event {
  id: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  departureLocation: string;
  transportMethod: TransportMethod;
  travelTimeMinutes: number;
  departureTime: string;
  arrivalTime: string;
}

export interface Settings {
  hasCompletedOnboarding: boolean;
  defaultDepartureLocation: string;
  arrivalBuffer: number;
  extraTime: number;
  departureNotification: boolean;
  arrivalNotification: boolean;
}

export interface EventContextType {
  events: Event[];
  settings: Settings;
  isLoaded: boolean;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, event: Event) => void;
  deleteEvent: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
}
