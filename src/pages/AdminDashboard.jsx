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
  AlertCircle
} from 'lucide-react';
import DetailModal from '../components/DetailModal';
import { supabase } from '../utils/supabaseClient';

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
      setWarehouses(processedWarehouses.filter(w => w.status === 'approved'));
      setPendingWarehouseList(processedWarehouses.filter(w => w.status === 'pending'));

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
      setCustomers(processedCustomers.filter(c => c.status === 'approved'));
      setPendingCustomerList(processedCustomers.filter(c => c.status === 'pending'));

      // 3. Payments (New)
      const { data: pData } = await supabase
        .from('payment_history')
        .select('*')
        .order('created_at', { ascending: false });

      // 사용자 이름 매핑을 위해 전체 사용자 목록 매핑 (최적화 필요하지만 MVP 위해 이렇게 진행)
      const userMap = {};
      [...processedWarehouses, ...processedCustomers].forEach(u => {
        userMap[u.id] = u.companyName;
      });

      setPayments((pData || []).map(p => ({
        ...p,
        userName: userMap[p.user_id] || 'Unknown User'
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

  // --- Stats Calculation ---
  const totalRevenue = payments.reduce((sum, p) => sum + (p.status === 'success' ? Number(p.amount) : 0), 0);
  const pendingCount = pendingWarehouseList.length + pendingCustomerList.length;
  const unresolvedInquiries = inquiries.filter(i => i.status !== 'resolved').length;

  // Page View Stats
  const pageViewStats = pageViews.reduce((acc, view) => {
    const path = view.page_path;
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {});
  const topPages = Object.entries(pageViewStats).sort(([, a], [, b]) => b - a).slice(0, 5);


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
              <StatCard icon={Eye} title="주간 방문수" value={`${pageViews.length}회`} color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">인기 페이지 (최근 7일)</h3>
                <ul className="space-y-3">
                  {topPages.map(([path, count], idx) => (
                    <li key={path} className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="flex items-center text-gray-700">
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-xs font-bold text-gray-600">{idx + 1}</span>
                        {path === '/' ? '메인 페이지' : path}
                      </span>
                      <span className="font-bold text-primary-600">{count}회</span>
                    </li>
                  ))}
                  {topPages.length === 0 && <li className="text-gray-500 text-center py-4">데이터가 없습니다.</li>}
                </ul>
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
          <DataTable
            headers={['회사명', '지역', '면적', '연락처', '액션']}
            data={warehouses}
            renderRow={(w) => (
              <>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewDetails(w, 'warehouse')}
                    className="font-medium text-primary-600 hover:text-primary-800 hover:underline text-left"
                  >
                    {w.companyName}
                  </button>
                </td>
                <td className="px-6 py-4">{w.location}</td>
                <td className="px-6 py-4">{w.availableArea.toLocaleString()} / {w.totalArea.toLocaleString()}</td>
                <td className="px-6 py-4">{w.phone}</td>
                <td className="px-6 py-4 flex gap-2">
                  <ActionButton icon={Eye} onClick={() => handleViewDetails(w, 'warehouse')} />
                  <ActionButton icon={Trash2} color="red" onClick={() => handleDelete('warehouses', w.id)} />
                </td>
              </>
            )}
          />
        )}

        {/* 3. Customers */}
        {activeTab === 'customers' && (
          <DataTable
            headers={['회사명', '지역', '월 물동량', '연락처', '액션']}
            data={customers}
            renderRow={(c) => (
              <>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewDetails(c, 'customer')}
                    className="font-medium text-primary-600 hover:text-primary-800 hover:underline text-left"
                  >
                    {c.companyName}
                  </button>
                </td>
                <td className="px-6 py-4">{c.location}</td>
                <td className="px-6 py-4">{c.monthlyVolume.toLocaleString()}</td>
                <td className="px-6 py-4">{c.phone}</td>
                <td className="px-6 py-4 flex gap-2">
                  <ActionButton icon={Eye} onClick={() => handleViewDetails(c, 'customer')} />
                  <ActionButton icon={Trash2} color="red" onClick={() => handleDelete('customers', c.id)} />
                </td>
              </>
            )}
          />
        )}

        {/* 4. Payments (New) */}
        {activeTab === 'payments' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">전체 결제 내역</h3>
              <span className="text-lg font-bold text-primary-600">Total: {totalRevenue.toLocaleString()}원</span>
            </div>
            <DataTable
              headers={['일시', '사용자', '상품명', '금액', '상태']}
              data={payments}
              renderRow={(p) => (
                <>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium">{p.userName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${p.package_type.includes('event') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {p.package_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">{Number(p.amount).toLocaleString()}원</td>
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
                  headers={['회사명', '연락처', '지역', '액션']}
                  data={pendingWarehouseList}
                  renderRow={(w) => (
                    <>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetails(w, 'warehouse')}
                          className="font-medium text-primary-600 hover:text-primary-800 hover:underline text-left"
                        >
                          {w.companyName}
                        </button>
                      </td>
                      <td className="px-6 py-4">{w.phone}</td>
                      <td className="px-6 py-4">{w.location}</td>
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
                  headers={['회사명', '연락처', '필요면적', '액션']}
                  data={pendingCustomerList}
                  renderRow={(c) => (
                    <>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetails(c, 'customer')}
                          className="font-medium text-primary-600 hover:text-primary-800 hover:underline text-left"
                        >
                          {c.companyName}
                        </button>
                      </td>
                      <td className="px-6 py-4">{c.phone}</td>
                      <td className="px-6 py-4">{c.requiredArea}</td>
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

      </div>

      {isDetailModalOpen && (
        <DetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          data={selectedItem}
          type={selectedItemType}
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
      </div>
    </div>
  );
};

const ActionButton = ({ icon: Icon, onClick, color = 'gray' }) => (
  <button onClick={onClick} className={`text-${color}-600 hover:text-${color}-900 p-1`}>
    <Icon className="w-5 h-5" />
  </button>
);

export default AdminDashboard;
