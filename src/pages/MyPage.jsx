import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, Users, Edit, LogOut, ArrowLeft, Save, X, CreditCard, Calendar, Eye, Map, Phone, Mail, Package, Truck, Monitor, Box, Snowflake, Thermometer, CheckCircle2, Layers, Archive, Activity, Briefcase, MapPin } from 'lucide-react';
import { regions, detailedRegions, dongData } from '../data/sampleData';
import { getViewingPassInfo, getUsageHistory, getRemainingDays, getUsageStatistics, getItemDetail } from '../utils/viewingPassUtils';

import DetailModal from '../components/DetailModal';
import ProfileEditModal from '../components/mypage/ProfileEditModal';
import UserInfoCard from '../components/mypage/UserInfoCard';
import { supabase } from '../utils/supabaseClient';
import { Star, Clock } from 'lucide-react';

const MyPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({});
  const [viewingPassInfo, setViewingPassInfo] = useState(null);
  const [usageHistory, setUsageHistory] = useState([]);
  const [usageStatistics, setUsageStatistics] = useState(null);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);

  // 상세 모달 상태
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) {
      navigate('/login');
      return;
    }

    // 로컬 스토리지 정보로 우선 세팅 (빠른 렌더링)
    setCurrentUser(user);

    // DB에서 최신 유저 정보 조회 (싱크 맞추기)
    const fetchFreshUserData = async () => {
      const table = user.userType === 'warehouse' ? 'warehouses' : 'customers';
      const { data, error } = await supabase.from(table).select('*').eq('id', user.id).single();
      if (data && !error) {
        // 중요: 로컬 스토리지도 갱신해줘야 다른 페이지에서도 최신 정보 사용
        // 단, userType은 DB에 없을 수 있으므로 기존 것 유지
        const mergedUser = { ...data, userType: user.userType };
        localStorage.setItem('currentUser', JSON.stringify(mergedUser));
        setCurrentUser(mergedUser);
      }
    };
    fetchFreshUserData();

    // 열람권 정보 로드
    const loadData = async () => {
      const passInfo = await getViewingPassInfo();
      setViewingPassInfo(passInfo);
      const history = await getUsageHistory();
      setUsageHistory(history);
      setUsageStatistics(getUsageStatistics());
    };
    loadData();
  }, [navigate]);

  // 열람권 정보 새로고침
  const refreshViewingPassInfo = async () => {
    const passInfo = await getViewingPassInfo();
    setViewingPassInfo(passInfo);
    const history = await getUsageHistory();
    setUsageHistory(history);
    setUsageStatistics(getUsageStatistics());
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminAuth'); // 관리자 인증 정보도 제거
    setCurrentUser(null);

    // 커스텀 이벤트 발생시켜 Header에 알림
    window.dispatchEvent(new CustomEvent('userLogout'));

    navigate('/');
  };

  const handleEditProfile = () => {
    if (currentUser?.userType === 'warehouse') {
      navigate('/warehouse-register');
    } else {
      navigate('/customer-register');
    }
  };

  // 편집 시작
  const startEdit = (section) => {
    setEditingSection(section);
    setEditData({ ...currentUser });
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingSection(null);
    setEditData({});
  };

  // 편집 저장
  const saveEdit = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map(user =>
      user.id === currentUser.id ? { ...user, ...editData } : user
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, ...editData }));
    setCurrentUser({ ...currentUser, ...editData });
    setEditingSection(null);
    setEditData({});
  };

  // 입력 필드 변경
  const handleInputChange = (field, value) => {
    setEditData(prev => {
      const newData = { ...prev, [field]: value };

      // 지역이 변경되면 세부지역과 동을 초기화
      if (field === 'location') {
        newData.city = '';
        newData.dong = '';
      }
      // 세부지역이 변경되면 동을 초기화
      else if (field === 'city') {
        newData.dong = '';
      }

      return newData;
    });
  };

  // 체크박스 변경 (배열 필드용)
  const handleCheckboxChange = (field, value, checked) => {
    setEditData(prev => ({
      ...prev,
      [field]: checked
        ? [...(prev[field] || []), value]
        : (prev[field] || []).filter(item => item !== value)
    }));
  };

  // 사용 내역 아이템 클릭 핸들러
  const handleHistoryItemClick = async (item) => {
    try {
      const detailData = await getItemDetail(item.item_id, item.itemType);
      if (detailData) {
        // 모달에서 type 구분을 위해 필드 추가
        setSelectedHistoryItem({
          ...detailData,
          itemTypeForModal: item.itemType
        });
        setIsDetailModalOpen(true);
      } else {
        alert('업체 정보를 찾을 수 없습니다. (삭제되었거나 정보가 없습니다)');
      }
    } catch (error) {
      console.error('Failed to load item detail:', error);
      alert('정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const isWarehouse = currentUser.userType === 'warehouse' || currentUser.user_type === 'warehouse';

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
          {/* 프로필 카드 */}
          <div className="lg:col-span-1 space-y-6">
            <UserInfoCard
              currentUser={currentUser}
              isWarehouse={isWarehouse}
              onEdit={() => setIsProfileEditModalOpen(true)}
              onLogout={handleLogout}
            />

            {/* 열람권 정보 (Left Column) */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <CreditCard className="w-5 h-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">열람권 정보</h3>
              </div>

              {viewingPassInfo ? (
                <>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">보유 중</span>
                      <span className="text-2xl font-bold text-primary-600">
                        {viewingPassInfo.remaining_count}회
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">유효기간</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(viewingPassInfo.expires_at).toLocaleDateString('ko-KR')}까지
                      </span>
                    </div>
                    {getRemainingDays(viewingPassInfo) > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        (약 {Math.ceil(getRemainingDays(viewingPassInfo) / 30)}개월 {getRemainingDays(viewingPassInfo) % 30}일 남음)
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      navigate('/payment');
                      refreshViewingPassInfo();
                    }}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center mb-3"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    열람권 구매하기
                  </button>

                  <button
                    onClick={() => {
                      // 현재 사용자의 업체 정보 가져오기
                      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
                      if (!user) {
                        navigate('/login');
                        return;
                      }

                      // 사용자 타입에 따라 아이템 ID 찾기
                      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
                      const latestUser = allUsers.find(u => u.id === user.id) || user;

                      if (latestUser.userType === 'warehouse') {
                        const approvedWarehouses = JSON.parse(localStorage.getItem('approvedWarehouses') || '[]');
                        const pendingWarehouses = JSON.parse(localStorage.getItem('pendingWarehouses') || '[]');
                        const warehouseData = JSON.parse(localStorage.getItem('warehouseData') || '[]');
                        const allWarehouses = [...approvedWarehouses, ...pendingWarehouses, ...warehouseData];
                        let warehouse = allWarehouses.find(w => (w.email && w.email === latestUser.email) || (w.id && w.id === latestUser.id));
                        if (!warehouse) warehouse = latestUser;
                        if (warehouse && warehouse.id) {
                          navigate(`/premium-apply?type=warehouse&itemId=${warehouse.id}`);
                        } else {
                          alert('업체 정보를 찾을 수 없습니다.');
                        }
                      } else if (latestUser.userType === 'customer') {
                        const approvedCustomers = JSON.parse(localStorage.getItem('approvedCustomers') || '[]');
                        const pendingCustomers = JSON.parse(localStorage.getItem('pendingCustomers') || '[]');
                        const customerData = JSON.parse(localStorage.getItem('customerData') || '[]');
                        const allCustomers = [...approvedCustomers, ...pendingCustomers, ...customerData];
                        let customer = allCustomers.find(c => (c.email && c.email === latestUser.email) || (c.id && c.id === latestUser.id));
                        if (!customer) customer = latestUser;
                        if (customer && customer.id) {
                          navigate(`/premium-apply?type=customer&itemId=${customer.id}`);
                        } else {
                          alert('업체 정보를 찾을 수 없습니다.');
                        }
                      } else {
                        alert('업체 타입을 확인할 수 없습니다.');
                      }
                    }}
                    className="w-full bg-secondary-500 text-white py-2 px-4 rounded-lg hover:bg-secondary-600 transition-colors flex items-center justify-center mb-4"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    프리미엄 신청하기
                  </button>

                  {/* 안내사항 */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">안내사항</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• 한번 본 업체는 다시 봐도 열람권이 소진되지 않습니다.</li>
                      <li>• 유효기간(3개월)이 지나면 열람권이 만료됩니다.</li>
                      <li>• 만료된 열람권은 사용할 수 없습니다.</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">보유 중인 열람권이 없습니다.</p>
                  <button
                    onClick={() => navigate('/payment')}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center mb-3"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    열람권 구매하기
                  </button>
                </div>
              )}
            </div>


          </div>
          {/* End Left Column Container */}

          {/* Right Column (Usage History, Stats, Details) */}
          <div className="lg:col-span-2 space-y-6">

            {/* 사용 내역 & 통계 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">사용 현황</h3>

              {/* 사용 내역 리스트 */}
              {usageHistory.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    최근 열람 내역
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
                    {usageHistory.slice(0, 10).map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => handleHistoryItemClick(item)}>
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.itemName}
                            <span className="ml-2 text-xs text-gray-500 bg-white border px-1.5 py-0.5 rounded">
                              {item.itemType === 'warehouse' ? '창고' : '고객사'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{new Date(item.date).toLocaleDateString('ko-KR')} 열람</div>
                        </div>
                        <div className="flex items-center text-sm font-semibold text-primary-600">
                          {item.countUsed}회 차감
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-6">아직 사용 내역이 없습니다.</p>
              )}

              {/* 통계 그래프 */}
              {usageStatistics && usageStatistics.totalUsed > 0 && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">사용 통계</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 유형별 */}
                    <div>
                      <p className="text-xs text-gray-600 mb-2">업체 유형별 비율</p>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>창고 ({usageStatistics.itemTypeStats.warehouse}회)</span>
                            <span className="font-bold text-blue-600">{Math.round((usageStatistics.itemTypeStats.warehouse / usageStatistics.totalUsed) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(usageStatistics.itemTypeStats.warehouse / usageStatistics.totalUsed) * 100}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>고객사 ({usageStatistics.itemTypeStats.customer}회)</span>
                            <span className="font-bold text-green-600">{Math.round((usageStatistics.itemTypeStats.customer / usageStatistics.totalUsed) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${(usageStatistics.itemTypeStats.customer / usageStatistics.totalUsed) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 월별 차트 */}
                    {usageStatistics.monthlyUsage.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-600 mb-2">월별 추이</p>
                        <div className="flex items-end justify-between h-20 gap-2">
                          {usageStatistics.monthlyUsage.map((month, index) => {
                            const maxCount = Math.max(...usageStatistics.monthlyUsage.map(m => m.count), 1);
                            const height = Math.max((month.count / maxCount) * 100, 10);
                            return (
                              <div key={index} className="flex-1 flex flex-col items-center group">
                                <div
                                  className="w-full bg-primary-200 group-hover:bg-primary-500 rounded-t transition-colors relative"
                                  style={{ height: `${height}%` }}
                                >
                                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {month.count}회
                                  </div>
                                </div>
                                <span className="text-[10px] text-gray-500 mt-1">{month.month.split('-')[1]}월</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">상세 정보</h3>
                <button
                  onClick={() => setIsProfileEditModalOpen(true)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-transparent"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  정보 수정
                </button>
              </div>

              <div className="space-y-8 divide-y divide-gray-100">
                {/* 1. 기본 정보 (Web Graphic Style) */}
                <div className="pt-4 first:pt-0">
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <User className="w-6 h-6 mr-2 text-primary-600" />
                    기본 정보
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 회사명 */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center space-x-4 hover:shadow-md transition duration-200">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-0.5">회사명</p>
                        <p className="text-base font-bold text-gray-900">{currentUser.companyName || currentUser.company_name}</p>
                      </div>
                    </div>
                    {/* 대표자명 */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center space-x-4 hover:shadow-md transition duration-200">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-0.5">대표자명</p>
                        <p className="text-base font-bold text-gray-900">{currentUser.representative}</p>
                      </div>
                    </div>
                    {/* 대표 전화번호 */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center space-x-4 hover:shadow-md transition duration-200">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-0.5">대표 전화번호</p>
                        <p className="text-base font-bold text-gray-900">{currentUser.phone}</p>
                      </div>
                    </div>
                    {/* 이메일 */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center space-x-4 hover:shadow-md transition duration-200">
                      <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-0.5">이메일</p>
                        <p className="text-base font-bold text-gray-900 break-all">{currentUser.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. 주소 정보 (Web Graphic Style) */}
                <div className="pt-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <MapPin className="w-6 h-6 mr-2 text-primary-600" />
                    사업장 주소
                  </h4>
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <Map className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-1">상세 주소</p>
                      <p className="text-lg font-bold text-gray-900">
                        {currentUser.location} {currentUser.city} {currentUser.dong} {currentUser.detail_address || currentUser.detailAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. 상세 정보 (창고 vs 고객사 구분) */}
                {isWarehouse ? (
                  // 창고업체 정보
                  // 창고업체 정보 (Web Graphic Style)
                  <div className="pt-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <Building2 className="w-6 h-6 mr-2 text-primary-600" />
                      시설 및 운영 정보
                    </h4>

                    {/* 1. 시설 스펙 (4 Grid) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-primary-300 hover:bg-primary-50 transition duration-200 group">
                        <div className="p-2 bg-gray-50 rounded-full mb-3 group-hover:bg-white transition">
                          <Map className="w-6 h-6 text-gray-400 group-hover:text-primary-600 transition" />
                        </div>
                        <p className="text-xs text-gray-500 mb-1">대지면적</p>
                        <p className="text-lg font-bold text-gray-800 group-hover:text-primary-600 transition">
                          {currentUser.landArea ? `${Number(currentUser.landArea).toLocaleString()} ㎡` : '-'}
                        </p>
                      </div>
                      <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-blue-300 hover:bg-blue-50 transition duration-200 group">
                        <div className="p-2 bg-gray-50 rounded-full mb-3 group-hover:bg-white transition">
                          <Archive className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition" />
                        </div>
                        <p className="text-xs text-gray-500 mb-1">창고 연면적</p>
                        <p className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition">
                          {currentUser.totalWarehouseArea ? `${Number(currentUser.totalWarehouseArea).toLocaleString()} ㎡` : '-'}
                        </p>
                      </div>
                      <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-green-300 hover:bg-green-50 transition duration-200 group">
                        <div className="p-2 bg-gray-50 rounded-full mb-3 group-hover:bg-white transition">
                          <CheckCircle2 className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition" />
                        </div>
                        <p className="text-xs text-gray-500 mb-1">계약 가능 면적</p>
                        <p className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition">
                          {currentUser.availableArea ? `${Number(currentUser.availableArea).toLocaleString()} ㎡` : '-'}
                        </p>
                      </div>
                      <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-orange-300 hover:bg-orange-50 transition duration-200 group">
                        <div className="p-2 bg-gray-50 rounded-full mb-3 group-hover:bg-white transition">
                          <Layers className="w-6 h-6 text-gray-400 group-hover:text-orange-600 transition" />
                        </div>
                        <p className="text-xs text-gray-500 mb-1">보유 파렛트</p>
                        <p className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition">
                          {currentUser.palletCount ? `${Number(currentUser.palletCount).toLocaleString()} PLT` : '-'}
                        </p>
                      </div>
                    </div>

                    {/* 2. 운영 정보 카드 (2 Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 보관 방식 */}
                      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                            <Snowflake className="w-6 h-6" />
                          </div>
                          <h5 className="text-lg font-bold text-gray-800">보관 방식</h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.storageTypes && currentUser.storageTypes.length > 0 ? (
                            currentUser.storageTypes.map((type, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100 flex items-center">
                                {type === '냉동' || type === '냉장' ? <Snowflake className="w-3 h-3 mr-1" /> : <Thermometer className="w-3 h-3 mr-1" />}
                                {type}
                              </span>
                            ))
                          ) : <span className="text-gray-400 text-sm">-</span>}
                        </div>
                      </div>

                      {/* 사용 배송사 */}
                      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 mr-3">
                            <Truck className="w-6 h-6" />
                          </div>
                          <h5 className="text-lg font-bold text-gray-800">사용 배송사</h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.deliveryCompanies && currentUser.deliveryCompanies.length > 0 ? (
                            currentUser.deliveryCompanies.map((item, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-100">
                                {item}
                              </span>
                            ))
                          ) : <span className="text-gray-400 text-sm">-</span>}
                          {currentUser.otherDeliveryCompany && (
                            <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-100">
                              {currentUser.otherDeliveryCompany}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 사용 솔루션 */}
                      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                            <Monitor className="w-6 h-6" />
                          </div>
                          <h5 className="text-lg font-bold text-gray-800">사용 솔루션</h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.solutions && currentUser.solutions.length > 0 ? (
                            currentUser.solutions.map((item, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-100">
                                {item}
                              </span>
                            ))
                          ) : <span className="text-gray-400 text-sm">-</span>}
                          {currentUser.otherSolution && (
                            <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-100">
                              {currentUser.otherSolution}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 취급 품목 */}
                      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 mr-3">
                            <Package className="w-6 h-6" />
                          </div>
                          <h5 className="text-lg font-bold text-gray-800">취급 품목</h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.products && currentUser.products.length > 0 ? (
                            currentUser.products.map((item, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-100">
                                {item}
                              </span>
                            ))
                          ) : <span className="text-gray-400 text-sm">-</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 고객사 정보
                  // 고객사 정보 (Web Graphic Style)
                  <div className="pt-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <Building2 className="w-6 h-6 mr-2 text-primary-600" />
                      물류 요구 사항
                    </h4>

                    {/* 1. 시설 스펙 (3 Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-300 hover:bg-blue-50 transition duration-200 group">
                        <div className="p-3 bg-gray-50 rounded-full mb-4 group-hover:bg-white transition">
                          <Map className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition" />
                        </div>
                        <p className="text-sm text-gray-500 mb-1">필요 면적</p>
                        <p className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition">
                          {currentUser.requiredArea ? `${Number(currentUser.requiredArea).toLocaleString()} ㎡` : '-'}
                        </p>
                      </div>

                      <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-purple-300 hover:bg-purple-50 transition duration-200 group">
                        <div className="p-3 bg-gray-50 rounded-full mb-4 group-hover:bg-white transition">
                          <Activity className="w-8 h-8 text-gray-400 group-hover:text-purple-600 transition" />
                        </div>
                        <p className="text-sm text-gray-500 mb-1">월 평균 출고량</p>
                        <p className="text-2xl font-bold text-gray-800 group-hover:text-purple-600 transition">
                          {currentUser.monthlyVolume ? `${Number(currentUser.monthlyVolume).toLocaleString()} 건` : '-'}
                        </p>
                      </div>

                      <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-orange-300 hover:bg-orange-50 transition duration-200 group">
                        <div className="p-3 bg-gray-50 rounded-full mb-4 group-hover:bg-white transition">
                          <Layers className="w-8 h-8 text-gray-400 group-hover:text-orange-600 transition" />
                        </div>
                        <p className="text-sm text-gray-500 mb-1">보관 파렛트</p>
                        <p className="text-2xl font-bold text-gray-800 group-hover:text-orange-600 transition">
                          {currentUser.palletCount ? `${Number(currentUser.palletCount).toLocaleString()} PLT` : '-'}
                        </p>
                      </div>
                    </div>

                    {/* 2. 취급 품목 (Graphic Card) */}
                    <div>
                      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 mr-3">
                            <Package className="w-6 h-6" />
                          </div>
                          <h5 className="text-lg font-bold text-gray-800">취급 품목</h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.products && currentUser.products.length > 0 ? (
                            currentUser.products.map((item, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-100 flex items-center">
                                <Box className="w-3 h-3 mr-1.5" />
                                {item}
                              </span>
                            ))
                          ) : <span className="text-gray-400 text-sm">-</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 상세 정보 모달 */}
      {
        selectedHistoryItem && (
          <DetailModal
            isOpen={isDetailModalOpen}
            data={selectedHistoryItem}
            type={selectedHistoryItem.itemTypeForModal}
            onClose={() => setIsDetailModalOpen(false)}
          />
        )
      }

      {/* 프로필 수정 모달 */}
      <ProfileEditModal
        isOpen={isProfileEditModalOpen}
        onClose={() => setIsProfileEditModalOpen(false)}
        currentUser={currentUser}
        onUpdate={() => {
          // 업데이트 후 데이터 갱신 (리로딩)
          const fetchFreshUserData = async () => {
            const table = currentUser.userType === 'warehouse' ? 'warehouses' : 'customers';
            const { data } = await supabase.from(table).select('*').eq('id', currentUser.id).single();
            if (data) {
              const mergedUser = { ...data, userType: currentUser.userType };
              localStorage.setItem('currentUser', JSON.stringify(mergedUser));
              setCurrentUser(mergedUser);
            }
          };
          fetchFreshUserData();
        }}
      />
    </div >
  );
};

export default MyPage;

