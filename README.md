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

> 자세한 단계는 구현 진행과 함께 채워집니다. 현재는 부트스트랩 단계입니다.

```bash
# 1) 저장소 클론
git clone <repo-url>
cd hanaloop-recruitment-pcf-dashboard

# 2) Node 24 사용 (.nvmrc 존재)
nvm use

# 3) 의존성 설치
yarn install

# 4) (예정) DB 기동 및 마이그레이션
# docker compose up -d
# yarn prisma migrate deploy && yarn prisma db seed

# 5) 개발 서버
yarn dev
# http://localhost:3000
```

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
- [ ] Step 2. Prisma 스키마 + Docker Compose
- [ ] Step 3. 시드 데이터 로드 (활동 31행 + 배출계수 4건)
- [ ] Step 4. PCF 계산 도메인 로직 + Vitest
- [ ] Step 5. API Routes (`/api/v1`) 구현
- [ ] Step 6. 대시보드 UI (KPI / 차트 4종)
- [ ] Step 7. 입력 폼 + 배출계수 버전 관리 화면
- [ ] Step 8. Excel 임포트
- [ ] Step 9. Swagger 문서
- [ ] Step 10. README 보강 + ERD + 영상/스크린샷
- [ ] Step 11. 발표용 메모 정리

## AI 사용 내역

> 채용 과제 정책에 따라 AI를 어떻게 사용했는지 단계별로 기록합니다. 발표 시 함께 설명할 예정입니다.

- (작성 예정) 사용한 도구, 주요 Prompt, 의사결정 근거를 단계별로 기록.

## 설계 결정 / Trade-off

> 발표 대비 메모. 구현이 진행되며 채워집니다.

- (작성 예정) 단일 앱 vs 백엔드 분리, 배출계수 버전 테이블 도입 이유, raw activity 보존 정책 등.
