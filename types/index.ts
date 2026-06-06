export type TransportMethod = "car" | "transit";

export type LocationSearchTarget = "destination" | "departure";

export interface SelectedPlace {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface PendingLocationSelection {
  target: LocationSearchTarget;
  place: SelectedPlace;
}

export interface Event {
  id: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  departureLocation: string;
  locationPlace?: SelectedPlace;
  departurePlace?: SelectedPlace;
  transportMethod: TransportMethod;
  travelTimeMinutes: number;
  departureTime: string;
  arrivalTime: string;
}

export interface Settings {
  hasCompletedOnboarding: boolean;
  preparationTime: number;
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
  pendingLocationSelection: PendingLocationSelection | null;
  setPendingLocationSelection: (selection: PendingLocationSelection) => void;
  clearPendingLocationSelection: () => void;
}
