import React, { useState, useEffect } from 'react';
import { Search, Filter, Building2, Star as StarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { warehouseData } from '../data/sampleData';
import FilterSidebar from '../components/FilterSidebar';
import WarehouseCard from '../components/WarehouseCard';
import { isPremiumActive, getItemPremiumApplications, sortPremiumItems } from '../utils/premiumUtils';
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
  const [allWarehouses, setAllWarehouses] = useState(warehouseData);
  const [filteredWarehouses, setFilteredWarehouses] = useState(warehouseData);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Supabase에서 승인된 창고 가져오기
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const { data, error } = await supabase
          .from('warehouses')
          .select('*')
          .eq('status', 'approved');

        if (error) throw error;

        // DB 데이터를 프론트엔드 형식으로 매핑
        const mappedWarehouses = data.map(w => ({
          ...w,
          // snake_case -> camelCase 변환 및 필요한 가공
          companyName: w.company_name,
          businessNumber: w.business_number,
          contactNumber: w.contact_number,
          addressDetail: w.address_detail,
          storageTypes: w.storage_types || (w.temperature ? w.temperature.split('/') : []),
          deliveryCompanies: w.delivery_companies || (Array.isArray(w.delivery) ? w.delivery : []),
          totalArea: w.total_area,
          availableArea: w.available_area,
          palletCount: w.pallet_count,
          submittedAt: w.submitted_at,
          approvedAt: w.approved_at,
          // 호환성 필드
          name: w.company_name,
          location: w.location,
          delivery: w.delivery_companies || w.delivery || [],
          solutions: w.solutions || (w.solution ? w.solution.split(',').map(s => s.trim()) : [])
        }));

        // sampleData와 Supabase 데이터 합치기 (중복 제거)
        const existingIds = warehouseData.map(w => w.id);
        const newWarehouses = mappedWarehouses.filter(w => !existingIds.includes(w.id));

        setAllWarehouses([...warehouseData, ...newWarehouses]);
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      }
    };

    fetchWarehouses();
  }, []);

  // 필터링 로직
  useEffect(() => {
    let filtered = allWarehouses;

    // 검색어 필터 (업체명 검색 제거 - 열람권 사용 후에만 업체명 표시)
    if (searchTerm) {
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
    }

    // 지역 필터
    if (filters.regions.length > 0) {
      filtered = filtered.filter(warehouse =>
        filters.regions.includes(warehouse.location)
      );
    }

    // 상품 유형 필터
    if (filters.productTypes.length > 0) {
      filtered = filtered.filter(warehouse =>
        Array.isArray(warehouse.products) && warehouse.products.some(product =>
          filters.productTypes.includes(product)
        )
      );
    }

    // 보관 방식 필터
    if (filters.storageTypes.length > 0) {
      filtered = filtered.filter(warehouse =>
        warehouse.temperature && typeof warehouse.temperature === 'string' &&
        filters.storageTypes.some(type =>
          warehouse.temperature.includes(type)
        )
      );
    }

    // 면적 필터
    if (filters.areaRange) {
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
    }

    // 팔레트 수 필터
    if (filters.palletRange) {
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
    }

    setFilteredWarehouses(filtered);
    setCurrentPage(1);
  }, [searchTerm, filters, allWarehouses]);

  // 프리미엄 창고와 일반 창고 분리 및 최신순 정렬
  const getSortDate = (item) => {
    if (item.approvedAt) return new Date(item.approvedAt).getTime();
    if (item.submittedAt) return new Date(item.submittedAt).getTime();
    if (typeof item.id === 'string' && item.id.includes('-')) {
      const timestamp = item.id.split('-').pop();
      return parseInt(timestamp) || 0;
    }
    return typeof item.id === 'number' ? item.id : 0;
  };

  // 프리미엄 상태를 비동기로 미리 한 번씩 모두 가져와 확정 짓는 로직 (우선 기존 로컬 스토리지 또는 DB의 isPremium 뷰 필드 의존)
  // 프리미엄 창고 (활성 프리미엄만, 최근 신청 순이 아닌 최초 결제 시간 우선 오름차순)
  const premiumWarehouses = filteredWarehouses
    .filter(w => w.isPremium || w.is_premium)
    .sort((a, b) => {
      // 1순위: 프리미엄 결제일자 (최초 결제일자 오름차순 = 먼저 신청한 사람이 왼쪽(최상단))
      const aApps = getItemPremiumApplications(a.id, 'warehouse');
      const bApps = getItemPremiumApplications(b.id, 'warehouse');

      const aDate = aApps.length > 0 ? new Date(aApps[0].createdAt).getTime() : 0;
      const bDate = bApps.length > 0 ? new Date(bApps[0].createdAt).getTime() : 0;

      if (aDate && bDate) return aDate - bDate; // 먼저 신청한 사람 우선
      if (aDate) return -1;
      if (bDate) return 1;

      // 2순위: 가입/승인일자 최신순
      return getSortDate(b) - getSortDate(a);
    });

  // 일반 창고
  const regularWarehouses = filteredWarehouses
    .filter(w => !(w.isPremium || w.is_premium))
    .sort((a, b) => getSortDate(b) - getSortDate(a));

  // 페이지네이션
  const totalPages = Math.ceil(regularWarehouses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentWarehouses = regularWarehouses.slice(startIndex, endIndex);

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
            {/* 결과 통계 */}
            <div className="mb-6">
              <p className="text-gray-600">
                총 <span className="font-semibold text-primary-600">{filteredWarehouses.length}</span>개의 창고를 찾았습니다
              </p>
            </div>

            {/* 프리미엄 창고 섹션 - 첫 페이지에 모두 표시 */}
            {premiumWarehouses.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">프리미엄 창고</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {premiumWarehouses.map(warehouse => (
                    <WarehouseCard
                      key={warehouse.id}
                      warehouse={warehouse}
                      isPremium={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 일반 창고 섹션 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">일반 창고</h2>

              {currentWarehouses.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentWarehouses.map(warehouse => (
                      <WarehouseCard
                        key={warehouse.id}
                        warehouse={warehouse}
                        isPremium={false}
                      />
                    ))}
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
                  <p className="text-gray-500">다른 검색어나 필터를 시도해보세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseSearch;
