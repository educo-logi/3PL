import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, Building2, Users, Eye } from 'lucide-react';
import { getFavorites, toggleFavorite, getDisplayNameHelper, isAlreadyViewed } from '../utils/viewingPassUtils';
import { supabase } from '../utils/supabaseClient';
import { warehouseData, customerData } from '../data/sampleData';
import DetailModal from '../components/DetailModal';

const FavoritesPage = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewedStatus, setViewedStatus] = useState({});

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      loadFavorites();
    };
    checkAuthAndLoad();
  }, [navigate]);

  const loadFavorites = async () => {
    // getFavorites is still sync (localStorage)
    const favs = getFavorites();
    setFavorites(favs);

    // 모든 데이터에서 즐겨찾기 항목 찾기
    const allWarehouses = [
      ...warehouseData,
      ...JSON.parse(localStorage.getItem('approvedWarehouses') || '[]')
    ];
    const allCustomers = [
      ...customerData,
      ...JSON.parse(localStorage.getItem('approvedCustomers') || '[]')
    ];

    const favoriteItems = favs.map(fav => {
      if (fav.itemType === 'warehouse') {
        const item = allWarehouses.find(w => w.id === fav.itemId);
        return item ? { ...item, itemType: 'warehouse' } : null;
      } else {
        const item = allCustomers.find(c => c.id === fav.itemId);
        return item ? { ...item, itemType: 'customer' } : null;
      }
    }).filter(Boolean);

    setItems(favoriteItems);

    // Check viewed status for all items
    const statusMap = {};
    for (const item of favoriteItems) {
      statusMap[item.id] = await isAlreadyViewed(item.id, item.itemType);
    }
    setViewedStatus(statusMap);
  };

  const handleRemoveFavorite = (itemId, itemType) => {
    toggleFavorite(itemId, itemType);
    loadFavorites();
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
            <Star className="w-8 h-8 text-yellow-500 mr-3 fill-current" />
            <h1 className="text-3xl font-bold text-gray-900">즐겨찾기</h1>
          </div>
        </div>

        {/* 즐겨찾기 목록 */}
        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">즐겨찾기한 업체가 없습니다.</p>
            <p className="text-gray-500 text-sm mt-2">
              업체 카드에서 별 아이콘을 클릭하여 즐겨찾기에 추가하세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => {
              const type = item.itemType || 'warehouse';
              const isViewed = viewedStatus[item.id];
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
                        {getDisplayNameHelper(item, type, isViewed)}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(item.id, type)}
                      className="text-yellow-500 hover:text-yellow-600"
                      title="즐겨찾기 제거"
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  </div>

                  <p className="text-gray-600 mb-4 text-sm">
                    {isViewed || localStorage.getItem('adminAuth') === 'true'
                      ? `${item.location} ${item.city} ${item.dong}`
                      : `${item.location} (상세 지역 비공개)`
                    }
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetail(item, type)}
                      className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      자세히 보기
                    </button>
                  </div>
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

export default FavoritesPage;

