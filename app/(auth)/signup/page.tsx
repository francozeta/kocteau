"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import BrandLogo from "@/components/brand-logo";

export default function SignupPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setMsg(null);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-3">
        <Link href="/" className="mb-5 inline-flex transition-opacity hover:opacity-80">
          <BrandLogo iconClassName="h-8 w-8" />
        </Link>
        <h1 className="text-xl font-semibold">Create account</h1>

        <input className="w-full border rounded px-3 py-2" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password"
          value={password} onChange={(e) => setPassword(e.target.value)} />

        <button className="w-full border rounded px-3 py-2" onClick={onSubmit} disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>

        <p className="text-sm opacity-80">
          Already have an account? <Link className="underline" href="/login">Log in</Link>
        </p>

        {msg && <p className="text-sm opacity-80">{msg}</p>}
      </div>
    </main>
  );
}
