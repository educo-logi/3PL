import React, { useState, useEffect } from 'react';
import { Search, Filter, Building2, Star as StarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FilterSidebar from '../components/FilterSidebar';
import WarehouseCard from '../components/WarehouseCard';
import { supabase } from '../utils/supabaseClient';

const WarehouseSearch = () => {
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    regions: [],
    productTypes: [],
    storageTypes: [],
    areaRange: '',
    palletRange: ''
  });
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [premiumApps, setPremiumApps] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [loading, setLoading] = useState(true);

  const [favSet, setFavSet] = useState(new Set());
  const [viewedSet, setViewedSet] = useState(new Set());

  useEffect(() => {
    const fetchWarehouses = async () => {
      console.log('🔄 [창고 찾기] 데이터 로딩 시작...');
      
      // 환경 변수 확인
      console.log('🔍 [ENV CHECK]', {
        url: import.meta.env.VITE_SUPABASE_URL ? '설정됨' : '❌ 없음',
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      });
      
      setLoading(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        console.log('👤 [USER]', user ? `로그인됨: ${user.email}` : '비로그인');

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

        // 로그인한 경우 즐겨찾기 및 열람 목록 함께 조회 (N+1 문제 해결)
        if (user) {
          promises.push(
            supabase.from('favorites').select('item_id').eq('user_id', user.id).eq('item_type', 'warehouse'),
            supabase.from('views').select('item_id').eq('user_id', user.id).eq('item_type', 'warehouse')
          );
        }

        // 에러 처리 개선: 각 쿼리별로 에러 처리
        const results = await Promise.all(promises.map((promise, index) => 
          promise.catch(err => {
            console.error(`❌ [QUERY ${index}] 에러:`, err);
            return { data: null, error: err };
          })
        ));

        // 쿼리 결과 확인
        console.log('📊 [QUERY RESULTS]', {
          warehouses: {
            data: results[0].data?.length || 0,
            error: results[0].error ? '에러 발생' : '성공',
            errorDetails: results[0].error
          },
          premiumApps: {
            data: results[1].data?.length || 0,
            error: results[1].error ? '에러 발생' : '성공'
          }
        });

        // 창고 쿼리 에러 확인
        if (results[0].error) {
          console.error('❌ [창고 쿼리 실패]', results[0].error);
          throw results[0].error;
        }

        const w = results[0].data;
        const p = results[1].data;
        const favs = results[2]?.data;
        const views = results[3]?.data;

        console.log('📦 [RAW DATA]', {
          warehousesCount: w?.length || 0,
          firstWarehouse: w?.[0] ? {
            id: w[0].id,
            location: w[0].location,
            company_name: w[0].company_name,
            status: w[0].status
          } : null
        });

        if (favs) {
          setFavSet(new Set(favs.map(f => f.item_id)));
          console.log('⭐ [FAVORITES]', favs.length, '개');
        }
        if (views) {
          setViewedSet(new Set(views.map(v => v.item_id)));
          console.log('👁️ [VIEWS]', views.length, '개');
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
          companyName: item.company_name, // company_name을 companyName으로 매핑
        }));
        
        console.log('✨ [NORMALIZED]', {
          count: normalized.length,
          sample: normalized[0] ? {
            id: normalized[0].id,
            companyName: normalized[0].companyName,
            location: normalized[0].location,
            availableArea: normalized[0].availableArea,
            storageTypes: normalized[0].storageTypes
          } : null
        });
        
        console.log('✅ [SUCCESS]', normalized.length, '개 창고 로드 완료');
        setAllWarehouses(normalized);
        setFilteredWarehouses(normalized);
        setPremiumApps(p || []);
      } catch (err) {
        console.error('❌ [ERROR] 창고 리스트 로딩 실패:', err);
        console.error('❌ [ERROR DETAILS]', {
          message: err.message,
          code: err.code,
          details: err.details,
          hint: err.hint
        });
        alert(`창고 정보를 불러오는 중 오류가 발생했습니다.\n\n에러: ${err.message || '알 수 없는 오류'}\n\n페이지를 새로고침해주세요.`);
        setAllWarehouses([]);
        setFilteredWarehouses([]);
      } finally {
        setLoading(false);
        console.log('🏁 [LOADING] 완료');
      }
    };
    fetchWarehouses();
  }, []);

  // 필터링 로직 (Supabase 로드 이후 클라이언트 필터)
  useEffect(() => {
    console.log('🔍 [FILTER] 필터링 시작', {
      allWarehousesCount: allWarehouses.length,
      searchTerm,
      filters
    });

    let filtered = allWarehouses;
    const initialCount = filtered.length;

    // 검색어 필터 (업체명 검색 제거 - 열람권 사용 후에만 업체명 표시)
    if (searchTerm) {
      const beforeSearch = filtered.length;
      filtered = filtered.filter(warehouse => {
        // 업체명으로 검색하지 않음 (열람권 사용 후에만 업체명 표시)
        const hasLocation = warehouse.location && warehouse.location.toLowerCase().includes(searchTerm.toLowerCase());
        const hasCity = warehouse.city && warehouse.city.toLowerCase().includes(searchTerm.toLowerCase());
        const hasDong = warehouse.dong && warehouse.dong.toLowerCase().includes(searchTerm.toLowerCase());
        const hasProduct = Array.isArray(warehouse.products) && warehouse.products.some(product =>
          product && product.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return hasLocation || hasCity || hasDong || hasProduct;
      });
      console.log('🔍 [FILTER] 검색어 적용:', filtered.length, '(was', beforeSearch + ')');
    }

    // 지역 필터
    if (filters.regions.length > 0) {
      const beforeRegion = filtered.length;
      filtered = filtered.filter(warehouse =>
        filters.regions.includes(warehouse.location)
      );
      console.log('🔍 [FILTER] 지역 필터 적용:', filtered.length, '(was', beforeRegion + ')');
    }

    // 상품 유형 필터
    if (filters.productTypes.length > 0) {
      const beforeProduct = filtered.length;
      filtered = filtered.filter(warehouse =>
        Array.isArray(warehouse.products) && warehouse.products.some(product =>
          filters.productTypes.includes(product)
        )
      );
      console.log('🔍 [FILTER] 상품 유형 필터 적용:', filtered.length, '(was', beforeProduct + ')');
    }

    // 보관 방식 필터
    if (filters.storageTypes.length > 0) {
      const beforeStorage = filtered.length;
      filtered = filtered.filter(warehouse => {
        // storage_types 배열이 있으면 배열로 확인, 없으면 temperature 문자열로 확인
        const storageTypes = warehouse.storageTypes || [];
        const temperatureStr = warehouse.temperature || '';
        
        if (Array.isArray(storageTypes) && storageTypes.length > 0) {
          // 배열로 확인
          return filters.storageTypes.some(type =>
            storageTypes.includes(type)
          );
        } else if (temperatureStr && typeof temperatureStr === 'string') {
          // 문자열로 확인
          return filters.storageTypes.some(type =>
            temperatureStr.includes(type)
          );
        }
        return false;
      });
      console.log('🔍 [FILTER] 보관 방식 필터 적용:', filtered.length, '(was', beforeStorage + ')');
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
      console.log('🔍 [FILTER] 면적 필터 적용:', filtered.length, '(was', beforeArea + ')');
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
      console.log('🔍 [FILTER] 팔레트 수 필터 적용:', filtered.length, '(was', beforePallet + ')');
    }

    console.log('🔍 [FILTER] 최종 결과:', filtered.length, '(시작:', initialCount + ')');
    setFilteredWarehouses(filtered);
    setCurrentPage(1);
  }, [searchTerm, filters, allWarehouses]);

  const getSortDate = (item) =>
    new Date(item.approved_at || item.submitted_at || item.created_at || 0).getTime();

  const premiumMap = premiumApps.reduce((set, app) => {
    set.add(app.item_id);
    return set;
  }, new Set());

  const latestById = new Map();
  premiumApps.forEach((app) => {
    if (!latestById.has(app.item_id)) latestById.set(app.item_id, app);
  });

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

  // 렌더링 로직 디버깅
  useEffect(() => {
    console.log('🎨 [RENDER] State 변경:', {
      allWarehouses: allWarehouses.length,
      filteredWarehouses: filteredWarehouses.length,
      premiumWarehouses: premiumWarehouses.length,
      regularWarehouses: regularWarehouses.length,
      currentWarehouses: currentWarehouses.length,
      currentPage,
      totalPages,
      loading
    });
  }, [allWarehouses, filteredWarehouses, premiumWarehouses.length, regularWarehouses.length, currentWarehouses.length, currentPage, totalPages, loading]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Building2 className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">창고 찾기</h1>
          </div>

          {/* 검색바 */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="창고명, 지역, 취급물품으로 검색하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="md:hidden flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-5 h-5 mr-2" />
              필터
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex gap-8">
          {/* 필터 사이드바 */}
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            isOpen={isFilterOpen}
            setIsOpen={setIsFilterOpen}
          />

          {/* 메인 콘텐츠 */}
          <div className="flex-1">
            {/* 로딩 상태 */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-600">창고 정보를 불러오는 중...</p>
              </div>
            )}

            {/* 결과 통계 */}
            {!loading && (
              <div className="mb-6">
                <p className="text-gray-600">
                  총 <span className="font-semibold text-primary-600">{filteredWarehouses.length}</span>개의 창고를 찾았습니다
                  {process.env.NODE_ENV === 'development' && (
                    <span className="ml-4 text-xs text-gray-400">
                      (전체: {allWarehouses.length}, 프리미엄: {premiumWarehouses.length}, 일반: {regularWarehouses.length})
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* 프리미엄 창고 섹션 - 첫 페이지에 모두 표시 */}
            {!loading && premiumWarehouses.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center mb-6">
                  <StarIcon className="w-6 h-6 text-yellow-500 mr-2" />
                  <h2 className="text-2xl font-bold text-gray-900">프리미엄 창고</h2>
                  {process.env.NODE_ENV === 'development' && (
                    <span className="ml-2 text-sm text-gray-500">({premiumWarehouses.length}개)</span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {premiumWarehouses.map(warehouse => {
                    console.log('🎴 [RENDER] 프리미엄 창고 카드:', warehouse.id, warehouse.companyName || warehouse.location);
                    return (
                      <WarehouseCard
                        key={warehouse.id}
                        warehouse={warehouse}
                        isPremium={true}
                        initialIsFav={favSet.has(warehouse.id)}
                        initialIsViewed={viewedSet.has(warehouse.id)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* 일반 창고 섹션 */}
            {!loading && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  일반 창고
                  {process.env.NODE_ENV === 'development' && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({regularWarehouses.length}개, 현재 페이지: {currentWarehouses.length}개)
                    </span>
                  )}
                </h2>

                {currentWarehouses.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentWarehouses.map(warehouse => {
                      console.log('🎴 [RENDER] 일반 창고 카드:', warehouse.id, warehouse.companyName || warehouse.location);
                      return (
                        <WarehouseCard
                          key={warehouse.id}
                          warehouse={warehouse}
                          isPremium={false}
                          initialIsFav={favSet.has(warehouse.id)}
                          initialIsViewed={viewedSet.has(warehouse.id)}
                        />
                      );
                    })}
                  </div>

                  {/* 페이지네이션 */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                      <nav className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          이전
                        </button>

                        {[...Array(totalPages)].map((_, index) => (
                          <button
                            key={index + 1}
                            onClick={() => setCurrentPage(index + 1)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === index + 1
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            {index + 1}
                          </button>
                        ))}

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          다음
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
                  <p className="text-gray-500 mb-4">다른 검색어나 필터를 시도해보세요.</p>
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-400 mt-4 p-4 bg-gray-50 rounded">
                      <p>디버그 정보:</p>
                      <p>전체 창고: {allWarehouses.length}개</p>
                      <p>필터링 후: {filteredWarehouses.length}개</p>
                      <p>프리미엄: {premiumWarehouses.length}개</p>
                      <p>일반: {regularWarehouses.length}개</p>
                      <p>현재 페이지: {currentWarehouses.length}개</p>
                    </div>
                  )}
                </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseSearch;
