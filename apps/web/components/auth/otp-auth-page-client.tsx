"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, MailCheck } from "lucide-react";
import AuthFormShell from "@/components/auth/auth-form-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabaseBrowser } from "@/lib/supabase/client";
import { getFirstFieldError } from "@/lib/validation/errors";
import { authEmailSchema, otpCodeSchema } from "@/lib/validation/schemas";

type OtpAuthMode = "login" | "signup";

type OtpAuthPageClientProps = {
  mode: OtpAuthMode;
};

const resendCooldownSeconds = 60;
const otpLength = 6;

const copyByMode: Record<
  OtpAuthMode,
  {
    title: string;
    description: string;
    alternateLabel: string;
    alternateHref: string;
    alternateCta: string;
    submitEmail: string;
    sendingEmail: string;
  }
> = {
  login: {
    title: "Log in with email",
    description: "We'll send a one-time code to your inbox.",
    alternateLabel: "New to Kocteau?",
    alternateHref: "/signup",
    alternateCta: "Create an account",
    submitEmail: "Send code",
    sendingEmail: "Sending code...",
  },
  signup: {
    title: "Create your account",
    description: "Use your email to get a secure one-time code.",
    alternateLabel: "Already have an account?",
    alternateHref: "/login",
    alternateCta: "Log in",
    submitEmail: "Send code",
    sendingEmail: "Sending code...",
  },
};

export default function OtpAuthPageClient({ mode }: OtpAuthPageClientProps) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const copy = copyByMode[mode];

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "info">("error");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    code?: string;
  }>({});
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendIn((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendIn]);

  async function sendOtp(isResend = false) {
    const parsed = authEmailSchema.safeParse({ email });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: getFirstFieldError(errors, "email") ?? undefined,
      });
      setMessageTone("error");
      setMessage(parsed.error.flatten().formErrors[0] ?? null);
      return;
    }

    setSending(true);
    setMessage(null);
    setFieldErrors({});

    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      setMessageTone("error");
      setMessage(error.message);
      setSending(false);
      return;
    }

    setEmail(parsed.data.email);
    setCode("");
    setStep("code");
    setResendIn(resendCooldownSeconds);
    setMessageTone("info");
    setMessage(
      isResend
        ? "We sent a fresh code to your email."
        : "Check your inbox for your 6-digit code.",
    );
    setSending(false);
  }

  async function verifyCode() {
    const parsedEmail = authEmailSchema.safeParse({ email });
    const parsedCode = otpCodeSchema.safeParse({ code });

    if (!parsedEmail.success || !parsedCode.success) {
      const codeError = !parsedCode.success
        ? parsedCode.error.flatten().formErrors[0] ?? "Enter the code from your email."
        : null;

      setFieldErrors({
        email: parsedEmail.success
          ? undefined
          : getFirstFieldError(parsedEmail.error.flatten().fieldErrors, "email") ?? undefined,
        code: parsedCode.success
          ? undefined
          : getFirstFieldError(parsedCode.error.flatten().fieldErrors, "code") ?? undefined,
      });
      setMessageTone("error");
      setMessage(
        parsedEmail.success
        ? codeError
          : "Enter a valid email address.",
      );
      return;
    }

    setVerifying(true);
    setMessage(null);
    setFieldErrors({});

    const { error } = await supabase.auth.verifyOtp({
      email: parsedEmail.data.email,
      token: parsedCode.data.code,
      type: "email",
    });

    if (error) {
      setMessageTone("error");
      setMessage(error.message || "That code is invalid or expired.");
      setVerifying(false);
      return;
    }

    try {
      const res = await fetch("/api/post-auth", { cache: "no-store" });
      const data = await res.json().catch(() => null);

      router.replace(data?.redirectTo ?? "/onboarding");
      router.refresh();
    } catch {
      router.replace("/onboarding");
      router.refresh();
    }
  }

  function resetEmailStep() {
    setStep("email");
    setCode("");
    setMessage(null);
    setFieldErrors({});
  }

  return (
    <AuthFormShell
      title={copy.title}
      description={copy.description}
      alternateLabel={copy.alternateLabel}
      alternateHref={copy.alternateHref}
      alternateCta={copy.alternateCta}
    >
      {step === "email" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendOtp();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="auth-email">Email</FieldLabel>
              <Input
                id="auth-email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldErrors((current) => ({ ...current, email: undefined }));
                }}
                className="h-10 rounded-xl border-border/25 bg-background/60"
                aria-invalid={Boolean(fieldErrors.email)}
                autoComplete="email"
                required
              />
              <FieldError>{fieldErrors.email}</FieldError>
            </Field>

            <Field>
              {message ? (
                <Alert
                  variant={messageTone === "error" ? "destructive" : "default"}
                  className="rounded-xl px-3 py-2.5"
                >
                  {messageTone === "error" ? (
                    <CircleAlert className="size-4" />
                  ) : (
                    <MailCheck className="size-4" />
                  )}
                  <AlertTitle>
                    {messageTone === "error" ? "Could not send code" : "Code sent"}
                  </AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              ) : null}
            </Field>

            <Field>
              <Button type="submit" className="h-10 w-full rounded-xl" disabled={sending}>
                {sending ? copy.sendingEmail : copy.submitEmail}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void verifyCode();
          }}
        >
          <FieldGroup>
            <Field className="items-center text-center">
              <FieldLabel htmlFor="auth-code">Enter your code</FieldLabel>
              <p className="text-sm text-muted-foreground">
                We sent it to <span className="font-medium text-foreground">{email}</span>.
              </p>
              <InputOTP
                id="auth-code"
                maxLength={otpLength}
                value={code}
                onChange={(value) => {
                  setCode(value);
                  setFieldErrors((current) => ({ ...current, code: undefined }));
                }}
                containerClassName="justify-center"
                inputMode="numeric"
                disabled={verifying}
                aria-invalid={Boolean(fieldErrors.code)}
              >
                <InputOTPGroup className="gap-2 rounded-none">
                  {Array.from({ length: otpLength }).map((_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="h-12 w-10 rounded-xl border border-border/25 bg-background/60 text-base font-semibold"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <FieldError>{fieldErrors.code}</FieldError>
            </Field>

            <Field>
              {message ? (
                <Alert
                  variant={messageTone === "error" ? "destructive" : "default"}
                  className="rounded-xl px-3 py-2.5"
                >
                  {messageTone === "error" ? (
                    <CircleAlert className="size-4" />
                  ) : (
                    <MailCheck className="size-4" />
                  )}
                  <AlertTitle>
                    {messageTone === "error" ? "Could not verify code" : "Check your inbox"}
                  </AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              ) : null}
            </Field>

            <Field>
              <Button
                type="submit"
                className="h-10 w-full rounded-xl"
                disabled={verifying || code.length < otpLength}
              >
                {verifying ? "Verifying..." : "Continue"}
              </Button>
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-xl"
                disabled={sending || verifying}
                onClick={resetEmailStep}
              >
                Change email
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl"
                disabled={sending || verifying || resendIn > 0}
                onClick={() => void sendOtp(true)}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      )}
    </AuthFormShell>
  );
}
