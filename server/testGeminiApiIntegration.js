import assert from 'node:assert/strict'

const api = process.env.API_BASE_URL || 'http://127.0.0.1:53195/api'
const database = new URL(process.env.MONGO_URI || 'mongodb://localhost/').pathname.replace(/^\//, '').split('?')[0]
if (!/^portfolioforge_(audit|test)/i.test(database)) {
  throw new Error('Refusing to run: MONGO_URI must select an isolated portfolioforge_audit* or portfolioforge_test* database')
}
if (!['127.0.0.1', 'localhost', '::1'].includes(new URL(api).hostname)) {
  throw new Error('Refusing to run: API_BASE_URL must point to a loopback backend')
}

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
let token = ''
let accountDeleted = false

const request = async (path, options = {}) => {
  const response = await fetch(`${api}${path}`, options)
  const body = await response.json().catch(() => ({}))
  return { status: response.status, body }
}

try {
  const registration = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Gemini API Verification', email: `gemini-api-${suffix}@example.test`, password: `Audit-${suffix}-Pass!` }),
  })
  assert.equal(registration.status, 201, `Test account registration failed (${registration.status})`)
  token = registration.body.token
  assert.ok(token, 'Registration did not return an auth token')

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const cases = [
    {
      name: 'about_me',
      path: '/ai/improve-description',
      body: { type: 'about_summary', currentText: 'I build reliable web products.', role: 'Software Engineer', skills: ['JavaScript', 'React'] },
      result: (body) => body.result,
    },
    {
      name: 'project_description',
      path: '/ai/improve-description',
      body: { type: 'project_description', currentText: 'A dashboard for organizing volunteer shifts.', role: 'Software Engineer', skills: ['React', 'Node.js'] },
      result: (body) => body.result,
    },
    {
      name: 'resume_summary',
      path: '/ai/generate-summary',
      body: { role: 'Software Engineer', skills: ['JavaScript', 'React', 'Node.js'] },
      result: (body) => body.summary,
    },
    {
      name: 'content_improvement',
      path: '/ai/improve-description',
      body: { type: 'content_improvement', currentText: 'I make software for teams.', role: 'Software Engineer', skills: ['React'] },
      result: (body) => body.result,
    },
  ]

  const results = []
  for (const item of cases) {
    const response = await request(item.path, { method: 'POST', headers, body: JSON.stringify(item.body) })
    assert.equal(response.status, 200, `${item.name} failed with HTTP ${response.status}: ${response.body.message || 'no message'}`)
    const generatedText = item.result(response.body)
    assert.equal(typeof generatedText, 'string', `${item.name} returned a non-text result`)
    assert.ok(generatedText.trim().length > 0, `${item.name} returned empty text`)
    results.push({ useCase: item.name, httpStatus: response.status, generatedCharacters: generatedText.length })
  }

  const deletion = await request('/auth/account', { method: 'DELETE', headers })
  accountDeleted = deletion.status >= 200 && deletion.status < 300
  assert.ok(accountDeleted, `Disposable account cleanup failed (${deletion.status})`)

  console.log(JSON.stringify({ model: 'gemini-3.5-flash-lite', endpointVersion: 'v1beta GenerateContent', results, disposableAccountDeleted: accountDeleted }, null, 2))
} finally {
  if (token && !accountDeleted) {
    const cleanup = await request('/auth/account', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
    if (!cleanup || cleanup.status < 200 || cleanup.status >= 300) console.error('Disposable Gemini test account cleanup needs manual review in the isolated audit DB.')
  }
}
