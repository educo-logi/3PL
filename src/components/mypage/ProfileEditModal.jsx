import React, { useState, useEffect } from 'react';
import { X, Save, Building2, User } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { regions, detailedRegions, dongData, productTypes, storageTypes, deliveryCompanies, solutions } from '../../data/sampleData';
import { hashPassword } from '../../utils/passwordHash';

const ProfileEditModal = ({ isOpen, onClose, currentUser, onUpdate }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic'); // basic, detail

    useEffect(() => {
        if (isOpen && currentUser) {
            // 초기 데이터 세팅 (없는 필드는 빈 문자열/배열로 초기화)
            setFormData({
                ...currentUser,
                // 배열 필드 초기화 (null 방지)
                storage_types: currentUser.storage_types || [],
                delivery_companies: currentUser.delivery_companies || [],
                solutions: currentUser.solutions || [],
                products: currentUser.products || [],
                desired_delivery: currentUser.desired_delivery || [],

                // 숫자 필드 문자열 변환 (input 호환)
                total_area: currentUser.total_area || '',
                warehouse_area: currentUser.warehouse_area || '',
                available_area: currentUser.available_area || '',
                pallet_count: currentUser.pallet_count || '',
                experience: currentUser.experience || '',
                required_area: currentUser.required_area || '',
                monthly_volume: currentUser.monthly_volume || '',
                detail_address: currentUser.detail_address || '', // 상세 주소 추가

                // 비밀번호 필드는 비워둠
                password: ''
            });
        }
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    const isWarehouse = currentUser?.userType === 'warehouse';

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // 지역 변경 시 하위 주소 초기화
            ...(name === 'location' && { city: '', dong: '' }),
            ...(name === 'city' && { dong: '' })
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

            // 업데이트할 데이터 구성
            const updateData = { ...formData };

            // 불필요한 필드 제거 및 포맷팅
            delete updateData.id;
            delete updateData.created_at;
            delete updateData.viewing_count; // 등등 읽기 전용 필드

            // 비밀번호 처리: 입력이 있을 때만 해싱하여 업데이트
            if (updateData.password && updateData.password.trim() !== '') {
                updateData.password = hashPassword(updateData.password);
            } else {
                delete updateData.password;
            }

            // 숫자형 필드 변환
            const numFields = ['total_area', 'warehouse_area', 'available_area', 'pallet_count', 'experience', 'required_area', 'monthly_volume'];
            numFields.forEach(field => {
                if (updateData[field]) updateData[field] = parseFloat(updateData[field]);
            });

            // Supabase 업데이트 (owner_id가 아닌 id로)
            const { error } = await supabase
                .from(table)
                .update(updateData)
                .eq('id', currentUser.id);

            if (error) throw error;

            alert('정보가 성공적으로 수정되었습니다.');
            onUpdate(); // 부모 컴포넌트에 알림 (새로고침)
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
                {/* 헤더 */}
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

                {/* 탭 네비게이션 */}
                <div className="flex border-b px-6">
                    <button
                        className={`py-4 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'basic' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('basic')}
                    >
                        기본 정보
                    </button>
                    <button
                        className={`py-4 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'detail' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('detail')}
                    >
                        {isWarehouse ? '시설 및 운영 정보' : '물류 요구 사항'}
                    </button>
                </div>

                {/* 본문 (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-8">
                    <form id="editForm" onSubmit={handleSubmit} className="space-y-8">

                        {/* === 기본 정보 탭 === */}
                        {activeTab === 'basic' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* 회사명 / 대표자명 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">회사명 *</label>
                                        <input name="company_name" value={formData.company_name || ''} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">대표자명 *</label>
                                        <input name="representative" value={formData.representative || ''} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                                    </div>

                                    {/* 연락처 / 이메일 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">대표 전화번호 *</label>
                                        <input name="phone" value={formData.phone || ''} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">이메일 (아이디) *</label>
                                        <input name="email" value={formData.email || ''} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                                    </div>

                                    {/* 비밀번호 변경 */}
                                    <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 (변경 시에만 입력)</label>
                                        <input type="password" name="password" value={formData.password || ''} onChange={handleInputChange} placeholder="변경하지 않으려면 비워두세요" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                                    </div>

                                    {/* 주소 (지역/시/동) */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">사업장 주소 *</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <select name="location" value={formData.location || ''} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg">
                                                <option value="">지역 선택</option>
                                                {regions.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                            <select name="city" value={formData.city || ''} onChange={handleInputChange} disabled={!formData.location} required className="w-full px-3 py-2 border rounded-lg">
                                                <option value="">시/군/구 선택</option>
                                                {formData.location && detailedRegions[formData.location]?.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <select name="dong" value={formData.dong || ''} onChange={handleInputChange} disabled={!formData.city} required className="w-full px-3 py-2 border rounded-lg">
                                                <option value="">읍/면/동 선택</option>
                                                {formData.location && formData.city && dongData[formData.location]?.[formData.city]?.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div className="mt-3">
                                            <input name="detail_address" value={formData.detail_address || ''} onChange={handleInputChange} placeholder="상세 주소를 입력하세요 (선택)" className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === 상세 정보 (창고) === */}
                        {activeTab === 'detail' && isWarehouse && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* 면적 정보 */}
                                <div className="bg-gray-50 p-5 rounded-lg border">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center"><Building2 className="w-4 h-4 mr-2" /> 면적 및 규모</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">대지면적</label>
                                            <div className="flex">
                                                <input type="number" name="total_area" value={formData.total_area || ''} onChange={handleInputChange} className="flex-1 px-3 py-2 border rounded-l-lg" />
                                                <select name="total_area_unit" value={formData.total_area_unit || 'sqm'} onChange={(e) => handleAreaUnitChange('total_area_unit', e.target.value)} className="border-y border-r rounded-r-lg px-2 bg-gray-50">
                                                    <option value="sqm">㎡</option>
                                                    <option value="pyeong">평</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">창고 연면적</label>
                                            <div className="flex">
                                                <input type="number" name="warehouse_area" value={formData.warehouse_area || ''} onChange={handleInputChange} className="flex-1 px-3 py-2 border rounded-l-lg" />
                                                <select name="warehouse_area_unit" value={formData.warehouse_area_unit || 'sqm'} onChange={(e) => handleAreaUnitChange('warehouse_area_unit', e.target.value)} className="border-y border-r rounded-r-lg px-2 bg-gray-50">
                                                    <option value="sqm">㎡</option>
                                                    <option value="pyeong">평</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">계약 가능 면적</label>
                                            <div className="flex">
                                                <input type="number" name="available_area" value={formData.available_area || ''} onChange={handleInputChange} className="flex-1 px-3 py-2 border rounded-l-lg" />
                                                <select name="available_area_unit" value={formData.available_area_unit || 'sqm'} onChange={(e) => handleAreaUnitChange('available_area_unit', e.target.value)} className="border-y border-r rounded-r-lg px-2 bg-gray-50">
                                                    <option value="sqm">㎡</option>
                                                    <option value="pyeong">평</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">보유 파렛트 수</label>
                                            <input type="number" name="pallet_count" value={formData.pallet_count || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="PLT" />
                                        </div>
                                    </div>
                                </div>

                                {/* 취급 품목 및 보관 형태 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">보관 가능 형태</label>
                                    <div className="flex flex-wrap gap-2">
                                        {storageTypes.map(type => (
                                            <label key={type} className={`px-4 py-2 rounded-full text-sm cursor-pointer border transition-colors ${formData.storage_types?.includes(type) ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                                <input type="checkbox" className="hidden" checked={formData.storage_types?.includes(type)} onChange={() => handleCheckboxChange('storage_types', type)} />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">취급 가능 품목</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {productTypes.map(item => (
                                            <label key={item} className="flex items-center space-x-2 text-sm text-gray-700">
                                                <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" checked={formData.products?.includes(item)} onChange={() => handleCheckboxChange('products', item)} />
                                                <span>{item}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === 상세 정보 (고객사) === */}
                        {activeTab === 'detail' && !isWarehouse && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-gray-50 p-5 rounded-lg border">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center"><User className="w-4 h-4 mr-2" /> 물류 요구 사항</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">필요 면적</label>
                                            <div className="flex">
                                                <input type="number" name="required_area" value={formData.required_area || ''} onChange={handleInputChange} className="flex-1 px-3 py-2 border rounded-l-lg" />
                                                <select name="required_area_unit" value={formData.required_area_unit || 'sqm'} onChange={(e) => handleAreaUnitChange('required_area_unit', e.target.value)} className="border-y border-r rounded-r-lg px-2 bg-gray-50">
                                                    <option value="sqm">㎡</option>
                                                    <option value="pyeong">평</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">월 출고량</label>
                                            <input type="number" name="monthly_volume" value={formData.monthly_volume || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="건/월" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">보관 파렛트 수</label>
                                            <input type="number" name="pallet_count" value={formData.pallet_count || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="PLT" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">취급 품목</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {productTypes.map(item => (
                                            <label key={item} className="flex items-center space-x-2 text-sm text-gray-700">
                                                <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" checked={formData.products?.includes(item)} onChange={() => handleCheckboxChange('products', item)} />
                                                <span>{item}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* 푸터 (버튼) */}
                <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors">
                        취소
                    </button>
                    <button type="submit" form="editForm" disabled={loading} className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors flex items-center shadow-lg shadow-primary-600/30">
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                저장 중...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                변경사항 저장
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileEditModal;
