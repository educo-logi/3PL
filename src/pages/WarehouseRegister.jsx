import React, { useState } from 'react';
import { Building2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { regions, detailedRegions, dongData, productTypes, storageTypes, deliveryCompanies, solutions } from '../data/sampleData';
import { supabase } from '../utils/supabaseClient';

const WarehouseRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    businessNumber: '',
    representative: '',
    phone: '',
    contactPerson: '',
    contactPhone: '',
    email: '',
    password: '',
    location: '',
    city: '',
    dong: '',
    totalArea: '',
    totalAreaUnit: 'sqm',
    warehouseCount: '',
    warehouseArea: '',
    warehouseAreaUnit: 'sqm',
    availableArea: '',
    availableAreaUnit: 'sqm',
    palletCount: '',
    experience: '',
    storageTypes: [],
    deliveryCompanies: [],
    otherDeliveryCompany: '',
    solutions: [],
    otherSolution: '',
    products: []
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [privacyError, setPrivacyError] = useState('');

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
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // 지역이 변경되면 세부 지역과 동 초기화
      ...(name === 'location' && { city: '', dong: '' }),
      // 세부 지역이 변경되면 동 초기화
      ...(name === 'city' && { dong: '' })
    }));
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

  const handlePrefillSample = () => {
    const region = regions[0] || '';
    const city = region && detailedRegions[region]?.[0] ? detailedRegions[region][0] : '';
    const dong = region && city && dongData[region]?.[city]?.[0] ? dongData[region][city][0] : '';
    setFormData(prev => ({
      ...prev,
      companyName: '샘플 창고',
      businessNumber: '123-45-67890',
      representative: '홍길동',
      phone: '010-1234-5678',
      contactPerson: '김담당',
      contactPhone: '010-1111-2222',
      email: '',
      password: '',
      location: region,
      city,
      dong,
      totalArea: '1000',
      totalAreaUnit: 'sqm',
      warehouseCount: '2',
      warehouseArea: '800',
      warehouseAreaUnit: 'sqm',
      availableArea: '600',
      availableAreaUnit: 'sqm',
      palletCount: '200',
      experience: '3',
      storageTypes: storageTypes.slice(0, 2),
      deliveryCompanies: deliveryCompanies.slice(0, 2),
      otherDeliveryCompany: '',
      solutions: solutions.slice(0, 2),
      otherSolution: '',
      products: productTypes.slice(0, 3)
    }));
  };

  // 면적 검증 함수
  const validateAreas = () => {
    const totalArea = parseFloat(formData.totalArea);
    const warehouseArea = parseFloat(formData.warehouseArea);
    const availableArea = parseFloat(formData.availableArea);

    // 대지면적 < 창고별 총면적 검증
    if (totalArea && warehouseArea && totalArea < warehouseArea) {
      alert('오류: 대지면적은 창고별 총면적보다 크거나 같아야 합니다.');
      return false;
    }

    // 창고별 총면적 < 계약가능면적 검증
    if (warehouseArea && availableArea && warehouseArea < availableArea) {
      alert('오류: 창고별 총면적은 계약가능면적보다 크거나 같아야 합니다.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    // 개인정보 처리방침 동의 확인
    if (!privacyAgreed) {
      setPrivacyError('개인정보 처리방침에 동의해주세요.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 면적 검증
    if (!validateAreas()) {
      return;
    }

    setIsSubmitting(true);

    const submittedAt = new Date().toISOString();

    // Supabase Auth 회원가입 (메타데이터에 입력값 저장)
    const { password, ...metadataPayload } = formData;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            userType: 'warehouse',
            status: 'pending',
            submittedAt,
            ...metadataPayload
          }
        }
      });

      if (error) {
        console.error('Supabase 회원가입 오류:', error);
        alert(`회원가입 중 오류가 발생했습니다: ${error.message}`);
        return;
      }

      const supaUser = data?.user;
      const ownerId = supaUser?.id || `warehouse-${Date.now()}`;

      // 프로필 upsert
      await supabase.from('profiles').upsert({
        id: ownerId,
        email: supaUser?.email || formData.email,
        user_type: 'warehouse',
        status: 'pending'
      });

      // 창고 데이터 저장 (password 제외, snake_case 변환)
      // 주의: DB에 phone, representative 등의 컬럼이 존재해야 에러 없이 저장됩니다.
      const formattedStorageTypes = formData.storageTypes;
      const formattedDelivery = formData.deliveryCompanies.includes('기타')
        ? [...formData.deliveryCompanies.filter(d => d !== '기타'), formData.otherDeliveryCompany]
        : formData.deliveryCompanies;
      const formattedSolutions = formData.solutions.includes('기타')
        ? [...formData.solutions.filter(s => s !== '기타'), formData.otherSolution]
        : formData.solutions;

      const { error: insertError } = await supabase.from('warehouses').insert({
        owner_id: ownerId,
        status: 'pending',
        submitted_at: submittedAt,
        company_name: formData.companyName,
        business_number: formData.businessNumber,
        representative: formData.representative,
        phone: formData.phone,
        contact_person: formData.contactPerson,
        contact_phone: formData.contactPhone,
        email: formData.email,
        location: formData.location,
        city: formData.city,
        dong: formData.dong,
        total_area: Number(formData.totalArea) || 0,
        warehouse_count: Number(formData.warehouseCount) || 0,
        warehouse_area: Number(formData.warehouseArea) || 0,
        available_area: Number(formData.availableArea) || 0,
        pallet_count: Number(formData.palletCount) || 0,
        experience: formData.experience,
        storage_types: formattedStorageTypes,
        delivery_companies: formattedDelivery,
        solutions: formattedSolutions,
        products: formData.products
      });

      if (insertError) throw insertError;

      // 현재 사용자 세션 캐싱 (민감정보 제외)
      const sanitizedUser = {
        id: ownerId,
        email: supaUser?.email || formData.email,
        userType: 'warehouse',
        status: 'pending',
        submittedAt
      };
      localStorage.setItem('currentUser', JSON.stringify(sanitizedUser));

      setIsSubmitted(true);
    } catch (err) {
      console.error('회원가입 처리 오류:', err);
      alert('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">등록 완료!</h2>
          <p className="text-gray-600 mb-2">
            창고 등록이 성공적으로 완료되었습니다.
          </p>
          <p className="text-lg font-bold text-primary-600 mb-6">
            검토 후 승인되면 플랫폼에 노출됩니다.
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
            <Building2 className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">창고 등록</h1>
            <button
              type="button"
              onClick={handlePrefillSample}
              className="ml-auto text-sm px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              임시 데이터 채우기
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 기본 정보 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    회사명 *
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
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* 창고 정보 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">창고 정보</h2>
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
                    세부 지역 *
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.location}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  >
                    <option value="">세부 지역을 선택하세요</option>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    경력(년) *
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      대지 면적 *
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="totalAreaUnit"
                          value="sqm"
                          checked={formData.totalAreaUnit === 'sqm'}
                          onChange={() => handleAreaUnitChange('totalAreaUnit', 'sqm')}
                          className="mr-2"
                        />
                        <span className="text-sm">제곱미터(㎡)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="totalAreaUnit"
                          value="pyeong"
                          checked={formData.totalAreaUnit === 'pyeong'}
                          onChange={() => handleAreaUnitChange('totalAreaUnit', 'pyeong')}
                          className="mr-2"
                        />
                        <span className="text-sm">평</span>
                      </label>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      name="totalArea"
                      value={formData.totalArea}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    {formData.totalArea && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                        {formData.totalAreaUnit === 'sqm'
                          ? `(${convertArea(formData.totalArea, 'sqm', 'pyeong')}평)`
                          : `(${convertArea(formData.totalArea, 'pyeong', 'sqm')}㎡)`
                        }
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    창고 개수 *
                  </label>
                  <select
                    name="warehouseCount"
                    value={formData.warehouseCount}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">창고 개수를 선택하세요</option>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}개</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      창고별 총 면적 *
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="warehouseAreaUnit"
                          value="sqm"
                          checked={formData.warehouseAreaUnit === 'sqm'}
                          onChange={() => handleAreaUnitChange('warehouseAreaUnit', 'sqm')}
                          className="mr-2"
                        />
                        <span className="text-sm">제곱미터(㎡)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="warehouseAreaUnit"
                          value="pyeong"
                          checked={formData.warehouseAreaUnit === 'pyeong'}
                          onChange={() => handleAreaUnitChange('warehouseAreaUnit', 'pyeong')}
                          className="mr-2"
                        />
                        <span className="text-sm">평</span>
                      </label>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      name="warehouseArea"
                      value={formData.warehouseArea}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    {formData.warehouseArea && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                        {formData.warehouseAreaUnit === 'sqm'
                          ? `(${convertArea(formData.warehouseArea, 'sqm', 'pyeong')}평)`
                          : `(${convertArea(formData.warehouseArea, 'pyeong', 'sqm')}㎡)`
                        }
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      계약가능면적 *
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="availableAreaUnit"
                          value="sqm"
                          checked={formData.availableAreaUnit === 'sqm'}
                          onChange={() => handleAreaUnitChange('availableAreaUnit', 'sqm')}
                          className="mr-2"
                        />
                        <span className="text-sm">제곱미터(㎡)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="availableAreaUnit"
                          value="pyeong"
                          checked={formData.availableAreaUnit === 'pyeong'}
                          onChange={() => handleAreaUnitChange('availableAreaUnit', 'pyeong')}
                          className="mr-2"
                        />
                        <span className="text-sm">평</span>
                      </label>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      name="availableArea"
                      value={formData.availableArea}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    {formData.availableArea && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                        {formData.availableAreaUnit === 'sqm'
                          ? `(${convertArea(formData.availableArea, 'sqm', 'pyeong')}평)`
                          : `(${convertArea(formData.availableArea, 'pyeong', 'sqm')}㎡)`
                        }
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    계약가능 팔레트 수 (1100x1100 사이즈 기준) *
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

            {/* 보관 방식 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">보관 방식 *</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {storageTypes.map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.storageTypes.includes(type)}
                      onChange={() => handleCheckboxChange('storageTypes', type)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 사용 배송사 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">사용 배송사 *</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {deliveryCompanies.map(company => (
                  <label key={company} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.deliveryCompanies.includes(company)}
                      onChange={() => handleCheckboxChange('deliveryCompanies', company)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{company}</span>
                  </label>
                ))}
              </div>
              {formData.deliveryCompanies.includes('기타') && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기타 배송사명
                  </label>
                  <input
                    type="text"
                    name="otherDeliveryCompany"
                    value={formData.otherDeliveryCompany}
                    onChange={handleInputChange}
                    placeholder="배송사명을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}
            </div>

            {/* 사용 솔루션 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">사용 솔루션 *</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {solutions.map(solution => (
                  <label key={solution} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.solutions.includes(solution)}
                      onChange={() => handleCheckboxChange('solutions', solution)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{solution}</span>
                  </label>
                ))}
              </div>
              {formData.solutions.includes('기타') && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기타 솔루션명
                  </label>
                  <input
                    type="text"
                    name="otherSolution"
                    value={formData.otherSolution}
                    onChange={handleInputChange}
                    placeholder="솔루션명을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}
            </div>

            {/* 취급 중 및 취급 가능 종류 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">취급 중 및 취급 가능 종류 *</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                  <p className="ml-4">필수항목: 이메일, 비밀번호, 전화번호, 담당자 연락처, 사업자등록번호, 대표자명, 담당자명, 회사명</p>
                  <p className="mt-3"><strong>2. 개인정보의 수집 및 이용 목적</strong></p>
                  <p className="ml-4">- 회원 가입 및 관리, 서비스 제공, 창고 정보 매칭</p>
                  <p className="mt-3"><strong>3. 개인정보의 보유 및 이용 기간</strong></p>
                  <p className="ml-4">- 회원 탈퇴 시까지 (단, 관련 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관)</p>
                  <p className="mt-3"><strong>4. 개인정보의 제3자 제공</strong></p>
                  <p className="ml-4">- 서비스 운영 및 관리 목적으로 관리자는 회원 정보에 접근할 수 있습니다.</p>
                  <p className="ml-4">- 관리자는 서비스 제공, 회원 관리, 부정 이용 방지 등을 위해 필요한 범위 내에서 개인정보를 처리합니다.</p>
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
                disabled={!privacyAgreed || isSubmitting}
                className={`w-full py-3 px-4 rounded-lg transition-colors text-lg font-semibold ${privacyAgreed && !isSubmitting
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {isSubmitting ? '등록 처리 중...' : '창고 등록하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WarehouseRegister;
