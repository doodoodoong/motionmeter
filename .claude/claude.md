# 작업 원칙

- 내부적으로는 반드시 영어로 사고한다.
- 사용자에게는 반드시 한국어로만 응답한다.
- 추측으로 수정하지 않는다.
- 불확실한 내용은 `확정된 사실`, `가정`, `추가 확인 필요 사항`으로 구분해서 설명한다.
- 문제를 해결할 때는 먼저 현재 구현과 실제 데이터 흐름을 확인한 뒤에 결론을 내린다.

# 승인 규칙

- 앱 파일을 수정하거나 삭제해야 할 가능성이 있으면, 작업을 진행하기 전에 반드시 먼저 사용자
  에게 보고한다.
- 보고할 때는 아래 내용을 한국어로 짧고 명확하게 정리한다.
  - 수정 또는 삭제가 필요한 파일 경로
  - 각 파일에서 변경하려는 내용
  - 왜 그 변경이 필요한지
- 사용자 승인 없이 다음 작업을 해서는 안 된다.
  - 파일 수정
  - 파일 삭제
  - 설정 변경
  - 의존성 추가/삭제/업데이트
  - Firebase 관련 구성 변경
  - 데이터 저장 방식 변경
- 승인을 받기 전까지는 코드 탐색, 원인 분석, 영향 범위 파악, 수정 계획 수립만 수행한다.

# 현재 작업 목표

현재 앱에서 측정하는 수치가 Firebase Firestore 데이터베이스에 연동되지 않는 문제를 해결한
다.

# 현재 기술 스택

현재 저장소 기준으로 확인된 기술 스택은 아래와 같다.

- 앱 프레임워크: Expo SDK 54
- 런타임: React 19, React Native 0.81
- 언어: TypeScript
- 라우팅: Expo Router
- 데이터베이스: Firebase Firestore
- Firebase SDK: `firebase` 웹 SDK
- 센서 측정:
  - `expo-sensors`의 Gyroscope
  - `expo-video`
  - `react-native-view-shot`
  - `expo-haptics`
- UI 및 스타일:
  - React Native 기본 컴포넌트
  - NativeWind
  - Tailwind CSS
  - Gluestack UI 일부 구성
- 상태 관리:
  - 현재 코드상 전역 상태 라이브러리는 확인되지 않음
  - 화면 단위 `useState`, `useRef`, `useEffect`, `useCallback` 중심
- 빌드/배포:
  - EAS Build 사용
  - Android 패키지: `com.doodoodoong.motionmeter`
- 모듈 경로:
  - Babel module resolver로 `@/` 별칭 사용

# 현재 코드 기준 핵심 구조

- `app/`:
  - Expo Router 기반 화면 구성
  - `index.tsx`, `measure.tsx`, `_layout.tsx` 등
- `utils/firebase.ts`:
  - Firebase 초기화
  - Firestore 인스턴스 생성
  - 측정 결과 업로드 함수 정의
- `constants/weapon-specs.ts`:
  - 무기별 계산 기준값 관리
- `styles/`:
  - 화면 스타일 정의
- `components/`:
  - 공통 UI 컴포넌트

# Firestore 관련 현재 구현 이해

현재 코드상 Firestore 저장 흐름은 아래와 같다.

1. `app/measure.tsx`에서 자이로스코프 값으로 측정 수치를 계산한다.
2. 측정 완료 시 `uploadMeasurementResult(...)`를 호출한다.
3. `utils/firebase.ts`에서 Firebase 앱을 초기화한다.
4. `getFirestore(app)`로 Firestore 인스턴스를 만든다.
5. `measurements` 컬렉션에 `addDoc(...)`으로 데이터를 저장한다.

# 작업 절차

1. 먼저 코드베이스를 확인해 현재 측정 수치가 어떤 흐름으로 생성되고 저장되는지 파악한다.
2. Firestore에 저장되지 않는 원인을 분석한다.
3. 분석 결과를 한국어로 사용자에게 보고한다.
4. 수정이 필요한 파일과 변경 계획을 사용자에게 제시한다.
5. 사용자 승인을 받은 뒤에만 실제 수정 작업을 진행한다.
6. 승인 후에는 필요한 최소 범위만 수정한다.
7. 작업 완료 후 결과를 한국어로 정리해 보고한다.

# 우선 점검 항목

Firestore 연동 문제를 분석할 때 아래 항목을 우선적으로 확인한다.

- Firebase 초기화가 올바르게 되어 있는지
- Firestore 인스턴스가 올바르게 생성되고 주입되는지
- `EXPO_PUBLIC_FIREBASE_*` 환경 변수가 실제 실행 환경에서 주입되는지
- 측정 수치가 저장 함수까지 실제로 전달되는지
- 저장 함수 호출 결과가 `await` 없이 누락되거나 무시되고 있지 않은지
- 컬렉션 경로 및 문서 경로가 올바른지
- 쓰기 호출이 비동기적으로 중단되지 않는지
- 에러가 콘솔에만 기록되고 UI에서 무시되고 있지 않은지
- Firestore 보안 규칙 또는 권한 문제는 없는지
- 저장 시점이 잘못되어 값이 비어 있거나 유실되지 않는지
- Expo 실행 환경과 Firebase 웹 SDK 사용 방식이 현재 앱 구성과 충돌하지 않는지

# 보고 형식

사용자에게 보고할 때는 가능한 한 아래 형식을 따른다.

## 원인 분석

- 확인한 사실
- 의심 원인
- 추가 확인이 필요한 항목

## 수정 계획

- 대상 파일
- 변경 내용 요약
- 기대 효과

## 작업 결과

- 수정한 파일
- 실제 변경 내용
- 문제 원인
- 해결 방법
- 남아 있는 위험 요소 또는 추가 확인 사항

## 멀티에이전트 레이아웃 규칙

1. 첫 에이전트: `cmux new-split right` (오케스트레이터 기준 오른쪽, 출력 `OK surface:<N>`에서 ID 확인)
2. 추가 에이전트: `cmux new-split down --surface <기존 오른쪽 surface id>`
3. 구조 확인: `cmux tree`
4. 명령 전송은 항상 `cmux send --surface <id> "..."\n` 으로 surface ID 명시
5. 에이전트는 인터랙티브 모드로 실행한다 (`claude "<작업>"`). `claude -p`(headless)는 작업 과정이 안 보이므로 사용하지 않는다.
