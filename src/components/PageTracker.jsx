import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const PageTracker = () => {
    const location = useLocation();

    useEffect(() => {
        const trackPageView = async () => {
            try {
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
