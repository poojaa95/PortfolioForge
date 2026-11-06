import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from './node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'

const api = process.env.API_BASE_URL || 'http://127.0.0.1:53195/api'
const frontend = process.env.FRONTEND_BASE_URL || 'http://127.0.0.1:5178'
const database = new URL(process.env.MONGO_URI || 'mongodb://localhost/').pathname.replace(/^\//, '').split('?')[0]
if (!/^portfolioforge_(audit|test)/i.test(database)) throw new Error('Refusing test unless MONGO_URI selects an isolated audit/test database')
if (!['127.0.0.1', 'localhost', '::1'].includes(new URL(api).hostname)) throw new Error('Refusing test unless API_BASE_URL is loopback')

const evidenceDir = path.resolve('../artifacts/portfolioforge-verification/gemini-20261106')
await fs.mkdir(evidenceDir, { recursive: true })
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const email = `gemini-ui-${suffix}@example.test`
const password = `Gemini-${suffix}-Test!`
let token = ''
let portfolioId = ''
let accountDeleted = false
let browser

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${api}${endpoint}`, options)
  const body = await response.json().catch(() => ({}))
  return { status: response.status, body }
}

const clickButton = async (page, text) => {
  const buttons = await page.$$('button')
  for (const button of buttons) {
    const label = await button.evaluate((element) => element.innerText || '')
    if (label.includes(text)) {
      await button.evaluate((element) => element.scrollIntoView({ block: 'center' }))
      await button.click()
      return
    }
  }
  throw new Error(`Could not find button containing: ${text}`)
}

try {
  const registration = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Gemini UI Verification', email, password }),
  })
  assert.equal(registration.status, 201, `Test registration failed (${registration.status})`)
  token = registration.body.token
  assert.ok(token)

  const portfolio = await request('/portfolios', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Gemini UI Verification Portfolio',
      slug: `gemini-ui-${suffix}`,
      personalInfo: { fullName: 'Gemini UI Verification', title: 'Software Engineer', email },
      about: { summary: 'I build accessible software for teams.' },
      skills: [{ name: 'JavaScript' }, { name: 'React' }],
      projects: [{ title: 'Team Planner', description: 'A small app for planning team schedules.', technologies: ['React', 'Node.js'] }],
    }),
  })
  assert.equal(portfolio.status, 201, `Test portfolio creation failed (${portfolio.status}): ${portfolio.body.message || 'request rejected'}`)
  portfolioId = portfolio.body.portfolio._id

  browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    userDataDir: path.join(evidenceDir, `chrome-profile-${suffix}`),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 1000 })
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()) })

  await page.goto(frontend, { waitUntil: 'networkidle2' })
  await page.evaluate((authToken) => localStorage.setItem('token', authToken), token)
  await page.reload({ waitUntil: 'networkidle2' })
  await page.goto(`${frontend}/editor/${portfolioId}`, { waitUntil: 'networkidle2' })
  await page.waitForFunction(() => document.body.innerText.includes('Gemini UI Verification'), { timeout: 20000 })

  const aboutResponsePromise = page.waitForResponse((response) => response.url().includes('/ai/improve-description') && response.request().postData()?.includes('about_summary') && response.status() === 200, { timeout: 90000 })
  await clickButton(page, 'Improve with AI')
  const aboutResponse = await aboutResponsePromise
  const aboutResult = (await aboutResponse.json()).result
  assert.ok(typeof aboutResult === 'string' && aboutResult.trim())
  await page.waitForFunction((text) => [...document.querySelectorAll('textarea')].some((element) => element.value === text), { timeout: 10000 }, aboutResult)
  await page.screenshot({ path: path.join(evidenceDir, 'about-me-real-gemini.png'), fullPage: true })

  const projectResponsePromise = page.waitForResponse((response) => response.url().includes('/ai/improve-description') && response.request().postData()?.includes('project_description') && response.status() === 200, { timeout: 90000 })
  await clickButton(page, 'Polish Description')
  const projectResponse = await projectResponsePromise
  const projectResult = (await projectResponse.json()).result
  assert.ok(typeof projectResult === 'string' && projectResult.trim())
  await page.waitForFunction((text) => [...document.querySelectorAll('textarea')].some((element) => element.value === text), { timeout: 10000 }, projectResult)
  await page.screenshot({ path: path.join(evidenceDir, 'project-description-real-gemini.png'), fullPage: true })

  await clickButton(page, 'Save')
  await page.waitForFunction(async ({ api, id, aboutText, projectText }) => {
    const response = await fetch(`${api}/portfolios/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    if (!response.ok) return false
    const result = await response.json()
    const saved = result.portfolio
    return saved?.about?.summary === aboutText && saved?.projects?.[0]?.description === projectText
  }, { timeout: 15000 }, { api, id: portfolioId, aboutText: aboutResult, projectText: projectResult })

  await page.goto(`${frontend}/resume?id=${portfolioId}`, { waitUntil: 'networkidle2' })
  await page.waitForFunction(() => document.body.innerText.includes('AI Resume Summary'), { timeout: 20000 })
  const resumeResponsePromise = page.waitForResponse((response) => response.url().includes('/ai/generate-summary') && response.status() === 200, { timeout: 90000 })
  await clickButton(page, 'AI Resume Summary')
  const resumeResponse = await resumeResponsePromise
  const resumeResult = (await resumeResponse.json()).summary
  assert.ok(typeof resumeResult === 'string' && resumeResult.trim())
  await page.waitForFunction((text) => document.querySelector('#printable-resume')?.innerText.includes(text), { timeout: 10000 }, resumeResult)
  await page.screenshot({ path: path.join(evidenceDir, 'resume-summary-real-gemini.png'), fullPage: true })

  assert.deepEqual(pageErrors, [], `Browser console errors: ${pageErrors.join('; ')}`)
  console.log(JSON.stringify({
    model: 'gemini-3.5-flash-lite',
    actualBackendResponses: { aboutMe: aboutResponse.status(), projectDescription: projectResponse.status(), resumeSummary: resumeResponse.status() },
    frontendFieldsUpdated: { aboutMe: true, projectDescription: true, resumePreview: true },
    savedBackToIsolatedPortfolio: true,
    consoleErrors: pageErrors.length,
    screenshots: ['about-me-real-gemini.png', 'project-description-real-gemini.png', 'resume-summary-real-gemini.png'],
  }, null, 2))
} finally {
  if (browser) await browser.close().catch(() => {})
  if (token && portfolioId) await request(`/portfolios/${portfolioId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
  if (token && !accountDeleted) {
    const deletion = await request('/auth/account', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
    accountDeleted = Boolean(deletion && deletion.status >= 200 && deletion.status < 300)
  }
  console.log(JSON.stringify({ disposableAccountDeleted: accountDeleted }))
}
