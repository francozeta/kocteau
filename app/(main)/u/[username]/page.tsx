import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

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

function ReviewCard({
  review,
  eyebrow,
  featured = false,
}: {
  review: ReviewWithEntity;
  eyebrow?: string;
  featured?: boolean;
}) {
  const entity = getEntity(review);
  const heading = review.title ?? entity?.title ?? "Untitled review";

  return (
    <Link href={`/track/${entity?.id || '#'}`}>
      <article className={`rounded-lg border transition-all duration-200 hover:border-border/80 group ${
        featured 
          ? "border-border/40 bg-card p-6 hover:bg-muted/30" 
          : "border-border/40 p-4 hover:bg-muted/30"
      }`}>
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}

        <div className="flex items-start gap-4">
          <div className={`shrink-0 overflow-hidden rounded-md bg-muted border border-border/40 group-hover:scale-105 transition-transform duration-200 ${
            featured ? "relative h-28 w-28" : "relative h-20 w-20"
          }`}>
            {entity?.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entity.cover_url}
                alt={entity.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            {entity ? (
              <h3 className={`font-semibold leading-tight text-foreground group-hover:text-foreground transition-colors ${
                featured ? "text-lg" : "text-base"
              }`}>
                {heading}
              </h3>
            ) : (
              <h3 className={`font-semibold leading-tight text-foreground ${
                featured ? "text-lg" : "text-base"
              }`}>
                {heading}
              </h3>
            )}
            {entity ? (
              <p className={`mt-1 text-muted-foreground group-hover:text-foreground/70 transition-colors ${
                featured ? "text-sm" : "text-xs"
              }`}>
                {entity.title}
                {entity.artist_name ? ` • ${entity.artist_name}` : ""}
              </p>
            ) : null}
            <div className={`mt-3 items-center gap-2 inline-flex px-2.5 py-1.5 rounded bg-muted/50 border border-border/40 font-medium text-foreground ${
              featured ? "text-sm" : "text-xs"
            }`}>
              <span>★</span>
              {review.rating.toFixed(1)}
            </div>
            {review.body ? (
              <p className={`mt-3 text-foreground/70 group-hover:text-foreground/80 transition-colors line-clamp-2 ${
                featured ? "text-sm leading-relaxed" : "text-xs"
              }`}>
                {review.body}
              </p>
            ) : (
              <p className={`mt-3 italic text-muted-foreground ${
                featured ? "text-sm" : "text-xs"
              }`}>
                Rating only
              </p>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
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
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {pinnedReview && (
          <ReviewCard review={pinnedReview} eyebrow="Featured Review" featured={true} />
        )}

        {reviews && reviews.length > 0 ? (
          <section className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review as ReviewWithEntity} />
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
