import { useState, useEffect } from 'react';
import { getDisplayName } from '../utils/viewingPassUtils';

export const useViewedStatus = (item, itemType) => {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchDisplayName = async () => {
      if (!item) return;

      setLoading(true);
      try {
        const name = await getDisplayName(item, itemType);
        if (mounted) {
          setDisplayName(name);
        }
      } catch (error) {
        console.error('Error fetching display name:', error);
        if (mounted) {
          // 에러 시 기본값 처리 (혹은 빈 문자열)
          setDisplayName(itemType === 'warehouse' ? '창고' : '고객사');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDisplayName();

    return () => {
      mounted = false;
    };
  }, [item, itemType]);

  return { displayName, loading };
};
