import React from 'react';
import { X, Building2, Users, MapPin, Phone, Mail, Square, Package, Calendar } from 'lucide-react';

// Reusable Info Item Component
const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="bg-white p-2 rounded-full border border-gray-100 shadow-sm mr-4">
      <Icon className="w-5 h-5 text-primary-600" />
    </div>
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-all leading-relaxed">
        {value || '-'}
      </p>
    </div>
  </div>
);

const DetailModal = ({ isOpen, onClose, data, type }) => {
  if (!isOpen || !data) return null;

  const formatArea = (squareMeters, unit = 'sqm') => {
    if (!squareMeters && squareMeters !== 0) return '-';
    const num = Number(squareMeters);
    if (isNaN(num)) return squareMeters;

    const pyeong = Math.round(num * 0.3025);
    return `${num.toLocaleString()}㎡ (${pyeong}평)`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${type === 'warehouse' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
              {type === 'warehouse' ? <Building2 className="w-6 h-6" /> : <Users className="w-6 h-6" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {type === 'warehouse' ? '창고 상세 정보' : '고객사 상세 정보'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 콘텐츠 (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 왼쪽 컬럼: 기본 정보 */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center border-b pb-3 border-gray-50">
                <Building2 className="w-5 h-5 mr-2 text-gray-400" />
                기본 정보
              </h3>
              <div className="grid gap-4">
                <InfoItem icon={Building2} label="회사명" value={data.companyName || data.company_name} />
                <InfoItem icon={MapPin} label="주소" value={`${data.location || ''} ${data.city || ''} ${data.dong || ''} ${data.detail_address || data.detailAddress || ''}`} />
                <InfoItem icon={Users} label="대표자명" value={data.representative} />
                <InfoItem icon={Phone} label="전화번호" value={data.phone} />
                {data.contactPerson && <InfoItem icon={Users} label="담당자명" value={data.contactPerson || data.contact_person} />}
                {data.contactPhone && <InfoItem icon={Phone} label="담당자 연락처" value={data.contactPhone || data.contact_phone} />}
                <InfoItem icon={Mail} label="이메일" value={data.email} />
              </div>
            </div>

            {/* 오른쪽 컬럼: 업무/요구 정보 */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center border-b pb-3 border-gray-50">
                {type === 'warehouse' ? (
                  <><Square className="w-5 h-5 mr-2 text-gray-400" /> 창고 정보</>
                ) : (
                  <><Package className="w-5 h-5 mr-2 text-gray-400" /> 물류 요구사항</>
                )}
              </h3>

              <div className="grid gap-4">
                {type === 'warehouse' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem icon={Square} label="총 면적" value={formatArea(data.totalArea || data.total_area)} />
                      <InfoItem icon={Square} label="이용가능 면적" value={formatArea(data.availableArea || data.available_area)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem icon={Building2} label="창고 개수" value={data.warehouseCount ? `${data.warehouseCount}개` : '-'} />
                      <InfoItem icon={Package} label="보유 파렛트" value={data.palletCount ? `${data.palletCount} PLT` : '-'} />
                    </div>
                    <InfoItem icon={Package} label="보관 방식" value={Array.isArray(data.storageTypes) ? data.storageTypes.join(', ') : data.temperature} />
                    <InfoItem icon={Package} label="배송사" value={Array.isArray(data.deliveryCompanies) ? data.deliveryCompanies.join(', ') : data.delivery?.join(', ')} />
                    <InfoItem icon={Calendar} label="경력" value={data.experience ? `${data.experience}년` : '-'} />
                    <InfoItem icon={Package} label="취급 물품" value={Array.isArray(data.products) ? data.products.join(', ') : data.products} />
                    <InfoItem icon={Building2} label="솔루션" value={Array.isArray(data.solutions) ? data.solutions.join(', ') : data.solution} />
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem icon={Square} label="필요 면적" value={formatArea(data.requiredArea || data.required_area)} />
                      <InfoItem icon={Package} label="보관 파렛트" value={data.palletCount ? `${data.palletCount} PLT` : '-'} />
                    </div>
                    <InfoItem icon={Package} label="월 평균 출고량" value={data.monthlyVolume ? `${Number(data.monthlyVolume).toLocaleString()}건/월` : '-'} />
                    <InfoItem icon={Package} label="취급 물품" value={Array.isArray(data.products) ? data.products.join(', ') : data.products} />
                    <InfoItem icon={Package} label="원하는 배송사" value={Array.isArray(data.desiredDelivery) ? data.desiredDelivery.join(', ') : data.desiredDelivery} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
