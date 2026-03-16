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
    const { topic, contentType, caption, platform, aspectRatio } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isStory = aspectRatio === "9:16";
    const size = isStory ? "1080x1920 (9:16 story)" : "1080x1080 (1:1 square feed)";

    const imagePrompt = `Create a professional Bengali social media post image for ${platform || "Facebook and Instagram"}.

Topic: ${topic}
Content type: ${contentType === "news" ? "Breaking News" : contentType === "gk" ? "General Knowledge" : contentType === "amazing" ? "Amazing Facts" : "Quiz"}
Caption/Text to include on the image (in Bengali): ${caption}

Design requirements:
- Size: ${size}
- Bold, eye-catching design with vibrant colors
- Bengali text prominently displayed (use large, clear Bengali typography)
- Professional social media post layout
- Include a relevant icon or illustration
- ${contentType === "news" ? "News channel style with urgent feel, red/blue tones" : ""}
- ${contentType === "gk" ? "Educational feel with book/lightbulb motifs, blue/green tones" : ""}
- ${contentType === "amazing" ? "Wow factor, bright colors, star/explosion effects" : ""}
- ${contentType === "quiz" ? "Quiz show style, question mark motifs, purple/gold tones" : ""}
- Add a subtle watermark area at bottom
- Clean, modern design suitable for ${platform}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [
            {
              role: "user",
              content: imagePrompt,
            },
          ],
          modalities: ["image", "text"],
        }),
      }
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
    const textContent = data.choices?.[0]?.message?.content || "";

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    return new Response(
      JSON.stringify({ success: true, imageUrl, description: textContent }),
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
