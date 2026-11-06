const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite'

const createProviderError = (status, providerError = null) => {
  if (status === 400) return Object.assign(new Error('Gemini rejected the request. Check the prompt and generation settings.'), { statusCode: 400 })
  if (status === 401 || status === 403) return Object.assign(new Error('Gemini authentication failed. Check the server API key and project access.'), { statusCode: 502 })
  if (status === 404) return Object.assign(new Error('The configured Gemini model is unavailable. Check GEMINI_MODEL.'), { statusCode: 503 })
  if (status === 429) {
    const providerMessage = `${providerError?.status || ''} ${providerError?.message || ''}`
    const isQuota = /quota|daily limit|spend cap|resource exhausted/i.test(providerMessage)
    return Object.assign(
      new Error(isQuota ? 'Gemini quota is exhausted. Check the Google AI project quota and billing settings.' : 'Gemini rate limit reached. Please try again later.'),
      { statusCode: 429 }
    )
  }
  if (status === 503 || status >= 500) return Object.assign(new Error('Gemini is temporarily unavailable. Please try again later.'), { statusCode: 503 })
  return Object.assign(new Error(`Gemini request failed with status ${status}`), { statusCode: 502 })
}

// Gemini is the only content-generation provider. Missing credentials and
// provider errors are surfaced so callers never mistake local copy for AI.
export const generateWithGemini = async (prompt, systemInstruction = '') => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw Object.assign(new Error('Gemini is unavailable: GEMINI_API_KEY is not configured'), { statusCode: 503 })
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL
  const endpoint = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    // Gemini 3.x recommends keeping generation defaults unless a use case
    // requires a change. Do not override temperature here.
    generationConfig: { maxOutputTokens: 600 },
  }
  if (systemInstruction) payload.systemInstruction = { parts: [{ text: systemInstruction }] }

  let response
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      })
    } catch (cause) {
      const timedOut = cause.name === 'TimeoutError' || cause.name === 'AbortError'
      throw Object.assign(
        new Error(timedOut ? 'Gemini request timed out. Please try again.' : 'Gemini service could not be reached.'),
        { statusCode: timedOut ? 504 : 502 }
      )
    }

    if (response.status !== 503 || attempt === 1) break
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  if (!response.ok) {
    let providerError = null
    try { providerError = (await response.json())?.error || null } catch {}
    throw createProviderError(response.status, providerError)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw Object.assign(new Error('Gemini returned an invalid response.'), { statusCode: 502 })
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim()
  if (!text) throw Object.assign(new Error('Gemini returned an empty response'), { statusCode: 502 })
  return text
}

export const smartImproveContent = async ({ type, currentText = '', role = 'Software Engineer', skills = [], keywords = '', experienceYears = '' }) => {
  const skillsList = Array.isArray(skills)
    ? skills.map((skill) => (typeof skill === 'string' ? skill : skill?.name)).filter(Boolean).join(', ')
    : skills
  let prompt
  if (type === 'skills_suggestion') {
    prompt = `Suggest 8 relevant professional skills for a ${role}. Return only a comma-separated list.`
  } else if (type === 'project_description') {
    prompt = `Improve this project description for a ${role} portfolio. Draft: "${currentText}". Technologies: ${skillsList}. Keywords: ${keywords}. Keep it concise, factual, and avoid inventing metrics.`
  } else if (type === 'about_summary') {
    prompt = `Write a professional portfolio summary for a ${role}. Draft: "${currentText}". Skills: ${skillsList}. Experience years: ${experienceYears || 'not specified'}. Do not invent achievements.`
  } else {
    prompt = `Improve this professional portfolio text for a ${role}: "${currentText}". Keywords: ${keywords}. Do not invent claims.`
  }
  const result = await generateWithGemini(prompt, 'You are a careful career writing assistant. Preserve facts and return only the requested content.')
  return type === 'skills_suggestion' ? result.split(/[\n,]/).map((skill) => skill.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean).slice(0, 12) : result.replace(/^['"]|['"]$/g, '')
}
