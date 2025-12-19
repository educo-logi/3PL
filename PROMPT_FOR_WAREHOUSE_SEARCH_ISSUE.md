# 창고 찾기 페이지 디버깅 프롬프트

## 프로젝트 개요
- **프로젝트명**: 3PL 물류대행 플랫폼
- **기술 스택**: React 18, Vite, Supabase (PostgreSQL), React Router (HashRouter)
- **배포 환경**: GitHub Pages (https://educo-logi.github.io/3PL/)
- **라우팅**: HashRouter 사용 (`#/warehouse-search` 형식)

## 문제 상황
**창고 찾기 페이지**(`/warehouse-search`)에서 창고 목록이 표시되지 않는 문제가 발생하고 있습니다.

### 증상
- 페이지는 로드되지만 창고 카드가 표시되지 않음
- "총 0개의 창고를 찾았습니다" 메시지 표시
- 콘솔에 에러 발생: `column warehouses.solution does not exist`

### 이미 해결한 오류들
1. ✅ `promise.catch is not a function` - Promise.all에서 async/await로 변경하여 해결
2. ✅ `column warehouses.temperature does not exist` - 쿼리에서 temperature 컬럼 제거하여 해결
3. ✅ `column warehouses.solution does not exist` - 쿼리에서 `solution`을 `solutions`로 변경하여 해결

### 현재 발견된 오류
**에러 메시지**: `column warehouses.solution does not exist`
**힌트**: `Perhaps you meant to reference the column "warehouses.solutions".`
**위치**: `src/pages/WarehouseSearch.jsx` 54줄 - 쿼리 SELECT 절
**해결**: `solution` → `solutions`로 변경 필요 (데이터베이스 스키마에 `solutions` 컬럼이 jsonb 타입으로 존재)

## 관련 파일

### 주요 파일 경로
- `src/pages/WarehouseSearch.jsx` - 창고 찾기 페이지 메인 컴포넌트
- `src/components/WarehouseCard.jsx` - 창고 카드 컴포넌트
- `src/utils/supabaseClient.js` - Supabase 클라이언트 설정
- `supabase/schema.sql` - 데이터베이스 스키마 정의

## 현재 코드 상태

### WarehouseSearch.jsx 주요 로직

```javascript
// 데이터 로딩 (29-116줄)
useEffect(() => {
  const fetchWarehouses = async () => {
    // 1. Supabase 쿼리
    const warehouseQuery = supabase
      .from('warehouses')
      .select(`
        id, location, city, dong, 
        available_area, pallet_count, 
        products, delivery_companies, storage_types, 
        experience, solutions, 
        company_name, status, 
        approved_at, submitted_at, created_at, is_premium
      `)
      .eq('status', 'approved');

    // 2. Promise.all로 여러 쿼리 병렬 실행
    const results = await Promise.all(promises.map(async (query, index) => {
      try {
        const result = await query;
        return result;
      } catch (err) {
        console.error(`❌ [QUERY ${index}] 에러:`, err);
        return { data: null, error: err };
      }
    }));

    // 3. 데이터 정규화 (snake_case → camelCase)
    const normalized = (w || []).map((item) => ({
      ...item,
      availableArea: Number(item.available_area ?? item.availableArea ?? 0),
      palletCount: Number(item.pallet_count ?? item.palletCount ?? 0),
      storageTypes: Array.isArray(item.storage_types) 
        ? item.storage_types 
        : (item.storage_types ? [item.storage_types] : []),
      temperature: Array.isArray(item.storage_types) && item.storage_types.length > 0
        ? item.storage_types.join('/')
        : '',
      companyName: item.company_name,
      // ...
    }));

    setAllWarehouses(normalized);
    setFilteredWarehouses(normalized);
  };
  fetchWarehouses();
}, []);

// 필터링 로직 (119-218줄)
useEffect(() => {
  let filtered = allWarehouses;
  // 검색어, 지역, 상품 유형, 보관 방식, 면적, 팔레트 수 필터링
  setFilteredWarehouses(filtered);
}, [searchTerm, filters, allWarehouses]);

// 프리미엄/일반 분리 및 정렬 (220-252줄)
const premiumWarehouses = [...filteredWarehouses]
  .filter((w) => premiumMap.has(w.id))
  .sort(...);

const regularWarehouses = [...filteredWarehouses]
  .filter((w) => !premiumMap.has(w.id))
  .sort(...);
```

### 데이터베이스 스키마 (warehouses 테이블)

```sql
create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  company_name text,
  location text,
  city text,
  dong text,
  available_area text,  -- 문자열 타입
  pallet_count text,    -- 문자열 타입
  storage_types jsonb,  -- JSON 배열
  delivery_companies jsonb,
  products jsonb,
  experience text,
  solution jsonb,
  is_premium boolean default false,
  submitted_at timestamptz default now(),
  approved_at timestamptz,
  created_at timestamptz
);
```

**중요**: 
- `available_area`, `pallet_count`는 **text 타입**입니다 (숫자가 아님)
- `storage_types`, `delivery_companies`, `products`는 **jsonb 타입**입니다
- `temperature` 컬럼은 **존재하지 않습니다** (정규화 과정에서 생성)

## 디버깅 로그

코드에 상세한 디버깅 로그가 추가되어 있습니다:

```javascript
console.log('🔄 [창고 찾기] 데이터 로딩 시작...');
console.log('👤 [USER]', user ? `로그인됨: ${user.email}` : '비로그인');
console.log('📊 [QUERY RESULTS]', { warehouses: {...}, premiumApps: {...} });
console.log('📦 [RAW DATA]', { warehousesCount: w?.length || 0, ... });
console.log('✨ [NORMALIZED]', { count: normalized.length, ... });
console.log('🔍 [FILTER]', { allWarehousesCount, searchTerm, filters });
console.log('🎨 [RENDER]', { allWarehouses, filteredWarehouses, ... });
```

## 확인해야 할 사항

### 1. 브라우저 콘솔 확인
개발자 도구(F12) → Console 탭에서 다음을 확인:
- 데이터 로딩이 시작되는가? (`🔄 [창고 찾기] 데이터 로딩 시작...`)
- 쿼리 결과는 어떻게 나오는가? (`📊 [QUERY RESULTS]`)
- 정규화된 데이터는 몇 개인가? (`✨ [NORMALIZED]`)
- 필터링 후 데이터는 몇 개인가? (`🔍 [FILTER]`)
- 렌더링 시 상태는 어떤가? (`🎨 [RENDER]`)

### 2. 데이터베이스 확인
Supabase 콘솔에서 확인:
- `warehouses` 테이블에 `status='approved'`인 레코드가 있는가?
- `storage_types`가 올바른 JSON 형식인가? (예: `["상온", "냉장"]`)
- `available_area`, `pallet_count` 값이 있는가?

### 3. 네트워크 확인
개발자 도구 → Network 탭:
- Supabase API 호출이 성공하는가? (200 OK)
- 응답 데이터에 창고 정보가 포함되어 있는가?

### 4. 렌더링 확인
- `allWarehouses` 상태가 비어있지 않은가?
- `filteredWarehouses` 상태가 비어있지 않은가?
- `premiumWarehouses`, `regularWarehouses`가 올바르게 계산되는가?
- `currentWarehouses` (페이지네이션)가 올바르게 계산되는가?

## 가능한 원인

1. **데이터 정규화 문제**
   - `storage_types`가 JSON 문자열로 저장되어 있어 파싱이 필요한가?
   - 숫자 변환 과정에서 오류가 발생하는가?

2. **필터링 문제**
   - 초기 필터가 모든 데이터를 걸러내는가?
   - `storageTypes` 필터링 로직이 잘못되었는가?

3. **렌더링 조건 문제**
   - `loading` 상태가 `false`로 변경되지 않는가?
   - 조건부 렌더링이 잘못되어 있는가?

4. **데이터 타입 불일치**
   - `available_area`가 text 타입인데 Number() 변환이 실패하는가?
   - `storage_types`가 배열이 아닌 문자열로 저장되어 있는가?

## 요청 사항

다음 사항을 확인하고 해결 방법을 제시해주세요:

1. 브라우저 콘솔 로그를 분석하여 문제 지점 파악
2. 데이터 흐름 추적 (쿼리 → 정규화 → 필터링 → 렌더링)
3. 가능한 원인별 해결 방법 제시
4. 코드 수정 제안 (필요시)

## 추가 정보

- **환경 변수**: `.env.local`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정됨
- **RLS 정책**: `warehouses` 테이블에 public read 정책이 설정되어 있음
- **배포 URL**: https://educo-logi.github.io/3PL/#/warehouse-search
- **로컬 개발**: `npm run dev` (localhost:3000)

## 참고 파일

전체 코드는 다음 파일에서 확인 가능:
- `src/pages/WarehouseSearch.jsx` (전체 파일 읽기 권장)
- `src/components/WarehouseCard.jsx`
- `src/utils/supabaseClient.js`
- `supabase/schema.sql`

