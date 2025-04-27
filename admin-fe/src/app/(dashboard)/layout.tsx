import type React from "react"
import DashboardLayout from "@/components/layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}

