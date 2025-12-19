import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  MapPin,
  Package,
  LogOut,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Supabase -> UI 데이터 정규화
  const normalizeWarehouse = (w = {}) => {
    const num = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    return {
      ...w,
      companyName: w.companyName ?? w.company_name ?? '',
      location: w.location ?? '',
      city: w.city ?? '',
      dong: w.dong ?? '',
      totalArea: num(w.totalArea ?? w.total_area),
      availableArea: num(w.availableArea ?? w.available_area),
      warehouseCount: num(w.warehouseCount ?? w.warehouse_count),
      palletCount: num(w.palletCount ?? w.pallet_count),
      experience: w.experience ?? w.experience_years ?? w.experienceMonths ?? w.experience_months ?? '',
      storageTypes: arr(w.storageTypes ?? w.storage_types),
      deliveryCompanies: arr(w.deliveryCompanies ?? w.delivery_companies ?? w.delivery),
      products: arr(w.products),
      solutions: arr(w.solutions ?? w.solution_list ?? w.solution),
      isPremium: w.isPremium ?? w.is_premium ?? false,
      submittedAt: w.submittedAt ?? w.submitted_at,
    };
  };

  const normalizeCustomer = (c = {}) => {
    const num = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    return {
      ...c,
      companyName: c.companyName ?? c.company_name ?? '',
      location: c.location ?? '',
      city: c.city ?? '',
      dong: c.dong ?? '',
      requiredArea: num(c.requiredArea ?? c.required_area),
      monthlyVolume: num(c.monthlyVolume ?? c.monthly_volume),
      palletCount: num(c.palletCount ?? c.pallet_count),
      products: arr(c.products),
      desiredDelivery: arr(c.desiredDelivery ?? c.desired_delivery),
      submittedAt: c.submittedAt ?? c.submitted_at,
    };
  };

  useEffect(() => {
    const isAdmin = localStorage.getItem('adminAuth');
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }

    const fetchData = async () => {
      const { data: approvedW } = await supabase
        .from('warehouses')
        .select('*')
        .eq('status', 'approved');
      const { data: approvedC } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'approved');
      const { data: pendingW } = await supabase
        .from('warehouses')
        .select('*')
        .eq('status', 'pending');
      const { data: pendingC } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'pending');

      setWarehouses((approvedW || []).map(normalizeWarehouse));
      setCustomers((approvedC || []).map(normalizeCustomer));
      setPendingWarehouseList((pendingW || []).map(normalizeWarehouse));
      setPendingCustomerList((pendingC || []).map(normalizeCustomer));
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };

  const handleDeleteWarehouse = (id) => {
    if (window.confirm('정말로 이 창고를 삭제하시겠습니까?')) {
      setWarehouses(prev => prev.filter(w => w.id !== id));
    }
  };

  const handleDeleteCustomer = (id) => {
    if (window.confirm('정말로 이 고객사를 삭제하시겠습니까?')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  const callApproveFunction = async (itemId, table, approve) => {
    // Edge Function 대신 직접 DB 업데이트 시도
    // 주의: RLS(Row Level Security) 정책에 따라 권한이 거부될 수 있음.
    // 현재는 프로토타입 단계이므로 Client-side에서 직접 수행.

    // 승인/거절 상태 Update
    const updateData = {
      status: approve ? 'approved' : 'rejected',
      approved_at: approve ? new Date().toISOString() : null
    };

    const { error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', itemId);

    if (error) {
      console.error('승인/거절 실패:', error);
      alert('승인/거절 처리 중 오류가 발생했습니다: ' + error.message);
      return false;
    }
    return true;
  };

  const refreshLists = async () => {
    const { data: approvedW } = await supabase
      .from('warehouses')
      .select('*')
      .eq('status', 'approved');
    const { data: approvedC } = await supabase
      .from('customers')
      .select('*')
      .eq('status', 'approved');
    const { data: pendingW } = await supabase
      .from('warehouses')
      .select('*')
      .eq('status', 'pending');
    const { data: pendingC } = await supabase
      .from('customers')
      .select('*')
      .eq('status', 'pending');

    setWarehouses((approvedW || []).map(normalizeWarehouse));
    setCustomers((approvedC || []).map(normalizeCustomer));
    setPendingWarehouseList((pendingW || []).map(normalizeWarehouse));
    setPendingCustomerList((pendingC || []).map(normalizeCustomer));
  };

  const handleApproveWarehouse = async (pendingWarehouse) => {
    if (!window.confirm('이 창고를 승인하시겠습니까?')) return;
    const ok = await callApproveFunction(pendingWarehouse.id, 'warehouses', true);
    if (ok) {
      await refreshLists();
      alert('창고가 승인되었습니다.');
    }
  };

  const handleRejectWarehouse = async (pendingWarehouseId) => {
    if (!window.confirm('이 창고 등록을 거부하시겠습니까?')) return;
    const ok = await callApproveFunction(pendingWarehouseId, 'warehouses', false);
    if (ok) {
      await refreshLists();
      alert('창고 등록이 거부되었습니다.');
    }
  };

  const handleApproveCustomer = async (pendingCustomer) => {
    if (!window.confirm('이 고객사를 승인하시겠습니까?')) return;
    const ok = await callApproveFunction(pendingCustomer.id, 'customers', true);
    if (ok) {
      await refreshLists();
      alert('고객사가 승인되었습니다.');
    }
  };

  const handleRejectCustomer = async (pendingCustomerId) => {
    if (!window.confirm('이 고객사 등록을 거부하시겠습니까?')) return;
    const ok = await callApproveFunction(pendingCustomerId, 'customers', false);
    if (ok) {
      await refreshLists();
      alert('고객사 등록이 거부되었습니다.');
    }
  };

  // 상세보기 핸들러
  const handleViewDetails = (item, type) => {
    setSelectedItem(item);
    setSelectedItemType(type);
    setIsDetailModalOpen(true);
  };

  const stats = {
    totalWarehouses: warehouses.length,
    totalCustomers: customers.length,
    premiumWarehouses: warehouses.filter(w => w.isPremium).length,
    totalArea: warehouses.reduce((sum, w) => sum + (w.totalArea || 0), 0),
    availableArea: warehouses.reduce((sum, w) => sum + (w.availableArea || 0), 0),
    totalMonthlyVolume: customers.reduce((sum, c) => sum + (c.monthlyVolume || 0), 0),
    pendingWarehouses: pendingWarehouseList.length,
    pendingCustomers: pendingCustomerList.length
  };

  const regionStats = warehouses.reduce((acc, warehouse) => {
    acc[warehouse.location] = (acc[warehouse.location] || 0) + 1;
    return acc;
  }, {});

  const topRegions = Object.entries(regionStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              개요
            </button>
            <button
              onClick={() => setActiveTab('warehouses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'warehouses'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              창고 관리
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'customers'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              고객사 관리
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              검토 중인 항목 ({stats.pendingWarehouses + stats.pendingCustomers})
            </button>
          </nav>
        </div>

        {/* 개요 탭 */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Building2 className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">총 창고 수</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalWarehouses}개</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">총 고객사 수</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalCustomers}개</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">프리미엄 창고</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.premiumWarehouses}개</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">총 면적</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.totalArea.toLocaleString()}㎡
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 상세 통계 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">면적 현황</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">총 면적</span>
                    <span className="font-medium">{stats.totalArea.toLocaleString()}㎡</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">이용가능 면적</span>
                    <span className="font-medium text-green-600">{stats.availableArea.toLocaleString()}㎡</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">이용률</span>
                    <span className="font-medium">
                      {((stats.availableArea / stats.totalArea) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">지역별 창고 현황</h3>
                <div className="space-y-2">
                  {topRegions.map(([region, count]) => (
                    <div key={region} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{region}</span>
                      </div>
                      <span className="font-medium">{count}개</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 월 평균 출고량 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">고객사 월 평균 출고량</h3>
              <div className="text-3xl font-bold text-primary-600">
                {stats.totalMonthlyVolume.toLocaleString()}개
              </div>
            </div>
          </div>
        )}

        {/* 창고 관리 탭 */}
        {activeTab === 'warehouses' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">창고 관리</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      회사명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      지역
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      면적
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      보관방식
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      프리미엄
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      신청일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      승인일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      연락처
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {warehouses.sort((a, b) => {
                    const getSortDate = (item) => {
                      if (item.approvedAt) return new Date(item.approvedAt).getTime();
                      if (item.submittedAt) return new Date(item.submittedAt).getTime();
                      if (typeof item.id === 'string' && item.id.includes('-')) {
                        const timestamp = item.id.split('-').pop();
                        return parseInt(timestamp) || 0;
                      }
                      return typeof item.id === 'number' ? item.id : 0;
                    };
                    return getSortDate(b) - getSortDate(a);
                  }).map((warehouse) => (
                    <tr key={warehouse.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {warehouse.companyName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{warehouse.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(warehouse.availableArea || 0).toLocaleString()}㎡ / {(warehouse.totalArea || 0).toLocaleString()}㎡
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {warehouse.storageTypes && warehouse.storageTypes.length
                            ? warehouse.storageTypes.join(', ')
                            : (warehouse.temperature || '-')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {warehouse.isPremium ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            프리미엄
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            일반
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {warehouse.submittedAt
                            ? new Date(warehouse.submittedAt).toLocaleDateString('ko-KR')
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {warehouse.approvedAt
                            ? new Date(warehouse.approvedAt).toLocaleDateString('ko-KR')
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>{warehouse.phone}</div>
                          <div className="text-gray-500">{warehouse.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(warehouse, 'warehouse')}
                            className="text-primary-600 hover:text-primary-900"
                            title="자세히 보기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWarehouse(warehouse.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 고객사 관리 탭 */}
        {activeTab === 'customers' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">고객사 관리</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      회사명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      지역
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      필요면적
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      월 출고량
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      취급물품
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      신청일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      승인일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      연락처
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.sort((a, b) => {
                    const getSortDate = (item) => {
                      if (item.approvedAt) return new Date(item.approvedAt).getTime();
                      if (item.submittedAt) return new Date(item.submittedAt).getTime();
                      if (typeof item.id === 'string' && item.id.includes('-')) {
                        const timestamp = item.id.split('-').pop();
                        return parseInt(timestamp) || 0;
                      }
                      return typeof item.id === 'number' ? item.id : 0;
                    };
                    return getSortDate(b) - getSortDate(a);
                  }).map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.companyName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(customer.requiredArea || 0).toLocaleString()}㎡
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(customer.monthlyVolume || 0).toLocaleString()}개
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.products.join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.submittedAt
                            ? new Date(customer.submittedAt).toLocaleDateString('ko-KR')
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.approvedAt
                            ? new Date(customer.approvedAt).toLocaleDateString('ko-KR')
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>{customer.phone}</div>
                          <div className="text-gray-500">{customer.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(customer, 'customer')}
                            className="text-primary-600 hover:text-primary-900"
                            title="자세히 보기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 검토 중인 항목 탭 */}
        {activeTab === 'pending' && (
          <div className="space-y-8">
            {/* 검토 중인 창고 */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">검토 중인 창고 ({pendingWarehouseList.length}개)</h3>
                </div>
              </div>
              {pendingWarehouseList.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  검토 중인 창고가 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          회사명
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          지역
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          면적
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          보관방식
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          신청일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          액션
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingWarehouseList.sort((a, b) => {
                        const getSortDate = (item) => {
                          if (item.submittedAt) return new Date(item.submittedAt).getTime();
                          if (typeof item.id === 'string' && item.id.includes('-')) {
                            const timestamp = item.id.split('-').pop();
                            return parseInt(timestamp) || 0;
                          }
                          return typeof item.id === 'number' ? item.id : 0;
                        };
                        return getSortDate(b) - getSortDate(a);
                      }).map((warehouse) => (
                        <tr key={warehouse.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {warehouse.companyName}
                            </div>
                            <div className="text-sm text-gray-500">{warehouse.representative}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{warehouse.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {warehouse.availableArea.toLocaleString()}㎡ / {warehouse.totalArea.toLocaleString()}㎡
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{warehouse.temperature}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {warehouse.submittedAt
                                ? new Date(warehouse.submittedAt).toLocaleDateString('ko-KR')
                                : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproveWarehouse(warehouse)}
                                className="text-green-600 hover:text-green-900 flex items-center"
                                title="승인"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                승인
                              </button>
                              <button
                                onClick={() => handleRejectWarehouse(warehouse.id)}
                                className="text-red-600 hover:text-red-900 flex items-center"
                                title="거부"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                거부
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 검토 중인 고객사 */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">검토 중인 고객사 ({pendingCustomerList.length}개)</h3>
                </div>
              </div>
              {pendingCustomerList.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  검토 중인 고객사가 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          회사명
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          지역
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          필요면적
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          월 출고량
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          취급물품
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          신청일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          액션
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingCustomerList.sort((a, b) => {
                        const getSortDate = (item) => {
                          if (item.submittedAt) return new Date(item.submittedAt).getTime();
                          if (typeof item.id === 'string' && item.id.includes('-')) {
                            const timestamp = item.id.split('-').pop();
                            return parseInt(timestamp) || 0;
                          }
                          return typeof item.id === 'number' ? item.id : 0;
                        };
                        return getSortDate(b) - getSortDate(a);
                      }).map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.companyName}
                            </div>
                            <div className="text-sm text-gray-500">{customer.representative}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{customer.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {customer.requiredArea.toLocaleString()}㎡
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {customer.monthlyVolume.toLocaleString()}개
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {customer.products.join(', ')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {customer.submittedAt
                                ? new Date(customer.submittedAt).toLocaleDateString('ko-KR')
                                : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproveCustomer(customer)}
                                className="text-green-600 hover:text-green-900 flex items-center"
                                title="승인"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                승인
                              </button>
                              <button
                                onClick={() => handleRejectCustomer(customer.id)}
                                className="text-red-600 hover:text-red-900 flex items-center"
                                title="거부"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                거부
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 상세보기 모달 */}
      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        data={selectedItem}
        type={selectedItemType}
      />
    </div>
  );
};

export default AdminDashboard;
