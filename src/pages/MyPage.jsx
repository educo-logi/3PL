import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, ArrowLeft, Star, Clock } from 'lucide-react';
import { getViewingPassInfo, getUsageHistory, getUsageStatistics, getFavorites, getRecentViewedItems } from '../utils/viewingPassUtils';
import { supabase } from '../utils/supabaseClient';
import UserInfoCard from '../components/mypage/UserInfoCard';
import ViewingPassSection from '../components/mypage/ViewingPassSection';
import UsageStats from '../components/mypage/UsageStats';

const MyPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [viewingPassInfo, setViewingPassInfo] = useState(null);
  const [usageHistory, setUsageHistory] = useState([]);
  const [usageStatistics, setUsageStatistics] = useState(null);

  const navigate = useNavigate();

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. 비로그인 처리
    if (!user) {
      const localUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!localUser) {
        navigate('/login');
        return;
      }
      // 세션 만료 시 로그인 페이지로 리다이렉트
      navigate('/login');
      return;
    }

    const userId = user.id;
    const meta = user.user_metadata || {};
    const userType = meta.userType || 'customer';

    let dbStatus = 'pending';
    let dbData = {};

    // 2. DB에서 최신 상태 조회 (SSOT)
    try {
      if (userType === 'warehouse') {
        const { data: w } = await supabase
          .from('warehouses')
          .select('status, company_name, location')
          .eq('owner_id', userId)
          .maybeSingle();
        if (w) {
          dbStatus = w.status;
          dbData = {
            companyName: w.company_name,
            location: w.location
          };
        }
      } else {
        const { data: c } = await supabase
          .from('customers')
          .select('status, company_name, location')
          .eq('owner_id', userId)
          .maybeSingle();
        if (c) {
          dbStatus = c.status;
          dbData = {
            companyName: c.company_name,
            location: c.location
          };
        }
      }
    } catch (err) {
      console.warn('상태 조회 중 오류:', err);
    }

    // 3. 사용자 객체 구성
    const baseUser = {
      id: userId,
      email: user.email,
      userType: userType,
      status: dbStatus, // DB 값 우선
      companyName: dbData.companyName || meta.companyName || '이름 없음',
      location: dbData.location || meta.location || '',
      ...meta,
      ...dbData // DB 데이터 덮어쓰기
    };

    setCurrentUser(baseUser);

    // 로컬 스토리지 업데이트 (캐시 최신화)
    localStorage.setItem('currentUser', JSON.stringify(baseUser));

    // 비동기 데이터 로드
    const [passInfo, usageHist, usageStat] = await Promise.all([
      getViewingPassInfo(),
      getUsageHistory(),
      getUsageStatistics(),
    ]);

    setViewingPassInfo(passInfo);
    setUsageHistory(usageHist || []);
    setUsageStatistics(usageStat);
  };

  useEffect(() => {
    loadData();

    // 이벤트 리스너: 다른 곳에서 토큰 구매 등이 일어나면 갱신
    const handleRefresh = () => loadData();
    window.addEventListener('refreshMyPage', handleRefresh);
    return () => window.removeEventListener('refreshMyPage', handleRefresh);
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminAuth');
    setCurrentUser(null);
    window.dispatchEvent(new CustomEvent('userLogout'));
    navigate('/');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isWarehouse = currentUser.userType === 'warehouse';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            홈으로 돌아가기
          </button>
          <div className="flex items-center">
            <div className="bg-primary-600 p-3 rounded-full mr-4">
              {isWarehouse ? (
                <Building2 className="w-8 h-8 text-white" />
              ) : (
                <Users className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">마이페이지</h1>
              <p className="text-gray-600">
                {isWarehouse ? '창고업체' : '고객사'} 정보를 확인하고 관리하세요
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽 컬럼: 프로필 요약 & 열람권 */}
          <div className="lg:col-span-1 space-y-6">
            <UserInfoCard
              currentUser={currentUser}
              isWarehouse={isWarehouse}
              onUpdate={loadData}
              onLogout={handleLogout}
            />

            <ViewingPassSection
              viewingPassInfo={viewingPassInfo}
              usageHistory={usageHistory || []}
              onRefresh={loadData}
            />
          </div>

          {/* 오른쪽 컬럼: 통계 및 빠른 링크 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 통계 컴포넌트 */}
            {usageStatistics && <UsageStats usageStatistics={usageStatistics} />}

            {/* 빠른 링크 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">빠른 링크</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/favorites')}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                >
                  <div className="flex items-center">
                    <div className="bg-yellow-100 p-2 rounded-full mr-3">
                      <Star className="w-5 h-5 text-yellow-600" />
                    </div>
                    <span className="font-semibold text-gray-700">즐겨찾기 목록</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>

                <button
                  onClick={() => navigate('/recent-viewed')}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                >
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-semibold text-gray-700">최근 본 업체</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </div>

            {/* 안내사항 */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
              <h4 className="text-sm font-bold text-blue-900 mb-2">💡 이용 안내</h4>
              <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                <li>한번 열람한 업체는 다시 조회해도 열람권이 소진되지 않습니다.</li>
                <li>열람권 유효기간은 구매일로부터 3개월입니다.</li>
                <li>프리미엄 회원은 상단 노출 혜택을 받을 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
