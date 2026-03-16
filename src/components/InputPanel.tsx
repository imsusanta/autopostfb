import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Newspaper, Brain, HelpCircle, ArrowRight, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ContentType, Platform, AspectRatio, SearchResult } from "@/pages/Index";

const contentTypes: { value: ContentType; label: string; icon: React.ReactNode }[] = [
  { value: "gk", label: "সাধারণ জ্ঞান", icon: <Brain className="h-4 w-4" /> },
  { value: "news", label: "তাজা খবর", icon: <Newspaper className="h-4 w-4" /> },
  { value: "amazing", label: "আশ্চর্যজনক তথ্য", icon: <Sparkles className="h-4 w-4" /> },
  { value: "quiz", label: "কুইজ / প্রশ্ন", icon: <HelpCircle className="h-4 w-4" /> },
];

const platforms: { value: Platform; label: string }[] = [
  { value: "both", label: "Facebook + Instagram" },
  { value: "facebook", label: "শুধু Facebook" },
  { value: "instagram", label: "শুধু Instagram" },
];

interface InputPanelProps {
  isSearching: boolean;
  setIsSearching: (v: boolean) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  searchResult: SearchResult | null;
  setSearchResult: (v: SearchResult | null) => void;
  caption: string;
  setCaption: (v: string) => void;
  setImageUrl: (v: string | null) => void;
  aspectRatio: AspectRatio;
}

export function InputPanel({
  isSearching,
  setIsSearching,
  isGenerating,
  setIsGenerating,
  searchResult,
  setSearchResult,
  caption,
  setCaption,
  setImageUrl,
  aspectRatio,
}: InputPanelProps) {
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState<ContentType>("gk");
  const [platform, setPlatform] = useState<Platform>("both");

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("একটি টপিক লিখুন!");
      return;
    }

    // Step 1: Search/Research
    setIsSearching(true);
    setSearchResult(null);
    setImageUrl(null);

    try {
      const { data: searchData, error: searchError } = await supabase.functions.invoke("search-news", {
        body: { topic: topic.trim(), contentType },
      });

      if (searchError) throw searchError;
      if (searchData?.error) throw new Error(searchData.error);

      const result = searchData.data as SearchResult;
      setSearchResult(result);
      setCaption(result.synthesized || "");

      // Step 2: Generate image
      setIsSearching(false);
      setIsGenerating(true);

      const { data: imageData, error: imageError } = await supabase.functions.invoke("generate-post", {
        body: {
          topic: topic.trim(),
          contentType,
          caption: result.synthesized || topic,
          platform: platform === "both" ? "Facebook and Instagram" : platform,
          aspectRatio,
        },
      });

      if (imageError) throw imageError;
      if (imageData?.error) throw new Error(imageData.error);

      if (imageData?.imageUrl) {
        setImageUrl(imageData.imageUrl);
        toast.success("পোস্ট তৈরি হয়েছে!");
      } else {
        throw new Error("ইমেজ তৈরি হয়নি");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "কিছু একটা সমস্যা হয়েছে");
    } finally {
      setIsSearching(false);
      setIsGenerating(false);
    }
  };

  const busy = isSearching || isGenerating;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-workbench-divider">
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          📱 সোশ্যাল পোস্ট জেনারেটর
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI দিয়ে বাংলা সোশ্যাল মিডিয়া পোস্ট তৈরি করুন
        </p>
      </div>

      {/* Form */}
      <div className="p-5 space-y-5 flex-1">
        {/* Topic */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">টপিক</label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="যেমন: ভারতের ইতিহাস, বিজ্ঞান, মহাকাশ..."
            className="bg-card border-border"
            disabled={busy}
          />
        </div>

        {/* Content Type */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">ধরন</label>
          <div className="grid grid-cols-2 gap-2">
            {contentTypes.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setContentType(ct.value)}
                disabled={busy}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  contentType === ct.value
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-foreground border border-border hover:border-primary/40"
                }`}
              >
                {ct.icon}
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">প্ল্যাটফর্ম</label>
          <div className="flex gap-2 flex-wrap">
            {platforms.map((p) => (
              <button
                key={p.value}
                onClick={() => setPlatform(p.value)}
                disabled={busy}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  platform === p.value
                    ? "bg-secondary text-secondary-foreground ring-2 ring-primary/30"
                    : "bg-card text-muted-foreground border border-border hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={busy || !topic.trim()}
          className="w-full h-12 text-base font-bold rounded-xl gap-2"
          size="lg"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              তথ্য খুঁজছে...
            </>
          ) : isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              ইমেজ তৈরি হচ্ছে...
            </>
          ) : (
            <>
              পোস্ট তৈরি করো
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>

        {/* Search progress indicator */}
        {isSearching && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-sm text-primary font-medium">ওয়েব সার্চ চলছে...</span>
          </div>
        )}

        {/* Search Results */}
        {searchResult && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              তথ্যসূত্র
            </h3>

            {searchResult.headlines?.map((h, i) => (
              <div key={i} className="p-3 rounded-xl bg-card border border-border space-y-1">
                <p className="text-sm font-semibold text-foreground">{h.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{h.summary}</p>
                <p className="text-xs text-primary flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  {h.source}
                </p>
              </div>
            ))}

            {searchResult.facts?.map((f, i) => (
              <div key={i} className="p-3 rounded-xl bg-card border border-border">
                <p className="text-sm text-foreground">{f.fact}</p>
              </div>
            ))}

            {searchResult.question && (
              <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                <p className="text-sm font-semibold text-foreground">{searchResult.question}</p>
                <div className="space-y-1">
                  {searchResult.options?.map((opt, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {String.fromCharCode(65 + i)}. {opt}
                    </p>
                  ))}
                </div>
                <p className="text-xs text-primary font-medium">
                  উত্তর: {searchResult.answer}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
