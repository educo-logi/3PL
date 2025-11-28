import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Square, Thermometer, Truck, Star, Phone, Mail, ArrowLeft } from 'lucide-react';
import { warehouseData } from '../data/sampleData';
import ContactModal from '../components/ContactModal';
import { formatArea } from '../utils/areaConverter';
import { getDisplayName, isAlreadyViewed } from '../utils/viewingPassUtils';

const WarehouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);

  const warehouse = warehouseData.find(w => w.id === parseInt(id));

  useEffect(() => {
    // 접근 권한 확인
    const isAdmin = localStorage.getItem('adminAuth') === 'true';
    const isViewed = warehouse && isAlreadyViewed(warehouse.id, 'warehouse');

    if (!isAdmin && !isViewed) {
      alert('접근 권한이 없습니다. 먼저 열람권을 사용하여 잠금을 해제해주세요.');
      navigate('/warehouse-search');
    }
  }, [warehouse, navigate]);

  if (!warehouse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">창고를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">요청하신 창고 정보가 존재하지 않습니다.</p>
          <a
            href="/warehouse-search"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            창고 목록으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <a
            href="/warehouse-search"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            창고 목록으로 돌아가기
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <h1 className="text-3xl font-bold">{getDisplayName(warehouse, 'warehouse')}</h1>
                  {warehouse.isPremium && (
                    <div className="ml-4 bg-secondary-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      프리미엄
                    </div>
                  )}
                </div>
                <p className="text-blue-100 text-lg">{warehouse.location}</p>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 기본 정보 */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">창고 정보</h2>

                <div className="space-y-6">
                  {/* 면적 정보 */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Square className="w-5 h-5 mr-2 text-primary-600" />
                      면적 정보
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">총 면적</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatArea(warehouse.totalArea)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">이용가능면적</p>
                        <p className="text-xl font-bold text-primary-600">
                          {formatArea(warehouse.availableArea)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 보관 방식 */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Thermometer className="w-5 h-5 mr-2 text-primary-600" />
                      보관 방식
                    </h3>
                    <p className="text-lg text-gray-700">{warehouse.temperature}</p>
                  </div>

                  {/* 배송사 */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Truck className="w-5 h-5 mr-2 text-primary-600" />
                      사용 배송사
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {warehouse.delivery.map(company => (
                        <span
                          key={company}
                          className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 추가 정보 (프리미엄 창고만) */}
                  {warehouse.isPremium && (
                    <>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">경력</h3>
                        <p className="text-lg text-gray-700">{warehouse.experience}</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">취급 물품</h3>
                        <div className="flex flex-wrap gap-2">
                          {warehouse.products.map(product => (
                            <span
                              key={product}
                              className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm"
                            >
                              {product}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">사용 솔루션</h3>
                        <p className="text-lg text-gray-700">{warehouse.solution}</p>
                      </div>
                    </>
                  )}

                  {/* 설명 */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">창고 소개</h3>
                    <p className="text-gray-700 leading-relaxed">{warehouse.description}</p>
                  </div>
                </div>
              </div>

              {/* 연락처 정보 */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">연락처 정보</h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-5 h-5 mr-3" />
                      <span className="text-sm">전화번호</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-5 h-5 mr-3" />
                      <span className="text-sm">이메일</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      연락처를 보려면 결제가 필요합니다.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowContactModal(true)}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                  >
                    연락처 보기
                  </button>

                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      연락처 열람권이 필요합니다
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 연락처 모달 */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        contactInfo={warehouse}
        type="warehouse"
      />
    </div>
  );
};

export default WarehouseDetail;
