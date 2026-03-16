import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, Copy, Square, Smartphone, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { AspectRatio } from "@/pages/Index";

interface CanvasPanelProps {
  imageUrl: string | null;
  caption: string;
  setCaption: (v: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (v: AspectRatio) => void;
  isGenerating: boolean;
}

export function CanvasPanel({
  imageUrl,
  caption,
  setCaption,
  aspectRatio,
  setAspectRatio,
  isGenerating,
}: CanvasPanelProps) {
  const handleDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `post-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ডাউনলোড শুরু হয়েছে!");
  };

  const handleCopyCaption = () => {
    if (!caption) return;
    navigator.clipboard.writeText(caption);
    toast.success("ক্যাপশন কপি হয়েছে!");
  };

  return (
    <div className="flex flex-col items-center justify-start p-8 gap-6 h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 w-full max-w-xl justify-between">
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

        {imageUrl && (
          <Button
            onClick={handleDownload}
            variant="default"
            className="rounded-xl gap-2"
          >
            <Download className="h-4 w-4" />
            ডাউনলোড
          </Button>
        )}
      </div>

      {/* Canvas */}
      <div
        className={`relative rounded-2xl overflow-hidden bg-card border border-border shadow-lg transition-all ${
          aspectRatio === "1:1" ? "w-[400px] h-[400px]" : "w-[280px] h-[497px]"
        }`}
      >
        {isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/50">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">ইমেজ তৈরি হচ্ছে...</p>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="Generated post"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <ImageIcon className="h-16 w-16 opacity-30" />
            <p className="text-sm">এখানে আপনার পোস্ট দেখা যাবে</p>
          </div>
        )}
      </div>

      {/* Caption */}
      {(caption || imageUrl) && (
        <div className="w-full max-w-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">ক্যাপশন</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCaption}
              className="gap-1.5 text-xs"
              disabled={!caption}
            >
              <Copy className="h-3.5 w-3.5" />
              কপি
            </Button>
          </div>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            className="bg-card border-border rounded-xl text-sm resize-none"
            placeholder="ক্যাপশন এখানে দেখা যাবে..."
          />
        </div>
      )}
    </div>
  );
}
