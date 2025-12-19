import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { paymentConfig } from '../config/paymentConfig';
import { premiumPackages, createPremiumApplication } from '../utils/premiumUtils';
import { createNotification } from '../utils/notificationUtils';
import { supabase } from '../utils/supabaseClient';
import { warehouseData, customerData } from '../data/sampleData';

const PremiumApplyPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const itemType = searchParams.get('type'); // 'warehouse' | 'customer'
  const itemId = searchParams.get('itemId');

  const [currentUser, setCurrentUser] = useState(null);
  const [profileStatus, setProfileStatus] = useState('pending');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('1month');
  const [itemInfo, setItemInfo] = useState(null);
  const isPending = profileStatus === 'pending' || !profileStatus;

  useEffect(() => {
    const loadUserAndItem = async () => {
      const { data } = await supabase.auth.getUser();
      const supaUser = data?.user;
      const localUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      const baseUser = supaUser
        ? {
            id: supaUser.id,
            email: supaUser.email,
            userType: supaUser.user_metadata?.userType,
            status: supaUser.user_metadata?.status || 'pending'
          }
        : localUser;

      if (!baseUser) {
        navigate('/login');
        return;
      }

      setCurrentUser(baseUser);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', baseUser.id)
        .maybeSingle();
      if (error) {
        console.error('프로필 조회 오류:', error);
      }
      setProfileStatus(profile?.status || baseUser.status || 'pending');

      if (itemId && itemType) {
        loadItemInfo(itemId, itemType);
      }
    };

    loadUserAndItem();
  }, [navigate, itemId, itemType]);

  const loadItemInfo = async (id, type) => {
    if (type === 'warehouse') {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, company_name')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        console.error('창고 조회 오류:', error);
      }
      if (data) {
        setItemInfo({
          id: data.id,
          name: data.company_name || '창고',
          type: 'warehouse'
        });
        return;
      }

      const fallback = warehouseData.find(w => w.id === id);
      if (fallback) {
        setItemInfo({
          id: fallback.id,
          name: fallback.companyName || '창고',
          type: 'warehouse'
        });
      }
    } else if (type === 'customer') {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_name')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        console.error('고객사 조회 오류:', error);
      }
      if (data) {
        setItemInfo({
          id: data.id,
          name: data.company_name || '고객사',
          type: 'customer'
        });
        return;
      }

      const fallback = customerData.find(c => c.id === id);
      if (fallback) {
        setItemInfo({
          id: fallback.id,
          name: fallback.companyName || '고객사',
          type: 'customer'
        });
      }
    }
  };

  const handlePayment = () => {
    if (!currentUser || !itemInfo) return;
    if (isPending) {
      alert('승인 대기 중입니다. 관리자 승인 후 진행해주세요.');
      return;
    }

    setIsProcessing(true);

    // 테스트 모드 결제 시뮬레이션
    if (paymentConfig.isTestMode) {
      setTimeout(() => {
        createPremiumApplication(itemInfo.id, itemInfo.type, selectedPackage, currentUser.id);
        createNotification(
          currentUser.id,
          'premium',
          '프리미엄 신청 완료',
          `${itemInfo.name} 프리미엄 신청이 완료되었습니다.`
        );
        setIsProcessing(false);
        setIsSuccess(true);
      }, 800);
    } else {
      alert('실제 결제는 추후 PG 연동 후 제공될 예정입니다.');
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    const info = premiumPackages[selectedPackage];
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">프리미엄 신청 완료</h2>
          <p className="text-gray-600 mb-6">
            {itemInfo?.name}의 프리미엄 신청이 완료되었습니다.
            <br />
            관리자 승인 후 노출이 시작됩니다.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <p className="text-sm text-gray-700 mb-2">
              <strong>신청 내역:</strong>
            </p>
            <p className="text-sm text-gray-600">
              • 기간: {info?.months}개월<br />
              • 금액: {info?.price?.toLocaleString()}원
            </p>
          </div>
          <button
            onClick={() => navigate('/mypage')}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            마이페이지로 이동
          </button>
        </div>
      </div>
    );
  }


  // 로그인하지 않았거나 아이템 정보를 찾지 못한 경우
  if (!currentUser) {
    return null;
  }

  // 아이템 정보를 찾지 못한 경우
  if (!itemInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">업체 정보를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">
            등록하신 업체 정보를 찾을 수 없습니다.
            <br />
            다시 시도해주세요.
          </p>
          <button
            onClick={() => navigate('/mypage')}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            마이페이지로 이동
          </button>
        </div>
      </div>
    );
  }


  const selectedPackageInfo = premiumPackages[selectedPackage];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-secondary-500 text-white px-6 py-4">
            <h1 className="text-2xl font-bold">프리미엄 신청</h1>
          </div>

          <div className="p-6 space-y-6">
            {/* 패키지 선택 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">패키지 선택</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(premiumPackages).map(([key, pkg]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPackage(key)}
                    className={`p-4 rounded-lg border-2 transition-all ${selectedPackage === key
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                      }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                        {pkg.discount && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                            {pkg.discount}
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-primary-600 mb-1">
                        {pkg.months}개월
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        유효기간: {pkg.months}개월
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {pkg.price.toLocaleString()}원
                      </p>
                      {selectedPackage === key && (
                        <div className="mt-2 text-primary-600 text-sm font-semibold">
                          ✓ 선택됨
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 선택된 패키지 정보 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">선택한 패키지</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">패키지명</span>
                  <span className="font-semibold text-gray-900">{selectedPackageInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">기간</span>
                  <span className="font-semibold text-gray-900">{selectedPackageInfo.months}개월</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-lg font-semibold text-gray-900">결제 금액</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {selectedPackageInfo.price.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            {/* 안내사항 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-2">안내사항</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>프리미엄 신청 시 최상단에 노출됩니다.</li>
                    <li>최근 신청한 프리미엄 업체가 가장 위에 표시됩니다.</li>
                    <li>기간이 만료되면 자동으로 일반 업체로 전환됩니다.</li>
                    <li>기간 연장 시 기존 만료일 기준으로 연장됩니다.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 승인 대기 안내 */}
            {isPending && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">승인 대기 중</p>
                    <p>프리미엄 신청을 진행하려면 먼저 관리자의 승인이 필요합니다.</p>
                    <p className="mt-1">관리자 승인 후 다시 시도해주세요.</p>
                  </div>
                </div>
              </div>
            )}


            {/* 테스트 모드 안내 */}
            {paymentConfig.isTestMode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">테스트 모드</p>
                    <p>현재 테스트 모드로 운영 중입니다. 실제 결제는 진행되지 않습니다.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 결제 버튼 */}
            <div className="pt-4">
              <button
                onClick={handlePayment}
                disabled={isProcessing || isPending}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center ${isProcessing || isPending
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    결제 처리 중...
                  </>
                ) : isPending ? (
                  <>
                    <AlertCircle className="w-5 h-5 mr-2" />
                    승인 대기 중
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    {selectedPackageInfo.price.toLocaleString()}원 결제하기
                  </>
                )}
              </button>
            </div>

            {/* 취소 버튼 */}
            <button
              onClick={() => navigate(-1)}
              className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumApplyPage;

