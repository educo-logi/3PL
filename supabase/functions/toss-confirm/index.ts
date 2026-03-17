import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, access-control-allow-origin',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // CORS Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { paymentKey, orderId, amount } = await req.json()

    if (!paymentKey || !orderId || !amount) {
      throw new Error('Missing required parameters: paymentKey, orderId, amount')
    }

    // TOSS_SECRET_KEY will be provided from environment variables in Supabase
    const secretKey = Deno.env.get('TOSS_SECRET_KEY')
    if (!secretKey) {
      throw new Error('TOSS_SECRET_KEY is not set in environment variables')
    }

    // 결제 승인 API 호출 시 본인 인증을 위해 시크릿 키 뒤에 콜론(:)을 붙여 Base64로 인코딩합니다.
    const encodedKey = btoa(`${secretKey}:`)

    console.log(`Confirming payment for orderId: ${orderId}, amount: ${amount}`);

    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    })

    const data = await response.json()
    console.log("Toss API Response Status:", response.status);
    console.log("Toss API Response Data:", data);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("Function Execution Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
