import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogIn, Eye, EyeOff, Building2, Users } from 'lucide-react';
import { comparePassword } from '../utils/passwordHash';

const LoginModal = ({ isOpen, onClose, onSignupClick }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'warehouse' // 'warehouse' or 'customer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 관리자 로그인 체크 (이메일이 "admin"이고 비밀번호가 "1231"인 경우)
    if (formData.email.toLowerCase() === 'admin' && formData.password === '1231') {
      localStorage.setItem('adminAuth', 'true');
      onClose(); // 모달 닫기
      navigate('/admin/dashboard');
      return;
    }
    
    // 실제 로그인 로직 (localStorage에서 사용자 데이터 확인)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => 
      u.email === formData.email && 
      u.userType === formData.userType &&
      comparePassword(formData.password, u.password) // 해싱된 비밀번호와 비교
    );

    if (user) {
      // 로그인 성공
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // 커스텀 이벤트 발생시켜 Header에 알림
      window.dispatchEvent(new CustomEvent('userLogin'));
      
      onClose(); // 모달 닫기
      // 메인페이지로 이동
      navigate('/');
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const handleSignupClick = () => {
    onClose();
    if (onSignupClick) {
      onSignupClick();
    } else {
      navigate('/');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-primary-600 p-2 rounded-full mr-3">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">로그인</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            자세한 정보를 보려면 로그인이 필요합니다
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* 사용자 유형 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용자 유형
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, userType: 'warehouse' }))}
                  className={`flex items-center justify-center px-3 py-2 border rounded-lg transition-colors text-sm ${
                    formData.userType === 'warehouse'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 mr-1" />
                  창고업체
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, userType: 'customer' }))}
                  className={`flex items-center justify-center px-3 py-2 border rounded-lg transition-colors text-sm ${
                    formData.userType === 'customer'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-4 h-4 mr-1" />
                  고객사
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="text"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="이메일 또는 아이디를 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="비밀번호를 입력하세요"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                로그인
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              계정이 없으신가요?{' '}
              <button 
                onClick={handleSignupClick}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                회원가입하기
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
