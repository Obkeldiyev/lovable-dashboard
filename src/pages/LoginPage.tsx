import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store";
import { setUser } from "@/store/authSlice";
import { authApi } from "@/features/auth/api";
import { Eye, EyeOff, Lock, Mail, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { t, i18n } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = `${t("login.signIn")} · VMS`; }, [t]);
  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const u = res.user;
      dispatch(
        setUser(
          u
            ? {
                id: u.id,
                email: u.email,
                name: (u as any).fullName ?? u.name,
                role: u.role,
                tenantId: u.tenantId,
              }
            : { id: "self", email },
        ),
      );
      toast.success(t("login.welcomeBack"));
      nav("/dashboard", { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        t("login.invalidCredentials");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      {/* Language switcher top-right */}
      <div className="fixed top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Globe className="h-4 w-4" />
              {i18n.language === "ru" ? "RU" : i18n.language === "uz" ? "UZ" : "EN"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(["en", "ru", "uz"] as const).map((l) => (
              <DropdownMenuItem
                key={l}
                onClick={() => i18n.changeLanguage(l)}
                className={cn("gap-2", i18n.language === l && "font-semibold text-primary")}
              >
                {l === "en" ? "🇺🇸 English" : l === "ru" ? "🇷🇺 Русский" : "🇺🇿 O'zbek"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full max-w-sm space-y-6 animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary grid place-items-center shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">V</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">VMS</h1>
            <p className="text-sm text-muted-foreground">{t("app.subtitle")}</p>
          </div>
        </div>

        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t("login.signInTitle")}</CardTitle>
            <CardDescription>{t("login.signInDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("login.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("login.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("login.signingIn") : t("login.signIn")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
