import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { paymentConfig } from '../config/paymentConfig';
import { purchaseViewingPass, getViewingPassInfo, extendViewingPass } from '../utils/viewingPassUtils';
import { createNotification } from '../utils/notificationUtils';

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action'); // 'extend' 또는 null
  const [currentUser, setCurrentUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('basic');
  const [isExtending, setIsExtending] = useState(action === 'extend');
  const [currentPass, setCurrentPass] = useState(null);

  const packages = {
    basic: { count: 10, price: 50000, validityMonths: 3, name: '기본 패키지' },
    premium: { count: 20, price: 90000, validityMonths: 3, name: '프리미엄 패키지', discount: '10% 할인' },
    deluxe: { count: 30, price: 130000, validityMonths: 3, name: '디럭스 패키지', discount: '13% 할인' }
  };

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

    if (isExtending) {
      const passInfo = getViewingPassInfo();
      setCurrentPass(passInfo);
    }
  }, [navigate, isExtending]);

  const handlePayment = async () => {
    if (!currentUser) return;

    // 승인 상태 확인
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const latestUser = allUsers.find(u => u.id === currentUser.id) || currentUser;

    if (latestUser.status === 'pending' || !latestUser.status) {
      alert('결제를 진행하려면 먼저 관리자의 승인이 필요합니다.\n관리자 승인 후 다시 시도해주세요.');
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

    // 테스트 모드: 실제 결제 없이 시뮬레이션
    if (paymentConfig.isTestMode) {
      setTimeout(() => {
        if (isExtending) {
          // 연장 처리
          const extended = extendViewingPass(currentPass?.id, 3);
          if (extended) {
            createNotification(
              currentUser.id,
              'purchase',
              '열람권 연장 완료',
              `열람권이 ${extended.expiryDate ? new Date(extended.expiryDate).toLocaleDateString('ko-KR') : '3개월'}까지 연장되었습니다.`
            );
          }
        } else {
          // 구매 처리
          const newPass = purchaseViewingPass(currentUser.id, selectedPackage);
          createNotification(
            currentUser.id,
            'purchase',
            '열람권 구매 완료',
            `${packages[selectedPackage].name} 구매가 완료되었습니다. (${packages[selectedPackage].count}회)`
          );
        }
        setIsProcessing(false);
        setIsSuccess(true);
      }, 1000);
    } else {
      // 실제 PG사 연동 (나중에 구현)
      alert('실제 결제는 추후 PG사 연동을 통해 제공될 예정입니다.');
    }
  };

  if (isSuccess) {
    const purchasedPackage = isExtending ? null : packages[selectedPackage];
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isExtending ? '연장 완료!' : '결제 완료!'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isExtending
              ? '열람권 연장이 완료되었습니다.'
              : '열람권 구매가 완료되었습니다.'}
            <br />
            이제 상세 정보를 열람하실 수 있습니다.
          </p>
          {purchasedPackage && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <p className="text-sm text-gray-700 mb-2">
                <strong>구매 내용:</strong>
              </p>
              <p className="text-sm text-gray-600">
                • 사용 횟수: {purchasedPackage.count}회<br />
                • 유효기간: {purchasedPackage.validityMonths}개월
              </p>
            </div>
          )}
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

  if (!currentUser) {
    return null;
  }

  // 승인 상태 확인
  const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
  const latestUser = allUsers.find(u => u.id === currentUser.id) || currentUser;
  const isApproved = latestUser.status === 'approved';
  const isPending = latestUser.status === 'pending' || !latestUser.status;

  const selectedPackageInfo = packages[selectedPackage];

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(packages).map(([key, pkg]) => (
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
                          {pkg.count}회
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          유효기간: {pkg.validityMonths}개월
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
                    <span className="text-gray-600">사용 횟수</span>
                    <span className="font-semibold text-gray-900">{selectedPackageInfo.count}회</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">유효기간</span>
                    <span className="font-semibold text-gray-900">{selectedPackageInfo.validityMonths}개월</span>
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
                      <li>한번 본 업체는 다시 봐도 열람권이 소진되지 않습니다.</li>
                      <li>유효기간({selectedPackageInfo.validityMonths}개월)이 지나면 열람권이 만료됩니다.</li>
                      <li>만료된 열람권은 사용할 수 없습니다.</li>
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
                      <p>결제를 진행하려면 먼저 관리자의 승인이 필요합니다.</p>
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
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
