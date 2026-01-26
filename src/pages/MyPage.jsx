import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, Users, Edit, LogOut, ArrowLeft, Save, X, CreditCard, Calendar, Eye } from 'lucide-react';
import { regions, detailedRegions, dongData } from '../data/sampleData';
import { getViewingPassInfo, getUsageHistory, getRemainingDays, getUsageStatistics } from '../utils/viewingPassUtils';
import { Star, Clock } from 'lucide-react';

const MyPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({});
  const [viewingPassInfo, setViewingPassInfo] = useState(null);
  const [usageHistory, setUsageHistory] = useState([]);
  const [usageStatistics, setUsageStatistics] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    
    // 열람권 정보 로드
    const passInfo = getViewingPassInfo();
    setViewingPassInfo(passInfo);
    setUsageHistory(getUsageHistory());
    setUsageStatistics(getUsageStatistics());
  }, [navigate]);

  // 열람권 정보 새로고침
  const refreshViewingPassInfo = () => {
    const passInfo = getViewingPassInfo();
    setViewingPassInfo(passInfo);
    setUsageHistory(getUsageHistory());
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
          {/* 프로필 카드 */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {currentUser.companyName}
                </h2>
                <p className="text-gray-600 mb-4">
                  {isWarehouse ? '창고업체' : '고객사'}
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃
                  </button>
                </div>
              </div>
            </div>

            {/* 열람권 정보 */}
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
                        {viewingPassInfo.remainingCount}회
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">유효기간</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(viewingPassInfo.expiryDate).toLocaleDateString('ko-KR')}까지
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
                        // 창고인 경우
                        // 승인된 창고, 대기 중인 창고, 샘플 데이터 모두 확인
                        const approvedWarehouses = JSON.parse(localStorage.getItem('approvedWarehouses') || '[]');
                        const pendingWarehouses = JSON.parse(localStorage.getItem('pendingWarehouses') || '[]');
                        const warehouseData = JSON.parse(localStorage.getItem('warehouseData') || '[]');
                        
                        const allWarehouses = [
                          ...approvedWarehouses,
                          ...pendingWarehouses,
                          ...warehouseData
                        ];
                        
                        // 이메일 또는 ID로 찾기
                        let warehouse = allWarehouses.find(w => 
                          (w.email && w.email === latestUser.email) || 
                          (w.id && w.id === latestUser.id)
                        );
                        
                        // 찾지 못한 경우, users 배열에서 직접 사용
                        if (!warehouse) {
                          warehouse = latestUser;
                        }
                        
                        if (warehouse && warehouse.id) {
                          navigate(`/premium-apply?type=warehouse&itemId=${warehouse.id}`);
                        } else {
                          alert('업체 정보를 찾을 수 없습니다.');
                        }
                      } else if (latestUser.userType === 'customer') {
                        // 고객사인 경우
                        // 승인된 고객사, 대기 중인 고객사, 샘플 데이터 모두 확인
                        const approvedCustomers = JSON.parse(localStorage.getItem('approvedCustomers') || '[]');
                        const pendingCustomers = JSON.parse(localStorage.getItem('pendingCustomers') || '[]');
                        const customerData = JSON.parse(localStorage.getItem('customerData') || '[]');
                        
                        const allCustomers = [
                          ...approvedCustomers,
                          ...pendingCustomers,
                          ...customerData
                        ];
                        
                        // 이메일 또는 ID로 찾기
                        let customer = allCustomers.find(c => 
                          (c.email && c.email === latestUser.email) || 
                          (c.id && c.id === latestUser.id)
                        );
                        
                        // 찾지 못한 경우, users 배열에서 직접 사용
                        if (!customer) {
                          customer = latestUser;
                        }
                        
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

                  {/* 사용 내역 */}
                  {usageHistory.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        사용 내역
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {usageHistory.slice(0, 5).map((item, index) => (
                          <div key={index} className="text-xs text-gray-600 border-b pb-2 last:border-0">
                            <div className="flex justify-between">
                              <span>{new Date(item.date).toLocaleDateString('ko-KR')}</span>
                              <span className="text-gray-400">{item.countUsed}회</span>
                            </div>
                            <div className="text-gray-700 font-medium mt-1">
                              {item.itemName} ({item.itemType === 'warehouse' ? '창고' : '고객사'})
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        총 사용: {usageHistory.reduce((sum, item) => sum + item.countUsed, 0)}회 / 구매: {viewingPassInfo.totalCount}회
                      </div>
                    </div>
                  )}

                  {/* 사용 통계 */}
                  {usageStatistics && usageStatistics.totalUsed > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">사용 통계</h4>
                      
                      {/* 업체 유형별 통계 */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-600 mb-2">업체 유형별 사용량</p>
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-700">창고</span>
                              <span className="font-semibold">{usageStatistics.itemTypeStats.warehouse}회</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${usageStatistics.totalUsed > 0 ? (usageStatistics.itemTypeStats.warehouse / usageStatistics.totalUsed) * 100 : 0}%`
                                }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-700">고객사</span>
                              <span className="font-semibold">{usageStatistics.itemTypeStats.customer}회</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                  width: `${usageStatistics.totalUsed > 0 ? (usageStatistics.itemTypeStats.customer / usageStatistics.totalUsed) * 100 : 0}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 월별 사용량 차트 */}
                      {usageStatistics.monthlyUsage.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-600 mb-2">월별 사용량</p>
                          <div className="flex items-end justify-between h-24 gap-1">
                            {usageStatistics.monthlyUsage.map((month, index) => {
                              const maxCount = Math.max(...usageStatistics.monthlyUsage.map(m => m.count), 1);
                              const height = (month.count / maxCount) * 100;
                              return (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                  <div
                                    className="w-full bg-primary-600 rounded-t transition-all hover:bg-primary-700"
                                    style={{ height: `${height}%` }}
                                    title={`${month.month}: ${month.count}회`}
                                  ></div>
                                  <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                                    {month.month.split('-')[1]}월
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 빠른 링크 */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">빠른 링크</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => navigate('/favorites')}
                        className="w-full flex items-center justify-between p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-2 text-yellow-500" />
                          즐겨찾기
                        </div>
                        <span className="text-gray-400">→</span>
                      </button>
                      <button
                        onClick={() => navigate('/recent-viewed')}
                        className="w-full flex items-center justify-between p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-primary-600" />
                          최근 본 업체
                        </div>
                        <span className="text-gray-400">→</span>
                      </button>
                    </div>
                  </div>

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
                        // 창고인 경우
                        // 승인된 창고, 대기 중인 창고, 샘플 데이터 모두 확인
                        const approvedWarehouses = JSON.parse(localStorage.getItem('approvedWarehouses') || '[]');
                        const pendingWarehouses = JSON.parse(localStorage.getItem('pendingWarehouses') || '[]');
                        const warehouseData = JSON.parse(localStorage.getItem('warehouseData') || '[]');
                        
                        const allWarehouses = [
                          ...approvedWarehouses,
                          ...pendingWarehouses,
                          ...warehouseData
                        ];
                        
                        // 이메일 또는 ID로 찾기
                        let warehouse = allWarehouses.find(w => 
                          (w.email && w.email === latestUser.email) || 
                          (w.id && w.id === latestUser.id)
                        );
                        
                        // 찾지 못한 경우, users 배열에서 직접 사용
                        if (!warehouse) {
                          warehouse = latestUser;
                        }
                        
                        if (warehouse && warehouse.id) {
                          navigate(`/premium-apply?type=warehouse&itemId=${warehouse.id}`);
                        } else {
                          alert('업체 정보를 찾을 수 없습니다.');
                        }
                      } else if (latestUser.userType === 'customer') {
                        // 고객사인 경우
                        // 승인된 고객사, 대기 중인 고객사, 샘플 데이터 모두 확인
                        const approvedCustomers = JSON.parse(localStorage.getItem('approvedCustomers') || '[]');
                        const pendingCustomers = JSON.parse(localStorage.getItem('pendingCustomers') || '[]');
                        const customerData = JSON.parse(localStorage.getItem('customerData') || '[]');
                        
                        const allCustomers = [
                          ...approvedCustomers,
                          ...pendingCustomers,
                          ...customerData
                        ];
                        
                        // 이메일 또는 ID로 찾기
                        let customer = allCustomers.find(c => 
                          (c.email && c.email === latestUser.email) || 
                          (c.id && c.id === latestUser.id)
                        );
                        
                        // 찾지 못한 경우, users 배열에서 직접 사용
                        if (!customer) {
                          customer = latestUser;
                        }
                        
                        if (customer && customer.id) {
                          navigate(`/premium-apply?type=customer&itemId=${customer.id}`);
                        } else {
                          alert('업체 정보를 찾을 수 없습니다.');
                        }
                      } else {
                        alert('업체 타입을 확인할 수 없습니다.');
                      }
                    }}
                    className="w-full bg-secondary-500 text-white py-2 px-4 rounded-lg hover:bg-secondary-600 transition-colors flex items-center justify-center"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    프리미엄 신청하기
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">상세 정보</h3>
              
              <div className="space-y-6">
                {/* 기본 정보 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">기본 정보</h4>
                    {editingSection !== 'basic' && (
                      <button
                        onClick={() => startEdit('basic')}
                        className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        수정
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        회사명
                      </label>
                      {editingSection === 'basic' ? (
                        <input
                          type="text"
                          value={editData.companyName || ''}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <p className="text-gray-900">{currentUser.companyName}</p>
                      )}
                    </div>
                    {currentUser.businessNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          사업자 등록번호
                        </label>
                        {editingSection === 'basic' ? (
                          <input
                            type="text"
                            value={editData.businessNumber || ''}
                            onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                        ) : (
                          <p className="text-gray-900">{currentUser.businessNumber}</p>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        대표자명
                      </label>
                      {editingSection === 'basic' ? (
                        <input
                          type="text"
                          value={editData.representative || ''}
                          onChange={(e) => handleInputChange('representative', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <p className="text-gray-900">{currentUser.representative}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        전화번호
                      </label>
                      {editingSection === 'basic' ? (
                        <input
                          type="text"
                          value={editData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <p className="text-gray-900">{currentUser.phone}</p>
                      )}
                    </div>
                    {currentUser.contactPerson && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          담당자명
                        </label>
                        {editingSection === 'basic' ? (
                          <input
                            type="text"
                            value={editData.contactPerson || ''}
                            onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                        ) : (
                          <p className="text-gray-900">{currentUser.contactPerson}</p>
                        )}
                      </div>
                    )}
                    {currentUser.contactPhone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          담당자 연락처
                        </label>
                        {editingSection === 'basic' ? (
                          <input
                            type="text"
                            value={editData.contactPhone || ''}
                            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                        ) : (
                          <p className="text-gray-900">{currentUser.contactPhone}</p>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        이메일
                      </label>
                      <p className="text-gray-900">{currentUser.email}</p>
                    </div>
                  </div>
                  {editingSection === 'basic' && (
                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={cancelEdit}
                        className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 mr-1" />
                        취소
                      </button>
                      <button
                        onClick={saveEdit}
                        className="flex items-center px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        저장
                      </button>
                    </div>
                  )}
                </div>

                {/* 위치 정보 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">위치 정보</h4>
                    {editingSection !== 'location' && (
                      <button
                        onClick={() => startEdit('location')}
                        className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        수정
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        지역
                      </label>
                      {editingSection === 'location' ? (
                        <select
                          value={editData.location || ''}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">지역을 선택하세요</option>
                          {regions.map((region) => (
                            <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-900">{currentUser.location || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        세부 지역
                      </label>
                      {editingSection === 'location' ? (
                        <select
                          value={editData.city || ''}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                          disabled={!editData.location}
                        >
                          <option value="">세부 지역을 선택하세요</option>
                          {editData.location && detailedRegions[editData.location] && 
                            detailedRegions[editData.location].map((city) => (
                              <option key={city} value={city}>{city}</option>
                            ))
                          }
                        </select>
                      ) : (
                        <p className="text-gray-900">{currentUser.city || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        동
                      </label>
                      {editingSection === 'location' ? (
                        <select
                          value={editData.dong || ''}
                          onChange={(e) => handleInputChange('dong', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                          disabled={!editData.city}
                        >
                          <option value="">동을 선택하세요</option>
                          {editData.location && editData.city && dongData[editData.location]?.[editData.city] && 
                            dongData[editData.location][editData.city].map((dong) => (
                              <option key={dong} value={dong}>{dong}</option>
                            ))
                          }
                        </select>
                      ) : (
                        <p className="text-gray-900">{currentUser.dong || '-'}</p>
                      )}
                    </div>
                  </div>
                  {editingSection === 'location' && (
                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={cancelEdit}
                        className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 mr-1" />
                        취소
                      </button>
                      <button
                        onClick={saveEdit}
                        className="flex items-center px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        저장
                      </button>
                    </div>
                  )}
                </div>

                {/* 창고업체 전용 정보 */}
                {isWarehouse && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">창고 정보</h4>
                        {editingSection !== 'warehouse' && (
                          <button
                            onClick={() => startEdit('warehouse')}
                            className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            수정
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentUser.experience && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              경력
                            </label>
                            {editingSection === 'warehouse' ? (
                              <input
                                type="number"
                                value={editData.experience || ''}
                                onChange={(e) => handleInputChange('experience', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              />
                            ) : (
                              <p className="text-gray-900">{currentUser.experience}년</p>
                            )}
                          </div>
                        )}
                        {currentUser.landArea && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              대지 면적
                            </label>
                            {editingSection === 'warehouse' ? (
                              <input
                                type="number"
                                value={editData.landArea || ''}
                                onChange={(e) => handleInputChange('landArea', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              />
                            ) : (
                              <p className="text-gray-900">{currentUser.landArea}㎡</p>
                            )}
                          </div>
                        )}
                        {currentUser.warehouseCount && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              창고 개수
                            </label>
                            {editingSection === 'warehouse' ? (
                              <select
                                value={editData.warehouseCount || ''}
                                onChange={(e) => handleInputChange('warehouseCount', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="">창고 개수를 선택하세요</option>
                                {Array.from({ length: 20 }, (_, i) => (
                                  <option key={i + 1} value={i + 1}>{i + 1}개</option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-gray-900">{currentUser.warehouseCount}개</p>
                            )}
                          </div>
                        )}
                        {currentUser.totalWarehouseArea && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              창고별 총 면적
                            </label>
                            {editingSection === 'warehouse' ? (
                              <input
                                type="number"
                                value={editData.totalWarehouseArea || ''}
                                onChange={(e) => handleInputChange('totalWarehouseArea', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              />
                            ) : (
                              <p className="text-gray-900">{currentUser.totalWarehouseArea}㎡</p>
                            )}
                          </div>
                        )}
                        {currentUser.availableArea && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              계약가능면적
                            </label>
                            {editingSection === 'warehouse' ? (
                              <input
                                type="number"
                                value={editData.availableArea || ''}
                                onChange={(e) => handleInputChange('availableArea', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              />
                            ) : (
                              <p className="text-gray-900">{currentUser.availableArea}㎡</p>
                            )}
                          </div>
                        )}
                        {currentUser.palletCount && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              계약가능 팔레트 수
                            </label>
                            {editingSection === 'warehouse' ? (
                              <input
                                type="number"
                                value={editData.palletCount || ''}
                                onChange={(e) => handleInputChange('palletCount', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              />
                            ) : (
                              <p className="text-gray-900">{currentUser.palletCount}개</p>
                            )}
                          </div>
                        )}
                      </div>
                      {editingSection === 'warehouse' && (
                        <div className="flex justify-end space-x-2 mt-4">
                          <button
                            onClick={cancelEdit}
                            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 mr-1" />
                            취소
                          </button>
                          <button
                            onClick={saveEdit}
                            className="flex items-center px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            저장
                          </button>
                        </div>
                      )}
                    </div>

                    {currentUser.storageTypes && currentUser.storageTypes.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">보관 방식</h4>
                          {editingSection !== 'storage' && (
                            <button
                              onClick={() => startEdit('storage')}
                              className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              수정
                            </button>
                          )}
                        </div>
                        {editingSection === 'storage' ? (
                          <div className="space-y-2">
                            {['상온', '냉장', '냉동', '항온항습'].map((type) => (
                              <label key={type} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={(editData.storageTypes || []).includes(type)}
                                  onChange={(e) => handleCheckboxChange('storageTypes', type, e.target.checked)}
                                  className="mr-2"
                                />
                                <span className="text-gray-700">{type}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {currentUser.storageTypes.map((type, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        )}
                        {editingSection === 'storage' && (
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={cancelEdit}
                              className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 mr-1" />
                              취소
                            </button>
                            <button
                              onClick={saveEdit}
                              className="flex items-center px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              저장
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {currentUser.deliveryCompanies && currentUser.deliveryCompanies.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">사용 배송사</h4>
                          {editingSection !== 'delivery' && (
                            <button
                              onClick={() => startEdit('delivery')}
                              className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              수정
                            </button>
                          )}
                        </div>
                        {editingSection === 'delivery' ? (
                          <div className="space-y-2">
                            {['CJ', '롯데', '쿠팡', '한진', '로젠', '기타'].map((company) => (
                              <label key={company} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={(editData.deliveryCompanies || []).includes(company)}
                                  onChange={(e) => handleCheckboxChange('deliveryCompanies', company, e.target.checked)}
                                  className="mr-2"
                                />
                                <span className="text-gray-700">{company}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {currentUser.deliveryCompanies.map((company, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                              >
                                {company}
                              </span>
                            ))}
                          </div>
                        )}
                        {editingSection === 'delivery' && (
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={cancelEdit}
                              className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 mr-1" />
                              취소
                            </button>
                            <button
                              onClick={saveEdit}
                              className="flex items-center px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              저장
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {currentUser.solutions && currentUser.solutions.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">사용 솔루션</h4>
                          {editingSection !== 'solutions' && (
                            <button
                              onClick={() => startEdit('solutions')}
                              className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              수정
                            </button>
                          )}
                        </div>
                        {editingSection === 'solutions' ? (
                          <div className="space-y-2">
                            {['E카운트', '셀메이트', '자체', '수기', '기타'].map((solution) => (
                              <label key={solution} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={(editData.solutions || []).includes(solution)}
                                  onChange={(e) => handleCheckboxChange('solutions', solution, e.target.checked)}
                                  className="mr-2"
                                />
                                <span className="text-gray-700">{solution}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {currentUser.solutions.map((solution, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                              >
                                {solution}
                              </span>
                            ))}
                          </div>
                        )}
                        {editingSection === 'solutions' && (
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={cancelEdit}
                              className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 mr-1" />
                              취소
                            </button>
                            <button
                              onClick={saveEdit}
                              className="flex items-center px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              저장
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* 고객사 전용 정보 */}
                {!isWarehouse && (
                  <>
                    {currentUser.requiredArea && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">필요 정보</h4>
                          {editingSection !== 'customer-info' && (
                            <button
                              onClick={() => startEdit('customer-info')}
                              className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              수정
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              사용할 총면적
                            </label>
                            {editingSection === 'customer-info' ? (
                              <input
                                type="number"
                                value={editData.requiredArea || ''}
                                onChange={(e) => handleInputChange('requiredArea', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              />
                            ) : (
                              <p className="text-gray-900">{currentUser.requiredArea}㎡</p>
                            )}
                          </div>
                          {currentUser.palletCount && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                필요한 팔레트 수
                              </label>
                              {editingSection === 'customer-info' ? (
                                <input
                                  type="number"
                                  value={editData.palletCount || ''}
                                  onChange={(e) => handleInputChange('palletCount', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                />
                              ) : (
                                <p className="text-gray-900">{currentUser.palletCount}개</p>
                              )}
                            </div>
                          )}
                          {currentUser.monthlyVolume && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                월 평균 출고량
                              </label>
                              {editingSection === 'customer-info' ? (
                                <input
                                  type="number"
                                  value={editData.monthlyVolume || ''}
                                  onChange={(e) => handleInputChange('monthlyVolume', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                />
                              ) : (
                                <p className="text-gray-900">{currentUser.monthlyVolume}개</p>
                              )}
                            </div>
                          )}
                        </div>
                        {editingSection === 'customer-info' && (
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={cancelEdit}
                              className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 mr-1" />
                              취소
                            </button>
                            <button
                              onClick={saveEdit}
                              className="flex items-center px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              저장
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {currentUser.desiredDelivery && currentUser.desiredDelivery.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">원하는 배송사</h4>
                          {editingSection !== 'desired-delivery' && (
                            <button
                              onClick={() => startEdit('desired-delivery')}
                              className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              수정
                            </button>
                          )}
                        </div>
                        {editingSection === 'desired-delivery' ? (
                          <div className="space-y-2">
                            {['CJ', '롯데', '쿠팡', '한진', '로젠', '기타'].map((delivery) => (
                              <label key={delivery} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={(editData.desiredDelivery || []).includes(delivery)}
                                  onChange={(e) => handleCheckboxChange('desiredDelivery', delivery, e.target.checked)}
                                  className="mr-2"
                                />
                                <span className="text-gray-700">{delivery}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {currentUser.desiredDelivery.map((delivery, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                              >
                                {delivery}
                              </span>
                            ))}
                          </div>
                        )}
                        {editingSection === 'desired-delivery' && (
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={cancelEdit}
                              className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 mr-1" />
                              취소
                            </button>
                            <button
                              onClick={saveEdit}
                              className="flex items-center px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              저장
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* 취급 물품 */}
                {currentUser.products && currentUser.products.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {isWarehouse ? '취급 중 및 취급 가능 종류' : '취급 물품 종류'}
                      </h4>
                      {editingSection !== 'products' && (
                        <button
                          onClick={() => startEdit('products')}
                          className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          수정
                        </button>
                      )}
                    </div>
                    {editingSection === 'products' ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['공산품', '식품', '의류', '전자제품', '생활용품', '스포츠용품', '화장품', '도서', '완구', '자동차부품', '건강식품', '가구', '반려동물용품', '문구', '사무용품'].map((product) => (
                          <label key={product} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={(editData.products || []).includes(product)}
                              onChange={(e) => handleCheckboxChange('products', product, e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-gray-700 text-sm">{product}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {currentUser.products.map((product, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                          >
                            {product}
                          </span>
                        ))}
                      </div>
                    )}
                    {editingSection === 'products' && (
                      <div className="flex justify-end space-x-2 mt-4">
                        <button
                          onClick={cancelEdit}
                          className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 mr-1" />
                          취소
                        </button>
                        <button
                          onClick={saveEdit}
                          className="flex items-center px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          저장
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
