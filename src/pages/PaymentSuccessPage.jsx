import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { purchaseViewingPass, extendViewingPass } from '../utils/viewingPassUtils';
import { createNotification } from '../utils/notificationUtils';
import { createPremiumApplication, premiumPackages } from '../utils/premiumUtils';
import { confirmTossPayment } from '../api/tossApi';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const isConfirming = useRef(false);

  // 토스페이먼츠에서 반환되는 파라미터 및 커스텀 파라미터
  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');
  
  const packageType = searchParams.get('packageType') || 'basic';
  const isEvent = searchParams.get('isEvent') === 'true';
  const isExtending = searchParams.get('isExtending') === 'true';
  const freePass = searchParams.get('freePass') === 'true'; // 금액이 0원이라 PG를 안 탄 경우
  const isPremium = searchParams.get('isPremium') === 'true'; // 프리미엄 결제 구분
  const itemId = searchParams.get('itemId'); // 프리미엄: 대상 업체 ID
  const itemType = searchParams.get('itemType'); // 프리미엄: 대상 타입 (warehouse / customer)

  useEffect(() => {
    const processPayment = async () => {
      if (isConfirming.current) return;
      isConfirming.current = true;

      try {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
          throw new Error('로그인이 필요합니다.');
        }
        const currentUser = JSON.parse(userStr);

        let receiptUrl = null;

        // 토스 결제 승인 통신 로직 추가
        if (!freePass && paymentKey && orderId && amount) {
          const confirmResult = await confirmTossPayment(paymentKey, orderId, amount);
          if (!confirmResult.success) {
            throw new Error(confirmResult.message);
          }
          receiptUrl = confirmResult.data.receipt?.url;
        }

        // 프리미엄 신청 처리
        if (isPremium) {
          const result = await createPremiumApplication(
            currentUser.id,
            currentUser.userType,
            itemId,
            itemType,
            packageType,
            orderId,
            receiptUrl
          );

          if (result.success) {
            const pkgInfo = premiumPackages[packageType];
            createNotification(
              currentUser.id,
              'premium',
              '프리미엄 신청 완료',
              `${pkgInfo?.name || '프리미엄'} 신청이 완료되었습니다.`
            );
          } else {
            throw new Error(result.message || '프리미엄 신청 처리에 실패했습니다.');
          }
        } 
        // 열람권 연장 처리
        else if (isExtending) {
          const passInfoStr = localStorage.getItem(`viewingPass_${currentUser.id}`);
          const passInfo = passInfoStr ? JSON.parse(passInfoStr) : null;
          
          const extended = await extendViewingPass(passInfo?.id, 3, amount, orderId, receiptUrl);
          if (extended) {
            createNotification(
              currentUser.id,
              'purchase',
              '열람권 연장 완료',
              `열람권이 ${extended.expiryDate ? new Date(extended.expiryDate).toLocaleDateString('ko-KR') : '3개월'}까지 연장되었습니다.`
            );
          } else {
            throw new Error('연장 처리에 실패했습니다.');
          }
        } 
        // 일반 열람권 구매 직전
        else {
          // 구매 처리
          const type = (isEvent && packageType === 'basic') ? 'basic_event' : packageType;
          const result = await purchaseViewingPass(type, orderId, receiptUrl);
          
          if (result.success) {
            createNotification(
              currentUser.id,
              'purchase',
              (isEvent && packageType === 'basic') ? '이벤트 열람권 지급 완료' : '열람권 구매 완료',
              `패키지 구매가 완료되었습니다.`
            );
          } else {
            throw new Error(result.message || '구매 처리에 실패했습니다.');
          }
        }
        
        setIsProcessing(false);
        setIsProcessing(false);
      } catch (err) {
        console.error('Payment Processing Error:', err);
        setError(err.message || '결제 처리 중 오류가 발생했습니다.');
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [isEvent, isExtending, packageType, freePass]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">결제 내역을 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center border-t-4 border-red-500">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">결제 처리 오류</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/payment')}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            결제 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {isExtending ? '연장 완료!' : '결제 완료!'}
        </h2>
        
        {isPremium ? (
          <p className="text-gray-600 mb-6">
            프리미엄 신청이 완료되었습니다.<br />
            지금부터 상단 프리미엄 영역에 노출됩니다.
          </p>
        ) : (
          <p className="text-gray-600 mb-6">
            {isExtending
              ? '열람권 연장이 완료되었습니다.'
              : '열람권 구매가 완료되었습니다.'}
            <br />
            이제 상세 정보를 열람하실 수 있습니다.
          </p>
        )}
        
        {amount && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <p className="text-sm text-gray-700 mb-2">
              <strong>결제 금액:</strong> {Number(amount).toLocaleString()}원
            </p>
            {orderId && (
              <p className="text-xs text-gray-500">
                주문번호: {orderId}
              </p>
            )}
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
};

export default PaymentSuccessPage;
