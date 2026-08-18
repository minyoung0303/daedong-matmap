/**
 * Kakao Maps SDK 로딩과 장소 검색을 담당하는 모듈.
 *
 * 컴포넌트는 이 파일의 함수만 사용하고 window.kakao를 직접 만지지 않는다.
 * 나중에 앱인토스로 옮기면서 카카오 호출을 백엔드(/api/places/...)로 바꿀 때
 * 이 파일의 searchByCategory / searchByKeyword 내부만 교체하면 된다.
 */

const SDK_SRC_KEYWORD = 'dapi.kakao.com/v2/maps/sdk.js';

/**
 * 장소 종류 (카카오 카테고리 그룹 코드).
 * supportsCuisine이 true인 종류에서만 음식 종류 필터를 노출한다.
 */
export const PLACE_GROUPS = [
  { id: 'restaurant', code: 'FD6', label: '밥집', supportsCuisine: true },
  { id: 'cafe', code: 'CE7', label: '카페', supportsCuisine: false },
  { id: 'convenience', code: 'CS2', label: '편의점', supportsCuisine: false },
];

/**
 * 음식 종류 필터.
 *
 * 카카오에는 '한식' 같은 카테고리 그룹 코드가 없다. 대신 응답의 category_name이
 * "음식점 > 한식 > 국밥" 같은 경로로 오기 때문에, 밥집 검색 결과를 이 경로로 걸러낸다.
 * 추가 API 호출 없이 즉시 필터링되고 여러 개를 동시에 켤 수 있다.
 *
 * match는 category_name 경로에서 찾을 문자열 목록이다. 하나라도 걸리면 해당 종류로 본다.
 */
export const CUISINES = [
  { id: 'korean', label: '한식', match: ['한식'] },
  { id: 'chinese', label: '중식', match: ['중식'] },
  { id: 'japanese', label: '일식', match: ['일식'] },
  { id: 'western', label: '양식', match: ['양식'] },
  { id: 'asian', label: '아시아음식', match: ['아시아음식'] },
  { id: 'bunsik', label: '분식', match: ['분식'] },
  { id: 'chicken', label: '치킨', match: ['치킨'] },
  { id: 'pizza', label: '피자', match: ['피자'] },
  { id: 'burger', label: '햄버거', match: ['햄버거'] },
  { id: 'grill', label: '고기구이', match: ['육류', '고기', '구이'] },
  { id: 'sushi', label: '회·초밥', match: ['초밥', '횟집', '회집', '참치회', '생선회'] },
  { id: 'buffet', label: '뷔페', match: ['뷔페'] },
];

/** 특정 음식 종류에 해당하는지 검사한다. */
function matchesCuisine(place, cuisine) {
  return cuisine.match.some((token) => place.categoryPath.includes(token));
}

/**
 * 선택된 음식 종류로 결과를 걸러낸다.
 * 여러 개를 선택하면 OR로 묶는다. (한식 + 중식 = 한식이거나 중식)
 * 아무것도 선택하지 않으면 전체를 그대로 돌려준다.
 */
export function filterByCuisines(places, selectedIds = []) {
  if (selectedIds.length === 0) {
    return places;
  }

  const selected = CUISINES.filter((cuisine) => selectedIds.includes(cuisine.id));

  return places.filter((place) => selected.some((cuisine) => matchesCuisine(place, cuisine)));
}

/**
 * 음식 종류별 결과 개수를 센다.
 * 결과가 0인 필터는 화면에서 비활성 처리해 헛클릭을 막는다.
 */
export function countByCuisine(places) {
  const counts = {};

  CUISINES.forEach((cuisine) => {
    counts[cuisine.id] = places.reduce((total, place) => total + (matchesCuisine(place, cuisine) ? 1 : 0), 0);
  });

  return counts;
}

/** 기본 검색 반경 (m) */
export const DEFAULT_RADIUS = 2000;

/** 카카오 장소 검색이 한 페이지에 허용하는 최대 개수 */
export const MAX_RESULT_SIZE = 15;

/** 카카오 장소 검색이 허용하는 최대 페이지 수 (15 * 3 = 최대 45곳) */
export const MAX_PAGES = 3;

let sdkPromise = null;

/**
 * Kakao Maps SDK를 한 번만 로드하고 kakao 객체를 돌려준다.
 * 여러 컴포넌트가 동시에 호출해도 스크립트는 한 번만 삽입된다.
 */
export function loadKakaoSdk() {
  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    // services 까지 준비된 상태면 그대로 사용한다.
    if (window.kakao?.maps?.services) {
      resolve(window.kakao);
      return;
    }

    const apiKey = import.meta.env.VITE_KAKAO_JS_KEY;

    if (!apiKey) {
      reject(new Error('VITE_KAKAO_JS_KEY가 설정되지 않았습니다. .env 파일을 확인해 주세요.'));
      return;
    }

    // autoload=false 로 불렀기 때문에 maps.load()를 명시적으로 호출해야 한다.
    const handleLoad = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };

    const handleError = () => {
      reject(new Error('Kakao Maps SDK를 불러오지 못했습니다. 네트워크와 앱 키를 확인해 주세요.'));
    };

    const existingScript = document.querySelector(`script[src*="${SDK_SRC_KEYWORD}"]`);

    if (existingScript) {
      if (window.kakao?.maps) {
        handleLoad();
      } else {
        // 스크립트 태그는 있지만 아직 로드가 끝나지 않은 경우 (StrictMode 재실행, HMR)
        existingScript.addEventListener('load', handleLoad, { once: true });
        existingScript.addEventListener('error', handleError, { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    // libraries=services 가 없으면 kakao.maps.services 가 undefined 라서 장소 검색이 동작하지 않는다.
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
    script.async = true;
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    document.head.appendChild(script);
  });

  // 실패했으면 캐시를 비워서 다음 호출에 재시도할 수 있게 한다.
  sdkPromise.catch(() => {
    sdkPromise = null;
  });

  return sdkPromise;
}

/**
 * 카카오 응답 원본을 앱에서 쓰는 형태로 정규화한다.
 * 백엔드 연동으로 바꿔도 이 형태를 유지하면 컴포넌트는 손댈 필요가 없다.
 */
function toPlace(item) {
  const categoryPath = item.category_name ?? '';
  const categoryLeaf = categoryPath.split('>').pop()?.trim() ?? '';

  return {
    id: item.id,
    name: item.place_name ?? '',
    category: categoryLeaf,
    categoryPath,
    roadAddress: item.road_address_name ?? '',
    jibunAddress: item.address_name ?? '',
    address: item.road_address_name || item.address_name || '',
    phone: item.phone ?? '',
    lat: Number(item.y),
    lng: Number(item.x),
    // 검색 시 location을 넘긴 경우에만 카카오가 distance(m)를 채워준다.
    distance: item.distance ? Number(item.distance) : null,
    placeUrl: item.place_url ?? '',
  };
}

/**
 * 한 페이지만 조회한다. 콜백 기반 카카오 API를 Promise로 감싼다.
 */
async function fetchPage(method, query, { lat, lng, radius, page }) {
  const kakao = await loadKakaoSdk();
  const places = new kakao.maps.services.Places();
  const { Status, SortBy } = kakao.maps.services;

  const options = {
    location: new kakao.maps.LatLng(lat, lng),
    radius,
    size: MAX_RESULT_SIZE,
    page,
    sort: SortBy.DISTANCE,
  };

  return new Promise((resolve, reject) => {
    places[method](
      query,
      (data, status, pagination) => {
        if (status === Status.OK) {
          resolve({
            places: data.map(toPlace),
            totalCount: pagination?.totalCount ?? data.length,
            hasNextPage: pagination?.hasNextPage ?? false,
          });
          return;
        }

        if (status === Status.ZERO_RESULT) {
          resolve({ places: [], totalCount: 0, hasNextPage: false });
          return;
        }

        reject(new Error(`장소 검색에 실패했습니다. (status: ${status})`));
      },
      options
    );
  });
}

/**
 * 카카오가 허용하는 페이지를 끝까지 모아서 한 번에 돌려준다.
 * 편의점처럼 "2km 안에 있는 곳 전부"를 보려면 여러 페이지가 필요하다.
 * 카카오 제한상 최대 45곳까지 가져올 수 있다.
 */
async function searchAllPages(method, query, { lat, lng, radius = DEFAULT_RADIUS }) {
  const collected = [];
  const seenIds = new Set();
  let totalCount = 0;
  let truncated = false;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    // 페이지를 순서대로 받아야 hasNextPage로 중단 여부를 판단할 수 있다.
    const result = await fetchPage(method, query, { lat, lng, radius, page });

    totalCount = result.totalCount;

    result.places.forEach((place) => {
      if (!seenIds.has(place.id)) {
        seenIds.add(place.id);
        collected.push(place);
      }
    });

    if (!result.hasNextPage) {
      break;
    }

    // 마지막 허용 페이지까지 왔는데 아직 다음 페이지가 남아 있는 경우
    if (page === MAX_PAGES) {
      truncated = true;
    }
  }

  // 페이지를 합쳤으니 거리순으로 다시 정렬한다.
  collected.sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY));

  return { places: collected, totalCount, truncated };
}

/** 카테고리 그룹 코드(FD6, CE7, CS2)로 주변 장소를 전부 검색한다. */
export function searchByCategory(code, options) {
  return searchAllPages('categorySearch', code, options);
}

/** 키워드로 주변 장소를 전부 검색한다. (음식 종류, 자유 검색어) */
export function searchByKeyword(keyword, options) {
  return searchAllPages('keywordSearch', keyword, options);
}
