# 회원가입 수정 적용 절차

## 확인된 상태와 제한

- 2026-10-26, 로컬 설정에 연결된 Supabase Auth의 읽기 전용 `/auth/v1/settings` 조회에서 `mailer_autoconfirm=true`, `disable_signup=false`를 확인했다.
- 공개 키의 REST 스키마 루트 조회는 HTTP 401이지만, 실제 창고·고객사 API의 `select=id&limit=0` 조회는 기존 배포 키로 HTTP 200이다. 스키마 루트 접근 제한을 API 키 장애로 해석하지 않는다. 키 변경은 필요하지 않다.
- 로그인된 Supabase SQL Editor에서 실제 스키마·트리거·정책을 읽기 전용으로 확인했다. 이메일 충돌 0건, 인증 ID 중복 0건, 이메일/인증 연결 불일치 0건, 관리자 제외 업체 프로필이 없는 계정 47개였다. 이 47개 모두가 동일 원인으로 실패한 가입자라는 뜻은 아니다.
- 운영에는 업체 PII 암호화 트리거가 켜져 있었고 Auth 가입 트리거는 없었다. 짧은 문자열도 암호화 후 97자가 되지만 연락처 컬럼은 varchar(50)이므로 저장 실패가 발생한다. 관련 관리자 뷰 두 개의 의존성도 확인했다.
- 실제 www.33pl.co.kr 운영 호스팅은 Vercel이며 GitHub main 브랜치에 연결되어 있다. package.json의 `deploy`는 GitHub Pages 게시이므로 이 명령의 성공만으로 운영 반영을 판단하지 않는다. Vercel 배포 상태와 운영 HTML의 실제 JS 자산을 모두 확인한다.

## 이번 적용 검증

- 운영 SQL Editor에서 `20261026_atomic_registration.sql` 전체 트랜잭션 적용에 성공했다.
- 운영 `registration_smoke_test.sql` 결과: 신규 창고/고객사 생성, 암호화 연락처 저장, 실패 시 계정 롤백과 같은 이메일 재시도, 미완료 계정 복구 모두 PASS. 모든 테스트 변경은 ROLLBACK했으며 테스트 계정 잔여 0건을 확인했다.
- 운영 공개 `registration_preflight` API가 HTTP 200, `version=1`을 반환했다.
- 로컬 서비스/화면/DB 테스트 28개 및 프론트 빌드 통과. 변경 JS/JSX에 명시한 ESLint 규칙(미정의·미사용 변수 및 JSX 사용) 통과. 기존 전체 lint 명령은 저장소에 ESLint 설정 파일이 없어 실행되지 않는다.
- 저장소의 SQL들은 적용 순서가 일관되지 않으므로 파일 날짜만 보고 운영 상태를 추측하거나 전체 마이그레이션을 일괄 실행하지 않는다.

## 운영 적용 순서

1. 관리자 DB 연결로 `registration_preflight.sql`을 실행한다. 실제 컬럼, 기존 Auth 가입 트리거, RLS 정책과 권한을 검토한다. 다른 가입 트리거가 이미 프로필을 생성한다면 중복 실행되지 않도록 먼저 통합한다. 집계 결과에 이메일 충돌/인증 연결 충돌이 있으면 중단하고 해당 계정을 개별 확인한다. 자동 병합·삭제하지 않는다.
2. 운영과 동일한 설정의 테스트 DB에서 `migrations/20261026_atomic_registration.sql`을 단독 적용한다. 기존의 전화번호/담당자 암호화 트리거도 포함하여 검증한다. 이 SQL은 필요한 주소/인증 연결 컬럼과 암호화 PII 저장 길이를 보완한다. 의존하는 관리자 뷰의 정의·소유자·권한·옵션·주석은 같은 트랜잭션에서 보존한다. 예상 외의 의존 뷰가 있으면 전체 적용을 중단한다.
3. 신규 창고/고객사, 프로필 저장 실패 후 재가입, 기존 계정만 남은 가입자, 잘못된 비밀번호, 인증 전 이메일, 양쪽 테이블 이메일 중복을 확인한다. 별도 DB 연결 두 개에서 동일 이메일 가입/복구 요청을 겹쳐 보내 프로필이 하나만 생성되는지도 확인한다.
4. 운영 DB에 같은 SQL을 트랜잭션으로 적용한 다음, 새 프론트 빌드를 배포한다. 중간에 구버전 프론트로 가입하면 서버에서 거부되므로 두 적용을 가까운 시간에 진행하고 열린 가입 화면은 새로고침하도록 안내한다. 신규 프론트는 서버 준비 확인이 실패하면 Auth 계정을 생성하지 않는다.
5. `registration_preflight` 응답의 `version=1`을 확인하고 운영 가입을 점검한다. 오류 추적에는 결과 코드·발생 시각만 사용하고 이메일, 비밀번호, 업체 프로필, JWT, 원본 Auth 오류를 기록하지 않는다.

## 동작과 호환성

- Auth `AFTER INSERT` 트리거가 허용 목록의 업체 정보를 저장한다. 실패하면 계정·업체·이메일 예약이 함께 롤백된다. 업체 정보는 처리 후 Auth 메타데이터에서 제거한다.
- 기존 암호화 대상 필드는 text로 확장하고, 암호화·복호화 함수의 검색 경로는 실제 pgcrypto 확장 스키마로 고정한다. 암호화를 끄거나 기존 암호문을 잘라내지 않는다.
- 비공개 이메일 예약 테이블의 기본 키와 인증 ID 유일 제약이 동시 가입과 창고/고객사 간 중복을 막는다. 기존 이메일은 충돌 검사 후 공백 제거·소문자로 정규화한다.
- 공개 `registration_preflight(p_email)`은 프로토콜 버전과 등록 여부만 반환한다. 업체 정보는 공개하지 않는다. 공개 이메일 중복 확인에 대한 일반적인 API 요청 제한은 기존 Supabase/배포 인프라 설정을 유지한다.
- `complete_registration(p_user_type,p_profile,p_request_id)`은 JWT 본인 ID와 확인된 이메일만 사용한다. 계정 ID/이메일을 인자로 받지 않으며, 프로필이 이미 있으면 덮어쓰지 않는다. 같은 요청 ID 재확인은 성공으로 반환한다.
- 가입·복구는 별도 비영속 인증 클라이언트를 사용해 현재 로그인 세션을 바꾸지 않는다. 등록 후에는 기존 로그인 화면으로 로그인한다.
- 구버전의 직접 프로필 INSERT는 권한으로 차단한다. 업체 이메일·인증 연결·유형 변경은 별도 관리 작업이 필요하다. 타인 프로필 변경/삭제와 일반 회원의 승인 상태 변경을 트리거에서도 차단한다. 관리자의 정상 승인·삭제는 유지한다.
- 기존 레거시 비밀번호 로그인은 유지한다. 다만 기존에 익명 요청으로 허용되던 프로필 수정/삭제는 허용하지 않는다. 레거시 회원의 수정이 필요하면 본인 확인 후 인증 계정 연결 작업이 별도로 필요하다.
- 이메일 자동 확인을 끈 환경에서는 인증 메일 완료 후 같은 정보로 재시도한다. 기존 프로필이 이미 생성된 경우에는 중복 안내에 따라 로그인한다. 자동 이메일 재발송/비밀번호 재설정 개편은 이 변경에 포함하지 않는다.

## 로컬 검증

```powershell
node --test tests/registration.test.mjs tests/registration-forms.test.mjs
npm.cmd run build
```

DB 검증은 운영 DB를 사용하지 않는다. PGlite를 임시 폴더에 설치한 뒤 모듈 경로를 지정한다.

```powershell
$registrationRuntime = Join-Path ([System.IO.Path]::GetTempPath()) '33pl-registration-test-runtime'
npm.cmd install --prefix $registrationRuntime --no-save --package-lock=false @electric-sql/pglite@0.5.11
$registrationModule = Join-Path $registrationRuntime 'node_modules/@electric-sql/pglite/dist/index.js'
$env:PGLITE_MODULE = ([System.Uri]::new($registrationModule)).AbsoluteUri
node --test tests/registration-db.test.mjs
```

PGlite 검증은 실제 PostgreSQL 엔진에서 트리거·권한·롤백을 실행하지만 Supabase Auth HTTP 계층과 여러 독립 연결의 동시 실행을 대체하지 않는다. 운영 전 스테이징 검증을 생략하지 않는다.

운영 DB 자체 검증에는 `registration_smoke_test.sql`을 사용할 수 있다. 이 검증도 Auth HTTP 이메일 발송이나 실제 이용자 계정 변경 없이 합성 데이터를 만든 뒤 전체 ROLLBACK한다.

## 문제 발생 시

- 새 프론트를 되돌려 구버전의 분리 저장 방식으로 복구하지 않는다. 계정만 남는 문제가 재발할 수 있다.
- 신규 가입만 일시 중단하고 기존 로그인/조회는 유지한 채 오류 코드와 서버 트리거를 확인한다. 데이터베이스 변경은 이메일 예약·기존 연결 데이터를 보존한 후 별도 수정 마이그레이션으로 처리한다.
