import 'dotenv/config'

const API = process.env.API_BASE_URL || 'http://localhost:5000/api'
const databaseName = new URL(process.env.MONGO_URI || 'mongodb://localhost/').pathname.replace(/^\//, '').split('?')[0]
if (!/^portfolioforge_(audit|test)/i.test(databaseName)) throw new Error('Refusing to run: MONGO_URI must point to an isolated portfolioforge_audit* or portfolioforge_test* database')

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const request = async (path, { body, token, method = 'GET' } = {}) => {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return { response, body: await response.json() }
}
const check = (condition, message) => { if (!condition) throw new Error(message) }

const run = async () => {
  const ownerResult = await request('/auth/register', { method: 'POST', body: { name: 'Resume Audit', email: `resume-audit-${suffix}@portfolioforge.dev`, password: 'ResumeAudit123!' } })
  check(ownerResult.response.ok && ownerResult.body.token, 'Audit account registration failed')
  const otherResult = await request('/auth/register', { method: 'POST', body: { name: 'Resume Other', email: `resume-other-${suffix}@portfolioforge.dev`, password: 'ResumeAudit123!' } })
  check(otherResult.response.ok && otherResult.body.token, 'Second audit account registration failed')
  const owner = ownerResult.body.token
  const other = otherResult.body.token
  const created = await request('/portfolios', { method: 'POST', token: owner, body: { title: 'Resume Isolation Fixture', personalInfo: { fullName: 'Audit User', title: 'Engineer', email: 'audit@example.test' }, education: [{ degree: 'BSc', college: 'Audit College' }], projects: [{ title: 'Portfolio App', description: 'Existing portfolio project' }] } })
  check(created.response.ok && created.body.portfolio?._id, 'Portfolio fixture creation failed')
  const id = created.body.portfolio._id
  const before = await request(`/portfolios/${id}`, { token: owner })
  const legacy = await request(`/resume/${id}`, { token: owner })
  check(legacy.response.ok && legacy.body.source === 'portfolio_legacy' && legacy.body.resume.personalInfo.fullName === 'Audit User', 'Backward-compatible portfolio resume fallback failed')

  const sections = ['summary', 'experience', 'education', 'projects', 'skills', 'certifications', 'achievements', 'languages', 'customSections']
  const saved = await request(`/resume/${id}`, { method: 'PUT', token: owner, body: {
    personalInfo: { fullName: 'Resume Only Name', title: 'Resume Engineer', email: 'resume@example.test', phone: '555-0100', location: 'Remote', website: 'https://resume.example.test' },
    socialLinks: { github: 'https://github.com/audit', linkedin: 'https://linkedin.com/in/audit' },
    summary: 'Saved resume summary',
    experience: [{ jobRole: 'Developer', companyName: 'Resume Co', description: 'Built product features' }],
    education: [{ degree: 'MSc', college: 'Resume University', grade: 'A' }],
    projects: [{ title: 'Resume Project', description: 'Separate resume project', technologies: ['React'] }],
    skills: [{ name: 'React', category: 'Frontend' }],
    certifications: [{ certificateName: 'Secure Coding', issuingOrganization: 'Audit Org' }],
    achievements: [{ title: 'Hackathon finalist', date: '2025' }],
    languages: [{ name: 'English', proficiency: 'Fluent' }],
    customSections: [{ title: 'Publications', entries: [{ title: 'Paper', content: 'Resume only text' }] }],
    sectionOrder: [...sections].reverse(),
    sectionVisibility: Object.fromEntries(sections.map((key) => [key, key !== 'languages'])),
  } })
  check(saved.response.ok && saved.body.success, 'Resume save failed')
  const reloaded = await request(`/resume/${id}`, { token: owner })
  check(reloaded.response.ok && reloaded.body.source === 'saved_resume', 'Saved resume was not returned after reload')
  check(reloaded.body.resume.personalInfo.fullName === 'Resume Only Name' && reloaded.body.resume.summary === 'Saved resume summary', 'Saved resume personal data or summary did not persist')
  check(reloaded.body.resume.achievements?.[0]?.title === 'Hackathon finalist' && reloaded.body.resume.languages?.[0]?.name === 'English', 'Additional resume sections did not persist')
  check(reloaded.body.resume.customSections?.[0]?.entries?.[0]?.content === 'Resume only text', 'Custom section did not persist')
  check(reloaded.body.resume.sectionOrder?.[0] === 'customSections' && reloaded.body.resume.sectionVisibility?.languages === false, 'Resume order or visibility did not persist')
  const signedInAgain = await request('/auth/login', { method: 'POST', body: { email: `resume-audit-${suffix}@portfolioforge.dev`, password: 'ResumeAudit123!' } })
  check(signedInAgain.response.ok && (await request(`/resume/${id}`, { token: signedInAgain.body.token })).body.resume.customSections?.[0]?.title === 'Publications', 'Resume did not persist across login')
  const generated = await request('/resume/generate', { method: 'POST', token: owner, body: { portfolioId: id } })
  check(generated.response.ok && generated.body.resume.header.name === 'Resume Only Name' && generated.body.resume.achievements?.length === 1, 'Resume generation did not use saved resume data')

  const portfolioAfter = await request(`/portfolios/${id}`, { token: owner })
  check(portfolioAfter.response.ok && portfolioAfter.body.portfolio.personalInfo.fullName === before.body.portfolio.personalInfo.fullName && portfolioAfter.body.portfolio.projects[0].title === before.body.portfolio.projects[0].title, 'Resume save overwrote portfolio content')
  check((await request(`/resume/${id}`, { token: other })).response.status === 404, 'Another user read a private resume')
  check((await request(`/resume/${id}`, { method: 'PUT', token: other, body: { summary: 'Unauthorized' } })).response.status === 404, 'Another user modified a private resume')
  const invalid = await request(`/resume/${id}`, { method: 'PUT', token: owner, body: { sectionOrder: ['summary', 'summary'] } })
  check(invalid.response.status === 400, 'Invalid section order was accepted')
  const deletion = await request(`/portfolios/${id}`, { method: 'DELETE', token: owner })
  check(deletion.response.ok, 'Audit portfolio cleanup failed')
  check((await request(`/resume/${id}`, { token: owner })).response.status === 404, 'Resume remained accessible after portfolio deletion')
  console.log('PASS: legacy resume fallback, separate resume persistence, additional/custom sections, order/visibility, generated data, portfolio isolation, ownership, validation and delete cascade')
}

run().catch((error) => { console.error(`FAIL: ${error.message}`); process.exit(1) })
