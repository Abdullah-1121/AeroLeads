const API_HOST = "https://api.airtable.com/v0"

type AirtableConfig = {
  apiKey: string
  baseId: string
  table: string
  statusField: string
  linkedinField?: string
  followupField?: string
  notesField?: string
}

export function getAirtableConfig(): AirtableConfig {
  const apiKey = process.env.AIRTABLE_API_KEY
  const baseId = process.env.AIRTABLE_BASE_ID
  const table = process.env.AIRTABLE_TABLE || process.env.AIRTABLE_TABLE_ID || "Leads"
  const statusField = process.env.AIRTABLE_STATUS_FIELD || "Status"
  const linkedinField = process.env.AIRTABLE_LINKEDIN_FIELD
  const followupField = process.env.AIRTABLE_FOLLOWUP_FIELD
  const notesField = process.env.AIRTABLE_NOTES_FIELD

  if (!apiKey || !baseId || !table) {
    throw new Error(
      "[Airtable] Missing env vars. Please set AIRTABLE_API_KEY, AIRTABLE_BASE_ID, and AIRTABLE_TABLE (or AIRTABLE_TABLE_ID).",
    )
  }

  return { apiKey, baseId, table, statusField, linkedinField, followupField, notesField }
}

async function airtableRequest<T>(
  path: string,
  init?: RequestInit & { searchParams?: Record<string, string | number | boolean | undefined> },
): Promise<T> {
  const { apiKey } = getAirtableConfig()
  const url = new URL(`${API_HOST}${path}`)
  if (init?.searchParams) {
    Object.entries(init.searchParams).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v))
    })
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    console.error("[v0] Airtable error:", res.status, text)
    throw new Error(`Airtable API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

type AirtableRecord = {
  id: string
  createdTime: string
  fields: Record<string, any>
}

export type Lead = {
  id: string
  createdTime: string
  name?: string
  email?: string
  company?: string
  status?: string
  source?: string
  value?: number
  owner?: string
  linkedinUrl?: string
  followUpDate?: string
  notes?: string
  raw: AirtableRecord
}

function mapRecordToLead(rec: AirtableRecord): Lead {
  const f = rec.fields || {}
  const cfg = getAirtableConfig()

  const name = f.Name || f.FullName || f.Contact || f.Title
  const email = f.Email || f["Email Address"]
  const company = f.Company || f.Account || f.Organization
  const status = f.Status || f.Stage || f.State
  const source = f.Source || f.Channel
  const valueRaw = f.Value || f.Amount || f["Deal Value"]
  const owner = f.Owner || f.Assignee || f.Rep

  // LinkedIn url try config first, then common variants
  const linkedinUrl =
    (cfg.linkedinField ? f[cfg.linkedinField] : undefined) ||
    f.Linkedin_url ||
    f.LinkedIn ||
    f["LinkedIn URL"] ||
    f["Linkedin URL"]

  // Follow-up date (normalize to YYYY-MM-DD if possible)
  const followUpDateRaw =
    (cfg.followupField ? f[cfg.followupField] : undefined) ||
    f["Follow up date"] ||
    f["Follow-up Date"] ||
    f["Follow Up Date"] ||
    f.FollowUp ||
    f["Next Follow Up"]

  let followUpDate: string | undefined
  if (followUpDateRaw instanceof Date) {
    followUpDate = followUpDateRaw.toISOString().slice(0, 10)
  } else if (typeof followUpDateRaw === "string") {
    // If Airtable returns ISO, trim to date part for input[type=date]
    const dt = new Date(followUpDateRaw)
    followUpDate = isNaN(dt.getTime()) ? followUpDateRaw : dt.toISOString().slice(0, 10)
  }

  const notes = (cfg.notesField ? f[cfg.notesField] : undefined) || f.Notes || f.Note || f["Lead Notes"]

  let value: number | undefined
  if (typeof valueRaw === "number") value = valueRaw
  else if (typeof valueRaw === "string") {
    const parsed = Number(valueRaw.replace(/[^0-9.-]/g, ""))
    if (!Number.isNaN(parsed)) value = parsed
  }

  return {
    id: rec.id,
    createdTime: rec.createdTime,
    name,
    email,
    company,
    status,
    source,
    value,
    owner,
    linkedinUrl,
    followUpDate,
    notes,
    raw: rec,
  }
}

export async function listLeads(params?: {
  pageSize?: number
  offset?: string
  view?: string
}): Promise<{ leads: Lead[]; offset?: string }> {
  const { baseId, table } = getAirtableConfig()
  const data = await airtableRequest<{ records: AirtableRecord[]; offset?: string }>(
    `/${baseId}/${encodeURIComponent(table)}`,
    {
      searchParams: {
        pageSize: params?.pageSize ?? 100,
        offset: params?.offset,
        view: params?.view,
      },
    },
  )
  return {
    leads: (data.records || []).map(mapRecordToLead),
    offset: data.offset,
  }
}

export async function updateLeadFields(id: string, fields: Record<string, any>): Promise<Lead> {
  const { baseId, table } = getAirtableConfig()
  const data = await airtableRequest<{ id: string; createdTime: string; fields: Record<string, any> }>(
    `/${baseId}/${encodeURIComponent(table)}/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ fields }),
    },
  )
  return mapRecordToLead({ id: data.id, createdTime: data.createdTime, fields: data.fields })
}
