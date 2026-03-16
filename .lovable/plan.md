

# সোশ্যাল পোস্ট জেনারেটর — AI-Powered Bengali Social Post Engine

## Overview
A split-pane workbench that takes a topic in Bengali, searches real news/GK content, and generates download-ready Facebook/Instagram image posts — all in Bengali.

## Architecture
- **Lovable Cloud** for backend edge functions
- **Perplexity API** (via connector) for real-time web search on news topics
- **Lovable AI Gateway** (Gemini image model) for generating social media post images

## Pages & Layout

### Workbench (Single Page App)
**Left Pane (Input Panel - 380px):**
- Topic input field (Bengali placeholder: "যেমন: ভারতের ইতিহাস, বিজ্ঞান...")
- Content type selector: সাধারণ জ্ঞান | তাজা খবর (২৪ ঘন্টা) | আশ্চর্যজনক তথ্য | কুইজ / প্রশ্ন
- Platform selector: Facebook + Instagram | শুধু Facebook | শুধু Instagram
- "পোস্ট তৈরি করো →" generate button
- Search results / source citations section (shows when news mode)

**Right Pane (Canvas - flex-1):**
- Generated image preview with aspect ratio toggle (1:1 for feed, 9:16 for stories)
- Download button
- Editable caption text area below the image

## Core Flow

### Step 1: Input & Search
- User enters topic + selects content type & platform
- If "তাজা খবর" → Edge function calls Perplexity API with `search_recency_filter: 'day'` to find last 24hr Bengali/English news
- Shows top 3 source headlines with links in left pane

### Step 2: Content Generation
- Edge function sends search results + topic to Lovable AI (Gemini) to synthesize a concise Bengali post caption
- Simultaneously generates a social media image using Gemini image model with Bengali text overlay, news-style design

### Step 3: Preview & Refine
- Image appears in right pane canvas
- User can edit caption text
- Toggle aspect ratio (1:1 ↔ 9:16)
- Regenerate image if needed

### Step 4: Export
- One-click download as PNG
- Caption text copied to clipboard for pasting

## Edge Functions
1. **`search-news`** — Calls Perplexity API for real-time news search
2. **`generate-post`** — Calls Lovable AI to synthesize caption + generate image

## Design
- Clean workbench UI per design brief (slate/blue tones, no gradients)
- Bengali UI labels throughout
- "Searching..." animation during web search phase
- Concentric radius system (outer 20px, inner 12px)
- Independent scrolling for both panes

