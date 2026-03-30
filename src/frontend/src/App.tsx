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
import { useAuth } from "./hooks/useAuth";
import {
  useIsApiKeyRegisteredWithSession,
  useRegisterApiKeyWithSession,
} from "./hooks/useQueries";

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
};

const DEFAULT_FORM: FormData = {
  sceneCategory: "Café / Work",
  scene: "Late morning café laptop work",
  referenceDescription: "",
  gender: "Female",
  outfit: "white linen top, beige trousers",
  hair: "long wavy dark brown hair",
  subjectMood: "calm, introspective",
  cameraAngle: "45° side angle",
  lighting: "Soft morning sunlight",
  atmosphere: "Warm",
  styleFilters: ["Cinematic", "Shallow depth of field"],
  numVariations: 3,
  faceless: false,
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

function MainApp() {
  const { user, logout, sessionToken, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "history" | "admin" | "pricing"
  >("dashboard");
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [variations, setVariations] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);

  const { data: apiKeyRegistered, isLoading: checkingKey } =
    useIsApiKeyRegisteredWithSession(sessionToken);
  const { mutateAsync: registerKey, isPending: savingKey } =
    useRegisterApiKeyWithSession(sessionToken);

  useEffect(() => {
    if (!checkingKey && apiKeyRegistered === false) {
      setShowApiModal(true);
    }
  }, [checkingKey, apiKeyRegistered]);

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
      {/* Purple glow background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at -10% 0%, oklch(0.54 0.22 281 / 0.12) 0%, transparent 60%)",
        }}
      />

      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-nav-bg border-b border-divider">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Film className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-foreground text-sm tracking-wide">
              B-Roll AI
            </span>
          </div>

          {/* Nav tabs */}
          <nav className="flex items-center gap-1">
            <button
              type="button"
              data-ocid="nav.dashboard.link"
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "dashboard"
                  ? "text-foreground bg-muted/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <button
              type="button"
              data-ocid="nav.history.link"
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "text-foreground bg-muted/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
            <button
              type="button"
              data-ocid="nav.pricing.link"
              onClick={() => setActiveTab("pricing")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "pricing"
                  ? "text-foreground bg-muted/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Pricing
            </button>
            {user?.role === "admin" && (
              <button
                type="button"
                data-ocid="nav.admin.link"
                onClick={() => setActiveTab("admin")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
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

          {/* Right actions */}
          <div className="flex items-center gap-2">
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

            {/* User info + plan + usage + sign out */}
            {user && (
              <div className="flex items-center gap-2">
                {/* Plan badge */}
                <span
                  data-ocid="nav.plan.panel"
                  className={`text-[10px] font-bold hidden sm:inline-flex items-center px-2 py-0.5 rounded-full border ${
                    planBadgeClass
                  }`}
                >
                  {planLabel}
                </span>

                {/* Usage badge — shown for all users */}
                <span
                  data-ocid="nav.usage.panel"
                  className="text-xs text-muted-foreground hidden sm:block px-2 py-0.5 rounded-full bg-muted/40 border border-border/40"
                >
                  {Number(user.requestsToday)}/{planLimit} today
                </span>

                {/* Upgrade button for non-elite users */}
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

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {/* Hero heading */}
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-foreground leading-tight">
                  Generate B-Roll Prompts
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Craft cinematic AI image prompts for MidJourney, DALL·E, or
                  Stable Diffusion
                </p>
              </div>

              {/* Two-col layout */}
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
                />
                <ResultsPanel
                  variations={variations}
                  isGenerating={isGenerating}
                  referenceDescription={formData.referenceDescription}
                  hasGenerated={hasGenerated}
                />
              </div>

              {/* History below */}
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
                onPlanChange={() => {
                  refreshUser();
                }}
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

      {/* Footer */}
      <footer className="relative z-10 border-t border-divider py-5 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ♥ using{" "}
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

      {/* API Key Modal */}
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
                Enter OpenAI API Key
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-sm">
              Your API key is stored securely in the backend canister and used
              to generate prompts via OpenAI GPT-4o.
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
  const { user, isLoading, login, signUp } = useAuth();

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
    return <AuthScreen onLogin={login} onSignUp={signUp} />;
  }

  return <MainApp />;
}
