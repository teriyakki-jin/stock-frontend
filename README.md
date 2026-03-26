# NEXUS — Stock Trading Frontend

> Bloomberg Terminal 스타일 모의주식거래 웹 클라이언트

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| 전역 상태 | Zustand |
| 서버 상태 | TanStack Query v5 |
| UI | Tailwind CSS (터미널 테마) |
| 차트 | Recharts (LineChart / PieChart / ComposedChart) |
| 실시간 | STOMP over WebSocket + SSE |
| 인증 | Supabase OAuth (Google / GitHub) + 이메일 로그인 |

---

## 화면 구성

```
/auth                     로그인 / 회원가입 / Google·GitHub OAuth
/dashboard (OVERVIEW)     계좌 요약 + 포트폴리오 분석
/trade (TRADE)            종목 검색 + 매매 + 기술적 분석 + 가격 알림
/ranking                  기간별 수익률 리더보드
/profile                  프로필 + 팔로워/팔로잉 탭
/ai-report                AI 리포트 (RAG 챗봇)
```

---

## 주요 기능

### 대시보드 (OVERVIEW)
- 계좌 잔액 / 총 평가금액 / 총 손익 카드
- 보유 종목 목록 (수익률 컬러 코딩)
- **포트폴리오 분석 패널**
  - 수익률 곡선(PnL Curve) — Recharts LineChart
  - 섹터 비중 — PieChart
  - 지표 카드: 승률 / MDD / 총 매매 횟수
  - 기간 선택: 7일 / 30일 / 90일

### 거래 (TRADE)
- 종목 검색 + 실시간 시세 (WebSocket STOMP)
- **⚡ TRADE 탭**: 시장가/지정가 매수·매도, 보유 종목 현황, 체결 알림 (SSE)
- **📊 ANALYSIS 탭**: 가격 + 볼린저 밴드 차트, RSI / MACD 패널, 매매 신호 배지
- **🔔 ALERTS 탭**: 목표주가 알림 등록 (이상/이하 조건), 발동 시 토스트 알림

### 랭킹 (RANKING)
- DAILY / WEEKLY / MONTHLY / ALL_TIME 기간별 리더보드
- 수익률 순 정렬, 닉네임 / 아바타 표시

### 프로필 (PROFILE)
- 닉네임 / 바이오 수정
- 팔로워 수 / 팔로잉 수 표시
- **팔로워 탭** / **팔로잉 탭** 목록 조회
- 타 유저 프로필 방문 + 팔로우 버튼

### AI 리포트 (AI REPORT)
- 증권사 리서치 리포트 기반 RAG 챗봇 (rag-report 서버 연동)
- 페르소나 선택: NEUTRAL / AGGRESSIVE / CONSERVATIVE
- 종목 코드 필터링
- 인덱싱된 리포트 목록 사이드바
- 소스 파일명 + 청크 수 표시

---

## 실행 방법

```bash
cd frontend
npm install
npm run dev
```

접속: `http://localhost:5173`

> **사전 조건**
> - `stock-api` → `http://localhost:8082`
> - `rag-report` API 서버 (AI REPORT 기능) → `http://localhost:8090`

---

## 프로젝트 구조

```
frontend/src/
├── api/
│   ├── alerts.ts        # 가격 알림 CRUD
│   ├── auth.ts          # 로그인 / 회원가입 / OAuth
│   ├── client.ts        # Axios 인스턴스 (JWT 인터셉터)
│   ├── orders.ts        # 주문, 보유 종목
│   ├── portfolio.ts     # 포트폴리오 요약 / 분석
│   ├── profile.ts       # 프로필 조회·수정
│   ├── rag.ts           # RAG API (rag-report 서버)
│   ├── ranking.ts       # 리더보드
│   ├── social.ts        # 팔로우/팔로워/팔로잉
│   └── stocks.ts        # 종목 조회, 기술적 분석
├── components/
│   ├── FollowButton.tsx       # 팔로우/언팔로우 토글
│   ├── Layout.tsx             # 페이지 레이아웃 래퍼
│   ├── Navbar.tsx             # 네비게이션 + 시세 모드 뱃지
│   ├── PortfolioAnalysisPanel.tsx  # PnL 차트 + 섹터 파이 + 지표
│   ├── PriceAlertPanel.tsx    # 가격 알림 등록/목록
│   ├── StockChart.tsx         # 가격 + 볼린저 밴드 차트
│   └── TechnicalPanel.tsx     # RSI / MACD 패널
├── hooks/
│   ├── usePendingAlerts.ts    # 발동 알림 10s 폴링 + 토스트
│   ├── useSimStatus.ts        # 시뮬레이션 상태 폴링
│   └── useStockWebSocket.ts   # STOMP 실시간 시세 구독
├── pages/
│   ├── AiReportPage.tsx       # RAG 챗봇
│   ├── AuthCallbackPage.tsx   # OAuth 콜백 처리
│   ├── AuthPage.tsx           # 로그인 / 회원가입
│   ├── DashboardPage.tsx      # 대시보드
│   ├── ProfilePage.tsx        # 프로필 + 소셜
│   ├── RankingPage.tsx        # 리더보드
│   └── TradePage.tsx          # 거래 + 분석 + 알림
├── store/
│   └── authStore.ts           # Zustand (accessToken, accountId)
└── types/
    └── index.ts               # 공통 타입 정의
```
