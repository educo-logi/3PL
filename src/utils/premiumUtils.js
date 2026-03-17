import { supabase } from './supabaseClient';

const PREMIUM_APPLICATIONS_KEY = 'premiumApplications';
const PREMIUM_ITEMS_KEY = 'premiumItems';

/**
 * 프리미엄 신청 패키지 정보
 */
export const premiumPackages = {
  '5day': { days: 5, price: 50000, name: '5일 프리미엄' },
  '10day': { days: 10, price: 80000, name: '10일 프리미엄', discount: '약 20% 할인' },
  '15day': { days: 15, price: 130000, name: '15일 프리미엄', discount: '약 13% 할인' }
};

/**
 * 프리미엄 신청 생성 (Supabase 연동)
 */
export const createPremiumApplication = async (userId, userType, itemId, itemType, packageType, orderId = null, receiptUrl = null, customDays = null) => {
  // 날짜 계산: 결제일은 0일, 다음날 00시부터 1일 계산
  const now = new Date();

  // 시작일: 결제 즉시 (익일 00시 정책에서 즉시 적용 정책으로 변경)
  const startDate = new Date(now);

  // 종료일: 시작일 + 패키지일수 (수식 상 startDate + days)
  const days = customDays !== null ? customDays : (premiumPackages[packageType] ? premiumPackages[packageType].days : 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);

  const amount = customDays !== null ? 0 : (premiumPackages[packageType] ? premiumPackages[packageType].price : 0);

  // 1. premium_applications 테이블에 인서트 시도
  let appData = null;
  try {
    const { data, error: appError } = await supabase
      .from('premium_applications')
      .insert({
        user_id: userId,
        user_type: userType,
        item_id: itemId,
        item_type: itemType,
        package_type: packageType,
        amount: amount,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (appError) {
      console.warn('Supabase premium_applications insert failed:', appError);
      appData = createPremiumApplicationLocal(userId, userType, itemId, itemType, packageType, startDate, endDate, amount, orderId, receiptUrl).data;
    } else {
      appData = data;
    }
  } catch (error) {
    console.warn('Error inserting premium_applications:', error);
    appData = createPremiumApplicationLocal(userId, userType, itemId, itemType, packageType, startDate, endDate, amount, orderId, receiptUrl).data;
  }

  // 2. 창고/고객사 테이블에 is_premium 연동 업데이트
  await updateItemPremiumStatusDb(itemId, itemType, true, endDate);

  // 3. 결제 내역 관리자용 payment_history 인서트 (가장 중요)
  try {
    const { error: historyError } = await supabase.from('payment_history').insert({
      user_id: userId,
      amount: amount,
      package_type: premiumPackages[packageType] 
        ? premiumPackages[packageType].name 
        : `관리자 프리미엄 특별 지급 (${customDays ? customDays + '일' : '선물'})`,
      status: 'success',
      order_id: orderId,
      receipt_url: receiptUrl
    });
    
    if (historyError) {
      console.error('Failed to save payment history:', historyError);
    }
  } catch (err) {
    console.error('Critical error saving payment history:', err);
  }

  return { success: true, data: appData };
};

/**
 * 로컬 스토리지 Fallback (createPremiumApplication)
 */
const createPremiumApplicationLocal = (userId, userType, itemId, itemType, packageType, startDate, endDate, amount, orderId, receiptUrl) => {
  const applications = JSON.parse(localStorage.getItem(PREMIUM_APPLICATIONS_KEY) || '[]');

  const application = {
    id: `premium-${userId}-${Date.now()}`,
    userId,
    userType,
    itemId,
    itemType,
    packageType,
    amount,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    paymentDate: new Date().toISOString(),
    orderId,
    receiptUrl
  };

  applications.push(application);
  localStorage.setItem(PREMIUM_APPLICATIONS_KEY, JSON.stringify(applications));

  updateItemPremiumStatusLocal(itemId, itemType, true, endDate);
  return { success: true, data: application };
};

/**
 * DB에 프리미엄 상태 반영
 */
export const updateItemPremiumStatusDb = async (itemId, itemType, isPremium, endDate) => {
  try {
    const table = itemType === 'warehouse' ? 'warehouses' : 'customers';

    const { error } = await supabase.from(table).update({
      is_premium: isPremium,
      premium_end_date: endDate ? new Date(endDate).toISOString() : null
    }).eq('id', itemId);

    if (error) {
      console.error(`Supabase update ${table} failed:`, error);
      // DB 실패 시 로컬이라도 확실하게 업데이트
      updateItemPremiumStatusLocal(itemId, itemType, isPremium, endDate);
    } else {
      // 성공 시에도 로컬 스토리지 동기화 (내꺼 결제니까)
      updateItemPremiumStatusLocal(itemId, itemType, isPremium, endDate);
    }
  } catch (error) {
    console.error('Error updating premium status DB:', error);
    updateItemPremiumStatusLocal(itemId, itemType, isPremium, endDate);
  }
};

/**
 * 로컬 스토리지에 프리미엄 상태 반영 (DB 업데이트 실패 등 백업용)
 */
export const updateItemPremiumStatusLocal = (itemId, itemType, isPremium, endDate) => {
  const premiumItems = JSON.parse(localStorage.getItem(PREMIUM_ITEMS_KEY) || '[]');

  // 기존 항목 찾기
  const existingIndex = premiumItems.findIndex(
    item => item.itemId === itemId && item.itemType === itemType
  );

  const premiumItem = {
    itemId,
    itemType,
    endDate: endDate ? new Date(endDate).toISOString() : null,
    isPremium,
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    if (isPremium) {
      premiumItems[existingIndex] = premiumItem;
    } else {
      premiumItems.splice(existingIndex, 1);
    }
  } else {
    if (isPremium) {
      premiumItems.push(premiumItem);
    }
  }

  localStorage.setItem(PREMIUM_ITEMS_KEY, JSON.stringify(premiumItems));
};

/**
 * 프리미엄 활성화 여부 확인 (클라이언트 측 단일 아이템 체크용)
 * (Supabase 연동 시점에 이미 테이블에 is_premium 값이 있으므로, 이 함수는 주로 로컬/예외 상황 체크나 
 * 만료일 지난 아이템의 상태를 해제 처리하기 위한 용도로 활용됩니다)
 */
export const isPremiumActive = async (itemId, itemType, forceCheckDb = false) => {
  const now = new Date();

  try {
    if (forceCheckDb) {
      const table = itemType === 'warehouse' ? 'warehouses' : 'customers';
      const { data, error } = await supabase.from(table).select('is_premium, premium_end_date').eq('id', itemId).maybeSingle();

      if (!error && data) {
        if (!data.is_premium) return false;
        if (data.premium_end_date && new Date(data.premium_end_date) < now) {
          // 만료되었으면 DB 업데이트 (이건 관리자나 시스템이 해야하지만 체크 시점마다 보정)
          await updateItemPremiumStatusDb(itemId, itemType, false, null);
          return false;
        }
        return true;
      }
    }
  } catch (err) {
    console.warn('isPremiumActive DB check failed:', err);
  }

  // Fallback 로컬 검사 로직
  const premiumItems = JSON.parse(localStorage.getItem(PREMIUM_ITEMS_KEY) || '[]');
  const premiumItem = premiumItems.find(
    item => item.itemId === itemId && item.itemType === itemType
  );

  if (!premiumItem) return false;

  // 만료일 확인 (자정 기준 등이 이미 적용되어 들어감)
  const endDate = new Date(premiumItem.endDate);
  if (endDate < now) {
    // 만료된 경우 상태 업데이트
    updateItemPremiumStatusLocal(itemId, itemType, false, null);
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
      updateItemPremiumStatusDb(item.itemId, item.itemType, false, null);
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

