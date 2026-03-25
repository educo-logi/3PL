import React, { useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';

const AddressSearchModal = ({ isOpen, onClose, onComplete }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      // Daum Postcode API를 로드하고 컨테이너에 임베드
      if (window.daum && window.daum.Postcode) {
        new window.daum.Postcode({
          oncomplete: (data) => {
            // 주소 선택 시 부모 컴포넌트의 onComplete 콜백 호출
            onComplete(data);
            onClose();
          },
          width: '100%',
          height: '100%',
          maxSuggestItems: 5,
        }).embed(containerRef.current);
      } else {
        console.error('Daum Postcode script not loaded');
        alert('주소 검색 서비스를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
        onClose();
      }
    }
  }, [isOpen, onComplete, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[500px] h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <div className="bg-primary-100 p-2 rounded-lg">
              <Search className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">주소 검색</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Daum Postcode 컨테이너 */}
        <div 
          ref={containerRef} 
          className="flex-1 w-full bg-white"
          style={{ minHeight: '400px' }}
        />
        
        {/* 푸터 (가이드 문구) */}
        <div className="bg-gray-50 p-4 border-t text-center">
          <p className="text-xs text-gray-500">
            정확한 주소 검색을 위해 지번보다는 도로명 주소 사용을 권장합니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddressSearchModal;
