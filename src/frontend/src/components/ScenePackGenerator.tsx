import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  Clapperboard,
  Copy,
  Loader2,
  Lock,
  RefreshCw,
  Sparkles,
  Terminal,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

type SceneResult = {
  number: number;
  label: string;
  description: string;
  prompt: string;
};

type Props = {
  sessionToken: string | null;
  userPlan: string;
  debugMode?: boolean;
  onUsageUpdate?: () => void;
};

const SCENE_LABELS: Record<number, string[]> = {
  3: ["Hook", "Action", "Ending"],
  5: ["Hook", "Setup", "Action", "Emotion", "Ending"],
  7: ["Hook", "Setup", "Build", "Action", "Emotion", "Transition", "Ending"],
};

// ── Preset System ────────────────────────────────────────────────────────────

type PresetKey =
  | "cafe_work"
  | "bedroom"
  | "city_street"
  | "airport"
  | "nightlife"
  | "car_travel"
  | "bathroom"
  | "beach"
  | "fitness"
  | "viral";

type Preset = {
  emoji: string;
  label: string;
  key: PresetKey;
  desc: string;
};

const PRESETS: Preset[] = [
  { emoji: "☕", label: "Café / Work", key: "cafe_work", desc: "Hustle Vibes" },
  {
    emoji: "🛏️",
    label: "Bedroom Moments",
    key: "bedroom",
    desc: "Personal / Raw",
  },
  {
    emoji: "🌆",
    label: "City / Street",
    key: "city_street",
    desc: "Vlog Style",
  },
  { emoji: "✈️", label: "Airport / Travel", key: "airport", desc: "Journey" },
  {
    emoji: "🌙",
    label: "Nightlife",
    key: "nightlife",
    desc: "Energy / Aesthetic",
  },
  {
    emoji: "🚗",
    label: "Car / Travel",
    key: "car_travel",
    desc: "POV / Storytelling",
  },
  {
    emoji: "🪞",
    label: "Bathroom / Mirror",
    key: "bathroom",
    desc: "Self POV",
  },
  { emoji: "🏝️", label: "Beach / Vacation", key: "beach", desc: "Lifestyle" },
  {
    emoji: "🏋️",
    label: "Fitness / Wellness",
    key: "fitness",
    desc: "Motivation",
  },
  {
    emoji: "🎥",
    label: "Relatable / Viral",
    key: "viral",
    desc: "Viral Moments",
  },
];

const PRESET_GUIDELINES: Record<PresetKey, string> = {
  cafe_work:
    "Environment: coffee shop, laptop, work desk, cozy indoor. Camera: static or slow push-in, warm depth of field. Lighting: natural window light, warm golden tones. Mood: focused, calm, productive. Character: typing, sipping coffee, thinking, reading.",
  bedroom:
    "Environment: bedroom, bed, window light, morning or night atmosphere. Camera: close-up, gentle handheld. Lighting: soft natural or lamplight, low contrast. Mood: emotional, quiet, personal. Character: waking up, journaling, staring at ceiling, introspective.",
  city_street:
    "Environment: streets, sidewalks, urban buildings, city crowd. Camera: handheld vlog-style, wide walking shots. Lighting: daylight, overcast or golden hour. Mood: casual, energetic, real. Character: walking, observing, talking to camera.",
  airport:
    "Environment: airport terminal, departure gates, escalators, windows. Camera: cinematic wide, slow tracking shots. Lighting: cool fluorescent mixed with natural. Mood: reflective, anticipatory, transitional. Character: walking with luggage, waiting, looking at board.",
  nightlife:
    "Environment: dark venues, neon-lit streets, clubs, city nights. Camera: dynamic, handheld, motion blur. Lighting: neon, strobe, deep shadows. Mood: energetic, aesthetic, electric. Character: moving through crowds, dancing, observing lights.",
  car_travel:
    "Environment: inside car, dashboard view, passenger seat, windows showing passing scenery. Camera: POV, handheld, dashboard mount. Lighting: changing natural light, sunset glow. Mood: introspective, vlog, storytelling. Character: driving, talking to camera, thinking.",
  bathroom:
    "Environment: bathroom, mirror reflection, sink, tiles. Camera: close-up mirror POV, tight framing. Lighting: bathroom light, dramatic shadows. Mood: personal, dramatic, raw. Character: talking to mirror, self-reflection, morning routine.",
  beach:
    "Environment: beach, ocean, sand, sun. Camera: slow motion, wide landscape, golden hour. Lighting: warm sunlight, lens flare. Mood: relaxed, aspirational, lifestyle. Character: walking on beach, swimming, sitting by ocean.",
  fitness:
    "Environment: gym, outdoor workout, training space. Camera: dynamic, close-up effort shots, motivational angles. Lighting: dramatic, high contrast. Mood: intense, disciplined, focused. Character: lifting, running, sweating, pushing limits.",
  viral:
    "Environment: everyday relatable locations — kitchen, bedroom, office, street. Camera: natural, casual, raw. Lighting: available light, imperfect. Mood: authentic, humorous, raw. Character: reacting, doing mundane tasks, being real.",
};

// Presets accessible per plan
const FREE_PRESETS: PresetKey[] = ["cafe_work", "city_street", "viral"];
const STARTER_PRESETS: PresetKey[] = [
  "cafe_work",
  "bedroom",
  "city_street",
  "airport",
  "nightlife",
  "car_travel",
];

function isPresetUnlocked(key: PresetKey, plan: string): boolean {
  if (plan === "pro" || plan === "elite") return true;
  if (plan === "starter") return STARTER_PRESETS.includes(key);
  // free
  return FREE_PRESETS.includes(key);
}

// ─────────────────────────────────────────────────────────────────────────────

function getMaxScenes(plan: string): number {
  if (plan === "starter") return 3;
  if (plan === "pro") return 5;
  if (plan === "elite") return 7;
  return 0; // free = locked
}

function parseScenes(raw: string): SceneResult[] {
  const scenes: SceneResult[] = [];
  let content = raw;
  try {
    const json = JSON.parse(raw);
    content = json?.choices?.[0]?.message?.content ?? raw;
  } catch {
    // raw might already be plain text
  }

  const blocks = content
    .split(/---SCENE \d+---/)
    .filter((b: string) => b.trim());
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const labelMatch = block.match(/LABEL:\s*(.+)/);
    const descMatch = block.match(/DESCRIPTION:\s*(.+)/);
    const promptMatch = block.match(/PROMPT:\s*([\s\S]+?)(?:---END SCENE|$)/);

    if (labelMatch && descMatch && promptMatch) {
      scenes.push({
        number: i + 1,
        label: labelMatch[1].trim(),
        description: descMatch[1].trim(),
        prompt: promptMatch[1].replace(/---END SCENE \d+---/g, "").trim(),
      });
    }
  }
  return scenes;
}

function CopyButton({
  text,
  label = "Copy",
}: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleCopy}
      className="gap-1.5 border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 text-xs h-7"
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
      {copied ? "Copied!" : label}
    </Button>
  );
}

export default function ScenePackGenerator({
  sessionToken,
  userPlan,
  debugMode = false,
  onUsageUpdate,
}: Props) {
  const { actor } = useActor();
  const maxScenes = getMaxScenes(userPlan);
  const isLocked = maxScenes === 0;

  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("");
  const [sceneCount, setSceneCount] = useState<3 | 5 | 7>(3);
  const [scenes, setScenes] = useState<SceneResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [corePrompt, setCorePrompt] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(null);

  const effectiveCount = Math.min(sceneCount, maxScenes) as 3 | 5 | 7;
  const labels = SCENE_LABELS[effectiveCount] ?? SCENE_LABELS[3];

  const buildPrompt = () => {
    const styleStr = style.trim() || "cinematic, modern";
    const presetBlock = selectedPreset
      ? `\nPRESET CONTEXT: ${PRESET_GUIDELINES[selectedPreset]}\n`
      : "";
    const hookNote =
      "\nIMPORTANT FOR SCENE 1 (Hook): Make it immediately attention-grabbing — open with a strong visual action or emotional moment. Avoid generic openers. Hook the viewer in the first frame.\n";
    const eliteNote =
      userPlan === "elite"
        ? "\nQuality requirement: Ultra-detailed, cinematic masterclass quality. Every scene must feel like a Hollywood production.\n"
        : "";

    return `You are a professional video content creator and AI prompt engineer.
Generate a scene pack of ${effectiveCount} connected scenes for: "${topic}".
Style: ${styleStr}
${presetBlock}
Scene labels in order: ${labels.join(", ")}
${hookNote}
For EACH scene, output EXACTLY in this format (no extra text before or after):
---SCENE {n}---
LABEL: {label}
DESCRIPTION: {one sentence description}
PROMPT: {detailed AI image/video prompt including: same main character/subject throughout, specific action or movement, camera angle and movement, lighting description, mood/emotion, environment details, style cues}
---END SCENE {n}---

Rules:
- All scenes share the same main character/subject
- Visual style must be consistent across all scenes
- Scenes tell a progressive, connected story
- Each prompt is detailed and cinematic (50-100 words)
- Do NOT add any other text outside the scene blocks
${eliteNote}
Now generate the ${effectiveCount} scenes:`;
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic or idea");
      return;
    }
    if (!sessionToken || !actor) {
      toast.error("Not authenticated");
      return;
    }
    setIsGenerating(true);
    try {
      const prompt = buildPrompt();
      setCorePrompt(prompt);
      const result = await actor.makePromptRequestWithSession(
        sessionToken,
        prompt,
      );
      if ("err" in result) {
        toast.error(result.err);
        return;
      }
      const parsed = parseScenes(result.ok);
      if (parsed.length === 0) {
        toast.error("Could not parse scene output. Please try again.");
        return;
      }
      setScenes(parsed);
      setHasGenerated(true);
      onUsageUpdate?.();
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAll = () => {
    const text = scenes
      .map(
        (s) =>
          `Scene ${s.number}: ${s.label}\n${s.description}\n\nPrompt:\n${s.prompt}`,
      )
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    toast.success("All scenes copied!");
  };

  const handlePresetClick = (preset: Preset) => {
    if (!isPresetUnlocked(preset.key, userPlan)) {
      toast.error("Upgrade your plan to unlock this preset");
      return;
    }
    setSelectedPreset((prev) => (prev === preset.key ? null : preset.key));
  };

  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-6"
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7 text-amber-400" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          Upgrade to unlock Scene Packs
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
          Scene Pack Generator is available on Starter, Pro, and Elite plans.
          Generate connected story-driven scene sequences automatically.
        </p>
        <div className="flex gap-3 flex-wrap justify-center mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-full px-3 py-1.5">
            <span className="text-blue-400 font-semibold">Starter</span>3 scenes
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-full px-3 py-1.5">
            <span className="text-emerald-400 font-semibold">Pro</span>
            up to 5 scenes
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-full px-3 py-1.5">
            <span className="text-amber-400 font-semibold">Elite</span>
            up to 7 scenes
          </div>
        </div>
        <Badge
          data-ocid="scene-pack.locked_state"
          className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs"
        >
          <Lock className="w-3 h-3 mr-1" /> Free Plan — Upgrade Required
        </Badge>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Preset Selector ──────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Scene Preset
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose an environment to shape the mood and style
              </p>
            </div>
            {selectedPreset ? (
              <button
                type="button"
                onClick={() => setSelectedPreset(null)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Clear
              </button>
            ) : (
              <span className="text-xs text-muted-foreground/50 italic">
                None selected
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {PRESETS.map((preset) => {
              const unlocked = isPresetUnlocked(preset.key, userPlan);
              const isSelected = selectedPreset === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  data-ocid={`scene-pack.preset.${preset.key}.toggle`}
                  onClick={() => handlePresetClick(preset)}
                  className={[
                    "relative flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-all duration-200 cursor-pointer select-none",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]"
                      : unlocked
                        ? "border-border bg-muted/10 hover:border-primary/40 hover:bg-muted/20"
                        : "border-border/40 bg-muted/5 opacity-50 cursor-not-allowed",
                  ].join(" ")}
                >
                  {/* Emoji */}
                  <span className="text-xl leading-none">{preset.emoji}</span>
                  {/* Label */}
                  <span
                    className={`text-xs font-semibold leading-tight ${
                      isSelected ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {preset.label}
                  </span>
                  {/* Desc */}
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {preset.desc}
                  </span>
                  {/* Lock overlay */}
                  {!unlocked && (
                    <span className="absolute top-1.5 right-1.5 text-[10px]">
                      🔒
                    </span>
                  )}
                  {/* Selected indicator */}
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-2 h-2 text-primary-foreground" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Access tier hint */}
          {userPlan !== "pro" && userPlan !== "elite" && (
            <p className="text-[10px] text-muted-foreground/60 mt-3 text-center">
              {userPlan === "starter"
                ? "Upgrade to Pro to unlock all 10 presets"
                : "Free plan: 3 presets available · Upgrade for more"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Input Form ───────────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Clapperboard className="w-3.5 h-3.5 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold text-foreground">
              Scene Pack Setup
            </CardTitle>
            {userPlan === "starter" && (
              <Badge className="ml-auto text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                Starter — 3 scenes only
              </Badge>
            )}
            {userPlan === "pro" && (
              <Badge className="ml-auto text-xs bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
                Pro — up to 5 scenes
              </Badge>
            )}
            {userPlan === "elite" && (
              <Badge className="ml-auto text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">
                Elite — up to 7 scenes
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected preset pill */}
          <AnimatePresence>
            {selectedPreset && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 rounded-lg bg-primary/8 border border-primary/20 px-3 py-2">
                  <span className="text-base">
                    {PRESETS.find((p) => p.key === selectedPreset)?.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary">
                      {PRESETS.find((p) => p.key === selectedPreset)?.label}{" "}
                      preset active
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Environment, mood &amp; style will follow this preset
                    </p>
                  </div>
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Topic / Idea <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="scene-pack.topic.input"
              placeholder="e.g. A barista preparing morning coffee in a cozy café"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Style{" "}
              <span className="text-muted-foreground/50 normal-case font-normal">
                (optional)
              </span>
            </Label>
            <Input
              data-ocid="scene-pack.style.input"
              placeholder="e.g. cinematic, warm tones, golden hour"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Number of Scenes
            </Label>
            <Select
              value={String(sceneCount)}
              onValueChange={(v) => setSceneCount(Number(v) as 3 | 5 | 7)}
              disabled={userPlan === "starter"}
            >
              <SelectTrigger
                data-ocid="scene-pack.scene-count.select"
                className="bg-input border-border text-foreground w-48"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="3" className="text-foreground">
                  3 Scenes — Hook / Action / Ending
                </SelectItem>
                {maxScenes >= 5 && (
                  <SelectItem value="5" className="text-foreground">
                    5 Scenes — Hook → Ending
                  </SelectItem>
                )}
                {maxScenes >= 7 && (
                  <SelectItem value="7" className="text-foreground">
                    7 Scenes — Full Story Arc
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {userPlan === "starter" && (
              <p className="text-xs text-muted-foreground/70">
                Upgrade to Pro for 5-scene packs, Elite for 7-scene packs.
              </p>
            )}
          </div>

          {/* Scene preview labels */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {labels.map((label, i) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 font-medium"
              >
                <span className="opacity-60">{i + 1}.</span> {label}
              </span>
            ))}
          </div>

          <Button
            data-ocid="scene-pack.generate.primary_button"
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-purple-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating {effectiveCount} Scenes...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Scene Pack
                {selectedPreset && (
                  <span className="ml-1 opacity-75">
                    — {PRESETS.find((p) => p.key === selectedPreset)?.emoji}
                  </span>
                )}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Admin Debug Panel ──────────────────────────────────────────── */}
      {debugMode && corePrompt && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-card border-amber-500/30 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-amber-500/60 via-amber-400/30 to-transparent" />
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <CardTitle className="text-sm font-semibold text-amber-400">
                    🧪 Debug: Request JSON Sent to API
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-amber-500/40 text-amber-400 bg-amber-500/10 px-1.5 py-0"
                  >
                    Admin Only
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const debugJson = JSON.stringify(
                      {
                        model: "gpt-4o",
                        messages: [{ role: "user", content: corePrompt }],
                      },
                      null,
                      2,
                    );
                    navigator.clipboard.writeText(debugJson);
                    toast.success("JSON copied");
                  }}
                  className="gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs h-7"
                >
                  <Copy className="w-3 h-3" />
                  Copy JSON
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground leading-relaxed bg-muted/20 border border-border/60 rounded-md p-3 overflow-x-auto">
                {JSON.stringify(
                  {
                    model: "gpt-4o",
                    messages: [{ role: "user", content: corePrompt }],
                  },
                  null,
                  2,
                )}
              </pre>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {hasGenerated && scenes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            {/* Action bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {scenes.length} Scenes Generated
                </h3>
                {selectedPreset && (
                  <span className="text-xs text-muted-foreground bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                    {PRESETS.find((p) => p.key === selectedPreset)?.emoji}{" "}
                    {PRESETS.find((p) => p.key === selectedPreset)?.label}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  data-ocid="scene-pack.copy-all.button"
                  size="sm"
                  variant="outline"
                  onClick={copyAll}
                  className="gap-1.5 border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 text-xs h-7"
                >
                  <Copy className="w-3 h-3" />
                  Copy All
                </Button>
                <Button
                  data-ocid="scene-pack.regenerate.button"
                  size="sm"
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="gap-1.5 border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 text-xs h-7"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`}
                  />
                  Regenerate
                </Button>
              </div>
            </div>

            {/* Scene cards */}
            {scenes.map((scene, idx) => (
              <motion.div
                key={scene.number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.3 }}
                data-ocid={`scene-pack.item.${scene.number}`}
              >
                <Card className="bg-card border-border overflow-hidden">
                  <div className="h-0.5 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {scene.number}
                        </span>
                        <div>
                          <CardTitle className="text-sm font-bold text-foreground">
                            Scene {scene.number}:{" "}
                            <span className="text-primary">{scene.label}</span>
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {scene.description}
                          </p>
                        </div>
                      </div>
                      <CopyButton text={scene.prompt} label="Copy Scene" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4">
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                        Prompt
                      </p>
                      <div className="bg-muted/20 border border-border/60 rounded-md p-3 font-mono text-xs text-foreground/90 leading-relaxed">
                        {scene.prompt}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isGenerating && scenes.length === 0 && (
        <div
          data-ocid="scene-pack.loading_state"
          className="flex flex-col items-center justify-center py-16 gap-4"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Clapperboard className="w-6 h-6 text-primary" />
            </div>
            <div className="absolute -inset-1 rounded-xl border border-primary/30 animate-ping opacity-30" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Crafting your scene pack...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Building {effectiveCount} connected cinematic scenes
              {selectedPreset && (
                <>
                  {" "}
                  with {PRESETS.find((p) => p.key === selectedPreset)?.label}{" "}
                  vibes
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
