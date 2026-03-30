import { Button } from "@/components/ui/button";
import {
  Copy,
  CopyCheck,
  Download,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  variations: string[];
  isGenerating: boolean;
  referenceDescription: string;
  hasGenerated: boolean;
}

export default function ResultsPanel({
  variations,
  isGenerating,
  referenceDescription,
  hasGenerated,
}: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const isImageUrl = (s: string) =>
    s.trim().startsWith("http://") || s.trim().startsWith("https://");

  const copyVariation = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success(`Variation ${idx + 1} copied!`);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = async () => {
    const all = variations
      .map((v, i) => `Variation ${i + 1}:\n${v}`)
      .join("\n\n");
    await navigator.clipboard.writeText(all);
    setCopiedAll(true);
    toast.success("All variations copied!");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const exportJson = () => {
    const data = JSON.stringify({ variations }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "broll-prompts.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as JSON!");
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-divider flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
            Generated AI Prompts
          </h2>
        </div>
        {variations.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              data-ocid="results.copy_all.button"
              variant="outline"
              size="sm"
              onClick={copyAll}
              className="h-7 px-2.5 text-xs border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground gap-1"
            >
              {copiedAll ? (
                <CopyCheck className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              Copy All
            </Button>
            <Button
              data-ocid="results.export_json.button"
              variant="outline"
              size="sm"
              onClick={exportJson}
              className="h-7 px-2.5 text-xs border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground gap-1"
            >
              <Download className="w-3 h-3" />
              JSON
            </Button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 px-6 py-5 overflow-y-auto scrollbar-thin">
        {/* Reference image preview */}
        {isImageUrl(referenceDescription) && hasGenerated && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-xl overflow-hidden border border-border"
          >
            <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border-b border-border">
              <ImageIcon className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Reference Image
              </span>
            </div>
            <img
              src={referenceDescription.trim()}
              alt="Reference"
              className="w-full max-h-48 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement?.remove();
              }}
            />
          </motion.div>
        )}

        {/* Loading / empty / results */}
        <AnimatePresence mode="wait">
          {isGenerating && (
            <motion.div
              key="loading"
              data-ocid="results.loading_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div
                className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
                style={{ animationDuration: "1s" }}
              />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Generating prompts...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  GPT-4o is crafting your variations
                </p>
              </div>
            </motion.div>
          )}

          {!isGenerating && !hasGenerated && (
            <motion.div
              key="empty"
              data-ocid="results.empty_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-3 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted/40 border border-border flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  No prompts yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fill in the form and hit Generate to create your B-Roll
                  prompts
                </p>
              </div>
            </motion.div>
          )}

          {!isGenerating && variations.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {variations.map((variation, idx) => (
                <motion.div
                  key={variation.slice(0, 40)}
                  data-ocid={`results.prompt.item.${idx + 1}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.3 }}
                  className="bg-surface border border-border rounded-2xl p-4 group hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-foreground leading-relaxed">
                        {variation}
                      </p>
                    </div>
                    <Button
                      data-ocid={`results.copy.button.${idx + 1}`}
                      variant="outline"
                      size="sm"
                      onClick={() => copyVariation(variation, idx)}
                      className="flex-shrink-0 h-7 px-2.5 text-xs border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/60 gap-1 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {copiedIndex === idx ? (
                        <CopyCheck className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      Copy
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
