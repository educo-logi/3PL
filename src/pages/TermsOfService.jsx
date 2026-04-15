import React from 'react';
import { ArrowLeft, Shield, FileText, Scale, AlertCircle, Info } from 'lucide-react';
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

                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                    <div className="bg-primary-600 px-8 py-10 text-center">
                        <FileText className="w-12 h-12 text-white mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-white">이용약관</h1>
                        <p className="text-primary-100 mt-2 max-w-2xl mx-auto">
                            33PL 플랫폼 서비스를 이용해 주셔서 감사합니다. 본 약관은 서비스 이용과 관련한 회사와 회원 간의 권리와 의무를 규정합니다.
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">
                        {/* 주요 고지 사항 */}
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                            <div className="flex">
                                <Info className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0" />
                                <div>
                                    <h3 className="text-blue-800 font-bold mb-2">필독: 서비스 성격 및 책임 안내</h3>
                                    <p className="text-blue-700 text-sm leading-relaxed">
                                        본 플랫폼은 창고업체와 고객사가 서로의 정보를 확인하고 연결될 수 있는 <strong>'거래의 장'</strong>을 제공하는 중개 서비스입니다. 회사는 실제 계약 체결 과정에 관여하지 않으며, 회원 간에 체결된 계약 및 그 이행 과정에서 발생하는 어떠한 문제에 대해서도 법적 책임을 지지 않습니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Shield className="w-5 h-5 text-primary-600 mr-2" />
                                제1조 (목적)
                            </h2>
                            <p className="text-gray-600 leading-relaxed text-sm lg:text-base">
                                본 약관은 (주)동화세상에듀코(이하 "회사"라 함)가 운영하는 33PL 플랫폼(이하 "플랫폼" 또는 "서비스"라 함)에서 제공하는 물류 정보 매칭 서비스 및 제반 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Scale className="w-5 h-5 text-primary-600 mr-2" />
                                제2조 (용어의 정의)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="font-bold text-gray-800 mb-1">회원</p>
                                    <p className="text-gray-600 text-sm">회사와 이용계약을 체결하고 서비스를 이용하는 고객 전체</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="font-bold text-gray-800 mb-1">창고업체</p>
                                    <p className="text-gray-600 text-sm">보유 창고 정보를 등록하여 마케팅 및 매칭을 받고자 하는 회원</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="font-bold text-gray-800 mb-1">고객사(화주)</p>
                                    <p className="text-gray-600 text-sm">물류 위탁을 위해 적합한 창고를 탐색하고 견적을 요청하는 회원</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="font-bold text-gray-800 mb-1">열람권</p>
                                    <p className="text-gray-600 text-sm">상대방의 상세 연락처 및 핵심 정보를 확인하기 위해 사용되는 유료 서비스</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제3조 (약관의 게시와 개정)</h2>
                            <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                                <p>1. "회사"는 본 약관의 내용을 "회원"이 쉽게 알 수 있도록 서비스 초기 화면이나 연결 화면에 게시합니다.</p>
                                <p>2. "회사"는 "약관의 규제에 관한 법률", "정보통신망법" 등 관련법을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>
                                <p>3. 약관 개정 시 적용일자 7일 전(중요한 변경의 경우 30일 전)부터 공지하며, 공지 기간 내 거부 의사를 표시하지 않으면 동의한 것으로 간주합니다.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 font-bold text-red-600 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                제4조 (중개 서비스의 성격 및 책임의 한계)
                            </h2>
                            <div className="bg-red-50 border border-red-100 p-6 rounded-lg text-gray-800 text-sm space-y-3">
                                <p>1. 회사가 운영하는 플랫폼은 회원 상호 간의 물류 거래를 위한 <strong>정보 제공 및 중개 시스템만</strong>을 운영하고 관리합니다.</p>
                                <p>2. 회사는 개별 창고업체가 등록한 정보의 정확성이나 신뢰성을 보증하지 않으며, 실제 계약 체결 여부를 강제하거나 확인하지 않습니다.</p>
                                <p>3. 창고업체와 고객사 간의 상담, 견적 비교, 계약 체결 및 사후 관리는 <strong>거래 당사자의 전적인 책임</strong>하에 이루어지며, 회사는 거래 과정에서 발생하는 분쟁, 손해, 계약 불이행에 대해 일체의 책임을 지지 않습니다.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제5조 (이용 요금 및 결제)</h2>
                            <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                                <p>1. 플랫폼의 기본 정보 탐색은 무료로 제공됩니다.</p>
                                <p>2. 상대방의 상세 연락처 확인 등 특정 정보를 열람하기 위해서는 <strong>'열람권' 구입(결제)</strong>이 필요할 수 있습니다.</p>
                                <p>3. **매칭 수수료 면제**: 회사는 창고업체와 고객사 간의 매칭이 성공적으로 완료되더라도 별도의 성사 수수료나 멤버십 비용을 추가로 청구하지 않습니다.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제6조 (취소 및 환불)</h2>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                구매한 '열람권' 등의 유료 서비스에 대한 취소 및 환불은 회사가 별도로 고지하는 <strong>[환불정책]</strong>에 따릅니다. 디지털 콘텐츠의 특성상 정보 열람이 이미 이루어진 경우 환불이 제한될 수 있습니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제7조 (회원의 의무 및 금지사항)</h2>
                            <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                                <p>1. 회원은 등록하는 모든 정보가 최신의 정확한 정보가 되도록 관리해야 합니다.</p>
                                <p>2. 타인의 정보를 도용하거나 허위 사실을 기재하여 타인에게 손해를 입혀서는 안 됩니다.</p>
                                <p>3. 플랫폼을 통해 얻은 상대방의 정보를 당사자의 동의 없이 제3자에게 누설하거나 목적 외 용도로 사용하여서는 안 됩니다.</p>
                                <p>4. 회사의 명예를 훼손하거나 서비스 운영을 방해하는 행위를 금지합니다.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제8조 (계약의 해지 및 이용 제한)</h2>
                            <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                                <p>1. 회원은 언제든지 서비스 내 설정 메뉴를 통해 회원 탈퇴(계약 해지)를 신청할 수 있습니다.</p>
                                <p>2. 회사는 회원이 본 약관의 의무를 위반하거나 운영 정책에 위배되는 행위를 할 경우, 경고/일시 정지/영구 이용 정지 등의 조치를 취할 수 있습니다.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제9조 (개인정보 보호)</h2>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                회사는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력하며, 개인정보의 보호 및 이용에 대해서는 별도로 고지하는 <strong>[개인정보처리방침]</strong>을 적용합니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제10조 (준거법 및 관할법원)</h2>
                            <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                                <p>1. 회사와 회원 간에 제기된 소송은 대한민국법을 준거법으로 합니다.</p>
                                <p>2. 서비스 이용과 관련하여 분쟁이 발생할 경우, 회사의 본사 소재지를 관할하는 법원을 전용 관할 법원으로 합니다.</p>
                            </div>
                        </section>

                        <div className="border-t pt-8 mt-12 text-center">
                            <p className="text-gray-500 font-medium">시행 일자: 2024년 04월 01일</p>
                            <p className="text-gray-400 text-xs mt-2">© (주)동화세상에듀코 All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
