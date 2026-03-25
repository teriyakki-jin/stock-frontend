# Stock Trading Platform — Frontend

Bloomberg Terminal 스타일의 주식 매매 웹 클라이언트

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | React 18, TypeScript, Vite |
| Routing | React Router v6 |
| State | Zustand (전역 인증 상태) |
| Server State | TanStack Query v5 |
| UI | Tailwind CSS (terminal 테마) |
| Charts | Recharts (ComposedChart) |
| Realtime | STOMP over WebSocket |

## 주요 기능

### 거래 (TRADE 탭)
- 종목 검색 및 실시간 시세 구독 (WebSocket STOMP)
- 매수 / 매도 주문 폼
- 체결 알림 실시간 수신 (SSE)
- 보유 종목 및 손익 조회

### 기술적 분석 (ANALYSIS 탭)
- **가격 차트**: 종가 라인 + 볼린저 밴드 (상단/하단 채움, 중선 점선)
- **RSI 패널**: 게이지 바, 과매도(30) / 과매수(70) 구분선
- **MACD 패널**: MACD / Signal / Histogram 수치 + 히스토그램 시각화
- **매매 신호 배지**: BUY(초록) / SELL(빨강) / NEUTRAL(파랑) 자동 표시
- **통계 카드**: 연간 변동성(σ), 연간 수익률(μ) 표시

### 상태 표시
- Navbar 우측 모드 뱃지: `LIVE`(실시간) / `REALTIME`(Yahoo) / `SIM*`(시뮬)
- 캘리브레이션 완료 시 `*` 표시

## 실행 방법

```bash
cd frontend
npm install
npm run dev
```

접속: http://localhost:5173

백엔드(stock-api)가 `http://localhost:8082`에서 실행 중이어야 합니다.

## 화면 구성

```
Navbar
├── NEXUS 로고
├── OVERVIEW | TRADE 네비게이션
└── 시세 모드 뱃지 + LOGOUT

/dashboard (OVERVIEW)
├── 계좌 잔액 / 총 평가금액 카드
├── 보유 종목 리스트 (수익률 색상 코딩)
└── 포트폴리오 수익 차트

/trade (TRADE)
├── 종목 검색 패널
├── [⚡ TRADE] 탭
│   ├── 실시간 시세 (WebSocket)
│   ├── 매수 / 매도 폼
│   └── 보유 종목 현황
└── [📊 TECHNICAL ANALYSIS] 탭
    ├── StockChart (가격 + 볼린저 밴드)
    └── TechnicalPanel (RSI + MACD + 통계)
```

## 프로젝트 구조

```
frontend/src/
├── api/
│   ├── auth.ts          # 로그인/회원가입/로그아웃
│   ├── stocks.ts        # 종목 조회, 기술적 분석, 시뮬 상태
│   └── orders.ts        # 주문, 보유 종목, 주문 내역
├── components/
│   ├── Navbar.tsx       # 헤더, 모드 뱃지
│   ├── StockChart.tsx   # Recharts 가격 + BB 차트
│   └── TechnicalPanel.tsx # RSI / MACD 패널
├── hooks/
│   ├── useSimStatus.ts  # 시뮬레이션 상태 폴링 (30s)
│   └── useStompPrice.ts # WebSocket 실시간 시세
├── pages/
│   ├── AuthPage.tsx     # 로그인 / 회원가입
│   ├── DashboardPage.tsx
│   └── TradePage.tsx    # 거래 + 기술적 분석 탭
├── store/
│   └── authStore.ts     # Zustand 인증 상태
└── types/
    └── index.ts         # OhlcvBar, TechnicalData, SimStatus 등
```
