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
import { ChevronDown, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";
import { toast } from "sonner";
import type { FormData } from "../App";
import { useAuth } from "../hooks/useAuth";
import { useMakePromptRequestWithSession } from "../hooks/useQueries";

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
  const { refreshUser } = useAuth();
  const { mutateAsync: makeRequest } = useMakePromptRequestWithSession();
  const formRef = useRef<HTMLDivElement>(null);

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

  const handleGenerate = async () => {
    if (!sessionToken) {
      toast.error("Please sign in to generate prompts.");
      return;
    }

    setIsGenerating(true);
    try {
      const facelessInstruction = formData.faceless
        ? "Keep the subject faceless, do not show the face"
        : "Subject may show face";

      const promptContent = `Generate ${formData.numVariations} cinematic, high-quality AI image prompts.

Scene: ${formData.scene}
Category: ${formData.sceneCategory}
Reference: ${formData.referenceDescription || "none"}
Subject: ${formData.gender}, wearing ${formData.outfit}, ${formData.hair}, mood: ${formData.subjectMood}
Camera: ${formData.cameraAngle}
Lighting: ${formData.lighting}
Mood: ${formData.atmosphere}
Style: ${formData.styleFilters.join(", ")}

Instructions:
- Keep subject consistent
- Make each variation slightly different (angle, lighting, composition)
- Focus on realism and aesthetic details
- ${facelessInstruction}

Return ONLY a numbered list of prompts.`;

      const result = await makeRequest({ sessionToken, promptContent });
      const parsed = parseVariations(result, formData.numVariations);
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
          </SectionLabel>
          <Slider
            data-ocid="form.variations.input"
            min={1}
            max={10}
            step={1}
            value={[formData.numVariations]}
            onValueChange={([v]) => update("numVariations", v)}
            className="mt-2"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>1</span>
            <span>10</span>
          </div>
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
  const lines = text.split("\n");
  const variations: string[] = [];
  let current = "";

  for (const line of lines) {
    // Match both "Variation N:" and "N." formats
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
