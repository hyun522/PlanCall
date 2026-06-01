import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  x: string;
  y: string;
};

type SearchLocationModalProps = {
  visible: boolean;
  target: LocationSearchTarget;
  onClose: () => void;
  onSelectPlace: (place: SelectedPlace) => void;
};

const KAKAO_LOCAL_KEYWORD_URL =
  "https://dapi.kakao.com/v2/local/search/keyword.json";

const getTargetLabel = (target: LocationSearchTarget) =>
  target === "departure" ? "출발지" : "목적지";

const mapKakaoPlaceToSelectedPlace = (
  document: KakaoPlaceDocument,
): SelectedPlace => ({
  name: document.place_name,
  latitude: Number(document.y),
  longitude: Number(document.x),
  address: document.road_address_name || document.address_name,
});

export default function SearchLocationModal({
  visible,
  target,
  onClose,
  onSelectPlace,
}: SearchLocationModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KakaoPlaceDocument[]>([]);
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
      const url = `${KAKAO_LOCAL_KEYWORD_URL}?query=${encodeURIComponent(
        keyword,
      )}&size=15`;
      const response = await fetch(url, {
        headers: {
          Authorization: `KakaoAK ${kakaoRestApiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error("카카오 장소 검색에 실패했습니다.");
      }

      const data = await response.json();
      setResults(data.documents ?? []);
      setHasSearched(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("장소를 검색하지 못했습니다. 잠시 후 다시 시도해주세요.");
      setHasSearched(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlace = (document: KakaoPlaceDocument) => {
    onSelectPlace(mapKakaoPlaceToSelectedPlace(document));
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
                    <Text style={styles.placeName}>{result.place_name}</Text>
                    {!!result.road_address_name && (
                      <Text style={styles.roadAddress}>
                        도로명 {result.road_address_name}
                      </Text>
                    )}
                    {!!result.address_name && (
                      <Text style={styles.address}>
                        지번 {result.address_name}
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
  placeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
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
