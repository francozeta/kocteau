export const kocteauEmailOtpVerificationTypes = ["email", "signup"] as const;

export type EmailOtpVerificationType =
  (typeof kocteauEmailOtpVerificationTypes)[number];

type EmailOtpAuthError = {
  code?: string;
  message?: string;
  status?: number | string;
};

type VerifyOtp = (params: {
  email: string;
  token: string;
  type: EmailOtpVerificationType;
}) => Promise<{ error: EmailOtpAuthError | null }>;

type VerifyKocteauEmailOtpParams = {
  email: string;
  token: string;
  verifyOtp: VerifyOtp;
};

type VerifyKocteauEmailOtpResult =
  | {
      error: null;
      type: EmailOtpVerificationType;
    }
  | {
      error: EmailOtpAuthError;
      type: null;
    };

const retryableOtpErrorCodes = new Set([
  "invalid_credentials",
  "otp_expired",
  "validation_failed",
]);

const nonRetryableOtpErrorCodes = new Set([
  "captcha_failed",
  "email_not_confirmed",
  "email_provider_disabled",
  "over_email_send_rate_limit",
  "over_request_rate_limit",
  "over_sms_send_rate_limit",
  "phone_not_confirmed",
  "signup_disabled",
  "user_banned",
]);

function getStatus(error: EmailOtpAuthError) {
  if (typeof error.status === "number") {
    return error.status;
  }

  if (typeof error.status === "string") {
    const parsed = Number.parseInt(error.status, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function isTokenVerificationError(error: EmailOtpAuthError) {
  const code = error.code?.toLowerCase();

  if (code && nonRetryableOtpErrorCodes.has(code)) {
    return false;
  }

  if (code && retryableOtpErrorCodes.has(code)) {
    return true;
  }

  const status = getStatus(error);

  if (status !== 400 && status !== 401 && status !== 403) {
    return false;
  }

  const message = error.message?.toLowerCase() ?? "";
  const mentionsOtp = /\b(code|otp|token)\b/.test(message);
  const mentionsVerificationIssue =
    /expired|invalid|missing|not found|verification|verify/.test(message);

  return mentionsOtp && mentionsVerificationIssue;
}

export async function verifyKocteauEmailOtp({
  email,
  token,
  verifyOtp,
}: VerifyKocteauEmailOtpParams): Promise<VerifyKocteauEmailOtpResult> {
  let lastError: EmailOtpAuthError | null = null;

  for (const type of kocteauEmailOtpVerificationTypes) {
    const { error } = await verifyOtp({ email, token, type });

    if (!error) {
      return { error: null, type };
    }

    lastError = error;

    if (!isTokenVerificationError(error)) {
      return { error, type: null };
    }
  }

  return {
    error: lastError ?? { message: "OTP verification failed." },
    type: null,
  };
}
