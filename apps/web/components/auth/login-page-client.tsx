"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import AuthFormShell from "@/components/auth/auth-form-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { supabaseBrowser } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validation/schemas";
import { getFirstFieldError } from "@/lib/validation/errors";

export default function LoginPageClient() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: getFirstFieldError(fieldErrors, "email") ?? undefined,
        password: getFirstFieldError(fieldErrors, "password") ?? undefined,
      });
      setMsg(parsed.error.flatten().formErrors[0] ?? null);
      return;
    }

    setLoading(true);
    setMsg(null);
    setFieldErrors({});

    const { error } = await supabase.auth.signInWithPassword(parsed.data);
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
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors((current) => ({ ...current, email: undefined }));
              }}
              className="h-10 rounded-xl border-border/25 bg-background/60"
              aria-invalid={Boolean(fieldErrors.email)}
              required
          />
          <FieldError>{fieldErrors.email}</FieldError>
        </Field>

        <Field>
            <FieldLabel htmlFor="login-password">Password</FieldLabel>
            <Input
              id="login-password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFieldErrors((current) => ({ ...current, password: undefined }));
              }}
              className="h-10 rounded-xl border-border/25 bg-background/60"
              aria-invalid={Boolean(fieldErrors.password)}
              required
          />
          <FieldError>{fieldErrors.password}</FieldError>
        </Field>

          <Field>
            {msg ? (
              <Alert
                variant="destructive"
                className="rounded-xl px-3 py-2.5"
              >
                <CircleAlert className="size-4" />
                <AlertTitle>Couldn&apos;t sign you in</AlertTitle>
                <AlertDescription>{msg}</AlertDescription>
              </Alert>
            ) : null}
          </Field>

          <Field>
            <Button type="submit" className="h-10 w-full rounded-xl" disabled={loading}>
              {loading ? "Signing in..." : "Continue"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </AuthFormShell>
  );
}
