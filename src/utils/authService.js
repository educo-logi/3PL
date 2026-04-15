/**
 * 33PL 중앙 인증 서비스 모듈
 * 
 * Supabase Auth 기반 인증 + 레거시(SHA-256) Fallback 이중 모드 지원
 * - 신규 가입: supabase.auth.signUp() → bcrypt 자동 적용
 * - 로그인: Supabase Auth 우선 → 실패 시 레거시 테이블 비밀번호 비교
 * - 관리자: app_metadata.role === 'admin' (서버 측 검증)
 */
import { supabase } from './supabaseClient';

// ============================================================
// 세션 관리
// ============================================================

/**
 * 현재 Supabase Auth 세션의 사용자 정보를 반환합니다.
 * 서버에서 검증된 정보이므로 변조 불가합니다.
 */
export const getAuthUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
};

/**
 * 현재 로그인한 사용자의 프로필 (localStorage 기반, password 제외)
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * 프로필 정보를 localStorage에 저장 (password 필드 자동 제거)
 */
export const setCurrentUser = (user) => {
  if (!user) {
    localStorage.removeItem('currentUser');
    return;
  }
  // password 필드를 절대 localStorage에 저장하지 않음
  const { password, ...safeUser } = user;
  localStorage.setItem('currentUser', JSON.stringify(safeUser));
};

// ============================================================
// 관리자 인증 (서버 측 검증)
// ============================================================

/**
 * 현재 사용자가 관리자인지 서버 측에서 검증합니다.
 * app_metadata.role === 'admin' 확인 (JWT 기반, 변조 불가)
 * 
 * Fallback: 레거시 adminAuth localStorage (이행 기간 동안)
 */
export const isAdmin = async () => {
  // 1차: Supabase Auth 서버 검증 (가장 안전)
  try {
    const user = await getAuthUser();
    if (user?.app_metadata?.role === 'admin') {
      return true;
    }
  } catch (err) {
    console.warn('[AuthService] Supabase Auth admin check failed:', err);
  }
  
  // 2차: 레거시 Fallback (이행 기간 한정)
  // TODO: 관리자를 Supabase Auth로 마이그레이션 후 이 Fallback 제거
  return localStorage.getItem('adminAuth') === 'true';
};

/**
 * 동기적 관리자 확인 (렌더링에서 사용, localStorage 기반)
 * 보안적으로 완벽하지 않으나 UI 표시용으로 사용
 * 중요한 동작은 반드시 isAdmin() (async)을 사용할 것
 */
export const isAdminSync = () => {
  return localStorage.getItem('adminAuth') === 'true';
};

// ============================================================
// 회원가입 (Supabase Auth 연동)
// ============================================================

/**
 * 신규 회원가입 (Supabase Auth + 프로필 테이블)
 * @param {string} email 이메일
 * @param {string} password 비밀번호 (Supabase Auth에서 bcrypt 처리)
 * @param {'warehouse'|'customer'} userType 사용자 유형
 * @param {Object} profileData 프로필 데이터 (password 제외)
 */
export const signup = async (email, password, userType, profileData) => {
  try {
    // 1. Supabase Auth 계정 생성 (bcrypt 자동 적용)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { user_type: userType } // user_metadata에 저장
      }
    });

    if (authError) {
      // 이미 존재하는 이메일 등
      console.error('[AuthService] Signup auth error:', authError);
      return { 
        success: false, 
        message: authError.message === 'User already registered' 
          ? '이미 등록된 이메일입니다.' 
          : `회원가입 중 오류: ${authError.message}` 
      };
    }

    const authUserId = authData.user?.id;
    if (!authUserId) {
      return { success: false, message: '인증 계정 생성에 실패했습니다.' };
    }

    // 2. 프로필 테이블에 INSERT (password는 저장하지 않음)
    const table = userType === 'warehouse' ? 'warehouses' : 'customers';
    const { error: profileError } = await supabase
      .from(table)
      .insert([{
        ...profileData,
        email,
        auth_user_id: authUserId,
        password: 'SUPABASE_AUTH', // 레거시 호환 마커 (해시가 아님을 명시)
        status: 'pending',
        user_type: userType
      }]);

    if (profileError) {
      console.error('[AuthService] Profile insert error:', profileError);
      // Auth 계정은 생성됐지만 프로필 실패 → 에러 반환 (수동 정리 필요)
      return { success: false, message: '프로필 정보 저장에 실패했습니다: ' + profileError.message };
    }

    return { success: true, user: authData.user };

  } catch (error) {
    console.error('[AuthService] Signup unexpected error:', error);
    return { success: false, message: '회원가입 처리 중 오류가 발생했습니다.' };
  }
};

// ============================================================
// 로그인 (이중 모드: Supabase Auth 우선 → 레거시 Fallback)
// ============================================================

/**
 * 로그인 (Supabase Auth 우선, 레거시 SHA-256 Fallback)
 * @param {string} email 이메일 (또는 관리자 아이디)
 * @param {string} password 비밀번호
 * @param {'warehouse'|'customer'} userType 사용자 유형
 */
export const login = async (email, password, userType) => {
  // === 1차: Supabase Auth 시도 (신규 사용자) ===
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!authError && authData.user) {
      // Supabase Auth 로그인 성공
      const authUser = authData.user;
      
      // 관리자 체크
      if (authUser.app_metadata?.role === 'admin') {
        localStorage.setItem('adminAuth', 'true');
        localStorage.removeItem('currentUser');
        return { success: true, isAdmin: true, user: authUser };
      }

      // 프로필 조회 (password 제외)
      const table = userType === 'warehouse' ? 'warehouses' : 'customers';
      const { data: profile, error: profileError } = await supabase
        .from(table)
        .select('id, company_name, email, auth_user_id, status, user_type, location, city, dong, representative, phone, contact_person, contact_phone, business_number')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (!profileError && profile) {
        localStorage.removeItem('adminAuth');
        setCurrentUser(profile);
        window.dispatchEvent(new CustomEvent('userLogin'));
        return { success: true, isAdmin: false, user: profile };
      }
      
      // auth 성공했지만 프로필이 없으면 (다른 userType일 수 있음)
      // 반대 테이블도 시도
      const otherTable = userType === 'warehouse' ? 'customers' : 'warehouses';
      const { data: otherProfile } = await supabase
        .from(otherTable)
        .select('id, company_name, email, auth_user_id, status, user_type, location, city, dong, representative, phone, contact_person, contact_phone, business_number')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (otherProfile) {
        localStorage.removeItem('adminAuth');
        setCurrentUser(otherProfile);
        window.dispatchEvent(new CustomEvent('userLogin'));
        return { success: true, isAdmin: false, user: otherProfile, wrongType: true };
      }
    }
  } catch (authErr) {
    // Supabase Auth 실패는 무시하고 레거시 시도
    console.warn('[AuthService] Supabase Auth login failed, trying legacy:', authErr);
  }

  // === 2차: 레거시 로그인 (기존 SHA-256 사용자) ===
  try {
    const { comparePassword } = await import('./passwordHash');

    const table = userType === 'warehouse' ? 'warehouses' : 'customers';
    const { data: user, error } = await supabase
      .from(table)
      .select('id, company_name, business_number, email, password, auth_user_id, status, user_type, location, city, dong, representative, phone, contact_person, contact_phone')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      return { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
    }

    // 비밀번호 비교 (레거시)
    const isMatch = comparePassword(password, user.password);
    if (!isMatch) {
      return { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
    }

    // 레거시 로그인 성공 — password 제외하고 저장
    localStorage.removeItem('adminAuth');
    setCurrentUser(user); // setCurrentUser는 자동으로 password 제거
    window.dispatchEvent(new CustomEvent('userLogin'));
    return { success: true, isAdmin: false, user: { ...user, password: undefined } };

  } catch (legacyErr) {
    console.error('[AuthService] Legacy login error:', legacyErr);
    return { success: false, message: '로그인 중 오류가 발생했습니다.' };
  }
};

// ============================================================
// 관리자 전용 로그인
// ============================================================

/**
 * 관리자 로그인
 * Supabase Auth로 로그인 후 app_metadata.role === 'admin' 검증
 * (레거시 환경변수 방식 제거됨 - 빌드 파일에 비밀번호 노출 방지)
 */
export const adminLogin = async (username, password) => {
  // Supabase Auth (이메일 기반)
  const email = username.includes('@') ? username : `${username}@admin.local`;

  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!error && authData.user?.app_metadata?.role === 'admin') {
      localStorage.setItem('adminAuth', 'true');
      localStorage.removeItem('currentUser');
      return { success: true };
    }

    // 로그인은 됐지만 admin 역할이 없는 경우
    if (!error && authData.user) {
      // 세션 정리
      await supabase.auth.signOut();
      return { success: false, message: '관리자 권한이 없는 계정입니다.' };
    }
  } catch (err) {
    console.warn('[AuthService] Admin login error:', err);
  }

  return { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
};

// ============================================================
// 로그아웃
// ============================================================

/**
 * 로그아웃 (Supabase Auth + localStorage 정리)
 */
export const logout = async () => {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('[AuthService] Supabase signOut error:', err);
  }
  
  localStorage.removeItem('currentUser');
  localStorage.removeItem('adminAuth');
  window.dispatchEvent(new CustomEvent('userLogout'));
};
