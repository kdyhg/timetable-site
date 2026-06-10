# 해강고 2학년 10반 학급 안내 허브

학생 로그인 없이 시간표, 급식, 공지, 학사일정, 평가·제출 일정과 2028 진로진학 자료를 확인하는 공개형 Next.js 사이트입니다. 담임은 사이드바 하단의 숨김 진입점으로 관리자 화면에 들어가 관리형 콘텐츠를 등록합니다.

## Local development

```bash
npm install
npm run dev
```

`.env.example`을 참고해 `.env.local`에 환경 변수를 설정합니다. `SUPABASE_SERVICE_ROLE_KEY`와 `ADMIN_PASSWORD`는 서버에서만 사용하며 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다. 기존 관리자 화면의 클라이언트 확인을 위해 배포 환경에는 `NEXT_PUBLIC_ADMIN_PASSWORD`도 같은 값으로 설정합니다.

## Supabase setup

Supabase SQL Editor에서 [`supabase/migrations/20260610_public_class_hub.sql`](supabase/migrations/20260610_public_class_hub.sql)을 실행합니다. 이 마이그레이션은 다음 항목을 추가합니다.

- 공지 분류, 마감일, 게시기간, 링크와 첨부파일 정보
- 시험·수행평가·제출·준비물용 `class_items`
- 진학 가이드·용어사전용 `career_resources`
- 공개 다운로드용 `class-files` Storage 버킷

학생 조회는 공개 RLS 정책을 사용하고 등록·수정·삭제·파일 업로드는 서버의 Service Role 키로 처리합니다.

## Verification

```bash
npm run lint
npm run build
```
