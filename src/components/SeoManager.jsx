import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.33pl.co.kr';
const DEFAULT = {
  title: '전국 3PL 물류센터·화주 찾기 | 33PL',
  description: '전국 3PL 물류센터와 물류대행이 필요한 화주를 검색하고 비교할 수 있는 물류 매칭 플랫폼, 33PL입니다.'
};

const ROUTES = {
  '/': DEFAULT,
  '/warehouse-search': {
    title: '전국 3PL 물류센터 찾기 | 33PL',
    description: '지역, 보관 조건, 취급 품목과 물류 서비스 기준으로 전국 3PL 물류센터를 찾아보세요.'
  },
  '/customer-search': {
    title: '물류대행 화주 찾기 | 33PL',
    description: '물류대행이 필요한 화주 정보를 확인하고 3PL 물류 협업 기회를 찾아보세요.'
  },
  '/faq': {
    title: '33PL 이용 안내·자주 묻는 질문 | 33PL',
    description: '33PL의 물류센터·화주 매칭 서비스 이용 방법과 자주 묻는 질문을 확인하세요.'
  },
  '/support': {
    title: '33PL 고객지원 | 서비스 이용 안내',
    description: '33PL 서비스 이용 안내, 자주 묻는 질문 및 고객 문의 방법을 확인하세요.'
  },
  '/contact': {
    title: '33PL 문의하기 | 3PL 물류 매칭 플랫폼',
    description: '33PL 서비스와 3PL 물류 매칭에 대해 문의해 주세요.'
  },
  '/terms': {
    title: '33PL 이용약관',
    description: '33PL 서비스 이용약관입니다.'
  },
  '/privacy': {
    title: '33PL 개인정보처리방침',
    description: '33PL 개인정보처리방침입니다.'
  },
  '/refund': {
    title: '33PL 환불정책',
    description: '33PL 서비스 환불정책입니다.'
  }
};

const NOINDEX_PATHS = [
  '/warehouse-register', '/customer-register', '/login', '/mypage', '/payment',
  '/payment-history', '/premium-apply', '/compare', '/favorites', '/recent-viewed',
  '/admin/login', '/admin/dashboard', '/design-mockup'
];

const setMeta = (selector, attribute, value) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    const [name, content] = attribute;
    element.setAttribute(name, content);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
};

const SeoManager = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const isDetailPage = /^\/(warehouse|customer)\/[^/]+$/.test(pathname);
    const page = ROUTES[pathname] || (isDetailPage
      ? { title: '3PL 물류 정보 | 33PL', description: DEFAULT.description }
      : DEFAULT);
    const noindex = NOINDEX_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`));
    const canonicalUrl = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;
    const socialDescription = page.description.length > 100 ? `${page.description.slice(0, 97)}...` : page.description;

    document.title = page.title;
    setMeta('meta[name="description"]', ['name', 'description'], page.description);
    setMeta('meta[name="robots"]', ['name', 'robots'], noindex ? 'noindex, nofollow' : 'index, follow');
    setMeta('meta[property="og:title"]', ['property', 'og:title'], page.title);
    setMeta('meta[property="og:description"]', ['property', 'og:description'], socialDescription);
    setMeta('meta[property="og:url"]', ['property', 'og:url'], canonicalUrl);
    setMeta('meta[name="twitter:title"]', ['name', 'twitter:title'], page.title);
    setMeta('meta[name="twitter:description"]', ['name', 'twitter:description'], socialDescription);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
  }, [pathname]);

  return null;
};

export default SeoManager;
