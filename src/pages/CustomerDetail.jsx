import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Square, Package, Users, Phone, Mail, ArrowLeft } from 'lucide-react';
import { customerData } from '../data/sampleData';
import ContactModal from '../components/ContactModal';
import { formatArea } from '../utils/areaConverter';
import { getDisplayNameHelper, isAlreadyViewed } from '../utils/viewingPassUtils';
import AddressDisplay from '../components/AddressDisplay';
import { getAreaDisplayValues } from '../utils/areaConverter';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isViewed, setIsViewed] = useState(false);
  const [showJibun, setShowJibun] = useState(false);
  const [showAreaPyeong, setShowAreaPyeong] = useState(false);

  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      // 1. 샘플 데이터에서 검색
      let found = customerData.find(c => c.id === parseInt(id));

      // 2. 없으면 Supabase에서 검색
      if (!found) {
        try {
          const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

          if (data) {
            found = {
              ...data,
              companyName: data.company_name,
              contactNumber: data.contact_number || data.phone,
              location: data.location,
              city: data.city,
              dong: data.dong,
              detailAddress: data.detail_address,
              roadAddress: data.road_address,
              jibunAddress: data.jibun_address,
              products: data.products || [],
              requiredArea: data.required_area,
              requiredAreaUnit: data.required_area_unit,
              monthlyVolume: data.monthly_volume,
              desiredDelivery: data.desired_delivery || [],
            };
          }
        } catch (err) {
          console.error("Error fetching customer detail:", err);
        }
      }
      setCustomer(found);
    };
    fetchCustomer();
  }, [id]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!customer) return;

      setLoading(false);

      // 접근 권한 확인
      const isAdmin = localStorage.getItem('adminAuth') === 'true';

      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      const isSelf = user && (String(user.id) === String(customer.id) || user.company_name === customer.companyName);

      const viewed = await isAlreadyViewed(customer.id, 'customer');

      if (!isAdmin && !viewed && !isSelf) {
        alert('접근 권한이 없습니다. 먼저 열람권을 사용하여 잠금을 해제해주세요.');
        navigate('/customer-search');
      } else {
        setIsViewed(viewed || isSelf);
        setLoading(false);
      }
    };

    if (customer) {
      checkAccess();
    }
  }, [customer, navigate]);

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">고객사를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">요청하신 고객사 정보가 존재하지 않습니다.</p>
          <a
            href="/customer-search"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            고객사 목록으로 돌아가기
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
            href="/customer-search"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            고객사 목록으로 돌아가기
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <h1 className="text-3xl font-bold mr-4">{getDisplayNameHelper(customer, 'customer', isViewed)}</h1>
                  <button 
                    onClick={() => setShowJibun(!showJibun)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/40 bg-white/10 text-white hover:bg-white/20 transition-colors shadow-sm"
                  >
                    {showJibun ? '도로명 주소 보기' : '지번 주소 보기'}
                  </button>
                </div>
                <div className="text-blue-100">
                  <AddressDisplay data={customer} showJibun={showJibun} />
                </div>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 기본 정보 */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">고객사 정보</h2>

                <div className="space-y-6">
                  {/* 면적 정보 */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Square className="w-5 h-5 mr-2 text-primary-600" />
                        필요 면적
                      </h3>
                      <button 
                        onClick={() => setShowAreaPyeong(!showAreaPyeong)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        {showAreaPyeong ? '㎡ 보기' : '평수 보기'}
                      </button>
                    </div>
                    <p className="text-2xl font-bold text-primary-600">
                      {customer.requiredArea 
                        ? (showAreaPyeong ? `${getAreaDisplayValues(customer.requiredArea, customer.requiredAreaUnit || 'sqm').pyeong} 평` : `${getAreaDisplayValues(customer.requiredArea, customer.requiredAreaUnit || 'sqm').sqm} ㎡`)
                        : '-'}
                    </p>
                  </div>

                  {/* 출고량 정보 */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-primary-600" />
                      월 평균 출고량
                    </h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {customer.monthlyVolume.toLocaleString()}개
                    </p>
                  </div>

                  {/* 취급 물품 */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-primary-600" />
                      취급 물품
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {customer.products.map(product => (
                        <span
                          key={product}
                          className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 원하는 배송사 */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">원하는 배송사</h3>
                    <div className="flex flex-wrap gap-2">
                      {customer.desiredDelivery.map(company => (
                        <span
                          key={company}
                          className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm"
                        >
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 설명 */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">고객사 소개</h3>
                    <p className="text-gray-700 leading-relaxed">{customer.description}</p>
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
        contactInfo={customer}
        type="customer"
      />
    </div>
  );
};

export default CustomerDetail;
