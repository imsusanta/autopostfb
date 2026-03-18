import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getCategoryLabel(contentType: string): string {
  switch (contentType) {
    case "news": return "BREAKING NEWS";
    case "gk": return "GENERAL KNOWLEDGE";
    case "amazing": return "AMAZING FACTS";
    case "quiz": return "QUIZ TIME";
    default: return "GENERAL KNOWLEDGE";
  }
}

function getTemplatePrompt(template: string): string {
  switch (template) {
    case "bold-banner":
      return `DESIGN STYLE - BOLD BANNER:
- A solid vibrant colored banner/strip across the bottom 50% of the image
- Background image fills the top half
- Main text is placed on the solid banner area in LARGE BOLD white letters
- Category label sits at the banner top edge`;

    case "minimal-clean":
      return `DESIGN STYLE - MINIMAL CLEAN:
- White/light cream card-style layout
- Background image takes up the top 40% in a rounded rectangle frame
- Below it, the text sits on clean white space
- Text color is dark charcoal/black`;

    case "neon-glow":
      return `DESIGN STYLE - NEON GLOW:
- Very dark background
- Text has a subtle neon glow effect (cyan, magenta, or electric blue)
- Main text is bright white with a colored glow halo`;

    case "classic-editorial":
      return `DESIGN STYLE - CLASSIC EDITORIAL:
- Newspaper/magazine editorial layout
- Background image positioned in an elegant frame
- Text area below with a cream/off-white background
- Serif-style heading treatment`;

    case "modern-gradient":
    default:
      return `DESIGN STYLE - MODERN GRADIENT:
- Stunning photorealistic background image filling the entire canvas
- Smooth gradient overlay from transparent at center to black at bottom
- Main text on the dark gradient area in BOLD white`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      topic,
      contentType,
      caption,
      platform,
      aspectRatio,
      fontFamily = "Noto Sans Bengali",
      fontSize = 48,
      template = "modern-gradient",
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isStory = aspectRatio === "9:16";
    const size = isStory ? "1080x1920 (9:16 portrait)" : "1080x1080 (1:1 square)";
    const categoryLabel = getCategoryLabel(contentType);
    const templatePrompt = getTemplatePrompt(template);

    const fontSizeDesc =
      fontSize <= 32 ? "small (around 24-32pt)"
      : fontSize <= 48 ? "medium-large (around 36-48pt)"
      : fontSize <= 64 ? "large (around 50-64pt)"
      : "very large (around 66-80pt, maximum emphasis)";

    const imagePrompt = `Generate a professional social media post image. Size: ${size}
Topic: ${topic}
Style Description: ${templatePrompt}
Typography: Font "${fontFamily}", Size ${fontSizeDesc}
Label: ${categoryLabel}
Text to display: "${caption}"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API Error:", response.status, errorText);
      throw new Error(`AI generation failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("AI response keys:", JSON.stringify(Object.keys(data)));

    // Try multiple locations where the image might be in the response
    let imageUrl: string | null = null;

    // Format 1: message.images[].image_url.url (OpenRouter/Lovable native)
    imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;

    // Format 2: message.content is an array of parts (multipart content)
    if (!imageUrl) {
      const content = data.choices?.[0]?.message?.content;
      if (Array.isArray(content)) {
        for (const part of content) {
          if (part.type === "image_url" && part.image_url?.url) {
            imageUrl = part.image_url.url;
            break;
          }
          if (part.type === "image" && part.image_url?.url) {
            imageUrl = part.image_url.url;
            break;
          }
          if (part.inline_data?.mime_type?.startsWith("image/") && part.inline_data?.data) {
            imageUrl = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
            break;
          }
        }
      }
    }

    // Format 3: message.content is a base64 data URL directly
    if (!imageUrl) {
      const content = data.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.startsWith("data:image/")) {
        imageUrl = content;
      }
    }

    if (!imageUrl) {
      console.error("No image found in response:", JSON.stringify(data).substring(0, 1000));
      throw new Error("No image generated in response");
    }

    return new Response(JSON.stringify({ success: true, imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
