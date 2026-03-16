import { useState } from "react";
import { InputPanel } from "@/components/InputPanel";
import { CanvasPanel } from "@/components/CanvasPanel";

export type ContentType = "gk" | "news" | "amazing" | "quiz";
export type Platform = "both" | "facebook" | "instagram";
export type AspectRatio = "1:1" | "9:16";

export interface SearchResult {
  headlines?: { title: string; summary: string; source: string }[];
  facts?: { fact: string }[];
  question?: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  synthesized: string;
}

const Index = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Panel */}
      <div className="w-[400px] min-w-[360px] border-r border-workbench-divider bg-workbench-panel flex flex-col overflow-y-auto">
        <InputPanel
          isSearching={isSearching}
          setIsSearching={setIsSearching}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          searchResult={searchResult}
          setSearchResult={setSearchResult}
          caption={caption}
          setCaption={setCaption}
          setImageUrl={setImageUrl}
          aspectRatio={aspectRatio}
        />
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-canvas flex flex-col overflow-y-auto">
        <CanvasPanel
          imageUrl={imageUrl}
          caption={caption}
          setCaption={setCaption}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
};

export default Index;
