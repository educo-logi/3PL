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
  useViewingPass,
  getViewingPassInfo,
  canCompare,
  isAlreadyViewed
} from '../utils/viewingPassUtils';
import CompareNotAvailableModal from './CompareNotAvailableModal';

const WarehouseCard = ({ warehouse, isPremium = false, initialIsFav = false, initialIsViewed = false }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false);
  const [isNoPassModalOpen, setIsNoPassModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isFav, setIsFav] = useState(initialIsFav);
  const [currentPassCount, setCurrentPassCount] = useState(0);
  const navigate = useNavigate();

  // N+1 문제 해결: DB 조회 없이 로컬 데이터로 displayName 계산
  const getLocalDisplayName = () => {
    // 관리자면 항상 표시
    const isAdmin = localStorage.getItem('adminAuth') === 'true';
    if (isAdmin || initialIsViewed) {
      return warehouse.companyName || warehouse.company_name;
    }

    // 마스킹된 이름 생성
    const parts = [];
    if (warehouse.location) parts.push(warehouse.location);
    if (warehouse.city) parts.push(warehouse.city);
    if (warehouse.dong) parts.push(warehouse.dong);

    if (warehouse.city && warehouse.dong) {
      return `${parts.join(' ')} 창고`;
    } else if (warehouse.location) {
      return `${warehouse.location} 지역 창고`;
    }
    return '창고';
  };

  const displayName = getLocalDisplayName();

  // useEffect for isFavorite REMOVED to prevent N+1 DB calls

  const handleDetailClick = async () => {
    // 관리자 체크
    const isAdmin = localStorage.getItem('adminAuth') === 'true';
    if (isAdmin) {
      setIsDetailModalOpen(true);
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      setIsNoPassModalOpen(true);
      return;
    }

    // 이미 본 항목이면 바로 표시 (DB에서 실제 확인)
    const alreadyViewed = await isAlreadyViewed(warehouse.id, 'warehouse');
    if (alreadyViewed || initialIsViewed) {
      setIsDetailModalOpen(true);
      return;
    }

    // 열람권 체크 (병목 지점 최적화: 한 번만 호출)
    const passInfo = await getViewingPassInfo();

    // 1. 유효기간 확인
    if (passInfo && isExpired(passInfo)) {
      setIsExpiredModalOpen(true);
      return;
    }

    // 2. 보유 수량 확인
    const hasPass = passInfo && (passInfo.remaining_count ?? 0) > 0;

    if (!hasPass) {
      setIsNoPassModalOpen(true);
      return;
    }

    // 열람권이 있고 유효하면 확인 모달 표시
    // 현재 보유 열람권 수를 state에 저장
    setCurrentPassCount(passInfo.remaining_count ?? 0);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmView = async () => {
    // 확인 버튼을 누를 때 다시 한 번 이미 본 항목인지 확인
    const alreadyViewed = await isAlreadyViewed(warehouse.id, 'warehouse');
    if (alreadyViewed) {
      // 이미 본 항목이면 열람권 소진 없이 바로 표시
      setIsConfirmModalOpen(false);
      setIsDetailModalOpen(true);
      return;
    }

    const result = await useViewingPass(
      warehouse.id,
      'warehouse',
      warehouse.companyName
    );

    if (result.success) {
      setIsConfirmModalOpen(false);
      setIsDetailModalOpen(true);
      // 이미 본 항목이었는지 확인하여 사용자에게 알림 (선택사항)
      if (result.alreadyViewed) {
        // 이미 본 항목이었으면 열람권이 소진되지 않았음을 알림
        console.log('이미 본 항목이므로 열람권이 소진되지 않았습니다.');
      }
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

  return (
    <>
      <div className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${isPremium ? 'border-2 border-secondary-500' : ''
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
            <h3 className="text-xl font-bold text-gray-900">
              {displayName}
            </h3>
            {initialIsViewed && (
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
              (async () => {
                const added = await toggleFavorite(warehouse.id, 'warehouse');
                setIsFav(added);
              })();
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
        currentCount={currentPassCount}
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
        notViewedItems={warehouse && !initialIsViewed ? [{
          name: warehouse.companyName,
          type: 'warehouse'
        }] : []}
      />
    </>
  );
};

export default WarehouseCard;
