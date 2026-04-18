import type { CSSProperties, ReactNode } from "react";

export const kocteauEmail = {
  appUrl: "https://kocteau.com",
  loginUrl: "https://kocteau.com/login",
  logoUrl: "https://kocteau.com/logo-k.png",
  from: "Kocteau <auth@kocteau.com>",
};

export const emailStyles = {
  body: {
    margin: 0,
    backgroundColor: "#070707",
    color: "#f4f1ea",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  shell: {
    width: "100%",
    backgroundColor: "#070707",
  },
  outerCell: {
    padding: "32px 16px",
  },
  container: {
    width: "100%",
    maxWidth: "560px",
    margin: "0 auto",
  },
  panel: {
    border: "1px solid #262626",
    borderRadius: "24px",
    backgroundColor: "#0d0d0d",
    padding: "34px 28px",
  },
  logoWrap: {
    textAlign: "center",
    paddingBottom: "28px",
  },
  logo: {
    width: "42px",
    height: "42px",
    display: "inline-block",
    borderRadius: "14px",
    border: "1px solid #2d2d2d",
  },
  eyebrow: {
    margin: "0 0 12px",
    color: "#9b9b9b",
    fontSize: "12px",
    lineHeight: "18px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },
  heading: {
    margin: "0",
    color: "#f7f4ee",
    fontSize: "28px",
    lineHeight: "34px",
    fontWeight: 700,
    letterSpacing: "0",
  },
  text: {
    margin: "18px 0 0",
    color: "#b8b4ad",
    fontSize: "15px",
    lineHeight: "24px",
    fontWeight: 400,
  },
  code: {
    margin: "28px 0 0",
    border: "1px solid #2b2b2b",
    borderRadius: "18px",
    backgroundColor: "#141414",
    color: "#fff7ef",
    fontSize: "34px",
    lineHeight: "42px",
    fontWeight: 700,
    letterSpacing: "8px",
    padding: "20px 18px",
    textAlign: "center",
    fontFamily:
      '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  },
  buttonWrap: {
    paddingTop: "28px",
  },
  button: {
    display: "block",
    borderRadius: "12px",
    backgroundColor: "#f4f1ea",
    color: "#090909",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 700,
    textAlign: "center",
    textDecoration: "none",
    padding: "13px 18px",
  },
  note: {
    margin: "18px 0 0",
    color: "#7d7d7d",
    fontSize: "12px",
    lineHeight: "19px",
  },
  divider: {
    height: "1px",
    backgroundColor: "#242424",
    lineHeight: "1px",
    margin: "28px 0",
  },
  listItem: {
    borderTop: "1px solid #242424",
    padding: "14px 0",
  },
  listTitle: {
    margin: 0,
    color: "#f4f1ea",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 700,
  },
  listText: {
    margin: "3px 0 0",
    color: "#9c9891",
    fontSize: "13px",
    lineHeight: "20px",
  },
  footer: {
    padding: "20px 8px 0",
    color: "#686868",
    fontSize: "12px",
    lineHeight: "18px",
    textAlign: "center",
  },
  hiddenPreview: {
    display: "none",
    maxHeight: 0,
    maxWidth: 0,
    opacity: 0,
    overflow: "hidden",
  },
} satisfies Record<string, CSSProperties>;

type EmailShellProps = {
  title: string;
  preview: string;
  children: ReactNode;
  logoUrl?: string;
};

export function EmailShell({
  title,
  preview,
  children,
  logoUrl = kocteauEmail.logoUrl,
}: EmailShellProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <title>{title}</title>
      </head>
      <body style={emailStyles.body}>
        <div style={emailStyles.hiddenPreview}>{preview}</div>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={emailStyles.shell}
        >
          <tbody>
            <tr>
              <td align="center" style={emailStyles.outerCell}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={emailStyles.container}
                >
                  <tbody>
                    <tr>
                      <td style={emailStyles.panel}>
                        <div style={emailStyles.logoWrap}>
                          <img
                            src={logoUrl}
                            width="42"
                            height="42"
                            alt="Kocteau"
                            style={emailStyles.logo}
                          />
                        </div>
                        {children}
                      </td>
                    </tr>
                    <tr>
                      <td style={emailStyles.footer}>
                        Kocteau sends account and product emails only. If this
                        was not you, you can ignore this message.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <div style={emailStyles.buttonWrap}>
      <a href={href} style={emailStyles.button}>
        {children}
      </a>
    </div>
  );
}
