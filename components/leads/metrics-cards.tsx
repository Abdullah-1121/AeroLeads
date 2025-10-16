"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Lead } from "@/lib/airtable"
import { CheckCircle, Phone, TrendingUp, Users } from "lucide-react"

function formatCurrency(n?: number) {
  if (typeof n !== "number") return "—"
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

export function MetricsCards({ leads }: { leads: Lead[] }) {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const total = leads.length
  const new7d = leads.filter((l) => new Date(l.createdTime) >= sevenDaysAgo).length
  const contacted = leads.filter((l) => (l.status || "").toLowerCase() !== "new" && l.status).length
  const won = leads.filter((l) => {
    const s = (l.status || "").toLowerCase()
    return s === "won" || s === "win"
  }).length

  const items = [
    { label: "Total Leads", value: total.toString(), icon: Users, color: "text-primary" },
    { label: "New (7 days)", value: new7d.toString(), icon: TrendingUp, color: "text-green-500" },
    { label: "Contacted", value: contacted.toString(), icon: Phone, color: "text-blue-500" },
    { label: "Won Leads", value: won.toString(), icon: CheckCircle, color: "text-emerald-500" },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          className="border-muted/40 bg-card/60 backdrop-blur transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
            <item.icon className={`h-5 w-5 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold tracking-tight ${item.color}`}>{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
