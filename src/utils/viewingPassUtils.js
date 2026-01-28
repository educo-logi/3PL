/**
 * 열람권 관리 유틸리티 함수 (Supabase DB 연동 버전)
 */
import { supabase } from './supabaseClient';

/**
 * 현재 사용자의 열람권 정보 조회 (DB)
 */
// Helper to get current user from LocalStorage
const getCurrentUser = () => {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * 현재 사용자의 열람권 정보 조회 (DB)
 */
export const getViewingPassInfo = async () => {
  const user = getCurrentUser();
  if (!user) {
    console.log('No current user found');
    return null;
  }

  // 1. 열람권 보유 현황 조회 (모두 가져와서 JS에서 필터링 - 디버깅 용이성 및 Timezone 이슈 회피)
  const { data: passes, error: passError } = await supabase
    .from('viewing_passes')
    .select('*')
    .eq('user_id', user.id)
    .order('expires_at', { ascending: true }); // 만료 임박한 순 정렬

  if (passError) {
    console.error('Error fetching viewing pass:', passError);
    return null;
  }

  console.log('[DEBUG] Fetched passes:', passes);

  if (!passes || passes.length === 0) return null;

  const now = new Date();

  // 유효한 열람권 찾기
  const activePass = passes.find(p => {
    const expiry = new Date(p.expires_at);
    // UTC vs Local 비교 안전하게 (Timestamp 만 비교)
    const isExpired = expiry.getTime() < now.getTime();
    const hasCount = p.remaining_count > 0;

    if (isExpired) {
      console.log(`[DEBUG] Pass ${p.id} expired. Expiry: ${expiry.toLocaleString()}, Now: ${now.toLocaleString()}`);
    }
    if (!hasCount) {
      console.log(`[DEBUG] Pass ${p.id} no count. Remaining: ${p.remaining_count}`);
    }

    return !isExpired && hasCount;
  });

  if (activePass) {
    console.log('[DEBUG] Found active pass:', activePass);
  } else {
    console.log('[DEBUG] No active pass found among records.');
  }

  return activePass || null;
};

/**
 * 열람권 보유 여부 확인 (Async)
 */
export const checkViewingPass = async () => {
  const pass = await getViewingPassInfo();
  return !!pass;
};

/**
 * 남은 일수 계산
 */
export const getRemainingDays = (passInfo) => {
  if (!passInfo || !passInfo.expires_at) return 0;
  const now = new Date();
  const expiry = new Date(passInfo.expires_at);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

/**
 * 만료 여부 확인
 */
export const isExpired = (passInfo) => {
  if (!passInfo || !passInfo.expires_at) return true;
  return new Date(passInfo.expires_at) < new Date();
};

/**
 * 사용 통계 Mock (실제 DB 연동은 viewing_history 기반으로 집계해야 함)
 */
export const getUsageStatistics = () => {
  // 간단한 Mock 리턴 또는 실제 구현
  // 여기서는 화면 에러 방지를 위해 기본 구조체 리턴
  return {
    totalUsed: 0,
    itemTypeStats: { warehouse: 0, customer: 0 },
    monthlyUsage: []
  };
};

/**
 * 최근 본 업체 목록 조회 (DB)
 */
export const getRecentViewedItems = async (limit = 10) => {

  const user = getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('viewing_history')
    .select('*')
    .eq('user_id', user.id)
    .order('viewed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent items:', error);
    return [];
  }

  return data.map(item => ({
    itemId: item.item_id,
    itemType: item.item_type,
    viewedAt: item.viewed_at,
    itemName: item.item_name
  }));
};

/**
 * 이미 본 항목인지 확인 (DB)
 */
export const isAlreadyViewed = async (itemId, itemType) => {
  const user = getCurrentUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('viewing_history')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .eq('item_type', itemType)
    .limit(1);

  if (error) {
    console.error('Error checking view history:', error);
    return false;
  }

  return data && data.length > 0;
};

/**
 * 업체명 표시 (Async)
 * 실제 렌더링 시에는 useEffect에서 호출하여 상태에 저장해야 함.
 * 컴포넌트에서 직접 호출하기 어려우므로, 컴포넌트 수정을 최소화하기 위해
 * 이 부분은 '표시 가능 여부'만 판단하고 이름 포맷팅은 컴포넌트에서 하도록 유도하거나,
 * 포맷팅 로직만 분리.
 */
export const getDisplayNameHelper = (item, itemType, isUnlocked) => {
  // 관리자는 항상 실제 업체명 표시 (localStorage 체크 유지)
  const isAdmin = localStorage.getItem('adminAuth') === 'true';
  if (isAdmin) {
    return item.companyName;
  }

  // 이미 본 항목(unlocked)이면 실제 업체명 표시
  if (isUnlocked) {
    return item.companyName;
  }

  // 열람권을 사용하지 않은 경우 지역 기반 이름 표시
  const locationParts = [];
  if (item.location) locationParts.push(item.location);
  // 시/도까지는 보여주되, 상세 시/군/구는 숨김 요청 반영
  // 예: "경기도 성남시" -> "경기도 (상세 지역 비공개)"
  // 다만 기존 로직은 지역 + 시 + 동 다 합침.

  const typeStr = itemType === 'warehouse' ? '창고' : '고객사';

  if (item.location) {
    return `${item.location} ${typeStr} (상세 정보 비공개)`;
  } else {
    return `${typeStr} (지역 비공개)`;
  }
};

/**
 * 열람권 사용 (DB Transaction)
 */
export const useViewingPass = async (itemId, itemType, itemName) => {
  const user = getCurrentUser();
  if (!user) {
    return { success: false, message: '로그인이 필요합니다.' };
  }

  // 1. 이미 본 항목인지 확인
  const alreadyViewed = await isAlreadyViewed(itemId, itemType);
  if (alreadyViewed) {
    return { success: true, alreadyViewed: true };
  }

  // 2. 유효한 열람권 가져오기
  const activePass = await getViewingPassInfo();

  if (!activePass) {
    return { success: false, message: '사용 가능한 열람권이 없습니다.' };
  }

  // 3. 사용 처리 (RPC를 쓰는 게 가장 안전하지만, 여기서는 클라이언트 로직으로 구현)
  // 주의: 동시성 문제가 있을 수 있으나 MVP 레벨에서는 순차 처리

  try {
    // 3-1. 기록 생성
    const { error: historyError } = await supabase
      .from('viewing_history')
      .insert({
        user_id: user.id,
        item_id: itemId,
        item_type: itemType,
        item_name: itemName
      });

    if (historyError) throw historyError;

    // 3-2. 갯수 차감
    const { error: updateError } = await supabase
      .from('viewing_passes')
      .update({ remaining_count: activePass.remaining_count - 1 })
      .eq('id', activePass.id);

    if (updateError) {
      // 롤백이 안되니 난감하지만, 일단 에러 처리
      console.error('Failed to decrement pass count:', updateError);
      return { success: false, message: '열람권 차감 중 오류가 발생했습니다.' };
    }

    return { success: true, remainingCount: activePass.remaining_count - 1 };

  } catch (error) {
    console.error('useViewingPass Error:', error);
    return { success: false, message: '열람권 사용 중 오류가 발생했습니다.' };
  }
};

/**
 * 열람권 구매 처리 (DB)
 */
export const purchaseViewingPass = async (packageType = 'basic') => {
  const user = getCurrentUser();
  if (!user) return { success: false, message: '로그인이 필요합니다.' };

  const packages = {
    basic: { count: 10, price: 50000, validityMonths: 3 },
    premium: { count: 20, price: 90000, validityMonths: 3 },
    deluxe: { count: 30, price: 130000, validityMonths: 3 }
  };

  const selectedPackage = packages[packageType] || packages.basic;

  try {
    // 1. Check if user already has a pass (wallet)
    const { data: existingPass, error: fetchError } = await supabase
      .from('viewing_passes')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let result;
    const now = new Date();

    if (existingPass) {
      // UPDATE existing pass
      const currentExpiry = new Date(existingPass.expires_at);
      // If expired, start valid from now. If active, add to current expiry?
      // Policy: Usually extends from MAX(now, currentExpiry)
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseDate);
      newExpiry.setMonth(newExpiry.getMonth() + selectedPackage.validityMonths);

      const { data, error: updateError } = await supabase
        .from('viewing_passes')
        .update({
          remaining_count: existingPass.remaining_count + selectedPackage.count,
          total_count: existingPass.total_count + selectedPackage.count,
          expires_at: newExpiry.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPass.id)
        .select();

      if (updateError) throw updateError;
      result = data;

    } else {
      // INSERT new pass
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + selectedPackage.validityMonths);

      const { data, error: insertError } = await supabase
        .from('viewing_passes')
        .insert({
          user_id: user.id,
          package_type: packageType,
          remaining_count: selectedPackage.count,
          total_count: selectedPackage.count,
          expires_at: expiryDate.toISOString()
        })
        .select();

      if (insertError) throw insertError;
      result = data;
    }

    console.log('Purchase successful:', result);
    return { success: true, data: result[0] };

  } catch (error) {
    console.error('Purchase failed - Supabase Error:', error);
    return { success: false, message: '구매 처리 중 오류가 발생했습니다: ' + (error.message || error.details) };
  }
};

/**
 * 열람권 연장 (DB)
 */
export const extendViewingPass = async (passId, months = 3) => {
  const user = getCurrentUser();
  if (!user) return null;

  // 1. Get current pass to calculate new expiry
  const { data: currentPass, error: fetchError } = await supabase
    .from('viewing_passes')
    .select('*')
    .eq('id', passId)
    .single();

  if (fetchError || !currentPass) {
    console.error('Error fetching pass for extension:', fetchError);
    return null;
  }

  // 2. Calculate new date
  const currentExpiry = new Date(currentPass.expires_at);
  const now = new Date();
  // If expired, start from now. If active, add to current expiry.
  const baseDate = currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(baseDate);
  newExpiry.setMonth(newExpiry.getMonth() + months);

  // 3. Update DB
  const { data, error } = await supabase
    .from('viewing_passes')
    .update({ expires_at: newExpiry.toISOString() })
    .eq('id', passId)
    .select();

  if (error) {
    console.error('Extension failed:', error);
    return null;
  }

  return { expiryDate: data[0].expires_at };
};

export const getUsageHistory = async () => {
  const user = getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('viewing_history')
    .select('*')
    .eq('user_id', user.id)
    .order('viewed_at', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data.map(item => ({
    ...item,
    date: item.viewed_at, // 기존 코드 호환성
    itemName: item.item_name,
    countUsed: 1
  }));
};

export const getFavorites = () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser) return [];

  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  return favorites.filter(f => f.userId === currentUser.id);
};

// 즐겨찾기는 LocalStorage 유지 (개인화 설정이므로 중요도 낮음)
// 필요시 DB로 마이그레이션 가능
export const toggleFavorite = (itemId, itemType) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser) return false;

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
  return existingIndex === -1;
};

export const canCompare = () => true; // Placeholder logic


export const isFavorite = (itemId, itemType) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser) return false;

  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const favoriteKey = `${itemId}-${itemType}`;
  return favorites.some(f => f.key === favoriteKey && f.userId === currentUser.id);
};

