export function calculateTravelTime(
  departureLocation: string,
  destination: string,
  transportMethod: 'car' | 'transit' | 'walk'
): number {
  // Mock calculation based on transport method
  // In a real app, this would use Google Maps API or similar

  const baseTime = Math.floor(Math.random() * 30) + 10; // 10-40 minutes base

  const multipliers = {
    car: 1.0,
    transit: 1.5,
    walk: 3.0,
  };

  return Math.round(baseTime * multipliers[transportMethod]);
}

export function calculateDepartureTime(
  eventTime: string,
  travelTimeMinutes: number,
  bufferMinutes: number,
  extraMinutes: number
): string {
  const [hours, minutes] = eventTime.split(':').map(Number);
  const eventMinutes = hours * 60 + minutes;
  const departureMinutes = eventMinutes - travelTimeMinutes - bufferMinutes - extraMinutes;

  const departureHours = Math.floor(departureMinutes / 60);
  const departureMins = departureMinutes % 60;

  return `${String(departureHours).padStart(2, '0')}:${String(departureMins).padStart(2, '0')}`;
}

export function calculateArrivalTime(
  departureTime: string,
  travelTimeMinutes: number
): string {
  const [hours, minutes] = departureTime.split(':').map(Number);
  const departureMinutes = hours * 60 + minutes;
  const arrivalMinutes = departureMinutes + travelTimeMinutes;

  const arrivalHours = Math.floor(arrivalMinutes / 60) % 24;
  const arrivalMins = arrivalMinutes % 60;

  return `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMins).padStart(2, '0')}`;
}
