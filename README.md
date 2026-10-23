# 사이별 (saibyeol)

> 같은 나라도, 사이마다 다르게.

내가 아는 사람과의 관계를, 관계마다 다르게 읽어주는 관계 이해 서비스.

현재 상태: 엔진(`packages/engine-saju`)과 웹(`apps/web`, 기능 1~4)이 돌아간다. Vercel에 배포되어 있고 카카오 로그인 연결 중.

```
npm install
npm test
npm run demo -w @saibyeol/engine-saju -- 1990-05-15 14:30 1988-12-03 없음
```

- 작업 규칙: [`CLAUDE.md`](CLAUDE.md)
- 제품 명세: [`docs/product-spec.md`](docs/product-spec.md)
- 데이터 모델: [`docs/data-model.md`](docs/data-model.md)
- 해설 차원: [`docs/dimensions.md`](docs/dimensions.md)
- 해설 템플릿: [`docs/narrative-templates.md`](docs/narrative-templates.md)
- 특허 개념 대응: [`docs/patent-concepts.md`](docs/patent-concepts.md)
