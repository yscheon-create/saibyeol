# 운영 환경

배포·외부 서비스·환경 변수·지금까지 겪은 문제의 기록. 비밀값(비밀번호, 키)은 이 파일에 적지 않는다. "어디에 있는지"만 적는다.

마지막 갱신: 2026-10-23

## 주소

| 용도 | 주소 |
| --- | --- |
| **대표 주소 (서비스)** | https://saibyeol.vercel.app |
| GitHub 레포 | https://github.com/yscheon-create/saibyeol |
| Vercel 프로젝트 | vercel.com → yscheon-9289 → saibyeol |
| Neon 프로젝트 | neon.com → saibyeol (리전 us-east-2, 나중에 아시아 리전 이전 검토) |
| 카카오 개발자 앱 | developers.kakao.com → 내 애플리케이션 → 사이별 |

Vercel은 대표 주소 외에 브랜치 주소(`saibyeol-git-main-….vercel.app`)와 배포별 주소(`saibyeol-<랜덤>-….vercel.app`)도 만든다. **사용자에게는 대표 주소만 쓴다.** 초대 링크는 코드가 Vercel의 대표 도메인을 자동으로 읽어 만든다(`apps/web/src/lib/base-url.ts`).

## 배포 흐름

`main` 브랜치에 push → Vercel이 자동으로 빌드·배포 (1~3분). 빌드 명령 `vercel-build` = `drizzle-kit migrate && next build` 이므로 **스키마 변경(마이그레이션 파일)이 있으면 배포 중에 운영 DB에 자동 적용된다.** 되돌리기 어려우므로 스키마 변경은 `docs/data-model.md`를 먼저 고치고 소유자에게 알린 뒤 한다.

Root Directory는 `apps/web`. Node 22.x.

## 환경 변수 (Vercel → Settings → Environments → Production)

| 이름 | 값이 있는 곳 | 비고 |
| --- | --- | --- |
| `DATABASE_URL` | Neon 콘솔 → Connect (pooled) | **2026-10-20에 대화에 노출됨 → 비밀번호 Reset 후 교체 권장(미완)** |
| `AUTH_SECRET` | 2026-10-20 생성한 무작위 값 | 바꾸면 모든 로그인 세션이 풀린다 |
| `AUTH_TRUST_HOST` | `true` | Vercel 프록시 뒤에서 필요 |
| `AUTH_KAKAO_ID` | 카카오 콘솔 → 플랫폼 키 → REST API 키 | |
| `AUTH_KAKAO_SECRET` | 카카오 콘솔 → 플랫폼 키 → REST API 키 → Client Secret (활성화 "사용함") | |
| `NEXT_PUBLIC_APP_URL` | (선택) 직접 지정할 때만 | 없으면 Vercel 대표 도메인 자동 사용 |

`DEV_LOGIN`은 배포에 넣지 않는다. 넣어도 production에서는 켜지지 않지만, 없는 게 깔끔하다.

로컬 개발은 `apps/web/.env.example`을 `.env`로 복사. 로컬 Postgres는 포트 54329, 소켓 `/tmp`.

## 카카오 로그인 설정

- 동의항목: 닉네임만 (필수). 이메일·프로필 사진은 요청하지 않는다(비즈 앱 심사 불필요).
- Redirect URI (등록된 값): `https://saibyeol.vercel.app/api/auth/callback/kakao`
- Client Secret은 생성 후 **활성화 상태를 "사용함"으로** 바꿔야 한다.

### 겪은 문제와 해결

| 날짜 | 증상 | 원인 | 해결 |
| --- | --- | --- | --- |
| 10/20 | Prisma 설치 실패 (403) | 작업 환경에서 엔진 바이너리 다운로드 차단 | Drizzle ORM으로 교체 |
| 10/20 | 첫 배포에 환경 변수 없음 | 배포 시 입력 누락 | Environments → Production에서 추가 후 Redeploy |
| 10/20 | 카카오 로그인 KOE006 | Redirect URI 불일치 — 배포별 임시 주소에서 로그인 시도 | 대표 주소로 Redirect URI 등록, 대표 주소로만 접속 |
| 10/23 | 초대 링크가 잘못된 주소로 생성, 상대가 열면 오류 | 링크를 "현재 요청의 호스트"로 만들어 Vercel 내부 주소가 섞임 | `base-url.ts`: Vercel 대표 도메인(`VERCEL_PROJECT_PRODUCTION_URL`) 우선 사용. error.tsx/not-found.tsx 추가 |

## 해야 할 운영 작업

- [ ] Neon `neondb_owner` 비밀번호 Reset → Vercel `DATABASE_URL` 교체 → Redeploy (대화 노출 때문)
- [ ] Neon 리전 아시아 이전 (사용자 늘면)
- [ ] 도메인 구입·연결 (Vercel → Domains). 연결하면 초대 링크가 자동으로 새 도메인을 쓴다. 카카오 Redirect URI도 새 도메인으로 추가 등록
- [ ] 개인정보 처리방침·이용약관 페이지 (상용화 전 법률 검토)
- [ ] 만 14세 미만 가입 차단
- [ ] 오류 모니터링 (Vercel 로그 외 별도 도구는 아직 없음)

## 확인 명령

```
npm test                     # 전체 테스트 (웹 통합 테스트는 로컬 DB 필요)
npm run typecheck
npm run dev                  # http://localhost:3000
npm run demo -w @saibyeol/engine-saju -- 1990-05-15 14:30 1988-12-03 없음
npx tsx apps/web/scripts/pair-demo.ts 23      # 무작위 두 사람 카드·해설
npx tsx apps/web/scripts/card-demo.ts 1988-12-03 없음   # 프로필 카드 한 장
```
