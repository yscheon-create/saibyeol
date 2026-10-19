# 데이터 모델

`product-spec.md` 6절의 상세판. 스키마를 코드로 옮길 때 이 문서를 기준으로 한다. 아직 데이터베이스 종류는 정하지 않았으므로 타입은 일반적인 이름으로 적는다.

## 엔티티

### User
서비스 계정. 상대방에게 보이는 것은 `displayName`뿐이다.

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 기본 키 |
| displayName | string | 호칭. 실명일 필요 없음 |
| authProvider | enum | `kakao` \| `email` (첫 버전은 하나만 쓸 예정) |
| authSubject | string | 로그인 제공자가 주는 식별자 |
| createdAt | timestamp | |
| deletedAt | timestamp? | 탈퇴 시각. 값이 있으면 모든 조회에서 제외 |

### SourceData (비공개)
개인 원천정보. **본인 세션과 `derive()` 로더만 읽는다.** 자세한 접근 규칙은 아래 "접근 규칙".

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| userId | uuid | User 1:1 |
| birthDate | date | 입력한 달력 기준의 날짜 |
| calendarType | enum | `solar` \| `lunar` |
| isLeapMonth | boolean | 음력 윤달 여부. 양력이면 false |
| birthTime | time? | null이면 "모름" |
| birthTimeKind | enum? | `exact`(시:분) \| `branch`(子~亥 시간대) \| null |
| gender | enum | `female` \| `male` |
| updatedAt | timestamp | |

### DerivedProfile
SourceData에서 엔진이 만든 파생값. 관계 엔진과 프로필 카드가 읽는다.

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| userId | uuid | User 1:1 (엔진당 하나. 첫 버전은 엔진이 하나이므로 사실상 1:1) |
| engine | string | `"saju"` |
| engineVersion | string | 엔진 코드의 버전. 규칙이 바뀌면 올린다 |
| hasBirthTime | boolean | 시주 계산 여부 |
| pillars | json | 년·월·일·시주의 천간·지지. 시주는 null 가능 |
| elementDistribution | json | 오행 분포 |
| tenGods | json | 십신 배치 |
| traitDimensions | json | 차원별 개인 성향값. 키는 `dimensions.md`의 차원 이름 |
| summaryText | string | 프로필 카드용 성향 요약 |
| computedAt | timestamp | |

`pillars`, `elementDistribution`, `tenGods`는 엔진 내부 중간값이다. 사용자 화면에는 `traitDimensions`와 `summaryText`만 쓴다.

### RelationshipEdge
두 사용자 사이의 관계. 방향은 없지만 `userAId`가 초대한 쪽이다.

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | |
| userAId | uuid | 초대한 사람 |
| userBId | uuid? | 초대받은 사람. candidate 동안은 null일 수 있다 |
| counterpartLabel | string | A가 B를 부르는 이름. B가 가입하기 전부터 존재한다 |
| state | enum | `candidate` \| `active` \| `revoked` |
| types | enum[] | `family` \| `friend` \| `romance` \| `coworker` 중 하나 이상 |
| inviteToken | string | 128비트 이상 난수. 만료 14일 |
| inviteExpiresAt | timestamp | |
| createdAt | timestamp | |
| activatedAt | timestamp? | B 입력 시각 |
| revokedAt | timestamp? | |
| revokedBy | uuid? | 철회한 사람 |

같은 두 사람 사이에 Edge는 하나다. 관계 유형을 더하고 싶으면 `types`에 추가한다.

### CompatibilityVector
Edge × 관계 유형마다 한 행.

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| edgeId | uuid | |
| relationshipType | enum | |
| dimensions | json | `{ communication: 0.72, emotional: 0.41, ... }` 0~1 실수 |
| confidence | enum | `high` \| `mid` \| `low` (5절 규칙) |
| hiddenDimensions | string[] | 시주 없음으로 숨긴 차원 |
| engineVersion | string | |
| computedAt | timestamp | |

### Narrative
Edge × 관계 유형마다 한 행. 사용자가 읽는 문장.

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| edgeId | uuid | |
| relationshipType | enum | |
| headline | string | 40자 이내 |
| bestDimension | string | 겉장에 쓰는 가장 잘 맞는 차원 |
| frictionDimension | string | 겉장에 쓰는 가장 부딪히는 차원 |
| sections | json[] | `{ dimension, level, observation, interplay, howTo }` 차원 순서대로 |
| shareableExcerpt | json | 겉장 전체. 공유 카드 생성 함수는 이것만 받는다 |
| templateVersion | string | 템플릿 세트 버전 |
| generatedAt | timestamp | |

### 다음 버전용 (설계만, 구현 안 함)

- `RelationshipEvent(id, edgeId, type, note, occurredAt, createdBy)`
- `RelationshipEdge.observedState json?`

## 상태 전이

```
candidate ──activateEdge(B가 SourceData 입력)──▶ active ──revokeEdge(한쪽 철회 또는 탈퇴)──▶ revoked
```

- `activateEdge(edgeId, userBId)`: B의 SourceData와 DerivedProfile이 존재할 때만 성공. `userBId`를 채우고 `state=active`, `activatedAt` 기록. 이어서 `types`의 각 유형에 대해 `compare()`와 Narrative 생성을 실행한다.
- `revokeEdge(edgeId, byUserId)`: 되돌릴 수 없다. Vector와 Narrative는 삭제한다(보관하지 않는다).
- 그 외의 전이는 없다. `revoked → active`로 돌아가려면 새 Edge를 만든다.

## 접근 규칙

| 읽는 주체 | User | SourceData | DerivedProfile | Edge | Vector / Narrative |
| --- | --- | --- | --- | --- | --- |
| 본인 세션 | 본인 전체 | 본인 전체 | 본인 전체 | 본인이 속한 것 | 본인이 속한 active Edge의 것 |
| 상대방 세션 | displayName만 | 없음 | 없음 | active인 것만 | active Edge의 것 |
| 초대 링크 열람(비로그인) | A의 displayName | 없음 | A의 summaryText 일부 | 해당 Edge의 counterpartLabel, types | 없음 |
| derive() 로더 | 없음 | 해당 사용자 1건 | 쓰기 | 없음 | 없음 |
| compare() | 없음 | **없음** | 두 사용자의 것 | 없음 | 쓰기 |
| 공유 카드 생성 | displayName 둘 | **없음** | **없음** | 없음 | shareableExcerpt만 |
| 로그·모니터링 | id만 | **없음** | 없음 | id, state | 없음 |

굵은 "없음"은 코드 리뷰와 테스트로 반드시 막는 항목이다.

## 삭제 연쇄

`deleteUser(userId)` 한 함수로만 수행한다.

1. SourceData 삭제 (물리 삭제)
2. DerivedProfile 삭제 (물리 삭제)
3. 그 사용자가 속한 모든 Edge → `revokeEdge`
4. User.deletedAt 기록. displayName은 "탈퇴한 사용자"로 교체

상대방의 데이터는 어떤 것도 건드리지 않는다.
