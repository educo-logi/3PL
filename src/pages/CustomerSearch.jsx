import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, Star as StarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FilterSidebar from '../components/FilterSidebar';
import CustomerCard from '../components/CustomerCard';
import { supabase } from '../utils/supabaseClient';

const CustomerSearch = () => {
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
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [premiumApps, setPremiumApps] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      const nowIso = new Date().toISOString();
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from('customers').select('*').eq('status', 'approved'),
        supabase
          .from('premium_applications')
          .select('item_id,item_type,created_at,end_at,status')
          .eq('item_type', 'customer')
          .eq('status', 'approved')
          .gt('end_at', nowIso)
          .order('created_at', { ascending: false }),
      ]);
      const normalized = (c || []).map((item) => ({
        ...item,
        requiredArea: Number(item.required_area ?? item.requiredArea ?? 0),
        monthlyVolume: Number(item.monthly_volume ?? item.monthlyVolume ?? 0),
        palletCount: Number(item.pallet_count ?? item.palletCount ?? 0),
        products: Array.isArray(item.products) ? item.products : [],
        desiredDelivery: Array.isArray(item.desired_delivery)
          ? item.desired_delivery
          : item.desiredDelivery || [],
      }));
      setAllCustomers(normalized);
      setFilteredCustomers(normalized);
      setPremiumApps(p || []);
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  // 필터링 로직 (Supabase 로드 이후 클라이언트 필터)
  useEffect(() => {
    let filtered = allCustomers;

    // 검색어 필터 (업체명 검색 제거 - 열람권 사용 후에만 업체명 표시)
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        // 업체명으로 검색하지 않음 (열람권 사용 후에만 업체명 표시)
        customer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.city && customer.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.dong && customer.dong.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.products.some(product => 
          product.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // 지역 필터
    if (filters.regions.length > 0) {
      filtered = filtered.filter(customer =>
        filters.regions.includes(customer.location)
      );
    }

    // 상품 유형 필터
    if (filters.productTypes.length > 0) {
      filtered = filtered.filter(customer =>
        customer.products.some(product =>
          filters.productTypes.includes(product)
        )
      );
    }

    // 면적 필터
    if (filters.minArea) {
      filtered = filtered.filter(customer =>
        customer.requiredArea >= parseInt(filters.minArea)
      );
    }
    if (filters.maxArea) {
      filtered = filtered.filter(customer =>
        customer.requiredArea <= parseInt(filters.maxArea)
      );
    }

    // 팔레트 수 필터
    if (filters.minPallets) {
      filtered = filtered.filter(customer =>
        customer.palletCount >= parseInt(filters.minPallets)
      );
    }
    if (filters.maxPallets) {
      filtered = filtered.filter(customer =>
        customer.palletCount <= parseInt(filters.maxPallets)
      );
    }

    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [searchTerm, filters, allCustomers]);

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

  const premiumCustomers = [...filteredCustomers]
    .filter((c) => premiumMap.has(c.id))
    .sort((a, b) => {
      const la = latestById.get(a.id);
      const lb = latestById.get(b.id);
      if (la && lb) return new Date(lb.created_at) - new Date(la.created_at);
      if (la) return -1;
      if (lb) return 1;
      return 0;
    });

  const regularCustomers = [...filteredCustomers]
    .filter((c) => !premiumMap.has(c.id))
    .sort((a, b) => getSortDate(b) - getSortDate(a));

  // 페이지네이션 (일반 고객사만)
  const totalPages = Math.ceil(regularCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = regularCustomers.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Users className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">고객사 찾기</h1>
          </div>

          {/* 검색바 */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="회사명, 지역, 취급물품으로 검색하세요"
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
                총 <span className="font-semibold text-primary-600">{filteredCustomers.length}</span>개의 고객사를 찾았습니다
              </p>
            </div>

            {/* 프리미엄 고객사 섹션 - 첫 페이지에 모두 표시 */}
            {premiumCustomers.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center mb-6">
                  <StarIcon className="w-6 h-6 text-yellow-500 mr-2" />
                  <h2 className="text-2xl font-bold text-gray-900">프리미엄 고객사</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {premiumCustomers.map(customer => (
                    <CustomerCard
                      key={customer.id}
                      customer={customer}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 일반 고객사 섹션 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">일반 고객사</h2>
            </div>

            {/* 고객사 리스트 */}
            <div>
              {currentCustomers.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentCustomers.map(customer => (
                      <CustomerCard
                        key={customer.id}
                        customer={customer}
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
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              currentPage === index + 1
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
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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

export default CustomerSearch;
