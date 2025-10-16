"use client"
import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Lead } from "@/lib/airtable"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function LeadsByDayChart({ leads }: { leads: Lead[] }) {
  const data = useMemo(() => {
    const days = 14
    const today = new Date()
    const buckets = new Map<string, number>()

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      buckets.set(toDateKey(d), 0)
    }

    for (const l of leads) {
      const key = toDateKey(new Date(l.createdTime))
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) || 0) + 1)
      }
    }

    return Array.from(buckets.entries()).map(([day, count]) => ({ day, count }))
  }, [leads])

  return (
    <Card className="border-muted/40 bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle>New Leads (Last 14 Days)</CardTitle>
        <CardDescription>Daily counts from Airtable created time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            count: { label: "New Leads", color: "hsl(var(--chart-1))" },
          }}
          className="h-[280px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
