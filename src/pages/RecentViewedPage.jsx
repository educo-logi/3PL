import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, Building2, Users, Eye } from 'lucide-react';
import { getRecentViewedItems } from '../utils/viewingPassUtils';
import { supabase } from '../utils/supabaseClient';
import { useViewedStatus } from '../hooks/useViewedStatus';
import DetailModal from '../components/DetailModal';

const RecentViewedPage = () => {
  const navigate = useNavigate();
  const [recentItems, setRecentItems] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      navigate('/login');
      return;
    }

    loadRecentItems();
  }, [navigate]);

  const loadRecentItems = async () => {
    const recent = await getRecentViewedItems(20);
    setRecentItems(recent);

    const warehouseIds = recent.filter(r => r.item_type === 'warehouse').map(r => r.item_id);
    const customerIds = recent.filter(r => r.item_type === 'customer').map(r => r.item_id);

    const [warehousesRes, customersRes] = await Promise.all([
      warehouseIds.length
        ? supabase.from('warehouses').select('*').in('id', warehouseIds)
        : { data: [] },
      customerIds.length
        ? supabase.from('customers').select('*').in('id', customerIds)
        : { data: [] }
    ]);

    const warehouseMap = new Map((warehousesRes.data || []).map(w => [w.id, w]));
    const customerMap = new Map((customersRes.data || []).map(c => [c.id, c]));

    const recentItemsData = recent
      .map(r => {
        if (r.item_type === 'warehouse') return warehouseMap.get(r.item_id);
        return customerMap.get(r.item_id);
      })
      .filter(Boolean);

    setItems(recentItemsData);
  };

  const handleViewDetail = (item, type) => {
    setSelectedItem(item);
    setSelectedItemType(type);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            뒤로가기
          </button>
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">최근 본 업체</h1>
          </div>
        </div>

        {/* 최근 본 목록 */}
        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">최근에 본 업체가 없습니다.</p>
            <p className="text-gray-500 text-sm mt-2">
              업체를 열람하면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => {
              const recentItem = recentItems[index];
              const type = recentItem?.item_type || 'warehouse';
              const { displayName, loading } = useViewedStatus(item, type);
              return (
                <div key={item.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      {type === 'warehouse' ? (
                        <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                      ) : (
                        <Users className="w-5 h-5 text-green-600 mr-2" />
                      )}
                      <h3 className="text-lg font-bold text-gray-900">
                        {loading ? '로딩중...' : displayName}
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-2 text-sm">
                    {item.location} {item.city} {item.dong}
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    열람일: {recentItem?.viewed_at ? new Date(recentItem.viewed_at).toLocaleString('ko-KR') : '-'}
                  </p>

                  <button
                    onClick={() => handleViewDetail(item, type)}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    자세히 보기 (열람권 소진 없음)
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 상세 정보 모달 */}
      {isDetailModalOpen && selectedItem && (
        <DetailModal
          isOpen={isDetailModalOpen}
          data={selectedItem}
          type={selectedItemType}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedItem(null);
            setSelectedItemType(null);
          }}
        />
      )}
    </div>
  );
};

export default RecentViewedPage;

