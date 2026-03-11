"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/post-auth", { cache: "no-store" });
      const data = await res.json();
      router.replace(data.redirectTo ?? "/");
      router.refresh();
    } catch {
      setMsg("Entraste, pero no pudimos resolver el siguiente paso. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-3">
        <h1 className="text-xl font-semibold">Login</h1>

        <input className="w-full border rounded px-3 py-2" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password"
          value={password} onChange={(e) => setPassword(e.target.value)} />

        <button className="w-full border rounded px-3 py-2" onClick={onSubmit} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-sm opacity-80">
          ¿No tienes cuenta? <Link className="underline" href="/signup">Crear cuenta</Link>
        </p>

        {msg && <p className="text-sm opacity-80">{msg}</p>}
      </div>
    </main>
  );
}
