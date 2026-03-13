/**
 * 결제 설정 파일
 * PG사 정보는 나중에 .env 파일에서 입력
 */

export const paymentConfig = {
  // PG사 정보 (환경 변수로 관리)
  // .env 파일에 다음 형식으로 추가:
  // VITE_TOSS_MID=33ply4afmm
  // VITE_TOSS_CLIENT_KEY=test_ck_ZLKGPx4M3MGk5NPWgyaRrBaWypv1
  // VITE_TEST_MODE=true
  // VITE_PAYMENT_AMOUNT=50000
  merchantId: import.meta.env.VITE_TOSS_MID || '33ply4afmm',
  clientKey: import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_ZLKGPx4M3MGk5NPWgyaRrBaWypv1',
  pgProvider: 'tosspayments',
  
  // 테스트 모드 (기본값: true)
  isTestMode: import.meta.env.VITE_TEST_MODE !== 'false',
  
  // 결제 정보
  amount: parseInt(import.meta.env.VITE_PAYMENT_AMOUNT) || 50000,
  productName: '열람권',
  productDescription: '10회 사용 가능, 유효기간 3개월',
  
  // 열람권 정보
  viewingPassCount: 10,
  viewingPassValidityMonths: 3,
};

