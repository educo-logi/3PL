import React, { useState, useEffect } from 'react';
import { Menu, X, LogIn, UserPlus, Search, Building2, UserCheck, Plus, User, LogOut, Bell } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import SignupModal from './SignupModal';
import NotificationCenter from './NotificationCenter';
import WelcomeEventPopup from './WelcomeEventPopup';
import { checkAndGrantWelcomePass } from '../utils/viewingPassUtils';
import { getUnreadNotificationCount } from '../utils/notificationUtils';
import { trackEvent, GA_EVENTS } from '../utils/gtm';
import { logout as authLogout } from '../utils/authService';
import { isApp } from '../utils/platform';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isWelcomePopupOpen, setIsWelcomePopupOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const isInApp = isApp();

  // 로그인 상태 확인
  useEffect(() => {
    console.log("Navigator User Agent:", navigator.userAgent);

    const checkUserStatus = () => {
      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      const admin = localStorage.getItem('adminAuth');
      setCurrentUser(user);
      setIsAdmin(!!admin);
    };

    // 초기 로드 시 확인
    checkUserStatus();

    // localStorage 변화 감지를 위한 이벤트 리스너
    const handleStorageChange = (e) => {
      if (e.key === 'currentUser') {
        checkUserStatus();
      }
    };

    // storage 이벤트 리스너 등록 (다른 탭에서의 변화 감지)
    window.addEventListener('storage', handleStorageChange);

    // 페이지 포커스 시 상태 확인 (같은 탭에서의 변화 감지)
    const handleFocus = () => {
      checkUserStatus();
    };
    window.addEventListener('focus', handleFocus);

    // 커스텀 로그아웃 이벤트 감지
    const handleUserLogout = () => {
      checkUserStatus();
    };
    window.addEventListener('userLogout', handleUserLogout);

    // 커스텀 로그인 이벤트 감지
    const handleUserLogin = async () => {
      checkUserStatus();

      try {
        const welcomeResult = await checkAndGrantWelcomePass();
        if (welcomeResult && welcomeResult.success) {
          setIsWelcomePopupOpen(true);
        }
      } catch (err) {
        console.error('Welcome pass grant error on login:', err);
      }
    };
    window.addEventListener('userLogin', handleUserLogin);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('userLogout', handleUserLogout);
      window.removeEventListener('userLogin', handleUserLogin);
    };
  }, []);

  // 알림 개수 확인
  useEffect(() => {
    const updateUnreadCount = async () => {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count || 0);
    };

    updateUnreadCount();
    const interval = setInterval(updateUnreadCount, 5000); // 5초마다 확인

    return () => clearInterval(interval);
  }, [currentUser]);

  // 로그아웃 함수 (Supabase Auth + localStorage 정리)
  const handleLogout = async () => {
    await authLogout(); // Supabase Auth signOut + localStorage 정리
    setCurrentUser(null);
    setIsAdmin(false);

    trackEvent(GA_EVENTS.LOGOUT_CLICK);
    navigate('/');
  };

  // 마이페이지 이동 함수
  const handleMyPageClick = () => {
    navigate('/mypage');
  };

  const handleSignupClick = () => {
    trackEvent(GA_EVENTS.SIGNUP_CLICK);
    setIsSignupModalOpen(true);
  };

  const handleWarehouseSignup = () => {
    setIsSignupModalOpen(false);
    navigate('/warehouse-register');
  };

  const handleCustomerSignup = () => {
    setIsSignupModalOpen(false);
    navigate('/customer-register');
  };

  const handleLoginClick = () => {
    trackEvent(GA_EVENTS.LOGIN_CLICK);
    navigate('/login');
  };

  const navItems = [
    { href: '/warehouse-search', label: '창고 찾기', icon: Search },
    { href: '/customer-search', label: '고객사 찾기', icon: Building2 },
    { href: '/warehouse-register', label: '창고 등록', icon: Plus },
    { href: '/customer-register', label: '고객사 등록', icon: UserCheck },
  ];

  return (
    <>
      <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 로고 */}
            <div className="flex-shrink-0">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">33PL</span>
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      Platform
                    </h1>
                    {isInApp && (
                      <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-md font-black border border-blue-200">
                        APP
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* 데스크톱 네비게이션 */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="group flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                  >
                    <Icon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>


            {/* Admin Indicator & Logout */}
            {isAdmin && (
              <div className="hidden md:flex items-center space-x-3">
                <div className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-bold shadow-sm flex items-center">
                  <UserCheck className="w-4 h-4 mr-1" />
                  관리자 모드
                </div>
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="group flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                >
                  <Building2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  대시보드
                </button>
                <button
                  onClick={handleLogout}
                  className="group flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  관리자 로그아웃
                </button>
              </div>
            )}

            {/* 로그인/회원가입 또는 마이페이지 버튼 (일반 사용자용) */}
            <div className="hidden md:flex items-center space-x-3">
              {!isAdmin && (currentUser ? (
                <>
                  <button
                    onClick={() => setIsNotificationCenterOpen(true)}
                    className="relative group flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
                  >
                    <Bell className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    알림
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleMyPageClick}
                    className="group flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
                  >
                    <User className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    마이페이지
                  </button>
                  <button
                    onClick={handleLogout}
                    className="group flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    로그아웃
                  </button>
                </>
              ) : (
                <>

                  <button
                    onClick={handleLoginClick}
                    className="group flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
                  >
                    <LogIn className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    로그인
                  </button>
                  <button
                    onClick={handleSignupClick}
                    className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <UserPlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    회원가입
                  </button>
                </>
              ))}
            </div>

            {/* 모바일 메뉴 버튼 */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* 모바일 메뉴 */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-sm border-t border-gray-100">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="group flex items-center px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  {currentUser ? (
                    <>
                      <button
                        onClick={() => {
                          setIsNotificationCenterOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="relative group flex items-center text-gray-700 hover:text-blue-600 w-full px-3 py-3 text-base font-medium hover:bg-gray-50 rounded-xl transition-all duration-200"
                      >
                        <Bell className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                        알림
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          handleMyPageClick();
                          setIsMenuOpen(false);
                        }}
                        className="group flex items-center text-gray-700 hover:text-blue-600 w-full px-3 py-3 text-base font-medium hover:bg-gray-50 rounded-xl transition-all duration-200 mt-2"
                      >
                        <User className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                        마이페이지
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="group flex items-center text-gray-700 hover:text-red-600 w-full px-3 py-3 text-base font-medium hover:bg-red-50 rounded-xl transition-all duration-200 mt-2"
                      >
                        <LogOut className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                        로그아웃
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          handleLoginClick();
                          setIsMenuOpen(false);
                        }}
                        className="group flex items-center text-gray-700 hover:text-blue-600 w-full px-3 py-3 text-base font-medium hover:bg-gray-50 rounded-xl transition-all duration-200"
                      >
                        <LogIn className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                        로그인
                      </button>
                      <button
                        onClick={() => {
                          handleSignupClick();
                          setIsMenuOpen(false);
                        }}
                        className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white w-full px-4 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 mt-2 flex items-center justify-center shadow-lg"
                      >
                        <UserPlus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                        회원가입
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </header>

      {/* 회원가입 모달 */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSelectWarehouse={handleWarehouseSignup}
        onSelectCustomer={handleCustomerSignup}
      />

      {/* 알림 센터 */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />

      {/* 웰컴 이벤트 팝업 (임시) */}
      <WelcomeEventPopup
        isOpen={isWelcomePopupOpen}
        onClose={() => setIsWelcomePopupOpen(false)}
      />


    </>
  );
};

export default Header;
