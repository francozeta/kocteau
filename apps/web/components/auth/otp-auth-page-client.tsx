"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AuthFormShell from "@/components/auth/auth-form-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { appendInternalNext, safeInternalPath } from "@/lib/internal-path";
import { verifyKocteauEmailOtp } from "@/lib/auth/otp";
import { isProfileOnboarded } from "@/lib/profile";
import { supabaseBrowser } from "@/lib/supabase/client";
import { getFirstFieldError } from "@/lib/validation/errors";
import { authEmailSchema, otpCodeSchema } from "@/lib/validation/schemas";

type OtpAuthMode = "login" | "signup";

type OtpAuthPageClientProps = {
  mode: OtpAuthMode;
};

type ClientPostAuthProfile = {
  username: string | null;
  onboarded: boolean | null;
  taste_onboarded?: boolean | null;
};

const resendCooldownSeconds = 60;
const otpLength = 6;

function getRequestedNextPath() {
  if (typeof window === "undefined") {
    return null;
  }

  return safeInternalPath(new URLSearchParams(window.location.search).get("next"));
}

function getEmailRedirectTo(nextPath?: string | null) {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  const safeNextPath = safeInternalPath(nextPath);

  if (safeNextPath) {
    callbackUrl.searchParams.set("next", safeNextPath);
  }

  return callbackUrl.toString();
}

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
    title: "Log in to Kocteau",
    description: "",
    alternateLabel: "New here?",
    alternateHref: "/signup",
    alternateCta: "Sign up",
    submitEmail: "Continue",
    sendingEmail: "Sending",
  },
  signup: {
    title: "Join Kocteau",
    description: "",
    alternateLabel: "Already have an account?",
    alternateHref: "/login",
    alternateCta: "Log in",
    submitEmail: "Continue",
    sendingEmail: "Sending",
  },
};

export default function OtpAuthPageClient({ mode }: OtpAuthPageClientProps) {
  const supabase = supabaseBrowser();
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
  const [redirecting, setRedirecting] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [requestedNextPath, setRequestedNextPath] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRequestedNextPath(getRequestedNextPath());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (resendIn <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendIn((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const errorCode = query.get("error_code") ?? hash.get("error_code");
    const hasAuthError = Boolean(errorCode || query.get("error") || hash.get("error"));
    const nextPath = safeInternalPath(query.get("next"));

    if (!hasAuthError) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMessageTone("error");
      setMessage(
        errorCode === "otp_expired"
          ? "That link expired. Request a fresh code."
          : "We could not open that link. Enter the latest code.",
      );
    }, 0);
    const cleanSearch = new URLSearchParams();

    if (nextPath) {
      cleanSearch.set("next", nextPath);
    }

    window.history.replaceState(
      null,
      "",
      cleanSearch.toString()
        ? `${window.location.pathname}?${cleanSearch.toString()}`
        : window.location.pathname,
    );

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (step !== "code") {
      return;
    }

    const timer = window.setTimeout(() => {
      document.getElementById("auth-code")?.focus();
    }, 40);

    return () => window.clearTimeout(timer);
  }, [step]);

  const getPostAuthRedirect = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const nextPath = getRequestedNextPath();

    if (!auth.user) {
      return null;
    }

    const profileQuery = await supabase
      .from("profiles")
      .select("username, onboarded, taste_onboarded")
      .eq("id", auth.user.id)
      .maybeSingle<ClientPostAuthProfile>();

    const profile = profileQuery.error
      ? await supabase
          .from("profiles")
          .select("username, onboarded")
          .eq("id", auth.user.id)
          .maybeSingle<Omit<ClientPostAuthProfile, "taste_onboarded">>()
          .then((fallbackQuery) =>
            fallbackQuery.data
              ? { ...fallbackQuery.data, taste_onboarded: true }
              : null,
          )
      : profileQuery.data;

    if (!isProfileOnboarded(profile)) {
      return appendInternalNext("/onboarding", nextPath);
    }

    if (profile?.taste_onboarded === false) {
      return appendInternalNext("/onboarding/taste", nextPath);
    }

    return nextPath ?? "/";
  }, [supabase]);

  const redirectAfterAuth = useCallback(async (options?: { retry?: boolean }) => {
    setRedirecting(true);

    try {
      let redirectTo = await getPostAuthRedirect();

      if (!redirectTo && options?.retry) {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        redirectTo = await getPostAuthRedirect();
      }

      if (!redirectTo) {
        setRedirecting(false);
        return false;
      }

      window.location.replace(redirectTo);
      return true;
    } catch {
      setRedirecting(false);
      return false;
    }
  }, [getPostAuthRedirect]);

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
        emailRedirectTo: getEmailRedirectTo(getRequestedNextPath()),
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
    setMessage(isResend ? "Fresh code sent." : null);
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
          : "Enter a valid email.",
      );
      return;
    }

    setVerifying(true);
    setMessage(null);
    setFieldErrors({});

    const { error } = await verifyKocteauEmailOtp({
      email: parsedEmail.data.email,
      token: parsedCode.data.code,
      verifyOtp: (params) => supabase.auth.verifyOtp(params),
    });

    if (error) {
      setMessageTone("error");
      setMessage("Invalid or expired code.");
      setVerifying(false);
      return;
    }

    const redirected = await redirectAfterAuth({ retry: true });

    if (!redirected) {
      setVerifying(false);
      setMessageTone("error");
      setMessage("Code verified, but the session did not open.");
    }
  }

  function resetEmailStep() {
    setStep("email");
    setCode("");
    setMessage(null);
    setFieldErrors({});
  }

  const shellTitle = step === "code" ? "Enter the code" : copy.title;
  const shellDescription =
    step === "code" ? (
      <>
        Sent to <span className="font-medium text-foreground">{email}</span>
      </>
    ) : undefined;

  return (
    <AuthFormShell
      title={shellTitle}
      description={shellDescription}
      alternateLabel={step === "email" ? copy.alternateLabel : undefined}
      alternateHref={
        step === "email"
          ? appendInternalNext(copy.alternateHref, requestedNextPath)
          : undefined
      }
      alternateCta={step === "email" ? copy.alternateCta : undefined}
      footer={
        <span className="inline-flex items-center gap-1">
          <span>created by</span>
          <Link
            href="https://francozeta.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-4"
          >
            francozeta
          </Link>
        </span>
      }
    >
      {step === "email" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendOtp();
          }}
        >
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="auth-email" className="text-xs text-muted-foreground">
                Email
              </FieldLabel>
              <Input
                id="auth-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldErrors((current) => ({ ...current, email: undefined }));
                  setMessage(null);
                }}
                className="h-11 rounded-[0.52rem] border-white/12 bg-[var(--kocteau-surface)] px-4 text-sm shadow-[0_0_0_1px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.035)] placeholder:text-muted-foreground/52 focus-visible:border-white/26 focus-visible:bg-[var(--kocteau-surface-raised)] focus-visible:ring-white/16"
                aria-invalid={Boolean(fieldErrors.email)}
                autoComplete="email"
                autoFocus
                required
              />
              <FieldError>{fieldErrors.email}</FieldError>
            </Field>

            <AuthMessage message={message} tone={messageTone} />

            <Field>
              <Button
                type="submit"
                className="h-11 w-full rounded-[0.52rem] bg-foreground text-background hover:bg-foreground/90"
                disabled={sending || redirecting}
              >
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
          <FieldGroup className="gap-4">
            <Field className="items-center text-center">
              <FieldLabel htmlFor="auth-code" className="sr-only">
                One-time code
              </FieldLabel>
              <InputOTP
                id="auth-code"
                maxLength={otpLength}
                value={code}
                onChange={(value) => {
                  setCode(value.replace(/\D/g, "").slice(0, otpLength));
                  setFieldErrors((current) => ({ ...current, code: undefined }));
                  setMessage(null);
                }}
                autoComplete="one-time-code"
                autoFocus
                containerClassName="mx-auto w-full max-w-[18rem] justify-center"
                inputMode="numeric"
                disabled={verifying || redirecting}
                aria-invalid={Boolean(fieldErrors.code)}
              >
                <InputOTPGroup className="w-full gap-2 rounded-none">
                  {Array.from({ length: otpLength }).map((_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="h-11 min-w-0 flex-1 !rounded-[0.48rem] !border border-white/12 bg-[var(--kocteau-surface)] text-lg font-medium shadow-[0_0_0_1px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.03)] first:!rounded-[0.48rem] last:!rounded-[0.48rem] data-[active=true]:border-white/50 data-[active=true]:bg-[var(--kocteau-surface-raised)] data-[active=true]:ring-2 data-[active=true]:ring-white/16 sm:h-12"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <FieldError>{fieldErrors.code}</FieldError>
            </Field>

            <AuthMessage message={message} tone={messageTone} />

            <Field>
              <Button
                type="submit"
                className="mx-auto h-11 w-full max-w-[18rem] rounded-[0.52rem] bg-foreground text-background hover:bg-foreground/90"
                disabled={verifying || redirecting || code.length < otpLength}
              >
                {redirecting ? "Opening" : verifying ? "Verifying" : "Continue"}
              </Button>
            </Field>

            <div className="flex flex-col items-center gap-2 pt-1">
              <button
                type="button"
                className="min-h-9 rounded-[0.45rem] px-3 text-sm font-medium text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out hover:bg-white/[0.055] hover:text-foreground active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                disabled={sending || verifying || redirecting}
                onClick={resetEmailStep}
              >
                Use a different email
              </button>
              <button
                type="button"
                className="min-h-8 rounded-[0.45rem] px-3 text-xs font-medium text-muted-foreground/80 transition-[color,background-color,transform] duration-150 ease-out hover:bg-white/[0.045] hover:text-foreground active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                disabled={sending || verifying || redirecting || resendIn > 0}
                onClick={() => void sendOtp(true)}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          </FieldGroup>
        </form>
      )}
    </AuthFormShell>
  );
}

function AuthMessage({
  message,
  tone,
}: {
  message: string | null;
  tone: "error" | "info";
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={
        tone === "error"
          ? "text-center text-xs font-medium text-destructive"
          : "text-center text-xs font-medium text-muted-foreground"
      }
    >
      {message}
    </p>
  );
}
