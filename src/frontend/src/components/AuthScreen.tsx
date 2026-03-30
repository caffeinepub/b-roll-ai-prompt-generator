import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Film, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}

function AuthForm({
  mode,
  onSubmit,
}: {
  mode: "login" | "signup";
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label
          htmlFor={`${mode}-email`}
          className="text-xs text-muted-foreground uppercase tracking-wider"
        >
          Email
        </Label>
        <Input
          id={`${mode}-email`}
          data-ocid={`auth.${mode}.input`}
          type="email"
          placeholder="you@example.com"
          autoComplete={mode === "login" ? "email" : "email"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor={`${mode}-password`}
          className="text-xs text-muted-foreground uppercase tracking-wider"
        >
          Password
          {mode === "signup" && (
            <span className="ml-1 text-muted-foreground/60">(min 6 chars)</span>
          )}
        </Label>
        <div className="relative">
          <Input
            id={`${mode}-password`}
            data-ocid={`auth.${mode}.password.input`}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 pr-10"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <p
          data-ocid="auth.error_state"
          className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2"
        >
          {error}
        </p>
      )}

      <Button
        data-ocid={`auth.${mode}.submit_button`}
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-purple-sm mt-2"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {mode === "login" ? "Signing in..." : "Creating account..."}
          </span>
        ) : mode === "login" ? (
          "Sign In"
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
}

export default function AuthScreen({ onLogin, onSignUp }: AuthScreenProps) {
  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden"
      data-ocid="auth.page"
    >
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.54 0.22 281 / 0.14) 0%, transparent 60%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center shadow-purple-sm">
            <Film className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-extrabold uppercase tracking-widest text-foreground">
              B-Roll AI
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prompt Generator
            </p>
          </div>
        </div>

        {/* Auth card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <Tabs defaultValue="login" data-ocid="auth.tab">
            <TabsList className="w-full mb-6 bg-muted/40 border border-border/50">
              <TabsTrigger
                value="login"
                data-ocid="auth.login.tab"
                className="flex-1 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                data-ocid="auth.signup.tab"
                className="flex-1 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <AuthForm mode="login" onSubmit={onLogin} />
            </TabsContent>

            <TabsContent value="signup">
              <AuthForm mode="signup" onSubmit={onSignUp} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
