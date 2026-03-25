import React, { useState } from 'react';
import { Users, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { regions, productTypes, deliveryCompanies } from '../data/sampleData';
import { hashPassword } from '../utils/passwordHash';
import { supabase } from '../utils/supabaseClient';
import { trackEvent, GA_EVENTS } from '../utils/gtm';
import { checkEmailDuplicate } from '../utils/authUtils';
import AddressSearchModal from '../components/AddressSearchModal';

const CustomerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    businessNumber: '',
    location: '',
    city: '',
    dong: '',
    roadAddress: '',
    detailAddress: '',
    representative: '',
    phone: '',
    contactPerson: '',
    contactPhone: '',
    email: '',
    password: '',
    requiredArea: '',
    requiredAreaUnit: 'sqm',
    palletCount: '',
    monthlyVolume: '',
    desiredDelivery: [],
    products: []
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [privacyError, setPrivacyError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const mapSidoName = (sido) => {
    const mapping = {
      '서울특별시': '서울', '인천광역시': '인천', '경기도': '경기', '강원특별자치도': '강원', '강원도': '강원',
      '세종특별자치시': '세종', '대전광역시': '대전', '충청남도': '충남', '충청북도': '충북', '광주광역시': '광주',
      '전라남도': '전남', '전라북도': '전북', '전북특별자치도': '전북', '대구광역시': '대구', '경상북도': '경북',
      '부산광역시': '부산', '울산광역시': '울산', '경상남도': '경남', '제주특별자치도': '제주'
    };
    return mapping[sido] || sido;
  };

  const handleAddressComplete = (data) => {
    setFormData(prev => ({
      ...prev,
      location: mapSidoName(data.sido),
      city: data.sigungu || data.sido,
      dong: data.bname || '',
      roadAddress: data.buildingName ? `${data.roadAddress} (${data.buildingName})` : data.roadAddress,
      detailAddress: ''
    }));
  };

  const convertArea = (value, fromUnit, toUnit) => {
    if (!value || isNaN(value)) return '';
    const numValue = parseFloat(value);
    if (fromUnit === 'sqm' && toUnit === 'pyeong') return Math.round(numValue * 0.3025);
    if (fromUnit === 'pyeong' && toUnit === 'sqm') return Math.round(numValue * 3.3058);
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'password') setPasswordError('');
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAreaUnitChange = (fieldName, unit) => {
    setFormData(prev => ({ ...prev, [fieldName]: unit }));
  };

  const handleCheckboxChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter(item => item !== value)
        : [...prev[name], value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!privacyAgreed) {
      setPrivacyError('개인정보 처리방침에 동의해주세요.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/;
    if (!passwordRegex.test(formData.password)) {
      setPasswordError('영문, 숫자, 특수문자를 포함하여 8~16자로 입력해주세요.');
      alert('비밀번호는 영문, 숫자, 특수문자를 포함하여 8~16자여야 합니다.');
      return;
    }

    const hashedPassword = hashPassword(formData.password);
    const combinedAddress = `${formData.roadAddress} ${formData.detailAddress}`.trim();

    try {
      const dupCheck = await checkEmailDuplicate(formData.email);
      if (dupCheck.isDuplicate) {
        alert(dupCheck.message + '\n다른 이메일을 사용해주세요.');
        return;
      }

      const { error } = await supabase
        .from('customers')
        .insert([{
          company_name: formData.companyName,
          business_number: formData.businessNumber,
          representative: formData.representative,
          location: formData.location,
          city: formData.city,
          dong: formData.dong,
          detail_address: combinedAddress,
          phone: formData.phone,
          contact_person: formData.contactPerson,
          contact_phone: formData.contactPhone,
          email: formData.email,
          password: hashedPassword,
          required_area: parseFloat(formData.requiredArea),
          required_area_unit: formData.requiredAreaUnit,
          monthly_volume: parseFloat(formData.monthlyVolume),
          pallet_count: parseInt(formData.palletCount),
          desired_delivery: formData.desiredDelivery,
          products: formData.products,
          status: 'pending',
          user_type: 'customer'
        }]);

      if (error) throw error;
      trackEvent(GA_EVENTS.REGISTER_CUSTOMER, { company: formData.companyName });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting customer:', error);
      alert('등록 중 오류가 발생했습니다. 다시 시도해주세요.\n' + error.message);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">등록 완료!</h2>
          <p className="text-gray-600 mb-2">고객사 등록이 성공적으로 완료되었습니다.</p>
          <button onClick={() => navigate('/')} className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors">홈으로</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-8">
            <Users className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">고객사 등록</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 기본 정보 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">회사명/개인명 *</label><input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">사업자 등록번호 *</label><input type="text" name="businessNumber" value={formData.businessNumber} onChange={handleInputChange} placeholder="000-00-00000" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">대표자명 *</label><input type="text" name="representative" value={formData.representative} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">전화번호 *</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">담당자명 *</label><input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">담당자 연락처 *</label><input type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" /></div>
              </div>
            </div>

            {/* 계정 정보 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">계정 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">이메일 *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" /><p className="mt-1 text-xs text-gray-500">로그인 시 사용할 이메일 주소입니다.</p></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 *</label><input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="영문, 숫자, 특수문자 포함 8~16자" required className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 ${passwordError ? 'border-red-500' : 'border-gray-300'}`} />{passwordError && <p className="mt-1 text-sm text-red-500">{passwordError}</p>}</div>
              </div>
            </div>

            {/* 주소 정보 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">주소 정보</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">기본 주소 (도로명/지번)</label>
                  <button type="button" onClick={() => setIsAddressModalOpen(true)} className="text-xs bg-primary-50 text-primary-600 px-3 py-1.5 rounded-md border border-primary-200 hover:bg-primary-100 transition-colors font-semibold">주소 검색</button>
                </div>
                <input type="text" name="roadAddress" value={formData.roadAddress} readOnly placeholder="주소 검색 버튼을 이용하세요" className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">상세 주소 (직접 입력) *</label>
                  <input type="text" name="detailAddress" value={formData.detailAddress} onChange={handleInputChange} placeholder="나머지 상세 주소를 입력하세요 (예: 101동 202호)" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" />
                </div>
                <p className="text-xs text-gray-500 flex items-center"><span className="font-semibold text-primary-600 mr-2">[자동 매핑 정보]</span>현재 지역: {formData.location} {formData.city} {formData.dong}</p>
              </div>
            </div>

            <AddressSearchModal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} onComplete={handleAddressComplete} />

            {/* 물류 요구사항 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">물류 요구사항</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">사용할 총면적 *</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center cursor-pointer"><input type="radio" name="requiredAreaUnit" value="sqm" checked={formData.requiredAreaUnit === 'sqm'} onChange={() => handleAreaUnitChange('requiredAreaUnit', 'sqm')} className="mr-2" /><span className="text-sm">제곱미터(㎡)</span></label>
                      <label className="flex items-center cursor-pointer"><input type="radio" name="requiredAreaUnit" value="pyeong" checked={formData.requiredAreaUnit === 'pyeong'} onChange={() => handleAreaUnitChange('requiredAreaUnit', 'pyeong')} className="mr-2" /><span className="text-sm">평</span></label>
                    </div>
                  </div>
                  <div className="relative">
                    <input type="number" name="requiredArea" value={formData.requiredArea} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" />
                    {formData.requiredArea && <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">{formData.requiredAreaUnit === 'sqm' ? `(${convertArea(formData.requiredArea, 'sqm', 'pyeong')}평)` : `(${convertArea(formData.requiredArea, 'pyeong', 'sqm')}㎡)`}</div>}
                  </div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">월 평균 출고량 (개) *</label><input type="number" name="monthlyVolume" value={formData.monthlyVolume} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">필요한 팔레트 수 *</label><input type="number" name="palletCount" value={formData.palletCount} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" /></div>
              </div>
            </div>

            {/* 원하는 배송사 섹션 (이미지 기반 레이아웃) */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-left">원하는 배송사 *</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-8">
                {deliveryCompanies.map(company => (
                  <label key={company} className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={formData.desiredDelivery.includes(company)} 
                        onChange={() => handleCheckboxChange('desiredDelivery', company)} 
                        className="w-5 h-5 border-gray-300 rounded text-primary-600 focus:ring-primary-500 appearance-none border transition-colors checked:bg-primary-600 checked:border-primary-600" 
                      />
                      {formData.desiredDelivery.includes(company) && (
                        <svg className="absolute w-3 h-3 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      )}
                    </div>
                    <span className="text-base text-gray-700">{company}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 취급 물물 종류 섹션 (이미지 기반 3단 레이아웃) */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-left">취급 물품 종류 *</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-12">
                {[
                  "공산품", "전자제품", "화장품", "자동차부품", "반려동물용품",
                  "식품", "생활용품", "도서", "건강식품", "문구",
                  "의류", "스포츠용품", "완구", "가구", "사무용품"
                ].map(item => (
                  <label key={item} className="flex items-center space-x-3 cursor-pointer">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={formData.products.includes(item)} 
                        onChange={() => handleCheckboxChange('products', item)} 
                        className="w-4 h-4 border-gray-300 rounded text-primary-600 focus:ring-primary-500 appearance-none border transition-colors checked:bg-primary-600 checked:border-primary-600" 
                      />
                      {formData.products.includes(item) && (
                        <svg className="absolute w-2.5 h-2.5 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 개인정보 처리방침 (이미지 기반 상세 텍스트) */}
            <div className="pt-6 border-t">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">개인정보 처리방침</h3>
                <div className="space-y-4 text-sm text-gray-700 leading-relaxed mb-6">
                  <div>
                    <p className="font-bold mb-1">1. 수집하는 개인정보 항목</p>
                    <p className="pl-3 text-gray-600">필수항목: 이메일, 비밀번호, 전화번호, 담당자 연락처, 대표자명, 담당자명, 회사명/개인명</p>
                  </div>
                  <div>
                    <p className="font-bold mb-1">2. 개인정보의 수집 및 이용 목적</p>
                    <p className="pl-3 text-gray-600">- 회원 가입 및 관리, 서비스 제공, 고객사 정보 매칭</p>
                  </div>
                  <div>
                    <p className="font-bold mb-1">3. 개인정보의 보유 및 이용 기간</p>
                    <p className="pl-3 text-gray-600">- 회원 탈퇴 시까지 (단, 관련 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관)</p>
                  </div>
                  <div>
                    <p className="font-bold mb-1">4. 개인정보의 제3자 제공</p>
                    <p className="mb-2">회사는 원칙적으로 이용자의 개인정보를 외부원에 제공하지 않습니다. 다만, 플랫폼의 원활한 매칭 서비스 제공을 위해 아래와 같이 이용자의 동의 하에 개인정보를 제3자에게 제공합니다.</p>
                    <ul className="list-disc pl-8 space-y-1 text-gray-600">
                      <li>제공받는 자: 해당 업체/고객사의 상세 정보를 열람(열람권 사용 등)하는 회원</li>
                      <li>제공 목적: 물류 대행 업체 매칭 및 계약 상담을 위한 연락처 소통</li>
                      <li>제공 항목: 회사명, 대표자명, 담당자명, 담당자 연락처(전화번호), 이메일 및 상세 물류 요건 정보</li>
                      <li>보유 및 이용 기간: 목적 달성 시 및 회원 탈퇴 시까지 (단, 관련 법령에 보관 의무가 있는 경우 해당 기간 동안 보관)</li>
                    </ul>
                  </div>
                </div>
                
                <label className="flex items-center space-x-3 cursor-pointer group pt-4 border-t border-gray-200">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={privacyAgreed} 
                      onChange={(e) => { setPrivacyAgreed(e.target.checked); setPrivacyError(''); }} 
                      className="w-5 h-5 border-gray-300 rounded text-primary-600 focus:ring-primary-500 appearance-none border transition-colors checked:bg-primary-600" 
                      required 
                    />
                    {privacyAgreed && (
                      <svg className="absolute w-3 h-3 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    )}
                  </div>
                  <span className="text-gray-700 font-medium">
                    <span className="text-red-500 mr-2">*</span>
                    개인정보 수집 및 이용에 동의합니다.
                  </span>
                </label>
                {privacyError && <p className="mt-2 text-sm text-red-600 font-medium">{privacyError}</p>}
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={!privacyAgreed} className={`w-full py-4 px-4 rounded-xl text-lg font-bold transition-all shadow-lg ${privacyAgreed ? 'bg-primary-600 text-white hover:bg-primary-700 hover:-translate-y-0.5 shadow-primary-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}>
                고객사 등록하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegister;
