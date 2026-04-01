import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import {
  Clapperboard,
  CreditCard,
  Eye,
  EyeOff,
  Film,
  History,
  Key,
  LayoutDashboard,
  LogOut,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminDashboard from "./components/AdminDashboard";
import AuthScreen from "./components/AuthScreen";
import GenerateForm from "./components/GenerateForm";
import HistorySection from "./components/HistorySection";
import PricingPage, {
  PLAN_LIMITS,
  type PlanKey,
} from "./components/PricingPage";
import ResultsPanel from "./components/ResultsPanel";
import SceneCards, { type Scene } from "./components/SceneCards";
import ScenePackGenerator from "./components/ScenePackGenerator";
import { useAuth } from "./hooks/useAuth";
import {
  useAdminSetSystemApiKey,
  useIsSystemApiKeySet,
} from "./hooks/useQueries";

export type PromptType = "broll" | "animation" | "avatar";

export type FormData = {
  sceneCategory: string;
  scene: string;
  referenceDescription: string;
  gender: string;
  outfit: string;
  hair: string;
  subjectMood: string;
  cameraAngle: string;
  lighting: string;
  atmosphere: string;
  styleFilters: string[];
  numVariations: number;
  faceless: boolean;
  promptType: PromptType;
};

const DEFAULT_FORM: FormData = {
  sceneCategory: "Cafe / Work",
  scene: "Late morning cafe laptop work",
  referenceDescription: "",
  gender: "Female",
  outfit: "white linen top, beige trousers",
  hair: "long wavy dark brown hair",
  subjectMood: "calm, introspective",
  cameraAngle: "45 degree side angle",
  lighting: "Soft morning sunlight",
  atmosphere: "Warm",
  styleFilters: ["Cinematic", "Shallow depth of field"],
  numVariations: 3,
  faceless: false,
  promptType: "broll",
};

const PLAN_LABEL: Record<string, string> = {
  free: "FREE",
  starter: "STARTER",
  pro: "PRO",
  elite: "ELITE",
};

const PLAN_BADGE_CLASS: Record<string, string> = {
  free: "bg-muted/60 text-muted-foreground border-border/40",
  starter: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pro: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  elite: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const SAMPLE_SCENES: Scene[] = [
  {
    scene_number: 1,
    label: "Hook",
    description: "She stops mid-sip, eyes locking on something just off-frame.",
    prompt:
      "Handheld close-up of a woman's face over a coffee cup in a busy cafe. She raises the cup, then freezes, eyes shift sideways, lips slightly parted. Natural window light from the left, soft morning warmth. Camera drifts slightly right, slight motion blur. Her expression flickers from calm to guarded in a split second. Background bokeh of murmuring strangers. Imperfect framing, breath visible.",
  },
  {
    scene_number: 2,
    label: "Setup",
    description: "She types three words, then deletes them all.",
    prompt:
      "Over-the-shoulder shot, medium angle, looking at an open laptop screen. Fingers hover over the keyboard, she types quickly, stops, backspaces everything. The glow of the screen reflects in her eyes. Golden hour light bleeds through a dusty window. Her jaw tightens slightly. Empty cup beside the laptop. Hand reaches for her phone, then stops. Shallow depth of field, slight handheld wobble.",
  },
  {
    scene_number: 3,
    label: "Action",
    description:
      "She closes the laptop and walks out, phone still on the table.",
    prompt:
      "Wide-medium angle from a low table perspective. She shuts the laptop with quiet finality. Stands up, smooths her jacket. Walks toward the exit. Camera stays fixed, her phone lights up on the table, face-down. Other patrons blur past in the background. Natural backlight from the exit door. Slight overexposure as she steps into the light. The abandoned phone holds the shot. Handheld drift left.",
  },
  {
    scene_number: 4,
    label: "Emotion",
    description: "Outside, she pauses, hand on the door, not quite leaving.",
    prompt:
      "Exterior shot through the cafe glass window. She stands just beyond the door, back to camera. Hand still resting on the handle. The city moves around her, blurred pedestrians, distant traffic. Overcast sky, diffused grey light, slight lens flare. Her shoulders rise with a slow breath. She does not move for three full seconds. Handheld from inside, shooting through the glass, slight condensation blur.",
  },
  {
    scene_number: 5,
    label: "Ending",
    description: "Back inside: her coffee is still warm. She sits down again.",
    prompt:
      "Return to the original table. The coffee cup steaming faintly. Her coat draped over the chair. She slides back into her seat, pulls the laptop open. Same angle as Scene 1, close-up on her face, over the rim of the cup. Eyes calmer now. A barely-there smile. Natural window light, same morning warmth. Camera holds steady. She raises the cup again, and this time, she drinks. Loop complete.",
  },
];

type GeneratorMode = "scene-pack" | "single";
type ActiveTab = "dashboard" | "history" | "admin" | "pricing" | "scene-demo";

function SceneCardsDemo() {
  const [loadingScene, setLoadingScene] = useState<number | null>(null);
  const [scenes, setScenes] = useState<Scene[]>(SAMPLE_SCENES);

  const handleRegenerate = (sceneNumber: number) => {
    setLoadingScene(sceneNumber);
    setTimeout(() => {
      setScenes((prev) =>
        prev.map((s) =>
          s.scene_number === sceneNumber
            ? { ...s, description: `[Regenerated] ${s.description}` }
            : s,
        ),
      );
      setLoadingScene(null);
    }, 2000);
  };

  return (
    <motion.div
      key="scene-demo"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Clapperboard className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-foreground leading-tight">
            Scene Pack Generator
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl">
          Cinematic scene packs built for TikTok, Reels and Shorts, each scene
          designed with viral psychology and loop retention in mind.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
            5 Scenes
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border/40">
            Demo Mode
          </span>
          <span className="text-xs text-muted-foreground">
            Click Regenerate on any card to simulate a refresh
          </span>
        </div>
      </div>

      <SceneCards
        scenes={scenes}
        onRegenerate={handleRegenerate}
        loadingScene={loadingScene}
      />
    </motion.div>
  );
}

function MainApp() {
  const { user, logout, sessionToken, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [generatorMode, setGeneratorMode] =
    useState<GeneratorMode>("scene-pack");
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [variations, setVariations] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [singleCorePrompt, setSingleCorePrompt] = useState("");

  const { data: apiKeyRegistered, isLoading: checkingKey } =
    useIsSystemApiKeySet();
  const { mutateAsync: registerKey, isPending: savingKey } =
    useAdminSetSystemApiKey(sessionToken);

  useEffect(() => {
    if (!checkingKey && apiKeyRegistered === false && user?.role === "admin") {
      setShowApiModal(true);
    }
  }, [checkingKey, apiKeyRegistered, user?.role]);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    try {
      await registerKey(apiKeyInput.trim());
      setShowApiModal(false);
      setApiKeyInput("");
      toast.success("API key saved successfully!");
    } catch {
      toast.error("Failed to save API key. Please try again.");
    }
  };

  const handleLogout = async () => {
    setDebugMode(false);
    setSingleCorePrompt("");
    try {
      await logout();
      toast.success("Signed out successfully.");
    } catch {
      toast.error("Sign out failed.");
    }
  };

  const planKey = (user?.plan ?? "free") as PlanKey;
  const planLimit = PLAN_LIMITS[planKey]?.dailyLimit ?? 3;
  const planLabel = PLAN_LABEL[user?.plan ?? "free"] ?? "FREE";
  const planBadgeClass =
    PLAN_BADGE_CLASS[user?.plan ?? "free"] ?? PLAN_BADGE_CLASS.free;

  return (
    <div className="min-h-screen bg-background font-jakarta relative overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at -10% 0%, oklch(0.54 0.22 281 / 0.12) 0%, transparent 60%)",
        }}
      />

      <header className="sticky top-0 z-40 bg-nav-bg border-b border-divider">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Film className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-foreground text-sm tracking-wide">
              B-Roll AI
            </span>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
            {(
              [
                ["dashboard", "Dashboard", LayoutDashboard],
                ["scene-demo", "Scene Cards", Clapperboard],
                ["history", "History", History],
                ["pricing", "Pricing", CreditCard],
              ] as [ActiveTab, string, React.ElementType][]
            ).map(([tab, label, Icon]) => (
              <button
                key={tab}
                type="button"
                data-ocid={`nav.${tab}.link`}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "text-foreground bg-muted/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
            {user?.role === "admin" && (
              <button
                type="button"
                data-ocid="nav.admin.link"
                onClick={() => setActiveTab("admin")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "admin"
                    ? "text-foreground bg-muted/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
          </nav>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <>
                <Button
                  data-ocid="nav.api_key.button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiModal(true)}
                  className="border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 text-xs h-8 gap-1.5"
                >
                  <Key className="w-3 h-3" />
                  API Key
                </Button>
                <Button
                  data-ocid="nav.debug_mode.toggle"
                  variant="outline"
                  size="sm"
                  onClick={() => setDebugMode((v) => !v)}
                  className={
                    debugMode
                      ? "border-amber-500/40 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs h-8 gap-1.5"
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 text-xs h-8 gap-1.5"
                  }
                >
                  <span
                    className={
                      debugMode
                        ? "w-2 h-2 rounded-full bg-amber-400 inline-block"
                        : "w-2 h-2 rounded-full bg-muted-foreground/40 inline-block"
                    }
                  />
                  Debug {debugMode ? "ON" : "OFF"}
                </Button>
              </>
            )}

            {user && (
              <div className="flex items-center gap-2">
                <span
                  data-ocid="nav.plan.panel"
                  className={`text-[10px] font-bold hidden sm:inline-flex items-center px-2 py-0.5 rounded-full border ${
                    planBadgeClass
                  }`}
                >
                  {planLabel}
                </span>
                <span
                  data-ocid="nav.usage.panel"
                  className="text-xs text-muted-foreground hidden sm:block px-2 py-0.5 rounded-full bg-muted/40 border border-border/40"
                >
                  {Number(user.requestsToday)}/{planLimit} today
                </span>
                {user.plan !== "elite" && (
                  <Button
                    data-ocid="nav.upgrade.button"
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("pricing")}
                    className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/60 text-xs h-8 gap-1.5 hidden sm:flex"
                  >
                    <Sparkles className="w-3 h-3" />
                    Upgrade
                  </Button>
                )}
                <span className="text-xs text-muted-foreground hidden sm:block max-w-[140px] truncate">
                  {user.email}
                </span>
                <Button
                  data-ocid="nav.signout.button"
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 text-xs h-8 gap-1.5"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "scene-demo" ? (
            <SceneCardsDemo key="scene-demo" />
          ) : activeTab === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-foreground leading-tight">
                  Generate AI Prompts
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Craft cinematic B-Roll, Animation, and Talking Avatar prompts
                  for MidJourney, DALL-E, or Stable Diffusion
                </p>
              </div>

              <div
                className="flex flex-col sm:flex-row gap-2 mb-6"
                data-ocid="generator.mode.panel"
              >
                <button
                  type="button"
                  data-ocid="generator.scene-pack.tab"
                  onClick={() => setGeneratorMode("scene-pack")}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    generatorMode === "scene-pack"
                      ? "bg-primary/15 border-primary/50 text-primary shadow-purple-sm"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:border-border/80"
                  }`}
                >
                  <Clapperboard className="w-4 h-4 flex-shrink-0" />
                  <span>Scene Pack Generator</span>
                  <span
                    className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      generatorMode === "scene-pack"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    RECOMMENDED
                  </span>
                </button>

                <button
                  type="button"
                  data-ocid="generator.single.tab"
                  onClick={() => setGeneratorMode("single")}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    generatorMode === "single"
                      ? "bg-primary/15 border-primary/50 text-primary shadow-purple-sm"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:border-border/80"
                  }`}
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  Single Scene Generator
                </button>
              </div>

              <AnimatePresence mode="wait">
                {generatorMode === "scene-pack" ? (
                  <motion.div
                    key="scene-pack"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ScenePackGenerator
                      sessionToken={sessionToken}
                      userPlan={user?.plan ?? "free"}
                      debugMode={debugMode}
                      onUsageUpdate={refreshUser}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="single"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
                      <GenerateForm
                        formData={formData}
                        setFormData={setFormData}
                        onGenerate={(vars) => {
                          setVariations(vars);
                          setHasGenerated(true);
                        }}
                        isGenerating={isGenerating}
                        setIsGenerating={setIsGenerating}
                        sessionToken={sessionToken}
                        onCorePromptChange={setSingleCorePrompt}
                      />
                      <ResultsPanel
                        variations={variations}
                        isGenerating={isGenerating}
                        debugMode={debugMode}
                        corePrompt={singleCorePrompt}
                        referenceDescription={formData.referenceDescription}
                        hasGenerated={hasGenerated}
                      />
                    </div>

                    {hasGenerated && (
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="mt-10"
                      >
                        <HistorySection />
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : activeTab === "history" ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold uppercase tracking-tight text-foreground">
                  History
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your recent prompt generation batches
                </p>
              </div>
              <HistorySection showAll />
            </motion.div>
          ) : activeTab === "pricing" ? (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <PricingPage
                sessionToken={sessionToken}
                currentPlan={user?.plan ?? "free"}
                onPlanChange={refreshUser}
              />
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <AdminDashboard sessionToken={sessionToken} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 border-t border-divider py-5 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-muted-foreground">
          {new Date().getFullYear()} Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </footer>

      <Dialog open={showApiModal} onOpenChange={setShowApiModal}>
        <DialogContent
          data-ocid="apikey.dialog"
          className="bg-card border-border max-w-md"
        >
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                <Key className="w-4 h-4 text-primary" />
              </div>
              <DialogTitle className="text-foreground font-bold">
                System OpenAI API Key
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-sm">
              This API key is used by all users in the system. Only admins can
              set or update it.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="relative">
              <Input
                data-ocid="apikey.input"
                type={showKey ? "text" : "password"}
                placeholder="sk-..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveApiKey()}
                className="bg-input border-border text-foreground pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                data-ocid="apikey.cancel_button"
                variant="outline"
                onClick={() => setShowApiModal(false)}
                className="flex-1 border-border bg-muted/20 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                data-ocid="apikey.submit_button"
                onClick={handleSaveApiKey}
                disabled={savingKey || !apiKeyInput.trim()}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-purple-sm"
              >
                {savingKey ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Key"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster theme="dark" />
    </div>
  );
}

export default function App() {
  const { user, isLoading, isCanisterStarting, login, signUp } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-ocid="auth.loading_state"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onLogin={login}
        onSignUp={signUp}
        isCanisterStarting={isCanisterStarting}
      />
    );
  }

  return <MainApp />;
}
