/**
 * Google Tag Manager Event Tracking Helper
 */
export const trackEvent = (eventName, params = {}) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
            event: eventName,
            ...params,
            timestamp: new Date().toISOString()
        });
        // Dev log
        if (import.meta.env.DEV) {
            console.log('📊 GTM Event:', eventName, params);
        }
    }
};

// Predefined event names for consistency
export const GA_EVENTS = {
    LOGIN_CLICK: 'login_click',
    SIGNUP_CLICK: 'signup_click',
    LOGOUT_CLICK: 'logout_click',
    CTA_CLICK: 'cta_button_click',
    REGISTER_WAREHOUSE: 'register_warehouse_submit',
    REGISTER_CUSTOMER: 'register_customer_submit',
    CONTACT_SUBMIT: 'contact_submit',
    VIEW_DETAIL: 'view_detail_click',
    DOWNLOAD_FILE: 'download_file_click'
};
