import React, { useState, useEffect } from 'react';
import { MapPin, Square, Thermometer, Truck, Star as StarIcon, Eye } from 'lucide-react';
import { isFavorite, toggleFavorite } from '../utils/viewingPassUtils';
import { formatArea } from '../utils/areaConverter';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import ViewingPassConfirmModal from './ViewingPassConfirmModal';
import ViewingPassExpiredModal from './ViewingPassExpiredModal';
import NoViewingPassModal from './NoViewingPassModal';
import DetailModal from './DetailModal';
import { useNavigate } from 'react-router-dom';
import { 
  checkViewingPass, 
  isExpired, 
  isAlreadyViewed, 
  useViewingPass,
  getViewingPassInfo,
  canCompare,
  getDisplayName
} from '../utils/viewingPassUtils';
import CompareNotAvailableModal from './CompareNotAvailableModal';

const WarehouseCard = ({ warehouse, isPremium = false }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false);
  const [isNoPassModalOpen, setIsNoPassModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsFav(isFavorite(warehouse.id, 'warehouse'));
  }, [warehouse.id]);

  const handleDetailClick = () => {
    // 관리자 체크
    const isAdmin = localStorage.getItem('adminAuth') === 'true';
    if (isAdmin) {
      // 관리자는 열람권 없이 바로 표시
      setIsDetailModalOpen(true);
      return;
    }

    // 로그인 확인
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      setIsNoPassModalOpen(true);
      return;
    }

    // 프리미엄 소유자 체크 (자신의 프리미엄 업체를 볼 때는 열람권 없이 볼 수 없음)
    // 프리미엄 신청과 열람권은 별개이므로, 프리미엄 소유자라도 열람권이 필요함
    // 이 부분은 제거 (프리미엄 신청만으로는 열람 불가)

    // 유효기간 확인
    const passInfo = getViewingPassInfo();
    if (passInfo && isExpired(passInfo)) {
      setIsExpiredModalOpen(true);
      return;
    }

    // 이미 본 항목인지 확인
    if (isAlreadyViewed(warehouse.id, 'warehouse')) {
      // 이미 본 항목이면 열람권 소진 없이 바로 표시
      setIsDetailModalOpen(true);
      return;
    }

    // 열람권 보유 확인
    if (!checkViewingPass()) {
      // 열람권이 없으면 모달 표시
      setIsNoPassModalOpen(true);
      return;
    }

    // 열람권이 있으면 확인 모달 표시
    setIsConfirmModalOpen(true);
  };

  const handleConfirmView = () => {
    const result = useViewingPass(
      warehouse.id,
      'warehouse',
      warehouse.companyName
    );

    if (result.success) {
      setIsConfirmModalOpen(false);
      setIsDetailModalOpen(true);
    } else {
      alert(result.message);
      if (result.expired) {
        setIsConfirmModalOpen(false);
        setIsExpiredModalOpen(true);
      }
    }
  };

  const handleSignupClick = () => {
    setIsSignupModalOpen(true);
  };

  const handleSelectWarehouse = () => {
    setIsSignupModalOpen(false);
    navigate('/warehouse-register');
  };

  const handleSelectCustomer = () => {
    setIsSignupModalOpen(false);
    navigate('/customer-register');
  };

  const isViewed = isAlreadyViewed(warehouse.id, 'warehouse');

  return (
    <>
      <div className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${
        isPremium ? 'border-2 border-secondary-500' : ''
      }`}>
      {isPremium && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
              if (!currentUser) {
                alert('프리미엄 신청을 하려면 로그인이 필요합니다.');
                return;
              }
              navigate(`/premium-apply?type=warehouse&itemId=${warehouse.id}`);
            }}
            className="bg-secondary-500 text-white px-3 py-1 rounded-full text-sm font-semibold hover:bg-secondary-600 transition-colors cursor-pointer"
          >
            프리미엄
          </button>
          <div className="flex items-center text-yellow-500">
            <StarIcon className="w-4 h-4 fill-current" />
            <span className="ml-1 text-sm font-semibold">광고</span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-gray-900">{getDisplayName(warehouse, 'warehouse')}</h3>
          {isViewed && (
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
              <Eye className="w-3 h-3" />
              열람
            </span>
          )}
        </div>
        <button
          onClick={() => {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) {
              setIsLoginModalOpen(true);
              return;
            }
            toggleFavorite(warehouse.id, 'warehouse');
            setIsFav(!isFav);
          }}
          className="text-yellow-500 hover:text-yellow-600 transition-colors"
          title={isFav ? '즐겨찾기 제거' : '즐겨찾기 추가'}
        >
          <StarIcon className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{warehouse.location} {warehouse.city} {warehouse.dong}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Square className="w-4 h-4 mr-2" />
          <span>이용가능: {formatArea(warehouse.availableArea)} / 이용가능 팔레트: {warehouse.palletCount}개</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Thermometer className="w-4 h-4 mr-2" />
          <span>보관방식: {warehouse.temperature}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Truck className="w-4 h-4 mr-2" />
          <span>배송사: {warehouse.delivery.join(', ')}</span>
        </div>
      </div>

      {isPremium && (
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <p><span className="font-semibold">경력:</span> {warehouse.experience}</p>
          <p><span className="font-semibold">취급물품:</span> {warehouse.products.join(', ')}</p>
          <p><span className="font-semibold">솔루션:</span> {warehouse.solution}</p>
        </div>
      )}

        <button 
          onClick={handleDetailClick}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
        >
          자세히 보기
        </button>
        
        {/* 비교하기 버튼 (선택 사항 - 나중에 비교 기능 구현 시 사용) */}
      </div>

      {/* 로그인 모달 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSignupClick={handleSignupClick}
      />

      {/* 회원가입 모달 */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSelectWarehouse={handleSelectWarehouse}
        onSelectCustomer={handleSelectCustomer}
      />

      {/* 상세 정보 모달 */}
      <DetailModal
        isOpen={isDetailModalOpen}
        data={warehouse}
        type="warehouse"
        onClose={() => setIsDetailModalOpen(false)}
      />

      {/* 열람권 소진 확인 모달 */}
      <ViewingPassConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmView}
        currentCount={getViewingPassInfo()?.remainingCount || 0}
        itemName={warehouse.companyName}
        itemType="warehouse"
      />

      {/* 열람권 만료 안내 모달 */}
      <ViewingPassExpiredModal
        isOpen={isExpiredModalOpen}
        onClose={() => setIsExpiredModalOpen(false)}
        expiryDate={getViewingPassInfo()?.expiryDate}
      />

      {/* 열람권 없음 안내 모달 */}
      <NoViewingPassModal
        isOpen={isNoPassModalOpen}
        onClose={() => setIsNoPassModalOpen(false)}
        onLogin={() => setIsLoginModalOpen(true)}
        onSignup={() => setIsSignupModalOpen(true)}
      />

      {/* 비교 불가 안내 모달 */}
      <CompareNotAvailableModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        notViewedItems={warehouse && !isAlreadyViewed(warehouse.id, 'warehouse') ? [{
          name: warehouse.companyName,
          type: 'warehouse'
        }] : []}
      />
    </>
  );
};

export default WarehouseCard;
