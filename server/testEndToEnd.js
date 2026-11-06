import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from './config/db.js'

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api'

const runEndToEndTests = async () => {
  console.log('🚀 Starting PortfolioForge End-to-End System Test...\n')

  const databaseName = new URL(process.env.MONGO_URI || 'mongodb://localhost/').pathname.replace(/^\//, '').split('?')[0]
  if (!/^portfolioforge_(audit|test)/i.test(databaseName)) {
    throw new Error('Refusing to run: MONGO_URI must point to an isolated portfolioforge_audit* or portfolioforge_test* database')
  }

  let token = null
  let testUserId = null
  let portfolioId = null
  let testSlug = `e2e-alex-${Date.now()}`

  try {
    // 1. Health check
    console.log('1. Testing /api/health ...')
    const healthRes = await fetch(`${BASE_URL}/health`)
    const healthJson = await healthRes.json()
    console.log('   Health Status:', healthJson.status, '| DB:', healthJson.database)
    if (healthJson.status !== 'ok') throw new Error('Health check failed')

    // 2. Templates catalog
    console.log('\n2. Testing GET /api/templates ...')
    const tplRes = await fetch(`${BASE_URL}/templates`)
    const tplJson = await tplRes.json()
    console.log(`   Fetched ${tplJson.count} templates:`, tplJson.templates?.map((t) => t.id).join(', '))
    const expectedTemplateIds = ['minimal', 'developer', 'creative', 'student', 'corporate', 'dark']
    const receivedTemplateIds = tplJson.templates?.map((template) => template.id) || []
    if (tplJson.count !== expectedTemplateIds.length || expectedTemplateIds.some((id) => !receivedTemplateIds.includes(id)) || receivedTemplateIds.length !== expectedTemplateIds.length) {
      throw new Error(`Expected six templates (${expectedTemplateIds.join(', ')}), got ${receivedTemplateIds.join(', ')}`)
    }

    // 3. User Registration
    const testEmail = `tester-${Date.now()}@portfolioforge.dev`
    console.log(`\n3. Testing POST /api/auth/register (${testEmail}) ...`)
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Tester',
        email: testEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    })
    const regJson = await regRes.json()
    if (!regJson.success) throw new Error(`Register failed: ${regJson.message}`)
    token = regJson.token
    testUserId = regJson.user.id
    console.log('   User Registered successfully. User ID:', testUserId)

    // 4. User Login
    console.log('\n4. Testing POST /api/auth/login ...')
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!',
      }),
    })
    const loginJson = await loginRes.json()
    if (!loginJson.success || !loginJson.token) throw new Error('Login failed')
    console.log('   Login successful, JWT token received.')

    // 5. Auth /me
    console.log('\n5. Testing GET /api/auth/me (Protected Route) ...')
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const meJson = await meRes.json()
    console.log('   Authenticated User:', meJson.user.name, '(', meJson.user.email, ')')

    // 6. Create Portfolio
    console.log('\n6. Testing POST /api/portfolios (Create Portfolio with Developer Template) ...')
    const createPortRes = await fetch(`${BASE_URL}/portfolios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Alex Developer Portfolio',
        slug: testSlug,
        templateId: 'developer',
        personalInfo: {
          fullName: 'Alex Tester',
          title: 'Senior Software Engineer',
          headline: 'Shipping modern web apps',
          location: 'San Francisco, CA',
        },
        projects: [{ title: 'PortfolioForge SaaS Platform', description: 'A portfolio platform.', liveDemoUrl: 'https://example.com' }],
      }),
    })
    const createPortJson = await createPortRes.json()
    if (!createPortJson.success || !createPortJson.portfolio) {
      throw new Error(`Create portfolio failed: ${createPortJson.message}`)
    }
    portfolioId = createPortJson.portfolio._id
    testSlug = createPortJson.portfolio.slug
    const newPortfolio = createPortJson.portfolio
    if (newPortfolio.projects.length !== 1 || newPortfolio.projects[0].title !== 'PortfolioForge SaaS Platform' || newPortfolio.skills.length || newPortfolio.education.length || newPortfolio.experience.length || newPortfolio.certifications.length) {
      throw new Error('A new portfolio should not contain fabricated profile entries')
    }
    console.log(`   Portfolio Created! ID: ${portfolioId} | Slug: ${testSlug}`)
    console.log('   New portfolio starts without fabricated projects, skills, education, experience, or certifications.')

    // 7. Verify Draft Status on Public URL (Should return unpublished status)
    console.log(`\n7. Testing GET /api/public/${testSlug} while in draft mode ...`)
    const draftPubRes = await fetch(`${BASE_URL}/public/${testSlug}`)
    console.log(`   HTTP Status for draft portfolio: ${draftPubRes.status} (Expected 403)`)
    if (draftPubRes.status !== 403) throw new Error('Draft portfolio should not be publicly accessible')

    // 8. Publish Portfolio
    console.log(`\n8. Testing POST /api/portfolios/${portfolioId}/publish ...`)
    const pubRes = await fetch(`${BASE_URL}/portfolios/${portfolioId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const pubJson = await pubRes.json()
    if (!pubJson.success || !pubJson.portfolio.published) throw new Error('Publish failed')
    console.log('   Portfolio Published! Live URL:', pubJson.publicUrl)

    // 9. Verify Public Access
    console.log(`\n9. Testing GET /api/public/${testSlug} after publishing (No Auth Required) ...`)
    const pubCheckRes = await fetch(`${BASE_URL}/public/${testSlug}`)
    const pubCheckJson = await pubCheckRes.json()
    if (!pubCheckJson.success || !pubCheckJson.portfolio) throw new Error('Public access failed')
    console.log('   Public Portfolio successfully returned:', pubCheckJson.portfolio.title, '| Template:', pubCheckJson.portfolio.templateId)

    // 10. Record Visitor Analytics Event (Page View)
    console.log(`\n10. Testing POST /api/analytics/${portfolioId}/view ...`)
    const viewRes = await fetch(`${BASE_URL}/analytics/${portfolioId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ referrer: 'https://google.com' }),
    })
    const viewJson = await viewRes.json()
    console.log('   View recorded:', viewJson.message)

    // 11. Record Project Click Event
    console.log(`\n11. Testing POST /api/analytics/${portfolioId}/project-click ...`)
    const clickRes = await fetch(`${BASE_URL}/analytics/${portfolioId}/project-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectTitle: 'PortfolioForge SaaS Platform',
        projectId: newPortfolio.projects[0]._id,
        linkType: 'demo',
      }),
    })
    const clickJson = await clickRes.json()
    console.log('   Project click recorded:', clickJson.message)

    // 12. Fetch Analytics Dashboard Metrics
    console.log(`\n12. Testing GET /api/analytics/${portfolioId} ...`)
    const statsRes = await fetch(`${BASE_URL}/analytics/${portfolioId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const statsJson = await statsRes.json()
    console.log('   Analytics Stats:', JSON.stringify(statsJson.stats))
    console.log('   Device Breakdown:', JSON.stringify(statsJson.deviceStats))
    console.log('   Project Click Breakdown:', JSON.stringify(statsJson.projectClickStats))
    if (statsJson.stats.totalViews < 1) throw new Error('Page view was not recorded in MongoDB analytics')
    if (statsJson.stats.totalProjectClicks < 1) throw new Error('Project click was not recorded in MongoDB analytics')

    // 13. Test AI Assistant
    console.log('\n13. Testing POST /api/ai/improve-description ...')
    const aiRes = await fetch(`${BASE_URL}/ai/improve-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'project_description',
        currentText: 'A simple portfolio builder made with react',
        role: 'Full-Stack Developer',
        skills: ['React', 'Node.js', 'MongoDB'],
      }),
    })
    const aiJson = await aiRes.json()
    if (process.env.GEMINI_API_KEY) {
      console.log('   Gemini response received')
      if (!aiJson.result) throw new Error('Gemini content generation failed')
    } else {
      console.log('   AI unavailable state:', aiJson.message)
      if (aiRes.status !== 503 || !aiJson.message?.includes('GEMINI_API_KEY')) throw new Error('AI should clearly report missing Gemini configuration')
    }

    // 14. Test Resume Generator
    console.log('\n14. Testing POST /api/resume/generate ...')
    const resumeRes = await fetch(`${BASE_URL}/resume/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        portfolioId,
        templateStyle: 'modern',
      }),
    })
    const resumeJson = await resumeRes.json()
    console.log('   Resume extracted for:', resumeJson.resume.header.name, '| Skills Count:', resumeJson.resume.skills.length)

    // 15. Test Duplicate Portfolio
    console.log(`\n15. Testing POST /api/portfolios/${portfolioId}/duplicate ...`)
    const dupRes = await fetch(`${BASE_URL}/portfolios/${portfolioId}/duplicate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const dupJson = await dupRes.json()
    console.log('   Duplicate Created:', dupJson.portfolio.title, '| Slug:', dupJson.portfolio.slug)

    // 16. Test Unpublish
    console.log(`\n16. Testing POST /api/portfolios/${portfolioId}/unpublish ...`)
    const unpubRes = await fetch(`${BASE_URL}/portfolios/${portfolioId}/unpublish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const unpubJson = await unpubRes.json()
    console.log('   Unpublish result:', unpubJson.message)

    console.log('\n🎉 ALL 16 END-TO-END TESTS PASSED SUCCESSFULLY! 🚀\n')
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message)
    process.exit(1)
  }
}

runEndToEndTests()
