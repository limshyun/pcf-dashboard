# PCF Dashboard

제품별 탄소 발자국(Product Carbon Footprint, PCF)을 측정·집계·시각화하는 인터랙티브 대시보드입니다. 채용 과제로 진행 중이며, 단계별 커밋 히스토리로 작업 과정을 함께 남깁니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router) + TypeScript
- **DB / ORM**: PostgreSQL + Prisma (예정)
- **UI**: Tailwind CSS v4 + shadcn/ui (Base UI / Nova preset)
- **Validation**: Zod
- **Chart**: Recharts
- **Excel Import**: SheetJS (`xlsx`)
- **API Docs**: next-swagger-doc + swagger-ui-react
- **Test**: Vitest

## 로컬 실행 방법 (5단계)

```bash
# 1) 저장소 클론 + Node 24
git clone <repo-url> && cd hanaloop-recruitment-pcf-dashboard
nvm use            # .nvmrc 기준 Node 24

# 2) 환경 변수 + 의존성
cp .env.example .env
yarn install

# 3) PostgreSQL 기동 + 마이그레이션
yarn db:up                            # docker compose up -d
yarn db:migrate                       # init 마이그레이션 적용

# 4) 시드 데이터 로드 (마스터 + 활동 데이터)
#    아래 "활동 데이터(Excel) 준비" 섹션을 먼저 수행하세요.
yarn db:seed

# 5) 개발 서버
yarn dev                              # http://localhost:3000
```

### 활동 데이터(Excel) 준비

채용 과제로 받은 구글 시트의 활동 데이터를 시드와 임포트 화면에서 모두 사용합니다.

1. 구글 시트 → `파일` → `다운로드` → **`Microsoft Excel (.xlsx)`** 선택
2. 다운로드된 파일을 다음 경로로 옮긴다:

   ```
   prisma/seed-data/activity-data.xlsx
   ```

3. `yarn db:seed` 실행 → 카테고리 3 / 품목 4 / 배출계수 4 + 활동 데이터가 적재됨

> 파일이 없어도 시드는 동작하며, 마스터 데이터까지만 적재되고 활동 데이터는 건너뜁니다.

## 프로젝트 구조 (계획)

```
app/                  Next.js App Router (UI + /api/v1)
src/
  domain/             순수 도메인 로직 (PCF 계산, Scope 매핑, 단위 검증)
  services/           유스케이스 계층
  repositories/       Prisma 접근 계층
  lib/                Excel 파서, Swagger 등 공통 유틸
components/           shadcn/ui 컴포넌트
prisma/               schema.prisma, migrations, seed.ts
```

## 진행 상황

- [x] Step 1. Next.js 16 + TS + Tailwind + shadcn/ui 부트스트랩
- [x] Step 2. Prisma 스키마 + Docker Compose
- [x] Step 3. 시드 데이터 로드 (마스터 + Excel 활동 데이터)
- [x] Step 4. PCF 계산 도메인 로직 + Vitest 21건
- [x] Step 5. API Routes (`/api/v1`) 구현
- [x] Step 6. 대시보드 UI (KPI 4 + 월별/카테고리/품목 차트 + 기간 필터)
- [x] Step 7. 활동 입력 폼 + 배출계수 버전 관리 화면 (RHF + Zod, 다이얼로그)
- [x] Step 8. Excel 임포트 (`/import` 페이지 + `POST/GET /api/v1/import` + 실패 행 CSV 다운로드)
- [ ] Step 9. Swagger 문서
- [ ] Step 10. README 보강 + ERD + 영상/스크린샷
- [ ] Step 11. 발표용 메모 정리

## AI 사용 내역

> 채용 과제 정책에 따라 AI를 어떻게 사용했는지 단계별로 기록합니다. 발표 시 함께 설명할 예정입니다.

- (작성 예정) 사용한 도구, 주요 Prompt, 의사결정 근거를 단계별로 기록.

## 설계 결정 / Trade-off

> 발표 대비 메모. 구현이 진행되며 채워집니다.

- (작성 예정) 단일 앱 vs 백엔드 분리, 배출계수 버전 테이블 도입 이유, raw activity 보존 정책 등.
