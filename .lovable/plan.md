

## Plan: Redesign Generated Image & Add Logo/Footer Text Fields on Website

### What changes

**1. Remove logo and footer text from the AI image prompt** (`generate-post/index.ts`)
- Remove section 2 (TOP-RIGHT CORNER "PRACTICE Koro." badge)
- Remove section 6 (FOOTER with practicekoro.online text)
- Keep only: background image, gradient overlay, category label, and main Bengali text

**2. Add Logo URL and Footer Text input fields on the website** (`InputPanel.tsx`)
- Add a "লোগো URL" (Logo URL) text input field
- Add a "ফুটার টেক্সট" (Footer Text) text input field
- These values will be stored in state and passed through to the generate-post function

**3. Update state and props flow** (`Index.tsx`, `InputPanel.tsx`, `CanvasPanel.tsx`)
- Add `logoUrl` and `footerText` state in Index
- Pass them through InputPanel → generate-post calls
- Also pass them from CanvasPanel's "More" button flow

**4. Overlay logo and footer on the website UI** (`CanvasPanel.tsx`)
- On each generated post card, overlay the logo image (top-right) and footer text (bottom) using CSS positioning on top of the AI-generated image
- This way the branding is added client-side, not baked into the AI image

### Why this approach
- AI image generation becomes simpler and more reliable (Bengali text rendering is the focus)
- Users can change logo/footer without regenerating images
- Logo rendered as an actual image (not AI-approximated text) looks much cleaner

### Files to modify
- `supabase/functions/generate-post/index.ts` — simplify prompt
- `src/pages/Index.tsx` — add logoUrl, footerText state
- `src/components/InputPanel.tsx` — add two input fields
- `src/components/CanvasPanel.tsx` — overlay logo & footer on rendered cards

