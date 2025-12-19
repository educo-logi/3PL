// 샘플 창고/고객사 5개씩 생성 스크립트
// 실행: node scripts/seedSamples.js
// 준비: .env.local 또는 환경변수에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 설정

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  const result = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      result[key] = value;
    }
  }
  return {
    url: process.env.VITE_SUPABASE_URL || result.VITE_SUPABASE_URL,
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || result.VITE_SUPABASE_ANON_KEY,
  };
}

const env = loadEnv();
if (!env.url || !env.anonKey) {
  console.error('❌ VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 필요합니다 (.env.local 확인).');
  process.exit(1);
}

console.log(`Supabase URL: ${env.url}`);

const supabase = createClient(env.url, env.anonKey, {
  auth: { persistSession: false },
});

const warehouses = [
  {
    email: 'wh1@seed3pl.com',
    password: 'Test1234!',
    profile: { user_type: 'warehouse', status: 'pending' },
    data: {
      company_name: '샘플 창고 A',
      location: '경기',
      city: '용인시',
      dong: '처인구',
      available_area: '500',
      pallet_count: '200',
      experience: '3년',
      storage_types: ['상온', '냉장'],
      delivery_companies: ['로젠', 'CJ대한통운'],
      solutions: ['WMS', 'TMS'],
      products: ['식품', '잡화'],
      status: 'pending',
    },
  },
  {
    email: 'wh2@seed3pl.com',
    password: 'Test1234!',
    profile: { user_type: 'warehouse', status: 'pending' },
    data: {
      company_name: '샘플 창고 B',
      location: '경기',
      city: '이천시',
      dong: '마장면',
      available_area: '800',
      pallet_count: '320',
      experience: '5년',
      storage_types: ['상온'],
      delivery_companies: ['한진'],
      solutions: ['WMS'],
      products: ['패션', '리빙'],
      status: 'pending',
    },
  },
  {
    email: 'wh3@seed3pl.com',
    password: 'Test1234!',
    profile: { user_type: 'warehouse', status: 'pending' },
    data: {
      company_name: '샘플 창고 C',
      location: '인천',
      city: '서구',
      dong: '청라동',
      available_area: '650',
      pallet_count: '250',
      experience: '2년',
      storage_types: ['냉동', '냉장'],
      delivery_companies: ['롯데'],
      solutions: ['WMS', '바코드'],
      products: ['식품', '의약외품'],
      status: 'pending',
    },
  },
  {
    email: 'wh4@seed3pl.com',
    password: 'Test1234!',
    profile: { user_type: 'warehouse', status: 'pending' },
    data: {
      company_name: '샘플 창고 D',
      location: '부산',
      city: '강서구',
      dong: '미음동',
      available_area: '400',
      pallet_count: '150',
      experience: '4년',
      storage_types: ['상온'],
      delivery_companies: ['로젠', '롯데'],
      solutions: ['WMS'],
      products: ['잡화', '생활용품'],
      status: 'pending',
    },
  },
  {
    email: 'wh5@seed3pl.com',
    password: 'Test1234!',
    profile: { user_type: 'warehouse', status: 'pending' },
    data: {
      company_name: '샘플 창고 E',
      location: '충남',
      city: '천안시',
      dong: '동남구',
      available_area: '720',
      pallet_count: '280',
      experience: '6년',
      storage_types: ['상온', '냉장'],
      delivery_companies: ['우체국', 'CJ대한통운'],
      solutions: ['WMS', '라벨링'],
      products: ['식품', '뷰티'],
      status: 'pending',
    },
  },
];

const customers = [
  {
    email: 'cust1@seed3pl.com',
    password: 'Test1234!',
    profile: { user_type: 'customer', status: 'pending' },
    data: {
      company_name: '샘플 고객사 1',
      location: '서울',
      city: '강남구',
      dong: '역삼동',
      required_area: '200',
      required_area_unit: '평',
      monthly_volume: '12000',
      products: ['패션', '액세서리'],
      desired_delivery: ['CJ대한통운'],
      status: 'pending',
    },
  },
  {
    email: 'cust2@seed3pl.com',
    password: 'Test1234!',
    profile: { user_type: 'customer', status: 'pending' },
    data: {
      company_name: '샘플 고객사 2',
      location: '서울',
      city: '마포구',
      dong: '합정동',
      required_area: '150',
      required_area_unit: '평',
      monthly_volume: '8000',
      products: ['잡화', '리빙'],
      desired_delivery: ['로젠', '한진'],
      status: 'pending',
    },
  },
  {
    email: 'cust3@seed3pl.com',
    password: 'Test1234!',
    profile: { user_type: 'customer', status: 'pending' },
    data: {
      company_name: '샘플 고객사 3',
      location: '경기',
      city: '성남시',
      dong: '분당구',
      required_area: '300',
      required_area_unit: '평',
      monthly_volume: '15000',
      products: ['식품', '간편식'],
      desired_delivery: ['CJ대한통운'],
      status: 'pending',
    },
  },
  {
    email: 'cust4@seed3pl.com',
    password: 'Test1234!',
    profile: { user_type: 'customer', status: 'pending' },
    data: {
      company_name: '샘플 고객사 4',
      location: '부산',
      city: '해운대구',
      dong: '좌동',
      required_area: '180',
      required_area_unit: '평',
      monthly_volume: '9000',
      products: ['뷰티', '헬스'],
      desired_delivery: ['롯데'],
      status: 'pending',
    },
  },
  {
    email: 'cust5@seed3pl.com',
    password: 'Test1234!',
    profile: { user_type: 'customer', status: 'pending' },
    data: {
      company_name: '샘플 고객사 5',
      location: '대전',
      city: '유성구',
      dong: '봉명동',
      required_area: '220',
      required_area_unit: '평',
      monthly_volume: '11000',
      products: ['전자제품', '주변기기'],
      desired_delivery: ['한진', '로젠'],
      status: 'pending',
    },
  },
];

async function ensureSession(email, password, userType) {
  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: { userType, status: 'pending' } },
  });
  let user = signUp.data?.user || null;
  let session = signUp.data?.session || null;

  if (signUp.error && signUp.error.message && !signUp.error.message.includes('already registered')) {
    throw signUp.error;
  }

  if (!session) {
    const signin = await supabase.auth.signInWithPassword({ email, password });
    if (signin.error) throw signin.error;
    user = signin.data.user;
    session = signin.data.session;
  }

  if (!user || !session) {
    throw new Error(`세션 획득 실패: ${email}`);
  }

  const setResult = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (setResult.error) throw setResult.error;

  return { user };
}

async function upsertProfile(user, profile) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, email: user.email, ...profile }, { onConflict: 'id' });
  if (error) throw error;
}

async function upsertItem(table, ownerId, data) {
  const payload = { owner_id: ownerId, ...data, status: 'pending', submitted_at: new Date().toISOString() };
  const { error } = await supabase.from(table).upsert(payload);
  if (error) throw error;
}

async function seed() {
  const results = [];

  for (const w of warehouses) {
    console.log(`🔄 창고 사용자 생성/로그인: ${w.email}`);
    const { user } = await ensureSession(w.email, w.password, 'warehouse');
    await upsertProfile(user, w.profile);
    await upsertItem('warehouses', user.id, w.data);
    results.push({ email: w.email, password: w.password, userId: user.id, type: 'warehouse', name: w.data.company_name });
  }

  for (const c of customers) {
    console.log(`🔄 고객사 사용자 생성/로그인: ${c.email}`);
    const { user } = await ensureSession(c.email, c.password, 'customer');
    await upsertProfile(user, c.profile);
    await upsertItem('customers', user.id, c.data);
    results.push({ email: c.email, password: c.password, userId: user.id, type: 'customer', name: c.data.company_name });
  }

  console.log('\n✅ 생성/업서트 완료:');
  results.forEach((r) => {
    console.log(`[${r.type}] ${r.name} | email=${r.email} | pw=${r.password} | userId=${r.userId}`);
  });
}

seed()
  .then(() => {
    console.log('\n모든 작업이 완료되었습니다.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ 오류 발생:', err);
    process.exit(1);
  });

