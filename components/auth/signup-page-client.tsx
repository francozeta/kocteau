"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, MailCheck } from "lucide-react";
import AuthFormShell from "@/components/auth/auth-form-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { supabaseBrowser } from "@/lib/supabase/client";
import { getFirstFieldError } from "@/lib/validation/errors";
import { signupSchema } from "@/lib/validation/schemas";

export default function SignupPageClient() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [msgTone, setMsgTone] = useState<"error" | "info">("error");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const parsed = signupSchema.safeParse({ email, password });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: getFirstFieldError(fieldErrors, "email") ?? undefined,
        password: getFirstFieldError(fieldErrors, "password") ?? undefined,
      });
      setMsgTone("error");
      setMsg(parsed.error.flatten().formErrors[0] ?? null);
      return;
    }

    setLoading(true);
    setMsg(null);
    setFieldErrors({});

    const { data, error } = await supabase.auth.signUp(parsed.data);

    if (error) {
      setMsgTone("error");
      setMsg(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setMsgTone("info");
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
            <FieldLabel htmlFor="signup-password">Password</FieldLabel>
            <Input
              id="signup-password"
              type="password"
              placeholder="Create a password"
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
                variant={msgTone === "error" ? "destructive" : "default"}
                className="rounded-xl px-3 py-2.5"
              >
                {msgTone === "error" ? (
                  <CircleAlert className="size-4" />
                ) : (
                  <MailCheck className="size-4" />
                )}
                <AlertTitle>
                  {msgTone === "error" ? "Couldn&apos;t create your account" : "Check your inbox"}
                </AlertTitle>
                <AlertDescription>{msg}</AlertDescription>
              </Alert>
            ) : null}
          </Field>

          <Field>
            <Button type="submit" className="h-10 w-full rounded-xl" disabled={loading}>
              {loading ? "Creating..." : "Continue"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </AuthFormShell>
  );
}
