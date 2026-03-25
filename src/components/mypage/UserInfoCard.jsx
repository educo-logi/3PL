import React, { useState } from 'react';
import { User, Edit, Save, X, LogOut } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { regions } from '../../data/sampleData';

const UserInfoCard = ({ currentUser, isWarehouse, onEdit, onLogout }) => {
    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {currentUser.companyName || currentUser.company_name || '회사명 없음'}
                </h2>
                <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-sm">
                        {isWarehouse ? '창고업체' : '고객사'}
                    </span>
                    <span>|</span>
                    <span>{currentUser.location || '지역 미설정'} {currentUser.city}</span>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={onLogout}
                        className="w-full bg-gray-50 text-gray-500 py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center text-sm"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        로그아웃
                    </button>
                </div>

                {/* 간단 정보 요약 */}
                <div className="mt-6 pt-6 border-t text-left space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">대표자</span>
                        <span className="font-medium text-gray-900">{currentUser.representative}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">연락처</span>
                        <span className="font-medium text-gray-900">{currentUser.phone}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">이메일</span>
                        <span className="font-medium text-gray-900 truncate max-w-[150px]">{currentUser.email}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserInfoCard;
