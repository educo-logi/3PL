import React from 'react';

const UsageStats = ({ usageStatistics }) => {
    if (!usageStatistics || usageStatistics.totalUsed === 0) {
        return null;
    }

    const { itemTypeStats, monthlyUsage, totalUsed } = usageStatistics;

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8 lg:mt-0">
            <h3 className="text-lg font-bold text-gray-900 mb-6">사용 통계</h3>

            {/* 1. 유형별 사용량 */}
            <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">업체 유형별 조회</p>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">창고</span>
                            <span className="font-semibold">{itemTypeStats.warehouse}회</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div
                                className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                                style={{
                                    width: `${totalUsed > 0 ? (itemTypeStats.warehouse / totalUsed) * 100 : 0}%`
                                }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">고객사</span>
                            <span className="font-semibold">{itemTypeStats.customer}회</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div
                                className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                                style={{
                                    width: `${totalUsed > 0 ? (itemTypeStats.customer / totalUsed) * 100 : 0}%`
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. 월별 사용 추이 */}
            {monthlyUsage.length > 0 && (
                <div className="border-t pt-6">
                    <p className="text-sm font-medium text-gray-700 mb-4">월별 조회 추이</p>
                    <div className="flex items-end justify-between h-32 gap-2">
                        {monthlyUsage.map((month, index) => {
                            const maxCount = Math.max(...monthlyUsage.map(m => m.count), 1);
                            const height = Math.max((month.count / maxCount) * 100, 5); // 최소 높이 보장
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center group">
                                    <div className="relative w-full flex justify-end flex-col items-center h-full">
                                        <span className="text-[10px] text-gray-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4">
                                            {month.count}회
                                        </span>
                                        <div
                                            className="w-full bg-primary-200 hover:bg-primary-500 rounded-t transition-all duration-300"
                                            style={{ height: `${height}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[10px] text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                                        {month.month.split('-')[1]}월
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsageStats;
