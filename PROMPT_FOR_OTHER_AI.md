# 창고 찾기 페이지에서 창고 목록이 표시되지 않는 문제 해결 요청

## 프로젝트 개요
- **프로젝트명**: 3PL 물류대행 플랫폼
- **기술 스택**: React 18.2.0, Vite 4.5.0, Supabase, React Router DOM, Tailwind CSS
- **배포 환경**: GitHub Pages (https://educo-logi.github.io/3PL)
- **라우팅**: HashRouter 사용 (`#/warehouse-search`)

## 문제 상황
창고 찾기 페이지(`/warehouse-search`)에서 창고 목록이 표시되지 않습니다.
- 페이지는 정상적으로 로드됨
- 필터 UI는 정상적으로 표시됨
- "총 X개의 창고를 찾았습니다" 메시지는 표시되지만 실제 창고 카드는 보이지 않음
- 배포된 사이트(https://educo-logi.github.io/3PL/#/warehouse-search)에서는 창고가 보이지만, 로컬 환경에서는 보이지 않음

## 관련 파일
1. **주요 파일**: `src/pages/WarehouseSearch.jsx`
2. **컴포넌트**: `src/components/WarehouseCard.jsx`
3. **Supabase 클라이언트**: `src/utils/supabaseClient.js`
4. **환경 변수**: `.env.local` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

## 현재 코드 상태

### WarehouseSearch.jsx의 데이터 로딩 로직
```javascript
useEffect(() => {
  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      const nowIso = new Date().toISOString();

      // 쿼리 최적화: 필요한 컬럼만 선택
      const warehouseQuery = supabase
        .from('warehouses')
        .select(`
          id, location, city, dong, 
          available_area, pallet_count, 
          products, delivery_companies, storage_types, 
          temperature, experience, solution, 
          company_name, status, 
          approved_at, submitted_at, created_at, is_premium
        `)
        .eq('status', 'approved');

      const promises = [
        warehouseQuery,
        supabase
          .from('premium_applications')
          .select('item_id,item_type,created_at,end_at,status')
          .eq('item_type', 'warehouse')
          .eq('status', 'approved')
          .gt('end_at', nowIso)
          .order('created_at', { ascending: false }),
      ];

      // 로그인한 경우 즐겨찾기 및 열람 목록 함께 조회
      if (user) {
        promises.push(
          supabase.from('favorites').select('item_id').eq('user_id', user.id).eq('item_type', 'warehouse'),
          supabase.from('views').select('item_id').eq('user_id', user.id).eq('item_type', 'warehouse')
        );
      }

      const results = await Promise.all(promises);
      const w = results[0].data;
      const p = results[1].data;
      const favs = results[2]?.data;
      const views = results[3]?.data;

      if (favs) {
        setFavSet(new Set(favs.map(f => f.item_id)));
      }
      if (views) {
        setViewedSet(new Set(views.map(v => v.item_id)));
      }

      const normalized = (w || []).map((item) => ({
        ...item,
        availableArea: Number(item.available_area ?? item.availableArea ?? 0),
        totalArea: Number(item.total_area ?? item.totalArea ?? 0),
        palletCount: Number(item.pallet_count ?? item.palletCount ?? 0),
        products: Array.isArray(item.products) ? item.products : [],
        delivery: Array.isArray(item.delivery_companies)
          ? item.delivery_companies
          : item.delivery || [],
        storageTypes: Array.isArray(item.storage_types) 
          ? item.storage_types 
          : (item.storage_types ? [item.storage_types] : []),
        temperature: Array.isArray(item.storage_types)
          ? item.storage_types.join('/')
          : item.temperature || '',
        experience: item.experience || '',
        companyName: item.company_name,
      }));
      
      console.log('[창고 찾기] 로드된 창고 수:', normalized.length);
      setAllWarehouses(normalized);
      setFilteredWarehouses(normalized);
      setPremiumApps(p || []);
    } catch (err) {
      console.error('[창고 찾기] 창고 리스트 로딩 실패:', err);
      alert('창고 정보를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
      setAllWarehouses([]);
      setFilteredWarehouses([]);
    } finally {
      setLoading(false);
    }
  };
  fetchWarehouses();
}, []);
```

### 렌더링 로직
```javascript
const premiumWarehouses = [...filteredWarehouses]
  .filter((w) => premiumMap.has(w.id))
  .sort((a, b) => {
    const la = latestById.get(a.id);
    const lb = latestById.get(b.id);
    if (la && lb) return new Date(lb.created_at) - new Date(la.created_at);
    if (la) return -1;
    if (lb) return 1;
    return 0;
  });

const regularWarehouses = [...filteredWarehouses]
  .filter((w) => !premiumMap.has(w.id))
  .sort((a, b) => getSortDate(b) - getSortDate(a));

// 페이지네이션
const totalPages = Math.ceil(regularWarehouses.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const currentWarehouses = regularWarehouses.slice(startIndex, endIndex);
```

## 시도한 해결 방법
1. ✅ 보관 방식 필터링 로직 개선 (`storage_types` 배열 처리)
2. ✅ 로딩 상태 표시 추가
3. ✅ 에러 처리 개선 및 콘솔 로그 추가
4. ✅ 데이터 정규화 로직 개선

## 확인해야 할 사항

### 1. 브라우저 콘솔 확인
- `[창고 찾기] 로드된 창고 수: X` 로그가 출력되는지 확인
- Supabase 쿼리 에러가 있는지 확인
- 네트워크 탭에서 Supabase API 호출이 성공하는지 확인

### 2. 데이터베이스 확인
- `warehouses` 테이블에 `status = 'approved'`인 데이터가 있는지 확인
- RLS(Row Level Security) 정책이 공개 조회를 허용하는지 확인
- 필요한 컬럼들이 모두 존재하는지 확인

### 3. 환경 변수 확인
- `.env.local` 파일에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`가 설정되어 있는지 확인
- 개발 서버 재시작 후에도 문제가 있는지 확인

### 4. 렌더링 문제 확인
- `filteredWarehouses` state에 데이터가 있는지 확인
- `currentWarehouses`가 비어있는지 확인
- 필터링 로직이 모든 창고를 필터링해버리는지 확인

## 예상 원인
1. **RLS 정책 문제**: Supabase RLS 정책이 공개 조회를 차단하고 있을 수 있음
2. **데이터 타입 불일치**: `storage_types`가 JSONB인데 파싱이 제대로 안 될 수 있음
3. **필터링 로직 문제**: 초기 필터 상태가 모든 창고를 필터링해버릴 수 있음
4. **비동기 처리 문제**: `Promise.all`에서 에러가 발생했지만 catch되지 않을 수 있음
5. **환경 변수 문제**: 로컬 환경에서 Supabase 연결이 안 될 수 있음

## 요청 사항
1. 브라우저 개발자 도구(F12)의 콘솔과 네트워크 탭을 확인하여 실제 에러나 문제를 파악
2. 코드를 검토하여 데이터가 로드되었지만 렌더링되지 않는 원인 찾기
3. Supabase 쿼리와 RLS 정책 확인
4. 문제 해결 후 코드 수정 제안

## 추가 정보
- Supabase 테이블 구조는 `supabase/schema.sql` 파일 참조
- 배포된 사이트에서는 정상 작동하므로, 로컬 환경 특정 문제일 가능성
- React Router는 HashRouter 사용 (`#/warehouse-search`)

---

# 🎯 창고 목록 표시 문제 디버깅 가이드

## Step 1: 환경 변수 확인

로컬 환경에서만 문제가 발생한다면 환경 변수 문제일 가능성이 높습니다.

### 1-1. `.env.local` 파일 확인
```bash
# 프로젝트 루트에 .env.local 파일이 있는지 확인
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 1-2. 개발 서버 재시작
```bash
# 환경 변수 변경 후 반드시 재시작
npm run dev
```

### 1-3. 코드에서 환경 변수 확인
`WarehouseSearch.jsx`의 `useEffect` 시작 부분에 추가:
```javascript
console.log('ENV CHECK:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});
```

---

## Step 2: Supabase 연결 확인

### 2-1. 네트워크 탭 확인
1. F12 → Network 탭 열기
2. 페이지 새로고침
3. `warehouses` 또는 `rest/v1` 요청 찾기
4. 상태 코드 확인:
   - **200**: 성공 → Step 3로
   - **401/403**: 인증 문제 → RLS 정책 확인 필요
   - **404**: URL 오류 → 환경 변수 확인
   - **네트워크 에러**: 연결 문제 → Supabase 프로젝트 상태 확인

### 2-2. 응답 데이터 확인
네트워크 탭에서 `warehouses` 요청의 Response를 확인:
```json
// 정상적인 경우
[
  {
    "id": "xxx",
    "location": "서울시 강남구",
    "status": "approved",
    ...
  }
]

// 빈 배열인 경우
[]
```

---

## Step 3: 데이터 로딩 확인

`WarehouseSearch.jsx`에 디버깅 로그 추가:

```javascript
useEffect(() => {
  const fetchWarehouses = async () => {
    console.log('🔄 [FETCH] Starting fetch...');
    setLoading(true);
    
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      const nowIso = new Date().toISOString();

      const warehouseQuery = supabase
        .from('warehouses')
        .select(`
          id, location, city, dong, 
          available_area, pallet_count, 
          products, delivery_companies, storage_types, 
          temperature, experience, solution, 
          company_name, status, 
          approved_at, submitted_at, created_at, is_premium
        `)
        .eq('status', 'approved');

      const promises = [
        warehouseQuery,
        supabase
          .from('premium_applications')
          .select('item_id,item_type,created_at,end_at,status')
          .eq('item_type', 'warehouse')
          .eq('status', 'approved')
          .gt('end_at', nowIso)
          .order('created_at', { ascending: false }),
      ];

      if (user) {
        promises.push(
          supabase.from('favorites').select('item_id').eq('user_id', user.id).eq('item_type', 'warehouse'),
          supabase.from('views').select('item_id').eq('user_id', user.id).eq('item_type', 'warehouse')
        );
      }

      const results = await Promise.all(promises);
      
      // ✅ 디버깅: 쿼리 결과 확인
      console.log('📊 [FETCH] Query results:', {
        warehouses: results[0],
        warehousesCount: results[0].data?.length,
        hasError: !!results[0].error,
        error: results[0].error
      });
      
      if (results[0].error) {
        console.error('❌ [ERROR]', results[0].error);
        throw results[0].error;
      }
      
      const w = results[0].data;
      console.log('📦 [DATA] Raw warehouses:', w);
      console.log('📦 [DATA] First warehouse sample:', w?.[0]);
      
      const normalized = (w || []).map((item) => ({
        ...item,
        availableArea: Number(item.available_area ?? item.availableArea ?? 0),
        totalArea: Number(item.total_area ?? item.totalArea ?? 0),
        palletCount: Number(item.pallet_count ?? item.palletCount ?? 0),
        products: Array.isArray(item.products) ? item.products : [],
        delivery: Array.isArray(item.delivery_companies)
          ? item.delivery_companies
          : item.delivery || [],
        storageTypes: Array.isArray(item.storage_types) 
          ? item.storage_types 
          : (item.storage_types ? [item.storage_types] : []),
        temperature: Array.isArray(item.storage_types)
          ? item.storage_types.join('/')
          : item.temperature || '',
        experience: item.experience || '',
        companyName: item.company_name,
      }));
      
      console.log('✨ [DATA] Normalized:', normalized);
      console.log('✅ [SUCCESS] Setting', normalized.length, 'warehouses');
      
      setAllWarehouses(normalized);
      setFilteredWarehouses(normalized);
      setPremiumApps(results[1].data || []);
      
    } catch (err) {
      console.error('❌ [ERROR] Fetch failed:', err);
      alert('창고 정보를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
      setAllWarehouses([]);
      setFilteredWarehouses([]);
    } finally {
      setLoading(false);
    }
  };
  
  fetchWarehouses();
}, []);
```

---

## Step 4: 렌더링 확인

### 4-1. State 변경 모니터링
```javascript
useEffect(() => {
  console.log('🎨 [RENDER] State updated:', {
    allWarehouses: allWarehouses.length,
    filteredWarehouses: filteredWarehouses.length,
    loading,
    currentPage
  });
}, [allWarehouses, filteredWarehouses, loading, currentPage]);
```

### 4-2. 렌더링 로직 디버깅
렌더링 부분 직전에 추가:
```javascript
const premiumWarehouses = [...filteredWarehouses]
  .filter((w) => premiumMap.has(w.id))
  .sort((a, b) => {
    const la = latestById.get(a.id);
    const lb = latestById.get(b.id);
    if (la && lb) return new Date(lb.created_at) - new Date(la.created_at);
    if (la) return -1;
    if (lb) return 1;
    return 0;
  });

const regularWarehouses = [...filteredWarehouses]
  .filter((w) => !premiumMap.has(w.id))
  .sort((a, b) => getSortDate(b) - getSortDate(a));

const totalPages = Math.ceil(regularWarehouses.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const currentWarehouses = regularWarehouses.slice(startIndex, endIndex);

// 🎯 디버깅 로그 추가
console.log('🎯 [RENDER LOGIC]', {
  filteredWarehousesCount: filteredWarehouses.length,
  premiumCount: premiumWarehouses.length,
  regularCount: regularWarehouses.length,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  currentWarehousesCount: currentWarehouses.length,
  itemsPerPage
});
```

---

## Step 5: 필터링 로직 확인

필터가 모든 창고를 걸러내고 있을 수 있습니다.

### 5-1. 초기 필터 상태 확인
`WarehouseSearch.jsx`의 필터링 useEffect에 추가:
```javascript
useEffect(() => {
  console.log('🔍 [FILTER] Current filters:', filters);
  console.log('🔍 [FILTER] All warehouses:', allWarehouses.length);
  
  let filtered = allWarehouses;

  // 검색어 필터
  if (searchTerm) {
    const beforeSearch = filtered.length;
    filtered = filtered.filter(warehouse => {
      const hasLocation = warehouse.location && warehouse.location.toLowerCase().includes(searchTerm.toLowerCase());
      const hasCity = warehouse.city && warehouse.city.toLowerCase().includes(searchTerm.toLowerCase());
      const hasDong = warehouse.dong && warehouse.dong.toLowerCase().includes(searchTerm.toLowerCase());
      const hasProduct = Array.isArray(warehouse.products) && warehouse.products.some(product =>
        product && product.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return hasLocation || hasCity || hasDong || hasProduct;
    });
    console.log('🔍 [FILTER] After search:', filtered.length, '(was', beforeSearch + ')');
  }

  // 지역 필터
  if (filters.regions.length > 0) {
    const beforeRegion = filtered.length;
    filtered = filtered.filter(warehouse =>
      filters.regions.includes(warehouse.location)
    );
    console.log('🔍 [FILTER] After region:', filtered.length, '(was', beforeRegion + ')');
  }

  // 상품 유형 필터
  if (filters.productTypes.length > 0) {
    const beforeProduct = filtered.length;
    filtered = filtered.filter(warehouse =>
      Array.isArray(warehouse.products) && warehouse.products.some(product =>
        filters.productTypes.includes(product)
      )
    );
    console.log('🔍 [FILTER] After product:', filtered.length, '(was', beforeProduct + ')');
  }

  // 보관 방식 필터
  if (filters.storageTypes.length > 0) {
    const beforeStorage = filtered.length;
    filtered = filtered.filter(warehouse => {
      const storageTypes = warehouse.storageTypes || [];
      const temperatureStr = warehouse.temperature || '';
      
      if (Array.isArray(storageTypes) && storageTypes.length > 0) {
        return filters.storageTypes.some(type =>
          storageTypes.includes(type)
        );
      } else if (temperatureStr && typeof temperatureStr === 'string') {
        return filters.storageTypes.some(type =>
          temperatureStr.includes(type)
        );
      }
      return false;
    });
    console.log('🔍 [FILTER] After storage:', filtered.length, '(was', beforeStorage + ')');
  }

  // 면적 필터
  if (filters.areaRange) {
    const beforeArea = filtered.length;
    filtered = filtered.filter(warehouse => {
      const area = warehouse.availableArea;
      switch (filters.areaRange) {
        case '0-100':
          return area <= 100;
        case '100-500':
          return area > 100 && area <= 500;
        case '500-1000':
          return area > 500 && area <= 1000;
        case '1000-2000':
          return area > 1000 && area <= 2000;
        case '2000+':
          return area > 2000;
        default:
          return true;
      }
    });
    console.log('🔍 [FILTER] After area:', filtered.length, '(was', beforeArea + ')');
  }

  // 팔레트 수 필터
  if (filters.palletRange) {
    const beforePallet = filtered.length;
    filtered = filtered.filter(warehouse => {
      const pallets = warehouse.palletCount;
      switch (filters.palletRange) {
        case '0-50':
          return pallets <= 50;
        case '50-200':
          return pallets > 50 && pallets <= 200;
        case '200-500':
          return pallets > 200 && pallets <= 500;
        case '500-1000':
          return pallets > 500 && pallets <= 1000;
        case '1000+':
          return pallets > 1000;
        default:
          return true;
      }
    });
    console.log('🔍 [FILTER] After pallet:', filtered.length, '(was', beforePallet + ')');
  }

  console.log('🔍 [FILTER] Final result:', filtered.length);
  setFilteredWarehouses(filtered);
  setCurrentPage(1);
}, [searchTerm, filters, allWarehouses]);
```

---

## 🔧 일반적인 해결 방법

### 해결 방법 1: RLS 정책 문제 (가장 흔함)

Supabase에서 `warehouses` 테이블의 RLS 정책 확인:

```sql
-- Supabase Dashboard → Table Editor → warehouses → RLS Policies

-- 공개 조회를 허용하는 정책 추가
CREATE POLICY "Enable read access for all users" ON "public"."warehouses"
FOR SELECT
USING (status = 'approved');
```

### 해결 방법 2: 환경 변수 누락

```bash
# .env.local 파일 생성 또는 확인
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# 개발 서버 재시작 필수!
npm run dev
```

### 해결 방법 3: 데이터 타입 문제

`storage_types` 컬럼이 JSONB인 경우:

```javascript
storageTypes: (() => {
  if (!item.storage_types) return [];
  if (Array.isArray(item.storage_types)) return item.storage_types;
  if (typeof item.storage_types === 'string') {
    try {
      const parsed = JSON.parse(item.storage_types);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [item.storage_types];
    }
  }
  return [];
})(),
```

### 해결 방법 4: 렌더링 조건 문제

```javascript
// ❌ 잘못된 조건 (0이면 falsy로 처리됨)
{filteredWarehouses.length && (
  <div>...</div>
)}

// ✅ 올바른 조건
{filteredWarehouses.length > 0 && (
  <div>...</div>
)}
```

### 해결 방법 5: Promise.all 에러 처리 개선

```javascript
const results = await Promise.all(promises.map(p => 
  p.catch(err => {
    console.error('Query error:', err);
    return { data: null, error: err };
  })
));

// 각 결과의 에러 확인
if (results[0].error) {
  console.error('Warehouses query failed:', results[0].error);
  // 에러 처리
}
```

---

## 📋 체크리스트

디버깅 시 순서대로 확인:

- [ ] `.env.local` 파일 존재 및 내용 확인
- [ ] 개발 서버 재시작 완료
- [ ] 콘솔에 `ENV CHECK` 로그 표시
- [ ] 네트워크 탭에서 Supabase 요청 200 응답
- [ ] 네트워크 응답에 실제 데이터 존재
- [ ] 콘솔에 `로드된 창고 수: X` 표시 (X > 0)
- [ ] `allWarehouses.length` > 0
- [ ] `filteredWarehouses.length` > 0
- [ ] `currentWarehouses.length` > 0
- [ ] JSX에서 실제 렌더링 코드 실행
- [ ] 필터가 모든 창고를 걸러내지 않는지 확인
- [ ] `loading` 상태가 `false`로 변경되는지 확인

---

## 🚨 긴급 임시 해결책

모든 디버깅을 시도해도 안 되면:

```javascript
// WarehouseSearch.jsx의 useEffect에 임시로 추가
useEffect(() => {
  // 임시로 하드코딩 데이터로 테스트
  const mockData = [{
    id: 'test-1',
    location: '서울시 강남구',
    city: '서울시',
    dong: '역삼동',
    availableArea: 100,
    palletCount: 50,
    products: ['전자제품'],
    delivery: ['CJ대한통운'],
    storageTypes: ['상온'],
    companyName: '테스트 창고',
    status: 'approved',
    available_area: 100,
    pallet_count: 50,
    company_name: '테스트 창고'
  }];
  
  console.log('🧪 [TEST] Setting mock data');
  setAllWarehouses(mockData);
  setFilteredWarehouses(mockData);
  setLoading(false);
  
  // 실제 데이터 로딩은 주석 처리
  // fetchWarehouses();
}, []);
```

이 테스트로:
- **데이터가 보이면** → Supabase 연결 문제
- **데이터가 안 보이면** → 렌더링 로직 문제

---

## 📞 추가 도움이 필요한 경우

위 단계를 모두 시도한 후 다음 정보를 공유해주세요:

1. **각 단계에서 출력된 콘솔 로그** (전체 복사)
2. **네트워크 탭의 Supabase 요청/응답** (스크린샷 또는 복사)
3. **발생한 에러 메시지 전체** (에러 스택 포함)
4. **Supabase RLS 정책 설정** (스크린샷)
5. **환경 변수 설정 여부** (`.env.local` 파일 존재 여부, 값은 마스킹)
6. **로컬 vs 배포 환경 차이점** (어떤 환경에서 문제가 발생하는지)

---

## 🔍 추가 확인 사항

### Supabase 쿼리 직접 테스트

Supabase Dashboard → SQL Editor에서 직접 실행:

```sql
SELECT 
  id, location, city, dong, 
  available_area, pallet_count, 
  products, delivery_companies, storage_types, 
  temperature, experience, solution, 
  company_name, status, 
  approved_at, submitted_at, created_at, is_premium
FROM warehouses
WHERE status = 'approved'
LIMIT 10;
```

이 쿼리가 데이터를 반환하는지 확인하세요.

### RLS 정책 확인

```sql
-- 현재 RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'warehouses';
```

### 테이블 구조 확인

```sql
-- warehouses 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'warehouses'
ORDER BY ordinal_position;
```

