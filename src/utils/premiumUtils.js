/**
 * 프리미엄 신청 관리 유틸리티 함수
 */

const PREMIUM_APPLICATIONS_KEY = 'premiumApplications';
const PREMIUM_ITEMS_KEY = 'premiumItems';

/**
 * 프리미엄 신청 패키지 정보
 */
export const premiumPackages = {
  '1month': { months: 1, price: 30000, name: '1개월 프리미엄', monthlyPrice: 30000 },
  '2month': { months: 2, price: 50000, name: '2개월 프리미엄', monthlyPrice: 25000, discount: '17% 할인' },
  '3month': { months: 3, price: 80000, name: '3개월 프리미엄', monthlyPrice: 26667, discount: '11% 할인' }
};

/**
 * 프리미엄 신청 생성
 */
export const createPremiumApplication = (userId, userType, itemId, itemType, packageType) => {
  const applications = JSON.parse(localStorage.getItem(PREMIUM_APPLICATIONS_KEY) || '[]');
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + premiumPackages[packageType].months);
  
  const application = {
    id: `premium-${userId}-${Date.now()}`,
    userId,
    userType,
    itemId,
    itemType,
    packageType,
    amount: premiumPackages[packageType].price,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    paymentDate: new Date().toISOString()
  };
  
  applications.push(application);
  localStorage.setItem(PREMIUM_APPLICATIONS_KEY, JSON.stringify(applications));
  
  // 프리미엄 아이템 업데이트
  updatePremiumItem(itemId, itemType, endDate.toISOString());
  
  return application;
};

/**
 * 프리미엄 아이템 업데이트
 */
const updatePremiumItem = (itemId, itemType, endDate) => {
  const premiumItems = JSON.parse(localStorage.getItem(PREMIUM_ITEMS_KEY) || '[]');
  
  // 기존 항목 찾기
  const existingIndex = premiumItems.findIndex(
    item => item.itemId === itemId && item.itemType === itemType
  );
  
  const premiumItem = {
    itemId,
    itemType,
    endDate,
    isPremium: true,
    updatedAt: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    // 기존 항목 업데이트 (만료일 연장)
    premiumItems[existingIndex] = premiumItem;
  } else {
    // 새 항목 추가
    premiumItems.push(premiumItem);
  }
  
  localStorage.setItem(PREMIUM_ITEMS_KEY, JSON.stringify(premiumItems));
  
  // 실제 데이터도 업데이트
  updateItemPremiumStatus(itemId, itemType, true, endDate);
};

/**
 * 실제 아이템 데이터의 프리미엄 상태 업데이트
 */
const updateItemPremiumStatus = (itemId, itemType, isPremium, endDate) => {
  if (itemType === 'warehouse') {
    const warehouses = JSON.parse(localStorage.getItem('approvedWarehouses') || '[]');
    const warehouse = warehouses.find(w => w.id === itemId);
    if (warehouse) {
      warehouse.isPremium = isPremium;
      warehouse.premiumEndDate = endDate;
      localStorage.setItem('approvedWarehouses', JSON.stringify(warehouses));
    }
  } else if (itemType === 'customer') {
    const customers = JSON.parse(localStorage.getItem('approvedCustomers') || '[]');
    const customer = customers.find(c => c.id === itemId);
    if (customer) {
      customer.isPremium = isPremium;
      customer.premiumEndDate = endDate;
      localStorage.setItem('approvedCustomers', JSON.stringify(customers));
    }
  }
};

/**
 * 프리미엄 상태 확인
 */
export const isPremiumActive = (itemId, itemType) => {
  const premiumItems = JSON.parse(localStorage.getItem(PREMIUM_ITEMS_KEY) || '[]');
  const premiumItem = premiumItems.find(
    item => item.itemId === itemId && item.itemType === itemType
  );
  
  if (!premiumItem) return false;
  
  // 만료일 확인
  const endDate = new Date(premiumItem.endDate);
  const now = new Date();
  
  if (endDate < now) {
    // 만료된 경우 상태 업데이트
    updateItemPremiumStatus(itemId, itemType, false, null);
    return false;
  }
  
  return true;
};

/**
 * 사용자의 프리미엄 신청 내역 조회
 */
export const getUserPremiumApplications = (userId) => {
  const applications = JSON.parse(localStorage.getItem(PREMIUM_APPLICATIONS_KEY) || '[]');
  return applications.filter(app => app.userId === userId);
};

/**
 * 사용자가 해당 아이템의 프리미엄 소유자인지 확인
 */
export const isPremiumOwner = (userId, itemId, itemType) => {
  const applications = JSON.parse(localStorage.getItem(PREMIUM_APPLICATIONS_KEY) || '[]');
  return applications.some(app => 
    app.userId === userId && 
    app.itemId === itemId && 
    app.itemType === itemType &&
    app.status === 'active'
  );
};

/**
 * 아이템의 프리미엄 신청 내역 조회
 */
export const getItemPremiumApplications = (itemId, itemType) => {
  const applications = JSON.parse(localStorage.getItem(PREMIUM_APPLICATIONS_KEY) || '[]');
  return applications.filter(
    app => app.itemId === itemId && app.itemType === itemType
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * 프리미엄 만료 체크 및 업데이트
 */
export const checkAndUpdateExpiredPremiums = () => {
  const premiumItems = JSON.parse(localStorage.getItem(PREMIUM_ITEMS_KEY) || '[]');
  const now = new Date();
  
  premiumItems.forEach(item => {
    const endDate = new Date(item.endDate);
    if (endDate < now && item.isPremium) {
      updateItemPremiumStatus(item.itemId, item.itemType, false, null);
    }
  });
};

/**
 * 프리미엄 아이템 정렬 (최근 신청 순)
 */
export const sortPremiumItems = (items) => {
  const premiumItems = JSON.parse(localStorage.getItem(PREMIUM_ITEMS_KEY) || '[]');
  
  return items.sort((a, b) => {
    const aIsPremium = isPremiumActive(a.id, 'warehouse') || isPremiumActive(a.id, 'customer');
    const bIsPremium = isPremiumActive(b.id, 'warehouse') || isPremiumActive(b.id, 'customer');
    
    // 프리미엄 우선
    if (aIsPremium && !bIsPremium) return -1;
    if (!aIsPremium && bIsPremium) return 1;
    
    // 둘 다 프리미엄이면 최근 신청 순
    if (aIsPremium && bIsPremium) {
      const aApp = getItemPremiumApplications(a.id, a.userType || 'warehouse')[0];
      const bApp = getItemPremiumApplications(b.id, b.userType || 'warehouse')[0];
      
      if (aApp && bApp) {
        return new Date(bApp.createdAt) - new Date(aApp.createdAt);
      }
      if (aApp) return -1;
      if (bApp) return 1;
    }
    
    return 0;
  });
};

