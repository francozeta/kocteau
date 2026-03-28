"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthFormShell from "@/components/auth/auth-form-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
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
    <AuthFormShell
      title="Welcome back"
      alternateLabel="Need an account?"
      alternateHref="/signup"
      alternateCta="Create one"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="login-email">Email</FieldLabel>
            <Input
              id="login-email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 rounded-xl border-border/25 bg-background/60"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="login-password">Password</FieldLabel>
            <Input
              id="login-password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 rounded-xl border-border/25 bg-background/60"
              required
            />
          </Field>

          <Field>
            <Button type="submit" className="h-10 w-full rounded-xl" disabled={loading}>
              {loading ? "Signing in..." : "Continue"}
            </Button>
          </Field>

          {msg ? (
            <FieldDescription>{msg}</FieldDescription>
          ) : null}
        </FieldGroup>
      </form>
    </AuthFormShell>
  );
}
