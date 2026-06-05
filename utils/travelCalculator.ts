import { TransportMethod } from "../types";

const MINUTES_PER_DAY = 24 * 60;

const formatMinutesAsTime = (totalMinutes: number) => {
  const normalizedMinutes =
    ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export function calculateTravelTime(
  departureLocation: string,
  destination: string,
  transportMethod: TransportMethod,
): number {
  // Mock calculation based on transport method
  // In a real app, this would use Google Maps API or similar

  const baseTime = Math.floor(Math.random() * 30) + 10; // 10-40 minutes base

  const multipliers = {
    car: 1.0,
    transit: 1.5,
  };

  return Math.round(baseTime * multipliers[transportMethod]);
}

export function calculateDepartureTime(
  eventTime: string,
  travelTimeMinutes: number,
  extraMinutes: number,
): string {
  const [hours, minutes] = eventTime.split(":").map(Number);
  const eventMinutes = hours * 60 + minutes;
  const departureMinutes = eventMinutes - travelTimeMinutes - extraMinutes;

  return formatMinutesAsTime(departureMinutes);
}

export function calculatePreparationStartTime(
  departureTime: string,
  preparationMinutes: number,
): string {
  const [hours, minutes] = departureTime.split(":").map(Number);
  const departureMinutes = hours * 60 + minutes;

  return formatMinutesAsTime(departureMinutes - preparationMinutes);
}

export function calculateArrivalTime(
  departureTime: string,
  travelTimeMinutes: number,
): string {
  const [hours, minutes] = departureTime.split(":").map(Number);
  const departureMinutes = hours * 60 + minutes;
  const arrivalMinutes = departureMinutes + travelTimeMinutes;

  return formatMinutesAsTime(arrivalMinutes);
}
