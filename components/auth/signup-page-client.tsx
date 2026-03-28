"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthFormShell from "@/components/auth/auth-form-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SignupPageClient() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setMsg(null);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setMsg("Account created. Check your email, confirm it, and then sign in.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/post-auth", { cache: "no-store" });
      const next = await res.json();
      router.replace(next.redirectTo ?? "/onboarding");
      router.refresh();
    } catch {
      router.replace("/onboarding");
    }
  }

  return (
    <AuthFormShell
      title="Create account"
      alternateLabel="Already have an account?"
      alternateHref="/login"
      alternateCta="Log in"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="signup-email">Email</FieldLabel>
            <Input
              id="signup-email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 rounded-xl border-border/25 bg-background/60"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="signup-password">Password</FieldLabel>
            <Input
              id="signup-password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 rounded-xl border-border/25 bg-background/60"
              required
            />
          </Field>

          <Field>
            <Button type="submit" className="h-10 w-full rounded-xl" disabled={loading}>
              {loading ? "Creating..." : "Continue"}
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
