import { useEffect } from 'react';
import { setSwipeEnabled } from '../utils/platform';

/**
 * 모달 오픈 시 배경 스크롤을 잠그고 앱의 새로고침을 비활성화하는 훅
 */
const useModalEffect = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      // 1. 배경 스크롤 잠금
      document.body.style.overflow = 'hidden';
      // 2. 앱 새로고침 비활성화
      setSwipeEnabled(false);
    } else {
      // 1. 배경 스크롤 해제
      document.body.style.overflow = 'unset';
      // 2. 앱 새로고침 활성화
      setSwipeEnabled(true);
    }

    // 컴포넌트 언마운트 시 복구
    return () => {
      document.body.style.overflow = 'unset';
      setSwipeEnabled(true);
    };
  }, [isOpen]);
};

export default useModalEffect;
