import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LocationSearchTarget, SelectedPlace } from "../types";

type KakaoPlaceDocument = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  place_url?: string;
  x: string;
  y: string;
};

type KakaoAddressDetail = {
  address_name: string;
  x?: string;
  y?: string;
};

type KakaoRoadAddressDetail = KakaoAddressDetail & {
  building_name: string;
};

type KakaoAddressDocument = {
  address_name: string;
  address_type: "REGION" | "ROAD" | "REGION_ADDR" | "ROAD_ADDR";
  x: string;
  y: string;
  address: KakaoAddressDetail | null;
  road_address: KakaoRoadAddressDetail | null;
};

type KakaoSearchResponse<T> = {
  documents?: T[];
};

type SearchResult = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  roadAddress?: string;
  jibunAddress?: string;
  kakaoMapUrl?: string;
};

type SearchLocationModalProps = {
  visible: boolean;
  target: LocationSearchTarget;
  onClose: () => void;
  onSelectPlace: (place: SelectedPlace) => void;
};

const KAKAO_LOCAL_KEYWORD_URL =
  "https://dapi.kakao.com/v2/local/search/keyword.json";
const KAKAO_LOCAL_ADDRESS_URL =
  "https://dapi.kakao.com/v2/local/search/address.json";

const getTargetLabel = (target: LocationSearchTarget) =>
  target === "departure" ? "출발지" : "목적지";

const createKakaoMapWebUrl = (result: SearchResult) =>
  `https://map.kakao.com/link/map/${encodeURIComponent(result.name)},${
    result.latitude
  },${result.longitude}`;

const createKakaoMapAppUrl = (result: SearchResult) =>
  `kakaomap://look?p=${result.latitude},${result.longitude}`;

const openUrlSafely = async (url: string) => {
  await Linking.openURL(url);
};

const isAddressLikeQuery = (keyword: string) =>
  /\d/.test(keyword) ||
  /(로|길|대로|번길|읍|면|동|리|가)\s*\d*/.test(keyword) ||
  /(특별시|광역시|특례시|도|시|군|구)/.test(keyword);

const mapKakaoPlaceToSearchResult = (
  document: KakaoPlaceDocument,
): SearchResult => ({
  id: `place-${document.id}`,
  name: document.place_name,
  latitude: Number(document.y),
  longitude: Number(document.x),
  address: document.road_address_name || document.address_name,
  roadAddress: document.road_address_name,
  jibunAddress: document.address_name,
  kakaoMapUrl: document.place_url,
});

const mapKakaoAddressToSearchResult = (
  document: KakaoAddressDocument,
): SearchResult => {
  const roadAddress = document.road_address?.address_name;
  const jibunAddress = document.address?.address_name;
  const name =
    document.road_address?.building_name ||
    roadAddress ||
    jibunAddress ||
    document.address_name;

  return {
    id: `address-${document.address_type}-${document.x}-${document.y}-${document.address_name}`,
    name,
    latitude: Number(document.y),
    longitude: Number(document.x),
    address: roadAddress || jibunAddress || document.address_name,
    roadAddress,
    jibunAddress,
  };
};

const mapSearchResultToSelectedPlace = (
  result: SearchResult,
): SelectedPlace => ({
  name: result.name,
  latitude: result.latitude,
  longitude: result.longitude,
  address: result.address,
});

const dedupeSearchResults = (results: SearchResult[]) => {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = [
      result.name,
      result.roadAddress,
      result.jibunAddress,
      result.latitude.toFixed(6),
      result.longitude.toFixed(6),
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export default function SearchLocationModal({
  visible,
  target,
  onClose,
  onSelectPlace,
}: SearchLocationModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const targetLabel = getTargetLabel(target);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      setErrorMessage(null);
      setIsLoading(false);
      setHasSearched(false);
    }
  }, [visible]);

  const handleSearch = async () => {
    const keyword = query.trim();

    if (!keyword) {
      setResults([]);
      setHasSearched(false);
      setErrorMessage("검색어를 입력해주세요.");
      return;
    }

    const kakaoRestApiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

    if (!kakaoRestApiKey) {
      setErrorMessage("EXPO_PUBLIC_KAKAO_REST_API_KEY가 설정되지 않았습니다.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const headers = {
        Authorization: `KakaoAK ${kakaoRestApiKey}`,
      };
      const [placeResponse, addressResponse] = await Promise.all([
        fetch(
          `${KAKAO_LOCAL_KEYWORD_URL}?query=${encodeURIComponent(
            keyword,
          )}&size=15`,
          { headers },
        ),
        fetch(
          `${KAKAO_LOCAL_ADDRESS_URL}?query=${encodeURIComponent(
            keyword,
          )}&size=15`,
          { headers },
        ),
      ]);

      if (!placeResponse.ok || !addressResponse.ok) {
        throw new Error("카카오 위치 검색에 실패했습니다.");
      }

      const placeData =
        (await placeResponse.json()) as KakaoSearchResponse<KakaoPlaceDocument>;
      const addressData =
        (await addressResponse.json()) as KakaoSearchResponse<KakaoAddressDocument>;
      const placeResults = (placeData.documents ?? []).map(
        mapKakaoPlaceToSearchResult,
      );
      const addressResults = (addressData.documents ?? []).map(
        mapKakaoAddressToSearchResult,
      );
      const mergedResults = isAddressLikeQuery(keyword)
        ? [...addressResults, ...placeResults]
        : [...placeResults, ...addressResults];

      setResults(dedupeSearchResults(mergedResults));
      setHasSearched(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("위치를 검색하지 못했습니다. 잠시 후 다시 시도해주세요.");
      setHasSearched(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlace = (result: SearchResult) => {
    onSelectPlace(mapSearchResultToSelectedPlace(result));
  };

  const handleOpenKakaoMap = async (result: SearchResult) => {
    // const webUrl = result.kakaoMapUrl ?? createKakaoMapWebUrl(result);
    const webUrl = createKakaoMapWebUrl(result);
    const appUrl = createKakaoMapAppUrl(result);

    if (Platform.OS === "web") {
      await openUrlSafely(webUrl);
      return;
    }

    try {
      const canOpenKakaoMap = await Linking.canOpenURL(appUrl);

      if (canOpenKakaoMap) {
        await openUrlSafely(appUrl);
        return;
      }
    } catch (error) {
      console.error("Failed to check KakaoMap app:", error);
    }

    try {
      await openUrlSafely(webUrl);
    } catch (error) {
      console.error("Failed to open KakaoMap web:", error);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <SafeAreaView style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <Text style={styles.title}>{targetLabel} 검색</Text>
            <View style={styles.headerButton} />
          </View>

          <View style={styles.searchSection}>
            <View style={styles.searchInputRow}>
              <Ionicons name="search" size={20} color="#6c757d" />
              <TextInput
                style={styles.searchInput}
                placeholder={`${targetLabel}를 검색하세요`}
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                autoFocus
                onSubmitEditing={handleSearch}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setQuery("");
                    setResults([]);
                    setErrorMessage(null);
                    setHasSearched(false);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.searchButton, isLoading && styles.buttonDisabled]}
              onPress={handleSearch}
              disabled={isLoading}
            >
              <Text style={styles.searchButtonText}>검색</Text>
            </TouchableOpacity>
          </View>

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#4a9d6f" />
            </View>
          ) : (
            <ScrollView
              style={styles.content}
              contentContainerStyle={[
                styles.resultList,
                hasSearched && results.length === 0 && styles.emptyResultList,
              ]}
              keyboardShouldPersistTaps="handled"
            >
              {hasSearched && results.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search" size={28} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>검색 결과가 없습니다</Text>
                  <Text style={styles.emptyText}>
                    장소명이나 주소를 다시 입력해주세요.
                  </Text>
                </View>
              ) : (
                results.map((result) => (
                  <TouchableOpacity
                    key={result.id}
                    style={styles.resultItem}
                    activeOpacity={0.75}
                    onPress={() => handleSelectPlace(result)}
                  >
                    <View style={styles.resultHeader}>
                      <Text style={styles.placeName}>{result.name}</Text>
                      <TouchableOpacity
                        style={styles.mapButton}
                        activeOpacity={0.75}
                        onPress={(event) => {
                          event.stopPropagation();
                          handleOpenKakaoMap(result);
                        }}
                        accessibilityLabel={`${result.name} 카카오맵 열기`}
                      >
                        <Ionicons
                          name="map-outline"
                          size={20}
                          color="#4a9d6f"
                        />
                      </TouchableOpacity>
                    </View>
                    {!!result.roadAddress && (
                      <Text style={styles.roadAddress}>
                        도로명 {result.roadAddress}
                      </Text>
                    )}
                    {!!result.jibunAddress && (
                      <Text style={styles.address}>
                        지번 {result.jibunAddress}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.18)",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    height: "80%",
    overflow: "hidden",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#fafbfc",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 2,
    backgroundColor: "#d1d5db",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 12,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4a9d6f",
  },
  searchSection: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  searchInputRow: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
  },
  searchButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#4a9d6f",
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    paddingHorizontal: 16,
    paddingTop: 12,
    color: "#ef4444",
    fontSize: 14,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  resultList: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
  },
  emptyResultList: {
    justifyContent: "center",
  },
  resultItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0f2",
    backgroundColor: "#FFFFFF",
    gap: 5,
  },
  resultHeader: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  placeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  mapButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#eef7f2",
  },
  roadAddress: {
    fontSize: 14,
    color: "#4b5563",
  },
  address: {
    fontSize: 13,
    color: "#8a8f98",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  emptyText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
  },
});
