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

interface StructuredPrompt {
  title: string;
  description: string;
  prompt: string;
}

function parseStructuredPrompt(text: string): StructuredPrompt | null {
  const titleMatch = text.match(/\*\*Title:\*\*\s*(.+?)(?=\n|$)/i);
  const descMatch = text.match(
    /\*\*Description:\*\*\s*([\s\S]+?)(?=\*\*Prompt:\*\*)/i,
  );
  const promptMatch = text.match(/\*\*Prompt:\*\*\s*([\s\S]+?)(?=---|$)/i);
  if (!titleMatch || !descMatch || !promptMatch) return null;
  return {
    title: titleMatch[1].trim(),
    description: descMatch[1].trim(),
    prompt: promptMatch[1].trim(),
  };
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
    // For structured prompts, copy only the Prompt field
    const parsed = parseStructuredPrompt(text);
    const toCopy = parsed ? parsed.prompt : text;
    await navigator.clipboard.writeText(toCopy);
    setCopiedIndex(idx);
    toast.success(parsed ? "Prompt copied!" : `Variation ${idx + 1} copied!`);
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
                  Fill in the form and hit Generate to create your prompts
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
              {variations.map((variation, idx) => {
                const structured = parseStructuredPrompt(variation);
                return structured ? (
                  <StructuredVariationCard
                    key={variation.slice(0, 40)}
                    structured={structured}
                    idx={idx}
                    rawText={variation}
                    copiedIndex={copiedIndex}
                    onCopy={copyVariation}
                  />
                ) : (
                  <PlainVariationCard
                    key={variation.slice(0, 40)}
                    variation={variation}
                    idx={idx}
                    copiedIndex={copiedIndex}
                    onCopy={copyVariation}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StructuredVariationCard({
  structured,
  idx,
  rawText,
  copiedIndex,
  onCopy,
}: {
  structured: StructuredPrompt;
  idx: number;
  rawText: string;
  copiedIndex: number | null;
  onCopy: (text: string, idx: number) => void;
}) {
  const [copiedFull, setCopiedFull] = useState(false);

  const copyFull = async () => {
    await navigator.clipboard.writeText(rawText);
    setCopiedFull(true);
    toast.success("Full output copied!");
    setTimeout(() => setCopiedFull(false), 2000);
  };

  return (
    <motion.div
      data-ocid={`results.prompt.item.${idx + 1}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, duration: 0.3 }}
      className="bg-surface border border-border rounded-2xl p-4 group hover:border-primary/40 transition-colors"
    >
      {/* Index badge + title row */}
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
          {idx + 1}
        </span>
        <p className="text-sm font-semibold text-foreground leading-tight pt-0.5">
          {structured.title}
        </p>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-3 pl-9">
        {structured.description}
      </p>

      {/* Prompt box */}
      <div className="pl-9">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-primary/70 mb-1.5">
          Prompt
        </p>
        <div className="bg-muted/20 border border-border/60 rounded-lg p-3">
          <p className="text-sm text-foreground leading-relaxed">
            {structured.prompt}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pl-9 opacity-0 group-hover:opacity-100 transition-all">
        <Button
          data-ocid={`results.copy.button.${idx + 1}`}
          variant="outline"
          size="sm"
          onClick={() => onCopy(rawText, idx)}
          className="h-7 px-2.5 text-xs border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/60 gap-1"
        >
          {copiedIndex === idx ? (
            <CopyCheck className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          Copy Prompt
        </Button>
        <Button
          data-ocid={`results.copy_full.button.${idx + 1}`}
          variant="outline"
          size="sm"
          onClick={copyFull}
          className="h-7 px-2.5 text-xs border-border/60 text-muted-foreground hover:text-foreground hover:border-border gap-1"
        >
          {copiedFull ? (
            <CopyCheck className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          Copy All
        </Button>
      </div>
    </motion.div>
  );
}

function PlainVariationCard({
  variation,
  idx,
  copiedIndex,
  onCopy,
}: {
  variation: string;
  idx: number;
  copiedIndex: number | null;
  onCopy: (text: string, idx: number) => void;
}) {
  return (
    <motion.div
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
          <p className="text-sm text-foreground leading-relaxed">{variation}</p>
        </div>
        <Button
          data-ocid={`results.copy.button.${idx + 1}`}
          variant="outline"
          size="sm"
          onClick={() => onCopy(variation, idx)}
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
  );
}
