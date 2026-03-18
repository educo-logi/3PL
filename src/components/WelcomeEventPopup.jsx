import React from 'react';
import { X, Gift, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WelcomeEventPopup = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300 relative">
        {/* 장식용 배경 요소 (골드 테마) */}
        <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-amber-100/80 via-amber-50/40 to-transparent opacity-100"></div>
        
        {/* 블러 장식 오브젝트 */}
        <div className="absolute -left-12 top-10 w-32 h-32 bg-amber-200 rounded-full opacity-40 blur-2xl"></div>
        <div className="absolute -right-8 -top-8 w-28 h-28 bg-yellow-200 rounded-full opacity-30 blur-xl"></div>
        <div className="absolute left-1/4 bottom-12 w-36 h-36 bg-amber-100 rounded-full opacity-40 blur-2xl"></div>


        <div className="p-8 pb-6 text-center relative z-10">
          <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-white shadow-md">
             <img 
               src="/images/welcome-event.png" 
               alt="처음 봄 이벤트" 
               className="w-full h-full object-cover" 
             />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">처음 봄 이벤트</h2>
          <p className="text-lg text-gray-800 mb-6 font-semibold leading-snug">
            런칭 기념 <span className="text-gray-900 font-bold">업체 열람권</span> <span className="text-primary-600 font-black text-2xl border-b-2 border-primary-200 px-0.5">3장</span>이<br />
            방금 무료로 지급되었습니다! <span className="text-xs text-gray-400 font-normal block mt-1">(발급 후 30일 동안 유효)</span>
          </p>
          


          {/* 하단 유도 문구 추가 */}
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            남은 열람권과 열람 이력은<br /> 
            <span className="font-semibold text-gray-700">마이페이지</span>에서 확인 가능합니다.
          </p>

          <button
            onClick={onClose}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm flex items-center justify-center transition-all"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeEventPopup;
