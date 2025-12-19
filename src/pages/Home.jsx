import React, { useEffect, useState } from 'react';
import { Search, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import WarehouseCard from '../components/WarehouseCard';
import CustomerCard from '../components/CustomerCard';

const normalizeWarehouse = (w) => ({
  ...w,
  availableArea: Number(w.available_area ?? w.availableArea ?? 0),
  totalArea: Number(w.total_area ?? w.totalArea ?? 0),
  palletCount: Number(w.pallet_count ?? w.palletCount ?? 0),
  temperature: Array.isArray(w.storage_types)
    ? w.storage_types.join('/')
    : w.temperature || '',
  delivery: Array.isArray(w.delivery_companies) ? w.delivery_companies : w.delivery || [],
  products: Array.isArray(w.products) ? w.products : [],
  solution: Array.isArray(w.solutions) ? w.solutions.join(', ') : w.other_solution || '',
  experience: w.experience || '',
});

const normalizeCustomer = (c) => ({
  ...c,
  requiredArea: Number(c.required_area ?? c.requiredArea ?? 0),
  monthlyVolume: Number(c.monthly_volume ?? c.monthlyVolume ?? 0),
  palletCount: Number(c.pallet_count ?? c.palletCount ?? 0),
  products: Array.isArray(c.products) ? c.products : [],
  desiredDelivery: Array.isArray(c.desired_delivery)
    ? c.desired_delivery
    : c.desiredDelivery || [],
});

const Home = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [premiumApps, setPremiumApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const nowIso = new Date().toISOString();
      const [{ data: w }, { data: c }, { data: p }] = await Promise.all([
        supabase.from('warehouses').select('*').eq('status', 'approved'),
        supabase.from('customers').select('*').eq('status', 'approved'),
        supabase
          .from('premium_applications')
          .select('item_id,item_type,created_at,end_at,status')
          .eq('status', 'approved')
          .gt('end_at', nowIso)
          .order('created_at', { ascending: false }),
      ]);
      setWarehouses((w || []).map(normalizeWarehouse));
      setCustomers((c || []).map(normalizeCustomer));
      setPremiumApps(p || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const premiumMap = premiumApps.reduce(
    (acc, app) => {
      if (app.item_type === 'warehouse') acc.w.add(app.item_id);
      else acc.c.add(app.item_id);
      return acc;
    },
    { w: new Set(), c: new Set() }
  );

  const sortPremium = (arr, type) => {
    const latestById = new Map();
    premiumApps
      .filter((a) => a.item_type === type)
      .forEach((a) => {
        if (!latestById.has(a.item_id)) latestById.set(a.item_id, a);
      });
    return [...arr].sort((a, b) => {
      const la = latestById.get(a.id);
      const lb = latestById.get(b.id);
      if (la && lb) return new Date(lb.created_at) - new Date(la.created_at);
      if (la) return -1;
      if (lb) return 1;
      return 0;
    });
  };

  const premiumWarehouses = sortPremium(
    warehouses.filter((w) => premiumMap.w.has(w.id)),
    'warehouse'
  );
  const premiumCustomers = sortPremium(
    customers.filter((c) => premiumMap.c.has(c.id)),
    'customer'
  );

  const latestWarehouses = warehouses
    .filter((w) => !premiumMap.w.has(w.id))
    .sort(
      (a, b) =>
        new Date(b.approved_at || b.submitted_at || b.created_at || 0) -
        new Date(a.approved_at || a.submitted_at || a.created_at || 0)
    )
    .slice(0, 6);

  const latestCustomers = customers
    .filter((c) => !premiumMap.c.has(c.id))
    .sort(
      (a, b) =>
        new Date(b.approved_at || b.submitted_at || b.created_at || 0) -
        new Date(a.approved_at || a.submitted_at || a.created_at || 0)
    )
    .slice(0, 6);

  return (
    <div className="bg-gray-50">
      {/* 배너 섹션 */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            물류대행 플랫폼
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 text-blue-100 max-w-4xl mx-auto">
            화주사와 물류 창고업체를 연결하는 스마트한 매칭 서비스
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <button
              onClick={() => navigate('/warehouse-search')}
              className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold transition-colors w-full sm:w-auto"
            >
              창고 찾기
            </button>
            <button
              onClick={() => navigate('/customer-search')}
              className="bg-white text-primary-600 hover:bg-gray-100 px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold transition-colors w-full sm:w-auto"
            >
              고객사 찾기
            </button>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 창고 섹션 */}
          <div className="mb-12 md:mb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
              <div className="flex items-center">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mr-2 sm:mr-3" />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">창고 찾기</h2>
              </div>
              <a
                href="/warehouse-search"
                className="flex items-center text-primary-600 hover:text-primary-700 font-semibold text-sm sm:text-base"
              >
                전체보기
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </div>

            {premiumWarehouses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 md:mb-8">
                {premiumWarehouses.map((warehouse) => (
                  <WarehouseCard key={warehouse.id} warehouse={warehouse} isPremium />
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {latestWarehouses.map((warehouse) => (
                <WarehouseCard key={warehouse.id} warehouse={warehouse} />
              ))}
            </div>
          </div>

          {/* 고객사 섹션 */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
              <div className="flex items-center">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mr-2 sm:mr-3" />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">고객사 찾기</h2>
              </div>
              <a
                href="/customer-search"
                className="flex items-center text-primary-600 hover:text-primary-700 font-semibold text-sm sm:text-base"
              >
                전체보기
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </div>

            {premiumCustomers.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 md:mb-8">
                {premiumCustomers.map((customer) => (
                  <CustomerCard key={customer.id} customer={customer} />
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {latestCustomers.map((customer) => (
                <CustomerCard key={customer.id} customer={customer} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <div className="bg-white/80 rounded-lg px-4 py-2 text-gray-600 shadow">불러오는 중...</div>
        </div>
      )}
    </div>
  );
};

export default Home;








