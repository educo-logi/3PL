import React, { useState } from 'react';
import { User, Edit, Save, X, LogOut } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { regions, detailedRegions, dongData } from '../../data/sampleData';

const UserInfoCard = ({ currentUser, isWarehouse, onUpdate, onLogout }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(false);

    const startEdit = () => {
        setEditData({ ...currentUser });
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setEditData({});
        setIsEditing(false);
    };

    const handleInputChange = (field, value) => {
        setEditData(prev => {
            const newData = { ...prev, [field]: value };

            if (field === 'location') {
                newData.city = '';
                newData.dong = '';
            } else if (field === 'city') {
                newData.dong = '';
            }

            return newData;
        });
    };

    const saveEdit = async () => {
        try {
            setLoading(true);
            const { id, email, userType } = currentUser;

            // 1. Supabase Auth Metadata 업데이트 (기본 정보) -> Custom Auth에서는 무시하거나 에러 처리 안 함
            // const { error: authError } = await supabase.auth.updateUser({ ... });

            // 2. 테이블 데이터 업데이트
            const table = userType === 'warehouse' ? 'warehouses' : 'customers';

            // 업데이트할 필드 선별
            const updatePayload = {
                company_name: editData.companyName,
                representative: editData.representative,
                phone: editData.phone,
                location: editData.location,
                city: editData.city,
                dong: editData.dong,
                // 추가 정보
                business_number: editData.businessNumber,
                contact_person: editData.contactPerson,
                contact_phone: editData.contactPhone,
                updated_at: new Date().toISOString()
            };

            // 창고/고객사별 특수 필드
            if (userType === 'warehouse') {
                updatePayload.experience = editData.experience;
                updatePayload.land_area = editData.landArea;
                updatePayload.total_area = editData.totalArea;
                // ... 필요한 필드 추가
            }

            // owner_id가 아닌 id(PK)로 업데이트해야 함 (Custom Auth)
             const { error: dbError } = await supabase
                .from(table)
                .update(updatePayload)
                .eq('id', id);

            if (dbError) {
                console.error('DB Update Error:', dbError);
                throw dbError; // 에러 발생 시 진행 중단
            }

            // 3. 로컬 스토리지 업데이트 (하위 호환성 및 오프라인 대비)
            const currentLocal = JSON.parse(localStorage.getItem('currentUser') || '{}');
            localStorage.setItem('currentUser', JSON.stringify({ ...currentLocal, ...editData }));

            alert('정보가 수정되었습니다.');
            setIsEditing(false);
            if (onUpdate) onUpdate();

        } catch (error) {
            console.error('Update failed:', error);
            alert('정보 수정 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-white" />
                </div>

                {isEditing ? (
                    <div className="mb-4 space-y-2">
                        <input
                            type="text"
                            value={editData.companyName || ''}
                            onChange={(e) => handleInputChange('companyName', e.target.value)}
                            className="w-full px-3 py-2 border rounded text-center font-bold text-gray-900"
                            placeholder="회사명"
                        />
                        <div className="flex justify-center gap-2">
                            <select
                                value={editData.location || ''}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                className="px-2 py-1 border rounded text-sm"
                            >
                                <option value="">지역</option>
                                {regions.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {currentUser.companyName || '회사명 없음'}
                        </h2>
                        <p className="text-gray-600 mb-4">
                            {isWarehouse ? '창고업체' : '고객사'} | {currentUser.location || '지역 미설정'}
                        </p>
                    </>
                )}

                <div className="space-y-2">
                    {isEditing ? (
                        <div className="flex space-x-2">
                            <button
                                onClick={cancelEdit}
                                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                                disabled={loading}
                            >
                                <X className="w-4 h-4 mr-2" />
                                취소
                            </button>
                            <button
                                onClick={saveEdit}
                                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
                                disabled={loading}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                저장
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={startEdit}
                                className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                프로필 수정
                            </button>
                            <button
                                onClick={onLogout}
                                className="w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                로그아웃
                            </button>
                        </>
                    )}
                </div>

                {/* 상세 정보 에디터 (수정 모드일 때만 확장 표시) */}
                {isEditing && (
                    <div className="mt-6 text-left border-t pt-4">
                        <h3 className="font-semibold mb-3">상세 정보 수정</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="text-xs text-gray-500">사업자번호</label>
                                <input
                                    type="text"
                                    value={editData.businessNumber || ''}
                                    onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                                    className="w-full border rounded px-2 py-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">대표자명</label>
                                <input
                                    type="text"
                                    value={editData.representative || ''}
                                    onChange={(e) => handleInputChange('representative', e.target.value)}
                                    className="w-full border rounded px-2 py-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">전화번호</label>
                                <input
                                    type="text"
                                    value={editData.phone || ''}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className="w-full border rounded px-2 py-1"
                                />
                            </div>
                            {/* 담당자 정보는 필요 시 추가 */}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserInfoCard;
