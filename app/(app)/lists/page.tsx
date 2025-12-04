import { ChevronRight, Heart, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"

const popularLists = [
  { id: 1, title: "Essential Ambient", author: "Music Critic", count: 24, likes: 342 },
  { id: 2, title: "Indie Summer 2024", author: "Alex Kim", count: 18, likes: 156 },
  { id: 3, title: "Electronic Classics", author: "Sarah Dev", count: 32, likes: 521 },
  { id: 4, title: "Late Night Drives", author: "Jordan Lee", count: 15, likes: 289 },
]

function getAvatarGradient(seed: string) {
  const gradients = [
    "bg-gradient-to-br from-rose-400 to-orange-300",
    "bg-gradient-to-br from-violet-400 to-purple-300",
    "bg-gradient-to-br from-blue-400 to-cyan-300",
    "bg-gradient-to-br from-emerald-400 to-teal-300",
  ]
  const index = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return gradients[index % gradients.length]
}

export default function ListsPage() {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8 max-w-4xl">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Lists</h1>
              <p className="text-sm text-muted-foreground mt-1">Curated collections from the community</p>
            </div>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create List
            </Button>
          </div>

          {/* Popular Lists */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Popular</h2>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                See all <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {popularLists.map((list) => (
                <button
                  key={list.id}
                  className="w-full flex items-center gap-4 p-4 rounded-md border border-border/50 hover:border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <div className={`h-12 w-12 rounded-md ${getAvatarGradient(list.title)} shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{list.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      by {list.author} · {list.count} albums
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">{list.likes}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Your Lists */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Lists</h2>
            </div>
            <div className="border border-dashed border-border/50 rounded-md p-8 text-center">
              <p className="text-sm text-muted-foreground">You haven't created any lists yet</p>
              <Button variant="outline" size="sm" className="mt-4 gap-1.5 bg-transparent">
                <Plus className="h-4 w-4" />
                Create your first list
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
