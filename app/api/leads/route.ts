import { NextResponse } from "next/server"
import { listLeads } from "@/lib/airtable"

export async function GET() {
  try {
    const { leads } = await listLeads({ pageSize: 100 })
    return NextResponse.json({ leads })
  } catch (e: any) {
    console.error("[v0] GET /api/leads error:", e?.message)
    return NextResponse.json({ error: e?.message || "Failed to fetch leads" }, { status: 500 })
  }
}
