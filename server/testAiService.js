import assert from 'node:assert/strict'
import { generateWithGemini, smartImproveContent } from './services/aiService.js'

const savedKey = process.env.GEMINI_API_KEY
const savedModel = process.env.GEMINI_MODEL
const savedFetch = globalThis.fetch
const mockKey = 'test-only-not-a-real-key'

const captureError = async (promise) => {
  try {
    await promise
    assert.fail('Expected operation to reject')
  } catch (error) {
    return error
  }
}

try {
  delete process.env.GEMINI_API_KEY
  globalThis.fetch = async () => assert.fail('Fetch must not run without a key')
  const missing = await captureError(generateWithGemini('test prompt'))
  assert.equal(missing.statusCode, 503)
  assert.match(missing.message, /GEMINI_API_KEY/)

  process.env.GEMINI_API_KEY = mockKey
  delete process.env.GEMINI_MODEL
  let seenRequest
  globalThis.fetch = async (url, options) => {
    seenRequest = { url: String(url), options, body: JSON.parse(options.body) }
    return Response.json({ candidates: [{ content: { parts: [{ text: 'Improved text based on provided facts.' }] } }] })
  }
  const success = await smartImproveContent({ type: 'project_description', currentText: 'Built a tool.', skills: ['React', { name: 'Node.js' }] })
  assert.equal(success, 'Improved text based on provided facts.')
  assert.equal(seenRequest.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent')
  assert.equal(seenRequest.options.headers['x-goog-api-key'], mockKey)
  assert.equal(new URL(seenRequest.url).search, '')
  assert.equal(seenRequest.body.systemInstruction.parts[0].text.includes('Preserve facts'), true)
  assert.equal(seenRequest.body.contents[0].parts[0].text.includes('React, Node.js'), true)
  assert.equal('temperature' in seenRequest.body.generationConfig, false)

  globalThis.fetch = async () => new Response(JSON.stringify({ error: { status: 'UNAUTHENTICATED' } }), { status: 403 })
  const invalidKey = await captureError(generateWithGemini('test'))
  assert.equal(invalidKey.statusCode, 502)
  assert.match(invalidKey.message, /authentication failed/i)
  assert.equal(invalidKey.message.includes(mockKey), false)

  globalThis.fetch = async () => new Response('', { status: 429 })
  const rateLimit = await captureError(generateWithGemini('test'))
  assert.equal(rateLimit.statusCode, 429)
  assert.match(rateLimit.message, /rate limit/i)

  globalThis.fetch = async () => new Response(JSON.stringify({ error: { status: 'RESOURCE_EXHAUSTED', message: 'Daily quota exceeded.' } }), { status: 429 })
  const quota = await captureError(generateWithGemini('test'))
  assert.equal(quota.statusCode, 429)
  assert.match(quota.message, /quota is exhausted/i)

  let calls = 0
  globalThis.fetch = async () => {
    calls += 1
    if (calls === 1) return new Response('', { status: 503 })
    return Response.json({ candidates: [{ content: { parts: [{ text: 'Recovered response.' }] } }] })
  }
  assert.equal(await generateWithGemini('test'), 'Recovered response.')
  assert.equal(calls, 2, 'Only one retry should be made after 503')

  calls = 0
  globalThis.fetch = async () => { calls += 1; return new Response('', { status: 503 }) }
  const unavailable = await captureError(generateWithGemini('test'))
  assert.equal(unavailable.statusCode, 503)
  assert.equal(calls, 2)

  console.log('PASS: missing key, request format, mixed skill types, invalid-key response, quota/rate-limit distinction, one 503 retry, and persistent service error')
} finally {
  globalThis.fetch = savedFetch
  if (savedKey === undefined) delete process.env.GEMINI_API_KEY
  else process.env.GEMINI_API_KEY = savedKey
  if (savedModel === undefined) delete process.env.GEMINI_MODEL
  else process.env.GEMINI_MODEL = savedModel
}
