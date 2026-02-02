import React, { useEffect } from 'react';
import { User, Phone, Mail, Package, BarChart3, Box, Activity, Layers } from 'lucide-react';

const DesignMockup = () => {

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">마이페이지</h1>
                        <p className="text-gray-500 mt-1">기업 정보를 한눈에 확인하세요</p>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
                        정보 수정
                    </button>
                </div>

                {/* Section 1: Basic Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Card 1: Representative */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition duration-200">
                        <div className="w-14 h-14 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <User className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">대표자명</p>
                            <p className="text-xl font-bold text-gray-800">홍길동</p>
                        </div>
                    </div>

                    {/* Card 2: Phone */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition duration-200">
                        <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                            <Phone className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">대표 전화</p>
                            <p className="text-xl font-bold text-gray-800">010-1234-5678</p>
                        </div>
                    </div>

                    {/* Card 3: Email */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition duration-200">
                        <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                            <Mail className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">이메일</p>
                            <p className="text-xl font-bold text-gray-800">test@example.com</p>
                        </div>
                    </div>

                    {/* Card 4: Products */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition duration-200">
                        <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                            <Package className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">취급 품목</p>
                            <p className="text-xl font-bold text-gray-800">전자제품, 의류</p>
                        </div>
                    </div>

                </div>

                {/* Section 2: Logistics Requirements (Dashed Border Style) */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                        물류 요구 사항
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Stat 1 */}
                        <div className="border-2 border-dashed border-gray-200 p-8 rounded-2xl flex flex-col items-center justify-center text-center hover:border-blue-300 hover:bg-blue-50 transition duration-200 group cursor-default">
                            <div className="p-3 bg-gray-50 rounded-full mb-4 group-hover:bg-white transition">
                                <Box className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition" />
                            </div>
                            <p className="text-gray-500 text-sm mb-1">필요 면적</p>
                            <p className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition">150 py</p>
                        </div>

                        {/* Stat 2 */}
                        <div className="border-2 border-dashed border-gray-200 p-8 rounded-2xl flex flex-col items-center justify-center text-center hover:border-purple-300 hover:bg-purple-50 transition duration-200 group cursor-default">
                            <div className="p-3 bg-gray-50 rounded-full mb-4 group-hover:bg-white transition">
                                <Activity className="w-8 h-8 text-gray-400 group-hover:text-purple-600 transition" />
                            </div>
                            <p className="text-gray-500 text-sm mb-1">월 평균 출고량</p>
                            <p className="text-2xl font-bold text-gray-800 group-hover:text-purple-600 transition">5,000 건</p>
                        </div>

                        {/* Stat 3 */}
                        <div className="border-2 border-dashed border-gray-200 p-8 rounded-2xl flex flex-col items-center justify-center text-center hover:border-orange-300 hover:bg-orange-50 transition duration-200 group cursor-default">
                            <div className="p-3 bg-gray-50 rounded-full mb-4 group-hover:bg-white transition">
                                <Layers className="w-8 h-8 text-gray-400 group-hover:text-orange-600 transition" />
                            </div>
                            <p className="text-gray-500 text-sm mb-1">보관 파렛트</p>
                            <p className="text-2xl font-bold text-gray-800 group-hover:text-orange-600 transition">300 PLT</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DesignMockup;
