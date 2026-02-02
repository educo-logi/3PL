import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Users } from 'lucide-react';
import { trackEvent, GA_EVENTS } from '../utils/gtm';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section
        className="relative hero-bg-force text-white py-20 lg:py-32 overflow-hidden"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">간편한 검색</h3>
              <p className="text-gray-600">
                지역, 평수, 취급 품목 등 다양한 조건으로
                원하는 물류센터를 쉽고 빠르게 찾을 수 있습니다.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">검증된 창고</h3>
              <p className="text-gray-600">
                엄격한 심사를 통과한 신뢰할 수 있는
                물류 파트너들이 여러분을 기다리고 있습니다.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">맞춤 견적</h3>
              <p className="text-gray-600">
                비즈니스 규모와 요구사항에 맞는
                합리적인 견적을 받아보세요.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
