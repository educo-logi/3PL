import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Building2, Users } from 'lucide-react';
import SignupModal from '../components/SignupModal';
import { comparePassword } from '../utils/passwordHash';
import { supabase } from '../utils/supabaseClient';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'warehouse' // 'warehouse' or 'customer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 관리자 로그인 체크
    const adminId = import.meta.env.VITE_ADMIN_ID;
    const adminPw = import.meta.env.VITE_ADMIN_PASSWORD;

    if (formData.email.toLowerCase() === adminId && formData.password === adminPw) {
      localStorage.setItem('adminAuth', 'true');
      navigate('/admin/dashboard');
      return;
    }

    try {
      // Supabase에서 사용자 조회
      const table = formData.userType === 'warehouse' ? 'warehouses' : 'customers';

      const { data: user, error } = await supabase
        .from(table)
        .select('*')
        .eq('email', formData.email)
        .single();

      if (error || !user) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
        return;
      }

      // 비밀번호 검증
      const isMatch = comparePassword(formData.password, user.password);

      if (isMatch) {
        // 로그인 성공
        localStorage.removeItem('adminAuth'); // 관리자 권한 제거

        // 세션 유지를 위해 localStorage 사용 (실제 앱에서는 Supabase Auth 사용 권장)
        // 여기서는 기존 로직 호환성을 위해 user 객체를 localStorage에 저장
        // CamelCase 변환 필요할 수 있으나, currentUser를 사용하는 곳이 많지 않다면 일단 저장
        // Home.jsx 등에서 currentUser를 어떻게 쓰는지 확인 필요. 
        // 일단 저장.
        localStorage.setItem('currentUser', JSON.stringify(user));

        // 커스텀 이벤트 발생시켜 Header에 알림
        window.dispatchEvent(new CustomEvent('userLogin'));

        // 로그인 성공 시 메인페이지로 이동
        navigate('/');
      } else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleWarehouseSignup = () => {
    setIsSignupModalOpen(false);
    navigate('/warehouse-register');
  };

  const handleCustomerSignup = () => {
    setIsSignupModalOpen(false);
    navigate('/customer-register');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-primary-600 p-3 rounded-full">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          로그인
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          3PL 물류대행 플랫폼에 로그인하세요
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 사용자 유형 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                사용자 유형
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, userType: 'warehouse' }))}
                  className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${formData.userType === 'warehouse'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  창고업체
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, userType: 'customer' }))}
                  className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${formData.userType === 'customer'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Users className="w-5 h-5 mr-2" />
                  고객사
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="이메일 또는 아이디를 입력하세요"
                />
              </div>
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
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
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

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">계정이 없으신가요?</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsSignupModalOpen(true)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                회원가입하기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 회원가입 모달 */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSelectWarehouse={handleWarehouseSignup}
        onSelectCustomer={handleCustomerSignup}
      />
    </div>
  );
};

export default Login;


