import { Button } from "@/components/ui/button";
import { Download, Copy, Square, Smartphone, Loader2, ImageIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AspectRatio, GeneratedPost, ContentType, Platform } from "@/pages/Index";

interface CanvasPanelProps {
  posts: GeneratedPost[];
  setPosts: (v: GeneratedPost[] | ((prev: GeneratedPost[]) => GeneratedPost[])) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (v: AspectRatio) => void;
  isSearching: boolean;
  isGeneratingAll: boolean;
  lastTopic: string;
  lastContentType: ContentType;
  lastPlatform: Platform;
}

export function CanvasPanel({
  posts,
  setPosts,
  aspectRatio,
  setAspectRatio,
  isSearching,
  isGeneratingAll,
  lastTopic,
  lastContentType,
  lastPlatform,
}: CanvasPanelProps) {
  const handleDownload = (post: GeneratedPost) => {
    if (!post.imageUrl) return;
    const link = document.createElement("a");
    link.href = post.imageUrl;
    link.download = `post-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ডাউনলোড শুরু হয়েছে!");
  };

  const handleCopyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption);
    toast.success("ক্যাপশন কপি হয়েছে!");
  };

  const handleDownloadAll = () => {
    const readyPosts = posts.filter((p) => p.imageUrl);
    readyPosts.forEach((post, i) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = post.imageUrl!;
        link.download = `post-${i + 1}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, i * 300);
    });
    toast.success(`${readyPosts.length}টি ইমেজ ডাউনলোড হচ্ছে!`);
  };

  const handleMore = async () => {
    if (!lastTopic) return;

    // Fetch 5 more facts
    toast.info("আরও ৫টি তথ্য খুঁজছে...");

    try {
      const { data: searchData, error } = await supabase.functions.invoke("search-news", {
        body: { topic: lastTopic, contentType: lastContentType },
      });

      if (error) throw error;
      if (searchData?.error) throw new Error(searchData.error);

      const facts = searchData.data?.facts || [];
      if (facts.length === 0) throw new Error("কোনো তথ্য পাওয়া যায়নি");

      const platStr = lastPlatform === "both" ? "Facebook and Instagram" : lastPlatform;
      const newPosts: GeneratedPost[] = facts.map((f: { fact: string }, i: number) => ({
        id: `${Date.now()}-more-${i}`,
        caption: f.fact,
        imageUrl: null,
        isGenerating: true,
      }));

      setPosts((prev: GeneratedPost[]) => [...prev, ...newPosts]);

      const results = await Promise.allSettled(
        newPosts.map(async (post: GeneratedPost, i: number) => {
          try {
            const { data, error: imgErr } = await supabase.functions.invoke("generate-post", {
              body: {
                topic: lastTopic,
                contentType: lastContentType,
                caption: facts[i].fact,
                platform: platStr,
                aspectRatio,
              },
            });
            if (imgErr) throw imgErr;
            if (data?.error) throw new Error(data.error);
            return { id: post.id, imageUrl: data?.imageUrl || null };
          } catch {
            return { id: post.id, imageUrl: null };
          }
        })
      );

      setPosts((prev: GeneratedPost[]) =>
        prev.map((p) => {
          const result = results.find(
            (r) => r.status === "fulfilled" && r.value.id === p.id
          );
          if (result?.status === "fulfilled") {
            return { ...p, imageUrl: result.value.imageUrl, isGenerating: false };
          }
          if (newPosts.some((np: GeneratedPost) => np.id === p.id)) {
            return { ...p, isGenerating: false };
          }
          return p;
        })
      );

      toast.success("আরও ৫টি পোস্ট তৈরি হয়েছে!");
    } catch (err: any) {
      toast.error(err.message || "সমস্যা হয়েছে");
    }
  };

  const hasAnyImages = posts.some((p) => p.imageUrl);
  const isAnyGenerating = posts.some((p) => p.isGenerating);

  return (
    <div className="flex flex-col items-center p-6 gap-6 h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 w-full max-w-4xl justify-between">
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
          <button
            onClick={() => setAspectRatio("1:1")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              aspectRatio === "1:1"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Square className="h-4 w-4" />
            ফিড ১:১
          </button>
          <button
            onClick={() => setAspectRatio("9:16")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              aspectRatio === "9:16"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            স্টোরি ৯:১৬
          </button>
        </div>

        {hasAnyImages && (
          <Button onClick={handleDownloadAll} variant="default" className="rounded-xl gap-2">
            <Download className="h-4 w-4" />
            সব ডাউনলোড
          </Button>
        )}
      </div>

      {/* Empty state */}
      {posts.length === 0 && !isSearching && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <ImageIcon className="h-16 w-16 opacity-30" />
          <p className="text-sm">এখানে আপনার পোস্টগুলো দেখা যাবে</p>
        </div>
      )}

      {/* Searching state */}
      {isSearching && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">তথ্য সংগ্রহ করছে...</p>
        </div>
      )}

      {/* Posts Grid */}
      {posts.length > 0 && (
        <div className="w-full max-w-4xl grid grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div key={post.id} className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm flex flex-col">
              {/* Image */}
              <div className={`relative ${aspectRatio === "1:1" ? "aspect-square" : "aspect-[9/16]"} bg-muted`}>
                {post.isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <p className="text-xs text-muted-foreground">তৈরি হচ্ছে...</p>
                  </div>
                ) : post.imageUrl ? (
                  <img src={post.imageUrl} alt="Generated post" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">ইমেজ তৈরি হয়নি</p>
                  </div>
                )}
              </div>

              {/* Caption & Actions */}
              <div className="p-3 space-y-2">
                <p className="text-xs text-foreground line-clamp-3 leading-relaxed">{post.caption}</p>
                <div className="flex gap-2">
                  {post.imageUrl && (
                    <Button size="sm" variant="outline" className="text-xs gap-1 rounded-lg flex-1" onClick={() => handleDownload(post)}>
                      <Download className="h-3 w-3" />
                      ডাউনলোড
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-xs gap-1 rounded-lg" onClick={() => handleCopyCaption(post.caption)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* More Button */}
      {posts.length > 0 && !isAnyGenerating && lastTopic && (
        <Button
          onClick={handleMore}
          variant="outline"
          className="rounded-xl gap-2 text-base font-semibold px-8 py-6"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          আরও ৫টি পোস্ট তৈরি করো
        </Button>
      )}
    </div>
  );
}
