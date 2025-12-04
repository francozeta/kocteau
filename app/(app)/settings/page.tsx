"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8 max-w-2xl">
          {/* Page Header */}
          <div>
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
          </div>

          {/* Profile Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Profile</h2>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input id="name" defaultValue="Alex Kim" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" defaultValue="alexkim" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  defaultValue="Music enthusiast and indie artist supporter"
                  className="min-h-20 resize-none"
                />
              </div>
              <Button size="sm">Save Changes</Button>
            </div>
          </section>

          <Separator />

          {/* Notifications Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Notifications</h2>
            <div className="space-y-4">
              {[
                { id: "likes", label: "Review likes", desc: "When someone likes your review", checked: true },
                { id: "follows", label: "New followers", desc: "When someone follows you", checked: true },
                { id: "comments", label: "Comments", desc: "When someone comments on your review", checked: false },
                { id: "digest", label: "Weekly digest", desc: "Summary of activity and trending music", checked: true },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.checked} />
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Account Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="alex@example.com" disabled />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive bg-transparent">
                  Sign Out
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
