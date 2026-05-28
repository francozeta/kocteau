import assert from "node:assert/strict";
import test from "node:test";
import {
  kocteauEmailOtpVerificationTypes,
  verifyKocteauEmailOtp,
  type EmailOtpVerificationType,
} from "./otp";

function authError(code: string, status = 400) {
  return { code, message: code, status };
}

test("email OTP verification falls back to signup tokens for newly created users", async () => {
  const attempts: EmailOtpVerificationType[] = [];

  const result = await verifyKocteauEmailOtp({
    email: "new@example.com",
    token: "123456",
    verifyOtp: async ({ type }) => {
      attempts.push(type);

      return type === "signup"
        ? { error: null }
        : { error: authError("otp_expired") };
    },
  });

  assert.equal(result.error, null);
  assert.equal(result.type, "signup");
  assert.deepEqual(attempts, ["email", "signup"]);
});

test("email OTP verification does not retry non-token errors", async () => {
  const attempts: EmailOtpVerificationType[] = [];

  const result = await verifyKocteauEmailOtp({
    email: "new@example.com",
    token: "123456",
    verifyOtp: async ({ type }) => {
      attempts.push(type);

      return { error: authError("over_request_rate_limit", 429) };
    },
  });

  assert.deepEqual(attempts, ["email"]);
  assert.equal(result.type, null);
  assert.equal(result.error?.code, "over_request_rate_limit");
});

test("Kocteau verifies normal email OTPs before signup confirmation OTPs", () => {
  assert.deepEqual(kocteauEmailOtpVerificationTypes, ["email", "signup"]);
});
