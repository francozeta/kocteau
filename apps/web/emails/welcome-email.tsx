import {
  EmailShell,
  PrimaryButton,
  emailStyles,
  kocteauEmail,
} from "./kocteau-email-kit";

export type KocteauWelcomeEmailProps = {
  userName?: string;
  appUrl?: string;
  logoUrl?: string;
};

export const kocteauWelcomeEmailSubject = "Welcome to Kocteau";
export const kocteauWelcomeEmailPreheader =
  "Your profile is ready. Start shaping your music graph.";

export function KocteauWelcomeEmail({
  userName,
  appUrl = kocteauEmail.appUrl,
  logoUrl = kocteauEmail.logoUrl,
}: KocteauWelcomeEmailProps) {
  const heading = userName ? `Welcome, ${userName}.` : "Welcome to Kocteau.";

  return (
    <EmailShell
      title={kocteauWelcomeEmailSubject}
      preview={kocteauWelcomeEmailPreheader}
      logoUrl={logoUrl}
    >
      <p style={emailStyles.eyebrow}>You are in</p>
      <h1 style={emailStyles.heading}>{heading}</h1>
      <p style={emailStyles.text}>
        Kocteau is a social music space for reviews, saves, and human taste.
        Your first signals help us keep recommendations close to what you
        actually care about.
      </p>

      <div style={emailStyles.divider} />

      <div style={emailStyles.listItem}>
        <p style={emailStyles.listTitle}>Review what stays with you</p>
        <p style={emailStyles.listText}>
          Albums, tracks, and notes become part of your taste profile.
        </p>
      </div>
      <div style={emailStyles.listItem}>
        <p style={emailStyles.listTitle}>Save references</p>
        <p style={emailStyles.listText}>
          Bookmarks tell Kocteau what deserves another listen.
        </p>
      </div>
      <div style={emailStyles.listItem}>
        <p style={emailStyles.listTitle}>Follow people with taste</p>
        <p style={emailStyles.listText}>
          Human curation stays at the center of the feed.
        </p>
      </div>

      <PrimaryButton href={appUrl}>Open Kocteau</PrimaryButton>
      <p style={emailStyles.note}>
        Short version: your account is ready. Start by reviewing or saving one
        record you love.
      </p>
    </EmailShell>
  );
}

export function kocteauWelcomeEmailText({
  userName,
  appUrl = kocteauEmail.appUrl,
}: KocteauWelcomeEmailProps) {
  const heading = userName ? `Welcome, ${userName}.` : "Welcome to Kocteau.";

  return `${heading}

Your profile is ready. Review music, save references, and follow people whose taste you trust.

Open Kocteau: ${appUrl}`;
}

export default KocteauWelcomeEmail;
