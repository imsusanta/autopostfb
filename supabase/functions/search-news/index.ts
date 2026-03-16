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
    const { topic, contentType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    if (contentType === "news") {
      systemPrompt = `You are a Bengali news researcher. Given a topic, provide the latest news information (as if from the last 24 hours) in Bengali. Include 3 key headlines/facts with brief descriptions. Format as JSON with this structure:
      {"headlines": [{"title": "headline in Bengali", "summary": "2-3 sentence summary in Bengali", "source": "probable source name"}], "synthesized": "A comprehensive 3-4 sentence summary in Bengali combining all findings"}`;
    } else if (contentType === "gk") {
      systemPrompt = `You are a Bengali general knowledge expert. Given a topic, provide exactly ONE specific, compelling, informative fact in Bengali. The fact should be a single complete sentence (2-3 lines max) that would work as the main text on a social media infographic card. Format as JSON:
      {"facts": [{"fact": "the single fact in Bengali"}], "synthesized": "the same single fact sentence in Bengali"}`;
    } else if (contentType === "amazing") {
      systemPrompt = `You are a Bengali content creator specializing in amazing facts. Given a topic, provide 3 mind-blowing facts in Bengali. Format as JSON:
      {"facts": [{"fact": "amazing fact in Bengali"}], "synthesized": "An engaging paragraph in Bengali about these amazing facts, suitable for viral social media"}`;
    } else if (contentType === "quiz") {
      systemPrompt = `You are a Bengali quiz maker. Given a topic, create a compelling quiz question with 4 options in Bengali. Format as JSON:
      {"question": "quiz question in Bengali", "options": ["option A", "option B", "option C", "option D"], "answer": "correct option", "explanation": "brief explanation in Bengali", "synthesized": "The quiz question formatted as an engaging social media post in Bengali"}`;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Topic: ${topic}`,
            },
          ],
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
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { synthesized: content };
    } catch {
      parsed = { synthesized: content };
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-news error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
