import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { paymentConfig } from '../config/paymentConfig';
import { purchaseViewingPass, getViewingPassInfo, extendViewingPass, checkEventEligibility } from '../utils/viewingPassUtils';
import { createNotification } from '../utils/notificationUtils';
import { loadTossPayments } from '@tosspayments/payment-sdk';

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action'); // 'extend' 또는 null
  const [currentUser, setCurrentUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('basic');
  const [isExtending, setIsExtending] = useState(action === 'extend');
  const [currentPass, setCurrentPass] = useState(null);
  const [isEventEligible, setIsEventEligible] = useState(false);

  // 이벤트 대상 여부에 따라 패키지 구성이 동적으로 보이도록 처리
  const packages = {
    welcome_event: { count: 10, price: 9900, originalPrice: 50000, validityMonths: 12, name: '처음 봄 이벤트 10회권 특가', isEvent: true },
    basic: { count: 10, price: 50000, validityMonths: 12, name: '기본 패키지' },
    premium: { count: 20, price: 90000, validityMonths: 12, name: '프리미엄 패키지', discount: '10% 할인' },
    deluxe: { count: 30, price: 130000, validityMonths: 12, name: '디럭스 패키지', discount: '13% 할인' }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const isAdmin = localStorage.getItem('adminAuth');

    if (!user && !isAdmin) {
      navigate('/login');
      return;
    }

    if (isAdmin && !user) {
      setCurrentUser({ id: 'admin_preview', companyName: '관리자 (미리보기)', email: 'admin@test.com' });
      setSelectedPackage('basic');
      return;
    }

    // users 배열에서 최신 상태 확인
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const latestUser = allUsers.find(u => u.id === user.id) || user;
    setCurrentUser(latestUser);

    if (isExtending) {
      const passInfo = getViewingPassInfo();
      setCurrentPass(passInfo);
    } else {
      // 이벤트 대상 여부 확인
      checkEventEligibility(user.id).then(eligible => {
        setIsEventEligible(eligible);
        if (eligible) {
          setSelectedPackage('welcome_event');
        } else {
          setSelectedPackage('basic');
        }
      });
    }
  }, [navigate, isExtending]);

  const handlePayment = async () => {
    if (!currentUser) return;

    // 승인 상태 확인
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const latestUser = allUsers.find(u => u.id === currentUser.id) || currentUser;

/*
    if (latestUser.status === 'pending' || !latestUser.status) {
      alert('결제를 진행하려면 먼저 관리자의 승인이 필요합니다.\n관리자 승인 후 다시 시도해주세요.');
      setIsProcessing(false);
      return;
    }
*/

    setIsProcessing(true);

    try {
      const isWelcomeEvent = selectedPackage === 'welcome_event';
      const amount = isExtending ? 45000 : packages[selectedPackage].price;
      
      const tossPayments = await loadTossPayments(paymentConfig.clientKey);
      const orderId = `order_${new Date().getTime()}_${currentUser.id}`;
      const orderName = isExtending ? '열람권 연장' : packages[selectedPackage].name;
      
      // 연장의 경우 현재 이용권 정보를 저장 (성공된 사이트에서 사용하기 위해)
      if (isExtending && currentPass) {
        localStorage.setItem(`viewingPass_${currentUser.id}`, JSON.stringify(currentPass));
      }

      await tossPayments.requestPayment('카드', {
        amount,
        orderId,
        orderName,
        customerName: latestUser.name || latestUser.companyName || '고객',
        successUrl: `${window.location.origin}/payment/success?packageType=${selectedPackage}&isEvent=${isWelcomeEvent}&isExtending=${isExtending}`,
        failUrl: `${window.location.origin}/payment/fail`
      });
    } catch (err) {
      console.error('결제 초기화 에러:', err);
      if (err.code !== 'USER_CANCEL') {
        alert('결제창을 띄우지 못했습니다: ' + err.message);
      }
      setIsProcessing(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  // 승인 상태 확인
  const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
  const latestUser = allUsers.find(u => u.id === currentUser.id) || currentUser;
  const isApproved = latestUser.status === 'approved';
  const isPending = latestUser.status === 'pending' || !latestUser.status;

  const selectedPackageInfo = packages[selectedPackage] || packages.basic;
  
  // 렌더링할 패키지 필터링 (이벤트 대상이 아니면 welcome_event 숨김)
  const displayPackages = Object.entries(packages).filter(([key, pkg]) => {
    if (key === 'welcome_event' && !isEventEligible) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {isExtending ? (
          // 연장 페이지
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-primary-600 text-white px-6 py-4">
              <h1 className="text-2xl font-bold">열람권 연장</h1>
            </div>
            <div className="p-6 space-y-6">
              {(currentPass || getViewingPassInfo()) ? (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">현재 열람권 정보</p>
                    <p className="font-semibold text-gray-900">
                      만료일: {new Date((currentPass || getViewingPassInfo()).expiryDate).toLocaleDateString('ko-KR')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      남은 횟수: {(currentPass || getViewingPassInfo()).remainingCount}회
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>만료 전 연장 시 10% 할인 혜택!</strong>
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      정가: 50,000원 → 할인가: 45,000원
                    </p>
                  </div>
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
                          처리 중...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          45,000원으로 연장하기
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">연장할 열람권이 없습니다.</p>
                  <button
                    onClick={() => navigate('/payment')}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
                  >
                    열람권 구매하기
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // 구매 페이지
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-primary-600 text-white px-6 py-4">
              <h1 className="text-2xl font-bold">열람권 구매</h1>
            </div>

            <div className="p-6 space-y-6">
              {/* 패키지 선택 */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">패키지 선택</h2>

                {/* 1. 처음 봄 특가 (타겟 이벤트 - 100% 너비) */}
                {displayPackages.find(([k]) => k === 'welcome_event') && (() => {
                  const [key, pkg] = displayPackages.find(([k]) => k === 'welcome_event');
                  return (
                    <button
                      key={key}
                      onClick={() => !pkg.disabled && setSelectedPackage(key)}
                      disabled={pkg.disabled}
                      style={{
                        backgroundImage: `linear-gradient(rgba(255, 240, 245, 0.7), rgba(255, 255, 255, 0.9)), url('https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=1200')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center 30%',
                      }}
                      className={`w-full p-6 mb-4 rounded-2xl border-2 transition-all relative overflow-hidden group ${
                        selectedPackage === key 
                          ? 'border-rose-500 shadow-md ring-4 ring-rose-100' 
                          : 'border-rose-200 hover:border-rose-400'
                      }`}
                    >
                      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between text-left gap-4">
                        <div className="flex-1">
                           <div className="flex items-center gap-3 mb-2">
                             <div className="flex flex-col">
                               <h3 className="text-2xl font-black text-rose-900">{pkg.name}</h3>
                               <span className="text-xs text-rose-700/80 font-medium mt-1">First Spring Event 10-Pass Special Price</span>
                             </div>
                             <span className="text-xs bg-gradient-to-r from-rose-500 to-pink-500 text-white px-2.5 py-1 rounded shadow-sm font-bold animate-pulse">
                               ⭐ 첫 구매 한정
                             </span>
                           </div>
                          <p className={`text-2xl font-bold mb-1 text-rose-600`}>
                            {pkg.count}회
                          </p>
                           <p className="text-sm text-gray-700 font-medium mt-1">
                             유효기간: {pkg.validityMonths}개월
                           </p>
                        </div>

                        <div className="flex flex-col items-start md:items-end shrink-0 md:pl-8 md:border-l border-rose-200/50 mt-4 md:mt-0 w-full md:w-auto">
                          <div className="flex flex-col md:items-end">
                            <span className="text-gray-400 text-sm decoration-2 line-through font-medium">
                              {Number(pkg.originalPrice || 0).toLocaleString()}원
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-black text-rose-600">
                                {Number(pkg.price || 0).toLocaleString()}
                              </span>
                              <span className="text-xl font-bold text-rose-600">원</span>
                            </div>
                          </div>
                      
                          {selectedPackage === key && (
                            <div className="mt-3 text-sm font-bold flex items-center text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full shadow-sm">
                              <CheckCircle className="w-4 h-4 mr-1.5" /> 선택됨
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })()}

                {/* 2. 일반 패키지 (기본, 프리미엄, 디럭스 - Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {displayPackages.filter(([k]) => k !== 'welcome_event').map(([key, pkg]) => (
                    <button
                      key={key}
                      onClick={() => !pkg.disabled && setSelectedPackage(key)}
                      disabled={pkg.disabled}
                      className={`p-4 rounded-lg border-2 transition-all relative ${pkg.disabled
                        ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                        : selectedPackage === key
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                        }`}
                    >
                      {pkg.disabled && (
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center transform -rotate-12 z-10">
                          <span className="bg-gray-600 text-white px-3 py-1 text-sm font-bold shadow-lg">이벤트 연기</span>
                        </div>
                      )}

                      <div className="text-left relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                          {!pkg.disabled && pkg.discount && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                              {pkg.discount}
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-bold mb-1 text-primary-600">
                          {pkg.count}회
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          유효기간: {pkg.validityMonths}개월
                        </p>

                        <p className="text-lg font-bold text-gray-900 mt-5">
                          {Number(pkg.price || 0).toLocaleString()}원
                        </p>

                        {selectedPackage === key && !pkg.disabled && (
                          <div className="mt-2 text-sm font-semibold flex items-center text-primary-600">
                            <CheckCircle className="w-4 h-4 mr-1" /> 선택됨
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
                    <span className="text-gray-600">사용 횟수</span>
                    <span className="font-semibold text-gray-900">{selectedPackageInfo.count}회</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">유효기간</span>
                    <span className="font-semibold text-gray-900">{selectedPackageInfo.validityMonths}개월</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-lg font-semibold text-gray-900">결제 금액</span>
                    <span className={`text-2xl font-bold ${selectedPackage === 'welcome_event' ? 'text-rose-600' : 'text-primary-600'}`}>
                      {Number(selectedPackageInfo.price || 0).toLocaleString()}원
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
                      <li>한번 본 업체는 다시 봐도 열람권이 소진되지 않습니다.</li>
                      <li>유효기간({selectedPackageInfo.validityMonths}개월)이 지나면 열람권이 만료됩니다.</li>
                      <li>만료된 열람권은 사용할 수 없습니다.</li>
                      <li className="text-red-600 font-bold">※ 본 이벤트는 사정에 의해 조기 종료될 수 있습니다.</li>
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
                      <p>결제를 진행하려면 먼저 관리자의 승인이 필요합니다.</p>
                      <p className="mt-1">관리자 승인 후 다시 시도해주세요.</p>
                    </div>
                  </div>
                </div>
              )}
              */}



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
                      {`${Number(selectedPackageInfo.price || 0).toLocaleString()}원 결제하기`}
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
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
