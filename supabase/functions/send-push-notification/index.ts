import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  actions?: { action: string; title: string }[];
}

interface PushRequest {
  user_id?: string;
  user_ids?: string[];
  payload: PushPayload;
  broadcast?: boolean;
}

// Base64 URL encoding helper
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Convert base64url to Uint8Array
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Generate VAPID JWT token
async function generateVapidJwt(
  audience: string,
  subject: string,
  privateKey: string
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKeyBytes = base64UrlToUint8Array(privateKey);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = base64UrlEncode(signature);
  return `${unsignedToken}.${signatureB64}`;
}

// Send push notification to a single subscription
async function sendPushToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    // Generate VAPID JWT
    const jwt = await generateVapidJwt(audience, vapidSubject, vapidPrivateKey);

    // Create encrypted payload using Web Crypto API
    const payloadString = JSON.stringify(payload);
    const payloadBytes = new TextEncoder().encode(payloadString);

    // For simplicity, we'll send unencrypted payload with VAPID authentication
    // In production, you should implement proper payload encryption
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": payloadBytes.length.toString(),
        "TTL": "86400",
        "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
        "Urgency": "normal",
      },
      body: payloadString,
    });

    if (response.status === 201 || response.status === 200) {
      return { success: true };
    } else if (response.status === 410 || response.status === 404) {
      // Subscription expired or not found
      return { success: false, error: "subscription_expired" };
    } else {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error("sendPushNotification error:", error);
    return { success: false, error: "Push notification failed" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const vapidSubject = "mailto:admin@veilor.ai";

    const body: PushRequest = await req.json();
    const { user_id, user_ids, payload, broadcast } = body;

    if (!payload || !payload.title) {
      return new Response(
        JSON.stringify({ error: "Payload with title is required" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Set defaults for payload
    const fullPayload: PushPayload = {
      title: payload.title,
      body: payload.body || "",
      icon: payload.icon || "/icon-192x192.png",
      badge: payload.badge || "/icon-192x192.png",
      tag: payload.tag || `veilrum-${Date.now()}`,
      url: payload.url || "/",
      actions: payload.actions || [],
    };

    // Fetch subscriptions based on request type
    let query = supabaseAdmin
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .eq("is_active", true);

    if (broadcast) {
      // Send to all active subscriptions
    } else if (user_ids && user_ids.length > 0) {
      query = query.in("user_id", user_ids);
    } else if (user_id) {
      query = query.eq("user_id", user_id);
    } else {
      return new Response(
        JSON.stringify({ error: "user_id, user_ids, or broadcast flag is required" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No active subscriptions found" }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending push to ${subscriptions.length} subscriptions`);

    // Send notifications
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const result = await sendPushToSubscription(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          fullPayload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject
        );

        // Mark expired subscriptions as inactive
        if (!result.success && result.error === "subscription_expired") {
          await supabaseAdmin
            .from("push_subscriptions")
            .update({ is_active: false })
            .eq("id", sub.id);
        }

        return { user_id: sub.user_id, ...result };
      })
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed: failed,
        total: subscriptions.length,
        details: results,
      }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
