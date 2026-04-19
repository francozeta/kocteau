import {
  EmailShell,
  emailStyles,
  kocteauEmail,
} from "./kocteau-email-kit";

export type KocteauOtpEmailProps = {
  userName?: string;
  otpCode?: string;
  logoUrl?: string;
  expiresInMinutes?: number;
};

export const kocteauOtpEmailSubject = "Your Kocteau sign-in code";

export function kocteauOtpEmailPreheader(otpCode = "603224") {
  return `Use ${otpCode} to continue to Kocteau.`;
}

export function KocteauOtpEmail({
  userName,
  otpCode = "603224",
  logoUrl = kocteauEmail.logoUrl,
  expiresInMinutes = 10,
}: KocteauOtpEmailProps) {
  const greeting = userName ? `Hi ${userName},` : "Hi,";

  return (
    <EmailShell
      title={kocteauOtpEmailSubject}
      preview={kocteauOtpEmailPreheader(otpCode)}
      logoUrl={logoUrl}
    >
      <p style={emailStyles.eyebrow}>Kocteau access</p>
      <h1 style={emailStyles.heading}>Your code is ready.</h1>
      <p style={emailStyles.text}>
        {greeting} enter this one-time code to continue. It expires in{" "}
        {expiresInMinutes} minutes.
      </p>
      <div style={emailStyles.code}>{otpCode}</div>
      <p style={emailStyles.note}>
        Never share this code. Kocteau will never ask for it outside the
        sign-in screen.
      </p>
    </EmailShell>
  );
}

export function kocteauOtpEmailText({
  userName,
  otpCode = "603224",
  expiresInMinutes = 10,
}: KocteauOtpEmailProps) {
  const greeting = userName ? `Hi ${userName},` : "Hi,";

  return `${greeting}

Your Kocteau code is ${otpCode}. It expires in ${expiresInMinutes} minutes.

If you did not request this, you can ignore this email.`;
}

export default KocteauOtpEmail;
