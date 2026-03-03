import Image from "next/image";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

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
      title,
      artist_name,
      cover_url
    )
  `)
    .eq("author_id", profile.id)
    .eq("is_pinned", true)
    .maybeSingle();

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
      title,
      artist_name,
      cover_url
    )
  `)
    .eq("author_id", profile.id)
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
          <section className="border p-4 rounded-lg">
            <p className="text-xs uppercase opacity-60 mb-2">Pinned Review</p>
            <h3 className="font-semibold">{pinnedReview.title}</h3>
            <p className="text-sm opacity-80 mt-1">{pinnedReview.body}</p>
          </section>
        )}

        {reviews && reviews.length > 0 ? (
          <section className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border p-4 rounded-lg">
                <h3 className="font-semibold">{review.title}</h3>
                <p className="text-sm opacity-80 mt-1">{review.body}</p>
              </div>
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