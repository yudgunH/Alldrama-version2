import "@/styles/globals.css"
import { Inter } from "next/font/google"
import type React from "react"
import { AuthProvider } from "@/components/auth-provider"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-black text-white">{children}</div>
        </AuthProvider>
      </body>
    </html>
  )
}

