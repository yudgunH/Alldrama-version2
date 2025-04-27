"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Cài đặt hệ thống</h1>

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">Chung</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt chung</CardTitle>
              <CardDescription>Quản lý các cài đặt chung của hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Tên trang web</Label>
                <Input id="site-name" defaultValue="Admin Dashboard" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-description">Mô tả</Label>
                <Input id="site-description" defaultValue="Hệ thống quản lý nội dung" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email liên hệ</Label>
                <Input id="contact-email" type="email" defaultValue="admin@example.com" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Lưu thay đổi</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt bảo mật</CardTitle>
              <CardDescription>Quản lý các cài đặt bảo mật của hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu mới</Label>
                <Input id="password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Cập nhật mật khẩu</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt API</CardTitle>
              <CardDescription>Quản lý các khóa API và quyền truy cập</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">Khóa API</Label>
                <div className="flex gap-2">
                  <Input id="api-key" defaultValue="sk_live_51NXxxxxxxxxxxxxxxxxxxx" readOnly />
                  <Button variant="outline">Tạo mới</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input id="webhook-url" defaultValue="https://example.com/webhook" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Lưu thay đổi</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

