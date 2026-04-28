import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, ExternalLink, Calendar } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import ReceiptModal from '../components/ReceiptModal';

const PaymentHistoryPage = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 영수증 모달 관련 상태
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!user) {
            navigate('/login');
            return;
        }
        setCurrentUser(user);

        const fetchPaymentHistory = async () => {
            try {
                const { data, error } = await supabase
                    .from('payment_history')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching payment history:', error);
                    return;
                }

                // 이름 추가 매핑
                const mappedData = data.map(payment => ({
                    ...payment,
                    userName: user.company_name || user.companyName || user.name || '알 수 없는 사용자'
                }));

                setPayments([...mappedData]);
            } catch (err) {
                console.error('Failed to load payment history:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPaymentHistory();
    }, [navigate]);

    const handleOpenReceipt = (payment) => {
        setSelectedPayment(payment);
        setIsReceiptModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/mypage')}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        마이페이지로 돌아가기
                    </button>
                    <div className="flex items-center">
                        <div className="bg-primary-600 p-3 rounded-full mr-4">
                            <CreditCard className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">결제 내역 조회</h1>
                            <p className="text-gray-600">열람권 및 프리미엄 서비스 등 결제하신 내역을 확인하실 수 있습니다.</p>
                        </div>
                    </div>
                </div>

                {/* 결제 내역 리스트 */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {payments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                        <th className="px-6 py-4">결제일시</th>
                                        <th className="px-6 py-4">상품명</th>
                                        <th className="px-6 py-4">결제 금액</th>
                                        <th className="px-6 py-4">상태</th>
                                        <th className="px-6 py-4 text-center">결제 영수증</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 flex items-center">
                                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                {new Date(payment.created_at).toLocaleDateString('ko-KR')} {new Date(payment.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {payment.package_type || '알 수 없는 상품'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {Number(payment.amount || 0).toLocaleString()}원
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {payment.status === 'success' ? '결제완료' : '결제실패/취소'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => {
                                                        if (payment.receipt_url) {
                                                            window.open(payment.receipt_url, '_blank', 'width=800,height=900,scrollbars=yes');
                                                        } else {
                                                            handleOpenReceipt(payment);
                                                        }
                                                    }}
                                                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-1.5" />
                                                    영수증 보기
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <CreditCard className="mx-auto h-12 w-12 text-gray-300" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">결제 내역이 없습니다</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                아직 유료 서비스를 이용하신 내역이 존재하지 않습니다.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* 영수증 모달 */}
            <ReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                payment={selectedPayment}
            />
        </div>
    );
};

export default PaymentHistoryPage;
