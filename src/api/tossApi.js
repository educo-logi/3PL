import { supabase } from '../utils/supabaseClient';

export const confirmTossPayment = async (paymentKey, orderId, amount) => {
  try {
    const { data, error } = await supabase.functions.invoke('toss-confirm', {
      body: { paymentKey, orderId, amount: Number(amount) }
    });
    
    if (error) {
      // Supabase Edge Function 에러 (500 에러 등)
      throw error;
    }

    if (data.error) {
      // Toss API 에러 응답
      throw new Error(data.error.message || '결제 승인을 실패했습니다.');
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Toss payment confirm error:', err);
    return { success: false, message: err.message || '결제 승인 중 오류가 발생했습니다.' };
  }
};
