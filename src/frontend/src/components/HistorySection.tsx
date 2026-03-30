import { ChevronDown, ChevronUp, Clock, History } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { PromptHistoryEntry } from "../backend.d";
import { usePromptHistory } from "../hooks/useQueries";

interface Props {
  showAll?: boolean;
}

export default function HistorySection({ showAll = false }: Props) {
  const { data: history, isLoading } = usePromptHistory(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const entries: PromptHistoryEntry[] = history ?? [];
  const displayed = showAll ? entries : entries.slice(0, 5);

  const formatDate = (ts: bigint) => {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseScene = (input: string): string => {
    const match = input.match(/Scene:\s*([^\n]+)/);
    return match?.[1]?.trim() ?? input.slice(0, 60);
  };

  const parseVariations = (output: string): string[] => {
    const lines = output.split("\n");
    const vars: string[] = [];
    let current = "";
    for (const line of lines) {
      const m = line.match(/^Variation\s*\d+:\s*(.*)/i);
      if (m) {
        if (current.trim()) vars.push(current.trim());
        current = m[1] ?? "";
      } else if (current) {
        current += ` ${line.trim()}`;
      }
    }
    if (current.trim()) vars.push(current.trim());
    return vars;
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
          History
        </h2>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[160px_1fr_80px] gap-4 px-5 py-3 border-b border-divider">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Date
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Scene
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-right">
            Prompts
          </span>
        </div>

        {isLoading && (
          <div
            data-ocid="history.loading_state"
            className="px-5 py-8 text-center text-sm text-muted-foreground"
          >
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Loading history...
            </span>
          </div>
        )}

        {!isLoading && displayed.length === 0 && (
          <div
            data-ocid="history.empty_state"
            className="px-5 py-10 text-center"
          >
            <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No history yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Your generated batches will appear here
            </p>
          </div>
        )}

        {!isLoading &&
          displayed.map((entry, idx) => {
            const vars = parseVariations(entry.promptOutput);
            const isExpanded = expandedIdx === idx;
            const itemNum = idx + 1;

            return (
              <div
                key={entry.timestamp.toString()}
                data-ocid={`history.item.${itemNum}`}
                className="border-b border-divider last:border-0"
              >
                <button
                  type="button"
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  className="w-full grid grid-cols-[160px_1fr_80px] gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors text-left items-center"
                >
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    {formatDate(entry.timestamp)}
                  </span>
                  <span className="text-sm text-foreground truncate">
                    {parseScene(entry.promptInput)}
                  </span>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-primary font-medium">
                      {vars.length}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 space-y-2">
                        {vars.map((v, vi) => (
                          <div
                            key={`${entry.timestamp.toString()}-v${vi}`}
                            className="flex items-start gap-2 bg-surface border border-border rounded-xl p-3"
                          >
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[9px] font-bold text-primary">
                              {vi + 1}
                            </span>
                            <p className="text-xs text-foreground leading-relaxed">
                              {v}
                            </p>
                          </div>
                        ))}
                        {vars.length === 0 && (
                          <p className="text-xs text-muted-foreground italic px-1">
                            {entry.promptOutput.slice(0, 300)}...
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
      </div>
    </div>
  );
}
