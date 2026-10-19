# 특허 개념 → 개발 용어 번역

출처: 「관계 유형별 정합도 정보를 생성하고 개인 관계 네트워크에 축적·관리·시각화하는 컴퓨터 구현 방법, 시스템 및 이를 위한 컴퓨터 판독가능 기록매체」 발명설명서 초안 (2026). 원문은 프로젝트 파일에 있다.

이 문서는 특허의 개념이 코드의 어디에 해당하는지를 짝지어, 구현이 청구항의 구조에서 벗어나지 않게 하기 위한 것이다. 법률 문서가 아니며, 특허 출원 전략은 변리사와 정한다.

## 개념 대응표

| 특허 용어 | 코드/데이터 모델에서의 이름 | 첫 버전 구현 여부 |
| --- | --- | --- |
| Personal Source Data (개인 원천정보) | `SourceData` | O |
| Personal Derived Profile (개인 파생 프로파일) | `DerivedProfile` | O |
| 파생 프로파일 생성부 | `derive()` 함수 (엔진 모듈) | O |
| Relationship Context (관계 컨텍스트) | `RelationshipEdge.types`의 각 값, `relationshipType` | O (4종) |
| Relationship Compatibility Vector (관계 정합도 벡터) | `CompatibilityVector` (유형별 한 행) | O |
| 관계 정합도 산출부 | `compare()` 함수 (엔진 모듈) | O |
| Relationship Edge | `RelationshipEdge` + 그에 딸린 Vector·Narrative | O |
| Relationship Graph (개인 관계 그래프) | 한 사용자를 중심으로 한 Edge 목록. 첫 버전은 "내 관계 목록" 화면 | 목록만 O, 그래프 그림은 X |
| 관계 후보 (Relationship Candidate) | `Edge.state = candidate` | O |
| 관계 활성화부 / 상대방 자기입력에 의한 활성화 | `activateEdge()` — B의 SourceData 입력에 응답 | O |
| 양방향 관계 활성화 | active Edge가 A와 B 양쪽 목록에 모두 보임 | O |
| 연락처 접근 및 사용자 식별부 | (첫 버전 없음) A가 호칭을 직접 입력 | X — 다음 버전 |
| 개인정보 보호 처리부 / 원천정보 비공개 | `data-model.md` 접근 규칙, SourceData 격리 | O |
| 관계 이벤트 수집부 | `RelationshipEvent` (설계만) | X — 다음 버전 |
| Relationship Confidence | `CompatibilityVector.confidence` — 첫 버전은 출생시간 유무 규칙값 | 규칙값만 O |
| Predicted vs Observed Relationship State | confidence(예측) / `observedState`(관측, 설계만) | 예측만 O |
| 관계 정보 시각화부 | 결과 카드, 관계 목록, 공유 카드 | 카드·목록 O, 레이더·그래프·타임라인 X |
| AI 활용 실시예 (설명 생성) | (첫 버전 없음) 템플릿 기반 Narrative | X — 다음 버전 |
| 사주·명리학 실시예 | `saju` 엔진 | O |
| 다른 파생 프로파일 소스 (MBTI 등) | 엔진 인터페이스로 자리만 확보 | 인터페이스만 O |

## 청구항 1의 단계와 코드의 대응

| 청구항 단계 | 코드 위치 (예정) |
| --- | --- |
| (a) 제1 사용자 원천정보 수신 | 내 정보 입력 화면 → `SourceData` 저장 |
| (b) 제1 개인 파생 프로파일 생성 | `derive()` → `DerivedProfile` |
| (c) 연락처 또는 사용자 지정정보로 제2 사용자 식별 | 상대 등록 화면 (`counterpartLabel`) → `Edge(candidate)` |
| (d) 제2 사용자의 자기입력 또는 승인에 응답하여 제2 파생 프로파일 생성 | 초대 링크 → B의 입력 → `derive()` → `activateEdge()` |
| (e) 관계 컨텍스트별 정합도 산출규칙으로 복수 관계별 정합도 산출 | `compare(A, B, type)` × `Edge.types` |
| (f) 관계 정합도 데이터 구조로 구성 | `CompatibilityVector` 행들 |
| (g) 그래프 노드로 연결, 정합도를 관계 엣지의 속성으로 저장 | `RelationshipEdge` + Vector (edgeId 외래키) |
| (h) 정합도 데이터 구조 중 일부를 단말에 표시 | 결과 카드 |

종속항 2(원천정보 비공개), 3(유형별 상이한 산출), 4(후보→활성 양방향), 6(개인 관계 네트워크), 7(사주 실시예)은 첫 버전에서 구현된다. 종속항 5(관계 이벤트·상태 갱신)는 다음 버전이다.

## 구현할 때 지켜야 특허 논리가 유지되는 것

1. **같은 두 사람에게 유형별로 다른 결과가 나와야 한다.** `compare()`가 `relationshipType`을 무시하고 같은 점수를 돌려주면 청구항 3의 구조가 사라진다. 유형별로 차원 집합이 다르므로 자연히 지켜지지만, 공통 차원의 점수까지 유형에 따라 가중을 달리할지는 `dimensions.md`에서 정한다.
2. **정합도는 Edge의 속성으로 저장된다.** 요청할 때마다 계산해 버리고 저장하지 않는 구조로 만들지 않는다. 저장된 Vector가 Edge에 붙어 있어야 "축적"이 성립한다.
3. **활성화의 유일한 트리거는 상대의 자기입력이다.** A가 B의 생년월일을 대신 넣어 결과를 보는 경로는 특허의 차별점(과제 5)을 무너뜨리고 개인정보 측면에서도 문제다.
4. **원천정보와 파생정보의 저장·접근이 분리되어 있다.** 종속항 2의 근거다. `data-model.md` 접근 규칙 표를 테스트로 고정한다.
5. **엔진은 교체 가능하다.** "사주는 하나의 실시예"라는 특허의 입장과 일치한다. `saju` 엔진 밖에서 명리 개념을 참조하는 코드가 생기지 않게 한다.

## 선행기술과의 거리 (요약)

특허 문서 ⅩⅨ절의 논리를 구현 관점에서 한 줄씩 적는다.

- 개인 사주 분석 기술과 다르다: `DerivedProfile`은 최종 산출물이 아니라 `compare()`의 입력이다.
- 부족한 오행 보완자 매칭과 다르다: 사용자가 이미 아는 사람을 등록한다. 추천·검색 기능이 없다.
- 궁합 기반 채팅/매칭과 다르다: 새 상대를 찾지 않는다. 채팅 기능이 없다.
- 점성술+MBTI 매칭(US9002961B1)과 다르다: 핵심은 "known-contact → private derived profile → type-specific vector → edge → graph"의 데이터 구조이지 궁합 계산 자체가 아니다.
- SNS 관심사 compatibility(US9600583B2)와 다르다: 하나의 점수가 아니라 유형별 벡터이고, 그 벡터가 Edge 속성으로 저장·갱신된다.

첫 버전에서 "추천", "매칭", "탐색", "채팅" 중 어떤 것도 만들지 않는 것이 이 거리를 유지하는 가장 쉬운 방법이다.
