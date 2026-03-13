import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function SettingsPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : "Unknown";

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-muted/50 via-background to-background py-0 shadow-sm">
        <CardHeader className="border-b border-border/50">
          <div className="space-y-3">
            <Badge variant="secondary">Settings</Badge>
            <div className="space-y-2">
              <CardTitle className="text-3xl">Account settings</CardTitle>
              <CardDescription className="max-w-2xl">
                This is the place where profile editing, music links and account controls
                will live as the product grows.
              </CardDescription>
            </div>
            {profile?.username ? (
              <Link
                href={`/u/${profile.username}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                View public profile
              </Link>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>
              Your editable identity inside Kocteau.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-xl border border-border/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Username
              </p>
              <p className="mt-2 font-medium">{profile?.username ?? "Not set"}</p>
            </div>
            <div className="rounded-xl border border-border/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Display name
              </p>
              <p className="mt-2 font-medium">{profile?.display_name ?? "Not set yet"}</p>
            </div>
            <div className="rounded-xl border border-border/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Bio
              </p>
              <p className="mt-2 text-muted-foreground">
                {profile?.bio ?? "No bio added yet."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Music links</CardTitle>
              <CardDescription>
                Spotify, Apple Music and Deezer links can be added here next.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Account overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-xl border border-border/50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Email
                </p>
                <p className="mt-2 font-medium">{user.email ?? "Unknown"}</p>
              </div>
              <div className="rounded-xl border border-border/50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Member since
                </p>
                <p className="mt-2 font-medium">{memberSince}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
