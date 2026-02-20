import React from 'react';
import { ArrowLeft, Lock, Eye, FileText, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

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

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gray-800 px-8 py-6">
                        <h1 className="text-3xl font-bold text-white flex items-center">
                            <Lock className="w-8 h-8 mr-3" />
                            개인정보처리방침
                        </h1>
                        <p className="text-gray-300 mt-2">
                            회원의 소중한 정보를 안전하게 보호하기 위한 처리방침입니다.
                        </p>
                    </div>

                    <div className="p-8 space-y-8">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Shield className="w-5 h-5 text-gray-800 mr-2" />
                                제1조 (목적)
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                (주)동화세상에듀코(이하 "회사"라 함)는 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련 법령을 준수하며, 회원의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Eye className="w-5 h-5 text-gray-800 mr-2" />
                                제2조 (수집하는 개인정보의 항목)
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-2">
                                회사는 회원가입, 상담, 서비스 신청 및 결제 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.
                            </p>
                            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4">
                                <li><strong>창고업체 회원:</strong> 회사명, 대표자명, 사업자등록번호, 주소, 연락처, 이메일, 창고 정보 등</li>
                                <li><strong>고객사 회원:</strong> 회사명, 담당자명, 연락처, 이메일, 물류 관련 정보 등</li>
                                <li><strong>서비스 이용 과정:</strong> 접속 로그, 쿠키, 접속 IP 정보, 이용 내역 등</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제3조 (개인정보의 수집 및 이용목적)</h2>
                            <p className="text-gray-600 leading-relaxed">
                                회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.<br />
                                1. 회원 관리: 회원제 서비스 이용에 따른 본인 확인, 개인 식별, 가입 의사 확인, 불량 회원의 부정 이용 방지<br />
                                2. 서비스 제공: 3PL 매칭 서비스 제공, 계약서 및 청구서 발송, 요금 정산<br />
                                3. 마케팅 및 광고: 신규 서비스 개발, 이벤트 정보 및 광고성 정보 제공
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제4조 (개인정보의 보유 및 이용기간)</h2>
                            <p className="text-gray-600 leading-relaxed">
                                회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.<br />
                                - 회원 탈퇴 시까지 (단, 관계 법령에 위반되거나 수사협조 등이 필요한 경우 해당 사유 종료 시까지)
                            </p>
                        </section>

                        <div className="border-t pt-8 mt-8 text-center text-sm text-gray-400">
                            <p>본 방침은 (주)동화세상에듀코의 서비스 운영 정책을 따릅니다.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
