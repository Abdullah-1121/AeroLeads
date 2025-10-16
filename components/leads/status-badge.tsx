"use client"
import { Badge } from "@/components/ui/badge"

const palette: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  contacted: "bg-foreground/10 text-foreground border-foreground/20",
  qualified: "bg-green-500/10 text-green-500 border-green-500/20",
  won: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  lost: "bg-destructive/10 text-destructive border-destructive/20",
}

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant="outline">—</Badge>
  const key = status.toLowerCase()
  const cls = palette[key] || "bg-muted text-muted-foreground border-muted"
  return (
    <Badge variant="outline" className={cls}>
      {status}
    </Badge>
  )
}
