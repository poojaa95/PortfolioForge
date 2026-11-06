import 'dotenv/config'

const API = process.env.API_BASE_URL || 'http://localhost:5000/api'
const check = (condition, message) => { if (!condition) throw new Error(message) }
const request = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, options)
  const body = await response.json()
  return { response, body }
}

const run = async () => {
  const databaseName = new URL(process.env.MONGO_URI || 'mongodb://localhost/').pathname.replace(/^\//, '').split('?')[0]
  if (!/^portfolioforge_(audit|test)/i.test(databaseName)) {
    throw new Error('Refusing to run: MONGO_URI must point to an isolated portfolioforge_audit* or portfolioforge_test* database')
  }

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const { response: registerResponse, body: registered } = await request('/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Phase Three Test', email: `phase3-${suffix}@portfolioforge.dev`, password: 'PhaseThree123!' }),
  })
  check(registerResponse.ok && registered.token, 'Test account registration failed')
  const ownerHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${registered.token}` }
  const otherResponse = await request('/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Other Test', email: `other-${suffix}@portfolioforge.dev`, password: 'PhaseThree123!' }),
  })
  check(otherResponse.response.ok, 'Second test account registration failed')
  const otherHeaders = { Authorization: `Bearer ${otherResponse.body.token}` }
  const created = await request('/portfolios', {
    method: 'POST', headers: ownerHeaders,
    body: JSON.stringify({ title: 'Phase Three Portfolio', slug: `phase-three-${suffix}`, personalInfo: { fullName: 'Phase Three Test' }, projects: [{ title: 'Real Project', description: 'Test project', liveDemoUrl: 'https://example.com' }] }),
  })
  check(created.response.ok, 'Portfolio creation failed')
  const id = created.body.portfolio._id
  const slug = created.body.portfolio.slug

  check((await request(`/portfolios/${id}`, { headers: otherHeaders })).response.status === 403, 'Another account accessed an owned portfolio')
  check((await request(`/portfolios/${id}`, { method: 'PUT', headers: otherHeaders, body: JSON.stringify({ projects: [{ title: 'Unauthorized image attachment', projectImage: 'https://example.invalid/foreign-image.png' }] }) })).response.status === 403, 'Another account attached an image to a portfolio it does not own')

  const second = await request('/portfolios', {
    method: 'POST', headers: ownerHeaders,
    body: JSON.stringify({ title: 'Second Portfolio', slug: `phase-three-${suffix}` }),
  })
  check(second.response.ok && second.body.portfolio.slug !== slug, 'Duplicate slug was not resolved uniquely')

  check((await request(`/portfolios/${id}/versions`, { headers: ownerHeaders })).response.ok, 'Owner cannot read version history')
  check((await request(`/portfolios/${id}/versions`, { headers: otherHeaders })).response.status === 404, 'Another account read private version history')
  const edited = await request(`/portfolios/${id}`, { method: 'PUT', headers: ownerHeaders, body: JSON.stringify({ title: 'Saved Version', saveSnapshot: true, snapshotTitle: 'Saved Version' }) })
  check(edited.response.ok, 'Snapshot update failed')
  const versionList = await request(`/portfolios/${id}/versions`, { headers: ownerHeaders })
  const initial = versionList.body.versions.find((version) => version.title === 'Initial Version')
  check(initial, 'Initial snapshot missing')
  const restored = await request(`/portfolios/${id}/restore/${initial._id}`, { method: 'POST', headers: ownerHeaders })
  check(restored.response.ok && restored.body.portfolio.title === 'Phase Three Portfolio', 'Restoring a version failed')
  check(restored.body.portfolio.slug === slug, 'Restore unexpectedly changed the public slug')

  await request(`/portfolios/${id}/publish`, { method: 'POST', headers: ownerHeaders })
  check((await request(`/public/${slug}`)).response.ok, 'Published public portfolio is inaccessible without auth')
  await request(`/portfolios/${id}`, { method: 'PUT', headers: ownerHeaders, body: JSON.stringify({ visibility: 'private' }) })
  check((await request(`/public/${slug}`)).response.status === 403, 'Private portfolio is publicly accessible')
  check((await request(`/analytics/${id}/view`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': `Phase3Agent/${suffix}` }, body: '{}' })).response.status === 404, 'Private portfolio accepted a view event')
  await request(`/portfolios/${id}`, { method: 'PUT', headers: ownerHeaders, body: JSON.stringify({ visibility: 'unlisted' }) })
  check((await request(`/public/${slug}`)).response.ok, 'Unlisted portfolio should be available by direct link')

  const view = () => request(`/analytics/${id}/view`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': `Phase3Agent/${suffix}` }, body: JSON.stringify({ referrer: 'direct' }) })
  await view(); await view()
  const click = await request(`/analytics/${id}/project-click`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': `Phase3Agent/${suffix}` },
    body: JSON.stringify({ projectId: created.body.portfolio.projects[0]._id, linkType: 'demo' }),
  })
  check(click.response.ok, 'Real project click was rejected')
  check((await request(`/analytics/${id}`, { headers: otherHeaders })).response.status === 403, 'Another account accessed analytics')
  const analytics = await request(`/analytics/${id}`, { headers: ownerHeaders })
  check(analytics.response.ok && analytics.body.monthlyData?.length === 12, 'Monthly analytics response is incomplete')
  check(analytics.body.stats.totalViews === 1 && analytics.body.stats.uniqueVisitors === 1, 'Repeat view was not deduplicated')
  check(analytics.body.stats.totalProjectClicks === 1, 'Project click was not persisted')

  const duplicate = await request(`/portfolios/${id}/duplicate`, { method: 'POST', headers: ownerHeaders })
  check(duplicate.response.ok && duplicate.body.portfolio.published === false, 'Portfolio duplication failed or published the copy')
  check((await request(`/portfolios/${id}/duplicate`, { method: 'POST', headers: otherHeaders })).response.status === 403, 'Another account duplicated a portfolio')
  const unpublished = await request(`/portfolios/${id}/unpublish`, { method: 'POST', headers: ownerHeaders })
  check(unpublished.response.ok && (await request(`/public/${slug}`)).response.status === 403, 'Unpublishing did not remove public access')

  if (!process.env.GEMINI_API_KEY) {
    const unavailable = await request('/ai/improve-description', { method: 'POST', headers: ownerHeaders, body: JSON.stringify({ type: 'project_description', currentText: 'Sample' }) })
    check(unavailable.response.status === 503 && unavailable.body.message.includes('GEMINI_API_KEY'), 'Missing Gemini configuration was not reported clearly')
  }

  // Remove portfolios created by this test account; test accounts are isolated by unique email.
  for (const portfolio of [created.body.portfolio, second.body.portfolio, duplicate.body.portfolio]) {
    await request(`/portfolios/${portfolio._id}`, { method: 'DELETE', headers: ownerHeaders })
  }
  console.log('PASS: privacy and publishing, unique slugs, deduplicated Mongo analytics, monthly aggregation, version restore, duplicate portfolio, Gemini availability, and portfolio ownership (including image attachment updates)')
}

run().catch((error) => { console.error(`FAIL: ${error.message}`); process.exit(1) })
