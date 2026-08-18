/**
 * 현재 위치 조회.
 *
 * 토스앱 안에서는 앱인토스 SDK의 getCurrentLocation을 쓴다.
 * 미니앱 WebView에서 navigator.geolocation은 동작이 보장되지 않기 때문이다.
 * 브라우저 개발 환경에서는 navigator.geolocation으로 떨어진다.
 */

import { Accuracy, getCurrentLocation } from '@apps-in-toss/web-framework';
import { isInToss, isSupported } from './platform.js';

/** 위치 조회 실패 사유. 화면에서 안내 문구를 나누는 데 쓴다. */
export const LOCATION_ERROR = {
  DENIED: 'denied',
  UNSUPPORTED: 'unsupported',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown',
};

export class LocationError extends Error {
  constructor(reason, message) {
    super(message);
    this.name = 'LocationError';
    this.reason = reason;
  }
}

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
};

/** 앱인토스 SDK 경로 */
async function getTossLocation() {
  try {
    // Accuracy.Balanced = 오차범위 수백 미터. 반경 2km 검색에는 충분하고 배터리도 덜 쓴다.
    const result = await getCurrentLocation({ accuracy: Accuracy.Balanced });

    return { lat: result.coords.latitude, lng: result.coords.longitude };
  } catch (error) {
    // 권한 거부는 PermissionError 계열로 온다.
    if (error?.name?.includes('Permission') || error instanceof Error === false) {
      throw new LocationError(LOCATION_ERROR.DENIED, '위치 권한이 없어 기본 위치로 검색합니다.');
    }

    throw new LocationError(LOCATION_ERROR.UNKNOWN, '현재 위치를 확인할 수 없습니다.');
  }
}

/** 브라우저 표준 경로 */
function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new LocationError(LOCATION_ERROR.UNSUPPORTED, '이 환경에서는 위치 기능을 쓸 수 없습니다.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new LocationError(LOCATION_ERROR.DENIED, '위치 권한이 거부되어 기본 위치로 검색합니다.'));
          return;
        }

        if (error.code === error.TIMEOUT) {
          reject(new LocationError(LOCATION_ERROR.TIMEOUT, '위치 확인이 지연되고 있습니다. 다시 시도해 주세요.'));
          return;
        }

        reject(new LocationError(LOCATION_ERROR.UNKNOWN, '현재 위치를 확인할 수 없습니다.'));
      },
      GEOLOCATION_OPTIONS
    );
  });
}

/**
 * 현재 위치를 가져온다.
 * @returns {Promise<{lat:number, lng:number}>}
 */
export function fetchCurrentLocation() {
  if (isInToss() && isSupported(getCurrentLocation)) {
    return getTossLocation();
  }

  return getBrowserLocation();
}
