# 사이별 (saibyeol)

> 같은 나라도, 사이마다 다르게.

사이별은 **내가 아는 사람과의 관계를, 관계마다 다르게 읽어주는 관계 이해 서비스**다.
자기 분석 서비스도, 낯선 사람 매칭 서비스도 아니다.

이 파일은 이 레포에서 작업하는 모든 세션이 먼저 읽는 규칙이다. 제품의 세부 결정은 `docs/product-spec.md`에 있고, 이 파일과 충돌하면 이 파일이 우선한다.

## 1. 세 층의 분리 (절대 섞지 않는다)

| 층 | 내용 | 어디에 드러나는가 |
| --- | --- | --- |
| 비전 | 모든 관계를 이해하는 출발선 | 미션, 장기 로드맵 |
| 제품의 첫 문장 | 내가 아는 사람과의 관계를 각자 다르게 읽어준다 | 이름, 첫 화면, 스토어 설명, 공유 카드 |
| 해석 엔진 | 생년월일시 기반 성향 분석 (첫 번째 엔진, 교체 가능) | 설정 화면, 결과 카드 하단의 작은 출처 표기에만 |

- "사주"라는 단어는 세 번째 층에만 속한다. UI 문구, 라우트 이름, 공개 API 이름, 마케팅 카피 어디에도 주인공으로 쓰지 않는다.
- 코드 내부 식별자는 `saju`를 써도 된다. 사용자에게 보이는 문자열은 안 된다.

## 2. 작업 방식

- 이 레포의 소유자는 코딩 경험이 없는 서비스 기획자다. 모든 구조적 결정은 **먼저 한국어로 쉽게 설명하고, 동의를 받은 뒤** 구현한다. 전문 용어를 쓸 때는 한 줄 풀이를 붙인다.
- 한 번에 하나의 기능만 만든다. `docs/product-spec.md` 3절의 순서(1 → 2 → 3 → 4 → 5)를 따른다.
- 되돌리기 어려운 결정(데이터베이스 스키마 변경, 외부 서비스 연동, 결제, 배포 설정)은 반드시 멈추고 물어본다.
- 커밋 메시지와 PR 설명은 한국어로 쓴다. 코드 주석은 한국어, 식별자는 영어.
- 테스트 없이 해석 엔진을 수정하지 않는다. 엔진은 순수 함수이며 입력이 같으면 출력이 같아야 한다.

## 3. 코드 구조 규칙

### 해석 엔진은 교체 가능한 모듈이다
엔진 인터페이스는 두 함수로 고정한다.

```
derive(sourceData) -> DerivedProfile
compare(profileA, profileB, relationshipType) -> CompatibilityVector
```

- 첫 번째 엔진의 이름은 `saju`. `DerivedProfile.engine` 필드에 기록한다.
- 엔진 코드는 자기 폴더 밖의 어떤 것도 import하지 않는다. 데이터베이스, HTTP, 세션에 접근하지 않는다.
- 새 엔진(MBTI 등)을 추가할 때 기존 엔진과 호출부를 수정하지 않아도 되어야 한다.

### SourceData는 격리한다
- 생년월일, 출생시간, 성별, 양음력 여부는 `SourceData`에만 저장한다.
- `SourceData`를 읽는 코드는 (a) 본인 세션의 조회·수정·삭제, (b) `derive()` 호출 직전의 로더, 이 둘뿐이다. 그 외의 어떤 모듈도 `SourceData`를 import하거나 조회하지 않는다.
- 관계 분석(`compare`), 결과 카드, 공유 이미지, 관계 목록, 로그, 에러 메시지에 `SourceData`의 값이 흘러갈 수 있는 경로를 만들지 않는다. 의심되면 테스트로 막는다.
- 공유 카드 이미지 생성 함수는 입력으로 `Narrative.shareableExcerpt`와 호칭만 받는다. `SourceData`나 `DerivedProfile` 전체를 받지 않는다.

### Edge는 관계 유형을 여러 개 가질 수 있다
- `RelationshipEdge.types`는 배열이다. 배우자는 `["family", "romance"]`가 될 수 있다.
- `CompatibilityVector`와 `Narrative`는 `(edgeId, relationshipType)` 쌍마다 한 행이다.

### 상태 전이는 한 곳에서만
- Edge 상태는 `candidate → active → revoked` 세 가지뿐이다.
- 전이는 `activateEdge()`, `revokeEdge()` 두 함수에서만 일어난다. 다른 곳에서 `state` 필드를 직접 쓰지 않는다.
- `active`로 가는 유일한 조건은 **상대방 본인이 자신의 SourceData를 입력한 것**이다. 초대한 쪽이 대신 입력할 수 있는 경로를 만들지 않는다.

### 삭제는 연쇄한다
- `SourceData` 삭제 → 그 사용자의 `DerivedProfile` 삭제 → 그 사용자가 속한 모든 Edge `revoked`.
- 상대방 화면에서는 "상대가 정보를 삭제했어요"로 바뀐다. 상대의 데이터는 건드리지 않는다.

## 4. 사용자에게 보이는 문장의 규칙

`docs/product-spec.md` 8절이 원본이다. 코드에 문구를 넣을 때 아래를 지킨다.

- 총점, 등급, 순위, "OO점", "S급"을 만들지 않는다. 차원별 세 단계(잘 맞아요 / 다른 결이에요 / 부딪힐 수 있어요)만 쓴다.
- "운명", "천생연분", "악연", "상극", "헤어지는 게", "멀리하세요"를 쓰지 않는다.
- 명리 용어(일간, 월령, 편관, 오행 상극 등)를 사용자 문구에 쓰지 않는다.
- 단정형("~입니다") 대신 경향형("~한 편입니다", "~할 수 있습니다").
- 건강·금전·수명을 언급하지 않는다.
- 직장동료 유형에서 "누가 더 유능한가", "누가 리더에 맞는가"로 읽힐 수 있는 문장을 쓰지 않는다.
- 모든 결과 속장 하단에 고정 문구: "이 해석은 두 분의 타고난 성향을 바탕으로 한 참고 자료이며, 관계를 판단하거나 미래를 예측하지 않습니다."

## 5. 첫 버전의 범위

- 웹만. 네이티브 앱, 연락처 연동, 결제, AI 생성 해설, 관계 이벤트, 그래프 시각화는 모두 다음 버전 (`docs/product-spec.md` 9절).
- 관계 유형: 가족, 친구, 연인, 직장동료.
- 기능 다섯 개: 내 프로필 카드 → 초대 링크와 관계 활성화 → 관계 유형별 해설 → 내 관계 목록 → 결과 카드 공유.
- 언어는 TypeScript 하나(엔진·서버·화면). 2026-10-19 확정. 만세력 계산은 `lunar-typescript`에 맡기고 한국 기준 보정은 우리 코드에서 한다(`docs/dimensions.md` 만세력 관례).
- 레포 구조는 npm workspaces. 엔진은 `packages/engine-saju`, 웹(화면+서버)은 `apps/web`.
- 웹 스택(2026-10-19 확정): Next.js(App Router, Turbopack) + Drizzle ORM + PostgreSQL + Auth.js(카카오). 배포는 Vercel, 운영 DB는 Neon 또는 Supabase 예정. Prisma는 이 작업 환경에서 엔진 바이너리를 내려받을 수 없어 쓰지 않는다.
- 로컬 개발: `apps/web/.env.example`을 `.env`로 복사. 개발용 로그인은 `DEV_LOGIN=1`이고 production에서는 절대 켜지지 않는다. 스키마를 바꾸면 `docs/data-model.md`를 먼저 고치고 `npm run db:generate -w @saibyeol/web` → `npm run db:migrate -w @saibyeol/web`.
- 서버 모듈 지도: `src/server/source-data.ts`(원천정보 — 유일한 접근점), `src/server/profile.ts`(파생 프로파일·호칭), `src/server/edges.ts`(관계 생성·활성화·철회·조회), `src/server/narrative/`(해설 템플릿·렌더러). 서버 액션은 `src/app/actions.ts`.
- `apps/web/test/source-data-isolation.test.ts`가 SourceData 격리를 검사한다. 이 테스트를 느슨하게 만드는 변경은 하지 않는다.
- 확인 명령: `npm test` (전체 테스트, 웹 통합 테스트는 DATABASE_URL 필요), `npm run typecheck`, `npm run dev` (http://localhost:3000), `npm run demo -w @saibyeol/engine-saju -- 1990-05-15 14:30 1988-12-03 없음`.

## 6. 문서 지도

| 파일 | 내용 |
| --- | --- |
| `docs/product-spec.md` | 제품 명세서 v0.1 전체. 결정사항의 원본 |
| `docs/data-model.md` | 엔티티, 필드, 상태 전이, 접근 규칙 |
| `docs/dimensions.md` | 관계 유형별 해설 차원 정의. 명리 규칙 대응표는 아직 비어 있음 |
| `docs/narrative-templates.md` | 해설 문장 템플릿. 형식과 예시 한 차원만 있음, 나머지는 기획자가 작성 |
| `docs/patent-concepts.md` | 특허 발명설명서의 개념을 개발 용어로 번역한 요약 |

문서에 없는 결정을 내려야 하면, 코드에 박아 넣기 전에 해당 문서에 먼저 적고 소유자에게 알린다.
