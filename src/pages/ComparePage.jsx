import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users } from 'lucide-react';
import { formatArea } from '../utils/areaConverter';
import { getDisplayName } from '../utils/viewingPassUtils';

const ComparePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (location.state && location.state.items) {
      setItems(location.state.items);
    } else {
      // URL 파라미터로 전달된 경우 처리
      navigate('/');
    }
  }, [location, navigate]);

  if (items.length !== 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">비교할 업체 정보가 없습니다.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  const [item1, item2] = items;
  const type = item1.userType || item1.type || 'warehouse';
  const isWarehouse = type === 'warehouse';

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            뒤로가기
          </button>
          <div className="flex items-center">
            {isWarehouse ? (
              <Building2 className="w-8 h-8 text-primary-600 mr-3" />
            ) : (
              <Users className="w-8 h-8 text-primary-600 mr-3" />
            )}
            <h1 className="text-3xl font-bold text-gray-900">업체 비교</h1>
          </div>
        </div>

        {/* 비교 테이블 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    항목
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/8">
                    {getDisplayName(item1, type)}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/8">
                    {getDisplayName(item2, type)}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* 기본 정보 */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    회사명
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {getDisplayName(item1, type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {getDisplayName(item2, type)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    지역
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item1.location} {item1.city} {item1.dong}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item2.location} {item2.city} {item2.dong}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    대표자명
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item1.representative || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item2.representative || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    전화번호
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item1.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item2.phone || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    이메일
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item1.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item2.email || '-'}
                  </td>
                </tr>

                {/* 창고 정보 또는 고객사 정보 */}
                {isWarehouse ? (
                  <>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        총 면적
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatArea(item1.totalArea || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatArea(item2.totalArea || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        이용가능 면적
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatArea(item1.availableArea || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatArea(item2.availableArea || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        보관방식
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item1.temperature || item1.storageTypes?.join(', ') || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item2.temperature || item2.storageTypes?.join(', ') || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        배송사
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {Array.isArray(item1.delivery) 
                          ? item1.delivery.join(', ') 
                          : item1.deliveryCompanies?.join(', ') || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {Array.isArray(item2.delivery) 
                          ? item2.delivery.join(', ') 
                          : item2.deliveryCompanies?.join(', ') || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        취급 물품
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {Array.isArray(item1.products) 
                          ? item1.products.join(', ') 
                          : item1.products || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {Array.isArray(item2.products) 
                          ? item2.products.join(', ') 
                          : item2.products || '-'}
                      </td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        필요 면적
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatArea(item1.requiredArea || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatArea(item2.requiredArea || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        월 평균 출고량
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item1.monthlyVolume?.toLocaleString() || '-'}개
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item2.monthlyVolume?.toLocaleString() || '-'}개
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        취급 물품
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {Array.isArray(item1.products) 
                          ? item1.products.join(', ') 
                          : item1.products || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {Array.isArray(item2.products) 
                          ? item2.products.join(', ') 
                          : item2.products || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        원하는 배송사
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {Array.isArray(item1.desiredDelivery) 
                          ? item1.desiredDelivery.join(', ') 
                          : item1.desiredDelivery || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {Array.isArray(item2.desiredDelivery) 
                          ? item2.desiredDelivery.join(', ') 
                          : item2.desiredDelivery || '-'}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;

