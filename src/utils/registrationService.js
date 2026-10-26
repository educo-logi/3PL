import { normalizeEmail } from './email.js';

const commonFields = [
  'company_name', 'business_number', 'contact_person', 'contact_phone',
  'representative', 'phone', 'location', 'city', 'dong', 'road_address',
  'jibun_address', 'detail_address', 'pallet_count', 'products',
];
const profileFields = {
  warehouse: [...commonFields, 'total_area', 'total_area_unit', 'warehouse_count',
    'warehouse_area', 'warehouse_area_unit', 'available_area', 'available_area_unit',
    'experience', 'storage_types', 'delivery_companies', 'other_delivery_company',
    'solutions', 'other_solution'],
  customer: [...commonFields, 'required_area', 'required_area_unit', 'monthly_volume', 'desired_delivery'],
};

const failure = (code, message) => ({ success: false, code, message });
const duplicate = () => failure('ALREADY_REGISTERED',
  '이미 등록된 이메일입니다. 기존 계정으로 로그인해주세요. 비밀번호가 기억나지 않으면 고객센터로 문의해주세요.');
const confirmationRequired = () => failure('EMAIL_CONFIRMATION_REQUIRED',
  '이메일 인증이 필요합니다. 받은 인증 메일에서 인증을 완료한 뒤 같은 이메일과 비밀번호로 다시 등록해주세요. 인증 메일이 없으면 고객센터로 문의해주세요.');
const temporaryError = () => failure('TEMPORARY_ERROR',
  '등록 처리를 완료하지 못했습니다. 입력 내용은 유지됩니다. 잠시 후 같은 정보로 다시 시도해주세요.');

// An isolated, non-persistent client keeps registration/recovery from replacing
// another user's existing application session.
export const createSignup = (createClient, newRequestId = () => crypto.randomUUID()) => async (
  email, password, userType, profileData,
) => {
  const cleanEmail = normalizeEmail(email);
  if (!Object.hasOwn(profileFields, userType) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return failure('INVALID_INPUT', '이메일과 회원 유형을 확인해주세요.');
  }
  const profile = Object.fromEntries(profileFields[userType]
    .filter((key) => profileData?.[key] !== undefined)
    .map((key) => [key, profileData[key]]));
  if (['company_name', 'business_number', 'contact_person', 'contact_phone']
    .some((key) => typeof profile[key] !== 'string' || !profile[key].trim())) {
    return failure('INVALID_INPUT', '회사명, 사업자등록번호, 담당자명과 연락처를 입력해주세요.');
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/.test(password)) {
    return failure('INVALID_INPUT', '비밀번호는 영문, 숫자, 특수문자를 포함하여 8~16자로 입력해주세요.');
  }

  try {
    const client = createClient();
    // Never create an Auth account before the atomic DB path is installed.
    const { data: readiness, error: readinessError } = await client.rpc('registration_preflight', { p_email: cleanEmail });
    if (readinessError || readiness?.version !== 1) {
      return failure('REGISTRATION_UNAVAILABLE', '현재 회원가입을 처리할 수 없습니다. 잠시 후 다시 시도하거나 고객센터로 문의해주세요.');
    }
    if (readiness.email_registered) return duplicate();

    const requestId = newRequestId();
    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: {
        user_type: userType,
        registration_version: 1,
        registration_request_id: requestId,
        registration_profile: profile,
      } },
    });
    const alreadyExists = error?.code === 'user_already_exists'
      || error?.code === 'email_exists' || error?.message === 'User already registered';
    if (error && !alreadyExists) {
      // A competing request may have claimed the email during signUp.
      const { data: latest, error: latestError } = await client.rpc('registration_preflight', { p_email: cleanEmail });
      if (!latestError && latest?.email_registered) return duplicate();
      if (['weak_password', 'email_address_invalid', 'validation_failed'].includes(error.code)) {
        return failure('INVALID_INPUT', '이메일 또는 비밀번호 형식을 확인해주세요.');
      }
      return temporaryError();
    }

    // Duplicate signUp can return an obfuscated user. Only a real session from
    // signUp or password authentication may authorize profile completion.
    if (alreadyExists || !data?.session || !data?.user?.identities?.length) {
      const { data: authenticated, error: loginError } = await client.auth.signInWithPassword({ email: cleanEmail, password });
      if (loginError?.code === 'email_not_confirmed') return confirmationRequired();
      if (loginError || !authenticated?.user || !authenticated?.session) {
        if (loginError?.code === 'invalid_credentials') {
          return failure('REGISTRATION_INCOMPLETE',
            '가입을 이어가려면 이전에 입력한 비밀번호가 필요합니다. 비밀번호를 확인하거나 고객센터로 문의해주세요.');
        }
        return temporaryError();
      }
    }

    const { data: result, error: completionError } = await client.rpc('complete_registration', {
      p_user_type: userType, p_profile: profile, p_request_id: requestId,
    });
    if (completionError) return temporaryError();
    if (result?.code === 'EMAIL_CONFIRMATION_REQUIRED') return confirmationRequired();
    if (result?.code === 'ALREADY_REGISTERED') return duplicate();
    if (result?.code !== 'REGISTERED') return temporaryError();
    return { success: true, code: 'REGISTERED', recovered: result.recovered === true };
  } catch {
    // Raw Auth/DB errors may contain personal data: do not log or render them.
    return temporaryError();
  }
};
