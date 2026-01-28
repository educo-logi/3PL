import React from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RefundPolicy = () => {
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
                    <div className="bg-red-600 px-8 py-6">
                        <h1 className="text-3xl font-bold text-white flex items-center">
                            <RefreshCw className="w-8 h-8 mr-3" />
                            환불정책
                        </h1>
                        <p className="text-red-100 mt-2">
                            유료 서비스 이용에 대한 취소 및 환불 규정입니다.
                        </p>
                    </div>

                    <div className="p-8 space-y-8">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <CheckCircle className="w-5 h-5 text-red-600 mr-2" />
                                제1조 (환불 원칙)
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                3PL 매칭 플랫폼은 "전자상거래 등에서의 소비자보호에 관한 법률" 등 관련 법령을 준수합니다. 회원이 유료 서비스를 결제한 후 서비스를 전혀 이용하지 않은 경우, 결제일로부터 7일 이내에 청약 철회(전액 환불)가 가능합니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                                제2조 (환불 불가 사유)
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-2">
                                다음의 경우에는 환불이 제한될 수 있습니다.
                            </p>
                            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4">
                                <li>이용권(열람권)을 사용하여 이미 물류 정보를 열람한 경우</li>
                                <li>제공된 서비스(매칭 등)가 이미 완료된 경우</li>
                                <li>회원의 단순 변심으로 인한 경우 (서비스 이용 개시 후)</li>
                                <li>회원의 귀책사유로 계정이 정지되거나 해지된 경우</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제3조 (환불 절차)</h2>
                            <p className="text-gray-600 leading-relaxed">
                                1. 환불을 원하는 회원은 고객센터 또는 문의하기 게시판을 통해 환불 요청을 접수해야 합니다.<br />
                                2. 회사는 접수된 내용을 확인한 후, 환불 규정에 부합하는 경우 3영업일 이내에 환불 처리를 진행합니다.<br />
                                3. 결제 수단에 따라 실제 환불 금액이 입금되기까지 시일이 소요될 수 있습니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제4조 (서비스 중도 해지)</h2>
                            <p className="text-gray-600 leading-relaxed">
                                정기 구독형 서비스의 경우, 중도 해지 시 해지일이 속한 달의 요금은 일할 계산하여 차감하거나 환불되지 않으며, 다음 결제일부터 청구가 중단됩니다. (구체적인 내용은 서비스별 상세 안내를 따릅니다.)
                            </p>
                        </section>

                        <div className="border-t pt-8 mt-8">
                            <div className="flex items-start text-sm text-gray-500">
                                <HelpCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                                <p>
                                    환불과 관련하여 궁금한 점이 있으시면 언제든지 고객센터로 문의해 주시기 바랍니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicy;
