import ReactQueryProvider from "../providers/react-query-provider";
import Header from "@/components/header";
import AppSidebar, { type SidebarOwnedReview } from "@/components/app-sidebar";
import GlobalShortcuts from "@/components/global-shortcuts";
import MobileBottomBar from "@/components/mobile-bottom-bar";
import { getCurrentUser, getCurrentViewerProfile } from "@/lib/auth/server";
import {
  getUnreadNotificationsCount,
} from "@/lib/queries/notifications";
import { getOwnedSidebarReviews } from "@/lib/queries/reviews";
import { supabaseServer } from "@/lib/supabase/server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const [user, safeProfile] = await Promise.all([
    getCurrentUser(),
    getCurrentViewerProfile(),
  ]);

  const [initialUnreadCount, ownedReviews] = user
    ? await (async () => {
        const supabasePromise = supabaseServer();
        const sidebarReviewsPromise = getOwnedSidebarReviews(user.id, 4);
        const unreadCountPromise = supabasePromise.then((supabase) =>
          getUnreadNotificationsCount(supabase, user.id),
        );
        const [sidebarReviews, unreadCount] = await Promise.all([
          sidebarReviewsPromise,
          unreadCountPromise,
        ]);

        return [
          unreadCount,
          sidebarReviews
            .flatMap((review) => {
              const entity = Array.isArray(review.entities)
                ? review.entities[0] ?? null
                : review.entities;

              if (
                !entity ||
                entity.provider !== "deezer" ||
                !entity.provider_id ||
                entity.type !== "track"
              ) {
                return [];
              }

              return [{
                id: review.id,
                title: review.title,
                body: review.body,
                rating: review.rating,
                is_pinned: review.is_pinned,
                entity: {
                  provider: "deezer" as const,
                  provider_id: entity.provider_id,
                  type: "track" as const,
                  title: entity.title,
                  artist_name: entity.artist_name,
                  cover_url: entity.cover_url,
                  deezer_url: entity.deezer_url,
                  entity_id: entity.id,
                },
              }];
            })
        ] as const;
      })()
    : [0, [] as SidebarOwnedReview[]] as const;

  return (
    <ReactQueryProvider>
      <SidebarProvider
        defaultOpen={true}
        style={
          {
            "--sidebar-width": "17rem",
            "--sidebar-width-icon": "3.1rem",
          } as React.CSSProperties
        }
      >
        <AppSidebar
          profile={safeProfile}
          ownedReviews={ownedReviews}
          unreadCount={initialUnreadCount}
        />
        <SidebarInset className="min-h-svh">
          <GlobalShortcuts />
          <Header
            profile={safeProfile}
            initialUnreadCount={initialUnreadCount}
            initialNotifications={[]}
          />
          <main className="mx-auto w-full max-w-5xl px-3.5 pt-20 pb-32 sm:px-6 sm:pt-24 sm:pb-28 lg:px-10 lg:pt-24 lg:pb-10">
            {children}
          </main>
          <MobileBottomBar profile={safeProfile} />
        </SidebarInset>
      </SidebarProvider>
    </ReactQueryProvider>
  );
}
