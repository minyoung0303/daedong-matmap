/**
 * 사용자 식별 모듈.
 *
 * 토스앱 안에서는 User.getAnonymousKey()가 돌려주는 해시를 쓴다.
 * 이 키는 사업자 등록 없이 쓸 수 있어서 회원가입/로그인이 필요하지 않다.
 * (토스앱 Android/iOS 5.232.0 이상)
 *
 * 브라우저에서 개발할 때는 SDK 브리지가 없으므로 임시 키를 만들어 보관한다.
 */

import { User } from '@apps-in-toss/web-framework';
import { isInToss, isSupported } from './platform.js';

const STORAGE_KEY = 'daedongmat:user-key';

/** 시크릿 모드처럼 localStorage를 못 쓰는 환경을 위한 대체 저장소 */
let memoryKey = null;

/** 한 번 받아온 키는 재사용한다. */
let cachedKey = null;

function readStoredKey() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryKey;
  }
}

function writeStoredKey(key) {
  memoryKey = key;

  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // 저장이 막힌 환경에서는 메모리에만 둔다.
  }
}

function createLocalKey() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 브라우저 개발용 임시 키 */
function getLocalKey() {
  const stored = readStoredKey();

  if (stored) {
    return stored;
  }

  const created = createLocalKey();
  writeStoredKey(created);

  return created;
}

/**
 * 사용자 키를 돌려준다.
 * 토스앱에서는 익명 해시, 브라우저에서는 임시 키다.
 */
export async function getUserKey() {
  if (cachedKey) {
    return cachedKey;
  }

  if (isInToss() && isSupported(User.getAnonymousKey)) {
    try {
      const result = await User.getAnonymousKey();

      if (result?.hash) {
        cachedKey = result.hash;
        return cachedKey;
      }
    } catch {
      // 토스앱 버전이 낮거나 알 수 없는 오류. 아래 임시 키로 떨어진다.
    }
  }

  cachedKey = getLocalKey();
  return cachedKey;
}
