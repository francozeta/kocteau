import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import BrandLogo from "@/components/brand-logo";
import ProfileEditorForm from "@/components/profile-editor-form";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Set profile",
  description: "Finish your Kocteau profile setup.",
  path: "/onboarding",
  noIndex: true,
});

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
      <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.85fr)]">
        <div className="space-y-5">
          <Link href="/" className="inline-flex transition-opacity hover:opacity-80">
            <BrandLogo priority iconClassName="h-8 w-8 sm:h-9 sm:w-9" />
          </Link>
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Profile
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-[3.2rem]">
              Set your profile
            </h1>
          </div>
        </div>

        <Card className="rounded-[1.9rem] border-border/25 bg-card/20 shadow-none">
          <CardContent>
            <ProfileEditorForm mode="onboarding" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
