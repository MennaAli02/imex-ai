import { getAuthToken } from "./auth"

function pn(field) {
  const v = field?.Value?.[0]
  if (!v) return "\u2014"
  if (typeof v === "string") return v
  const alpha = v.Alphabetic || ""
  const parts = alpha.split("^").filter(Boolean)
  return parts.length ? parts.join(" ") : "\u2014"
}

function str(field, fallback = "\u2014") {
  const v = field?.Value?.[0]
  return v !== undefined && v !== null && v !== "" ? String(v) : fallback
}

function num(field, fallback = 0) {
  const v = field?.Value?.[0]
  return v !== undefined && v !== null ? Number(v) : fallback
}

function modalities(field) {
  const v = field?.Value
  return v && v.length ? v.join(", ") : "\u2014"
}

function formatDicomDate(d) {
  if (!d || d.length !== 8) return "\u2014"
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
}

function formatDicomTime(t) {
  if (!t) return "\u2014"
  const clean = t.split(".")[0].padEnd(6, "0")
  return `${clean.slice(0, 2)}:${clean.slice(2, 4)}:${clean.slice(4, 6)}`
}

export async function fetchStudies({ limit = 200, offset = 0 } = {}) {
  const qidoBaseUrl = import.meta.env.VITE_QIDO_URL
  if (!qidoBaseUrl) {
    // PACS / QIDO-RS server not configured in .env — return empty list cleanly without network errors
    return []
  }

  try {
    const token = await getAuthToken()
    const url = `${qidoBaseUrl}/nexus/aets/nexus/rs/studies?includefield=all&limit=${limit}&offset=${offset}`
    const res = await fetch(url, {
      headers: token
        ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
        : { Accept: "application/json" },
    })
    if (!res.ok) {
      console.warn(`[QIDO-RS] Server returned ${res.status} ${res.statusText}`)
      return []
    }
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map((s) => {
      const uid = str(s["0020000D"])
      return {
        id: uid,
        studyInstanceUID: uid,
        patientId: str(s["00100020"]),
        patientName: pn(s["00100010"]),
        referringPhysicianName: pn(s["00080090"]),
        modality: modalities(s["00080061"]),
        accessionNumber: str(s["00080050"]),
        studyDescription: str(s["00081030"]),
        seriesCount: num(s["00201206"]),
        instanceCount: num(s["00201208"]),
        studyDate: formatDicomDate(str(s["00080020"], "")),
        studyTime: formatDicomTime(str(s["00080030"], "")),
        patientAge: str(s["00101010"], ""),
        patientSex: str(s["00100040"], ""),
      }
    })
  } catch (err) {
    console.warn("[QIDO-RS] Fetch failed:", err.message)
    return []
  }
}
