import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Square, Thermometer, Truck, Star, Phone, Mail, ArrowLeft } from 'lucide-react';
import { warehouseData } from '../data/sampleData';
import ContactModal from '../components/ContactModal';
import { formatArea } from '../utils/areaConverter';
import { getDisplayNameHelper, isAlreadyViewed } from '../utils/viewingPassUtils';

const WarehouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isViewed, setIsViewed] = useState(false);
  const [showJibun, setShowJibun] = useState(false);

  const [warehouse, setWarehouse] = useState(null);

  useEffect(() => {
    const fetchWarehouse = async () => {
      // 1. 샘플 데이터에서 검색
      let found = warehouseData.find(w => w.id === parseInt(id));

      // 2. 없으면 Supabase에서 검색 (비동기)
      if (!found) {
        try {
          const { data, error } = await supabase
            .from('warehouses')
            .select('*')
            .eq('id', id)
            .single();

          if (data) {
            // DB 데이터를 프론트엔드 포맷으로 변환
            found = {
              ...data,
              companyName: data.company_name,
              businessNumber: data.business_number,
              contactNumber: data.contact_number,
              // 필요하다면 추가 필드 매핑
              storageTypes: data.storage_types || [],
              deliveryCompanies: data.delivery_companies || [],
              delivery: data.delivery_companies || [],
              location: data.location,
              city: data.city,
              dong: data.dong,
              detailAddress: data.detail_address,
              roadAddress: data.road_address,
              jibunAddress: data.jibun_address,
              totalArea: data.total_area,
              availableArea: data.available_area,
              palletCount: data.pallet_count,
              products: data.products || [],
              temperature: (data.storage_types || []).join('/'),
            };
          }
        } catch (err) {
          console.error("Error fetching warehouse detail:", err);
        }
      }
      setWarehouse(found);
    };

    fetchWarehouse();
  }, [id]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!warehouse) {
        // warehouse 로딩이 끝났는데도 없으면 (loading state 처리 필요하지만 일단 null 체크)
        // 여기서는 warehouse가 set 된 이후에만 실행됨
        return;
      }

      setLoading(false); // warehouse 찾았으면 로딩 끝

      // 접근 권한 확인
      const isAdmin = localStorage.getItem('adminAuth') === 'true';
      // Self viewing check logic is implicit in viewingPassUtils useViewingPass, 
      // but here we just check if it's already viewed/unlocked.
      // If WE are the owner, we should be able to see it.
      // But isAlreadyViewed only checks viewing_history. 
      // We need to check if 'isSelf' too? 
      // Actually isAlreadyViewed doesn't check self.
      // We should check self here to prevent redirect.

      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      const isSelf = user && (String(user.id) === String(warehouse.id) || user.company_name === warehouse.companyName);

      const viewed = await isAlreadyViewed(warehouse.id, 'warehouse');

      if (!isAdmin && !viewed && !isSelf) {
        alert('접근 권한이 없습니다. 먼저 열람권을 사용하여 잠금을 해제해주세요.');
        navigate('/warehouse-search');
      } else {
        setIsViewed(viewed || isSelf);
        setLoading(false);
      }
    };

    if (warehouse) {
      checkAccess();
    } else {
      // 데이터 패칭 중이 아니라고 판단되면 (useEffect 의존성 등)
      // 타임아웃 등을 줄 수도 있으나 간단히 처리
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">권한 확인 중...</p>
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
                  <h1 className="text-3xl font-bold mr-4">{getDisplayNameHelper(warehouse, 'warehouse', isViewed)}</h1>
                  <button 
                    onClick={() => setShowJibun(!showJibun)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/40 bg-white/10 text-white hover:bg-white/20 transition-colors shadow-sm"
                  >
                    {showJibun ? '도로명 주소 보기' : '지번 주소 보기'}
                  </button>
                  {warehouse.isPremium && (
                    <div className="ml-4 bg-secondary-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      프리미엄
                    </div>
                  )}
                </div>
                <p className="text-blue-100 text-lg font-bold">
                  {showJibun 
                    ? (warehouse.jibun_address || warehouse.jibunAddress || `${warehouse.location || ''} ${warehouse.city || ''} ${warehouse.dong || ''}`.trim())
                    : (warehouse.road_address || warehouse.roadAddress || warehouse.detail_address || warehouse.detailAddress || `${warehouse.location || ''} ${warehouse.city || ''} ${warehouse.dong || ''}`.trim())
                  }
                </p>
                <p className="text-blue-200 text-base mt-1">
                  {(warehouse.road_address || warehouse.roadAddress) ? (warehouse.detail_address || warehouse.detailAddress) : ''}
                </p>
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
