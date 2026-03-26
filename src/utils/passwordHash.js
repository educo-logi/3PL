/**
 * @deprecated 이 모듈은 보안 취약점으로 인해 더 이상 사용되지 않습니다.
 * 신규 가입자는 Supabase Auth (bcrypt 내장)를 사용합니다.
 * 기존 사용자의 레거시 로그인 호환을 위해서만 유지됩니다.
 * 
 * 문제점:
 * 1. SHA-256은 Salt 없이 사용되어 Rainbow Table 공격에 취약
 * 2. 평문 비밀번호 호환 모드가 보안 위험을 초래
 * 
 * 마이그레이션 완료 후 이 파일을 삭제하세요.
 * 대신 src/utils/authService.js를 사용하세요.
 */
import CryptoJS from 'crypto-js';

/**
 * @deprecated Supabase Auth 사용을 권장합니다.
 * 비밀번호를 SHA-256으로 해싱 (레거시 호환용)
 */
export const hashPassword = (password) => {
  console.warn('[DEPRECATED] hashPassword() is deprecated. Use Supabase Auth (authService.signup) instead.');
  return CryptoJS.SHA256(password).toString();
};

/**
 * @deprecated Supabase Auth 사용을 권장합니다.
 * 입력된 비밀번호와 저장된 해싱된 비밀번호 비교 (레거시 호환용)
 * 
 * 보안 수정: 평문 비밀번호 호환 모드를 제거했습니다.
 * 기존 평문 비밀번호 사용자는 비밀번호 재설정이 필요합니다.
 */
export const comparePassword = (inputPassword, storedPassword) => {
  if (!storedPassword) return false;
  
  // Supabase Auth로 마이그레이션된 사용자는 이 함수 사용 불가
  if (storedPassword === 'SUPABASE_AUTH') {
    console.warn('[AuthService] This user uses Supabase Auth. Use authService.login() instead.');
    return false;
  }
  
  // SHA-256 해시 비교만 허용 (평문 비밀번호 호환 모드 제거)
  const hashedInput = hashPassword(inputPassword);
  return hashedInput === storedPassword;
};
