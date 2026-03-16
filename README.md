# Stock Trading Platform

Bloomberg Terminal 스타일의 주식 매매 풀스택 웹 애플리케이션

## 기술 스택

| 구분 | 기술 |
|------|------|
| Backend | Spring Boot 4.0.3, Java 17, Gradle |
| Frontend | React 18, TypeScript, Vite |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (Access 30min + Refresh 7days) |
| UI | Tailwind CSS, Recharts |

## 주요 기능

- **회원가입 / 로그인** — JWT 기반 stateless 인증
- **계좌 개설 / 입금** — 가상 계좌 관리
- **주식 매수 / 매도** — 비관적 락(Pessimistic Lock)으로 동시성 제어
- **포트폴리오 조회** — 보유 종목, 손익, 수익률 차트
- **주문 내역** — 전체 거래 기록

## 프로젝트 구조

```
.
├── backend/          # Spring Boot REST API (port 8082)
│   ├── src/
│   ├── build.gradle
│   └── docker-compose.yml
├── frontend/         # React + Vite SPA (port 5173)
│   ├── src/
│   └── package.json
└── docker-compose.yml  # PostgreSQL + Redis
```

## 실행 방법

### 1. 인프라 실행 (PostgreSQL + Redis)

```bash
docker-compose up -d
```

### 2. 백엔드 실행

```bash
cd backend
./gradlew bootRun --args='--server.port=8082'
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

접속: http://localhost:5173

## API 명세

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/accounts` | 계좌 개설 |
| POST | `/api/accounts/{id}/deposit` | 입금 |
| GET | `/api/stocks` | 종목 목록 |
| POST | `/api/orders` | 주문 (매수/매도) |
| GET | `/api/orders/holdings` | 보유 종목 |
| GET | `/api/orders/history` | 주문 내역 |
