/**
 * 열람권 관리 유틸리티 함수
 */

const VIEWING_PASS_KEY = 'viewingPasses';

/**
 * 현재 사용자의 열람권 정보 조회
 */
export const getViewingPassInfo = () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser || !currentUser.id) {
    return null;
  }

  const viewingPasses = JSON.parse(localStorage.getItem(VIEWING_PASS_KEY) || '[]');
  const userPass = viewingPasses.find(pass => pass.userId === currentUser.id);
  
  return userPass || null;
};

/**
 * 열람권 보유 여부 확인
 */
export const checkViewingPass = () => {
  const passInfo = getViewingPassInfo();
  if (!passInfo) return false;

  // 유효기간 확인
  if (isExpired(passInfo)) return false;

  // 남은 횟수 확인
  return passInfo.remainingCount > 0;
};

/**
 * 유효기간 만료 확인
 */
export const isExpired = (passInfo) => {
  if (!passInfo || !passInfo.expiryDate) return true;
  return new Date(passInfo.expiryDate) < new Date();
};

/**
 * 이미 본 항목인지 확인
 */
export const isAlreadyViewed = (itemId, itemType) => {
  const passInfo = getViewingPassInfo();
  if (!passInfo || !passInfo.viewedItems) return false;

  return passInfo.viewedItems.some(
    item => item.itemId === itemId && item.itemType === itemType
  );
};

/**
 * 업체명 표시 (열람권 사용 후에만 실제 업체명 표시)
 * @param {Object} item - 창고 또는 고객사 객체
 * @param {string} itemType - 'warehouse' 또는 'customer'
 * @returns {string} - 표시할 이름
 */
export const getDisplayName = (item, itemType) => {
  // 관리자는 항상 실제 업체명 표시
  const isAdmin = localStorage.getItem('adminAuth') === 'true';
  if (isAdmin) {
    return item.companyName;
  }

  // 이미 본 항목이면 실제 업체명 표시
  if (isAlreadyViewed(item.id, itemType)) {
    return item.companyName;
  }

  // 열람권을 사용하지 않은 경우 지역 기반 이름 표시
  const locationParts = [];
  if (item.location) locationParts.push(item.location);
  if (item.city) locationParts.push(item.city);
  if (item.dong) locationParts.push(item.dong);

  const locationStr = locationParts.length > 0 ? locationParts.join(' ') : '지역';
  const typeStr = itemType === 'warehouse' ? '창고' : '고객사';

  // 지역 정보가 충분하면 상세하게, 아니면 간단하게
  if (item.city && item.dong) {
    return `${locationStr} ${typeStr}`;
  } else if (item.location) {
    return `${item.location} 지역 ${typeStr}`;
  } else {
    return `${typeStr}`;
  }
};

/**
 * 열람권 사용 (처음 볼 때만)
 */
export const useViewingPass = (itemId, itemType, itemName) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser || !currentUser.id) {
    return { success: false, message: '로그인이 필요합니다.' };
  }

  // 이미 본 항목이면 소진 없이 성공
  if (isAlreadyViewed(itemId, itemType)) {
    return { success: true, alreadyViewed: true };
  }

  const viewingPasses = JSON.parse(localStorage.getItem(VIEWING_PASS_KEY) || '[]');
  const userPassIndex = viewingPasses.findIndex(pass => pass.userId === currentUser.id);
  
  if (userPassIndex === -1) {
    return { success: false, message: '열람권이 없습니다.' };
  }

  const userPass = viewingPasses[userPassIndex];

  // 유효기간 확인
  if (isExpired(userPass)) {
    return { success: false, message: '열람권이 만료되었습니다.', expired: true };
  }

  // 남은 횟수 확인
  if (userPass.remainingCount <= 0) {
    return { success: false, message: '열람권이 모두 소진되었습니다.' };
  }

  // 열람권 사용 처리
  userPass.remainingCount -= 1;
  
  // viewedItems에 추가
  if (!userPass.viewedItems) {
    userPass.viewedItems = [];
  }
  userPass.viewedItems.push({
    itemId,
    itemType,
    viewedAt: new Date().toISOString()
  });

  // usedHistory에 기록
  if (!userPass.usedHistory) {
    userPass.usedHistory = [];
  }
  userPass.usedHistory.push({
    date: new Date().toISOString(),
    itemId,
    itemType,
    itemName: itemName || `${itemType}-${itemId}`,
    countUsed: 1
  });

  viewingPasses[userPassIndex] = userPass;
  localStorage.setItem(VIEWING_PASS_KEY, JSON.stringify(viewingPasses));

  return { success: true, remainingCount: userPass.remainingCount };
};

/**
 * 열람권 구매 처리
 */
export const purchaseViewingPass = (userId, packageType = 'basic') => {
  const packages = {
    basic: { count: 10, price: 50000, validityMonths: 3 },
    premium: { count: 20, price: 90000, validityMonths: 3 },
    deluxe: { count: 30, price: 130000, validityMonths: 3 }
  };

  const selectedPackage = packages[packageType] || packages.basic;
  const viewingPasses = JSON.parse(localStorage.getItem(VIEWING_PASS_KEY) || '[]');

  const purchaseDate = new Date();
  const expiryDate = new Date(purchaseDate);
  expiryDate.setMonth(expiryDate.getMonth() + selectedPackage.validityMonths);

  const newPass = {
    id: `pass-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    purchaseDate: purchaseDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
    remainingCount: selectedPackage.count,
    totalCount: selectedPackage.count,
    packageType,
    price: selectedPackage.price,
    viewedItems: [],
    usedHistory: []
  };

  viewingPasses.push(newPass);
  localStorage.setItem(VIEWING_PASS_KEY, JSON.stringify(viewingPasses));
  return newPass;
};

/**
 * 사용 내역 조회
 */
export const getUsageHistory = () => {
  const passInfo = getViewingPassInfo();
  if (!passInfo || !passInfo.usedHistory) return [];
  
  return passInfo.usedHistory.sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
};

/**
 * 비교 가능 여부 확인
 */
export const canCompare = (item1, item2) => {
  // 관리자는 모든 업체 비교 가능
  const isAdmin = localStorage.getItem('adminAuth') === 'true';
  if (isAdmin) return true;

  // 두 업체 모두 이미 열람한 업체인지 확인
  const item1Viewed = isAlreadyViewed(item1.id, item1.type || item1.userType || 'warehouse');
  const item2Viewed = isAlreadyViewed(item2.id, item2.type || item2.userType || 'warehouse');

  return item1Viewed && item2Viewed;
};

/**
 * 남은 유효기간 계산 (일 단위)
 */
export const getRemainingDays = (passInfo) => {
  if (!passInfo || !passInfo.expiryDate) return 0;
  
  const expiryDate = new Date(passInfo.expiryDate);
  const now = new Date();
  const diffTime = expiryDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};

/**
 * 만료 전 알림 필요 여부 확인 (7일 전)
 */
export const shouldShowExpiryWarning = (passInfo) => {
  if (!passInfo || !passInfo.expiryDate) return false;
  
  const remainingDays = getRemainingDays(passInfo);
  return remainingDays > 0 && remainingDays <= 7;
};

/**
 * 즐겨찾기 추가/제거
 */
export const toggleFavorite = (itemId, itemType) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser || !currentUser.id) return false;

  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const favoriteKey = `${itemId}-${itemType}`;
  const existingIndex = favorites.findIndex(f => f.key === favoriteKey && f.userId === currentUser.id);

  if (existingIndex !== -1) {
    favorites.splice(existingIndex, 1);
  } else {
    favorites.push({
      userId: currentUser.id,
      key: favoriteKey,
      itemId,
      itemType,
      addedAt: new Date().toISOString()
    });
  }

  localStorage.setItem('favorites', JSON.stringify(favorites));
  return existingIndex === -1; // true면 추가, false면 제거
};

/**
 * 즐겨찾기 여부 확인
 */
export const isFavorite = (itemId, itemType) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser || !currentUser.id) return false;

  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const favoriteKey = `${itemId}-${itemType}`;
  return favorites.some(f => f.key === favoriteKey && f.userId === currentUser.id);
};

/**
 * 즐겨찾기 목록 조회
 */
export const getFavorites = () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser || !currentUser.id) return [];

  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  return favorites
    .filter(f => f.userId === currentUser.id)
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
};

/**
 * 최근 본 업체 목록 조회
 */
export const getRecentViewedItems = (limit = 10) => {
  const passInfo = getViewingPassInfo();
  if (!passInfo || !passInfo.viewedItems) return [];

  return passInfo.viewedItems
    .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
    .slice(0, limit);
};

/**
 * 열람권 패키지 구매 처리
 */
export const purchaseViewingPassPackage = (userId, packageType = 'basic') => {
  const packages = {
    basic: { count: 10, price: 50000, validityMonths: 3 },
    premium: { count: 20, price: 90000, validityMonths: 3 },
    deluxe: { count: 30, price: 130000, validityMonths: 3 }
  };

  const selectedPackage = packages[packageType] || packages.basic;
  const viewingPasses = JSON.parse(localStorage.getItem(VIEWING_PASS_KEY) || '[]');
  
  const purchaseDate = new Date();
  const expiryDate = new Date(purchaseDate);
  expiryDate.setMonth(expiryDate.getMonth() + selectedPackage.validityMonths);

  const newPass = {
    userId,
    purchaseDate: purchaseDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
    remainingCount: selectedPackage.count,
    totalCount: selectedPackage.count,
    packageType,
    price: selectedPackage.price,
    viewedItems: [],
    usedHistory: []
  };

  viewingPasses.push(newPass);
  localStorage.setItem(VIEWING_PASS_KEY, JSON.stringify(viewingPasses));
  return newPass;
};

/**
 * 열람권 연장 처리
 */
export const extendViewingPass = (passId, months = 3) => {
  const viewingPasses = JSON.parse(localStorage.getItem(VIEWING_PASS_KEY) || '[]');
  const passIndex = viewingPasses.findIndex(p => p.id === passId);
  
  if (passIndex === -1) return null;

  const pass = viewingPasses[passIndex];
  const currentExpiry = new Date(pass.expiryDate);
  const now = new Date();
  
  // 만료 전 연장 시 할인 (10% 할인)
  const isBeforeExpiry = currentExpiry > now;
  const extensionPrice = isBeforeExpiry ? 45000 : 50000; // 10% 할인 또는 정가

  const newExpiryDate = new Date(Math.max(currentExpiry, now));
  newExpiryDate.setMonth(newExpiryDate.getMonth() + months);

  pass.expiryDate = newExpiryDate.toISOString();
  pass.extendedAt = new Date().toISOString();
  pass.extensionPrice = extensionPrice;

  viewingPasses[passIndex] = pass;
  localStorage.setItem(VIEWING_PASS_KEY, JSON.stringify(viewingPasses));
  return pass;
};

/**
 * 사용 통계 조회
 */
export const getUsageStatistics = () => {
  const passInfo = getViewingPassInfo();
  if (!passInfo || !passInfo.usedHistory) {
    return {
      monthlyUsage: [],
      itemTypeStats: { warehouse: 0, customer: 0 },
      totalUsed: 0
    };
  }

  const history = passInfo.usedHistory;
  const monthlyUsage = {};
  const itemTypeStats = { warehouse: 0, customer: 0 };

  history.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyUsage[monthKey] = (monthlyUsage[monthKey] || 0) + item.countUsed;
    
    if (item.itemType === 'warehouse') {
      itemTypeStats.warehouse += item.countUsed;
    } else {
      itemTypeStats.customer += item.countUsed;
    }
  });

  return {
    monthlyUsage: Object.entries(monthlyUsage)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    itemTypeStats,
    totalUsed: history.reduce((sum, item) => sum + item.countUsed, 0)
  };
};

