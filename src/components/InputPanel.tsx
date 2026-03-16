import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Newspaper, Brain, HelpCircle, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ContentType, Platform, AspectRatio, SearchResult, GeneratedPost } from "@/pages/Index";

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
  isGeneratingAll: boolean;
  setIsGeneratingAll: (v: boolean) => void;
  searchResult: SearchResult | null;
  setSearchResult: (v: SearchResult | null) => void;
  posts: GeneratedPost[];
  setPosts: (v: GeneratedPost[] | ((prev: GeneratedPost[]) => GeneratedPost[])) => void;
  aspectRatio: AspectRatio;
  setLastTopic: (v: string) => void;
  setLastContentType: (v: ContentType) => void;
  setLastPlatform: (v: Platform) => void;
}

export function InputPanel({
  isSearching,
  setIsSearching,
  isGeneratingAll,
  setIsGeneratingAll,
  searchResult,
  setSearchResult,
  posts,
  setPosts,
  aspectRatio,
  setLastTopic,
  setLastContentType,
  setLastPlatform,
}: InputPanelProps) {
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState<ContentType>("gk");
  const [platform, setPlatform] = useState<Platform>("both");

  const generateImagesForFacts = async (
    facts: { fact: string }[],
    topicStr: string,
    ct: ContentType,
    plat: Platform,
    ar: AspectRatio,
    existingPosts: GeneratedPost[]
  ) => {
    const newPosts: GeneratedPost[] = facts.map((f, i) => ({
      id: `${Date.now()}-${i}`,
      caption: f.fact,
      imageUrl: null,
      isGenerating: true,
    }));

    setPosts([...existingPosts, ...newPosts]);
    setIsGeneratingAll(true);

    const platStr = plat === "both" ? "Facebook and Instagram" : plat;

    // Generate images sequentially with delay to avoid rate limits
    for (let i = 0; i < newPosts.length; i++) {
      const post = newPosts[i];
      try {
        // Wait 12 seconds between requests to avoid rate limiting (skip first)
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 12000));
        }

        const { data, error } = await supabase.functions.invoke("generate-post", {
          body: {
            topic: topicStr,
            contentType: ct,
            caption: facts[i].fact,
            platform: platStr,
            aspectRatio: ar,
          },
        });

        if (error) {
          // supabase SDK wraps non-2xx as FunctionsHttpError; extract body
          const errMsg = typeof error === "object" && "message" in error ? error.message : String(error);
          throw new Error(errMsg);
        }
        if (data?.error) throw new Error(data.error);

        setPosts((prev: GeneratedPost[]) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, imageUrl: data?.imageUrl || null, isGenerating: false }
              : p
          )
        );
      } catch (err: any) {
        console.error(`Image gen failed for post ${i}:`, err);
        const errMsg = err?.message || "";
        
        if (errMsg.includes("Rate limit") || errMsg.includes("429") || errMsg.includes("non-2xx")) {
          toast.info(`⏳ পোস্ট ${i + 1}: Rate limit — 20s পর আবার চেষ্টা করছে...`);
          await new Promise((resolve) => setTimeout(resolve, 20000));
          try {
            const { data, error } = await supabase.functions.invoke("generate-post", {
              body: {
                topic: topicStr,
                contentType: ct,
                caption: facts[i].fact,
                platform: platStr,
                aspectRatio: ar,
              },
            });
            if (!error && !data?.error) {
              setPosts((prev: GeneratedPost[]) =>
                prev.map((p) =>
                  p.id === post.id
                    ? { ...p, imageUrl: data?.imageUrl || null, isGenerating: false }
                    : p
                )
              );
              continue;
            }
          } catch {
            // retry also failed
          }
        }
        
        setPosts((prev: GeneratedPost[]) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, isGenerating: false } : p
          )
        );
        toast.error(`পোস্ট ${i + 1} তৈরি ব্যর্থ হয়েছে`);
      }
    }

    setIsGeneratingAll(false);
    toast.success("পোস্ট তৈরি হয়েছে!");
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("একটি টপিক লিখুন!");
      return;
    }

    setLastTopic(topic.trim());
    setLastContentType(contentType);
    setLastPlatform(platform);

    // Step 1: Search/Research
    setIsSearching(true);
    setSearchResult(null);
    setPosts([]);

    try {
      const { data: searchData, error: searchError } = await supabase.functions.invoke("search-news", {
        body: { topic: topic.trim(), contentType },
      });

      if (searchError) throw searchError;
      if (searchData?.error) throw new Error(searchData.error);

      const result = searchData.data as SearchResult;
      setSearchResult(result);
      setIsSearching(false);

      // Get facts array
      const facts = result.facts || result.quizzes?.map((q) => ({ fact: `${q.question}\n\nA) ${q.options[0]}\nB) ${q.options[1]}\nC) ${q.options[2]}\nD) ${q.options[3]}` })) || [];

      if (facts.length === 0) {
        throw new Error("কোনো তথ্য পাওয়া যায়নি");
      }

      // Step 2: Generate images for all facts
      await generateImagesForFacts(facts, topic.trim(), contentType, platform, aspectRatio, []);
    } catch (err: any) {
      console.error(err);
      const message = err?.message || "কিছু একটা সমস্যা হয়েছে";
      const isCreditsExhausted = message.includes("Credits exhausted") || message.includes("402");
      toast.error(
        isCreditsExhausted
          ? "AI credits শেষ — নতুন credit add করলে আবার generate করতে পারবেন"
          : message
      );
      setSearchResult(null);
      setPosts([]);
      setIsSearching(false);
      setIsGeneratingAll(false);
    }
  };

  const busy = isSearching || isGeneratingAll;

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
          ) : isGeneratingAll ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              ৫টি ইমেজ তৈরি হচ্ছে...
            </>
          ) : (
            <>
              ৫টি পোস্ট তৈরি করো
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>

        {/* Search progress */}
        {isSearching && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-sm text-primary font-medium">তথ্য সংগ্রহ করছে...</span>
          </div>
        )}

        {/* Facts list */}
        {searchResult?.facts && (
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              তথ্যসূত্র ({searchResult.facts.length}টি)
            </h3>
            {searchResult.facts.map((f, i) => (
              <div key={i} className="p-3 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground">{i + 1}. {f.fact}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
