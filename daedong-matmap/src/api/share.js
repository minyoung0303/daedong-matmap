/**
 * 맛집 공유 모듈.
 *
 * 토스앱 안에서는 Share.createLink로 미니앱 딥링크를 만들고 Share.sendMessage로 공유 시트를 띄운다.
 * 출시 체크리스트에 "intoss-private:// 대신 intoss:// 스킴을 사용" 조건이 있어서
 * 링크 경로를 intoss://{appName} 형태로 만든다.
 *
 * 브라우저 개발 환경에서는 Web Share API, 그다음 클립보드 복사로 떨어진다.
 */

import { Share } from '@apps-in-toss/web-framework';
import { APP_NAME } from '../config.js';
import { isInToss } from './platform.js';

export const SHARE_RESULT = {
  SHARED: 'shared',
  COPIED: 'copied',
  CANCELLED: 'cancelled',
  UNSUPPORTED: 'unsupported',
};

/** 공유 문구를 만든다. */
function buildShareText(place, ratingAverage, ratingCount) {
  const lines = [place.name];

  if (place.category) {
    lines.push(place.category);
  }

  if (ratingCount > 0) {
    lines.push(`별점 ${ratingAverage.toFixed(1)} (${ratingCount}명)`);
  }

  if (place.address) {
    lines.push(place.address);
  }

  return lines.join('\n');
}

/** 미니앱으로 돌아오는 딥링크. 받는 사람이 열면 해당 가게가 선택된 상태로 시작한다. */
function buildDeepLink(place) {
  return `intoss://${APP_NAME}?placeId=${encodeURIComponent(place.id)}`;
}

/** 토스앱 경로 */
async function shareInToss({ place, text }) {
  try {
    // createLink가 실패해도 문구만이라도 공유할 수 있게 링크는 선택적으로 붙인다.
    let link = '';

    try {
      link = await Share.createLink({ path: buildDeepLink(place) });
    } catch {
      link = '';
    }

    await Share.sendMessage({ message: link ? `${text}\n${link}` : text });

    return SHARE_RESULT.SHARED;
  } catch {
    return SHARE_RESULT.UNSUPPORTED;
  }
}

/** 브라우저 경로 */
async function shareInBrowser({ place, text }) {
  const url = place.placeUrl || window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({ title: `대동맛지도 · ${place.name}`, text, url });
      return SHARE_RESULT.SHARED;
    } catch (error) {
      // 사용자가 공유 시트를 닫은 경우는 실패가 아니다.
      if (error?.name === 'AbortError') {
        return SHARE_RESULT.CANCELLED;
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      return SHARE_RESULT.COPIED;
    } catch {
      return SHARE_RESULT.UNSUPPORTED;
    }
  }

  return SHARE_RESULT.UNSUPPORTED;
}

/**
 * 장소를 공유한다.
 * @returns {Promise<'shared'|'copied'|'cancelled'|'unsupported'>}
 */
export async function sharePlace({ place, ratingAverage = 0, ratingCount = 0 }) {
  const text = buildShareText(place, ratingAverage, ratingCount);

  return isInToss() ? shareInToss({ place, text }) : shareInBrowser({ place, text });
}
