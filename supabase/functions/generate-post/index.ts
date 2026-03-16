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

function getCategoryLabel(contentType: string): string {
  switch (contentType) {
    case "news": return "BREAKING NEWS";
    case "gk": return "GENERAL KNOWLEDGE";
    case "amazing": return "AMAZING FACTS";
    case "quiz": return "QUIZ TIME";
    default: return "GENERAL KNOWLEDGE";
  }
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
    const categoryLabel = getCategoryLabel(contentType);

    const imagePrompt = `Generate a professional social media post image with this EXACT layout. Size: ${size}

LAYOUT (top to bottom):

1. BACKGROUND: A stunning, photorealistic, high-quality photograph or illustration directly related to "${topic}". The image should be vivid, cinematic, and visually striking. The scene should clearly represent the topic context: "${caption}"

2. TOP-RIGHT CORNER: A rounded rectangle badge/pill with semi-transparent gray background containing a small book/chat icon and the text "PRACTICE Koro." in clean sans-serif font (white text, "Koro." in bold with a colored dot)

3. BOTTOM HALF - GRADIENT OVERLAY: A smooth gradient from fully transparent at center to dark black/very dark at bottom, covering roughly the lower 40-45% of the image

4. CATEGORY LABEL: Centered text "${categoryLabel}" in elegant, widely-spaced uppercase letters (tracking/letter-spacing wide), golden/amber color, with thin decorative horizontal lines on both sides. Position this above the main text.

5. MAIN BENGALI TEXT: Below the category label, render this Bengali text in LARGE, BOLD, white font. This is the most important element — must be clearly readable:
"${caption}"
- Use a clean, bold sans-serif Bengali font
- Center-aligned
- Text should be large enough to read easily on mobile
- High contrast white text against the dark gradient

6. FOOTER: At the very bottom, a thin dark bar with small Bengali text in muted color: "মক টেস্ট দিয়ে নিজের প্রস্তুতি যাচাই করুন। সেরা প্র্যাকটিসের জন্য এখনই practicekoro.online ভিজিট করুন।"

CRITICAL RULES:
- The Bengali text MUST be rendered perfectly and be fully readable
- The background image should be related to the topic
- The gradient overlay must be smooth and natural
- Overall professional quality suitable for ${platform || "Facebook and Instagram"}
- Style reference: Professional educational/news content pages on Facebook/Instagram`;

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
