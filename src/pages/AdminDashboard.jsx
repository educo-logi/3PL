import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  MapPin,
  Clock,
  LogOut,
  Eye,
  Trash2,
  CreditCard,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Gift
} from 'lucide-react';
import DetailModal from '../components/DetailModal';
import { supabase } from '../utils/supabaseClient';
import { grantAdminViewingPass } from '../utils/viewingPassUtils';
import { createPremiumApplication } from '../utils/premiumUtils';
import { createNotification } from '../utils/notificationUtils';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pendingWarehouseList, setPendingWarehouseList] = useState([]);
  const [pendingCustomerList, setPendingCustomerList] = useState([]);
  const [payments, setPayments] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [pageViews, setPageViews] = useState([]);

  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 열람권 지급 모달 상태
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [grantTarget, setGrantTarget] = useState(null); // { id, name, type }

  // [신규] 프리미엄 지급 모달 상태
  const [isPremiumGrantModalOpen, setIsPremiumGrantModalOpen] = useState(false);
  const [premiumGrantTarget, setPremiumGrantTarget] = useState(null); // { id, name, type }

  // [신규] 통계 및 모니터링용 상태 추가
  const [viewingPasses, setViewingPasses] = useState([]);
  const [viewingHistory, setViewingHistory] = useState([]);
  const [premiumApplications, setPremiumApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      // 1. Warehouses
      const { data: wData } = await supabase.from('warehouses').select('*');
      const processedWarehouses = (wData || []).map(w => ({
        ...w,
        companyName: w.company_name,
        availableArea: w.available_area,
        totalArea: w.total_area,
        isPremium: false, // 추후 premium 테이블 연동 시 수정
        temperature: w.storage_types ? w.storage_types.join(', ') : '',
        submittedAt: w.submitted_at,
        approvedAt: w.approved_at
      }));
      const sortedWarehouses = [...processedWarehouses].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setWarehouses(sortedWarehouses);
      
      const pendingWarehouses = processedWarehouses.filter(w => w.status === 'pending')
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setPendingWarehouseList(pendingWarehouses);

      // 2. Customers
      const { data: cData } = await supabase.from('customers').select('*');
      const processedCustomers = (cData || []).map(c => ({
        ...c,
        companyName: c.company_name,
        requiredArea: c.required_area,
        monthlyVolume: c.monthly_volume,
        products: c.products || [],
        submittedAt: c.submitted_at,
        approvedAt: c.approved_at
      }));
      
      const sortedCustomers = [...processedCustomers].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setCustomers(sortedCustomers);
      
      const pendingCustomers = processedCustomers.filter(c => c.status === 'pending')
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setPendingCustomerList(pendingCustomers);

      // 3. Payments (New)
      const { data: pData } = await supabase
        .from('payment_history')
        .select('*')
        .order('created_at', { ascending: false });

      // 사용자 이름 및 이메일 매핑용 풀 생성
      const userMap = {};
      const userEmailMap = {};
      [...processedWarehouses, ...processedCustomers].forEach(u => {
        userMap[u.id] = u.companyName;
        userEmailMap[u.id] = u.email;
      });

      setPayments((pData || []).map(p => ({
        ...p,
        userName: userMap[p.user_id] || 'Unknown User',
        email: userEmailMap[p.user_id] || '-'
      })));

      // 4. Inquiries (New)
      const { data: iData } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      setInquiries(iData || []);

      // 5. Page Views (New) - 최근 7일치 or 전체
      const { data: vData } = await supabase
        .from('page_views')
        .select('*')
        .gte('viewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days
      setPageViews(vData || []);

      // 6. Viewing Passes [신규]
      const { data: vpData } = await supabase.from('viewing_passes').select('*');
      setViewingPasses(vpData || []);

      // 7. Viewing History [신규]
      const { data: vhData } = await supabase
        .from('viewing_history')
        .select('*')
        .order('viewed_at', { ascending: false });
      setViewingHistory(vhData || []);

      // 8. Premium Applications [신규]
      try {
        const { data: paData, error: paError } = await supabase
          .from('premium_applications')
          .select('*')
          .order('created_at', { ascending: false });
        
        const localApps = JSON.parse(localStorage.getItem('premiumApplications') || '[]');
        const mappedLocal = localApps.map(a => ({
          ...a,
          item_id: a.itemId,
          item_type: a.itemType,
          package_type: a.packageType,
          start_date: a.startDate,
          end_date: a.endDate,
          status: a.status
        }));

        if (paError) {
          setPremiumApplications(mappedLocal);
        } else {
          setPremiumApplications([...(paData || []), ...mappedLocal]);
        }
      } catch (paErr) {
        const localApps = JSON.parse(localStorage.getItem('premiumApplications') || '[]');
        setPremiumApplications(localApps.map(a => ({
          ...a,
          item_id: a.itemId,
          item_type: a.itemType,
          package_type: a.packageType,
          start_date: a.startDate,
          end_date: a.endDate,
          status: a.status
        })));
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    const isAdmin = localStorage.getItem('adminAuth');
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };

  // --- Actions ---
  const handleApprove = async (table, id) => {
    if (!window.confirm('승인하시겠습니까?')) return;
    try {
      await supabase.from(table).update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', id);
      fetchData();
    } catch { alert('오류 발생'); }
  };

  const handleReject = async (table, id) => {
    if (!window.confirm('거부하시겠습니까?')) return;
    try {
      await supabase.from(table).update({ status: 'rejected' }).eq('id', id);
      fetchData();
    } catch { alert('오류 발생'); }
  };

  const handleDelete = async (table, id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await supabase.from(table).delete().eq('id', id);
      fetchData();
    } catch { alert('오류 발생'); }
  };

  const handleInquiryStatus = async (id, newStatus, answer = null) => {
    try {
      const updateData = { status: newStatus };
      if (answer) {
        updateData.answer = answer;
        updateData.answered_at = new Date().toISOString();
      }
      const { data, error } = await supabase
        .from('inquiries')
        .update(updateData)
        .eq('id', id)
        .select(); // 업데이트된 데이터 반환 요청

      if (error) {
        console.error('Inquiry update error:', error);
        alert(`상태 변경 중 오류가 발생했습니다: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        alert('업데이트된 데이터가 없습니다. 권한 문제일 수 있습니다.');
        return;
      }

      fetchData();
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('상태 변경 중 예기치 않은 오류가 발생했습니다.');
    }
  }

  const handleViewDetails = (item, type) => {
    setSelectedItem(item);
    setSelectedItemType(type);
    setIsDetailModalOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  const handleOpenGrantModal = (item, type) => {
    setGrantTarget({
      id: item.user_id || item.id, // items usually have their own id as user_id in this design, or we assume they are the same
      name: item.companyName,
      type: type,
      originalData: item
    });
    setIsGrantModalOpen(true);
  };

  const handleGrantPass = async (count, reason) => {
    if (!grantTarget) return;
    
    // 지급 실행
    const result = await grantAdminViewingPass(grantTarget.id, count, reason);
    if (result.success) {
      alert(`[${grantTarget.name}] 님에게 열람권 ${count}장이 지급되었습니다.`);
      setIsGrantModalOpen(false);
      setGrantTarget(null);
    } else {
      alert(result.message);
    }
  };

  // [신규] 프리미엄 개별 지급 핸들러
  const handleOpenPremiumGrantModal = (item, type) => {
    setPremiumGrantTarget({
      userId: item.user_id || item.id, // 관리용 사용자 ID
      itemId: item.id,                // 실제 창고/고객사 ID 
      name: item.companyName,
      type: type
    });
    setIsPremiumGrantModalOpen(true);
  };

  const handleGrantPremium = async (days, reason) => {
    if (!premiumGrantTarget) return;
    
    const result = await createPremiumApplication(
      premiumGrantTarget.userId, 
      premiumGrantTarget.type, 
      premiumGrantTarget.itemId, 
      premiumGrantTarget.type, 
      'admin_custom', 
      null, 
      null, 
      days
    );
    
    if (result.success) {
      createNotification(
        premiumGrantTarget.userId, 
        'purchase', 
        '👑 프리미엄 혜택 특별 지급', 
        `관리자가 프리미엄 서비스를 ${days}일 동안 특별 지급했습니다. 사유: ${reason || '이벤트'}`
      );
      alert(`[${premiumGrantTarget.name}] 님에게 프리미엄 ${days}일이 지급되었습니다.`);
      setIsPremiumGrantModalOpen(false);
      setPremiumGrantTarget(null);
      fetchData();
    } else {
      alert(result.message || '지급 실패');
    }
  };

  // --- [신규] CSV 다운로드 기능 ---
  const generateCSV = (headers, rows, filenameTitle) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${(v === null || v === undefined ? '' : '' + v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenameTitle}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadWarehouseCSV = () => {
    const headers = [
      '가입일', '승인일', '회사명', '사업자등록번호', '대표자명', '전화번호', 
      '담당자명', '담당자 연락처', '이메일', '지역', '시군구', '동', '상세주소', 
      '대지면적', '대지면적단위', '창고개수', '창고총면적', '총면적단위', 
      '계약가능면적', '계약단위', '팔레트수', '경력', '보관방식', '배송사', 
      '기타배송사', '솔루션', '기타솔루션', '취급종류', '상태'
    ];
    
    const rows = warehouses.map(w => [
      formatDate(w.submittedAt),
      formatDate(w.approvedAt),
      w.companyName,
      w.business_number || w.businessNumber || '-',
      w.representative,
      w.phone,
      w.contact_person || '-',
      w.contact_phone || '-',
      w.email,
      w.location,
      w.city,
      w.dong,
      w.detail_address || '-',
      w.total_area,
      w.total_area_unit,
      w.warehouse_count,
      w.warehouse_area,
      w.warehouse_area_unit,
      w.available_area,
      w.available_area_unit,
      w.pallet_count,
      w.experience,
      w.storage_types ? w.storage_types.join(' | ') : '',
      w.delivery_companies ? w.delivery_companies.join(' | ') : '',
      w.other_delivery_company || '-',
      w.solutions ? w.solutions.join(' | ') : '',
      w.other_solution || '-',
      w.products ? w.products.join(' | ') : '',
      w.status
    ]);

    generateCSV(headers, rows, '창고_회원목록');
  };

  const handleDownloadCustomerCSV = () => {
    const headers = [
      '가입일', '승인일', '회사명', '사업자등록번호', '대표자명', '전화번호', 
      '담당자명', '담당자 연락처', '이메일', '지역', '시군구', '동', '상세주소', 
      '필요면적', '면적단위', '팔레트수', '월물동량', '원하는배송사', '취급종류', '상태'
    ];
    
    const rows = customers.map(c => [
      formatDate(c.submittedAt),
      formatDate(c.approvedAt),
      c.companyName,
      c.business_number || c.businessNumber || '-',
      c.representative,
      c.phone,
      c.contact_person || '-',
      c.contact_phone || '-',
      c.email,
      c.location,
      c.city,
      c.dong,
      c.detail_address || '-',
      c.required_area || c.requiredArea,
      c.required_area_unit || c.requiredAreaUnit,
      c.pallet_count || c.palletCount,
      c.monthlyVolume,
      c.desired_delivery ? c.desired_delivery.join(' | ') : (c.desiredDelivery ? c.desiredDelivery.join(' | ') : ''),
      c.products ? c.products.join(' | ') : '',
      c.status
    ]);

    generateCSV(headers, rows, '고객사_회원목록');
  };

  // --- Stats Calculation ---
  const totalRevenue = payments.reduce((sum, p) => sum + (p.status === 'success' ? Number(p.amount) : 0), 0);
  const pendingCount = pendingWarehouseList.length + pendingCustomerList.length;
  const unresolvedInquiries = inquiries.filter(i => i.status !== 'resolved').length;

  // Page View Stats (인간 vs 봇 분리)
  const humanViews = pageViews.filter(view => !view.is_bot);
  const botViews = pageViews.filter(view => view.is_bot);

  const humanPageStats = humanViews.reduce((acc, view) => {
    const path = view.page_path;
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {});

  const botPageStats = botViews.reduce((acc, view) => {
    const path = view.page_path;
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {});

  const topHumanPages = Object.entries(humanPageStats).sort(([, a], [, b]) => b - a).slice(0, 10);
  const topBotPages = Object.entries(botPageStats).sort(([, a], [, b]) => b - a).slice(0, 10);

  // --- [신규] 열람권 통계 집계 ---
  const totalRemainingPasses = viewingPasses.reduce((sum, p) => sum + (p.remaining_count || 0), 0);
  const totalDistributedPasses = viewingPasses.reduce((sum, p) => sum + (p.total_count || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayUsage = viewingHistory.filter(h => h.viewed_at && h.viewed_at.startsWith(todayStr)).length;

  const passesByType = viewingPasses.reduce((acc, p) => {
    const type = p.package_type || 'regular';
    acc[type] = (acc[type] || 0) + (p.remaining_count || 0);
    return acc;
  }, {});

  // 일자별 사용량 집계 (최근 7일)
  const dailyHistoryStats = viewingHistory.reduce((acc, h) => {
    if (!h.viewed_at) return acc;
    const d = h.viewed_at.split('T')[0];
    if (!acc[d]) acc[d] = { total: 0, welcome: 0, admin: 0, paid: 0 };
    acc[d].total += 1;
    if (h.package_type === 'welcome_free') acc[d].welcome += 1;
    else if (h.package_type === 'admin_grant') acc[d].admin += 1;
    else acc[d].paid += 1; // event 나 basic 등 포함
    return acc;
  }, {});
  const dailyHistoryList = Object.entries(dailyHistoryStats)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7);

  // --- [신규] 프리미엄 통계 집계 ---
  const activePremiums = premiumApplications.filter(app => {
    return app.status === 'active' && app.end_date && new Date(app.end_date) > new Date();
  });
  const expiringPremiums = activePremiums.filter(app => {
    const remainMs = new Date(app.end_date) - new Date();
    return remainMs > 0 && remainMs < 3 * 24 * 60 * 60 * 1000; // 3일 이내
  });

  const calculateDDay = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    // 시간 부분을 제외하고 날짜 단위로만 차이 계산 (D-Day 표준)
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = endDay - nowDay;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : 0;
  };

  // --- [신규] 오류 추적용 래퍼 함수 ---
  const renderPassesTab = () => {
    try {
      const warehousePasses = viewingPasses.filter(p => warehouses.some(w => w.id === p.user_id));
      const customerPasses = viewingPasses.filter(p => customers.some(c => c.id === p.user_id));

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard icon={CreditCard} title="전체 보유 잔여량" value={`${totalRemainingPasses}회`} color="blue" />
            <StatCard icon={TrendingUp} title="오늘 소진량" value={`${todayUsage}회`} color="red" />
            <StatCard icon={Building2} title="창고 보유량" value={`${warehousePasses.reduce((s,p)=>s+(p.remaining_count||0),0)}회`} color="green" />
            <StatCard icon={Users} title="고객사 보유량" value={`${customerPasses.reduce((s,p)=>s+(p.remaining_count||0),0)}회`} color="purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white shadow rounded-lg p-6 overflow-hidden">
              <h3 className="text-lg font-bold mb-4">일자별 사용 통계</h3>
              <DataTable
                headers={['날짜', '총 사용', '무료', '유료', '선물']}
                data={dailyHistoryList.map(([date, stats]) => ({ id: date, date, ...stats }))}
                renderRow={(item) => (
                  <>
                    <td className="px-6 py-4 text-sm font-medium">{item.date}</td>
                    <td className="px-6 py-4 font-bold text-primary-600">{item.total}회</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.welcome}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.total - item.welcome - item.admin}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.admin}</td>
                  </>
                )}
              />
            </div>

            <div className="bg-white shadow rounded-lg p-6 overflow-hidden">
              <h3 className="text-lg font-bold mb-2 flex items-center text-green-600"><Building2 className="mr-1 h-5 w-5"/> 창고업체 보유 현황</h3>
              <DataTable
                headers={['이메일', '회사명', '패키지', '잔여']}
                data={warehousePasses.slice(0, 10)}
                renderRow={(p) => {
                  const company = warehouses.find(w => w.id === p.user_id);
                  return (
                    <>
                      <td className="px-6 py-4 text-sm text-gray-500 break-all">{company ? company.email : '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium">{company ? company.companyName : (p.user_id || '').substring(0, 8)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs ${p.package_type === 'welcome_free' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {p.package_type === 'welcome_free' ? '무료' : '일반'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">{p.remaining_count}회</td>
                    </>
                  );
                }}
              />
            </div>

            <div className="bg-white shadow rounded-lg p-6 overflow-hidden">
              <h3 className="text-lg font-bold mb-2 flex items-center text-purple-600"><Users className="mr-1 h-5 w-5"/> 고객사 보유 현황</h3>
              <DataTable
                headers={['이메일', '회사명', '패키지', '잔여']}
                data={customerPasses.slice(0, 10)}
                renderRow={(p) => {
                  const company = customers.find(c => c.id === p.user_id);
                  return (
                    <>
                      <td className="px-6 py-4 text-sm text-gray-500 break-all">{company ? company.email : '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium">{company ? company.companyName : (p.user_id || '').substring(0, 8)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs ${p.package_type === 'welcome_free' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {p.package_type === 'welcome_free' ? '무료' : '일반'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">{p.remaining_count}회</td>
                    </>
                  );
                }}
              />
            </div>
          </div>
        </div>
      );
    } catch (err) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-600">
          <h4 className="font-bold mb-2">열람권 관리 화면 연산 에러:</h4>
          <p className="text-sm font-mono">{err.message}</p>
        </div>
      );
    }
  };

  const renderPremiumTab = () => {
    try {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={AlertCircle} title="활성 프리미엄" value={`${activePremiums.length}개`} color="green" />
            <StatCard icon={Clock} title="만료 임박 (3일 이내)" value={`${expiringPremiums.length}개`} color="yellow" />
            <StatCard icon={BarChart3} title="총 신청 건수" value={`${premiumApplications.length}건`} color="blue" />
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <DataTable
              headers={['업체(아이디)', '유형', '상품명', '게시 기간', '남은 기간 (D-Day)', '상태']}
              data={premiumApplications}
              renderRow={(app) => {
                const dDay = calculateDDay(app.end_date);
                const isActive = app.status === 'active' && new Date(app.end_date) > new Date();
                return (
                  <>
                    <td className="px-6 py-4 text-sm font-medium">{(app.item_id || '').substring(0,8)}...</td>
                    <td className="px-6 py-4 text-sm">{app.item_type === 'warehouse' ? '창고' : '고객사'}</td>
                    <td className="px-6 py-4 text-sm">{app.package_type}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{formatDate(app.start_date)} ~ {formatDate(app.end_date)}</td>
                    <td className="px-6 py-4">
                      {isActive ? (
                        <div className="flex items-center">
                          <span className={`font-bold mr-2 ${dDay <= 3 ? 'text-red-500' : 'text-green-600'}`}>D-{dDay}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${dDay <= 3 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min((dDay / 15) * 100, 100)}%` }}></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">만료</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {isActive ? '게시중' : '종료'}
                      </span>
                    </td>
                  </>
                );
              }}
            />
          </div>
        </div>
      );
    } catch (err) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-600">
          <h4 className="font-bold mb-2">프리미엄 관리 화면 연산 에러:</h4>
          <p className="text-sm font-mono">{err.message}</p>
        </div>
      );
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            </div>
            <button onClick={handleLogout} className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900">
              <LogOut className="w-4 h-4 mr-2" /> 로그아웃
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: '개요' },
              { id: 'warehouses', label: '창고 관리' },
              { id: 'customers', label: '고객사 관리' },
              { id: 'payments', label: '결제 관리' },
              { id: 'passes', label: '열람권 관리' },
              { id: 'premium', label: '프리미엄 관리' },
              { id: 'inquiries', label: `문의 관리 (${unresolvedInquiries})` },
              { id: 'pending', label: `승인 대기 (${pendingCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* --- Content Areas --- */}

        {/* 1. Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard icon={Building2} title="총 창고 수" value={`${warehouses.length}개`} color="blue" />
              <StatCard icon={Users} title="총 고객사 수" value={`${customers.length}개`} color="green" />
              <StatCard icon={TrendingUp} title="총 매출" value={`${totalRevenue.toLocaleString()}원`} color="yellow" />
              <StatCard icon={Eye} title="주간 방문수" value={`${humanViews.length}회 (봇 ${botViews.length}회)`} color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">인기 페이지 (최근 7일)</h3>
                <div className="space-y-6">
                  {/* 실제 사용자 섹션 */}
                  <div>
                    <h4 className="text-sm font-bold text-blue-600 mb-2 flex items-center">👨‍💻 실제 사용자</h4>
                    <ul className="space-y-2">
                      {topHumanPages.map(([path, count], idx) => (
                        <li key={path} className="flex justify-between items-center border-b border-gray-100 pb-1 text-sm">
                          <span className="flex items-center text-gray-700">
                            <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center mr-2 text-xs font-bold text-blue-600 border border-blue-100">{idx + 1}</span>
                            {path === '/' ? '메인 페이지' : path}
                          </span>
                          <span className="font-bold text-primary-600">{count}회</span>
                        </li>
                      ))}
                      {topHumanPages.length === 0 && <li className="text-gray-400 text-center py-2 text-sm">데이터가 없습니다.</li>}
                    </ul>
                  </div>

                  {/* 크롤러 / 봇 섹션 */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-bold text-gray-400 mb-2 flex items-center">🤖 크롤러 / 봇</h4>
                    <ul className="space-y-2">
                      {topBotPages.map(([path, count], idx) => (
                        <li key={path} className="flex justify-between items-center border-b border-gray-100 pb-1 text-sm">
                          <span className="flex items-center text-gray-400">
                            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-2 text-xs font-bold text-gray-500">{idx + 1}</span>
                            {path === '/' ? '메인 페이지' : path}
                          </span>
                          <span className="font-bold text-gray-500">{count}회</span>
                        </li>
                      ))}
                      {topBotPages.length === 0 && <li className="text-gray-400 text-center py-2 text-sm">데이터가 없습니다.</li>}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">최근 결제 내역</h3>
                <div className="space-y-4">
                  {payments.slice(0, 5).map(p => (
                    <div key={p.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{p.package_type} 결제</p>
                        <p className="text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString()} - {p.userName}</p>
                      </div>
                      <span className="font-bold text-gray-900">+{Number(p.amount).toLocaleString()}원</span>
                    </div>
                  ))}
                  {payments.length === 0 && <p className="text-gray-500 text-center py-4">결제 내역이 없습니다.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Warehouses */}
        {activeTab === 'warehouses' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={handleDownloadWarehouseCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 font-bold text-sm transition-colors"
              >
                📥 CSV 다운받기
              </button>
            </div>
            <DataTable
            headers={['가입일', '승인일', '회사명', '사업자등록번호', '이메일', '지역', '면적', '연락처', '액션']}
            data={warehouses}
            renderRow={(w) => (
              <>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(w.submittedAt)}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(w.approvedAt)}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewDetails(w, 'warehouse')}
                    className="font-medium text-primary-600 hover:text-primary-800 hover:underline text-left"
                  >
                    {w.companyName}
                    {w.status === 'pending' && <span className="ml-1 text-xs font-bold text-red-500">(대기)</span>}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm">{w.business_number || w.businessNumber || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 break-all">{w.email}</td>
                <td className="px-6 py-4 text-sm">{w.location}</td>
                <td className="px-6 py-4 text-sm">{w.availableArea ? w.availableArea.toLocaleString() : ''} / {w.totalArea ? w.totalArea.toLocaleString() : ''}</td>
                <td className="px-6 py-4 text-sm">{w.phone}</td>
                <td className="px-6 py-4 flex gap-2">
                  <ActionButton icon={Eye} onClick={() => handleViewDetails(w, 'warehouse')} title="상세보기" />
                  <ActionButton icon={Gift} color="blue" onClick={() => handleOpenGrantModal(w, 'warehouse')} title="열람권 지급" />
                  <ActionButton icon={Gift} color="orange" onClick={() => handleOpenPremiumGrantModal(w, 'warehouse')} title="프리미엄 지급" />
                  <ActionButton icon={Trash2} color="red" onClick={() => handleDelete('warehouses', w.id)} />
                </td>
              </>
            )}
          />
          </div>
        )}

        {/* 3. Customers */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={handleDownloadCustomerCSV}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 font-bold text-sm transition-colors"
              >
                📥 CSV 다운받기
              </button>
            </div>
            <DataTable
            headers={['가입일', '승인일', '회사명', '사업자등록번호', '이메일', '지역', '월 물동량', '연락처', '액션']}
            data={customers}
            renderRow={(c) => (
              <>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(c.submittedAt)}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(c.approvedAt)}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewDetails(c, 'customer')}
                    className="font-medium text-primary-600 hover:text-primary-800 hover:underline text-left"
                  >
                    {c.companyName}
                    {c.status === 'pending' && <span className="ml-1 text-xs font-bold text-red-500">(대기)</span>}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm">{c.business_number || c.businessNumber || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 break-all">{c.email}</td>
                <td className="px-6 py-4 text-sm">{c.location}</td>
                <td className="px-6 py-4 text-sm">{c.monthlyVolume ? c.monthlyVolume.toLocaleString() : ''}</td>
                <td className="px-6 py-4 text-sm">{c.phone}</td>
                <td className="px-6 py-4 flex gap-2">
                  <ActionButton icon={Eye} onClick={() => handleViewDetails(c, 'customer')} title="상세보기" />
                  <ActionButton icon={Gift} color="blue" onClick={() => handleOpenGrantModal(c, 'customer')} title="열람권 지급" />
                  <ActionButton icon={Gift} color="orange" onClick={() => handleOpenPremiumGrantModal(c, 'customer')} title="프리미엄 지급" />
                  <ActionButton icon={Trash2} color="red" onClick={() => handleDelete('customers', c.id)} />
                </td>
              </>
            )}
          />
          </div>
        )}

        {/* 4. Payments (New) */}
        {activeTab === 'payments' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">전체 결제 내역</h3>
              <span className="text-lg font-bold text-primary-600">Total: {totalRevenue.toLocaleString()}원</span>
            </div>
            <DataTable
              headers={['이메일', '일시', '사용자', '상품명', '금액', '상태']}
              data={payments}
              renderRow={(p) => (
                <>
                  <td className="px-6 py-4 text-sm text-gray-600 break-all">{p.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium">{p.userName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${p.package_type && p.package_type.includes('event') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {p.package_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">{p.amount ? Number(p.amount).toLocaleString() : '0'}원</td>
                  <td className="px-6 py-4 text-green-600 text-sm font-bold">{p.status}</td>
                </>
              )}
            />
          </div>
        )}

        {/* 5. Inquiries (New) */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {inquiries.map(inq => (
              <InquiryCard key={inq.id} inquiry={inq} onUpdateStatus={handleInquiryStatus} />
            ))}
            {inquiries.length === 0 && <div className="text-center py-12 text-gray-500">접수된 문의가 없습니다.</div>}
          </div>
        )}

        {/* 6. Pending Approvals */}
        {activeTab === 'pending' && (
          <div className="space-y-8">
            {pendingWarehouseList.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center text-yellow-600"><Clock className="mr-2" /> 창고 승인 대기</h3>
                <DataTable
                  headers={['이메일', '회사명', '연락처', '지역', '가입일', '액션']}
                  data={pendingWarehouseList}
                  renderRow={(w) => (
                    <>
                      <td className="px-6 py-4 text-sm text-gray-600 break-all">{w.email}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetails(w, 'warehouse')}
                          className="font-medium text-primary-600 hover:text-primary-800 hover:underline text-left"
                        >
                          {w.companyName}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">{w.phone}</td>
                      <td className="px-6 py-4 text-sm">{w.location}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(w.submittedAt)}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button onClick={() => handleApprove('warehouses', w.id)} className="text-green-600 font-bold hover:underline">승인</button>
                        <button onClick={() => handleReject('warehouses', w.id)} className="text-red-600 hover:underline">거절</button>
                      </td>
                    </>
                  )}
                />
              </div>
            )}

            {pendingCustomerList.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center text-yellow-600"><Clock className="mr-2" /> 고객사 승인 대기</h3>
                <DataTable
                  headers={['이메일', '회사명', '연락처', '필요면적', '가입일', '액션']}
                  data={pendingCustomerList}
                  renderRow={(c) => (
                    <>
                      <td className="px-6 py-4 text-sm text-gray-600 break-all">{c.email}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetails(c, 'customer')}
                          className="font-medium text-primary-600 hover:text-primary-800 hover:underline text-left"
                        >
                          {c.companyName}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">{c.phone}</td>
                      <td className="px-6 py-4 text-sm">{c.requiredArea}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(c.submittedAt)}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button onClick={() => handleApprove('customers', c.id)} className="text-green-600 font-bold hover:underline">승인</button>
                        <button onClick={() => handleReject('customers', c.id)} className="text-red-600 hover:underline">거절</button>
                      </td>
                    </>
                  )}
                />
              </div>
            )}

            {pendingWarehouseList.length === 0 && pendingCustomerList.length === 0 && (
              <div className="text-center py-12 bg-white rounded shadow text-gray-500">대기 중인 승인 요청이 없습니다.</div>
            )}
          </div>
        )}

        {/* 7. 열람권 관리 [신규] */}
        {activeTab === 'passes' && renderPassesTab()}

        {/* 8. 프리미엄 관리 [신규] */}
        {activeTab === 'premium' && renderPremiumTab()}

      </div>

      {isDetailModalOpen && (
        <DetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          data={selectedItem}
          type={selectedItemType}
        />
      )}

      {isGrantModalOpen && grantTarget && (
        <GrantPassModal
          isOpen={isGrantModalOpen}
          onClose={() => setIsGrantModalOpen(false)}
          target={grantTarget}
          onConfirm={handleGrantPass}
        />
      )}

      {isPremiumGrantModalOpen && premiumGrantTarget && (
        <GrantPremiumModal
          isOpen={isPremiumGrantModalOpen}
          onClose={() => setIsPremiumGrantModalOpen(false)}
          target={premiumGrantTarget}
          onConfirm={handleGrantPremium}
        />
      )}
    </div>
  );
};

// --- Sub Components for clean code ---
const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg p-5">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
      <div className="ml-5 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <dd className="text-lg font-medium text-gray-900">{value}</dd>
        </dl>
      </div>
    </div>
  </div>
);

const DataTable = ({ headers, data, renderRow }) => (
  <div className="bg-white shadow rounded-lg overflow-hidden overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {headers.map(h => (
            <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map(item => (
          <tr key={item.id} className="hover:bg-gray-50">
            {renderRow(item)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);



const InquiryCard = ({ inquiry, onUpdateStatus }) => {
  const [answer, setAnswer] = useState(inquiry.answer || null); // Initialize with null if undefined
  const [isEditing, setIsEditing] = useState(false);
  const [tempAnswer, setTempAnswer] = useState('');

  const handleComplete = () => {
    if (!tempAnswer.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }
    if (window.confirm('답변을 등록하고 완료 처리하시겠습니까?')) {
      onUpdateStatus(inquiry.id, 'resolved', tempAnswer);
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${inquiry.status === 'resolved' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-600'}`}>
              {inquiry.status === 'resolved' ? '처리완료' : '접수중'}
            </span>
            <span className="text-xs text-gray-400">{new Date(inquiry.created_at).toLocaleString()}</span>
            <span className="text-xs bg-gray-100 px-2 rounded">{inquiry.category}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{inquiry.title}</h3>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg text-gray-700 text-sm mb-4 whitespace-pre-wrap">
        {inquiry.content}
      </div>

      <div className="flex gap-6 text-sm text-gray-600 mb-4 border-b border-gray-100 pb-4">
        <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {inquiry.email}</span>
        {inquiry.phone && <span className="flex items-center"><Building2 className="w-4 h-4 mr-1" /> {inquiry.phone}</span>}
      </div>

      {/* 답변 영역 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        {inquiry.status === 'resolved' ? (
          <div>
            <h4 className="font-bold text-blue-900 mb-2 flex items-center"><MessageCircle className="w-4 h-4 mr-2" /> 관리자 답변</h4>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{inquiry.answer || '(답변 내용 없음)'}</p>
            <p className="text-xs text-gray-500 mt-2 text-right">답변일시: {inquiry.answered_at ? new Date(inquiry.answered_at).toLocaleString() : '-'}</p>
          </div>
        ) : (
          <div>
            {isEditing ? (
              <div>
                <h4 className="font-bold text-blue-900 mb-2">답변 작성</h4>
                <textarea
                  className="w-full p-2 border border-blue-200 rounded text-sm mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="3"
                  placeholder="답변 내용을 입력하세요..."
                  value={tempAnswer}
                  onChange={(e) => setTempAnswer(e.target.value)}
                ></textarea>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditing(false)} className="text-sm text-gray-500 px-3 py-1 hover:text-gray-700">취소</button>
                  <button onClick={handleComplete} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">등록 및 완료</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)} className="flex items-center text-sm text-blue-600 font-bold hover:underline">
                <MessageCircle className="w-4 h-4 mr-1" /> 답변 작성하기
              </button>
            )}
          </div>
        )}

        {/* 7. 열람권 관리 [신규] */}
        {activeTab === 'passes' && renderPassesTab()}

        {/* 8. 프리미엄 관리 [신규] */}
        {activeTab === 'premium' && renderPremiumTab()}

      </div>
    </div>
  );
};

const GrantPassModal = ({ isOpen, onClose, target, onConfirm }) => {
  const [count, setCount] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numCount = parseInt(count, 10);
    if (isNaN(numCount) || numCount <= 0) {
      alert('유효한 수량을 입력해주세요.');
      return;
    }
    onConfirm(numCount, reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Gift className="w-6 h-6 mr-2 text-blue-600" />
          열람권 개별 지급
        </h2>
        
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm text-gray-500">지급 대상</p>
          <p className="font-bold text-gray-900">{target.name} <span className="text-xs font-normal">({target.type === 'warehouse' ? '창고' : '고객사'})</span></p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">지급 개수 <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="1"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="예: 5"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">지급 사유 (선택)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="예: 우수 의견 제안 보상"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 font-bold"
            >
              지급하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GrantPremiumModal = ({ isOpen, onClose, target, onConfirm }) => {
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numDays = parseInt(days, 10);
    if (isNaN(numDays) || numDays <= 0) {
      alert('유효한 일수를 입력해주세요.');
      return;
    }
    onConfirm(numDays, reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Gift className="w-6 h-6 mr-2 text-orange-500" />
          프리미엄 혜택 지급
        </h2>
        
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm text-gray-500">지급 대상</p>
          <p className="font-bold text-gray-900">{target.name} <span className="text-xs font-normal">({target.type === 'warehouse' ? '창고' : '고객사'})</span></p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">지급 기간(일수) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="1"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="예: 5"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">지급 사유 (선택)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="예: 우수 창고 지원"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-orange-500 rounded hover:bg-orange-600 font-bold"
            >
              지급하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ActionButton = ({ icon: Icon, onClick, color = 'gray', title }) => (
  <button onClick={onClick} className={`text-${color}-600 hover:text-${color}-900 p-1`} title={title}>
    <Icon className="w-5 h-5" />
  </button>
);

export default AdminDashboard;
