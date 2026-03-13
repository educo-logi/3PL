import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const PaymentFailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const message = searchParams.get('message') || '결제가 취소되었거나 오류가 발생했습니다.';
  const code = searchParams.get('code');
  const failRedirect = searchParams.get('failRedirect') || '/payment';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center border-t-4 border-red-500">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">결제 실패</h2>
        
        <div className="bg-red-50 p-4 rounded-lg mb-6 text-left">
          <p className="text-sm text-red-700">
            {message}
          </p>
          {code && (
            <p className="text-xs text-red-500 mt-2">
              에러 코드: {code}
            </p>
          )}
        </div>

        <button
          onClick={() => navigate(failRedirect)}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
        >
          결제 다시 시도하기
        </button>
      </div>
    </div>
  );
};

export default PaymentFailPage;
