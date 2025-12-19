/**
 * 프리미엄 신청 관리 유틸리티 함수
 */

import { supabase } from './supabaseClient';

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
export const createPremiumApplication = async (itemId, itemType, packageType, appliedBy) => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + premiumPackages[packageType].months);

  const { data, error } = await supabase
    .from('premium_applications')
    .insert({
      item_id: itemId,
      item_type: itemType,
      applied_by: appliedBy,
      status: 'pending',
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      created_at: new Date().toISOString(),
      package_type: packageType,
      amount: premiumPackages[packageType].price
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('프리미엄 신청 실패:', error);
    return null;
  }
  return data;
};

/**
 * 프리미엄 아이템 업데이트
 */
const updatePremiumItem = async (itemId, itemType, endDate) => {
  if (itemType === 'warehouse') {
    await supabase
      .from('warehouses')
      .update({ is_premium: true, premium_end_at: endDate })
      .eq('id', itemId);
  } else if (itemType === 'customer') {
    await supabase
      .from('customers')
      .update({ is_premium: true, premium_end_at: endDate })
      .eq('id', itemId);
  }
};

/**
 * 실제 아이템 데이터의 프리미엄 상태 업데이트
 */
const updateItemPremiumStatus = async (itemId, itemType, isPremium, endDate) => {
  if (itemType === 'warehouse') {
    await supabase
      .from('warehouses')
      .update({ is_premium: isPremium, premium_end_at: endDate })
      .eq('id', itemId);
  } else if (itemType === 'customer') {
    await supabase
      .from('customers')
      .update({ is_premium: isPremium, premium_end_at: endDate })
      .eq('id', itemId);
  }
};

/**
 * 프리미엄 상태 확인
 */
export const isPremiumActive = async (itemId, itemType) => {
  const { data, error } = await supabase
    .from('premium_applications')
    .select('end_at, status')
    .eq('item_id', itemId)
    .eq('item_type', itemType)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('프리미엄 상태 조회 오류:', error);
    return false;
  }
  if (!data) return false;
  if (data.status !== 'approved' && data.status !== 'active') return false;
  const now = new Date();
  const end = data.end_at ? new Date(data.end_at) : now;
  if (end < now) {
    await updateItemPremiumStatus(itemId, itemType, false, null);
    return false;
  }
  return true;
};

/**
 * 사용자의 프리미엄 신청 내역 조회
 */
export const getUserPremiumApplications = async (userId) => {
  const { data, error } = await supabase
    .from('premium_applications')
    .select('*')
    .eq('applied_by', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('프리미엄 신청 조회 오류:', error);
    return [];
  }
  return data;
};

/**
 * 사용자가 해당 아이템의 프리미엄 소유자인지 확인
 */
export const isPremiumOwner = async (userId, itemId, itemType) => {
  const { data, error } = await supabase
    .from('premium_applications')
    .select('id, status')
    .eq('applied_by', userId)
    .eq('item_id', itemId)
    .eq('item_type', itemType)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('프리미엄 소유자 조회 오류:', error);
    return false;
  }
  if (!data) return false;
  return data.status === 'active' || data.status === 'approved';
};

/**
 * 아이템의 프리미엄 신청 내역 조회
 */
export const getItemPremiumApplications = async (itemId, itemType) => {
  const { data, error } = await supabase
    .from('premium_applications')
    .select('*')
    .eq('item_id', itemId)
    .eq('item_type', itemType)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('프리미엄 신청 목록 조회 오류:', error);
    return [];
  }
  return data;
};

/**
 * 프리미엄 만료 체크 및 업데이트
 */
export const checkAndUpdateExpiredPremiums = async () => {
  const now = new Date();
  const { data, error } = await supabase
    .from('premium_applications')
    .select('item_id, item_type, end_at, status');
  if (error) {
    console.error('프리미엄 만료 체크 오류:', error);
    return;
  }
  for (const app of data || []) {
    if (!app.end_at) continue;
    const end = new Date(app.end_at);
    if (end < now && (app.status === 'active' || app.status === 'approved')) {
      await updateItemPremiumStatus(app.item_id, app.item_type, false, null);
    }
  }
};

/**
 * 프리미엄 아이템 정렬 (최근 신청 순)
 */
export const sortPremiumItems = async (items, itemType) => {
  // 사전 조회로 신청 정보를 캐싱
  const ids = items.map(i => i.id);
  const { data, error } = await supabase
    .from('premium_applications')
    .select('item_id, item_type, created_at, status, end_at')
    .in('item_id', ids)
    .eq('item_type', itemType)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('프리미엄 정렬 조회 오류:', error);
    return items;
  }

  const appsById = new Map();
  (data || []).forEach(app => {
    if (!appsById.has(app.item_id)) {
      appsById.set(app.item_id, []);
    }
    appsById.get(app.item_id).push(app);
  });

  const isActive = (app) => {
    if (!app) return false;
    if (app.status !== 'approved' && app.status !== 'active') return false;
    if (!app.end_at) return false;
    return new Date(app.end_at) > new Date();
  };

  return [...items].sort((a, b) => {
    const aApps = appsById.get(a.id) || [];
    const bApps = appsById.get(b.id) || [];
    const aLatest = aApps[0];
    const bLatest = bApps[0];

    const aPremium = isActive(aLatest);
    const bPremium = isActive(bLatest);

    if (aPremium && !bPremium) return -1;
    if (!aPremium && bPremium) return 1;

    if (aPremium && bPremium && aLatest && bLatest) {
      return new Date(bLatest.created_at) - new Date(aLatest.created_at);
    }
    return 0;
  });
};

