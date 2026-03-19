import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { paymentConfig } from '../config/paymentConfig';
import { premiumPackages, createPremiumApplication } from '../utils/premiumUtils';
import { createNotification } from '../utils/notificationUtils';
import { supabase } from '../utils/supabaseClient';
import { loadTossPayments } from '@tosspayments/payment-sdk';

const PremiumApplyPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const itemType = searchParams.get('type'); // 'warehouse' | 'customer'
  const itemId = searchParams.get('itemId');

  const [currentUser, setCurrentUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('5day');
  const [itemInfo, setItemInfo] = useState(null);
  const [isLoadingItem, setIsLoadingItem] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) {
      navigate('/login');
      return;
    }

    // users 배열에서 최신 상태 확인
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const latestUser = allUsers.find(u => u.id === user.id) || user;
    setCurrentUser(latestUser);

    // 아이템 정보 가져오기
    if (itemId && itemType) {
      loadItemInfo(itemId, itemType).finally(() => setIsLoadingItem(false));
    } else {
      setIsLoadingItem(false);
    }
  }, [navigate, itemId, itemType]);

  const loadItemInfo = async (id, type) => {
    try {
      const table = type === 'warehouse' ? 'warehouses' : 'customers';
      const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();

      if (!error && data) {
        setItemInfo({
          id: data.id,
          name: data.company_name || data.companyName || (type === 'warehouse' ? '창고' : '고객사'),
          type: type
        });
        return;
      }
    } catch (err) {
      console.warn('DB fetch failed, falling back to localStorage:', err);
    }

    if (type === 'warehouse') {
      // 승인된 창고, 대기 중인 창고, 샘플 데이터 모두 확인
      const approvedWarehouses = JSON.parse(localStorage.getItem('approvedWarehouses') || '[]');
      const pendingWarehouses = JSON.parse(localStorage.getItem('pendingWarehouses') || '[]');
      const warehouseData = JSON.parse(localStorage.getItem('warehouseData') || '[]');

      const allWarehouses = [
        ...approvedWarehouses,
        ...pendingWarehouses,
        ...warehouseData
      ];

      const warehouse = allWarehouses.find(w => w.id === id);

      // 찾지 못한 경우, users 배열에서 직접 찾기
      if (!warehouse) {
        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const user = allUsers.find(u => u.id === id && u.userType === 'warehouse');
        if (user) {
          setItemInfo({
            id: user.id,
            name: user.companyName || '창고',
            type: 'warehouse'
          });
          return;
        }
      } else {
        setItemInfo({
          id: warehouse.id,
          name: warehouse.companyName || '창고',
          type: 'warehouse'
        });
      }
    } else if (type === 'customer') {
      // 승인된 고객사, 대기 중인 고객사, 샘플 데이터 모두 확인
      const approvedCustomers = JSON.parse(localStorage.getItem('approvedCustomers') || '[]');
      const pendingCustomers = JSON.parse(localStorage.getItem('pendingCustomers') || '[]');
      const customerData = JSON.parse(localStorage.getItem('customerData') || '[]');

      const allCustomers = [
        ...approvedCustomers,
        ...pendingCustomers,
        ...customerData
      ];

      const customer = allCustomers.find(c => c.id === id);

      // 찾지 못한 경우, users 배열에서 직접 찾기
      if (!customer) {
        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const user = allUsers.find(u => u.id === id && u.userType === 'customer');
        if (user) {
          setItemInfo({
            id: user.id,
            name: user.companyName || '고객사',
            type: 'customer'
          });
          return;
        }
      } else {
        setItemInfo({
          id: customer.id,
          name: customer.companyName || '고객사',
          type: 'customer'
        });
      }
    }
  };


  // 로그인하지 않았거나 아이템 정보를 찾지 못한 경우
  if (!currentUser) {
    return null;
  }

  // 아이템 정보를 찾지 못한 경우
  if (!itemInfo) {
    if (isLoadingItem) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">업체 정보 확인 중</h2>
            <p className="text-gray-600">
              업체 정보를 불러오고 있습니다.<br />
              잠시만 기다려주세요...
            </p>
          </div>
        </div>
      );
    }

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

  // 승인 상태 확인
  const isApproved = currentUser.status === 'approved';
  const isPending = currentUser.status === 'pending' || !currentUser.status;

  const handlePayment = async () => {
    if (!currentUser) return;

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const latestUser = allUsers.find(u => u.id === currentUser.id) || currentUser;

/*
    if (latestUser.status === 'pending' || !latestUser.status) {
      alert('결제를 진행하려면 먼저 관리자의 승인이 필요합니다.\n관리자 승인 후 다시 시도해주세요.');
      return;
    }
*/

    setIsProcessing(true);

    try {
      const tossPayments = await loadTossPayments('test_ck_ZLKGPx4M3MGk5NPWgyaRrBaWypv1');
      const orderId = `premium_${new Date().getTime()}_${currentUser.id}`;
      const orderName = `[프리미엄] ${itemInfo.name} ${selectedPackageInfo.name}`;
      
      await tossPayments.requestPayment('카드', {
        amount: selectedPackageInfo.price,
        orderId,
        orderName,
        customerName: latestUser.name || latestUser.companyName || '고객',
        successUrl: `${window.location.origin}/payment/success?isPremium=true&itemId=${itemInfo.id}&itemType=${itemInfo.type}&packageType=${selectedPackage}`,
        failUrl: `${window.location.origin}/payment/fail?failRedirect=/premium-apply?type=${itemInfo.type}&itemId=${itemInfo.id}`
      });
    } catch (err) {
      console.error('프리미엄 결제 초기화 에러:', err);
      if (err.code !== 'USER_CANCEL') {
        alert('결제창을 띄우지 못했습니다: ' + err.message);
      }
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">결제 완료!</h2>
          <p className="text-gray-600 mb-6">
            프리미엄 신청이 완료되었습니다.<br />
            지금 즉시 상단 프리미엄 영역에 노출됩니다.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <p className="text-sm text-gray-700 mb-2"><strong>결제 내역:</strong></p>
            <p className="text-sm text-gray-600">
              • 업체명: {itemInfo.name}<br />
              • 패키지: {selectedPackageInfo.name}<br />
              • 기간: {selectedPackageInfo.days}일
            </p>
          </div>
          <button
            onClick={() => navigate('/mypage')}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            마이페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

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
                    className={`p-4 rounded-lg border-2 transition-all relative ${selectedPackage === key
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                      }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                        {pkg.discount && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold">
                            {pkg.discount}
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-primary-600 mb-1">
                        {pkg.days}일
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        유효기간: {pkg.days}일
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {pkg.price.toLocaleString()}원
                      </p>

                      {selectedPackage === key && (
                        <div className="mt-2 text-primary-600 text-sm font-semibold flex items-center">
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
                  <span className="text-gray-600">적용 대상</span>
                  <span className="font-semibold text-gray-900">{itemInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">패키지명</span>
                  <span className="font-semibold text-gray-900">{selectedPackageInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">이용 기간</span>
                  <span className="font-semibold text-gray-900">{selectedPackageInfo.days}일</span>
                </div>
                <div className="flex justify-between pt-2 border-t mt-2">
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
                  <p className="font-semibold mb-2">프리미엄 안내사항</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>프리미엄 노출은 <span className="font-bold text-primary-600">결제 즉시</span> 시작됩니다.</li>
                    <li><span className="font-bold text-blue-800">시간 비례 종료 예시</span>: 월요일 오후 3시 결제(5일권) 시 정확히 5일(120시간) 뒤인 토요일 오후 3시까지 빈틈없이 노출되어 시간 손실이 없습니다.</li>
                    <li>모든 프리미엄 업체는 조회 시마다 <span className="font-bold text-primary-600">무작위(랜덤)</span>로 순서가 섞여 모두에게 공정한 노출 기회가 제공됩니다.</li>
                    <li>이용 기간이 모두 만료되면 자동으로 일반 업체 노출로 즉시 전환됩니다.</li>
                    <li>기간 내 추가 연장 결제 시 기존 남은 기간에 <span className="font-bold">이어서 만료일이 추가 연장</span>됩니다.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 승인 대기 안내 (임시 해제) */}
            {/*
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
            */}


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
                disabled={isProcessing}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center ${isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    결제 처리 중...
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

