import React from 'react';
import { ArrowLeft, Lock, Eye, FileText, Shield, Trash2, Users, HardDrive, Bell, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors font-medium"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    돌아가기
                </button>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                    <div className="bg-gray-800 px-8 py-10 text-center text-white">
                        <Lock className="w-12 h-12 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold">개인정보처리방침</h1>
                        <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
                            (주)동화세상에듀코은 회원의 소중한 개인정보를 보호하기 위해 최선을 다하고 있으며, 관련 법령을 엄격히 준수합니다.
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">
                        {/* 제1조 */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Shield className="w-5 h-5 text-gray-800 mr-2" />
                                제1조 (목적)
                            </h2>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                (주)동화세상에듀코(이하 "회사"라 함)는 개인정보보호법 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
                            </p>
                        </section>

                        {/* 제2조 */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Eye className="w-5 h-5 text-gray-800 mr-2" />
                                제2조 (개인정보의 수집 항목 및 방법)
                            </h2>
                            <div className="bg-gray-50 p-6 rounded-lg text-sm text-gray-600 space-y-4">
                                <div>
                                    <p className="font-bold text-gray-800 mb-1">1. 필수 수집 항목</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>창고업체: 이메일, 비밀번호, 회사명, 사업자번호, 대표자명, 전화번호, 담당자명/연락처, 창고 주소 및 시설 정보</li>
                                        <li>고객사: 이메일, 비밀번호, 회사명, 대표자명, 전화번호, 담당자명/연락처, 사업장 주소, 물류 요구사항</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 mb-1">2. 서비스 이용 과정 중 자동 수집 항목</p>
                                    <p>IP주소, 쿠키, 방문 일시, 서비스 이용 기록, 불량 이용 기록 등</p>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 mb-1">3. 수집 방법</p>
                                    <p>홈페이지 회원가입, 서비스 이용, 이벤트 응모, 고객센터 문의 등을 통해 수집합니다.</p>
                                </div>
                            </div>
                        </section>

                        {/* 제3조 */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <FileText className="w-5 h-5 text-gray-800 mr-2" />
                                제3조 (개인정보의 처리 목적)
                            </h2>
                            <p className="text-gray-600 leading-relaxed text-sm mb-4">
                                회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs lg:text-sm">
                                <li className="bg-white border border-gray-100 p-3 rounded shadow-sm">1. 홈페이지 회원 가입 및 관리</li>
                                <li className="bg-white border border-gray-100 p-3 rounded shadow-sm">2. 3PL 물류 매칭 서비스 및 정보 제공</li>
                                <li className="bg-white border border-gray-100 p-3 rounded shadow-sm">3. 유료 서비스(열람권) 결제 및 요금 정산</li>
                                <li className="bg-white border border-gray-100 p-3 rounded shadow-sm">4. 신규 서비스 개발 및 플랫폼 고도화</li>
                            </ul>
                        </section>

                        {/* 제4조 */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제4조 (개인정보의 보유 및 이용기간)</h2>
                            <div className="text-gray-600 leading-relaxed text-sm space-y-3">
                                <p>1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                                <p>2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.</p>
                                <ul className="bg-gray-50 p-4 rounded list-disc pl-5 space-y-1">
                                    <li>회원 가입 및 관리: 홈페이지 탈퇴 시까지</li>
                                    <li>계약·청약철회, 대금결제, 재화 등의 공급 기록: 5년 (전자상거래법)</li>
                                    <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
                                    <li>접속 기록: 3개월 (통신비밀보호법)</li>
                                </ul>
                            </div>
                        </section>

                        {/* 제5조 */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Trash2 className="w-5 h-5 text-gray-800 mr-2" />
                                제5조 (개인정보의 파기절차 및 방법)
                            </h2>
                            <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                                <p>1. 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
                                <p>2. <strong>파기절차:</strong> 목적이 달성된 개인정보는 별도의 DB로 옮겨져 법령에 의한 보관 기간 후 즉시 파기됩니다.</p>
                                <p>3. <strong>파기방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법(Low Level Format 등)을 사용하여 삭제하며, 종이 문서에 기록된 개인정보는 분쇄기로 분쇄하거나 소각합니다.</p>
                            </div>
                        </section>

                        {/* 제6조 */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Users className="w-5 h-5 text-gray-800 mr-2" />
                                제6조 (개인정보의 제3자 제공)
                            </h2>
                            <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg text-gray-700 text-sm space-y-3">
                                <p>회사는 원칙적으로 이용자의 개인정보를 외부원에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
                                <p className="font-bold underline">물류 매칭 서비스 이용 시 정보 제공:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>제공받는 자: 상대 회원의 상세 정보를 열람권으로 확인한 회원</li>
                                    <li>제공 목적: 원활한 물류 위탁 계약 상담 및 소통</li>
                                    <li>제공 항목: 회사명, 대표자명, 담당자명, 연락처, 이메일</li>
                                    <li>보유 기간: 목적 달성 시 및 회원 탈퇴 시까지</li>
                                </ul>
                            </div>
                        </section>

                        {/* 제7조 */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제7조 (개인정보 처리의 위탁)</h2>
                            <div className="text-gray-600 leading-relaxed text-sm space-y-3">
                                <p>회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse border border-gray-200">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="p-3 border">수탁업체</th>
                                                <th className="p-3 border">위탁업무 내용</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="p-3 border">Supabase (클라우드 서비스)</td>
                                                <td className="p-3 border">데이터 보관 및 시스템 서버 운영</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 border">토스페이먼츠 (Toss)</td>
                                                <td className="p-3 border">유료 서비스 결제 및 본인 확인</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* 제8조 */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Scale className="w-5 h-5 text-gray-800 mr-2" />
                                제8조 (이용자의 권리·의무 및 그 행사방법)
                            </h2>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                이용자는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다. 권리 행사는 마이페이지 내 설정 혹은 서면, 전자우편 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.
                            </p>
                        </section>

                        {/* 제9조 */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <HardDrive className="w-5 h-5 text-gray-800 mr-2" />
                                제9조 (개인정보의 안전성 확보 조치)
                            </h2>
                            <div className="text-gray-600 leading-relaxed text-sm space-y-3">
                                <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>관리적 조치:</strong> 내부관리계획 수립 및 시행, 정기적 직원 교육 등</li>
                                    <li><strong>기술적 조치:</strong> 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                                    <li><strong>물리적 조치:</strong> 서버실, 자료보관실 등의 접근통제</li>
                                </ul>
                            </div>
                        </section>

                        {/* 제10조 */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Bell className="w-5 h-5 text-gray-800 mr-2" />
                                제10조 (개인정보 보호책임자 및 CISO)
                            </h2>
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-bold text-gray-800 mb-2">[정보보호최고책임자 (CISO)]</h3>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li><strong>성명 :</strong> 박재경 상무 (IT팀)</li>
                                            <li><strong>역할 :</strong> 정보보호 업무 총괄/관리</li>
                                        <li><strong>신고처 :</strong> 과학기술정보통신부 (신고 완료)</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 mb-2">[개인정보 관리/고충 처리]</h3>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li><strong>전화 :</strong> 02-3668-0541</li>
                                            <li><strong>문의 :</strong> 서비스 내 '문의하기' 게시판</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 제11조 */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">제11조 (개인정보 처리방침의 변경)</h2>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                본 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
                            </p>
                        </section>

                        <div className="border-t pt-8 mt-12 text-center">
                            <p className="text-gray-500 font-medium">공고 일자: 2024년 04월 01일</p>
                            <p className="text-gray-500 font-medium mt-1">시행 일자: 2024년 04월 08일</p>
                            <p className="text-gray-400 text-xs mt-4">© (주)동화세상에듀코 All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
