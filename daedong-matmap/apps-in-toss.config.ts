import { defineConfig } from '@apps-in-toss/web-framework/config';

/**
 * 앱인토스 미니앱 설정.
 *
 * 파일명 주의: 설치된 @apps-in-toss/cli 3.0.3 의 `ait build`는
 * c12로 `apps-in-toss.config.*` 를 읽는다. (공식 문서에는 granite.config.ts 로 나온다)
 * 두 이름을 모두 두면 혼란스러우므로 이 파일을 원본으로 삼고
 * granite.config.ts 는 이 파일을 다시 내보내기만 한다.
 *
 * appName은 앱인토스 콘솔에 등록한 값과 반드시 같아야 한다.
 * 딥링크 intoss://{appName} 와 src/config.js 의 APP_NAME 도 이 값을 따른다.
 */
export default defineConfig({
  appName: 'daedong-matmap',

  brand: {
    // 녹음색. src/styles/variables.css 의 --app-accent 와 동일하게 맞춘다.
    primaryColor: '#15704A',
  },

  // 현재 위치 기반 검색이 핵심 기능이라 위치 권한을 선언한다.
  permissions: [{ name: 'geolocation', access: 'access' }],

  navigationBar: {
    // 토스 내비게이션 바의 뒤로가기를 쓴다. 앱 안에서 자체 뒤로가기를 만들지 않는다.
    withBackButton: true,
    withTitle: true,
    // 출시 체크리스트: 미니앱 테마는 라이트 모드
    theme: 'light',
  },

  webView: {
    // 지도를 다루는 앱이라 당겨서 새로고침과 바운스는 조작을 방해한다.
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: 'never',
  },

  // vite build 결과물 위치
  webBundleDir: 'dist',

  // CLI가 개발 서버를 띄울 때 사용한다. (3.0.3 타입 정의에는 없지만 CLI가 요구한다)
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
});
