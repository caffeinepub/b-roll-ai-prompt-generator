import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Layers, Lock, User, Video, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { FormData, PromptType } from "../App";
import { useAuth } from "../hooks/useAuth";
import { useMakePromptRequestWithSession } from "../hooks/useQueries";
import { PLAN_LIMITS, type PlanKey } from "./PricingPage";

const SCENE_DATA: Record<string, string[]> = {
  "Café / Work": [
    "Late morning café laptop work",
    "Coffee shop window seat focus",
    "Co-working space hustle",
    "Reading at a corner table",
  ],
  "Car / Travel": [
    "Passenger seat selfie during a drive",
    "Dashboard view on a road trip",
    "Waiting at traffic light",
    "Sunroof moment on the highway",
  ],
  "Bedroom Moments": [
    "Just woke up messy hair",
    "Morning skincare routine in bed",
    "Late night phone scrolling",
    "Cozy reading under blanket",
  ],
  "Bathroom / Mirror": [
    "Mirror selfie getting ready",
    "Post-shower glow moment",
    "Skincare routine at sink",
    "Brushing teeth candid",
  ],
  "City / Street": [
    "Walking through busy street",
    "Cafe terrace people watching",
    "Golden hour on a city rooftop",
    "Rainy day city stroll",
  ],
  "Beach / Vacation": [
    "Sunset beach walk",
    "Poolside lounging",
    "Ocean wave feet shot",
    "Vacation hotel balcony view",
  ],
};

const CAMERA_ANGLES = [
  "45° side angle",
  "Medium shot",
  "Overhead / bird's eye",
  "Close-up",
  "Wide establishing shot",
  "Low angle",
  "POV shot",
];

const LIGHTING_OPTIONS = [
  "Soft morning sunlight",
  "Golden hour sunset",
  "Studio softbox light",
  "Natural window light",
  "Overcast diffused light",
  "Neon ambient glow",
  "Candlelight warm tones",
];

const ATMOSPHERE_OPTIONS = [
  "Warm",
  "Cozy",
  "Relaxed",
  "Cinematic",
  "Moody",
  "Dramatic",
  "Dreamy",
  "Editorial",
];

const STYLE_PILLS = [
  "Cinematic",
  "Instagram aesthetic",
  "Vintage",
  "Pastel",
  "Moody",
  "Luxury",
  "Shallow depth of field",
];

const PRESETS: Record<string, { styles: string[]; lighting: string }> = {
  Cinematic: {
    styles: ["Cinematic", "Shallow depth of field"],
    lighting: "Studio softbox light",
  },
  Instagram: {
    styles: ["Instagram aesthetic", "Pastel"],
    lighting: "Natural window light",
  },
  "Vintage Dreamy": {
    styles: ["Vintage", "Moody"],
    lighting: "Golden hour sunset",
  },
  "Luxury Editorial": {
    styles: ["Luxury", "Cinematic"],
    lighting: "Studio softbox light",
  },
};

const PLAN_ORDER = ["free", "starter", "pro", "elite"];

function canUsePlan(userPlan: string, requiredPlan: string): boolean {
  return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(requiredPlan);
}

const PROMPT_TYPE_CONFIG: {
  id: PromptType;
  label: string;
  description: string;
  minPlan: string;
  badge: string | null;
  icon: React.ReactNode;
}[] = [
  {
    id: "broll",
    label: "B-Roll Prompt",
    description: "Cinematic background footage scenes",
    minPlan: "free",
    badge: null,
    icon: <Video className="w-4 h-4" />,
  },
  {
    id: "animation",
    label: "Animation Prompt",
    description: "Motion & action for image-to-video",
    minPlan: "starter",
    badge: "Starter+",
    icon: <Zap className="w-4 h-4" />,
  },
  {
    id: "avatar",
    label: "Talking Avatar",
    description: "Avatar video with script & expressions",
    minPlan: "pro",
    badge: "Pro Feature",
    icon: <User className="w-4 h-4" />,
  },
];

interface Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onGenerate: (variations: string[]) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  sessionToken: string | null;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="h-px bg-divider my-5" />;
}

export default function GenerateForm({
  formData,
  setFormData,
  onGenerate,
  isGenerating,
  setIsGenerating,
  sessionToken,
}: Props) {
  const { user, refreshUser } = useAuth();
  const { mutateAsync: makeRequest } = useMakePromptRequestWithSession();
  const formRef = useRef<HTMLDivElement>(null);

  // Derive plan-based batch limits
  const plan = (user?.plan ?? "free") as PlanKey;
  const batchEnabled = PLAN_LIMITS[plan]?.batchEnabled ?? false;
  const maxVariations = PLAN_LIMITS[plan]?.maxBatch ?? 1;

  // Clamp numVariations when plan changes
  useEffect(() => {
    if (formData.numVariations > maxVariations) {
      setFormData((prev) => ({ ...prev, numVariations: maxVariations }));
    }
  }, [maxVariations, formData.numVariations, setFormData]);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleStyle = (style: string) => {
    setFormData((prev) => ({
      ...prev,
      styleFilters: prev.styleFilters.includes(style)
        ? prev.styleFilters.filter((s) => s !== style)
        : [...prev.styleFilters, style],
    }));
  };

  const applyPreset = (presetName: string) => {
    const preset = PRESETS[presetName];
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        styleFilters: preset.styles,
        lighting: preset.lighting,
      }));
    }
  };

  const handleSelectPromptType = (typeId: PromptType) => {
    const config = PROMPT_TYPE_CONFIG.find((c) => c.id === typeId);
    if (!config) return;
    const userPlan = user?.plan ?? "free";
    if (!canUsePlan(userPlan, config.minPlan)) {
      toast.error("Upgrade to unlock this feature");
      return;
    }
    update("promptType", typeId);
  };

  const handleGenerate = async () => {
    if (!sessionToken) {
      toast.error("Please sign in to generate prompts.");
      return;
    }

    setIsGenerating(true);
    try {
      const {
        numVariations,
        scene,
        sceneCategory,
        referenceDescription,
        gender,
        outfit,
        hair,
        subjectMood,
        cameraAngle,
        lighting,
        atmosphere,
        styleFilters,
        faceless,
        promptType,
      } = formData;

      const facelessInstruction = faceless
        ? "Keep the subject faceless, do not show the face"
        : "Subject may show face";

      let promptContent: string;

      switch (promptType) {
        case "animation":
          promptContent = `Generate ${numVariations} animation prompt(s) for an image-to-video AI tool.

Subject: ${gender}, ${outfit}, ${hair}
Character Mood: ${subjectMood}
Scene: ${scene}
${facelessInstruction}

For each prompt, return this EXACT format:

### Prompt [N]
**Title:** [short descriptive title]
**Description:** [what this animation depicts]
**Prompt:** [full prompt including: character action, body movement and timing, camera movement (pan/zoom/handheld), environment interaction, style (cinematic/vlog/slow motion)]

---`;
          break;

        case "avatar":
          promptContent = `Generate ${numVariations} talking avatar video prompt(s).

Subject: ${gender}, ${outfit}, ${hair}
Scene/Background: ${scene}
Mood: ${subjectMood}
${facelessInstruction}

For each prompt, return this EXACT format:

### Prompt [N]
**Title:** [short descriptive title]
**Description:** [brief description of the avatar video]
**Prompt:** [full prompt including: script (what the avatar says), tone (friendly/confident/emotional), facial expressions, head movement and gestures, camera framing (close-up/medium shot), lighting and background]

---`;
          break;

        default: // broll
          promptContent = `Generate ${numVariations} cinematic B-Roll scene prompt(s) for background video footage.

Scene: ${scene}
Category: ${sceneCategory}
Camera Angle: ${cameraAngle}
Lighting: ${lighting}
Mood: ${atmosphere}
Style: ${styleFilters.join(", ")}
Environment details: ${referenceDescription || "none"}
${facelessInstruction}

For each prompt, return this EXACT format:

### Prompt [N]
**Title:** [short descriptive title]
**Description:** [2-3 sentence description of the scene]
**Prompt:** [the full detailed cinematic prompt ready to use in an AI video tool]

---`;
          break;
      }

      const result = await makeRequest({ sessionToken, promptContent });
      const parsed = parseVariations(result, numVariations);
      onGenerate(parsed);
      await refreshUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === "DAILY_LIMIT_REACHED") {
        toast.error("Daily limit reached. Upgrade to continue.");
      } else if (message.includes("No API key registered")) {
        toast.error("Please register your OpenAI API key first.");
      } else {
        toast.error("Generation failed. Please check your API key.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const isImageUrl = (s: string) =>
    s.trim().startsWith("http://") || s.trim().startsWith("https://");

  const userPlan = user?.plan ?? "free";

  return (
    <div
      ref={formRef}
      className="bg-card border border-border rounded-2xl shadow-card overflow-hidden flex flex-col"
    >
      {/* Card header */}
      <div className="px-6 py-4 border-b border-divider flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
          Generate Your Scene
        </h2>
      </div>

      <div className="px-6 py-5 flex-1 overflow-y-auto scrollbar-thin space-y-0">
        {/* Prompt Type Selector */}
        <div>
          <SectionLabel>Prompt Type</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {PROMPT_TYPE_CONFIG.map((config) => {
              const locked = !canUsePlan(userPlan, config.minPlan);
              const selected = formData.promptType === config.id;
              return (
                <button
                  key={config.id}
                  type="button"
                  data-ocid={`form.prompt_type.${config.id}.button`}
                  onClick={() => handleSelectPromptType(config.id)}
                  className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all ${
                    locked
                      ? "opacity-50 cursor-not-allowed bg-muted/10 border-border/40"
                      : selected
                        ? "bg-primary/15 border-primary/60 shadow-[0_0_0_1px_oklch(0.54_0.22_281/0.3)]"
                        : "bg-muted/10 border-border/40 hover:border-primary/40 hover:bg-primary/10 cursor-pointer"
                  }`}
                >
                  {/* Icon row */}
                  <div
                    className={`${
                      selected ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {config.icon}
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[11px] font-semibold leading-tight ${
                      selected ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {config.label}
                  </span>

                  {/* Description */}
                  <span className="text-[9px] text-muted-foreground leading-tight">
                    {config.description}
                  </span>

                  {/* Lock icon overlay */}
                  {locked && (
                    <span className="absolute top-2 right-2 text-muted-foreground">
                      <Lock className="w-3 h-3" />
                    </span>
                  )}

                  {/* Plan badge */}
                  {config.badge && (
                    <span
                      className={`mt-0.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                        locked
                          ? "bg-muted/30 text-muted-foreground border-border/30"
                          : config.minPlan === "pro"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}
                    >
                      {config.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* Scene Category */}
        <div>
          <SectionLabel>Scene Category</SectionLabel>
          <Select
            value={formData.sceneCategory}
            onValueChange={(v) => {
              const scenes = SCENE_DATA[v];
              setFormData((prev) => ({
                ...prev,
                sceneCategory: v,
                scene: scenes?.[0] ?? "",
              }));
            }}
          >
            <SelectTrigger
              data-ocid="form.scene_category.select"
              className="bg-input border-border text-foreground"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {Object.keys(SCENE_DATA).map((cat) => (
                <SelectItem key={cat} value={cat} className="text-foreground">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Divider />

        {/* Scene */}
        <div>
          <SectionLabel>Scene</SectionLabel>
          <Select
            value={formData.scene}
            onValueChange={(v) => update("scene", v)}
          >
            <SelectTrigger
              data-ocid="form.scene.select"
              className="bg-input border-border text-foreground"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {(SCENE_DATA[formData.sceneCategory] ?? []).map((sc) => (
                <SelectItem key={sc} value={sc} className="text-foreground">
                  {sc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Divider />

        {/* Reference Image / Description */}
        <div>
          <SectionLabel>Reference Image / Description (optional)</SectionLabel>
          <Textarea
            data-ocid="form.reference.textarea"
            placeholder="Describe a reference image, or paste an image URL (https://...)"
            value={formData.referenceDescription}
            onChange={(e) => update("referenceDescription", e.target.value)}
            className="bg-input border-border text-foreground resize-none text-sm min-h-[80px]"
          />
          {isImageUrl(formData.referenceDescription) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 rounded-xl overflow-hidden border border-border"
            >
              <img
                src={formData.referenceDescription.trim()}
                alt="Reference preview"
                className="w-full max-h-40 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </motion.div>
          )}
        </div>

        <Divider />

        {/* Subject Details */}
        <div>
          <SectionLabel>Subject Details</SectionLabel>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">
                Gender
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(v) => update("gender", v)}
              >
                <SelectTrigger
                  data-ocid="form.gender.select"
                  className="bg-input border-border text-foreground"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {["Female", "Male", "Non-binary", "Unspecified"].map((g) => (
                    <SelectItem key={g} value={g} className="text-foreground">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">
                Outfit
              </Label>
              <Input
                data-ocid="form.outfit.input"
                placeholder="e.g. white linen top, beige trousers"
                value={formData.outfit}
                onChange={(e) => update("outfit", e.target.value)}
                className="bg-input border-border text-foreground text-sm"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">
                Hair
              </Label>
              <Input
                data-ocid="form.hair.input"
                placeholder="e.g. long wavy dark brown hair"
                value={formData.hair}
                onChange={(e) => update("hair", e.target.value)}
                className="bg-input border-border text-foreground text-sm"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">
                Mood
              </Label>
              <Input
                data-ocid="form.mood.input"
                placeholder="e.g. calm, introspective"
                value={formData.subjectMood}
                onChange={(e) => update("subjectMood", e.target.value)}
                className="bg-input border-border text-foreground text-sm"
              />
            </div>
          </div>
        </div>

        <Divider />

        {/* Camera Angle */}
        <div>
          <SectionLabel>Camera Angle</SectionLabel>
          <Select
            value={formData.cameraAngle}
            onValueChange={(v) => update("cameraAngle", v)}
          >
            <SelectTrigger
              data-ocid="form.camera_angle.select"
              className="bg-input border-border text-foreground"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {CAMERA_ANGLES.map((a) => (
                <SelectItem key={a} value={a} className="text-foreground">
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Divider />

        {/* Lighting */}
        <div>
          <SectionLabel>Lighting</SectionLabel>
          <Select
            value={formData.lighting}
            onValueChange={(v) => update("lighting", v)}
          >
            <SelectTrigger
              data-ocid="form.lighting.select"
              className="bg-input border-border text-foreground"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {LIGHTING_OPTIONS.map((l) => (
                <SelectItem key={l} value={l} className="text-foreground">
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Divider />

        {/* Mood / Atmosphere */}
        <div>
          <SectionLabel>Mood / Atmosphere</SectionLabel>
          <Select
            value={formData.atmosphere}
            onValueChange={(v) => update("atmosphere", v)}
          >
            <SelectTrigger
              data-ocid="form.atmosphere.select"
              className="bg-input border-border text-foreground"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {ATMOSPHERE_OPTIONS.map((a) => (
                <SelectItem key={a} value={a} className="text-foreground">
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Divider />

        {/* Preset Quick-Select */}
        <div>
          <SectionLabel>Preset Quick-Select</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {Object.keys(PRESETS).map((preset) => (
              <button
                key={preset}
                type="button"
                data-ocid="form.preset.button"
                onClick={() => applyPreset(preset)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all bg-chip-bg border-chip-border text-muted-foreground hover:border-primary/60 hover:text-foreground hover:bg-primary/10 active:scale-95"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Style / Filters */}
        <div className="mt-4">
          <SectionLabel>Style / Filters</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {STYLE_PILLS.map((style) => {
              const active = formData.styleFilters.includes(style);
              return (
                <button
                  key={style}
                  type="button"
                  data-ocid="form.style_filter.toggle"
                  onClick={() => toggleStyle(style)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                    active
                      ? "bg-primary/20 border-primary/60 text-primary shadow-purple-sm"
                      : "bg-chip-bg border-chip-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {style}
                </button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* Number of Variations */}
        <div>
          <SectionLabel>
            Number of Variations{" "}
            <span className="text-primary font-bold normal-case">
              {formData.numVariations}
            </span>
            {batchEnabled && (
              <span className="ml-1 normal-case font-normal text-muted-foreground/60">
                (max: {maxVariations})
              </span>
            )}
          </SectionLabel>

          {batchEnabled ? (
            <>
              <Slider
                data-ocid="form.variations.input"
                min={1}
                max={maxVariations}
                step={1}
                value={[formData.numVariations]}
                onValueChange={([v]) => update("numVariations", v)}
                className="mt-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>1</span>
                <span>{maxVariations}</span>
              </div>
            </>
          ) : (
            <div
              data-ocid="form.batch_locked.panel"
              className="flex items-start gap-2.5 text-xs text-muted-foreground bg-muted/20 border border-border/40 rounded-lg px-3 py-2.5 mt-1"
            >
              <Layers className="w-3.5 h-3.5 text-primary/60 flex-shrink-0 mt-0.5" />
              <span>
                Batch generation requires{" "}
                <span className="text-primary font-semibold">Pro</span> or
                higher. Go to the{" "}
                <span className="text-primary font-medium">Pricing</span> tab to
                upgrade.
              </span>
            </div>
          )}
        </div>

        <Divider />

        {/* Faceless Toggle */}
        <div className="flex items-center gap-3">
          <Checkbox
            data-ocid="form.faceless.checkbox"
            id="faceless"
            checked={formData.faceless}
            onCheckedChange={(v) => update("faceless", !!v)}
            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label
            htmlFor="faceless"
            className="text-sm text-foreground cursor-pointer"
          >
            Keep subject faceless
          </Label>
        </div>
      </div>

      {/* Generate CTA */}
      <div className="px-6 py-4 border-t border-divider">
        <Button
          data-ocid="form.generate.primary_button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full h-12 text-sm font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-purple transition-all"
          style={{
            background: isGenerating
              ? undefined
              : "linear-gradient(135deg, oklch(0.54 0.22 281), oklch(0.47 0.24 279))",
          }}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Generate Prompts
              <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

function parseVariations(text: string, expected: number): string[] {
  // Try to split on structured prompt headers first
  const structuredSplit = text.split(/(?=###\s*Prompt\s*\[?\d+\]?)/i);
  if (structuredSplit.length > 1) {
    return structuredSplit
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, expected);
  }

  const lines = text.split("\n");
  const variations: string[] = [];
  let current = "";

  for (const line of lines) {
    const match =
      line.match(/^Variation\s*(\d+):\s*(.*)/i) ||
      line.match(/^(\d+)\.\s+(.*)/);
    if (match) {
      if (current.trim()) variations.push(current.trim());
      current = match[2] ?? "";
    } else if (current) {
      current += ` ${line.trim()}`;
    }
  }
  if (current.trim()) variations.push(current.trim());

  if (variations.length === 0) {
    const chunks = text.split(/\n\n+/).filter((c) => c.trim());
    return chunks.slice(0, expected);
  }

  return variations.slice(0, expected);
}
