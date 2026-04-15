import React from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2, CreditCard } from 'lucide-react';
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

                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                    <div className="bg-teal-600 px-8 py-10 text-center text-white">
                        <RefreshCw className="w-12 h-12 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold">환불정책</h1>
                        <p className="text-teal-100 mt-2 max-w-2xl mx-auto">
                            (주)동화세상에듀코은 투명하고 공정한 유료 서비스 제공을 위해 아래와 같은 환불 정책을 운영하고 있습니다.
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">
                        {/* 환불 핵심 원칙 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-teal-50 p-6 rounded-xl border border-teal-100 flex items-start">
                                <CheckCircle2 className="w-6 h-6 text-teal-600 mr-3 mt-1" />
                                <div>
                                    <h3 className="font-bold text-teal-900 mb-1">전액 환불 가능</h3>
                                    <p className="text-sm text-teal-800">결제 후 7일 이내이며 서비스(정보 열람 등)를 전혀 이용하지 않은 경우</p>
                                </div>
                            </div>
                            <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex items-start">
                                <AlertTriangle className="w-6 h-6 text-red-600 mr-3 mt-1" />
                                <div>
                                    <h3 className="font-bold text-red-900 mb-1">환불 제한 대상</h3>
                                    <p className="text-sm text-red-800">디지털 콘텐츠 특성상 1회 이상의 정보 열람(열람권 사용)이 발생한 경우</p>
                                </div>
                            </div>
                        </div>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <CreditCard className="w-5 h-5 text-teal-600 mr-2" />
                                제1조 (청약 철회 및 환불 원칙)
                            </h2>
                            <div className="text-gray-600 leading-relaxed text-sm space-y-3">
                                <p>1. 회원은 '전자상거래 등에서의 소비자보호에 관한 법률'에 의거, 유료 서비스를 결제한 날로부터 7일 이내에 청약 철회를 요청할 수 있습니다.</p>
                                <p>2. 결제한 '열람권'을 사용하여 창고업체 또는 고객사의 상세 정보를 1회라도 열람한 경우, 디지털 콘텐츠의 제공이 개시된 것으로 간주하여 소비자보호법 제17조 제2항 제5호에 따라 청약 철회가 제한됩니다.</p>
                                <p>3. 청약 철회 기간(7일)이 경과한 경우에도 서비스 이용 내역이 없다면 환불이 가능하나, 결제 수수료 및 운영 실비를 제외한 금액이 환불될 수 있습니다.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제2조 (특수 케이스에 대한 환불 규정)</h2>
                            <div className="text-gray-600 leading-relaxed text-sm space-y-4">
                                <div className="border-l-4 border-gray-200 pl-4 py-1">
                                    <p className="font-bold text-gray-800 mb-1">중복 결제 및 오결제</p>
                                    <p>시스템 오류 등으로 인한 중복 결제나 오결제에 대해서는 확인 즉시 전액 환불 처리를 원칙으로 합니다.</p>
                                </div>
                                <div className="border-l-4 border-gray-200 pl-4 py-1">
                                    <p className="font-bold text-gray-800 mb-1">서비스 장애로 인한 피해</p>
                                    <p>회사의 책임 있는 사유로 인해 서비스를 24시간 이상 연속하여 이용하지 못하거나, 시스템 오류로 열람권을 사용했으나 정보가 노출되지 않은 경우 열람권 복구 또는 전액 환불을 진행합니다.</p>
                                </div>
                                <div className="border-l-4 border-gray-200 pl-4 py-1">
                                    <p className="font-bold text-gray-800 mb-1">강제 탈퇴 조치 시</p>
                                    <p>허위 정보 기재, 타인 정보 도용 등 회원의 귀책사유로 인해 영구 정지 또는 강제 탈퇴 조치된 회원의 경우 미사용한 열람권에 대한 환불이 불가능할 수 있습니다.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제3조 (환불 절차 안내)</h2>
                            <div className="bg-gray-50 p-6 rounded-lg text-gray-600 text-sm space-y-3">
                                <p>1. <strong>접수:</strong> 고객센터(이메일 또는 문의하기)를 통해 회원의 ID, 결제 일자, 결제 금액, 환불 사유를 작성하여 접수합니다.</p>
                                <p>2. <strong>검토:</strong> 회사는 접수 후 3영업일 이내에 이용 내역을 확인하고 환불 가능 여부를 안내합니다.</p>
                                <p>3. <strong>지급:</strong> 환불 승인 시 신용카드 결제 취소 또는 계좌 입금 방식으로 환불을 진행합니다. (계좌 입금의 경우 최대 5영업일 소요)</p>
                            </div>
                        </section>

                        <div className="bg-amber-50 border border-amber-100 p-6 rounded-lg">
                            <h4 className="text-amber-800 font-bold mb-2 flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2" />
                                주의사항
                            </h4>
                            <ul className="list-disc list-inside text-amber-700 text-xs md:text-sm space-y-1">
                                <li>타인에게 선물 받은 열람권은 현금으로 환불이 불가능합니다.</li>
                                <li>환불 시 무상으로 지급된 보너스 열람권 및 포인트는 모두 소멸됩니다.</li>
                                <li>모바일 결제의 경우 당월이 경과하여 취소가 불가능한 경우 수수료 공제 후 계좌 입금으로 처리될 수 있습니다.</li>
                            </ul>
                        </div>

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

export default RefundPolicy;
