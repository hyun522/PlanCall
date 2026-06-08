import { TransportMethod } from "../types";

const MINUTES_PER_DAY = 24 * 60;
const KAKAO_DIRECTIONS_URL =
  "https://apis-navi.kakaomobility.com/v1/directions";

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type TravelRouteResult = {
  distanceMeters: number;
  durationSeconds: number;
  durationMinutes: number;
};

type KakaoDirectionsResponse = {
  routes?: {
    result_code: number;
    result_msg: string;
    summary?: {
      distance: number;
      duration: number;
    };
  }[];
};

const formatMinutesAsTime = (totalMinutes: number) => {
  const normalizedMinutes =
    ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const formatRouteCoordinate = ({ latitude, longitude }: RouteCoordinate) =>
  `${longitude},${latitude}`;

export async function calculateTravelTime(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  transportMethod: TransportMethod,
): Promise<TravelRouteResult> {
  if (transportMethod !== "car") {
    throw new Error("지원하지 않는 이동수단입니다.");
  }

  const kakaoRestApiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

  if (!kakaoRestApiKey) {
    throw new Error("EXPO_PUBLIC_KAKAO_REST_API_KEY가 설정되지 않았습니다.");
  }

  const params = new URLSearchParams({
    origin: formatRouteCoordinate(origin),
    destination: formatRouteCoordinate(destination),
    priority: "RECOMMEND",
    summary: "true",
  });

  const response = await fetch(`${KAKAO_DIRECTIONS_URL}?${params.toString()}`, {
    headers: {
      Authorization: `KakaoAK ${kakaoRestApiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("카카오 자동차 길찾기 요청에 실패했습니다.");
  }

  const data = (await response.json()) as KakaoDirectionsResponse;

  const route = data.routes?.[0];

  if (!route || route.result_code !== 0 || !route.summary) {
    throw new Error(route?.result_msg || "자동차 길찾기 결과가 없습니다.");
  }

  return {
    distanceMeters: route.summary.distance,
    durationSeconds: route.summary.duration,
    durationMinutes: Math.ceil(route.summary.duration / 60),
  };
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
