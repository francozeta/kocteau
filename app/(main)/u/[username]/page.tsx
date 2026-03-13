import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import ReviewCard from "@/components/review-card";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type ReviewEntity = {
  id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
};

type ReviewWithEntity = {
  id: string;
  title: string | null;
  body: string | null;
  rating: number;
  created_at: string;
  entities: ReviewEntity | ReviewEntity[] | null;
};

function getEntity(review: ReviewWithEntity) {
  if (Array.isArray(review.entities)) {
    return review.entities[0] ?? null;
  }

  return review.entities;
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const supabase = await supabaseServer();

  // 1) Upload public profile by username
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, created_at")
    .eq("username", username)
    .single();

  if (error || !profile) notFound();

  const name = profile.display_name ?? `@${profile.username}`;

  // 2) Search pinned review
  const { data: pinnedReview } = await supabase
    .from("reviews")
    .select(`
    id,
    title,
    body,
    rating,
    created_at,
    entities (
      id,
      title,
      artist_name,
      cover_url
    )
  `)
    .eq("author_id", profile.id)
    .eq("is_pinned", true)
    .maybeSingle<ReviewWithEntity>();

  // 3) Search for other reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
    id,
    title,
    body,
    rating,
    created_at,
    entities (
      id,
      title,
      artist_name,
      cover_url
    )
  `)
    .eq("author_id", profile.id)
    .eq("is_pinned", false)
    .order("created_at", { ascending: false });

  const totalReviews = (reviews?.length || 0) + (pinnedReview ? 1 : 0);
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="space-y-8">
      <section className="space-y-6 border-b border-border/40 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-6">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/40">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={name}
                fill
                sizes="128px"
                className="object-cover object-center"
                quality={75}
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-foreground text-balance">
              {name}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">@{profile.username}</p>
            {profile.bio ? (
              <p className="mt-4 text-base leading-relaxed text-foreground/80 max-w-2xl">
                {profile.bio}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{totalReviews}</span>
                {totalReviews === 1 ? "review" : "reviews"}
              </div>
              <span>•</span>
              <span>Member since {memberSince}</span>
            </div>
            {isOwnProfile ? (
              <div className="mt-5">
                <Link
                  href="/settings"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Edit profile settings
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {pinnedReview && (
          <ReviewCard
            review={pinnedReview}
            entity={getEntity(pinnedReview)}
            showAuthor={false}
            eyebrow="Featured review"
            featured={true}
            entityMode="full"
          />
        )}

        {reviews && reviews.length > 0 ? (
          <section className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review as ReviewWithEntity}
                entity={getEntity(review as ReviewWithEntity)}
                showAuthor={false}
                entityMode="full"
              />
            ))}
          </section>
        ) : !pinnedReview ? (
          <div className="border border-border/40 rounded-lg p-8 text-center">
            <p className="text-base text-muted-foreground">
              No reviews yet
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
