import { Suspense } from "react"
import { LeadsDashboard } from "./screen"

export default function Page() {
  return (
    <main className="mx-auto max-w-7xl p-6 md:p-8">
      <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">AeroLeads</h1>
      <p className="mt-1 text-muted-foreground">
        Review new leads, track pipeline, and update statuses in sync with Airtable.
      </p>
      <div className="mt-6">
        <Suspense fallback={<div className="text-muted-foreground">Loading AeroLeads…</div>}>
          <LeadsDashboard />
        </Suspense>
      </div>
    </main>
  )
}
