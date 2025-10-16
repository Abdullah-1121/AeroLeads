"use client"

import useSWR from "swr"
import { MetricsCards } from "@/components/leads/metrics-cards"
import { LeadsByDayChart } from "@/components/leads/leads-by-day-chart"
import { LeadsTable } from "@/components/leads/leads-table"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function LeadsDashboard() {
  const { data } = useSWR<{ leads: any[] }>("/api/leads", fetcher, { revalidateOnFocus: false })

  const leads = data?.leads || []

  return (
    <div className="flex flex-col gap-6">
      <MetricsCards leads={leads} />
      <LeadsByDayChart leads={leads} />
      <LeadsTable />
    </div>
  )
}
