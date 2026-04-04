import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

interface EmailRequest {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

const EMAIL_TEMPLATES = {
  welcome: {
    subject: "Veilrum에 오신 것을 환영합니다!",
    html: (data: Record<string, unknown>) => `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>환영합니다, ${data.name}님!</h1>
        <p>Veilrum에 가입해 주셔서 감사합니다.</p>
        <p>이제 V-File을 통해 자신의 관계 가면을 발견하고 성장할 수 있습니다.</p>
        <a href="${data.appUrl}/why" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 16px;">
          WHY 분석 시작하기
        </a>
      </div>
    `,
  },
  analysis_complete: {
    subject: "WHY 분석이 완료되었습니다",
    html: (data: Record<string, unknown>) => `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>${data.name}님의 WHY 분석 결과가 준비되었습니다</h1>
        <p>분석이 완료되었습니다. 결과를 확인해보세요!</p>
        <a href="${data.appUrl}/why-analysis" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 16px;">
          결과 확인하기
        </a>
      </div>
    `,
  },
  match_request: {
    subject: "새로운 매칭 요청이 도착했습니다",
    html: (data: Record<string, unknown>) => `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>새로운 매칭 요청</h1>
        <p>${data.requesterName}님이 매칭을 요청했습니다.</p>
        <p><strong>메시지:</strong> ${data.message || '메시지 없음'}</p>
        <a href="${data.appUrl}/community" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 16px;">
          요청 확인하기
        </a>
      </div>
    `,
  },
  match_accepted: {
    subject: "매칭 요청이 수락되었습니다",
    html: (data: Record<string, unknown>) => `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>매칭 성공!</h1>
        <p>${data.accepterName}님이 매칭 요청을 수락했습니다.</p>
        <p>이제 대화를 시작할 수 있습니다.</p>
        <a href="${data.appUrl}/chat" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 16px;">
          채팅 시작하기
        </a>
      </div>
    `,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set, email sending disabled");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const { to, template, data }: EmailRequest = await req.json();

    const templateConfig = EMAIL_TEMPLATES[template as keyof typeof EMAIL_TEMPLATES];

    if (!templateConfig) {
      return new Response(
        JSON.stringify({ error: "Invalid template" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const subject = templateConfig.subject;
    const html = templateConfig.html(data);

    // Send email using Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Veilrum <noreply@veilor.ai>",
        to: [to],
        subject,
        html,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Failed to send email:", emailData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailData }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
