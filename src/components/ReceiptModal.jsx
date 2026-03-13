import React, { useRef } from 'react';
import { X, Printer, CreditCard } from 'lucide-react';

const ReceiptModal = ({ isOpen, onClose, payment }) => {
    const printRef = useRef(null);

    if (!isOpen || !payment) return null;

    const handlePrint = () => {
        const printContent = printRef.current;

        // 단순 인쇄용 새창 열기
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        printWindow.document.write(`
      <html>
        <head>
          <title>결제 영수증</title>
          <style>
            body { font-family: 'Malgun Gothic', sans-serif; padding: 40px; }
            .receipt-container { max-width: 400px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
            .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; }
            .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
            .row .label { color: #666; }
            .row .value { font-weight: bold; text-align: right; }
            .total-row { border-top: 2px solid #ccc; padding-top: 15px; margin-top: 15px; font-size: 18px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            }
          </script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden relative">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold flex items-center text-gray-900">
                        <CreditCard className="w-5 h-5 mr-2 text-primary-600" />
                        결제 영수증
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 인쇄될 영역 (숨겨진 방식이 아니라 모달 뷰와 동일하게 유지하되 스타일 클래스는 인쇄 윈도우 스크립트 참고) */}
                <div className="p-6 bg-gray-50">
                    <div ref={printRef} className="bg-white border rounded p-6 shadow-sm">
                        <div className="header text-center border-b-2 border-dashed border-gray-200 pb-4 mb-4">
                            <h2 className="title text-2xl font-bold text-gray-900">영수증</h2>
                            <p className="subtitle text-sm text-gray-500 mt-1">[신용카드 매출전표]</p>
                        </div>

                        <div className="space-y-3">
                            <div className="row flex justify-between text-sm">
                                <span className="label text-gray-500">가맹점명</span>
                                <span className="value font-semibold text-gray-900">에듀코로지(주)</span>
                            </div>
                            <div className="row flex justify-between text-sm">
                                <span className="label text-gray-500">사업자번호</span>
                                <span className="value font-semibold text-gray-900">미등록 (테스트)</span>
                            </div>
                            <div className="row flex justify-between text-sm">
                                <span className="label text-gray-500">거래일시</span>
                                <span className="value font-semibold text-gray-900">{new Date(payment.created_at).toLocaleString('ko-KR')}</span>
                            </div>
                            <div className="row flex justify-between text-sm">
                                <span className="label text-gray-500">승인번호</span>
                                <span className="value font-semibold text-gray-900">{payment.id ? payment.id.substring(0, 8).toUpperCase() : 'TEST-AP-XXXX'}</span>
                            </div>
                            <div className="row flex justify-between text-sm">
                                <span className="label text-gray-500">주문자</span>
                                <span className="value font-semibold text-gray-900">{payment.userName || '비회원'}</span>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-gray-200 pt-4 space-y-3">
                            <div className="row flex justify-between text-sm">
                                <span className="label text-gray-600">상품명</span>
                                <span className="value font-bold text-gray-900">{payment.package_type}</span>
                            </div>
                            <div className="row flex justify-between text-sm">
                                <span className="label text-gray-600">공급가액</span>
                                <span className="value text-gray-900">{Math.round(payment.amount / 1.1).toLocaleString()}원</span>
                            </div>
                            <div className="row flex justify-between text-sm">
                                <span className="label text-gray-600">부가세</span>
                                <span className="value text-gray-900">{Math.round(payment.amount - (payment.amount / 1.1)).toLocaleString()}원</span>
                            </div>

                            <div className="row total-row flex justify-between text-lg font-bold border-t-2 border-gray-600 pt-3 mt-3">
                                <span className="label text-gray-900">합계</span>
                                <span className="value text-primary-600">{Number(payment.amount).toLocaleString()}원</span>
                            </div>
                        </div>

                        <div className="footer text-center mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400">
                            <p>본 영수증은 거래 증빙용으로 사용할 수 없습니다.<br />(실 서비스 오픈 전 모의 결제)</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-white flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    >
                        닫기
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        인쇄하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
