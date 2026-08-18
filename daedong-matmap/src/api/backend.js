/**
 * 우리 백엔드(Spring) 호출 모듈.
 *
 * 개발 중에는 vite.config.js의 프록시가 /api 를 localhost:8080 으로 넘겨준다.
 * 배포할 때는 VITE_API_BASE_URL 로 실제 주소를 지정하면 된다.
 */

/**
 * 개발 중에는 Vite 프록시(/api)를 쓰고, 배포 시에는 VITE_API_BASE_URL로 실제 주소를 지정한다.
 *
 * 프로덕션 빌드에서 VITE_API_BASE_URL이 없으면 빈 값이 된다.
 * 이때는 백엔드가 없는 것으로 보고 메뉴/리뷰 기능을 화면에서 숨긴다.
 * 덕분에 백엔드 호스팅 없이도 지도·검색·공유만으로 먼저 출시할 수 있다.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '/api' : '');

/** 백엔드가 연결된 환경인지. false면 메뉴/리뷰 UI를 렌더하지 않는다. */
export const isBackendEnabled = BASE_URL !== '';

/** 사용자 식별 키를 담는 헤더. 백엔드 PlaceDetailController와 이름이 같아야 한다. */
const USER_KEY_HEADER = 'X-User-Key';

/**
 * 백엔드 오류 응답({ message, details })을 사람이 읽을 메시지로 바꾼다.
 */
async function toErrorMessage(response) {
  try {
    const body = await response.json();

    if (body?.details?.length) {
      return body.details.join('\n');
    }

    if (body?.message) {
      return body.message;
    }
  } catch {
    // JSON이 아니면 아래 기본 메시지를 쓴다.
  }

  if (response.status === 0 || response.status >= 500) {
    return '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.';
  }

  return `요청이 실패했습니다. (${response.status})`;
}

async function request(path, { method = 'GET', userKey, body } = {}) {
  const headers = {};

  if (userKey) {
    headers[USER_KEY_HEADER] = userKey;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // 백엔드가 꺼져 있거나 네트워크가 끊긴 경우
    throw new Error('서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.');
  }

  if (!response.ok) {
    throw new Error(await toErrorMessage(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * 카카오에서 받은 장소를 백엔드가 이해하는 형태로 바꾼다.
 * 리뷰를 쓸 때 이 정보로 장소를 새로 만들기 때문에 필요하다.
 */
function toPlacePayload(place) {
  return {
    name: place.name,
    categoryPath: place.categoryPath,
    roadAddress: place.roadAddress,
    jibunAddress: place.jibunAddress,
    phone: place.phone,
    latitude: place.lat,
    longitude: place.lng,
  };
}

/** 가게 상세(메뉴 + 별점 + 리뷰) 조회. 등록되지 않은 장소도 빈 상세로 응답한다. */
export function fetchPlaceDetail(kakaoPlaceId, userKey) {
  return request(`/places/kakao/${encodeURIComponent(kakaoPlaceId)}/detail`, { userKey });
}

/** 리뷰 작성 또는 수정. 응답으로 갱신된 상세가 돌아온다. */
export function saveReview({ place, userKey, rating, content }) {
  return request(`/places/kakao/${encodeURIComponent(place.id)}/reviews`, {
    method: 'PUT',
    userKey,
    body: {
      rating,
      content,
      place: toPlacePayload(place),
    },
  });
}

/** 내가 쓴 리뷰 삭제. 응답으로 갱신된 상세가 돌아온다. */
export function deleteMyReview({ place, userKey }) {
  return request(`/places/kakao/${encodeURIComponent(place.id)}/reviews`, {
    method: 'DELETE',
    userKey,
  });
}
