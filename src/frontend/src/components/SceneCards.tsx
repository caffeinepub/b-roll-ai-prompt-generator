import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export interface Scene {
  scene_number: number;
  label: string;
  description: string;
  prompt: string;
}

interface SceneCardsProps {
  scenes: Scene[];
  onRegenerate: (sceneNumber: number) => void;
  loadingScene?: number | null;
}

const LABEL_COLORS: Record<string, string> = {
  Hook: "bg-primary/20 text-primary border-primary/30",
  Setup: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  Build: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  Action: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Emotion: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  Transition: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  Ending: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
};

function getLabelClass(label: string): string {
  return (
    LABEL_COLORS[label] ?? "bg-muted/60 text-muted-foreground border-border/40"
  );
}

function SceneCard({
  scene,
  index,
  isLoading,
  onRegenerate,
}: {
  scene: Scene;
  index: number;
  isLoading: boolean;
  onRegenerate: (sceneNumber: number) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scene.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently fail
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="group"
      data-ocid={`scene.item.${index + 1}`}
    >
      <div
        className="
          h-full flex flex-col gap-4 p-6
          bg-card border border-border
          rounded-2xl
          shadow-card
          transition-all duration-200
          group-hover:border-primary/40
          group-hover:shadow-purple
        "
      >
        {/* Top row: scene number + label badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground tracking-wide">
            Scene {scene.scene_number}
          </span>
          <Badge
            variant="outline"
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getLabelClass(scene.label)}`}
          >
            {scene.label}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
          {scene.description}
        </p>

        {/* Prompt preview */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 flex-1">
          {scene.prompt}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            data-ocid={`scene.regenerate.button.${index + 1}`}
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => onRegenerate(scene.scene_number)}
            className="flex-1 border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 hover:border-primary/40 transition-all text-xs h-8"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Regenerating...
              </>
            ) : (
              "🔁 Regenerate"
            )}
          </Button>

          <Button
            data-ocid={`scene.copy.button.${index + 1}`}
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1 border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 hover:border-emerald-500/40 transition-all text-xs h-8"
          >
            {copied ? "✅ Copied!" : "📋 Copy"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function SceneCards({
  scenes,
  onRegenerate,
  loadingScene = null,
}: SceneCardsProps) {
  if (scenes.length === 0) {
    return (
      <div
        data-ocid="scene.empty_state"
        className="text-center py-16 text-muted-foreground text-sm"
      >
        No scenes to display yet.
      </div>
    );
  }

  return (
    <div
      data-ocid="scene.list"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {scenes.map((scene, index) => (
        <SceneCard
          key={scene.scene_number}
          scene={scene}
          index={index}
          isLoading={loadingScene === scene.scene_number}
          onRegenerate={onRegenerate}
        />
      ))}
    </div>
  );
}
