

# GK Post Generation — Single Fact Image Post

## Problem
Currently, for GK topics the system generates multiple facts and a generic summary. The user wants each GK post to contain **one specific, compelling fact** about the topic, rendered as a visually appealing image post with that Bengali text prominently displayed — like a social media infographic card.

Example: Topic "মুঘল আমল" → generates one fact like "মুঘল আমলে নির্মিত তাজমহল বিশ্বে স্থাপত্য শিল্পের এক অসাধারণ নিদর্শন এবং এটি প্রেমের প্রতীক হিসেবে পরিচিত।" → image post with that text.

## Changes

### 1. `supabase/functions/search-news/index.ts`
- Update the GK system prompt to return **one single compelling fact** (not 3-4) as the `synthesized` field
- The fact should be a complete, informative Bengali sentence suitable for a social media image post
- Keep the `facts` array with just that one fact for display in the left panel

### 2. `supabase/functions/generate-post/index.ts`  
- Update the image generation prompt for GK content type to:
  - Place the Bengali fact text as the **main visual element** on the image
  - Use a clean infographic/card style layout
  - Large, readable Bengali typography as the centerpiece
  - Relevant background illustration/icon related to the topic
  - Social media post card aesthetic (like the screenshot reference)
- Make the caption text the core of the image design, not just an overlay

### 3. Redeploy both edge functions

No UI changes needed — the existing flow already displays the generated image and caption correctly.

