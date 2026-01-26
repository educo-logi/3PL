import React from 'react';
import { X, Building2, Users, MapPin, Phone, Mail, Square, Package, Calendar } from 'lucide-react';

const DetailModal = ({ isOpen, onClose, data, type }) => {
  if (!isOpen || !data) return null;

  const formatArea = (squareMeters) => {
    const pyeong = Math.round(squareMeters * 0.3025);
    return `${squareMeters.toLocaleString()}㎡(${pyeong}p)`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            {type === 'warehouse' ? (
              <Building2 className="w-6 h-6 text-blue-600 mr-3" />
            ) : (
              <Users className="w-6 h-6 text-green-600 mr-3" />
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {type === 'warehouse' ? '창고 상세 정보' : '고객사 상세 정보'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 기본 정보 */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Building2 className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">회사명</p>
                      <p className="font-medium text-gray-900">{data.companyName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">지역</p>
                      <p className="font-medium text-gray-900">{data.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">대표자명</p>
                      <p className="font-medium text-gray-900">{data.representative}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">전화번호</p>
                      <p className="font-medium text-gray-900">{data.phone}</p>
                    </div>
                  </div>

                  {data.contactPerson && (
                    <div className="flex items-start">
                      <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">담당자명</p>
                        <p className="font-medium text-gray-900">{data.contactPerson}</p>
                      </div>
                    </div>
                  )}

                  {data.contactPhone && (
                    <div className="flex items-start">
                      <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">담당자 연락처</p>
                        <p className="font-medium text-gray-900">{data.contactPhone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">이메일</p>
                      <p className="font-medium text-gray-900">{data.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 업무 정보 */}
            <div className="space-y-6">
              {type === 'warehouse' ? (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">창고 정보</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <Square className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">총 면적</p>
                          <p className="font-medium text-gray-900">{formatArea(data.totalArea)}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Square className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">이용가능 면적</p>
                          <p className="font-medium text-gray-900">{formatArea(data.availableArea)}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Building2 className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">창고 개수</p>
                          <p className="font-medium text-gray-900">{data.warehouseCount}개</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Package className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">보관 방식</p>
                          <p className="font-medium text-gray-900">
                            {Array.isArray(data.storageTypes) ? data.storageTypes.join(', ') : data.temperature}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Package className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">배송사</p>
                          <p className="font-medium text-gray-900">
                            {Array.isArray(data.deliveryCompanies) ? data.deliveryCompanies.join(', ') : data.delivery?.join(', ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">경력</p>
                          <p className="font-medium text-gray-900">{data.experience}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Package className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">취급 물품</p>
                          <p className="font-medium text-gray-900">
                            {Array.isArray(data.products) ? data.products.join(', ') : data.products}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Building2 className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">솔루션</p>
                          <p className="font-medium text-gray-900">
                            {Array.isArray(data.solutions) ? data.solutions.join(', ') : data.solution}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">물류 요구사항</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <Square className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">필요 면적</p>
                          <p className="font-medium text-gray-900">{formatArea(data.requiredArea)}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Package className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">월 평균 출고량</p>
                          <p className="font-medium text-gray-900">{data.monthlyVolume?.toLocaleString()}개</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Package className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">취급 물품</p>
                          <p className="font-medium text-gray-900">
                            {Array.isArray(data.products) ? data.products.join(', ') : data.products}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Package className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">원하는 배송사</p>
                          <p className="font-medium text-gray-900">
                            {Array.isArray(data.desiredDelivery) ? data.desiredDelivery.join(', ') : data.desiredDelivery}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;




