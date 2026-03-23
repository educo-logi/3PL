import React, { useState } from 'react';
import { Users, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { regions, detailedRegions, dongData, productTypes, deliveryCompanies } from '../data/sampleData';
import { hashPassword } from '../utils/passwordHash';

import { supabase } from '../utils/supabaseClient';
import { trackEvent, GA_EVENTS } from '../utils/gtm';
import { checkEmailDuplicate } from '../utils/authUtils';

const CustomerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    businessNumber: '', // 사업자등록번호 추가
    location: '',
    city: '',
    dong: '',
    detailAddress: '', // 나머지 주소 추가
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

  // 면적 환산 함수
  const convertArea = (value, fromUnit, toUnit) => {
    if (!value || isNaN(value)) return '';
    const numValue = parseFloat(value);
    if (fromUnit === 'sqm' && toUnit === 'pyeong') {
      return Math.round(numValue * 0.3025);
    } else if (fromUnit === 'pyeong' && toUnit === 'sqm') {
      return Math.round(numValue * 3.3058);
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'password') {
      setPasswordError('');
    }
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // 지역이 변경되면 세부지역과 동을 초기화
      if (name === 'location') {
        newData.city = '';
        newData.dong = '';
      }
      // 세부지역이 변경되면 동을 초기화
      else if (name === 'city') {
        newData.dong = '';
      }

      return newData;
    });
  };

  const handleAreaUnitChange = (fieldName, unit) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: unit
    }));
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

    // 개인정보 처리방침 동의 확인
    if (!privacyAgreed) {
      setPrivacyError('개인정보 처리방침에 동의해주세요.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 비밀번호 검증
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/;
    if (!passwordRegex.test(formData.password)) {
      setPasswordError('영문, 숫자, 특수문자를 포함하여 8~16자로 입력해주세요.');
      alert('비밀번호는 영문, 숫자, 특수문자를 포함하여 8~16자여야 합니다.');
      return;
    }

    // 비밀번호 해싱
    const hashedPassword = hashPassword(formData.password);

    try {
      // 웰컴 이벤트 지급 등과 호환되는 이메일 중복 체크
      const dupCheck = await checkEmailDuplicate(formData.email);
      if (dupCheck.isDuplicate) {
        alert(dupCheck.message + '\n다른 이메일을 사용해주세요.');
        return;
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            company_name: formData.companyName,
            business_number: formData.businessNumber, // DB 연동용 컬럼
            representative: formData.representative,
            location: formData.location,
            city: formData.city,
            dong: formData.dong,
            detail_address: formData.detailAddress, // DB 컬럼 추가 확인 필요
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
          }
        ]);

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
          <p className="text-gray-600 mb-2">
            고객사 등록이 성공적으로 완료되었습니다.
          </p>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 헤더 */}
          <div className="flex items-center mb-8">
            <Users className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">고객사 등록</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 기본 정보 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    회사명/개인명 *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사업자 등록번호 *
                  </label>
                  <input
                    type="text"
                    name="businessNumber"
                    value={formData.businessNumber}
                    onChange={handleInputChange}
                    placeholder="000-00-00000"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    대표자명 *
                  </label>
                  <input
                    type="text"
                    name="representative"
                    value={formData.representative}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호 *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당자명 *
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당자 연락처 *
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일 *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="mt-1 text-sm text-red-500">
                    로그인 시 사용할 이메일 주소입니다.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="영문, 숫자, 특수문자를 포함하여 8~16자로 입력해주세요."
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {passwordError && (
                    <p className="mt-1 text-sm text-red-500">{passwordError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 주소 정보 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">주소 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지역 *
                  </label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">지역을 선택하세요</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시 군 구 *
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.location}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  >
                    <option value="">시 군 구를 선택하세요</option>
                    {formData.location && detailedRegions[formData.location]?.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    동 *
                  </label>
                  <select
                    name="dong"
                    value={formData.dong}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.city}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  >
                    <option value="">동을 선택하세요</option>
                    {formData.location && formData.city && dongData[formData.location]?.[formData.city]?.map(dong => (
                      <option key={dong} value={dong}>{dong}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    나머지 주소
                  </label>
                  <input
                    type="text"
                    name="detailAddress"
                    value={formData.detailAddress}
                    onChange={handleInputChange}
                    placeholder="상세 주소를 입력하세요 (선택)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>


            {/* 물류 요구사항 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">물류 요구사항</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      사용할 총면적 *
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="requiredAreaUnit"
                          value="sqm"
                          checked={formData.requiredAreaUnit === 'sqm'}
                          onChange={() => handleAreaUnitChange('requiredAreaUnit', 'sqm')}
                          className="mr-2"
                        />
                        <span className="text-sm">제곱미터(㎡)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="requiredAreaUnit"
                          value="pyeong"
                          checked={formData.requiredAreaUnit === 'pyeong'}
                          onChange={() => handleAreaUnitChange('requiredAreaUnit', 'pyeong')}
                          className="mr-2"
                        />
                        <span className="text-sm">평</span>
                      </label>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      name="requiredArea"
                      value={formData.requiredArea}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    {formData.requiredArea && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                        {formData.requiredAreaUnit === 'sqm'
                          ? `(${convertArea(formData.requiredArea, 'sqm', 'pyeong')}평)`
                          : `(${convertArea(formData.requiredArea, 'pyeong', 'sqm')}㎡)`
                        }
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    월 평균 출고량 (개) (택배 송장 기준) *
                  </label>
                  <input
                    type="number"
                    name="monthlyVolume"
                    value={formData.monthlyVolume}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    필요한 팔레트 수 (1100x1100 사이즈 기준) *
                  </label>
                  <input
                    type="number"
                    name="palletCount"
                    value={formData.palletCount}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>

            {/* 원하는 배송사 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">원하는 배송사 *</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...deliveryCompanies, '무관'].map(company => (
                  <label key={company} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.desiredDelivery.includes(company)}
                      onChange={() => handleCheckboxChange('desiredDelivery', company)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{company}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 취급 물품 종류 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">취급 물품 종류 *</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-48 overflow-y-auto">
                {productTypes.map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.products.includes(type)}
                      onChange={() => handleCheckboxChange('products', type)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 개인정보 처리방침 동의 */}
            <div className="pt-6 border-t">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">개인정보 처리방침</h3>
                <div className="space-y-2 text-sm text-gray-700 mb-4">
                  <p><strong>1. 수집하는 개인정보 항목</strong></p>
                  <p className="ml-4">필수항목: 이메일, 비밀번호, 전화번호, 담당자 연락처, 대표자명, 담당자명, 회사명/개인명</p>
                  <p className="mt-3"><strong>2. 개인정보의 수집 및 이용 목적</strong></p>
                  <p className="ml-4">- 회원 가입 및 관리, 서비스 제공, 고객사 정보 매칭</p>
                  <p className="mt-3"><strong>3. 개인정보의 보유 및 이용 기간</strong></p>
                  <p className="ml-4">- 회원 탈퇴 시까지 (단, 관련 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관)</p>
                  <p className="mt-3"><strong>4. 개인정보의 제3자 제공</strong></p>
                  <p className="ml-4">회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 플랫폼의 원활한 매칭 서비스 제공을 위해 아래와 같이 이용자의 동의 하에 개인정보를 제3자에게 제공합니다.</p>
                  <p className="ml-8 mt-1">• 제공받는 자: 해당 업체/고객사의 상세 정보를 열람(열람권 사용 등)하는 회원</p>
                  <p className="ml-8">• 제공 목적: 물류 대행 업체 매칭 및 계약 상담을 위한 연락처 소통</p>
                  <p className="ml-8">• 제공 항목: 회사명, 대표자명, 담당자명, 담당자 연락처(전화번호), 이메일 및 상세 물류 요건 정보</p>
                  <p className="ml-8">• 보유 및 이용 기간: 목적 달성 시 및 회원 탈퇴 시까지 (단, 관련 법령에 보관 의무가 있는 경우 해당 기간 동안 보관)</p>
                </div>
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(e) => {
                      setPrivacyAgreed(e.target.checked);
                      setPrivacyError('');
                    }}
                    className="mt-1 mr-3 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    <span className="text-red-500">*</span> 개인정보 수집 및 이용에 동의합니다.
                  </span>
                </label>
                {privacyError && (
                  <p className="mt-2 text-sm text-red-600">{privacyError}</p>
                )}
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={!privacyAgreed}
                className={`w-full py-3 px-4 rounded-lg transition-colors text-lg font-semibold ${privacyAgreed
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
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
