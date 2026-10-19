# 해설 차원 정의

`product-spec.md` 7절의 차원 목록이 원본이다. 이 문서는 그 차원들을 엔진이 계산할 수 있는 형태로 내려가는 자리이며, **명리 규칙 대응표는 아직 비어 있다.** 이 표가 채워지기 전에는 `saju` 엔진의 `compare()`를 구현할 수 없다.

## 차원 목록 (코드 식별자)

| 식별자 | 적용 유형 | 사용자에게 보이는 이름 | 시주 의존 |
| --- | --- | --- | --- |
| communication | 공통 | 대화의 결 | low |
| emotional | 공통 | 감정의 온도 | mid |
| pace | 공통 | 생활의 속도 | low |
| friction | 공통 | 부딪히는 지점 | mid |
| expectation | family | 기대와 역할 | mid |
| support | family | 버팀목의 방식 | high |
| boundary | family | 거리의 감각 | mid |
| play | friend | 함께 노는 방식 | low |
| loyalty | friend | 곁에 있는 방식 | mid |
| honesty | friend | 솔직함의 수위 | mid |
| affection | romance | 애정 표현 | high |
| closeness | romance | 가까움과 거리 | high |
| future | romance | 앞을 보는 눈 | mid |
| conflict | romance | 다툰 뒤의 회복 | mid |
| role | coworker | 역할의 맞물림 | low |
| decision | coworker | 결정의 방식 | low |
| feedback | coworker | 피드백의 온도 | mid |
| distance | coworker | 일과 사적인 거리 | mid |
| pressure | coworker | 압박 속의 모습 | high |

유형별 차원 순서 = 공통 4개 → 유형 전용 순서대로. Narrative의 섹션 순서도 같다.

## 시주 의존 처리

- `high`: 한쪽이라도 `hasBirthTime=false`면 `CompatibilityVector.hiddenDimensions`에 넣고 결과에서 숨긴다.
- `mid`: 계산은 하되 Narrative에 "출생시간이 더해지면 더 정밀해져요" 안내를 붙인다.
- `low`: 영향 없음.

## 점수 → 단계

| 내부 점수 (0~1) | 단계 식별자 | 사용자에게 보이는 표현 |
| --- | --- | --- |
| 0.67 이상 | `aligned` | 잘 맞아요 |
| 0.34 ~ 0.66 | `different` | 다른 결이에요 |
| 0.33 이하 | `tense` | 부딪힐 수 있어요 |

경계값은 첫 사용자 테스트 뒤 조정한다. 총점은 계산하지 않는다.

## 엔진 계산의 두 단계

```
derive(sourceData)  → traitDimensions: { <차원>: { a: 개인값(들) } }
compare(A, B, type) → dimensions:      { <차원>: 0~1 }
```

`derive()`는 개인 한 명의 성향을 차원별로 뽑고, `compare()`는 두 사람의 성향을 차원별 규칙으로 맞물려 점수를 낸다. 같은 차원이라도 "비슷할수록 좋은" 것(pace)과 "보완될수록 좋은" 것(role)이 있으므로, 차원마다 비교 규칙을 따로 정한다.

## 명리 규칙 대응표 (미완 — 기획자/명리 자문이 채운다)

각 차원에 대해 세 가지를 정해야 한다.

1. **개인값**: 한 사람의 명식에서 이 차원을 읽는 데 쓰는 요소. 예: 일간의 음양, 특정 십신의 유무·위치·개수, 오행 분포의 편중, 지지의 특정 조합.
2. **비교 규칙**: 두 사람의 개인값을 어떻게 맞물려 0~1로 만들 것인가. 예: 같으면 높음 / 상생이면 높음 / 한쪽이 있고 한쪽이 없으면 중간.
3. **문장 단서**: 개인값이 어떤 행동 묘사로 번역되는가. `narrative-templates.md`의 관찰 문장에 들어간다.

| 차원 | 개인값 (명식 요소) | 비교 규칙 | 문장 단서 | 상태 |
| --- | --- | --- | --- | --- |
| communication | | | | 미정 |
| emotional | | | | 미정 |
| pace | | | | 미정 |
| friction | | | | 미정 |
| expectation | | | | 미정 |
| support | | | | 미정 |
| boundary | | | | 미정 |
| play | | | | 미정 |
| loyalty | | | | 미정 |
| honesty | | | | 미정 |
| affection | | | | 미정 |
| closeness | | | | 미정 |
| future | | | | 미정 |
| conflict | | | | 미정 |
| role | | | | 미정 |
| decision | | | | 미정 |
| feedback | | | | 미정 |
| distance | | | | 미정 |
| pressure | | | | 미정 |

작성 순서 제안: 공통 4개를 먼저 채우고 엔진을 돌려본 뒤, 유형별 차원으로 넓힌다. 공통 4개만으로도 첫 사용자 테스트는 가능하다.

## 엔진이 반드시 지켜야 하는 것

- 입력이 같으면 출력이 같다 (난수, 현재 시각, 외부 호출 없음).
- 개인값·비교 규칙은 이 문서에 적힌 것만 쓴다. 코드에만 있는 규칙은 없어야 한다.
- 규칙이 바뀌면 `engineVersion`을 올리고, 기존 Vector는 재계산 대상으로 표시한다.
- 대운·세운 등 시간에 따라 변하는 요소는 첫 버전에서 쓰지 않는다 (해설이 "지금의 두 사람"이 아니라 "타고난 결"에 머물도록).
