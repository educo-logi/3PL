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
export const useViewingPass = async (itemId, itemType, itemName, targetEmail = null) => {
  const user = getCurrentUser();
  if (!user) {
    return { success: false, message: '로그인이 필요합니다.' };
  }

  // 0. 자기 자신인지 확인 (열람권 차감 X)
  // [2024-01-30] 강력한 검증을 위해 DB에서 대상을 직접 조회하여 비교
  let isSelf = false;

  // 1차: ID 단순 비교
  if (String(user.id) === String(itemId)) {
    isSelf = true;
  }

  // 1.5차: 전달받은 이메일 비교 (가장 빠르고 정확함)
  if (!isSelf && targetEmail && user.email) {
    const userEmail = user.email.trim().toLowerCase();
    const tEmail = targetEmail.trim().toLowerCase();
    if (userEmail === tEmail) {
      isSelf = true;
      console.log('[DEBUG] Target Email provided matches User Email! It is self-view.');
    }
  }

  // 2차: DB 조회 비교 (ID 불일치 시에도 이메일 등으로 본인 확인)
  // 2차: DB 조회 비교 (ID 불일치 시에도 이메일 등으로 본인 확인)
  if (!isSelf && (itemType === 'warehouse' || itemType === 'customer')) {
    try {
      const table = itemType === 'warehouse' ? 'warehouses' : 'customers';
      console.log(`[DEBUG] Checking self-view against DB. Table: ${table}, ItemId: ${itemId}`);

      const { data: targetItem, error: fetchError } = await supabase
        .from(table)
        .select('id, email, company_name')
        .eq('id', itemId)
        .maybeSingle();

      if (fetchError) {
        console.warn('[DEBUG] Target item not found in DB or error:', fetchError);
      } else if (targetItem) {
        // [Request] 로그인한(자신)과 열람할 페이지의 이메일이 같은지 매칭
        const userEmail = user.email ? user.email.trim().toLowerCase() : '';
        const targetEmail = targetItem.email ? targetItem.email.trim().toLowerCase() : '';

        // 1) 이메일 비교 (Primary Check)
        if (userEmail && targetEmail && userEmail === targetEmail) {
          isSelf = true;
          console.log('[DEBUG] Email Match! It is self-view.');
        }

        // 2) ID 재확인 (Fallback)
        if (!isSelf && String(user.id) === String(targetItem.id)) {
          isSelf = true;
          console.log('[DEBUG] ID Match! It is self-view.');
        }

        console.log('[DEBUG] DB Check Result:', {
          userEmail,
          targetEmail,
          isSelf,
          itemType
        });
      }
    } catch (dbErr) {
      console.error('[DEBUG] Unexpected error during self-check:', dbErr);
    }
  }

  if (isSelf) {
    console.log('[DEBUG] Self-viewing detected via DB check. No pass deduction.');
    return { success: true, alreadyViewed: true, isSelf: true };
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
    itemType: item.item_type, // Map snake_case to camelCase
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

import { warehouseData, customerData } from '../data/sampleData';

/**
 * 아이템 상세 정보 조회 (DB + Local Sample)
 */
export const getItemDetail = async (itemId, itemType) => {
  // 1. 로컬 샘플 데이터에서 먼저 찾기 (ID 호환성)
  const localList = itemType === 'warehouse' ? warehouseData : customerData;
  // 문자열/숫자 비교를 위해 == 사용
  const localItem = localList.find(item => item.id == itemId);

  if (localItem) {
    return localItem;
  }

  // 2. DB에서 조회
  const table = itemType === 'warehouse' ? 'warehouses' : 'customers';

  // UUID 형식이 아닌 경우(이미 위에서 못 찾았는데 숫자인 경우) DB 에러 방지
  // 하지만 일단 요청해봄 (혹시 DB에 그런 ID가 있을 수 있으니)
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', itemId)
    .maybeSingle();

  if (error) {
    // 22P02: invalid input syntax for type uuid (숫자가 들어왔을 때 등)
    if (error.code !== '22P02') {
      console.error(`Error fetching ${itemType} detail:`, error);
    }
    return null;
  }

  if (data) {
    // DB 데이터(snake_case)를 UI(camelCase) 포맷으로 변환
    return {
      ...data,
      companyName: data.company_name,
      contactNumber: data.contact_number || data.phone,
      totalArea: data.total_area,
      availableArea: data.available_area,
      warehouseCount: data.warehouse_count || 1,
      storageTypes: data.storage_types || (data.temperature ? [data.temperature] : []),
      deliveryCompanies: data.delivery_companies || data.delivery || [],
      products: data.products || [],
      representative: data.representative,
      phone: data.phone,
      email: data.email,
      location: data.location,
      city: data.city,
      dong: data.dong,
      detailAddress: data.detail_address,
      contactPerson: data.contact_person,
      contactPhone: data.contact_phone,
      experience: data.experience,
      // Customer specific
      requiredArea: data.required_area,
      monthlyVolume: data.monthly_volume,
      desiredDelivery: data.desired_delivery || [],
    };
  }

  return data;
};
