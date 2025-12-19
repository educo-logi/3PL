import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAlreadyViewed } from '../utils/viewingPassUtils';
import { supabase } from '../utils/supabaseClient';

export const useAccessCheck = (data, type) => {
    const navigate = useNavigate();

    useEffect(() => {
        const checkAccess = async () => {
            // 1. 데이터가 아직 로드되지 않았으면 패스
            if (!data) return;

            // 2. 관리자 체크 (로컬 스토리지 -> Supabase Role 체크로 강화 필요하지만, 1차적으로 로컬 유지)
            // TODO: 추후 Supabase user role 체크로 변경 권장
            const localAdmin = localStorage.getItem('adminAuth') === 'true';
            if (localAdmin) return;

            // 3. 본인 여부 체크 (본인이면 열람 가능)
            const { data: userData } = await supabase.auth.getUser();
            const currentUserId = userData?.user?.id;

            // data.owner_id 가 현재 로그인한 사용자와 같으면 패스
            if (data.owner_id && currentUserId && data.owner_id === currentUserId) {
                return;
            }

            // 4. 열람 여부 체크
            const hasViewed = await isAlreadyViewed(data.id, type);

            if (!hasViewed) {
                alert('접근 권한이 없습니다. 먼저 열람권을 사용하여 잠금을 해제해주세요.');
                // 목록 페이지로 리다이렉트
                const listPage = type === 'warehouse' ? '/warehouse-search' : '/customer-search';
                navigate(listPage);
            }
        };

        checkAccess();
    }, [data, type, navigate]);
};
