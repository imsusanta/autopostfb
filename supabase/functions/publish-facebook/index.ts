import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, caption } = await req.json();

    const FB_PAGE_ACCESS_TOKEN = Deno.env.get("FB_PAGE_ACCESS_TOKEN");
    if (!FB_PAGE_ACCESS_TOKEN) {
      throw new Error("FB_PAGE_ACCESS_TOKEN is not configured");
    }

    const FB_PAGE_ID = Deno.env.get("FB_PAGE_ID");
    if (!FB_PAGE_ID) {
      throw new Error("FB_PAGE_ID is not configured");
    }

    if (!imageUrl) {
      throw new Error("imageUrl is required");
    }

    // Step 1: Upload the image to Facebook via URL
    const photoUploadUrl = `https://graph.facebook.com/v21.0/${FB_PAGE_ID}/photos`;

    const formData = new FormData();
    formData.append("url", imageUrl);
    formData.append("caption", caption || "");
    formData.append("access_token", FB_PAGE_ACCESS_TOKEN);

    const fbResponse = await fetch(photoUploadUrl, {
      method: "POST",
      body: formData,
    });

    const fbData = await fbResponse.json();

    if (!fbResponse.ok || fbData.error) {
      const errMsg = fbData.error?.message || "Facebook API error";
      const errCode = fbData.error?.code || fbResponse.status;
      console.error("Facebook API error:", JSON.stringify(fbData));
      throw new Error(`Facebook error (${errCode}): ${errMsg}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        postId: fbData.post_id || fbData.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("publish-facebook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
