import React from 'react';
import { X, Gift, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WelcomeEventPopup = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300 relative">
        {/* 장식용 배경 요소 */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary-500 to-primary-700 opacity-10"></div>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors z-10 bg-white/50 rounded-full p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pb-6 text-center relative z-10">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-white shadow-sm">
             <Gift className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">처음 봄 이벤트 🌸</h2>
          <p className="text-lg text-gray-800 mb-6 font-semibold leading-snug">
            런칭 기념 <span className="text-gray-900 font-bold">업체 열람권</span> <span className="text-primary-600 font-black text-2xl border-b-2 border-primary-200 px-0.5">3장</span>이<br />
            방금 무료로 지급되었습니다! <span className="text-xs text-gray-400 font-normal block mt-1">(발급 후 30일 동안 유효)</span>
          </p>
          
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 mb-6 text-left relative overflow-hidden">
             {/* 배경 하이라이트 */}
             <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-200 rounded-full opacity-50 blur-xl"></div>
             
             <div className="flex items-center gap-2 mb-2 relative z-10">
                <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">첫 구매 특가</span>
                <span className="text-sm font-semibold text-rose-800">지금 결제하면 1년 내내 든든하게!</span>
             </div>
             
             <div className="relative z-10 flex items-end gap-2 mt-1">
                <span className="text-gray-400 line-through text-sm">정상가 50,000원</span>
                <div className="flex items-baseline text-rose-600">
                   <span className="text-2xl font-black">9,900</span>
                   <span className="font-bold ml-1 text-sm">원</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                onClose();
                navigate('/payment');
              }}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-6 border border-transparent rounded-xl shadow-sm flex items-center justify-center transition-all group"
            >
              특가 혜택 보러 가기
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onClose}
              className="w-full bg-white text-gray-500 hover:text-gray-900 font-medium py-2 px-4 rounded-xl transition-colors hover:bg-gray-50"
            >
              다음에 할게요
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeEventPopup;
