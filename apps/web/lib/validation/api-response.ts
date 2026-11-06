import { NextResponse } from "next/server";

export function jsonApiError({
  status, code, message, hint, headers,
}: {
  status: number;
  code: string;
  message: string;
  hint: string;
  headers?: HeadersInit;
}) {
  return NextResponse.json(
    { error: message, code, message, hint },
    { status, headers: { "Cache-Control": "no-store", ...Object.fromEntries(new Headers(headers)) } },
  );
}
