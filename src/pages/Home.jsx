import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Users, ArrowRight } from 'lucide-react';
import { trackEvent, GA_EVENTS } from '../utils/gtm';
import { supabase } from '../utils/supabaseClient';
import { warehouseData, customerData } from '../data/sampleData';
import WarehouseCard from '../components/WarehouseCard';
import CustomerCard from '../components/CustomerCard';
import { isPremiumActive, getItemPremiumApplications } from '../utils/premiumUtils';

const Home = () => {
  const navigate = useNavigate();
  const [recentWarehouses, setRecentWarehouses] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);

  useEffect(() => {
    const fetchRecentData = async () => {
      // 1. Fetch Warehouses
      try {
        const { data: wData, error: wError } = await supabase
          .from('vw_public_warehouses')
          .select('*');
          // .eq('status', 'approved');

        let allWarehouses = [...warehouseData];
        if (!wError && wData) {
          const mappedWarehouses = wData.map(w => ({
            ...w,
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
            name: w.company_name,
            location: w.location,
            delivery: w.delivery_companies || w.delivery || [],
            solutions: w.solutions || (w.solution ? w.solution.split(',').map(s => s.trim()) : [])
          }));
          const existingIds = warehouseData.map(w => w.id);
          const newWarehouses = mappedWarehouses.filter(w => !existingIds.includes(w.id));
          allWarehouses = [...newWarehouses, ...warehouseData]; // Show Supabase data first (usually newer)
        }

        // Sort by date (newest first)
        const sortedWarehouses = allWarehouses.sort((a, b) => {
          const getSortDate = (item) => {
            if (item.approvedAt) return new Date(item.approvedAt).getTime();
            if (item.submittedAt) return new Date(item.submittedAt).getTime();
            if (typeof item.id === 'string' && item.id.includes('-')) {
              const timestamp = item.id.split('-').pop();
              return parseInt(timestamp) || 0;
            }
            return typeof item.id === 'number' ? item.id : 0;
          };
          return getSortDate(b) - getSortDate(a);
        });

        // Add premium details (Async fix)
        const warehousesWithPremium = await Promise.all(
          sortedWarehouses.map(async (w) => ({
            ...w,
            isPremium: await isPremiumActive(w.id, 'warehouse')
          }))
        );

        setRecentWarehouses(warehousesWithPremium.slice(0, 4));

      } catch (error) {
        console.error('Error fetching warehouses:', error);
        setRecentWarehouses(warehouseData.slice(0, 4));
      }

      // 2. Fetch Customers
      try {
        const { data: cData, error: cError } = await supabase
          .from('vw_public_customers')
          .select('*');
          // .eq('status', 'approved');

        let allCustomers = [...customerData];
        if (!cError && cData) {
          const mappedCustomers = cData.map(c => ({
            ...c,
            companyName: c.company_name,
            businessNumber: c.business_number,
            contactNumber: c.contact_number,
            addressDetail: c.address_detail,
            requiredArea: c.required_area,
            monthlyVolume: c.monthly_volume,
            palletCount: c.pallet_count,
            desiredDelivery: c.desired_delivery,
            submittedAt: c.submitted_at,
            approvedAt: c.approved_at,
            name: c.company_name,
            location: c.location,
            products: c.products || [],
            delivery: c.desired_delivery || []
          }));
          const existingIds = customerData.map(c => c.id);
          const newCustomers = mappedCustomers.filter(c => !existingIds.includes(c.id));
          allCustomers = [...newCustomers, ...customerData];
        }

        // Sort by date (newest first)
        const sortedCustomers = allCustomers.sort((a, b) => {
          const getSortDate = (item) => {
            if (item.approvedAt) return new Date(item.approvedAt).getTime();
            if (item.submittedAt) return new Date(item.submittedAt).getTime();
            if (typeof item.id === 'string' && item.id.includes('-')) {
              const timestamp = item.id.split('-').pop();
              return parseInt(timestamp) || 0;
            }
            return typeof item.id === 'number' ? item.id : 0;
          };
          return getSortDate(b) - getSortDate(a);
        });

        // Add premium details (Async fix)
        const customersWithPremium = await Promise.all(
          sortedCustomers.map(async (c) => ({
            ...c,
            isPremium: await isPremiumActive(c.id, 'customer')
          }))
        );

        setRecentCustomers(customersWithPremium.slice(0, 4));

      } catch (error) {
        console.error('Error fetching customers:', error);
        setRecentCustomers(customerData.slice(0, 4));
      }
    };

    fetchRecentData();
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section
        className="relative hero-bg-force text-white py-16 lg:py-24 overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#1e3a8a] via-[#1e40af] to-[#1e3a8a] opacity-90 hero-bg-force"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            최적의 물류 파트너를 <br className="hidden sm:block" />
            <span className="text-secondary-400">빠르고 쉽게</span> 찾아보세요
          </h1>
          <p className="mt-4 text-xl text-primary-100 max-w-3xl mx-auto mb-10">
            3PL 물류대행 플랫폼은 창고업체와 고객사를 연결하여
            비즈니스 성장을 지원합니다.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => {
                trackEvent(GA_EVENTS.CTA_CLICK, { label: 'home_warehouse_search' });
                navigate('/warehouse-search');
              }}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-900 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition-colors"
            >
              <Building2 className="w-5 h-5 mr-2" />
              창고 찾기
            </button>
            <button
              onClick={() => {
                trackEvent(GA_EVENTS.CTA_CLICK, { label: 'home_customer_search' });
                navigate('/customer-search');
              }}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10 transition-colors"
            >
              <Users className="w-5 h-5 mr-2" />
              고객사 찾기
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* 처음봄 이벤트 배너 */}
          <div 
            onClick={() => navigate('/login')}
            className="mb-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-3xl p-8 text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 flex flex-col md:flex-row items-center justify-between group overflow-hidden relative"
          >
            {/* Background Details */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-400 rounded-full opacity-30 blur-3xl group-hover:scale-125 transition-transform duration-500"></div>
            <div className="absolute right-20 bottom-0 w-32 h-32 bg-pink-400 rounded-full opacity-30 blur-xl"></div>
            
            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                🎁
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-white/20 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full text-white">웰컴 이벤트</span>
                  <p className="text-sm font-semibold text-rose-100">간단한 가입으로 물류 매칭 서비스를 시작해 보세요!</p>
                </div>
                <p className="text-2xl md:text-3xl font-black tracking-tight leading-snug">
                  지금 로그인/가입하고 <span className="text-yellow-300">3회 무료 열람권</span> 받기
                </p>
              </div>
            </div>
            
            <button className="mt-4 md:mt-0 bg-white text-rose-600 px-8 py-4 rounded-xl font-bold text-lg shadow-md hover:bg-rose-50 transition-all flex items-center shrink-0 w-full md:w-auto justify-center group-hover:scale-105 duration-300">
              무료로 시작하기
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-gray-50 rounded-3xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-primary-600 transition-colors duration-300">
                  <Search className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="ml-5 text-2xl font-bold text-gray-900">간편한 검색</h3>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                지역, 평수, 취급 품목 등 다양한 조건으로<br className="hidden xl:block" />
                원하는 물류센터를 쉽고 빠르게 찾을 수 있습니다.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-gray-50 rounded-3xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-primary-600 transition-colors duration-300">
                  <Building2 className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="ml-5 text-2xl font-bold text-gray-900">검증된 창고</h3>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                엄격한 심사를 통과한 신뢰할 수 있는<br className="hidden xl:block" />
                물류 파트너들이 여러분을 기다리고 있습니다.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-gray-50 rounded-3xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-primary-600 transition-colors duration-300">
                  <Users className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="ml-5 text-2xl font-bold text-gray-900">합리적 선택</h3>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                다양한 파트너의 조건을 비교해보고<br className="hidden xl:block" />
                우리 비즈니스에 꼭 맞는 곳을 찾으세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Registrations Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


          {/* Recent Warehouses */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Building2 className="w-6 h-6 mr-3 text-primary-600" />
                최근 등록 창고
              </h3>
              <button
                onClick={() => navigate('/warehouse-search')}
                className="flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                더보기 <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentWarehouses.map(warehouse => (
                <WarehouseCard key={warehouse.id} warehouse={warehouse} isPremium={warehouse.isPremium} />
              ))}
            </div>
          </div>

          {/* Recent Customers */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="w-6 h-6 mr-3 text-primary-600" />
                최근 등록 고객사
              </h3>
              <button
                onClick={() => navigate('/customer-search')}
                className="flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                더보기 <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentCustomers.map(customer => (
                <CustomerCard key={customer.id} customer={customer} isPremium={customer.isPremium} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
