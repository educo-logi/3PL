import { supabase } from './supabaseClient';

/**
 * 이메일 중복 체크 (고객사 및 창고 크로스 체크)
 * @param {string} email 검사할 이메일 주소
 * @returns {Promise<{isDuplicate: boolean, type?: string, message?: string}>}
 */
export const checkEmailDuplicate = async (email) => {
  if (!email || typeof email !== 'string') {
    return { isDuplicate: false };
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. 고객사 테이블 확인
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (customerError && customerError.code !== 'PGRST116') {
      console.error('Customer email check error:', customerError);
    }

    if (customerData) {
      return { 
        isDuplicate: true, 
        type: 'customer', 
        message: '이미 등록된 고객사 이메일입니다.' 
      };
    }

    // 2. 창고 테이블 확인
    const { data: warehouseData, error: warehouseError } = await supabase
      .from('warehouses')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (warehouseError && warehouseError.code !== 'PGRST116') {
      console.error('Warehouse email check error:', warehouseError);
    }

    if (warehouseData) {
      return { 
        isDuplicate: true, 
        type: 'warehouse', 
        message: '이미 등록된 창고업체 이메일입니다.' 
      };
    }

    return { isDuplicate: false };

  } catch (error) {
    console.error('Email duplicate check unexpected error:', error);
    return { isDuplicate: false }; // 에러 발생 시 가입 진행 허용할지 차단할지 정책에 따름 (여기선 false)
  }
};
