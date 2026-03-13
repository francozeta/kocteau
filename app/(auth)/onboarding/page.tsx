"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileEditorForm from "@/components/profile-editor-form";

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
      <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.85fr)]">
        <div className="space-y-6">
          <Badge variant="secondary">Onboarding</Badge>
          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance">
              Set up the profile people will recognize across Kocteau.
            </h1>
            <p className="max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
              Before you start rating tracks, choose the identity that will appear on
              your public profile, your reviews, and the feed.
            </p>
          </div>
        </div>

        <Card className="border-border/50 bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle>Create your profile</CardTitle>
            <CardDescription>
              Username and display name are the minimum. Bio and avatar help the profile
              feel complete from day one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileEditorForm mode="onboarding" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
