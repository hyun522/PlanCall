import { TransportMethod } from "../types";

const MINUTES_PER_DAY = 24 * 60;
const KAKAO_DIRECTIONS_URL =
  "https://apis-navi.kakaomobility.com/v1/directions";
const ODSAY_TRANSIT_PATH_URL =
  "https://api.odsay.com/v1/api/searchPubTransPathT";

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type TravelRouteResult = {
  distanceMeters: number;
  durationSeconds: number;
  durationMinutes: number;
};

export type TransitRouteResult = {
  id: string;
  durationMinutes: number;
  summary: string;
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

type ODsayLane = {
  name?: string;
  busNo?: string;
};

type ODsaySubPath = {
  trafficType: number;
  lane?: ODsayLane | ODsayLane[];
};

type ODsayPath = {
  pathType: number;
  info: {
    totalTime: number;
  };
  subPath?: ODsaySubPath[];
};

type ODsayTransitPathResponse = {
  result?: {
    path?: ODsayPath[];
  };
  error?: {
    code?: string;
    msg?: string;
    message?: string;
  };
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

const getLaneList = (lane?: ODsayLane | ODsayLane[]) => {
  if (!lane) {
    return [];
  }

  return Array.isArray(lane) ? lane : [lane];
};

const createTransitSectionSummary = (section: ODsaySubPath) => {
  const lanes = getLaneList(section.lane);
  console.log("lanes", lanes);

  if (section.trafficType === 1) {
    console.log(
      "1",
      lanes
        .map((lane) => lane.name)
        .filter(Boolean)
        .join("/"),
    );
    return lanes
      .map((lane) => lane.name)
      .filter(Boolean)
      .join("/");
  }

  if (section.trafficType === 2) {
    console.log(
      "2",
      lanes
        .map((lane) => (lane.busNo ? `버스 ${lane.busNo}` : undefined))
        .filter(Boolean)
        .join("/"),
    );
    return lanes
      .map((lane) => (lane.busNo ? `버스 ${lane.busNo}` : undefined))
      .filter(Boolean)
      .join("/");
  }
};

const createTransitRouteSummary = (route: ODsayPath) => {
  const summary = route.subPath
    ?.map(createTransitSectionSummary)
    .filter(Boolean)
    .join(" -> ");

  if (summary) {
    return summary;
  }

  switch (route.pathType) {
    case 1:
      return "지하철";
    case 2:
      return "버스";
    case 3:
      return "버스 -> 지하철";
    default:
      return "대중교통";
  }
};

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

export async function fetchTransitRoutes(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
): Promise<TransitRouteResult[]> {
  const odsayApiKey = process.env.EXPO_PUBLIC_ODSAY_API_KEY;

  if (!odsayApiKey) {
    throw new Error("EXPO_PUBLIC_ODSAY_API_KEY가 설정되지 않았습니다.");
  }

  const params = new URLSearchParams({
    SX: String(origin.longitude),
    SY: String(origin.latitude),
    EX: String(destination.longitude),
    EY: String(destination.latitude),
    SearchType: "0",
    apiKey: odsayApiKey,
  });

  const response = await fetch(
    `${ODSAY_TRANSIT_PATH_URL}?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error("ODsay 대중교통 길찾기 요청에 실패했습니다.");
  }

  const data = (await response.json()) as ODsayTransitPathResponse;

  console.log("ODsay transit route raw response", data);

  if (data.error) {
    throw new Error(
      data.error.msg ||
        data.error.message ||
        "ODsay 대중교통 길찾기 결과가 없습니다.",
    );
  }

  const routes =
    data.result?.path?.map((route, index) => ({
      id: `${route.pathType}-${index}`,
      durationMinutes: route.info.totalTime,
      summary: createTransitRouteSummary(route),
    })) ?? [];

  console.log("ODsay transit route mapped result", routes);

  if (routes.length === 0) {
    throw new Error("ODsay 대중교통 경로가 없습니다.");
  }

  return routes;
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
