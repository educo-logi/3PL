import { supabase } from './supabaseClient';

/**
 * 알림 관리 유틸리티
 */

/**
 * 알림 생성
 */
export const createNotification = (userId, type, title, message) => {
  const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  
  const notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString()
  };

  notifications.push(notification);
  console.log('[NotificationUtils] Creating Notification for User:', userId);
  console.log('[NotificationUtils] Created Item:', notification);
  localStorage.setItem('notifications', JSON.stringify(notifications));
  
  // 브라우저 알림 (권한이 있는 경우)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: '/favicon.ico'
    });
  }

  return notification;
};

/**
 * 알림 권한 요청
 */
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
};

/**
 * 읽지 않은 알림 개수 조회
 */
export const getUnreadNotificationCount = async () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser) return 0;

  // 1. 로컬 저장소 읽지 않은 알림 카운트
  const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  const localCount = notifications.filter(n => n.userId === currentUser.id && !n.read).length;

  // 2. 클라우드 DB 선물 지급 읽지 않은 알림 카운트 추가
  try {
    const { data: dbHistory } = await supabase
      .from('payment_history')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('amount', 0); // 선물 지급 내역만
      
    const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    const dbUnreadCount = (dbHistory || []).filter(h => !readIds.includes(`db-${h.id}`)).length;
    
    return localCount + dbUnreadCount;
  } catch (err) {
    console.warn('[NotificationUtils] Failed to fetch DB count:', err);
    return localCount;
  }
};

