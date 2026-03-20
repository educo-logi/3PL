import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const PageTracker = () => {
    const location = useLocation();

    useEffect(() => {
        const trackPageView = async () => {
            try {
                // [보완] 구글/네이버 등 크롤러 및 자동화 봇 트래픽 제외
                const botPattern = /bot|crawler|spider|slurp|naver|daum|google|headless/i;
                if (botPattern.test(navigator.userAgent)) {
                    return; // 봇 방문은 기록하지 않음
                }

                const userStr = localStorage.getItem('currentUser');
                const user = userStr ? JSON.parse(userStr) : null;

                await supabase.from('page_views').insert({
                    page_path: location.pathname,
                    user_id: user ? user.id : null,
                    viewed_at: new Date().toISOString()
                });
            } catch (error) {
                // 통계 수집 실패가 사용자 경험을 방해하지 않도록 조용히 로깅만 함
                if (import.meta.env.DEV) {
                    console.error('Page tracking failed:', error);
                }
            }
        };

        trackPageView();
    }, [location]);

    return null;
};

export default PageTracker;
