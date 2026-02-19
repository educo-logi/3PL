import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, HelpCircle, MessageCircle, BookOpen, Bell, Building2, Users, Phone, Mail } from 'lucide-react';

const Support = () => {
    const navigate = useNavigate();

    const menuItems = [
        {
            title: '자주 묻는 질문',
            desc: '궁금한 내용을 빠르게 찾아보세요',
            icon: HelpCircle,
            path: '/faq',
            color: 'bg-blue-100 text-blue-600'
        },
        {
            title: '1:1 문의하기',
            desc: '해결되지 않은 문제는 직접 문의하세요',
            icon: MessageCircle,
            path: '/contact',
            color: 'bg-green-100 text-green-600'
        },
        {
            title: '서비스 이용 가이드',
            desc: '3PL 플랫폼 100% 활용하기',
            icon: BookOpen,
            action: () => document.getElementById('guide-section').scrollIntoView({ behavior: 'smooth' }),
            color: 'bg-purple-100 text-purple-600'
        },
        {
            title: '공지사항',
            desc: '새로운 소식과 업데이트 (준비중)',
            icon: Bell,
            path: '#', // Placeholder
            color: 'bg-orange-100 text-orange-600'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-primary-900 text-white py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-4xl font-bold mb-6">
                        무엇을 도와드릴까요?
                    </h1>
                    <p className="text-primary-200 text-lg mb-8">
                        서비스 이용 중 궁금한 점이나 불편한 사항을 확인해보세요.
                    </p>

                    {/* Search Bar (Visual Only for MVP) */}
                    <div className="relative max-w-xl mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-4 bg-white rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xl transition-shadow"
                            placeholder="질문을 검색해보세요 (예: 이용료, 창고 등록)"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') navigate('/faq');
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Menu Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => item.path ? navigate(item.path) : item.action && item.action()}
                            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-left border border-gray-100 hover:-translate-y-1"
                        >
                            <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center mb-4`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                            <p className="text-gray-500 text-sm">{item.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Usage Guide Section */}
            <div id="guide-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">서비스 이용 가이드</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Warehouse Owner Guide */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Building2 className="w-32 h-32 text-blue-900" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-3">창고주</span>
                            창고 등록하고 고객 찾기
                        </h3>
                        <div className="space-y-6">
                            {[
                                { step: 1, title: '회원가입', desc: '이메일로 간편하게 가입하세요' },
                                { step: 2, title: '창고 정보 등록', desc: '위치, 면적, 사진 등 상세 정보를 입력합니다' },
                                { step: 3, title: '심사 및 승인', desc: '관리자 승인 후 플랫폼에 노출됩니다' },
                                { step: 4, title: '고객 매칭', desc: '화주사의 견적 요청을 받고 계약을 체결합니다' }
                            ].map((s, i) => (
                                <div key={i} className="flex relative items-start">
                                    {i !== 3 && <div className="absolute left-4 top-8 bottom-[-24px] w-0.5 bg-gray-100"></div>}
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold mr-4 z-10 text-sm">
                                        {s.step}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{s.title}</h4>
                                        <p className="text-sm text-gray-500">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => navigate('/warehouse-register')} className="mt-8 w-full py-3 border border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors">
                            창고 등록하기
                        </button>
                    </div>

                    {/* Customer Guide */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-green-200 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users className="w-32 h-32 text-green-900" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-3">화주사</span>
                            딱 맞는 물류센터 찾기
                        </h3>
                        <div className="space-y-6">
                            {[
                                { step: 1, title: '조건 검색', desc: '지역, 온도, 품목 등 원하는 조건을 설정하세요' },
                                { step: 2, title: '창고 비교', desc: '여러 창고의 상세 정보를 비교해보세요' },
                                { step: 3, title: '견적 요청', desc: '마음에 드는 창고에 견적을 문의하세요' },
                                { step: 4, title: '서비스 이용', desc: '최적의 파트너와 물류 대행을 시작합니다' }
                            ].map((s, i) => (
                                <div key={i} className="flex relative items-start">
                                    {i !== 3 && <div className="absolute left-4 top-8 bottom-[-24px] w-0.5 bg-gray-100"></div>}
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold mr-4 z-10 text-sm">
                                        {s.step}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{s.title}</h4>
                                        <p className="text-sm text-gray-500">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => navigate('/warehouse-search')} className="mt-8 w-full py-3 border border-green-600 text-green-600 font-bold rounded-lg hover:bg-green-50 transition-colors">
                            창고 찾으러 가기
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Contact Info Block */}
            <div className="bg-white py-12 border-t border-gray-200">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">아직 궁금한 점이 있으신가요?</h2>
                    <p className="text-gray-600 mb-8">고객센터는 평일 09:00 ~ 18:00 운영됩니다.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a href="mailto:dslee@educo.co.kr" className="flex items-center justify-center px-6 py-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200">
                            <Mail className="w-5 h-5 mr-2 text-gray-500" />
                            dslee@educo.co.kr
                        </a>
                        <a href="tel:0236680541" className="flex items-center justify-center px-6 py-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200">
                            <Phone className="w-5 h-5 mr-2 text-gray-500" />
                            02-3668-0541
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
