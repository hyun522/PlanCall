// Expo가 빌드할 때 자동으로 실행하는 Plugin
// Android 11부터 다른 앱이 설치되어 있는지 마음대로 확인 금지
//안드로이드 설정 파일을 자동으로 수정하는 코드

const { withAndroidManifest } = require("expo/config-plugins");

const KAKAO_MAP_SCHEME = "kakaomap";
const VIEW_ACTION = "android.intent.action.VIEW";

const hasKakaoMapQuery = (queries) =>
  queries.some((query) =>
    query.intent?.some((intent) => {
      const hasViewAction = intent.action?.some(
        (action) => action.$?.["android:name"] === VIEW_ACTION,
      );
      const hasKakaoMapScheme = intent.data?.some(
        (data) => data.$?.["android:scheme"] === KAKAO_MAP_SCHEME,
      );

      return hasViewAction && hasKakaoMapScheme;
    }),
  );

module.exports = (config) =>
  withAndroidManifest(config, (androidConfig) => {
    const manifest = androidConfig.modResults.manifest;
    const queries = manifest.queries ?? [];

    if (!hasKakaoMapQuery(queries)) {
      queries.push({
        intent: [
          {
            action: [{ $: { "android:name": VIEW_ACTION } }],
            data: [{ $: { "android:scheme": KAKAO_MAP_SCHEME } }],
          },
        ],
      });
    }

    manifest.queries = queries;
    return androidConfig;
  });
