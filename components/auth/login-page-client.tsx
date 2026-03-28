"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPageClient() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/post-auth", { cache: "no-store" });
      const data = await res.json();
      router.replace(data.redirectTo ?? "/");
      router.refresh();
    } catch {
      setMsg("You signed in, but we could not resolve the next step. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
      <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.85fr)] lg:items-center">
        <div className="space-y-6">
          <Link href="/" className="inline-flex transition-opacity hover:opacity-80">
            <BrandLogo priority iconClassName="h-8 w-8 sm:h-9 sm:w-9" />
          </Link>
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Access
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-[3.2rem]">
              Log in
            </h1>
          </div>
        </div>

        <Card className="rounded-[1.9rem] border-border/25 bg-card/20 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold tracking-tight">Welcome back</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-2xl border-border/25 bg-background/60"
            />

            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-2xl border-border/25 bg-background/60"
            />

            <Button className="h-11 w-full rounded-2xl" onClick={onSubmit} disabled={loading}>
              {loading ? "Signing in..." : "Continue"}
            </Button>

            <p className="text-sm text-muted-foreground">
              Need an account?{" "}
              <Link className="text-foreground underline-offset-4 hover:underline" href="/signup">
                Create one
              </Link>
            </p>

            {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
