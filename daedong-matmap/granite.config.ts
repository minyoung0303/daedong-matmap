/**
 * 공식 문서는 설정 파일명을 granite.config.ts 라고 안내한다.
 * 그런데 설치된 @apps-in-toss/cli 3.0.3 의 `ait build` 는 c12로 `apps-in-toss.config.*` 를 읽는다.
 * (`ait dev` 계열 명령은 granite.config 를 찾는 코드 경로가 따로 있다)
 *
 * 두 파일에 설정을 중복해서 적으면 한쪽만 고치는 사고가 나므로,
 * 실제 설정은 apps-in-toss.config.ts 에만 두고 여기서는 그대로 다시 내보낸다.
 */
export { default } from './apps-in-toss.config';
