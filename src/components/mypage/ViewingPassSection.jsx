import React, { useEffect, useState } from 'react';
import { CreditCard, Eye, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRemainingDays } from '../../utils/viewingPassUtils';
import { supabase } from '../../utils/supabaseClient';

const ViewingPassSection = ({ viewingPassInfo, usageHistory, onRefresh }) => {
    const navigate = useNavigate();
    const [displayHistory, setDisplayHistory] = useState([]);

    useEffect(() => {
        const correctNames = async () => {
            if (!usageHistory || usageHistory.length === 0) {
                setDisplayHistory([]);
                return;
            }

            // 비동기로 이름 보정
            const updated = await Promise.all(usageHistory.map(async (item) => {
                // 이미 이름이 정상이면 스킵 (한글 포함 등)
                // UUID 패턴(36자)과 유사한 길이의 영문+숫자 조합인 경우만 체크
                const isSuspiciousName = (item.itemName.startsWith('warehouse-') || item.itemName.startsWith('customer-')) && item.itemName.length > 30;

                if (isSuspiciousName) {
                    try {
                        const table = item.itemType === 'warehouse' ? 'warehouses' : 'customers';
                        const { data } = await supabase
                            .from(table)
                            .select('company_name')
                            .eq('id', item.itemId)
                            .maybeSingle();

                        if (data && data.company_name) {
                            return { ...item, itemName: data.company_name };
                        }
                    } catch (e) {
                        console.warn('업체명 조회 실패:', item.itemId);
                    }
                }
                return item;
            }));

            setDisplayHistory(updated);
        };

        correctNames();
    }, [usageHistory]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
                <CreditCard className="w-5 h-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">열람권 정보</h3>
            </div>

            {viewingPassInfo ? (
                <>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">보유 중</span>
                            <span className="text-2xl font-bold text-primary-600">
                                {viewingPassInfo.remaining_count ?? viewingPassInfo.remainingCount}회
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">유효기간</span>
                            <span className="font-semibold text-gray-900">
                                {viewingPassInfo.expires_at
                                    ? new Date(viewingPassInfo.expires_at).toLocaleDateString('ko-KR')
                                    : new Date(viewingPassInfo.expiryDate).toLocaleDateString('ko-KR')}까지
                            </span>
                        </div>
                        {getRemainingDays(viewingPassInfo) > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                                (약 {Math.ceil(getRemainingDays(viewingPassInfo) / 30)}개월 {getRemainingDays(viewingPassInfo) % 30}일 남음)
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate('/payment')}
                        className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center mb-3"
                    >
                        <CreditCard className="w-4 h-4 mr-2" />
                        열람권 구매하기
                    </button>

                    <button
                        onClick={() => navigate('/premium-apply')}
                        className="w-full bg-secondary-500 text-white py-2 px-4 rounded-lg hover:bg-secondary-600 transition-colors flex items-center justify-center mb-4"
                    >
                        <Star className="w-4 h-4 mr-2" />
                        프리미엄 신청하기
                    </button>

                    {/* 사용 내역 미니 뷰 */}
                    {displayHistory.length > 0 && (
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                최근 사용 내역
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {displayHistory.slice(0, 5).map((item, index) => (
                                    <div key={index} className="text-xs text-gray-600 border-b pb-2 last:border-0">
                                        <div className="flex justify-between">
                                            <span>{new Date(item.date).toLocaleDateString('ko-KR')}</span>
                                            <span className="text-gray-400">{item.countUsed}회</span>
                                        </div>
                                        <div className="text-gray-700 font-medium mt-1">
                                            {item.itemName} ({item.itemType === 'warehouse' ? '창고' : '고객사'})
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">보유 중인 열람권이 없습니다.</p>
                    <button
                        onClick={() => navigate('/payment')}
                        className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
                    >
                        <CreditCard className="w-4 h-4 mr-2" />
                        열람권 구매하기
                    </button>
                </div>
            )}
        </div>
    );
};

export default ViewingPassSection;
