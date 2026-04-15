import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, Send, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { User, MessageCircle, CheckCircle, Clock } from 'lucide-react'; // 아이콘 추가

const Contact = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    const [error, setError] = useState('');

    // [New] Inquiry History State
    const [userInquiries, setUserInquiries] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    React.useEffect(() => {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (user) {
            setIsLoggedIn(true);
            setCurrentUser(user);
            fetchUserInquiries(user.email);
        }
    }, [submitted]); // submitted 상태가 바뀌면(문의 등록 시) 다시 불러옴

    const fetchUserInquiries = async (email) => {
        if (!email) return;

        try {
            const { data, error } = await supabase
                .from('inquiries')
                .select('*')
                .eq('email', email)
                .order('created_at', { ascending: false });

            if (data) {
                setUserInquiries(data);
            }
        } catch (err) {
            console.error('Error fetching inquiries:', err);
        }
    };

    const [formData, setFormData] = useState({
        category: 'service',
        title: '',
        content: '',
        email: '',
        phone: '',
        privacyAgreed: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.privacyAgreed) {
                throw new Error('개인정보 수집 및 이용에 동의해주세요.');
            }

            // Supabase에 데이터 저장
            const { error: insertError } = await supabase
                .from('inquiries')
                .insert([
                    {
                        category: formData.category,
                        title: formData.title,
                        content: formData.content,
                        email: formData.email,
                        phone: formData.phone,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (insertError) {
                // 테이블이 없거나 권한 문제일 경우를 대비해 콘솔 출력
                console.error('Supabase Error:', insertError);
                // 에러가 나더라도 사용자에겐 이메일 안내로 유도하거나 성공 메시지를 띄우는 것이 나을 수 있음 (UX상)
                // 하지만 여기서는 확실히 알림.
                throw new Error('문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 이메일로 문의주세요.');
            }

            setSubmitted(true);
            window.scrollTo(0, 0);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // [New] Pre-fill email/phone if logged in
    React.useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                email: currentUser.email || '',
                phone: currentUser.phone || ''
            }));
        }
    }, [currentUser]);

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Send className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">문의가 접수되었습니다.</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        보내주신 소중한 의견을 확인 후<br />
                        빠른 시일 내에 답변 드리겠습니다.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 좌측: 고객센터 정보 */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">고객센터</h2>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <Mail className="w-5 h-5 text-primary-600 mt-1 mr-3 shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">이메일 문의</p>
                                        <p className="font-medium text-gray-900 break-all">dslee@educo.co.kr</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <Phone className="w-5 h-5 text-primary-600 mt-1 mr-3 shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">전화 문의</p>
                                        <p className="font-medium text-gray-900">02-3668-0541</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    운영시간: 평일 09:00 - 18:00<br />
                                    (점심시간 12:00 - 13:00)<br />
                                    주말 및 공휴일 휴무
                                </p>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                            <div className="flex items-start">
                                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-blue-900 mb-2">자주 묻는 질문</h3>
                                    <p className="text-sm text-blue-700 mb-4">
                                        궁금한 점이 있으신가요?<br />
                                        FAQ에서 빠르게 답을 찾아보세요.
                                    </p>
                                    <button
                                        onClick={() => navigate('/faq')}
                                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                        FAQ 보러가기 &rarr;
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 우측: 문의 폼 */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="px-8 py-6 bg-gray-900 text-white">
                                <h1 className="text-2xl font-bold">1:1 문의하기</h1>
                                <p className="text-gray-400 mt-1">문의 유형을 선택하고 내용을 작성해 주세요.</p>
                            </div>
                            <div className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            문의 유형 <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-shadow"
                                        >
                                            <option value="service">서비스 이용</option>
                                            <option value="payment">결제/환불</option>
                                            <option value="match">창고/고객사 매칭</option>
                                            <option value="partnership">제휴 및 광고</option>
                                            <option value="etc">기타</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            제목 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            required
                                            placeholder="문의 제목을 입력해주세요"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-shadow"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            내용 <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="content"
                                            value={formData.content}
                                            onChange={handleChange}
                                            required
                                            rows="5"
                                            placeholder="문의 내용을 상세히 적어주세요"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-shadow resize-none"
                                        ></textarea>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                이메일 (답변 수신용) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                placeholder="example@email.com"
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-shadow"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                연락처
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="010-0000-0000"
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-shadow"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <label className="flex items-start cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="privacyAgreed"
                                                checked={formData.privacyAgreed}
                                                onChange={handleChange}
                                                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">
                                                <span className="font-medium text-gray-900">[필수]</span> 개인정보 수집 및 이용에 동의합니다.
                                                <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} className="text-xs text-primary-600 underline ml-2 hover:text-primary-800 font-medium">내용보기</button>
                                            </span>
                                        </label>
                                    </div>

                                    {/* 개인정보 수집·이용 동의 전문보기 모달 */}
                                    {showPrivacyModal && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setShowPrivacyModal(false)}>
                                            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                                <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-2xl">
                                                    <h3 className="text-lg font-bold text-gray-900">개인정보 수집 및 이용 동의</h3>
                                                    <button onClick={() => setShowPrivacyModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                                        <X className="w-5 h-5 text-gray-500" />
                                                    </button>
                                                </div>
                                                <div className="px-6 py-5 space-y-5 text-sm text-gray-700 leading-relaxed">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 mb-2">1. 수집 목적</h4>
                                                        <p>고객 문의 접수 및 답변, 서비스 관련 상담 처리, 불만 사항 해결 및 개선</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 mb-2">2. 수집 항목</h4>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            <li><strong>필수:</strong> 이메일 주소, 문의 유형, 문의 제목, 문의 내용</li>
                                                            <li><strong>선택:</strong> 연락처(전화번호)</li>
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 mb-2">3. 보유 및 이용 기간</h4>
                                                        <p>문의 처리 완료 후 <strong>3년간</strong> 보관 (전자상거래법에 따른 소비자 불만 또는 분쟁 처리에 관한 기록 보존) 후 지체 없이 파기합니다.</p>
                                                    </div>
                                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                        <h4 className="font-bold text-gray-900 mb-2">4. 동의 거부 권리 및 불이익</h4>
                                                        <p>귀하는 위 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, <strong>필수 항목에 대한 동의를 거부하실 경우 1:1 문의 접수가 제한</strong>됩니다. 선택 항목에 대한 동의 거부 시에는 서비스 이용에 제한이 없습니다.</p>
                                                    </div>
                                                </div>
                                                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                                                    <button
                                                        onClick={() => setShowPrivacyModal(false)}
                                                        className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                                                    >
                                                        확인
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center">
                                            <Info className="w-4 h-4 mr-2" />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg shadow-md transition-all ${loading
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg transform hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {loading ? '접수 중...' : '문의하기'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* [New] 나의 문의 내역 섹션 */}
                {isLoggedIn && (
                    <div className="mt-16 border-t border-gray-200 pt-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                            <User className="w-7 h-7 mr-3 text-primary-600" />
                            나의 문의 내역
                        </h2>

                        <div className="space-y-6">
                            {userInquiries.map((inq) => (
                                <div key={inq.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${inq.status === 'resolved' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                                                        {inq.status === 'resolved' ? '답변완료' : '진행중'}
                                                    </span>
                                                    <span className="text-sm text-gray-400">
                                                        {new Date(inq.created_at).toLocaleDateString()} {new Date(inq.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded border border-gray-100">
                                                        {inq.category}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900">{inq.title}</h3>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm whitespace-pre-wrap mb-4">
                                            {inq.content}
                                        </div>

                                        {/* 답변 표시 영역 */}
                                        {inq.status === 'resolved' && inq.answer && (
                                            <div className="bg-blue-50 rounded-lg p-5 border border-blue-100 mt-4 relative">
                                                <div className="absolute top-5 left-5">
                                                    <MessageCircle className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="pl-8">
                                                    <h4 className="font-bold text-blue-900 mb-2 text-sm">관리자 답변</h4>
                                                    <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                                                        {inq.answer}
                                                    </p>
                                                    <p className="text-xs text-blue-400 mt-3 text-right">
                                                        {inq.answered_at ? new Date(inq.answered_at).toLocaleDateString() : ''} 답변됨
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {inq.status !== 'resolved' && (
                                            <div className="flex items-center text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                                                <Clock className="w-4 h-4 mr-2 text-green-500" />
                                                빠른 시일 내에 답변 드리겠습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {userInquiries.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
                                    문의 내역이 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Contact;
