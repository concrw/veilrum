import { supabase } from "@/integrations/supabase/client";

export async function sendEmail(
  to: string,
  template: string,
  data: Record<string, unknown>
) {
  try {
    const { data: result, error } = await supabase.functions.invoke(
      "send-email",
      {
        body: {
          to,
          template,
          data: {
            ...data,
            appUrl: window.location.origin,
          },
        },
      }
    );

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error };
    }

    console.log("Email sent successfully:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("Email service error:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(userEmail: string, userName: string) {
  return sendEmail(userEmail, "welcome", { name: userName });
}

export async function sendAnalysisCompleteEmail(
  userEmail: string,
  userName: string
) {
  return sendEmail(userEmail, "analysis_complete", { name: userName });
}

export async function sendMatchRequestEmail(
  recipientEmail: string,
  requesterName: string,
  message?: string
) {
  return sendEmail(recipientEmail, "match_request", {
    requesterName,
    message,
  });
}

export async function sendMatchAcceptedEmail(
  requesterEmail: string,
  accepterName: string
) {
  return sendEmail(requesterEmail, "match_accepted", { accepterName });
}
