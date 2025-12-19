import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, CreditCard, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { checkViewingPass, useViewingPass } from '../utils/viewingPassUtils';
import { supabase } from '../utils/supabaseClient';

const ContactModal = ({ isOpen, onClose, contactInfo, type }) => {
  const [loading, setLoading] = useState(false);
  const [hasPass, setHasPass] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      checkPass();
    }
  }, [isOpen]);

  const checkPass = async () => {
    const has = await checkViewingPass();
    setHasPass(has);
  };

  const handleUsePass = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 회사 이름 결정 (companyName이 없으면 company_name 사용)
      const companyName = contactInfo.companyName || contactInfo.company_name || '이름 없음';

      const result = await useViewingPass(contactInfo.id, type, companyName);

      if (result.success) {
        setIsRevealed(true);
      } else {
        if (result.expired) {
          setErrorMsg('열람권이 만료되었습니다.');
        } else if (result.message === '열람권이 없습니다.') {
          navigate('/payment');
        } else {
          setErrorMsg(result.message);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isRevealed ? '연락처 정보' : '연락처 열람'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              {type === 'warehouse' ? '창고 정보' : '고객사 정보'}
            </h3>

            {isRevealed ? (
              <div className="space-y-4 text-base">
                <div className="flex items-center p-3 bg-white rounded border border-gray-200">
                  <Phone className="w-5 h-5 text-primary-600 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">전화번호</p>
                    <p className="font-bold text-gray-900">{contactInfo.contactPhone || contactInfo.phone || '정보 없음'}</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-white rounded border border-gray-200">
                  <Mail className="w-5 h-5 text-primary-600 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">이메일</p>
                    <p className="font-bold text-gray-900">{contactInfo.email || '정보 없음'}</p>
                  </div>
                </div>
                {contactInfo.representative && (
                  <div className="flex items-center p-3 bg-white rounded border border-gray-200">
                    <Star className="w-5 h-5 text-primary-600 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500">대표자</p>
                      <p className="font-bold text-gray-900">{contactInfo.representative}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-sm blur-sm select-none">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-gray-600">전화번호: 010-****-****</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-gray-600">이메일: *****@****.com</span>
                </div>
              </div>
            )}

            {!isRevealed && (
              <p className="text-xs text-center text-gray-500 mt-4">
                연락처를 보려면 열람권을 사용해야 합니다.<br />
                (이미 열람한 업체는 차감되지 않습니다)
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
              {errorMsg}
            </div>
          )}

          {!isRevealed && (
            <div className="mt-4">
              {hasPass ? (
                <button
                  onClick={handleUsePass}
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-bold flex items-center justify-center"
                >
                  {loading ? '처리 중...' : '열람권 1회 사용하여 연락처 보기'}
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">보유하신 열람권이 없습니다.</p>
                  <button
                    onClick={() => navigate('/payment')}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-bold"
                  >
                    열람권 구매하러 가기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
