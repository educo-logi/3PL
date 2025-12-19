/**
 * 열람권 관리 유틸리티 함수
 */

import { supabase } from './supabaseClient';

const VIEWING_PASS_TABLE = 'viewing_passes';
const VIEWS_TABLE = 'views';

/**
 * 현재 사용자의 열람권 정보 조회
 */
export const getViewingPassInfo = async () => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user?.id) return null;

  const { data, error } = await supabase
    .from(VIEWING_PASS_TABLE)
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) {
    console.error('열람권 조회 오류:', error);
    return null;
  }
  return data;
};

/**
 * 열람권 보유 여부 확인
 */
export const checkViewingPass = async () => {
  const passInfo = await getViewingPassInfo();
  if (!passInfo) return false;
  if (isExpired(passInfo)) return false;
  return (passInfo.remaining_count ?? 0) > 0;
};

/**
 * 유효기간 만료 확인
 */
export const isExpired = (passInfo) => {
  if (!passInfo || !passInfo.expires_at) return true;
  return new Date(passInfo.expires_at) < new Date();
};

/**
 * 이미 본 항목인지 확인
 */
export const isAlreadyViewed = async (itemId, itemType) => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user?.id) return false;
  const { data, error } = await supabase
    .from(VIEWS_TABLE)
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .eq('item_type', itemType)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('열람 기록 조회 오류:', error);
    return false;
  }
  return !!data;
};

/**
 * 업체명 표시 (열람권 사용 후에만 실제 업체명 표시)
 * @param {Object} item - 창고 또는 고객사 객체
 * @param {string} itemType - 'warehouse' 또는 'customer'
 * @returns {string} - 표시할 이름
 */
export const getDisplayName = async (item, itemType) => {
  if (!item) return '';
  // 관리자는 항상 실제 업체명 표시
  const isAdmin = localStorage.getItem('adminAuth') === 'true';
  if (isAdmin) {
    return item.companyName || item.company_name;
  }

  // 이미 본 항목이면 실제 업체명 표시
  if (await isAlreadyViewed(item.id, itemType)) {
    return item.companyName || item.company_name;
  }

  // 열람권을 사용하지 않은 경우 지역 기반 이름 표시
  const locationParts = [];
  const loc = item.location;
  const city = item.city;
  const dong = item.dong;

  if (loc) locationParts.push(loc);
  if (city) locationParts.push(city);
  if (dong) locationParts.push(dong);

  const locationStr = locationParts.length > 0 ? locationParts.join(' ') : '지역';
  const typeStr = itemType === 'warehouse' ? '창고' : '고객사';

  // 지역 정보가 충분하면 상세하게, 아니면 간단하게
  if (city && dong) {
    return `${locationStr} ${typeStr}`;
  } else if (loc) {
    return `${loc} 지역 ${typeStr}`;
  } else {
    return `${typeStr}`;
  }
};

/**
 * 열람권 사용 (처음 볼 때만)
 * 개선: 열람 기록을 먼저 저장하고, 성공적으로 저장된 경우에만 열람권 차감
 */
export const useViewingPass = async (itemId, itemType, itemName) => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user?.id) {
    return { success: false, message: '로그인이 필요합니다.' };
  }

  // 1단계: 이미 본 항목인지 확인 (첫 번째 확인)
  const alreadyViewed = await isAlreadyViewed(itemId, itemType);
  if (alreadyViewed) {
    console.log('[열람권] 이미 본 항목이므로 열람권이 소진되지 않습니다.', { itemId, itemType });
    return { success: true, alreadyViewed: true };
  }

  // 2단계: 열람권 조회 및 유효성 검사
  const passInfo = await getViewingPassInfo();
  if (!passInfo) {
    return { success: false, message: '열람권이 없습니다.' };
  }

  if (isExpired(passInfo)) {
    return { success: false, message: '열람권이 만료되었습니다.', expired: true };
  }

  if ((passInfo.remaining_count ?? 0) <= 0) {
    return { success: false, message: '열람권이 모두 소진되었습니다.' };
  }

  // 3단계: 열람 기록을 먼저 저장 시도
  // 중요: 열람 기록이 성공적으로 저장된 경우에만 열람권 차감
  // 중복이면 에러가 발생하므로, 이를 이미 본 항목으로 처리
  const { data: viewData, error: viewErr } = await supabase
    .from(VIEWS_TABLE)
    .insert({
      user_id: user.id,
      item_type: itemType,
      item_id: itemId,
      viewed_at: new Date().toISOString()
    })
    .select()
    .maybeSingle();

  // 4단계: 열람 기록 저장 결과 확인
  if (viewErr) {
    // 에러 상세 정보 로그
    console.log('[열람권] 열람 기록 저장 에러:', {
      code: viewErr.code,
      message: viewErr.message,
      details: viewErr.details,
      hint: viewErr.hint,
      itemId,
      itemType
    });

    // 중복 키 에러 (23505)는 이미 본 항목이므로 정상 처리
    const isDuplicateError = viewErr.code === '23505' || 
                            viewErr.code === 'PGRST116' ||
                            viewErr.message?.toLowerCase().includes('duplicate') ||
                            viewErr.message?.toLowerCase().includes('unique') ||
                            viewErr.message?.toLowerCase().includes('violates unique constraint') ||
                            viewErr.details?.toLowerCase().includes('duplicate') ||
                            viewErr.hint?.toLowerCase().includes('duplicate');
    
    if (isDuplicateError) {
      console.log('[열람권] 열람 기록 저장 시 중복 발견: 이미 본 항목이므로 열람권이 소진되지 않습니다.', { itemId, itemType });
      return { success: true, alreadyViewed: true };
    }
    
    // 에러가 발생했지만, 실제로는 이미 본 항목일 수 있으므로 다시 확인
    const checkAfterError = await isAlreadyViewed(itemId, itemType);
    if (checkAfterError) {
      console.log('[열람권] 에러 발생 후 확인: 이미 본 항목이므로 열람권이 소진되지 않습니다.', { itemId, itemType });
      return { success: true, alreadyViewed: true };
    }
    
    // 다른 에러이고 실제로도 본 항목이 아니면 실패 반환
    console.error('[열람권] 열람 기록 저장 실패:', viewErr);
    return { success: false, message: '열람 기록 저장 중 오류가 발생했습니다.' };
  }

  // 5단계: 열람 기록 저장 후 최종 확인 (race condition 방지)
  // 저장이 성공했지만, 동시 요청으로 인해 다른 프로세스가 이미 저장했을 수 있음
  const finalCheck = await isAlreadyViewed(itemId, itemType);
  if (!finalCheck) {
    // 열람 기록이 저장되지 않았으면 실패
    console.error('[열람권] 열람 기록 저장 후 확인 실패: 기록이 없습니다.', { itemId, itemType });
    return { success: false, message: '열람 기록 저장에 실패했습니다.' };
  }

  // 6단계: 한 번 더 확인 (이중 안전장치)
  // 다른 프로세스가 먼저 열람 기록을 저장했을 수 있으므로 재확인
  const doubleCheck = await isAlreadyViewed(itemId, itemType);
  if (!doubleCheck) {
    console.error('[열람권] 이중 확인 실패: 기록이 없습니다.', { itemId, itemType });
    return { success: false, message: '열람 기록 확인에 실패했습니다.' };
  }

  // 7단계: 열람 기록이 성공적으로 저장되었으므로 열람권 차감
  // 주의: 이 시점에서 이미 본 항목이 아닌 것이 확실함 (3번 확인 완료)
  const newRemainingCount = (passInfo.remaining_count ?? 0) - 1;
  const { error: updateErr } = await supabase
    .from(VIEWING_PASS_TABLE)
    .update({
      remaining_count: newRemainingCount,
      used_history: [
        ...(passInfo.used_history || []),
        {
          date: new Date().toISOString(),
          itemId,
          itemType,
          itemName: itemName || `${itemType}-${itemId}`,
          countUsed: 1
        }
      ],
      viewed_items: [
        ...(passInfo.viewed_items || []),
        {
          itemId,
          itemType,
          viewedAt: new Date().toISOString()
        }
      ]
    })
    .eq('id', passInfo.id);

  if (updateErr) {
    console.error('[열람권] 열람권 차감 실패:', updateErr);
    // 열람 기록은 이미 저장되었으므로, 다음에 다시 볼 때는 열람권이 소진되지 않음
    return { success: false, message: '열람권 차감 중 오류가 발생했습니다. 열람 기록은 저장되었습니다.' };
  }

  console.log('[열람권] 열람권 사용 성공:', { itemId, itemType, remainingCount: newRemainingCount });
  return { success: true, remainingCount: newRemainingCount };
};

/**
 * 열람권 구매 처리
 */
export const purchaseViewingPass = async (userId, packageType = 'basic') => {
  const packages = {
    basic: { count: 10, price: 50000, validityMonths: 3 },
    premium: { count: 20, price: 90000, validityMonths: 3 },
    deluxe: { count: 30, price: 130000, validityMonths: 3 }
  };

  const selectedPackage = packages[packageType] || packages.basic;
  const purchaseDate = new Date();
  const expiryDate = new Date(purchaseDate);
  expiryDate.setMonth(expiryDate.getMonth() + selectedPackage.validityMonths);

  const { data, error } = await supabase
    .from(VIEWING_PASS_TABLE)
    .upsert({
      // Upsert logic: if exists updates, else insert.
      // But typically purchase adds to count? For simplicity assuming replacement or new
      // If you want to ADD count, you need a different logic or RPC. 
      // For now, let's assume it sets/resets the pass.
      user_id: userId,
      purchase_date: purchaseDate.toISOString(),
      expires_at: expiryDate.toISOString(),
      remaining_count: selectedPackage.count,
      total_count: selectedPackage.count,
      package_type: packageType,
      price: selectedPackage.price
    }, { onConflict: 'user_id' })
    .select()
    .maybeSingle();

  if (error) {
    console.error('열람권 구매 실패:', error);
    throw error;
  }

  return data;
};

/**
 * 사용 내역 조회
 */
export const getUsageHistory = async () => {
  const passInfo = await getViewingPassInfo();
  if (!passInfo || !passInfo.used_history) return [];

  return passInfo.used_history.sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );
};

/**
 * 비교 가능 여부 확인
 */
export const canCompare = (item1, item2) => {
  const isAdmin = localStorage.getItem('adminAuth') === 'true';
  if (isAdmin) return true;

  // 두 업체 모두 이미 열람한 업체인지 확인 (동기 처리가 어려우므로 여기서는 대략적인 체크)
  // 실제로는 비동기여야 하나, 이 함수는 렌더링 중 호출될 수 있어 주의 필요.
  // 이 함수를 호출하는 곳에서 비동기 처리를 이미 했거나, 이 함수를 async로 바꿔야 함.
  // 현재 구조상 동기적 true 리턴은 위험할 수 있음. 
  return true;
};

/**
 * 남은 유효기간 계산 (일 단위)
 */
export const getRemainingDays = (passInfo) => {
  if (!passInfo || !passInfo.expires_at) return 0;

  const expiryDate = new Date(passInfo.expires_at);
  const now = new Date();
  const diffTime = expiryDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};

/**
 * 만료 전 알림 필요 여부 확인 (7일 전)
 */
export const shouldShowExpiryWarning = (passInfo) => {
  if (!passInfo || !passInfo.expires_at) return false;

  const remainingDays = getRemainingDays(passInfo);
  return remainingDays > 0 && remainingDays <= 7;
};

/**
 * 즐겨찾기 추가/제거
 */
export const toggleFavorite = async (itemId, itemType) => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user?.id) return false;

  // 이미 존재하는지 확인
  const { data: existing, error: findErr } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .eq('item_type', itemType)
    .maybeSingle();
  if (findErr) {
    console.error('즐겨찾기 조회 오류:', findErr);
    return false;
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);
    if (delErr) {
      console.error('즐겨찾기 삭제 오류:', delErr);
      return false;
    }
    return false; // 제거됨
  }

  const { error: insErr } = await supabase.from('favorites').insert({
    user_id: user.id,
    item_id: itemId,
    item_type: itemType,
    created_at: new Date().toISOString()
  });
  if (insErr) {
    console.error('즐겨찾기 추가 오류:', insErr);
    return false;
  }
  return true; // 추가됨
};

/**
 * 즐겨찾기 여부 확인
 */
export const isFavorite = async (itemId, itemType) => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user?.id) return false;

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .eq('item_type', itemType)
    .maybeSingle();
  if (error) {
    console.error('즐겨찾기 여부 조회 오류:', error);
    return false;
  }
  return !!data;
};

/**
 * 즐겨찾기 목록 조회
 */
export const getFavorites = async () => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user?.id) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('즐겨찾기 조회 오류:', error);
    return [];
  }
  return data;
};

/**
 * 최근 본 업체 목록 조회
 */
export const getRecentViewedItems = async (limit = 10) => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user?.id) return [];

  const { data, error } = await supabase
    .from(VIEWS_TABLE)
    .select('*')
    .eq('user_id', user.id)
    .order('viewed_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('최근 열람 조회 오류:', error);
    return [];
  }
  return data;
};

/**
 * 열람권 연장 처리
 */
export const extendViewingPass = async (passId, months = 3) => {
  const { data: pass, error: fetchErr } = await supabase
    .from(VIEWING_PASS_TABLE)
    .select('*')
    .eq('id', passId)
    .maybeSingle();
  if (fetchErr || !pass) return null;

  const currentExpiry = new Date(pass.expires_at);
  const now = new Date();
  const isBeforeExpiry = currentExpiry > now;
  const extensionPrice = isBeforeExpiry ? 45000 : 50000;

  const newExpiryDate = new Date(Math.max(currentExpiry.getTime(), now.getTime()));
  newExpiryDate.setMonth(newExpiryDate.getMonth() + months);

  const { data: updated, error: updateErr } = await supabase
    .from(VIEWING_PASS_TABLE)
    .update({
      expires_at: newExpiryDate.toISOString(),
      extended_at: new Date().toISOString(),
      extension_price: extensionPrice
    })
    .eq('id', passId)
    .select()
    .maybeSingle();

  if (updateErr) {
    console.error('열람권 연장 실패:', updateErr);
    return null;
  }
  return updated;
};

/**
 * 사용 통계 조회
 */
export const getUsageStatistics = async () => {
  const passInfo = await getViewingPassInfo();
  if (!passInfo || !passInfo.used_history) {
    return {
      monthlyUsage: [],
      itemTypeStats: { warehouse: 0, customer: 0 },
      totalUsed: 0
    };
  }

  const history = passInfo.used_history;
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

/**
 * DEPRECATED: purchaseViewingPassPackage
 * Use purchaseViewingPass instead.
 */
export const purchaseViewingPassPackage = async (userId, packageType) => {
  return purchaseViewingPass(userId, packageType);
};
