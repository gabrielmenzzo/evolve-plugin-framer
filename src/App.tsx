import { framer } from "framer-plugin"
import { useState, useEffect } from "react"

const Icons = {
    User: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E1251B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    ),
    Key: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E1251B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
    ),
    Sync: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
        </svg>
    ),
    Logout: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
    ),
}

const BASE_URL_V1 = "https://evo-integracao-api.w12app.com.br/api/v1"
const BASE_URL_V2 = "https://evo-integracao-api.w12app.com.br/api/v2"
const PROXY = "https://corsproxy.io/?"

const SLUG_INVALID_CHARS = new RegExp("[^a-z0-9]+", "g")
const SLUG_TRIM_DASHES = new RegExp("(^-|-$)", "g")

// Mapeamento de sinônimos: catálogo EVO pode usar nomes diferentes da agenda
const ACTIVITY_SYNONYMS: Record<string, string> = {
    "SPINNING": "BIKE INDOOR",
}

// Atividades que não são esportes/aulas reais da academia
const ACTIVITY_BLOCKLIST = [
    "PRESCRIÇÃO", "PRESCRICAO", "TESTE", "AVALIAÇÃO", "AVALIACAO",
    "CATRACA", "FÉRIAS", "FERIAS", "MANUTENÇÃO", "MANUTENCAO",
]

function normalizeActivityName(name: string): string {
    const upper = (name || "").trim().toUpperCase()
    return ACTIVITY_SYNONYMS[upper] || upper
}

function toSlug(name: string): string {
    return name.toLowerCase().replace(SLUG_INVALID_CHARS, "-").replace(SLUG_TRIM_DASHES, "")
}

export function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [apiUser, setApiUser] = useState("")
    const [apiPass, setApiPass] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<string>("")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const UI_HEIGHT_BASE = 290

    useEffect(() => {
        if (!isAuthenticated) {
            framer.showUI({ width: 340, height: 480 })
            return
        }
        framer.showUI({ width: 340, height: UI_HEIGHT_BASE })
    }, [isAuthenticated])

    useEffect(() => {
        const u = localStorage.getItem("evo_user")
        const p = localStorage.getItem("evo_pass")
        if (u && p) {
            setApiUser(u)
            setApiPass(p)
            setIsAuthenticated(true)
        }
    }, [])

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (apiUser && apiPass) {
            localStorage.setItem("evo_user", apiUser)
            localStorage.setItem("evo_pass", apiPass)
            setIsAuthenticated(true)
            setErrorMsg(null)
        } else {
            setErrorMsg("Preencha tudo.")
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("evo_user")
        localStorage.removeItem("evo_pass")
        setApiUser("")
        setApiPass("")
        setIsAuthenticated(false)
        setStatus("")
    }

    const syncUnidades = async () => {
        setIsLoading(true)
        setStatus("Iniciando...")
        setErrorMsg(null)

        try {
            const collection = await framer.getManagedCollection()

            // Removemos os campos preenchidos via plugin e deixamos para serem preenchidos manualmente pelo usuário no Framer CMS.
            await collection.setFields([
                { id: "uni_name", name: "Nome", type: "string" },
                { id: "uni_plans_json", name: "Dados dos Planos (JSON)", type: "string" },
                { id: "uni_activities_json", name: "Dados das Aulas (JSON)", type: "string" },
                { id: "uni_schedule_json", name: "Dados da Agenda (JSON)", type: "string" },
                { id: "uni_activities_list", name: "Lista de Aulas (Texto)", type: "string" },
                { id: "link_fit", name: "Link Checkout FIT", type: "string", userEditable: true },
                { id: "link_flex", name: "Link Checkout FLEX", type: "string", userEditable: true },
                { id: "uni_internal", name: "Nome Interno", type: "string" },
                { id: "uni_address", name: "Endereço", type: "string" },
                { id: "uni_bairro", name: "Bairro", type: "string" },
                { id: "uni_city", name: "Cidade", type: "string" },
                { id: "uni_uf", name: "UF", type: "string" },
                { id: "uni_cep", name: "CEP", type: "string" },
                { id: "uni_contact", name: "Contato", type: "string" },
                { id: "uni_lat", name: "Latitude", type: "number", userEditable: true },
                { id: "uni_long", name: "Longitude", type: "number", userEditable: true },
                { id: "uni_opening", name: "Data Abertura", type: "date" },
                { id: "uni_image", name: "Foto da Unidade", type: "image", userEditable: true },
                
                // Campos de Preços definidos para userEditable: true para preenchimento manual
                { id: "uni_fit_plan_name", name: "Nome Plano FIT", type: "string", userEditable: true },
                { id: "uni_fit_price", name: "Preço Promocional FIT", type: "string", userEditable: true },
                { id: "uni_flex_plan_name", name: "Nome Plano FLEX", type: "string", userEditable: true },
                { id: "uni_flex_price", name: "Preço Promocional FLEX", type: "string", userEditable: true },
                
                {
                    id: "uni_photos",
                    name: "Fotos da Unidade",
                    type: "array",
                    userEditable: true,
                    fields: [{ id: "photo", name: "Foto", type: "image" }],
                },
            ])

            const authHeader = btoa(`${apiUser}:${apiPass}`)
            const headers = { Authorization: `Basic ${authHeader}`, Accept: "application/json" }

            setStatus("Baixando Unidades...")
            const resUnits = await fetch(PROXY + encodeURIComponent(`${BASE_URL_V1}/configuration`), {
                method: "GET", headers,
            })
            if (!resUnits.ok) throw new Error(`Erro Unidades: ${resUnits.status}`)
            const dataUnits = await resUnits.json()

            let allPlans: any[] = []
            setStatus("Baixando Planos...")
            try {
                const resPlans = await fetch(
                    PROXY + encodeURIComponent(`${BASE_URL_V2}/membership?active=true&take=50`),
                    { method: "GET", headers }
                )
                if (resPlans.ok) {
                    const j = await resPlans.json()
                    allPlans = Array.isArray(j) ? j : j.list || []
                }
            } catch (e) { console.warn("Erro Planos") }

            setStatus("Baixando Catálogo de Aulas...")
            let allActivities: any[] = []
            try {
                const resAct = await fetch(PROXY + encodeURIComponent(`${BASE_URL_V1}/activities?take=2000`), {
                    method: "GET", headers,
                })
                if (resAct.ok) allActivities = await resAct.json()
            } catch (e) { console.warn("Erro Aulas") }

            setStatus("Processando...")

            const BLOCKED_NAMES = ["EVOLVE - TESTE", "MODELO - EVOLVE", "TREINAMENTO EVOLVE"]
            const WAITLIST_NAMES = ["EVOLVE - NOROESTE", "EVOLVE - JARDIM BOTÂNICO", "EVOLVE - NUCLEO BANDEIRANTE"]

            const valid = dataUnits.filter((u: any) => {
                const hasBasicData = u.idBranch > 0 && u.name
                const nameUpper = (u.name || "").toUpperCase()
                const isBlocked = BLOCKED_NAMES.some((blocked) => nameUpper.includes(blocked.toUpperCase()))
                return hasBasicData && !isBlocked
            })

            const tf = (t: string, v: any) => ({ type: t, value: v })

            const items: any[] = []
            for (const u of valid) {
                const s = (v: any) => (v ? String(v).trim() : "")
                const addr = [u.address, u.number, u.complement].filter(Boolean).join(", ")
                const branchId = String(u.idBranch)

                const nameUpper = (u.name || "").toUpperCase()
                const isManualWaitlist = WAITLIST_NAMES.some((w) => nameUpper.includes(w.toUpperCase()))

                const today = new Date()
                today.setHours(0, 0, 0, 0)

                let isFutureOpening = false
                if (u.openingDate) {
                    const openDate = new Date(u.openingDate)
                    if (openDate > today) isFutureOpening = true
                }

                // Pequeno delay (throttle) para evitar sobrecarga e re-bloqueio (Erro 429) tanto no Proxy quanto na API da W12
                await new Promise((resolve) => setTimeout(resolve, 800))

                const isWaitlist = isManualWaitlist || isFutureOpening

                let cleanPlans: any[] = []
                let cleanSchedule: any[] = []
                let unitActivities: any[] = []
                let activitiesKeywords = ""

                if (isWaitlist) {
                    cleanPlans = [{
                        name: "LISTA DE ESPERA",
                        price: 0,
                        features: ["Inauguração em Breve", "Condições Exclusivas", "Seja um Fundador", "Garanta sua Vaga"],
                    }]
                    cleanSchedule = []
                    unitActivities = []
                    activitiesKeywords = "Inauguração em Breve"
                } else {
                    if (allPlans.length > 0) {
                        const rawPlans = allPlans.filter(
                            (p: any) =>
                                (p.idBranch === u.idBranch || p.idBranch === 0) &&
                                !p.inactive &&
                                p.value > 0 &&
                                !p.nameMembership.toUpperCase().includes("PERSONAL TRAINER")
                        )
                        const specificPlanNames = new Set(
                            rawPlans
                                .filter((p: any) => p.idBranch === u.idBranch)
                                .map((p: any) => p.nameMembership.trim().toUpperCase())
                        )
                        cleanPlans = rawPlans
                            .filter((p: any) => {
                                const name = p.nameMembership.trim().toUpperCase()
                                if (p.idBranch === u.idBranch) return true
                                if (p.idBranch === 0 && !specificPlanNames.has(name)) return true
                                return false
                            })
                            .map((p: any) => ({
                                name: p.nameMembership,
                                price: p.value,
                                features: p.differentials
                                    ? p.differentials.sort((a: any, b: any) => a.order - b.order).map((d: any) => d.title)
                                    : [],
                            }))
                    }

                    // === PASSO 1: Buscar AGENDA primeiro (fonte de verdade) ===
                    try {
                        const urlSched = PROXY + encodeURIComponent(
                            `${BASE_URL_V1}/activities/schedule?idBranch=${u.idBranch}&showFullWeek=true`
                        )
                        const resSched = await fetch(urlSched, { method: "GET", headers })
                        if (resSched.ok) {
                            const rawSched = await resSched.json()
                            cleanSchedule = rawSched.map((a: any) => ({
                                name: a.name,
                                time: a.startTime,
                                date: a.activityDate,
                                instructor: a.instructor,
                                image: a.imageUrl || a.instructorPhoto,
                                color: a.color,
                            }))
                        }
                    } catch (e) { console.warn(`Erro Agenda Unidade ${u.idBranch}`) }

                    // === PASSO 2: Extrair nomes REAIS da agenda (normalizados) ===
                    const scheduledNamesNormalized = new Set(
                        cleanSchedule
                            .map((s: any) => normalizeActivityName(s.name || ""))
                            .filter(Boolean)
                    )

                    // === PASSO 3: Filtrar catálogo — só aulas que REALMENTE estão na agenda ===
                    unitActivities = allActivities.filter((a: any) => {
                        if (a.inactive) return false
                        const nameUpper = (a.name || "").trim().toUpperCase()
                        // Bloquear atividades de sistema / não-esportivas
                        if (ACTIVITY_BLOCKLIST.some((b) => nameUpper.includes(b))) return false
                        // Normalizar e verificar se está na agenda real
                        const normalized = normalizeActivityName(a.name || "")
                        return scheduledNamesNormalized.has(normalized)
                    })

                    // === PASSO 4: Keywords incluem nomes do catálogo + agenda (para filtro Framer) ===
                    const keywordSet = new Set<string>()
                    unitActivities.forEach((a: any) => {
                        const name = (a.name || "").trim()
                        if (name) keywordSet.add(name)
                    })
                    // Incluir nomes originais da agenda (podem ser diferentes do catálogo)
                    cleanSchedule.forEach((s: any) => {
                        const name = (s.name || "").trim()
                        if (name && !ACTIVITY_BLOCKLIST.some((b) => name.toUpperCase().includes(b))) {
                            keywordSet.add(name)
                        }
                    })
                    activitiesKeywords = [...keywordSet].join(", ")
                }

                const cleanActivitiesJSON = unitActivities.map((a: any) => ({
                    id: a.idActivity,
                    name: a.name,
                    photo: a.photo,
                    color: a.color || "#E1251B",
                }))

                const latRaw = u.latitude
                const lngRaw = u.longitude
                const latNum = Number(latRaw !== undefined && latRaw !== null ? String(latRaw).replace(",", ".") : NaN)
                const lngNum = Number(lngRaw !== undefined && lngRaw !== null ? String(lngRaw).replace(",", ".") : NaN)
                const hasValidCoords = !isNaN(latNum) && !isNaN(lngNum) && !(latNum === 0 && lngNum === 0)

                items.push({
                    id: branchId,
                    slug: toSlug(u.name),
                    fieldData: {
                        uni_name: tf("string", s(u.name)),
                        uni_plans_json: tf("string", JSON.stringify(cleanPlans)),
                        uni_activities_json: tf("string", JSON.stringify(cleanActivitiesJSON)),
                        uni_schedule_json: tf("string", JSON.stringify(cleanSchedule)),
                        // Campo textual que a interface original criava
                        uni_activities_list: tf("string", activitiesKeywords),
                        uni_internal: tf("string", s(u.internalName || u.name)),
                        uni_address: tf("string", s(addr)),
                        uni_bairro: tf("string", s(u.neighborhood)),
                        uni_city: tf("string", s(u.city)),
                        uni_uf: tf("string", s(u.stateShort || u.state)),
                        uni_cep: tf("string", s(u.zipCode)),
                        uni_contact: tf("string", s(u.whatsapp || u.telephone)),
                        
                        // Removemos uni_fit_plan_name, uni_fit_price e variantes
                        // Pois se os mandarmos, vamos sobrescrever o que o usuário editar no CMS local
                        
                        ...(hasValidCoords && {
                            uni_lat: tf("number", latNum),
                            uni_long: tf("number", lngNum),
                        }),
                        ...(u.openingDate && {
                            uni_opening: tf("date", new Date(u.openingDate).toISOString()),
                        }),
                    },
                })
            }

            const oldIds = await collection.getItemIds()
            const newIds = new Set(items.map((i) => i.id))
            const rm = oldIds.filter((id) => !newIds.has(id))
            if (rm.length) await collection.removeItems(rm)
            await collection.addItems(items)

            setStatus(`Sucesso! ${items.length} un. atualizadas.`)
        } catch (e: any) {
            console.error(e)
            setErrorMsg(e.message)
            if (e.message.includes("Senha")) setIsAuthenticated(false)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="plugin-container">
            <header className="header">
                <div className="brand">
                    <div className="logo-icon">
                        <img src="./icon.svg" alt="Logo" className="logo-img" />
                    </div>
                    <span className="logo-text">SYNC EVO</span>
                </div>
                {isAuthenticated && (
                    <button onClick={handleLogout} className="btn-logout" title="Desconectar">
                        <Icons.Logout />
                        <span>SAIR</span>
                    </button>
                )}
            </header>

            <div className="content">
                {!isAuthenticated ? (
                    <div className="fade-in">
                        <p className="desc">Conecte-se à API da W12.</p>
                        <form onSubmit={handleLogin} className="form-stack">
                            <div className="input-group">
                                <span className="icon-slot"><Icons.User /></span>
                                <input type="text" value={apiUser} onChange={(e) => setApiUser(e.target.value)} placeholder="Usuário API" autoFocus />
                            </div>
                            <div className="input-group">
                                <span className="icon-slot"><Icons.Key /></span>
                                <input type="password" value={apiPass} onChange={(e) => setApiPass(e.target.value)} placeholder="Token / Senha" />
                            </div>
                            {errorMsg && <div className="msg error">{errorMsg}</div>}
                            <button type="submit" className="btn-primary">CONECTAR</button>
                        </form>
                    </div>
                ) : (
                    <div className="fade-in stack">
                        <div className="status-card">
                            <label>Status</label>
                            <div className={`status-text ${status.includes("Sucesso") ? "success" : ""}`}>
                                {status || "Pronto para Sincronizar"}
                            </div>
                        </div>

                        {errorMsg && <div className="msg error">{errorMsg}</div>}

                        <button onClick={syncUnidades} disabled={isLoading} className={`btn-primary ${isLoading ? "busy" : ""}`}>
                            {isLoading ? (
                                <>
                                    <span className="spinner"><Icons.Sync /></span>
                                    Sincronizando
                                </>
                            ) : (
                                <>
                                    <Icons.Sync />
                                    SINCRONIZAR AGORA
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </main>
    )
}

const styles = `
* { box-sizing: border-box; }
body { margin: 0; padding: 0; background-color: #050505; color: #fff; font-family: 'Inter', sans-serif; }
.plugin-container { width: 100%; height: fit-content; padding: 20px; display: flex; flex-direction: column; background: linear-gradient(to bottom, #111, #000); }
.header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 1px solid #222; margin-bottom: 20px; flex-shrink: 0; min-height: 50px; }
.brand { display: flex; align-items: center; gap: 10px; }
.logo-text { font-weight: 900; letter-spacing: 1px; font-size: 16px; color: #fff; white-space: nowrap; }
.logo-img { width: 34px; height: 34px; }
.btn-logout { background: transparent; border: 1px solid #333; color: #888; padding: 6px 12px; border-radius: 4px; font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 6px; cursor: pointer; transition: 0.2s; width: fit-content; flex-shrink: 0; }
.btn-logout:hover { border-color: #E1251B; color: #E1251B; }
.content { flex: 1; display: flex; flex-direction: column; }
.desc { font-size: 13px; color: #888; margin: 0 0 20px 0; line-height: 1.4; }
.stack { display: flex; flex-direction: column; gap: 12px; }
.form-stack { display: flex; flex-direction: column; gap: 12px; }
.input-group { position: relative; }
.icon-slot { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.input-group input { width: 100%; background: #1A1A1A; border: 1px solid #333; padding: 14px 14px 14px 40px; border-radius: 6px; color: white; font-size: 13px; font-weight: 500; outline: none; transition: 0.2s; }
.input-group input:focus { border-color: #E1251B; background: #222; }
.btn-primary { width: 100%; background: #E1251B; color: white; border: none; padding: 16px; border-radius: 6px; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; }
.btn-primary:hover:not(:disabled) { background: #FF3322; }
.btn-primary:disabled { background: #333; color: #666; cursor: not-allowed; }
.btn-primary.busy { cursor: wait; }
.status-card { background: #111; border: 1px solid #222; padding: 15px; border-radius: 6px; text-align: center; }
.status-card label { display: block; font-size: 10px; color: #666; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
.status-text { font-size: 14px; font-weight: 600; color: #ddd; }
.status-text.success { color: #00FF88; }
.msg { font-size: 11px; padding: 10px; border-radius: 4px; text-align: center; }
.msg.error { background: rgba(255,68,68,0.1); color: #ff6666; border: 1px solid rgba(255,68,68,0.2); }
.fade-in { animation: fadeIn 0.3s ease-in; }
.spinner { animation: spin 1s linear infinite; display: inline-flex; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { 100% { transform: rotate(360deg); } }
`

const styleSheet = document.createElement("style")
styleSheet.innerText = styles
document.head.appendChild(styleSheet)