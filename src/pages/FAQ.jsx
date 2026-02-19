import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 bg-white flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
                <span className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-primary-600 font-bold mr-3">Q.</span>
                    {question}
                </span>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </button>
            {isOpen && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line pl-8">
                        <span className="text-primary-600 font-bold mr-2 -ml-6">A.</span>
                        {answer}
                    </div>
                </div>
            )}
        </div>
    );
};

const FAQCategory = ({ title, items }) => (
    <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2 border-gray-200">
            {title}
        </h2>
        <div>
            {items.map((item, index) => (
                <FAQItem key={index} question={item.q} answer={item.a} />
            ))}
        </div>
    </div>
);

const FAQ = () => {
    const navigate = useNavigate();

    const faqData = [
        {
            category: "1. 서비스 일반",
            items: [
                {
                    q: "3PL 플랫폼은 어떤 서비스인가요?",
                    a: "판매자(화주사)와 물류 전문가(창고)를 연결해주는 물류 대행 매칭 플랫폼입니다. 누구나 쉽게 원하는 조건의 창고를 찾거나, 내 창고를 홍보하여 고객을 유치할 수 있습니다."
                },
                {
                    q: "서비스 이용료는 얼마인가요?",
                    a: "기본적으로 창고 검색과 고객사 찾기 기능은 무료로 제공됩니다. 다만, 프리미엄 노출 등 일부 부가 서비스는 유료로 운영될 수 있습니다."
                },
                {
                    q: "회원가입을 해야만 이용할 수 있나요?",
                    a: "창고 및 고객사 정보를 둘러보는 것은 비회원도 가능하지만, 상세 정보 확인, 견적 요청, 매물 등록을 위해서는 회원가입이 필요합니다."
                }
            ]
        },
        {
            category: "2. 화주사 (물류를 맡기는 고객)",
            items: [
                {
                    q: "내 상품에 맞는 창고를 어떻게 찾나요?",
                    a: "상단 메뉴의 [창고 찾기]에서 지역, 보관 온도(상온/냉장/냉동), 평수 등의 조건을 설정하여 검색하면, 우리 회사 제품에 딱 맞는 물류센터 리스트를 확인할 수 있습니다."
                },
                {
                    q: "견적은 어떻게 받을 수 있나요?",
                    a: "마음에 드는 창고 상세 페이지에서 담당자 연락처를 확인하여 직접 문의하거나, [고객사 등록]을 통해 내 물류 조건을 올리면 창고주들로부터 제안을 받을 수 있습니다."
                },
                {
                    q: "계약은 플랫폼을 통해 이루어지나요?",
                    a: "아니요, 저희 플랫폼은 통신판매중개자로서 화주사와 창고주를 연결해 드리는 역할만 수행합니다. 실제 계약 체결 및 물류 대행 업무는 당사자 간의 직접 계약으로 진행됩니다."
                }
            ]
        },
        {
            category: "3. 창고주 (물류 서비스를 제공하는 기업)",
            items: [
                {
                    q: "창고 등록은 어떻게 하나요?",
                    a: "회원가입 후 [창고 등록] 메뉴에서 회사 정보, 창고 위치, 보관 및 작업 설비 사진 등을 입력하여 신청하시면 관리자 심사 후 등록됩니다."
                },
                {
                    q: "등록 심사는 얼마나 걸리나요?",
                    a: "영업일 기준 1~3일 이내에 심사가 완료되며, 승인 시 즉시 플랫폼에 노출됩니다. 추가 확인이 필요한 경우 별도 연락을 드릴 수 있습니다."
                },
                {
                    q: "더 많은 고객에게 내 창고를 알리고 싶어요.",
                    a: "[마이페이지 > 프리미엄 신청]을 통해 프리미엄 멤버십을 이용하시면, 검색 목록 상단 노출 및 강조 효과를 통해 홍보 효과를 높일 수 있습니다."
                }
            ]
        },
        {
            category: "4. 계정 및 기타",
            items: [
                {
                    q: "아이디/비밀번호를 잊어버렸어요.",
                    a: "로그인 화면의 [아이디/비밀번호 찾기] 기능을 이용해 주세요. 가입 시 등록한 이메일이나 휴대폰 번호로 정보를 찾을 수 있습니다."
                },
                {
                    q: "회원 탈퇴는 어떻게 하나요?",
                    a: "[마이페이지 > 회원 정보 수정] 하단의 탈퇴 버튼을 통해 가능합니다. 단, 거래 중이거나 미해결된 요청이 있는 경우 탈퇴가 제한될 수 있습니다."
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    돌아가기
                </button>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-primary-600 px-8 py-10 text-center">
                        <h1 className="text-3xl font-bold text-white flex items-center justify-center mb-4">
                            <HelpCircle className="w-10 h-10 mr-3 opacity-90" />
                            자주 묻는 질문 (FAQ)
                        </h1>
                        <p className="text-primary-100 text-lg max-w-2xl mx-auto">
                            3PL 플랫폼 이용 중 궁금하신 점을 빠르게 해결해 드립니다.
                            <br className="hidden sm:block" />
                            원하시는 내용을 찾지 못하셨다면 [문의하기]를 이용해 주세요.
                        </p>
                    </div>

                    <div className="p-8 lg:p-12">
                        {faqData.map((category, index) => (
                            <FAQCategory
                                key={index}
                                title={category.category}
                                items={category.items}
                            />
                        ))}

                        <div className="mt-12 bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                아직 궁금한 점이 있으신가요?
                            </h3>
                            <p className="text-gray-600 mb-6">
                                고객센터로 문의주시면 친절하게 안내해 드리겠습니다.
                            </p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => navigate('/contact')}
                                    className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    1:1 문의하기
                                </button>
                                <button className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                                    고객센터 02-3668-0541
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
