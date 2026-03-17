import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X, Sparkles, ArrowRight } from 'lucide-react';

const NudgePopup = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-rose-100">
        {/* Header with Background */}
        <div 
          className="relative h-32 flex items-center justify-center"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 240, 245, 0.8), rgba(255, 240, 245, 0.8)), url('https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=600')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/50 hover:bg-white text-rose-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="bg-white p-4 rounded-2xl shadow-lg ring-4 ring-rose-50 animate-bounce">
            <ShoppingBag className="w-8 h-8 text-rose-500" />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold mb-4">
            <Sparkles className="w-3 h-3" /> 마지막 혜택 기회
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 mb-3 leading-tight">
            남은 열람권 <span className="text-rose-600">1장!</span>
          </h2>
          
          <p className="text-gray-600 mb-8 leading-relaxed font-medium">
            벌써 두 장을 다 쓰셨네요!<br />
            <span className="text-gray-900 font-bold">1년 동안 넉넉하게</span> 쓰는 9,900원<br />
            패키지로 미리 준비해두시는 건 어떨까요?
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                onClose();
                navigate('/payment');
              }}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2 group"
            >
              지금 특가로 구매하기
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-400 font-semibold hover:text-gray-600 transition-colors text-sm"
            >
              다음에 할게요
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NudgePopup;
