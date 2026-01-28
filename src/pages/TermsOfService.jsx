import React from 'react';
import { ArrowLeft, Shield, FileText, Scale, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
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
                    <div className="bg-primary-600 px-8 py-6">
                        <h1 className="text-3xl font-bold text-white flex items-center">
                            <FileText className="w-8 h-8 mr-3" />
                            이용약관
                        </h1>
                        <p className="text-primary-100 mt-2">
                            서비스 이용을 위한 약관입니다. 본 약관은 법적 효력을 갖습니다.
                        </p>
                    </div>

                    <div className="p-8 space-y-8">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Shield className="w-5 h-5 text-primary-600 mr-2" />
                                제1조 (목적)
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                본 약관은 3PL 매칭 플랫폼(이하 "회사"라 함)이 제공하는 물류 매칭 서비스 및 관련 제반 서비스(이하 "서비스"라 함)의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Scale className="w-5 h-5 text-primary-600 mr-2" />
                                제2조 (용어의 정의)
                            </h2>
                            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
                                <li>
                                    <strong>"서비스"</strong>라 함은 구현되는 단말기(PC, 휴대형단말기 등의 각종 유무선 장치를 포함)와 상관없이 "회원"이 이용할 수 있는 3PL 매칭 및 관련 제반 서비스를 의미합니다.
                                </li>
                                <li>
                                    <strong>"회원"</strong>이라 함은 회사의 "서비스"에 접속하여 본 약관에 따라 "회사"와 이용계약을 체결하고 "회사"가 제공하는 "서비스"를 이용하는 고객을 말합니다.
                                </li>
                                <li>
                                    <strong>"창고업체"</strong>라 함은 "서비스"를 통해 자신의 물류 창고 및 서비스를 홍보하고 위탁을 받고자 하는 회원을 의미합니다.
                                </li>
                                <li>
                                    <strong>"고객사"</strong>라 함은 "서비스"를 통해 물류 위탁 업무를 수행할 창고업체를 찾고자 하는 회원을 의미합니다.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제3조 (약관의 게시와 개정)</h2>
                            <p className="text-gray-600 leading-relaxed">
                                1. "회사"는 본 약관의 내용을 "회원"이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.<br />
                                2. "회사"는 "약관의 규제에 관한 법률", "정보통신망 이용촉진 및 정보보호 등에 관한 법률" 등 관련법을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.<br />
                                3. "회사"가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 제1항의 방식에 따라 적용일자 7일 전부터 공지합니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제4조 (서비스의 제공)</h2>
                            <p className="text-gray-600 leading-relaxed">
                                회사가 제공하는 서비스의 내용은 다음과 같습니다.<br />
                                1. 물류 창고 정보 제공 및 검색 서비스<br />
                                2. 창고업체와 고객사 간의 매칭 지원 서비스<br />
                                3. 물류 견적 비교 서비스<br />
                                4. 기타 "회사"가 추가 개발하거나 다른 회사와의 제휴 등을 통해 "회원"에게 제공하는 일체의 서비스
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제5조 (매칭 및 계약의 성립)</h2>
                            <p className="text-gray-600 leading-relaxed">
                                1. "회사"는 "창고업체"와 "고객사" 간의 거래를 중개하는 플랫폼만을 제공하며, 거래 당사자 간의 계약 체결에 직접 관여하지 않습니다.<br />
                                2. "창고업체"와 "고객사" 간에 체결된 물류 위탁 계약에 대한 모든 책임은 거래 당사자에게 있으며, "회사"는 이에 대해 어떠한 책임도 지지 않습니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제6조 (책임의 제한)</h2>
                            <div className="bg-gray-50 border-l-4 border-gray-300 p-4 text-gray-600 text-sm">
                                <p>
                                    1. "회사"는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.<br />
                                    2. "회사"는 "회원"의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.<br />
                                    3. "회사"는 "회원"이 서비스와 관련하여 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.<br />
                                    4. "회사"는 회원 간 또는 회원과 제3자 상호간에 서비스를 매개로 하여 거래 등을 한 경우에는 책임이 면제됩니다.
                                </p>
                            </div>
                        </section>

                        <div className="border-t pt-8 mt-8">
                            <div className="flex items-start text-sm text-gray-500">
                                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 text-red-500" />
                                <p>
                                    본 약관은 표준 약관의 예시이며, 실제 운영 시에는 반드시 법률 전문가의 검토를 거쳐 사업의 특성에 맞게 수정 및 보완하여 사용하여야 합니다. "회사"는 본 예시 약관의 사용으로 인해 발생하는 법적 문제에 대해 책임지지 않습니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
