import React from 'react';
import { X, AlertCircle } from 'lucide-react';

const ViewingPassConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentCount,
  itemName,
  itemType 
}) => {
  if (!isOpen) return null;

  const itemTypeName = itemType === 'warehouse' ? '창고' : '고객사';
  const afterCount = currentCount - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">열람권 사용 안내</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              <strong className="text-gray-900">해당 {itemTypeName}</strong>의 상세 정보를 보시려면
            </p>
            <p className="text-lg font-semibold text-primary-600">
              열람권 1회가 소진됩니다.
            </p>
          </div>

          {/* 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                💡 한번 본 업체는 다시 봐도 열람권이 소진되지 않습니다.
              </p>
            </div>
          </div>

          {/* 현재 보유 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">현재 보유</span>
              <span className="text-xl font-bold text-gray-900">{currentCount}회</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">사용 후</span>
              <span className="text-xl font-bold text-primary-600">{afterCount}회 남음</span>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewingPassConfirmModal;

