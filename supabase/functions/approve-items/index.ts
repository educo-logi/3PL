// Supabase Edge Function: 관리자 승인/거절 처리 (service role 사용)
// 환경변수:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - ADMIN_SECRET (프런트에서 Authorization: Bearer <ADMIN_SECRET> 로 호출)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminSecret = Deno.env.get("ADMIN_SECRET");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // 간단한 관리자 토큰 검증 (Bearer <ADMIN_SECRET>)
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!adminSecret || token !== adminSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();
    const { itemId, table, approve } = body as {
      itemId: string;
      table: "warehouses" | "customers" | "premium_applications";
      approve: boolean;
    };

    if (!itemId || !table || approve === undefined) {
      return new Response("Invalid payload", { status: 400 });
    }

    const status = approve ? "approved" : "rejected";
    const payload: Record<string, unknown> = {
      status,
    };

    // 승인일자 기록
    if (approve) {
      payload["approved_at"] = new Date().toISOString();
    }

    const { error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", itemId);

    if (error) {
      console.error("Approve error:", error);
      return new Response(error.message, { status: 500 });
    }

    return new Response(
      JSON.stringify({ success: true, status }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Approve exception:", e);
    return new Response("Bad Request", { status: 400 });
  }
});









