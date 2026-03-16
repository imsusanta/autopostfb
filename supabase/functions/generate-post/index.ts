import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callAIWithRetry(body: object, apiKey: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (response.ok) return response;

    if (response.status === 429 && attempt < maxRetries - 1) {
      const waitSec = Math.pow(2, attempt + 1) * 5;
      console.log(`Rate limited, waiting ${waitSec}s before retry ${attempt + 1}/${maxRetries}...`);
      await new Promise((r) => setTimeout(r, waitSec * 1000));
      continue;
    }

    return response;
  }
  throw new Error("Max retries exceeded");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, contentType, caption, platform, aspectRatio } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isStory = aspectRatio === "9:16";
    const size = isStory ? "1080x1920 (9:16 portrait)" : "1080x1080 (1:1 square)";

    // Generate a topic-related SCENE image — NO text on image
    const imagePrompt = `Generate a visually stunning, high-quality photograph or illustration related to the following topic for a social media post.

Topic: ${topic}
Context: ${caption}

REQUIREMENTS:
- Size: ${size}
- Create a beautiful, vivid, photorealistic or high-quality illustrated scene directly related to the topic
- DO NOT include any text, letters, words, numbers, watermarks, or typography on the image
- DO NOT include any UI elements, borders, frames, or overlays
- The image should be a pure visual scene/photograph that represents the topic
- Use rich colors, dramatic lighting, and cinematic composition
- Style: ${contentType === "news" ? "Photojournalistic, dramatic, high-impact visual" : contentType === "gk" ? "Educational, clean, detailed illustration or photograph" : contentType === "amazing" ? "Awe-inspiring, dramatic, wonder-evoking visual" : "Vibrant, engaging, thought-provoking visual"}
- Make it eye-catching and suitable for ${platform || "social media"}
- The image should work well as a background with text overlay at the bottom`;

    const response = await callAIWithRetry(
      {
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      },
      LOVABLE_API_KEY
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI image error:", response.status, t);
      throw new Error("Image generation failed");
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    return new Response(
      JSON.stringify({ success: true, imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-post error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
