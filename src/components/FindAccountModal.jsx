import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { hashPassword } from '../utils/passwordHash';

const FindAccountModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('findId'); // 'findId' | 'findPw'
  const [userType, setUserType] = useState('warehouse'); // 'warehouse' | 'customer'
  
  // 입력 필드 상태
  const [formData, setFormData] = useState({
    businessNumber: '',
    representative: '',
    phone: '',
    email: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 결과 및 상태
  const [foundEmail, setFoundEmail] = useState('');
  const [isPwVerified, setIsPwVerified] = useState(false); // 비번 재설정 자격 획득 여부
  const [message, setMessage] = useState({ type: '', text: '' }); // 'success' | 'error'

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      businessNumber: '',
      representative: '',
      phone: '',
      email: '',
      newPassword: '',
      confirmPassword: ''
    });
    setFoundEmail('');
    setIsPwVerified(false);
    setMessage({ type: '', text: '' });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  // 이메일 마스킹 처리 (앞 3글자 유지)
  const maskEmail = (email) => {
    if (!email) return '';
    const [id, domain] = email.split('@');
    if (id.length <= 3) return email; // 너무 짧으면 그대로 노출
    const maskedId = id.substring(0, 3) + '*'.repeat(id.length - 3);
    return `${maskedId}@${domain}`;
  };

  // 1. 아이디 찾기 실행
  const handleFindId = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setFoundEmail('');

    try {
      const table = userType === 'warehouse' ? 'warehouses' : 'customers';
      const { data, error } = await supabase
        .from(table)
        .select('email')
        .match({
          business_number: formData.businessNumber,
          representative: formData.representative,
          phone: formData.phone
        });

      if (error) throw error;

      if (data && data.length > 0) {
        setFoundEmail(data[0].email);
        setMessage({ type: 'success', text: '일치하는 아이디를 찾았습니다.' });
      } else {
        setMessage({ type: 'error', text: '입력하신 정보와 일치하는 회원을 찾을 수 없습니다.' });
      }
    } catch (err) {
      console.error('Find ID Error:', err);
      setMessage({ type: 'error', text: '데이터 조회 중 오류가 발생했습니다.' });
    }
  };

  // 2. 비밀번호 재설정 자격 검증 (Option A)
  const handleVerifyPw = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const table = userType === 'warehouse' ? 'warehouses' : 'customers';
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .match({
          email: formData.email,
          business_number: formData.businessNumber,
          representative: formData.representative,
          phone: formData.phone
        });

      if (error) throw error;

      if (data && data.length > 0) {
        setIsPwVerified(true);
        setMessage({ type: 'success', text: '본인 인증에 성공했습니다. 새 비밀번호를 입력해주세요.' });
      } else {
        setMessage({ type: 'error', text: '입력하신 정보와 일치하는 회원을 찾을 수 없습니다.' });
      }
    } catch (err) {
      console.error('Verify PW Error:', err);
      setMessage({ type: 'error', text: '데이터 조회 중 오류가 발생했습니다.' });
    }
  };

  // 3. 비밀번호 실제 재설정
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: '비밀번호가 일치하지 않습니다.' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: '비밀번호는 6자리 이상이어야 합니다.' });
      return;
    }

    try {
      const table = userType === 'warehouse' ? 'warehouses' : 'customers';
      const hashedPassword = hashPassword(formData.newPassword);

      const { error } = await supabase
        .from(table)
        .update({ password: hashedPassword })
        .match({ email: formData.email }); // 인증 시 입력한 이메일 기준

      if (error) throw error;

      setMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다. 로그인해 주세요.' });
      // 일정 시간 후 모달 닫기 유도 가능
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (err) {
      console.error('Reset PW Error:', err);
      setMessage({ type: 'error', text: '비밀번호 변경 중 오류가 발생했습니다.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button 
          onClick={() => { onClose(); resetForm(); }} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">계정 정보 찾기</h2>

        {/* 회원 유형 탭 */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setUserType('warehouse')}
            className={`flex-1 py-2 text-center font-medium text-sm ${userType === 'warehouse' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            창고업체
          </button>
          <button
            onClick={() => setUserType('customer')}
            className={`flex-1 py-2 text-center font-medium text-sm ${userType === 'customer' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            고객사
          </button>
        </div>

        {/* ID / PW 전환 탭 */}
        <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => handleTabChange('findId')}
            className={`flex-1 py-2 text-center rounded-md font-medium text-sm ${activeTab === 'findId' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            아이디 찾기
          </button>
          <button
            onClick={() => handleTabChange('findPw')}
            className={`flex-1 py-2 text-center rounded-md font-medium text-sm ${activeTab === 'findPw' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            비밀번호 찾기
          </button>
        </div>

        {/* 결과 메시지 */}
        {message.text && (
          <div className={`p-3 rounded-md mb-4 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* 아이디 찾기 폼 */}
        {activeTab === 'findId' && (
          <form onSubmit={handleFindId} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사업자 등록번호</label>
              <input
                type="text"
                name="businessNumber"
                value={formData.businessNumber}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="예) 123-45-67890"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대표자명</label>
              <input
                type="text"
                name="representative"
                value={formData.representative}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="홍길동"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대표 연락처 (전화번호)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="010-1234-5678"
                required
              />
            </div>

            {foundEmail && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-center">
                <p className="text-sm text-gray-600 mb-1">가입된 이메일 주소</p>
                <p className="text-lg font-bold text-gray-900">{maskEmail(foundEmail)}</p>
              </div>
            )}

            {!foundEmail && (
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition"
              >
                아이디 찾기
              </button>
            )}
          </form>
        )}

        {/* 비밀번호 찾기 폼 */}
        {activeTab === 'findPw' && (
          <>
            {!isPwVerified ? (
              <form onSubmit={handleVerifyPw} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일(아이디)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="example@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사업자 등록번호</label>
                  <input
                    type="text"
                    name="businessNumber"
                    value={formData.businessNumber}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="예) 123-45-67890"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">대표자명</label>
                  <input
                    type="text"
                    name="representative"
                    value={formData.representative}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="홍길동"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">대표 연락처 (전화번호)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="010-1234-5678"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition"
                >
                  본인 인증
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="6자리 이상"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="동일하게 입력"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition"
                >
                  비밀번호 변경
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FindAccountModal;
