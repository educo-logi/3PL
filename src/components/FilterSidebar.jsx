import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { regions, productTypes, storageTypes } from '../data/sampleData';
import RadioButtonGroup from './RadioButtonGroup';

const FilterSidebar = ({ filters, setFilters, isOpen, setIsOpen }) => {
  // 화면 크기에 따라 모바일/데스크톱 감지
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 아코디언 섹션 상태 관리
  const [expandedSections, setExpandedSections] = useState({
    regions: false,
    productTypes: false,
    storageTypes: false,
    area: false,  // 면적 필터도 기본적으로 접힌 상태
    pallets: false  // 팔레트 수 필터도 기본적으로 접힌 상태
  });

  // 면적 옵션 (상식적인 범위)
  const areaOptions = [
    { value: '0-100', label: '100㎡ 이하' },
    { value: '100-500', label: '100-500㎡' },
    { value: '500-1000', label: '500-1000㎡' },
    { value: '1000-2000', label: '1000-2000㎡' },
    { value: '2000+', label: '2000㎡ 이상' }
  ];

  // 팔레트 수 옵션 (상식적인 범위)
  const palletOptions = [
    { value: '0-50', label: '50개 이하' },
    { value: '50-200', label: '50-200개' },
    { value: '200-500', label: '200-500개' },
    { value: '500-1000', label: '500-1000개' },
    { value: '1000+', label: '1000개 이상' }
  ];

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // 필터 변경 핸들러
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  // 숫자 입력 핸들러들
  const handleMinAreaChange = (value) => {
    setFilters(prev => ({ ...prev, minArea: value }));
  };

  const handleMaxAreaChange = (value) => {
    setFilters(prev => ({ ...prev, maxArea: value }));
  };

  const handleMinPalletsChange = (value) => {
    setFilters(prev => ({ ...prev, minPallets: value }));
  };

  const handleMaxPalletsChange = (value) => {
    setFilters(prev => ({ ...prev, maxPallets: value }));
  };

  // 필터 초기화
  const clearFilters = () => {
    setFilters({
      regions: [],
      productTypes: [],
      storageTypes: [],
      areaRange: '',
      palletRange: ''
    });
  };

  // 아코디언 섹션 컴포넌트
  const AccordionSection = ({ title, sectionKey, children, maxHeight = "max-h-32" }) => {
    const isExpanded = expandedSections[sectionKey];
    
  return (
    <div className="mb-5">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left py-3 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-base font-medium text-gray-800 whitespace-pre-line">
          {title.split('\\n').map((line, index, array) => (
            <React.Fragment key={index}>
              {line}
              {index < array.length - 1 && <br />}
            </React.Fragment>
          ))}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className={`space-y-1 ${maxHeight} overflow-y-auto mt-3`}>
            {children}
          </div>
        </div>
      </div>
    );
  };

  // 공통 필터 콘텐츠
  const filterContent = (
    <div className="p-6 h-full overflow-y-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">필터</h3>
        {isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 지역 필터 */}
      <AccordionSection title="지역" sectionKey="regions">
            {regions.map(region => (
              <label key={region} className="flex items-center py-2">
                <input
                  type="checkbox"
                  checked={filters.regions.includes(region)}
                  onChange={() => handleFilterChange('regions', region)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">{region}</span>
              </label>
            ))}
      </AccordionSection>

      {/* 상품 유형 필터 */}
      <AccordionSection title="상품 유형" sectionKey="productTypes">
        {productTypes.map(type => (
          <label key={type} className="flex items-center py-2">
            <input
              type="checkbox"
              checked={filters.productTypes.includes(type)}
              onChange={() => handleFilterChange('productTypes', type)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-3 text-sm text-gray-700">{type}</span>
          </label>
        ))}
      </AccordionSection>

      {/* 보관 방식 필터 */}
      <AccordionSection title="보관 방식" sectionKey="storageTypes" maxHeight="">
        {storageTypes.map(type => (
          <label key={type} className="flex items-center py-2">
            <input
              type="checkbox"
              checked={filters.storageTypes.includes(type)}
              onChange={() => handleFilterChange('storageTypes', type)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-3 text-sm text-gray-700">{type}</span>
          </label>
        ))}
      </AccordionSection>

      {/* 면적 필터 */}
      <AccordionSection title="필요 면적" sectionKey="area" maxHeight="">
        <RadioButtonGroup
          label="면적 범위 선택"
          options={areaOptions}
          value={filters.areaRange}
          onChange={(value) => setFilters(prev => ({ ...prev, areaRange: value }))}
          name="areaRange"
        />
      </AccordionSection>

      {/* 팔레트 수 필터 */}
      <AccordionSection title="필요 팔레트 수" sectionKey="pallets" maxHeight="">
        <RadioButtonGroup
          label="팔레트 수 범위 선택 (1100x1100 기준)"
          options={palletOptions}
          value={filters.palletRange}
          onChange={(value) => setFilters(prev => ({ ...prev, palletRange: value }))}
          name="palletRange"
        />
      </AccordionSection>

      {/* 필터 초기화 */}
      <button
        onClick={clearFilters}
        className="w-full bg-white border border-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors text-base font-medium"
      >
        필터 초기화
      </button>
    </div>
  );

  // 모바일인 경우
  if (isMobile) {
    return (
      <>
        {/* 모바일 오버레이 */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* 사이드바 */}
        <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {filterContent}
        </div>
      </>
    );
  }

  // 데스크톱인 경우
  return (
    <div className="w-80 bg-white shadow-lg">
      {filterContent}
    </div>
  );
};

export default FilterSidebar;