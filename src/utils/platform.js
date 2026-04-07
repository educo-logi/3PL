/**
 * 앱 접속 여부 확인 및 네이티브 브릿지 호출 유틸리티
 */
export const isApp = () => {
  if (typeof window === 'undefined') return false;
  return navigator.userAgent.includes('33PL_APP_ANDROID');
};

/**
 * 앱의 당겨서 새로고침(SwipeRefreshLayout) 활성화 여부 제어
 */
export const setSwipeEnabled = (isEnabled) => {
  if (isApp() && window.AndroidInterface && window.AndroidInterface.setSwipeEnabled) {
    try {
      window.AndroidInterface.setSwipeEnabled(isEnabled);
    } catch (e) {
      console.error("Failed to call AndroidInterface:", e);
    }
  }
};
