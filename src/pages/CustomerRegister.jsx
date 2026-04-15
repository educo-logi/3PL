import React, { useState } from 'react';
import { Users, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { regions, productTypes, deliveryCompanies } from '../data/sampleData';
import { signup } from '../utils/authService';
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
    jibunAddress: '',
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
  const [thirdPartyAgreed, setThirdPartyAgreed] = useState(false);
  const [optionalAgreed, setOptionalAgreed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyError, setPrivacyError] = useState('');
  const [termsError, setTermsError] = useState('');
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
      jibunAddress: data.jibunAddress || data.autoJibunAddress || '',
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
    let hasError = false;

    if (!termsAgreed) {
      setTermsError('이용약관에 동의해주세요.');
      hasError = true;
    }
    if (!privacyAgreed) {
      setPrivacyError('개인정보 수집 및 이용에 동의해주세요.');
      hasError = true;
    }
    if (!thirdPartyAgreed) {
      alert('개인정보 제3자 제공에 동의해주세요.');
      hasError = true;
    }

    if (hasError) {
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/;
    if (!passwordRegex.test(formData.password)) {
      setPasswordError('영문, 숫자, 특수문자를 포함하여 8~16자로 입력해주세요.');
      alert('비밀번호는 영문, 숫자, 특수문자를 포함하여 8~16자여야 합니다.');
      return;
    }

    // Remove combined address combining since we now store them separately.

    try {
      const dupCheck = await checkEmailDuplicate(formData.email);
      if (dupCheck.isDuplicate) {
        alert(dupCheck.message + '\n다른 이메일을 사용해주세요.');
        return;
      }

      // 선택 정보 동의 여부에 따른 데이터 필터링 로직 (최소 수집 원칙 준수)
      const submissionData = {
        company_name: formData.companyName,
        business_number: formData.businessNumber,
        contact_person: formData.contactPerson,
        contact_phone: formData.contactPhone,
        email: formData.email,
        ...(optionalAgreed ? {
          representative: formData.representative,
          location: formData.location,
          city: formData.city,
          dong: formData.dong,
          road_address: formData.roadAddress,
          jibun_address: formData.jibunAddress,
          detail_address: formData.detailAddress,
          phone: formData.phone,
          required_area: parseFloat(formData.requiredArea) || null,
          required_area_unit: formData.requiredAreaUnit,
          monthly_volume: parseFloat(formData.monthlyVolume) || null,
          pallet_count: parseInt(formData.palletCount) || null,
          desired_delivery: formData.desiredDelivery,
          products: formData.products,
        } : {
          // 동의 미체크 시 기본 빈 값으로 전송 (필수 정보 외 제외)
          representative: null,
          location: null,
          city: null,
          dong: null,
          road_address: null,
          jibun_address: null,
          detail_address: null,
          phone: null,
          required_area: null,
          monthly_volume: null,
          pallet_count: null,
          desired_delivery: [],
          products: [],
        })
      };

      // Supabase Auth 회원가입 (bcrypt 자동 적용) + 프로필 테이블 INSERT
      const result = await signup(formData.email, formData.password, 'customer', submissionData);

      if (!result.success) {
        alert(result.message || '등록 중 오류가 발생했습니다.');
        return;
      }

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
                <div><label className="block text-sm font-medium text-gray-700 mb-2">대표자명</label><input type="text" name="representative" value={formData.representative} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">일반 전화번호</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" /></div>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">주소 정보 (선택)</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">기본 주소</label>
                  <button type="button" onClick={() => setIsAddressModalOpen(true)} className="text-xs bg-primary-50 text-primary-600 px-3 py-1.5 rounded-md border border-primary-200 hover:bg-primary-100 transition-colors font-semibold">주소 검색</button>
                </div>
                <input type="text" name="roadAddress" value={formData.roadAddress} readOnly placeholder="주소 검색 버튼을 이용하세요" className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">상세 주소</label>
                  <input type="text" name="detailAddress" value={formData.detailAddress} onChange={handleInputChange} placeholder="나머지 상세 주소를 입력하세요 (예: 101동 202호)" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" />
                </div>
                <p className="text-xs text-gray-500 flex items-center"><span className="font-semibold text-primary-600 mr-2">[자동 매핑 정보]</span>현재 지역: {formData.location} {formData.city} {formData.dong}</p>
              </div>
            </div>

            <AddressSearchModal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} onComplete={handleAddressComplete} />

            {/* 물류 요구사항 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">물류 요구사항 (선택)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">사용할 총면적</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center cursor-pointer"><input type="radio" name="requiredAreaUnit" value="sqm" checked={formData.requiredAreaUnit === 'sqm'} onChange={() => handleAreaUnitChange('requiredAreaUnit', 'sqm')} className="mr-2" /><span className="text-sm">제곱미터(㎡)</span></label>
                      <label className="flex items-center cursor-pointer"><input type="radio" name="requiredAreaUnit" value="pyeong" checked={formData.requiredAreaUnit === 'pyeong'} onChange={() => handleAreaUnitChange('requiredAreaUnit', 'pyeong')} className="mr-2" /><span className="text-sm">평</span></label>
                    </div>
                  </div>
                  <div className="relative">
                    <input type="number" name="requiredArea" value={formData.requiredArea} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" />
                    {formData.requiredArea && <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">{formData.requiredAreaUnit === 'sqm' ? `(${convertArea(formData.requiredArea, 'sqm', 'pyeong')}평)` : `(${convertArea(formData.requiredArea, 'pyeong', 'sqm')}㎡)`}</div>}
                  </div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">월 평균 출고량 (개)</label><input type="number" name="monthlyVolume" value={formData.monthlyVolume} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">필요한 팔레트 수</label><input type="number" name="palletCount" value={formData.palletCount} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500" /></div>
              </div>
            </div>

            {/* 원하는 배송사 섹션 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-left">원하는 배송사 (선택)</h2>
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

            {/* 취급 물품 종류 섹션 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-left">취급 물품 종류 (선택)</h2>
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

            {/* 약관 동의 */}
            <div className="pt-6 border-t">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-6">
                <h3 className="text-lg font-bold text-gray-900">약관 동의</h3>
                
                {/* 이용약관 */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={termsAgreed} 
                        onChange={(e) => { setTermsAgreed(e.target.checked); setTermsError(''); }} 
                        className="w-5 h-5 border-gray-300 rounded text-primary-600 focus:ring-primary-500 appearance-none border transition-colors checked:bg-primary-600" 
                      />
                      {termsAgreed && (
                        <svg className="absolute w-3 h-3 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      )}
                    </div>
                    <span className="text-gray-700 font-medium">
                      <span className="text-red-500 mr-2">*</span>
                      이용약관에 동의합니다.
                    </span>
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline ml-auto">내용보기</a>
                  </label>
                  {termsError && <p className="text-sm text-red-600 font-medium ml-8">{termsError}</p>}
                </div>

                {/* 개인정보 수집 및 이용 동의 (필수 - 개인정보보호법 제15조) */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-800 underline">개인정보 수집 및 이용 동의 (필수 - 개인정보보호법 제15조)</h4>
                  <div className="bg-white p-4 rounded border border-gray-200 text-xs text-gray-500 h-32 overflow-y-auto mb-3">
                    <p className="font-bold mb-1">1. 수집하는 개인정보 항목</p>
                    <p className="mb-2">- 필수: 이메일, 비밀번호, 전화번호, 담당자 연락처, 대표자명, 담당자명, 회사명/개인명</p>
                    <p className="font-bold mb-1">2. 개인정보의 수집 및 이용 목적</p>
                    <p className="mb-2">- 회원 가입 및 관리, 서비스 제공, 고객사 정보 매칭</p>
                    <p className="font-bold mb-1">3. 개인정보의 보유 및 이용 기간</p>
                    <p className="mb-2">- 회원 탈퇴 시까지 (단, 관련 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관)</p>
                    <p className="font-bold mb-1">4. 동의 거부 권리 및 불이익 고지</p>
                    <p>- 귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, 필수 항목에 대한 동의 거부 시 회원가입 및 서비스 이용이 제한될 수 있습니다.</p>
                  </div>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={privacyAgreed} 
                        onChange={(e) => { setPrivacyAgreed(e.target.checked); setPrivacyError(''); }} 
                        className="w-5 h-5 border-gray-300 rounded text-primary-600 focus:ring-primary-500 appearance-none border transition-colors checked:bg-primary-600" 
                      />
                      {privacyAgreed && (
                        <svg className="absolute w-3 h-3 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      )}
                    </div>
                    <span className="text-gray-700 font-medium text-sm">
                      개인정보 수집 및 이용에 동의합니다.
                    </span>
                  </label>
                  {privacyError && <p className="text-sm text-red-600 font-medium ml-8">{privacyError}</p>}
                </div>

                {/* 개인정보 제3자 제공 동의 (필수 - 개인정보보호법 제17조) */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-800 underline">개인정보 제3자 제공 동의 (필수 - 개인정보보호법 제17조)</h4>
                  <div className="bg-white p-4 rounded border border-gray-200 text-xs text-gray-500 h-32 overflow-y-auto mb-3">
                    <p className="font-bold mb-1">1. 제공받는 자</p>
                    <p className="mb-2">- 매칭 서비스를 이용하는 창고 업체 회원</p>
                    <p className="font-bold mb-1">2. 제공받는 자의 이용 목적</p>
                    <p className="mb-2">- 물류 매칭 상담 및 보관 견적 확인을 위한 연락처 소통</p>
                    <p className="font-bold mb-1">3. 제공하는 항목</p>
                    <p className="mb-2">- 회사명/개인명, 대표자명, 담당자명, 담당자 연락처, 이메일 및 상세 물류 요건 정보</p>
                    <p className="font-bold mb-1">4. 제공받는 자의 개인정보 보유 및 이용 기간</p>
                    <p className="mb-2">- 목적 달성 시 및 회원 탈퇴 시까지 (단, 관련 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관)</p>
                    <p className="font-bold mb-1">5. 동의 거부 권리 및 불이익 고지</p>
                    <p>- 귀하는 개인정보 제3자 제공에 대한 동의를 거부할 권리가 있습니다. 다만, 필수 항목에 대한 동의 거부 시 물류 상담 및 창고 매칭 서비스 이용이 제한될 수 있습니다.</p>
                  </div>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={thirdPartyAgreed} 
                        onChange={(e) => setThirdPartyAgreed(e.target.checked)} 
                        className="w-5 h-5 border-gray-300 rounded text-primary-600 focus:ring-primary-500 appearance-none border transition-colors checked:bg-primary-600" 
                      />
                      {thirdPartyAgreed && (
                        <svg className="absolute w-3 h-3 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      )}
                    </div>
                    <span className="text-gray-700 font-medium text-sm">
                      개인정보 제3자 제공에 동의합니다.
                    </span>
                  </label>
                </div>

                {/* 선택 정보 수집 및 이용 동의 */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-800">선택 정보 수집 및 이용 동의 (선택)</h4>
                  <div className="bg-white p-4 rounded border border-gray-200 text-xs text-gray-500 h-32 overflow-y-auto mb-3">
                    <p className="font-bold mb-1">[선택 정보 수집 배경]</p>
                    <p className="mb-2">- 고객님의 상세 물류 요구사항을 등록하면 조건에 맞는 창고 업체로부터 더 정확한 견적과 제안을 받을 수 있습니다.</p>
                    <p className="font-bold mb-1">[수집하는 개인정보 항목]</p>
                    <p className="mb-2">- 대표자명, 일반 전화번호, 상세 주소, 물류 요구사항(면적/출고량/파렛트수 등), 취급 물류 종류 등</p>
                    <p className="font-bold mb-1">[개인정보의 보유 및 이용 기간]</p>
                    <p className="mb-2">- 회원 탈퇴 시까지 (단, 법령에 따라 필요 시 해당 기간까지)</p>
                    <p className="font-bold mb-1">[동의 거부 권리 및 불이익]</p>
                    <p className="mb-2">- 고객님은 선택 정보 수집에 대한 동의를 거부할 권리가 있습니다. 동의하지 않아도 가입 및 서비스 이용은 가능합니다.</p>
                    <p className="bg-primary-50 p-2 rounded text-primary-700 font-medium">※ 상대방(창고업체)에게 귀하의 상세 물류 요건을 공개하고 더 정확한 매칭 상담을 받으시려면 동의해 주세요.</p>
                  </div>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={optionalAgreed}
                        onChange={(e) => setOptionalAgreed(e.target.checked)}
                        className="w-5 h-5 border-gray-300 rounded text-primary-600 focus:ring-primary-500 appearance-none border transition-colors checked:bg-primary-600" 
                      />
                      {optionalAgreed && (
                        <svg className="absolute w-3 h-3 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      )}
                    </div>
                    <span className="text-gray-700 font-medium text-sm">
                      선택 정보 수집 및 이용에 동의합니다.
                    </span>
                  </label>
                  <div className="ml-8 mt-1 space-y-1">
                    <p className="text-xs text-primary-600 font-medium">※ 동의 시 상세 정보가 작성되어 상대방에게 선택받을 (매칭) 확률이 크게 늘어납니다.</p>
                    <p className="text-[11px] text-gray-400">※ 선택 정보에 동의하지 않아도 서비스 이용이 가능합니다.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={!privacyAgreed || !termsAgreed || !thirdPartyAgreed} className={`w-full py-4 px-4 rounded-xl text-lg font-bold transition-all shadow-lg ${privacyAgreed && termsAgreed && thirdPartyAgreed ? 'bg-primary-600 text-white hover:bg-primary-700 hover:-translate-y-0.5 shadow-primary-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}>
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
