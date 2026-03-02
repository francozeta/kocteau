"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const supabase = supabaseBrowser();
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setMsg(null);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return setMsg("No estás logueado.");

    const { error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id);

    setMsg(error ? error.message : "Listo. Username guardado.");
  }

  return (
    <main className="p-6 max-w-md">
      <h1 className="text-xl font-semibold">Elige tu username</h1>
      <input
        className="mt-3 w-full border rounded px-3 py-2"
        placeholder="franco"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button className="mt-3 border rounded px-3 py-2" onClick={save}>
        Guardar
      </button>
      {msg && <p className="mt-2 text-sm opacity-80">{msg}</p>}
    </main>
  );
}