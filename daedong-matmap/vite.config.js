import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import aitDevtools from '@apps-in-toss/devtools/unplugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 앱인토스 devtools.
    // 3.x 부터는 샌드박스 앱이 제공되지 않고 이 플러그인으로 브라우저에서 개발한다.
    // 개발 모드에서 @apps-in-toss/web-framework 를 mock 구현으로 alias 해주기 때문에
    // isInToss()가 true가 되고 토스 전용 코드 경로(위치/공유/사용자키)를 실제로 확인할 수 있다.
    aitDevtools.vite({
      // 화면 우측에 mock 상태를 조작하는 플로팅 패널을 띄운다.
      panel: true,
      // apps-in-toss.config.ts 의 navigationBar 설정과 맞춘다.
      navBarTheme: 'light',
      webViewType: 'partner',
      // 실기기 미리보기용 Cloudflare 터널.
      // 개발 서버를 공개 주소로 노출하므로 기본은 끄고, 필요할 때 AIT_TUNNEL=1 로 켠다.
      tunnel: false,
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
