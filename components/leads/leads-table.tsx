import { Linkedin } from "lucide-react"
import useSWR, { mutate as globalMutate } from "swr"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "./status-badge"
import { Textarea } from "@/components/ui/textarea"
import type { Lead } from "@/lib/airtable"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_OPTIONS = ["New", "Contacted", "Qualified", "Won", "Lost"]

export function LeadsTable() {
  const { data, isLoading } = useSWR<{ leads: Lead[] }>("/api/leads", fetcher, {
    revalidateOnFocus: false,
  })
  const [q, setQ] = useState("")

  const leads = data?.leads || []

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return leads
    return leads.filter((l) => {
      const haystack = [
        l.name,
        l.company,
        l.status,
        l.owner,
        l.linkedinUrl,
        l.notes,
        l.followUpDate,
        l.value?.toString(),
        l.email,
        l.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [leads, q])

  // Optimistic update helper that uses `data` as the previous snapshot (deep copy)
  async function optimisticUpdate(
    id: string,
    updates: Partial<Lead>,
    endpointField: string
  ) {
    const key = "/api/leads"

    // Make a deep-ish copy of current data to allow revert if needed
    const previous = data
      ? {
          leads: data.leads.map((l) => ({ ...l })),
        }
      : undefined

    // Optimistically update local cache
    await globalMutate(
      key,
      (current: { leads: Lead[] } | undefined) =>
        current
          ? {
              ...current,
              leads: current.leads.map((l) =>
                l.id === id ? { ...l, ...updates } : l
              ),
            }
          : current,
      { revalidate: false }
    )

    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error(await res.text())
      // Revalidate after successful update
      await globalMutate(key)
    } catch (e) {
      console.error(`[v0] Update ${endpointField} failed:`, e)
      // Revert to previous snapshot if available
      if (previous) {
        await globalMutate(key, previous, { revalidate: false })
      }
      alert(`Failed to update ${endpointField}. Please try again.`)
    }
  }

  const updateStatus = (id: string, next: string) =>
    optimisticUpdate(id, { status: next }, "status")

  const updateNotes = (id: string, next: string) =>
    optimisticUpdate(id, { notes: next }, "notes")

  const updateFollowUpDate = (id: string, next: string) =>
    optimisticUpdate(id, { followUpDate: next }, "follow-up date")

  return (
    <Card className="border-muted/40 bg-card/60 backdrop-blur">
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-pretty">Leads</CardTitle>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search leads..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-[220px]"
          />
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>LinkedIn</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No leads
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{l.name || "—"}</TableCell>
                  <TableCell>
                    {l.linkedinUrl ? (
                      <a
                        href={l.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={l.followUpDate || ""}
                      onChange={(e) => updateFollowUpDate(l.id, e.target.value)}
                      className="w-[160px]"
                      aria-label="Follow-up date"
                    />
                  </TableCell>
                  <TableCell className="min-w-[260px]">
                    <Textarea
                      value={l.notes || ""}
                      onChange={(e) => updateNotes(l.id, e.target.value)}
                      placeholder="Add notes…"
                      rows={2}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={l.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      onValueChange={(v) => updateStatus(l.id, v)}
                      value={l.status || "New"}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Set status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
