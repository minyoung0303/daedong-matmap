/**
 * 앱 공통 설정.
 *
 * APP_NAME은 앱인토스 콘솔에 등록한 appName과 반드시 같아야 한다.
 * granite.config.ts의 appName, 그리고 딥링크 intoss://{appName} 에도 같은 값이 쓰인다.
 */

export const APP_NAME = import.meta.env.VITE_AIT_APP_NAME ?? 'daedong-matmap';

/** 위치 권한을 못 받았을 때 사용할 기본 좌표 (서울시청) */
export const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

/** 리스트 한 페이지에 보여줄 개수 */
export const PAGE_SIZE = 5;
