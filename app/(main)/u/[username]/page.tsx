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
  body: string;
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
}: {
  review: ReviewWithEntity;
  eyebrow?: string;
}) {
  const entity = getEntity(review);
  const heading = review.title ?? entity?.title ?? "Untitled review";

  return (
    <article className="rounded-lg border p-4">
      {eyebrow ? <p className="mb-2 text-xs uppercase opacity-60">{eyebrow}</p> : null}

      <div className="flex items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
          {entity?.cover_url ? (
            <Link href={`/track/${entity.id}`} className="block h-full w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entity.cover_url}
                alt={entity.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </Link>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          {entity ? (
            <Link href={`/track/${entity.id}`} className="hover:underline">
              <h3 className="font-semibold">{heading}</h3>
            </Link>
          ) : (
            <h3 className="font-semibold">{heading}</h3>
          )}
          {entity ? (
            <Link href={`/track/${entity.id}`} className="mt-1 block text-sm opacity-70 hover:opacity-100">
              {entity.title}
              {entity.artist_name ? ` • ${entity.artist_name}` : ""}
            </Link>
          ) : null}
          <p className="mt-2 text-sm font-medium opacity-80">{review.rating.toFixed(1)} / 5</p>
          {review.body ? (
            <p className="mt-2 text-sm opacity-80">{review.body}</p>
          ) : (
            <p className="mt-2 text-sm italic opacity-60">Solo dejó su rating para este track.</p>
          )}
        </div>
      </div>
    </article>
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

  return (
    <main className="mx-auto max-w-5xl p-6">
      <section className="flex items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={name}
              fill
              sizes="80px"
              className="object-cover object-center"
              quality={75}
            />
          ) : null}
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-tight">{name}</h1>
          <p className="text-sm opacity-80">@{profile.username}</p>
          {profile.bio ? (
            <p className="mt-2 text-sm leading-relaxed">{profile.bio}</p>
          ) : (
            <p className="mt-2 text-sm opacity-60">Sin bio.</p>
          )}
        </div>
      </section>

{/*       <div className="mt-8 border-t pt-6">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <p className="text-sm opacity-70 mt-1">
          Próximo: pinned review + lista de reviews.
        </p>
      </div> */}
      <div className="mt-8 space-y-6 border-t pt-6">
        {pinnedReview && (
          <ReviewCard review={pinnedReview} eyebrow="Pinned Review" />
        )}

        {reviews && reviews.length > 0 ? (
          <section className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review as ReviewWithEntity} />
            ))}
          </section>
        ) : (
          <p className="text-sm opacity-60">
            Este usuario aún no ha publicado reseñas.
          </p>
        )}
      </div>
    </main>
  );
}
