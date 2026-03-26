import React from 'react';
import { X, Building2, Users, MapPin, Phone, Mail, Square, Package, Calendar } from 'lucide-react';

// Reusable Info Card Component
const InfoCard = ({ icon: Icon, label, value, colorClass = "bg-blue-50 text-blue-600", fullWidth = false, isHighlight = false }) => (
  <div className={`bg-white border ${isHighlight ? 'border-primary-200 bg-primary-50/30' : 'border-gray-200'} rounded-2xl p-4 flex items-center shadow-sm hover:shadow-md transition-shadow ${fullWidth ? 'col-span-1 lg:col-span-2' : ''}`}>
    <div className={`p-3 rounded-xl mr-4 flex-shrink-0 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-xs font-medium mb-1 ${isHighlight ? 'text-primary-800' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-base truncate ${isHighlight ? 'font-black text-gray-900' : 'font-bold text-gray-900'}`}>{value || '-'}</p>
    </div>
  </div>
);

const DetailModal = ({ isOpen, onClose, data, type }) => {
  if (!isOpen || !data) return null;

  const formatArea = (squareMeters) => {
    if (!squareMeters && squareMeters !== 0) return '-';
    const num = Number(squareMeters);
    if (isNaN(num)) return squareMeters;
    const pyeong = Math.round(num * 0.3025);
    return `${num.toLocaleString()}㎡ (${pyeong}평)`;
  };

  // 기타 항목 처리 헬퍼
  const formatListWithOther = (list, otherValue) => {
    if (!Array.isArray(list)) return list || '-';
    const formatted = list.map(item =>
      item === '기타' && otherValue ? `기타(${otherValue})` : item
    );
    return formatted.join(', ');
  };

  const contactPerson = data.contactPerson || data.contact_person;
  const contactPhone = data.contactPhone || data.contact_phone;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${type === 'warehouse' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {type === 'warehouse' ? <Building2 className="w-7 h-7" /> : <Users className="w-7 h-7" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{type === 'warehouse' ? 'Warehouse Profile' : 'Customer Profile'}</p>
              <h2 className="text-2xl font-extrabold text-gray-900">
                {type === 'warehouse' ? '창고 상세 정보' : '고객사 상세 정보'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* 콘텐츠 (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 왼쪽 컬럼: 기본 정보 */}
            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <span className="w-1 h-6 bg-blue-500 rounded-r-md mr-3"></span>
                  기본 정보
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoCard
                    icon={Building2}
                    label="회사명"
                    value={data.companyName || data.company_name}
                    colorClass="bg-indigo-50 text-indigo-600"
                  />

                  <InfoCard
                    icon={Mail}
                    label="이메일"
                    value={data.email}
                    colorClass="bg-purple-50 text-purple-600"
                  />

                  {/* 담당자 정보 강조 표시 (고객사도 여기서 표시됨) */}
                  {contactPerson && (
                    <InfoCard
                      icon={Users}
                      label="담당자명"
                      value={contactPerson}
                      colorClass="bg-rose-100 text-rose-700"
                      isHighlight={true}
                    />
                  )}
                  {contactPhone && (
                    <InfoCard
                      icon={Phone}
                      label="담당자 연락처"
                      value={contactPhone}
                      colorClass="bg-rose-100 text-rose-700"
                      isHighlight={true}
                    />
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <span className="w-1 h-6 bg-blue-500 rounded-r-md mr-3"></span>
                  사업장 주소
                </h3>
                <div className="grid grid-cols-1">
                  <InfoCard
                    icon={MapPin}
                    label="상세 주소"
                    value={data.detail_address || data.detailAddress || `${data.location || ''} ${data.city || ''} ${data.dong || ''}`.trim()}
                    colorClass="bg-gray-100 text-gray-600"
                    fullWidth={true}
                  />
                </div>
              </section>
            </div>

            {/* 오른쪽 컬럼: 업무/요구 정보 */}
            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <span className="w-1 h-6 bg-emerald-500 rounded-r-md mr-3"></span>
                  {type === 'warehouse' ? '창고 스펙' : '물류 요구사항'}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {type === 'warehouse' ? (
                    <>
                      <InfoCard icon={Square} label="총 면적" value={formatArea(data.totalArea || data.total_area)} colorClass="bg-blue-50 text-blue-600" />
                      <InfoCard icon={Square} label="이용가능 면적" value={formatArea(data.availableArea || data.available_area)} colorClass="bg-cyan-50 text-cyan-600" />
                      <InfoCard icon={Building2} label="창고 개수" value={data.warehouseCount ? `${data.warehouseCount}개` : '-'} colorClass="bg-indigo-50 text-indigo-600" />
                      <InfoCard icon={Package} label="보유 파렛트" value={data.palletCount ? `${data.palletCount} PLT` : '-'} colorClass="bg-violet-50 text-violet-600" />

                      <InfoCard icon={Calendar} label="업력" value={data.experience ? `${data.experience}년` : '-'} colorClass="bg-amber-50 text-amber-600" />
                      <InfoCard icon={Package} label="보관 방식" value={Array.isArray(data.storageTypes) ? data.storageTypes.join(', ') : data.temperature} colorClass="bg-rose-50 text-rose-600" fullWidth={true} />

                      <InfoCard icon={Package} label="취급 물품" value={Array.isArray(data.products) ? data.products.join(', ') : data.products} colorClass="bg-lime-50 text-lime-600" fullWidth={true} />

                      <InfoCard icon={Building2} label="사용 솔루션" value={formatListWithOther(data.solutions || data.solution, data.other_solution)} colorClass="bg-sky-50 text-sky-600" fullWidth={true} />
                      <InfoCard icon={Package} label="사용 배송사" value={formatListWithOther(data.deliveryCompanies || data.delivery, data.other_delivery_company)} colorClass="bg-fuchsia-50 text-fuchsia-600" fullWidth={true} />
                    </>
                  ) : (
                    <>
                      <InfoCard icon={Square} label="필요 면적" value={formatArea(data.requiredArea || data.required_area)} colorClass="bg-blue-50 text-blue-600" />
                      <InfoCard icon={Package} label="보관 파렛트" value={data.palletCount ? `${data.palletCount} PLT` : '-'} colorClass="bg-cyan-50 text-cyan-600" />
                      <InfoCard icon={Package} label="월 평균 출고량" value={data.monthlyVolume ? `${Number(data.monthlyVolume).toLocaleString()}건/월` : '-'} colorClass="bg-violet-50 text-violet-600" fullWidth={true} />
                      <InfoCard icon={Package} label="취급 물품" value={Array.isArray(data.products) ? data.products.join(', ') : data.products} colorClass="bg-rose-50 text-rose-600" fullWidth={true} />
                      <InfoCard icon={Package} label="희망 배송사" value={formatListWithOther(data.desiredDelivery, data.other_desired_delivery)} colorClass="bg-emerald-50 text-emerald-600" fullWidth={true} />
                    </>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-95"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
