import { type NextRequest, NextResponse } from "next/server"
import { getAirtableConfig, updateLeadFields } from "@/lib/airtable"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await req.json().catch(() => ({}))
    const { status, fields, notes, followUpDate } = body || {}

    const cfg = getAirtableConfig()
    const payloadFields: Record<string, any> = { ...(fields || {}) }

    if (typeof status === "string") {
      payloadFields[cfg.statusField] = status
    }
    if (typeof notes === "string") {
      payloadFields[cfg.notesField || "Notes"] = notes
    }
    if (typeof followUpDate === "string") {
      // Accept YYYY-MM-DD and pass through to Airtable (Date field will parse)
      payloadFields[cfg.followupField || "Follow up date"] = followUpDate
    }

    if (!Object.keys(payloadFields).length) {
      return NextResponse.json({ error: "No fields provided" }, { status: 400 })
    }

    const updated = await updateLeadFields(id, payloadFields)
    return NextResponse.json({ lead: updated })
  } catch (e: any) {
    console.error("[v0] PATCH /api/leads/[id] error:", e?.message)
    return NextResponse.json({ error: e?.message || "Failed to update lead" }, { status: 500 })
  }
}
