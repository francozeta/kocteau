import localFont from "next/font/local";

export const circular = localFont({
  src: "./fonts/circular-std-medium-500.woff2",
  variable: "--font-circular-family",
  weight: "500",
  style: "normal",
  display: "swap",
});

export const redaction = localFont({
  src: "./fonts/redaction-35-latin-400-normal.woff2",
  variable: "--font-redaction-family",
  weight: "400",
  style: "normal",
  display: "swap",
});
