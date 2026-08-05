import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '..', 'dist');
const indexPath = join(distDir, 'index.html');
const template = readFileSync(indexPath, 'utf8');

const pages = [
  {
    path: '/',
    title: '전국 3PL 물류센터·화주 찾기 | 33PL',
    description: '전국 3PL 물류센터와 물류대행이 필요한 화주를 검색하고 비교할 수 있는 물류 매칭 플랫폼, 33PL입니다.',
    heading: '전국 3PL 물류센터와 화주를 연결합니다',
    body: '지역과 보관 조건, 취급 품목을 기준으로 물류센터를 찾고 물류대행이 필요한 화주 정보를 확인하세요.',
    links: [
      ['/warehouse-search', '3PL 물류센터 찾기'],
      ['/customer-search', '물류대행 화주 찾기'],
      ['/faq', '33PL 이용 안내']
    ]
  },
  {
    path: '/warehouse-search',
    title: '전국 3PL 물류센터 찾기 | 33PL',
    description: '지역, 보관 조건, 취급 품목과 물류 서비스 기준으로 전국 3PL 물류센터를 찾아보세요.',
    heading: '전국 3PL 물류센터 찾기',
    body: '지역, 상온·냉장·냉동 보관, 취급 상품, 배송과 물류 솔루션 조건에 맞는 물류센터를 검색하고 비교할 수 있습니다.',
    links: [['/customer-search', '물류대행 화주 찾기'], ['/contact', '33PL 문의하기']]
  },
  {
    path: '/customer-search',
    title: '물류대행 화주 찾기 | 33PL',
    description: '물류대행이 필요한 화주 정보를 확인하고 3PL 물류 협업 기회를 찾아보세요.',
    heading: '물류대행 화주 찾기',
    body: '필요 지역, 상품 유형, 보관 조건과 월 물동량을 기준으로 3PL 물류대행이 필요한 화주 정보를 찾아보세요.',
    links: [['/warehouse-search', '3PL 물류센터 찾기'], ['/contact', '33PL 문의하기']]
  },
  {
    path: '/faq',
    title: '33PL 이용 안내·자주 묻는 질문 | 33PL',
    description: '33PL의 물류센터·화주 매칭 서비스 이용 방법과 자주 묻는 질문을 확인하세요.',
    heading: '33PL 이용 안내와 자주 묻는 질문',
    body: '물류센터와 화주 검색, 정보 등록, 열람권과 매칭 서비스 이용에 필요한 안내를 확인할 수 있습니다.',
    links: [['/support', '고객지원'], ['/contact', '1:1 문의하기']]
  },
  {
    path: '/support',
    title: '33PL 고객지원 | 서비스 이용 안내',
    description: '33PL 서비스 이용 안내, 자주 묻는 질문 및 고객 문의 방법을 확인하세요.',
    heading: '33PL 고객지원',
    body: '서비스 이용 중 궁금한 사항은 자주 묻는 질문을 확인하거나 1:1 문의를 남겨주세요.',
    links: [['/faq', '자주 묻는 질문'], ['/contact', '1:1 문의하기']]
  },
  {
    path: '/contact',
    title: '33PL 문의하기 | 3PL 물류 매칭 플랫폼',
    description: '33PL 서비스와 3PL 물류 매칭에 대해 문의해 주세요.',
    heading: '33PL 문의하기',
    body: '물류센터·화주 등록과 검색, 서비스 이용, 결제 및 기타 문의를 남겨주시면 확인 후 안내해 드립니다.',
    links: [['/faq', '자주 묻는 질문'], ['/support', '고객지원']]
  },
  {
    path: '/terms',
    title: '33PL 이용약관',
    description: '33PL 서비스 이용약관입니다.',
    heading: '33PL 이용약관',
    body: '33PL 플랫폼의 서비스 이용 조건과 권리, 의무 및 책임 사항을 안내합니다.',
    links: [['/privacy', '개인정보처리방침']]
  },
  {
    path: '/privacy',
    title: '33PL 개인정보처리방침',
    description: '33PL 개인정보처리방침입니다.',
    heading: '33PL 개인정보처리방침',
    body: '33PL 서비스가 처리하는 개인정보의 항목, 목적, 보유 기간과 이용자 권리를 안내합니다.',
    links: [['/terms', '이용약관']]
  },
  {
    path: '/refund',
    title: '33PL 환불정책',
    description: '33PL 서비스 환불정책입니다.',
    heading: '33PL 환불정책',
    body: '33PL 유료 서비스의 취소와 환불 조건 및 처리 절차를 안내합니다.',
    links: [['/terms', '이용약관']]
  }
];

const escapeHtml = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const renderLinks = links => links
  .map(([href, label]) => `<li><a href="${href}">${escapeHtml(label)}</a></li>`)
  .join('');

const renderPage = page => {
  const canonical = `https://www.33pl.co.kr${page.path === '/' ? '/' : page.path}`;
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(page.description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(page.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(page.description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`);

  const content = `<div id="root"><main data-seo-prerender="true"><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.body)}</p><nav aria-label="관련 페이지"><ul>${renderLinks(page.links)}</ul></nav></main></div>`;
  return html.replace('<div id="root"></div>', content);
};

for (const page of pages) {
  const output = renderPage(page);
  const canonical = `https://www.33pl.co.kr${page.path === '/' ? '/' : page.path}`;
  const isValid = output.includes('data-seo-prerender="true"')
    && output.includes(`<link rel="canonical" href="${canonical}" />`)
    && output.includes('<h1>')
    && output.includes('</h1>');
  if (!isValid) {
    throw new Error(`SEO page generation failed for ${page.path}`);
  }
  if (page.path === '/') {
    writeFileSync(indexPath, output);
    continue;
  }
  const pageDir = join(distDir, page.path.slice(1));
  mkdirSync(pageDir, { recursive: true });
  writeFileSync(join(pageDir, 'index.html'), output);
}

console.log(`Generated ${pages.length} SEO-ready HTML pages`);
