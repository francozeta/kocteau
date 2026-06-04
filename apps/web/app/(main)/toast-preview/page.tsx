import type { Metadata } from "next"

import { ToastPreviewClient } from "@/components/toast-preview-client"

export const metadata: Metadata = {
  title: "Toast Preview",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ToastPreviewPage() {
  return <ToastPreviewClient />
}
