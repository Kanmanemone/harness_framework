# 프로젝트 소개

이 저장소는 [jha0313/harness_framework](https://github.com/jha0313/harness_framework)를 포크해서 만든 작업 저장소입니다. [jha0313/harness_framework](https://github.com/jha0313/harness_framework)는 하네스 엔지니어링을 실습하기 위한 뼈대(템플릿) 역할입니다.

원본 저장소의 제작자님이 직접 올린 [소개 영상](https://www.youtube.com/watch?v=AQOvNx87Urs)의 흐름을 따라가며 (하네스 엔지니어링 실습을) 작업했습니다.

## 작업 방식과 기록 구조

이 프로젝트는 사용자가 Claude Code에게 던진 질문, 그에 따른 Claude Code의 대답, 그리고 실제 파일 변경을 묶어 하나의 작업 단위로 삼았습니다. 그리고 이 작업 단위는 (본 프로젝트에서) 커밋의 단위기도 합니다.

각 커밋에는 Claude Code와의 대화 기록를 담은 txt 파일을 포함합니다. 따라서 txt 파일을 읽어, 해당 커밋이 어떤 사용자 질문에서 시작되었는지를 알 수 있습니다.

---

## Claude Code와의 대화 기록 속 사용자 질문 모음

아래 목록은 루트 디렉토리의 세션 텍스트 파일에서 `❯`로 시작하는 사용자 질문과 요청을 추출한 것입니다.

### session-001-conversation-001.txt

> ❯ 우리 프로젝트 하나 기획 같이 해보자. 유튜브 댓글을 분석해서 센티먼트
> 분석을 수행하고, 피드백과 함께 내가 개선해야 할 점, 잘하고 있는 점들을
> 분석해 주는 유튜브 댓글 분석 앱을 만들고 싶어.

---

### session-001-conversation-002.txt

> ❯ 더 리뷰하고 개선점 찾아줘. 분명히 더 필요한 부분이 있을 거야. 특히 PRD,
> Architecture, ADR 이 세 개는 더 채워줘야 돼. 더 enrich하게 만들어야 돼.
> 디테일 하나도 빠져있으면 안 되고, 에러 케이스, 엣지 케이스, 에러 핸들링
> 하나도 빠져 있으면 안 돼.

---

### session-002-conversation-001.txt

> ❯ 이 프로젝트 하네스 세팅이 잘 안 되어 있을 거거든? 너가 보고 세팅 개선해야
> 될 점들과 부족한 점들을 다 파악해서, 고칠 플랜을 만들어.

---

### session-002-conversation-002.txt

> ❯ 바뀐 구조에서 Hooks가 몇 개 있는 거 같아. Hooks가 뭐뭐 있는지 일단 한 번
> 정리해주고 분석해줘. 그리고 Hooks가 잘 동작해야 할 거야. 그러니 테스트를
> 해봐야 해. 테스트 해보고 안 되면 고쳐줘

---

### session-001-conversation-003.txt

> ❯ 그래도 내가 봤을 때는 좀 더 부족한 점이 보이는 것 같아. 한번 더 문서들을
> 다 훑어보고 확인하고 빠진 부분들을 다 체크해. 특히 사용자 경험이 중요해.
> 그거에 좀 더 초점을 맞춰서 다시 한번 리뷰해줘.

---

### session-001-conversation-004.txt

> ❯ /harness

> ❯ 승인

> ❯ limit 때문에 중단된 작업 이어서 해줘

---

### session-001-conversation-005.txt

> ❯ python scripts/execute.py 0-mvp

---

### session-001-conversation-006.txt

> ❯ 다음 step도 이어서 진행해줘

---

### session-001-conversation-007.txt

> ❯ 다음 step도 이어서 해줘. 그냥 step 다 끝날 때까지 알아서 해.

---

### session-001-conversation-008.txt

> ❯ 생각해보니까, 내게 API 토큰이 없다는 걸 깨달았어. 무료 토큰을 제공하는
> Gemini API를 쓰고 싶어. 변경해줘.

> ❯ 진행해줘

> ❯ limit 회복됐어. 다시 재개해줘.

> ❯ 근데 어떻게 실행시켜?

---

### session-001-conversation-009.txt

> ❯ Gemini API에서 429 TooManyRequests 에러가 떠. 단순히 요청 횟수가
> 많아서인지 아니면, 요청 빈도가 높아서인지는 모르겠어.

> ❯ "분석" 버튼을 누르니, "Gemini API 할당량을 초과했습니다. 잠시 후 다시
> 시도해 주세요."라는 텍스트가 떴어.

> ❯ "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." 라네.

> ❯ 아니, 동영상 한 개를 분석 요청한 건데 이래. 동영상에 달린 댓글의 갯수가
> 많아서 그런걸까?

> ❯ 그래도 계속 발생해

> ❯ [Gemini API Error] {
> status: 429,
> errorStatus: 'RESOURCE_EXHAUSTED',
> message: 'Your prepayment credits are depleted. Please go to AI Studio
> at https://ai.studio/projects to manage your project and billing. Learn
> more at https://ai.google.dev/gemini-api/docs/billing#prepay. '
> }

> ❯ 그럼에도 안돼. 혹시, "TPM (Tokens Per Minute): 분당 처리할 수 있는
> 토큰(텍스트량) 제한" 때문은 아닐까? 그리고 맞다면, TPM을 우회할 수
> 있을까?

> ❯ [Gemini API Error] {
> status: 429,
> errorStatus: 'RESOURCE*EXHAUSTED',
> message: 'You exceeded your current quota, please check your plan and
> billing details. For more information on this error, head to:
> https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your
> current usage, head to: https://ai.dev/rate-limit. \n' +
> '* Quota exceeded for metric:
> generativelanguage.googleapis.com/generate*content_free_tier_requests,
> limit: 0, model: gemini-2.0-flash\n' +
> '* Quota exceeded for metric:
> generativelanguage.googleapis.com/generate_content_free_tier_requests,
> limit: 0, model: gemini-2.0-flash\n' +
> '\* Quota exceeded for metric: generativelanguage.googleapis.com/gener
> ate_content_free_tier_input_token_count, limit: 0, model:
> gemini-2.0-flash\n' +
> 'Please retry in 2.191423225s.'
> }

> ❯ 잠시만, 내가 진짜 문제를 찾은거 같은데. Gemini 2.5 Flash를 써 봐.

---

### session-001-conversation-010.txt

> ❯ 이번엔 "분석 결과를 처리하지 못했습니다. 다시 시도해 주세요."라는 에러가
> 뜨네. 그런데, 이렇게 주먹구구식으로 일을 진행하고 싶지 않아. 앱에서는 API
> Key를 사용자가 입력하지만, 개발 단계에서는 ".env" 파일에서 API Key를
> 읽어서 너가 스스로 테스트할 수 있게 바꿔야 겠어. 에러 분석에 앞서 먼저
> 구조부터 바꾸자.

> ❯ 방금 plan에 대해 "clear context (68% used) and auto-accept edits (shift+tab)" 수행

---

### session-001-conversation-011.txt

> ❯ 프로젝트 루트에 있는 .env.example에 api key를 입력했어. 이제 이걸 가지고
> 너가 무사히 실행까지 시켜 봐. 중간에 일어나는 에러같은 걸 전부 알아서
> 잡아서 진행해.

> ❯ "분석 결과를 처리하지 못했습니다. 다시 시도해 주세요."라고 뜨는데...
> 정말로 될 때 까지 진행해줘. "https://www.youtube.com/watch?v=wtNdUANBIl0"
> 이 영상을 기준으로 테스트해봐.

> ❯ 방금은 로컬 저장소 부족으로 작동이 중단되었어. 하던 거 다시 진행해줘.

---

### session-001-conversation-012.txt

> ❯ 왼쪽에 사이드바를 두고, 영상 별로 목록을 생성하고 싶어. 영상을 요청할
> 때마다 사이드바에 결과 기록이 쌓이고, 목록 아이템을 클릭해서 예전 기록을
> 참조할 수 있는 거지.

> ❯ 방금 plan에 대해 "clear context and auto-accept edits (shift+tab)" 수행

> ❯ 목록 아이템의 제목은 동영상 제목으로 해줘

---

### session-001-conversation-013.txt

> ❯ 결과 화면에서 댓글을 누가 썼는지가 전부 "name" 또는 ""으로 되어 있네.
> 뭔가 문제가 있어. 진짜 이름을 표시하도록 수정.
