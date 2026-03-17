import { useState } from "react";
import { InputPanel } from "@/components/InputPanel";
import { CanvasPanel } from "@/components/CanvasPanel";

export type ContentType = "gk" | "news" | "amazing" | "quiz";
export type Platform = "both" | "facebook" | "instagram";
export type AspectRatio = "1:1" | "9:16";

export interface SearchResult {
  facts?: { fact: string }[];
  quizzes?: { question: string; options: string[]; answer: string; explanation: string }[];
}

export interface GeneratedPost {
  id: string;
  caption: string;
  imageUrl: string | null;
  isGenerating: boolean;
}

const Index = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [lastTopic, setLastTopic] = useState("");
  const [lastContentType, setLastContentType] = useState<ContentType>("gk");
  const [lastPlatform, setLastPlatform] = useState<Platform>("both");
  const [logoUrl, setLogoUrl] = useState("");
  const [footerText, setFooterText] = useState("");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Panel */}
      <div className="w-[400px] min-w-[360px] border-r border-workbench-divider bg-workbench-panel flex flex-col overflow-y-auto">
        <InputPanel
          isSearching={isSearching}
          setIsSearching={setIsSearching}
          isGeneratingAll={isGeneratingAll}
          setIsGeneratingAll={setIsGeneratingAll}
          searchResult={searchResult}
          setSearchResult={setSearchResult}
          posts={posts}
          setPosts={setPosts}
          aspectRatio={aspectRatio}
          setLastTopic={setLastTopic}
          setLastContentType={setLastContentType}
          setLastPlatform={setLastPlatform}
          logoUrl={logoUrl}
          setLogoUrl={setLogoUrl}
          footerText={footerText}
          setFooterText={setFooterText}
        />
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-canvas flex flex-col overflow-y-auto">
        <CanvasPanel
          posts={posts}
          setPosts={setPosts}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          isSearching={isSearching}
          isGeneratingAll={isGeneratingAll}
          lastTopic={lastTopic}
          lastContentType={lastContentType}
          lastPlatform={lastPlatform}
          logoUrl={logoUrl}
          footerText={footerText}
        />
      </div>
    </div>
  );
};

export default Index;
