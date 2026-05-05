# 제출용 스크린샷 · 영상 가이드

과제 체크리스트의 **「UI 실행 과정을 영상·스크린샷으로 안내」**에 맞춰, 아래를 캡처해 저장소에 포함하거나(용량이 크면 링크만 README에 기재) 제출하세요.

## 권장 스크린샷 (파일명 예시)

| 파일명 | 촬영 내용 |
|--------|-----------|
| `01-dashboard.png` | `/` 대시보드 — KPI, 기간 필터, 차트·활동 원장 표 |
| `02-activities-new.png` | `/activities/new` — 폼 + 최근 활동 목록 |
| `03-factors.png` | `/factors` — 배출계수 버전 목록 + 최근 변경 |
| `04-import.png` | `/import` — 업로드 UI 및 결과(성공/실패) |
| `05-docs.png` | `/docs` — Swagger UI |
| `06-validation.png` | 활동 입력에서 잘못된 값 제출 시 필드/글로벌 에러 표시 |

이 폴더에 위 파일들을 두면 README의 이미지 링크가 동작합니다. (Git에 올리기 싫으면 `.gitignore`에 `docs/submission/*.png` 추가 후 개인 레포/드라이브 링크만 README에 적어도 됩니다.)

## 권장 영상 (2~5분)

1. `yarn build` → `yarn start` 로 앱 기동(또는 `yarn dev`).
2. 대시보드에서 기간 필터 적용 → 차트·원장 변화.
3. 활동 입력 1건 저장 → 목록 반영.
4. 임포트 페이지에서 과제 `.xlsx` 업로드(또는 시드 데이터) → 결과·필요 시 오류 CSV 확인.
5. `/docs` 에서 API 문서 펼쳐 보기.

녹화: macOS `Cmd+Shift+5`, 또는 OBS, QuickTime 화면 녹화. 음성 설명이 있으면 평가의 **논리 설명**에 유리합니다.
