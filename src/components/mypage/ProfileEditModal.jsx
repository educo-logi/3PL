import React, { useState, useEffect } from 'react';
import { X, Save, Building2, User } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { regions, productTypes, storageTypes, deliveryCompanies, solutions } from '../../data/sampleData';
import { hashPassword } from '../../utils/passwordHash';
import AddressSearchModal from '../AddressSearchModal';

const ProfileEditModal = ({ isOpen, onClose, currentUser, onUpdate }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic'); // basic, detail
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen && currentUser) {
            setFormData({
                ...currentUser,
                storage_types: currentUser.storage_types || [],
                delivery_companies: currentUser.delivery_companies || [],
                solutions: currentUser.solutions || [],
                products: currentUser.products || [],
                desired_delivery: currentUser.desired_delivery || [],
                total_area: currentUser.total_area || '',
                warehouse_area: currentUser.warehouse_area || '',
                available_area: currentUser.available_area || '',
                pallet_count: currentUser.pallet_count || '',
                experience: currentUser.experience || '',
                required_area: currentUser.required_area || '',
                monthly_volume: currentUser.monthly_volume || '',
                roadAddress: currentUser.road_address || '', // 기존 데이터 보존. 없으면 빈칸
                jibunAddress: currentUser.jibun_address || '',
                detailAddress: currentUser.detail_address || '', // 레거시 사용자의 상세주소(전체 문자열)는 일단 여기에 유지.
                contact_person: currentUser.contact_person || '',
                contact_phone: currentUser.contact_phone || '',
                warehouse_count: currentUser.warehouse_count || '',
                other_delivery_company: currentUser.other_delivery_company || '',
                other_solution: currentUser.other_solution || '',
                password: ''
            });
        }
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    const isWarehouse = currentUser?.userType === 'warehouse' || currentUser?.user_type === 'warehouse';

    const mapSidoName = (sido) => {
        const mapping = {
            '서울특별시': '서울',
            '인천광역시': '인천',
            '경기도': '경기',
            '강원특별자치도': '강원',
            '강원도': '강원',
            '세종특별자치시': '세종',
            '대전광역시': '대전',
            '충청남도': '충남',
            '충청북도': '충북',
            '광주광역시': '광주',
            '전라남도': '전남',
            '전라북도': '전북',
            '전북특별자치도': '전북',
            '대구광역시': '대구',
            '경상북도': '경북',
            '부산광역시': '부산',
            '울산광역시': '울산',
            '경상남도': '경남',
            '제주특별자치도': '제주'
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
            detailAddress: '' // 새 검색 시 상세 주소 초기화
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: prev[name]?.includes(value)
                ? prev[name].filter(item => item !== value)
                : [...(prev[name] || []), value]
        }));
    };

    const handleAreaUnitChange = (fieldName, unit) => {
        setFormData(prev => ({ ...prev, [fieldName]: unit }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const table = isWarehouse ? 'warehouses' : 'customers';
            const updateData = { ...formData };

            // 주소 결합
            const combinedAddress = `${formData.roadAddress} ${formData.detailAddress}`.trim();

            const commonAllowedFields = [
                'company_name', 'representative', 'phone',
                'location', 'city', 'dong', 'detail_address', 'road_address', 'jibun_address',
                'contact_person', 'contact_phone', 'password'
            ];

            const warehouseAllowedFields = [
                'total_area', 'warehouse_area', 'available_area', 'pallet_count',
                'storage_types', 'products', 'delivery_companies', 'solutions',
                'land_area', 'other_delivery_company', 'other_solution',
                'warehouse_count', 'total_area_unit', 'warehouse_area_unit', 'available_area_unit',
                'experience'
            ];

            const customerAllowedFields = [
                'required_area', 'monthly_volume', 'pallet_count', 'products',
                'desired_delivery', 'required_area_unit'
            ];

            const allowedFields = [
                ...commonAllowedFields,
                ...(isWarehouse ? warehouseAllowedFields : customerAllowedFields)
            ];

            // 데이터 정리 및 결합 주소 할당
            updateData.detail_address = formData.detailAddress;
            updateData.road_address = formData.roadAddress;
            updateData.jibun_address = formData.jibunAddress;

            Object.keys(updateData).forEach(key => {
                if (!allowedFields.includes(key)) {
                    delete updateData[key];
                }
            });

            if (updateData.password && updateData.password.trim() !== '') {
                updateData.password = hashPassword(updateData.password);
            } else {
                delete updateData.password;
            }

            if (updateData.delivery_companies && !updateData.delivery_companies.includes('기타')) {
                updateData.other_delivery_company = null;
            }
            if (updateData.solutions && !updateData.solutions.includes('기타')) {
                updateData.other_solution = null;
            }

            const numFields = ['total_area', 'warehouse_area', 'available_area', 'pallet_count', 'experience', 'required_area', 'monthly_volume', 'warehouse_count'];
            numFields.forEach(field => {
                if (updateData[field]) updateData[field] = parseFloat(updateData[field]);
            });

            const { error, count } = await supabase
                .from(table)
                .update(updateData, { count: 'exact' })
                .eq('id', currentUser.id);

            if (error) throw error;
            if (count === 0) throw new Error('업데이트된 정보가 없습니다.');

            onUpdate();
            onClose();
        } catch (error) {
            console.error('Update failed:', error);
            alert('정보 수정 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto py-10">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white rounded-t-xl z-10">
                    <div className="flex items-center space-x-3">
                        <div className="bg-primary-100 p-2 rounded-full">
                            {isWarehouse ? <Building2 className="w-6 h-6 text-primary-600" /> : <User className="w-6 h-6 text-primary-600" />}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">정보 수정</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex border-b px-6">
                    <button className={`py-4 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'basic' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('basic')}>기본 정보</button>
                    <button className={`py-4 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'detail' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('detail')}>{isWarehouse ? '시설 및 운영 정보' : '물류 요구 사항'}</button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <form id="editForm" onSubmit={handleSubmit} className="space-y-8">
                        {activeTab === 'basic' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">회사명 *</label><input name="company_name" value={formData.company_name || ''} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">대표자명 *</label><input name="representative" value={formData.representative || ''} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">담당자명</label><input name="contact_person" value={formData.contact_person || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">담당자 연락처</label><input name="contact_phone" value={formData.contact_phone || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">대표 전화번호 *</label><input name="phone" value={formData.phone || ''} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">이메일 (아이디) *</label><input name="email" value={formData.email || ''} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" /></div>
                                    <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200"><label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 (변경 시에만 입력)</label><input type="password" name="password" value={formData.password || ''} onChange={handleInputChange} placeholder="변경하지 않으려면 비워두세요" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
                                    
                                    <div className="md:col-span-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-gray-700">기본 주소 (도로명/지번) *</label>
                                            <button type="button" onClick={() => setIsAddressModalOpen(true)} className="text-xs bg-primary-50 text-primary-600 px-3 py-1.5 rounded-md border border-primary-200 hover:bg-primary-100 transition-colors font-semibold">주소 검색</button>
                                        </div>
                                        <input name="roadAddress" value={formData.roadAddress || ''} readOnly placeholder="주소 검색 버튼을 이용하세요" className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:outline-none" />
                                        
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">상세 주소 (직접 입력) *</label>
                                            <input name="detailAddress" value={formData.detailAddress || ''} onChange={handleInputChange} required placeholder="나머지 상세 주소를 입력하세요 (예: 101동 202호)" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                                        </div>

                                        <p className="mt-2 text-xs text-gray-500 flex items-center">
                                            <span className="font-semibold text-primary-600 mr-2">[자동 매핑 정보]</span>
                                            현재 지역: {formData.location} {formData.city} {formData.dong}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'detail' && isWarehouse && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-gray-50 p-5 rounded-lg border">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center"><Building2 className="w-4 h-4 mr-2" /> 면적 및 규모</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="text-xs text-gray-500 mb-1 block">대지면적</label><div className="flex"><input type="number" name="total_area" value={formData.total_area || ''} onChange={handleInputChange} className="flex-1 px-3 py-2 border rounded-l-lg" /><select name="total_area_unit" value={formData.total_area_unit || 'sqm'} onChange={(e) => handleAreaUnitChange('total_area_unit', e.target.value)} className="border-y border-r rounded-r-lg px-2 bg-gray-50"><option value="sqm">㎡</option><option value="pyeong">평</option></select></div></div>
                                        <div><label className="text-xs text-gray-500 mb-1 block">창고 연면적</label><div className="flex"><input type="number" name="warehouse_area" value={formData.warehouse_area || ''} onChange={handleInputChange} className="flex-1 px-3 py-2 border rounded-l-lg" /><select name="warehouse_area_unit" value={formData.warehouse_area_unit || 'sqm'} onChange={(e) => handleAreaUnitChange('warehouse_area_unit', e.target.value)} className="border-y border-r rounded-r-lg px-2 bg-gray-50"><option value="sqm">㎡</option><option value="pyeong">평</option></select></div></div>
                                        <div><label className="text-xs text-gray-500 mb-1 block">계약 가능 면적</label><div className="flex"><input type="number" name="available_area" value={formData.available_area || ''} onChange={handleInputChange} className="flex-1 px-3 py-2 border rounded-l-lg" /><select name="available_area_unit" value={formData.available_area_unit || 'sqm'} onChange={(e) => handleAreaUnitChange('available_area_unit', e.target.value)} className="border-y border-r rounded-r-lg px-2 bg-gray-50"><option value="sqm">㎡</option><option value="pyeong">평</option></select></div></div>
                                        <div><label className="text-xs text-gray-500 mb-1 block">팔레트 기준</label><input type="number" name="pallet_count" value={formData.pallet_count || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="PLT" /></div>
                                        <div><label className="text-xs text-gray-500 mb-1 block">창고 개수</label><input type="number" name="warehouse_count" value={formData.warehouse_count || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="개" /></div>
                                        <div><label className="text-xs text-gray-500 mb-1 block">업력 (경력)</label><div className="relative"><input type="number" name="experience" value={formData.experience || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="년" /><span className="absolute right-3 top-2 text-gray-400 text-sm">년</span></div></div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">사용 배송사</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {deliveryCompanies.map(company => (
                                            <label key={company} className="flex items-center space-x-2 text-sm text-gray-700 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded text-primary-600 focus:ring-primary-500" 
                                                    checked={formData.delivery_companies?.includes(company)} 
                                                    onChange={() => handleCheckboxChange('delivery_companies', company)} 
                                                />
                                                <span>{company}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {formData.delivery_companies?.includes('기타') && (
                                        <div className="mt-2"><input type="text" name="other_delivery_company" value={formData.other_delivery_company || ''} onChange={handleInputChange} placeholder="기타 배송사명 입력" className="w-full px-3 py-2 border rounded-lg" /></div>
                                    )}
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-3">사용 솔루션</label><div className="flex flex-wrap gap-2">{solutions.map(solution => (<label key={solution} className={`px-4 py-2 rounded-full text-sm cursor-pointer border transition-colors ${formData.solutions?.includes(solution) ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}><input type="checkbox" className="hidden" checked={formData.solutions?.includes(solution)} onChange={() => handleCheckboxChange('solutions', solution)} />{solution}</label>))}</div>{formData.solutions?.includes('기타') && (<div className="mt-2"><input type="text" name="other_solution" value={formData.other_solution || ''} onChange={handleInputChange} placeholder="기타 솔루션명 입력" className="w-full px-3 py-2 border rounded-lg" /></div>)}</div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-3">보관 가능 형태</label><div className="flex flex-wrap gap-2">{storageTypes.map(type => (<label key={type} className={`px-4 py-2 rounded-full text-sm cursor-pointer border transition-colors ${formData.storage_types?.includes(type) ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}><input type="checkbox" className="hidden" checked={formData.storage_types?.includes(type)} onChange={() => handleCheckboxChange('storage_types', type)} />{type}</label>))}</div></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-3">취급 가능 품목</label><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{productTypes.map(item => (<label key={item} className="flex items-center space-x-2 text-sm text-gray-700"><input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" checked={formData.products?.includes(item)} onChange={() => handleCheckboxChange('products', item)} /><span>{item}</span></label>))}</div></div>
                            </div>
                        )}

                        {activeTab === 'detail' && !isWarehouse && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-gray-50 p-5 rounded-lg border">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center"><User className="w-4 h-4 mr-2" /> 물류 요구 사항</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="text-xs text-gray-500 mb-1 block">필요 면적</label><div className="flex"><input type="number" name="required_area" value={formData.required_area || ''} onChange={handleInputChange} className="flex-1 px-3 py-2 border rounded-l-lg" /><select name="required_area_unit" value={formData.required_area_unit || 'sqm'} onChange={(e) => handleAreaUnitChange('required_area_unit', e.target.value)} className="border-y border-r rounded-r-lg px-2 bg-gray-50"><option value="sqm">㎡</option><option value="pyeong">평</option></select></div></div>
                                        <div><label className="text-xs text-gray-500 mb-1 block">월 출고량</label><input type="number" name="monthly_volume" value={formData.monthly_volume || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="건/월" /></div>
                                        <div><label className="text-xs text-gray-500 mb-1 block">팔레트 기준</label><input type="number" name="pallet_count" value={formData.pallet_count || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="PLT" /></div>
                                    </div>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-3">원하는 배송사</label><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{deliveryCompanies.map(item => (<label key={item} className="flex items-center space-x-2 text-sm text-gray-700"><input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" checked={formData.desired_delivery?.includes(item)} onChange={() => handleCheckboxChange('desired_delivery', item)} /><span>{item}</span></label>))}</div></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-3">취급 품목</label><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{productTypes.map(item => (<label key={item} className="flex items-center space-x-2 text-sm text-gray-700"><input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" checked={formData.products?.includes(item)} onChange={() => handleCheckboxChange('products', item)} /><span>{item}</span></label>))}</div></div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors">취소</button>
                    <button type="submit" form="editForm" disabled={loading} className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors flex items-center shadow-lg shadow-primary-600/30">
                        {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>저장 중...</>) : (<><Save className="w-5 h-5 mr-2" />변경사항 저장</>)}
                    </button>
                </div>
            </div>
            <AddressSearchModal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} onComplete={handleAddressComplete} />
        </div>
    );
};

export default ProfileEditModal;
