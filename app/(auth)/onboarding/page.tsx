"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

function isValidUsername(u: string) {
  return /^[a-z0-9_]{3,20}$/.test(u);
}

export default function OnboardingPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function uploadAvatar(userId: string) {
    if (!file) return null;

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) throw uploadErr;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSubmit() {
    setMsg(null);

    const u = username.trim().toLowerCase();
    if (!isValidUsername(u)) {
      setMsg("Username inválido. Usa 3–20: a-z, 0-9, _");
      return;
    }

    setLoading(true);

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      setMsg("No estás logueado. Vuelve a iniciar sesión.");
      setLoading(false);
      router.replace("/login");
      return;
    }

    try {
      const avatarUrl = await uploadAvatar(authData.user.id);

      const profilePayload: {
        id: string;
        username: string;
        avatar_url?: string;
      } = {
        id: authData.user.id,
        username: u,
      };

      if (avatarUrl) {
        profilePayload.avatar_url = avatarUrl;
      }

      const { error: updErr } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });

      if (updErr) throw updErr;

      router.replace("/");
      router.refresh();
    } catch (e) {
      const error = e as Error & { code?: string };
      if (error.code === "23505") {
        setMsg("Ese username ya está en uso.");
      } else {
        setMsg(error.message);
      }
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-md">
      <h1 className="text-xl font-semibold">Onboarding</h1>
      <p className="text-sm opacity-80 mt-1">Elige tu username y sube un avatar.</p>

      <label className="block mt-4 text-sm">Username</label>
      <input
        className="w-full border rounded px-3 py-2 mt-1"
        placeholder="franco_zeta"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <label className="block mt-4 text-sm">Avatar (opcional)</label>
      <input
        className="w-full mt-1"
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <button
        className="mt-4 border rounded px-3 py-2"
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? "Guardando..." : "Entrar a Kocteau"}
      </button>

      {msg && <p className="mt-3 text-sm opacity-80">{msg}</p>}
    </main>
  );
}
