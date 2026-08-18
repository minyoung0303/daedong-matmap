/**
 * 실행 환경 판별 + 외부 링크 열기.
 *
 * 같은 코드가 (1) 브라우저 개발 환경 (2) 앱인토스 샌드박스 (3) 토스앱 에서 모두 돌아야 한다.
 * 그래서 앱인토스 SDK가 실제로 붙어 있는지 런타임에 확인하고, 아니면 웹 표준으로 떨어진다.
 */

import { Device, getOperationalEnvironment } from '@apps-in-toss/web-framework';

let cachedInToss = null;

/** 토스앱 또는 샌드박스 안에서 실행 중인지 */
export function isInToss() {
  if (cachedInToss !== null) {
    return cachedInToss;
  }

  try {
    const environment = getOperationalEnvironment();
    cachedInToss = environment === 'toss' || environment === 'sandbox';
  } catch {
    // 브라우저에서는 네이티브 브리지가 없어서 예외가 난다.
    cachedInToss = false;
  }

  return cachedInToss;
}

/**
 * SDK 함수가 현재 환경에서 쓸 수 있는지 확인한다.
 * 앱인토스 SDK 함수 대부분은 isSupported()를 제공한다. (토스앱 최소 버전 체크 포함)
 */
export function isSupported(sdkFunction) {
  try {
    return typeof sdkFunction?.isSupported === 'function' ? sdkFunction.isSupported() : false;
  } catch {
    return false;
  }
}

/**
 * 외부 링크 열기 (카카오맵 등).
 *
 * 미니앱 WebView에서는 target="_blank"가 동작하지 않을 수 있어서
 * 토스 안에서는 Device.openURL을 쓴다.
 */
export async function openExternalUrl(url) {
  if (!url) {
    return;
  }

  if (isInToss()) {
    try {
      await Device.openURL(url);
      return;
    } catch {
      // 실패하면 아래 웹 방식으로 시도한다.
    }
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}
