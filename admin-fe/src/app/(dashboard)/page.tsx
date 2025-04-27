"use client"

import { Card } from "@/components/ui/card"
import { MetricsCard } from "@/components/metrics-card"
import { StatsChart } from "@/components/stats-chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricsCard
          title="Total Movies"
          value="1234"
          change={{ value: "12", percentage: "+19.2%", isPositive: true }}
        />
        <MetricsCard
          title="Total Users"
          value="5678"
          change={{ value: "124", percentage: "+13.2%", isPositive: true }}
        />
        <MetricsCard
          title="Total Views"
          value="1.2M"
          change={{ value: "1,340", percentage: "+1.2%", isPositive: true }}
        />
        <MetricsCard title="Active Ads" value="15" change={{ value: "2", percentage: "+15.4%", isPositive: true }} />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Views Over Time</h2>
        <StatsChart />
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recently Added Movies</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Views</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Inception</TableCell>
                <TableCell>Sci-Fi</TableCell>
                <TableCell>2010</TableCell>
                <TableCell>120.000</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>The Shawshank Redemption</TableCell>
                <TableCell>Drama</TableCell>
                <TableCell>1994</TableCell>
                <TableCell>95.000</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>The Dark Knight</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>2008</TableCell>
                <TableCell>150.000</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Comments</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Movie</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>John Doe</TableCell>
                <TableCell>Inception</TableCell>
                <TableCell>Mind-blowing!</TableCell>
                <TableCell>2023-06-01</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Jane Smith</TableCell>
                <TableCell>The Shawshank Redemption</TableCell>
                <TableCell>A timeless classic.</TableCell>
                <TableCell>2023-06-02</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Bob Johnson</TableCell>
                <TableCell>The Dark Knight</TableCell>
                <TableCell>Heath Ledger was amazing!</TableCell>
                <TableCell>2023-06-03</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}

