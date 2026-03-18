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
      systemPrompt = `You are a Bengali news researcher. Provide 5 latest news headlines/facts in Bengali. JSON format: {"facts": [{"fact": "..."}]}`;
    } else if (contentType === "gk") {
      systemPrompt = `You are a Bengali GK expert. Provide 5 facts in Bengali. JSON format: {"facts": [{"fact": "..."}]}`;
    } else if (contentType === "amazing") {
      systemPrompt = `You are a Bengali content creator. Provide 5 amazing facts in Bengali. JSON format: {"facts": [{"fact": "..."}]}`;
    } else if (contentType === "quiz") {
      systemPrompt = `You are a Bengali quiz maker. Provide 5 quizzes in Bengali. JSON format: {"quizzes": [{"question": "...", "options": [], "answer": "...", "explanation": "..."}]}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Topic: ${topic}` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API Error:", response.status, errorText);
      throw new Error(`AI search failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { facts: [{ fact: content }] };
    } catch {
      parsed = { facts: [{ fact: content }] };
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-news error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
