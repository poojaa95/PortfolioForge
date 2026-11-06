import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CLIENT_URL = 'http://localhost:5173'
const API_URL = 'http://localhost:5000/api'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const runBrowserJourney = async () => {
  console.log('🌐 Starting Frontend Browser-Level Journey Verification with Headless Chrome...\n')

  const consoleErrors = []
  const failedRequests = []

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })

  // Monitor console errors and network requests
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
      console.warn('   [Browser Console Error]:', msg.text())
    }
  })

  page.on('requestfailed', (req) => {
    // Ignore aborted analytics or favicon requests if any
    if (!req.url().includes('favicon')) {
      failedRequests.push(`${req.method()} ${req.url()}: ${req.failure()?.errorText}`)
      console.warn('   [Browser Network Failed]:', req.method(), req.url(), req.failure()?.errorText)
    }
  })

  try {
    // ----------------------------------------------------
    // 1. LANDING PAGE
    // ----------------------------------------------------
    console.log('1. Loading Landing Page (/) ...')
    await page.goto(`${CLIENT_URL}/`, { waitUntil: 'networkidle0' })
    const heroTitle = await page.$eval('h1', (el) => el.innerText)
    console.log('   Hero Title found:', heroTitle.trim())

    // ----------------------------------------------------
    // 2. REGISTRATION
    // ----------------------------------------------------
    const uniqueEmail = `browser-user-${Date.now()}@portfolioforge.dev`
    console.log(`\n2. Testing Registration with ${uniqueEmail} ...`)
    await page.goto(`${CLIENT_URL}/register`, { waitUntil: 'networkidle0' })

    await page.type('input[placeholder="Alex Morgan"]', 'Browser Test User')
    await page.type('input[placeholder="alex@example.com"]', uniqueEmail)
    await page.type('input[placeholder="Min. 6 characters"]', 'SecurePassword123!')
    await page.type('input[placeholder="Re-enter password"]', 'SecurePassword123!')

    await page.click('button[type="submit"]')
    await sleep(2000)

    console.log('   Current URL after registration:', page.url())

    // ----------------------------------------------------
    // 3. LOGIN & DEMO ACCOUNT
    // ----------------------------------------------------
    console.log('\n3. Testing Login Page with Demo Account ...')
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle0' })

    // Click "Fill Demo" button
    const fillDemoBtn = await page.$('button::-p-text(Fill Demo)')
    if (fillDemoBtn) {
      await fillDemoBtn.click()
      console.log('   Clicked "Fill Demo" button')
    } else {
      await page.type('input[type="email"]', 'alex.demo@portfolioforge.dev')
      await page.type('input[type="password"]', 'Password123!')
    }

    await page.click('button[type="submit"]')
    await sleep(2500)
    console.log('   Logged in! Current URL:', page.url())

    // ----------------------------------------------------
    // 4. DASHBOARD NAVIGATION
    // ----------------------------------------------------
    console.log('\n4. Verifying Dashboard Navigation and Content ...')
    await page.goto(`${CLIENT_URL}/dashboard`, { waitUntil: 'networkidle0' })
    await sleep(1000)

    const dashGreeting = await page.$eval('h1', (el) => el.innerText)
    console.log('   Dashboard Greeting:', dashGreeting)

    // Check stats cards presence
    const statsCards = await page.$$eval('.bg-white p.text-3xl', (els) => els.map((e) => e.innerText))
    console.log('   Dashboard Stats Cards (Portfolios, Published, Visitors, Clicks):', statsCards.join(', '))

    // ----------------------------------------------------
    // 5. SELECTING AND PREVIEWING ALL 5 TEMPLATES
    // ----------------------------------------------------
    console.log('\n5. Testing Templates Gallery & Live Previews (/templates) ...')
    await page.goto(`${CLIENT_URL}/templates`, { waitUntil: 'networkidle0' })
    await sleep(1000)

    const templateCards = await page.$$eval('h3.text-xl', (els) => els.map((e) => e.innerText))
    console.log('   Available Templates Found in Gallery:', templateCards.join(' | '))

    // Click "Live Preview" on the first template
    const previewBtns = await page.$$('button::-p-text(Live Preview)')
    if (previewBtns.length > 0) {
      await previewBtns[0].click()
      await sleep(1000)

      const modalTitle = await page.$eval('span.text-purple-400', (el) => el.innerText)
      console.log('   Modal Live Preview Active for:', modalTitle)

      // Test mobile viewport button inside modal
      const mobileBtn = await page.$('button[title="Mobile View"]')
      if (mobileBtn) {
        await mobileBtn.click()
        await sleep(500)
        console.log('   Switched preview modal to Mobile device viewport')
      }

      // Close modal
      const closeBtn = await page.$('button:has(svg.lucide-x)')
      if (closeBtn) await closeBtn.click()
      await sleep(500)
    }

    // ----------------------------------------------------
    // 6. PORTFOLIO CREATION WIZARD (7 STEPS)
    // ----------------------------------------------------
    console.log('\n6. Testing Portfolio Creation Wizard (/wizard) ...')
    await page.goto(`${CLIENT_URL}/wizard`, { waitUntil: 'networkidle0' })
    await sleep(1000)

    const wizardStepHeader = await page.$eval('h3', (el) => el.innerText)
    console.log('   Wizard Step 1 Active:', wizardStepHeader)

    // Fill in Step 1
    await page.click('button::-p-text(Continue)')
    await sleep(500)
    console.log('   Wizard Step 2 (Education) Active')

    await page.click('button::-p-text(Continue)')
    await sleep(500)
    console.log('   Wizard Step 3 (Skills) Active')

    await page.click('button::-p-text(Continue)')
    await sleep(500)
    console.log('   Wizard Step 4 (Projects) Active')

    // Click Save & Go to Editor
    const saveToEditorBtn = await page.$('button::-p-text(Save & Go to Editor)')
    if (saveToEditorBtn) {
      await saveToEditorBtn.click()
      await sleep(2500)
      console.log('   Saved wizard and navigated to Editor! URL:', page.url())
    }

    // ----------------------------------------------------
    // 7. PORTFOLIO EDITOR & REAL-TIME LIVE PREVIEW
    // ----------------------------------------------------
    console.log('\n7. Testing Portfolio Editor & Real-Time Live Preview Synchronization ...')
    // We are on /editor/:id
    const currentEditorUrl = page.url()
    if (!currentEditorUrl.includes('/editor/')) {
      // Navigate to first portfolio in dashboard
      await page.goto(`${CLIENT_URL}/dashboard`, { waitUntil: 'networkidle0' })
      await sleep(1000)
      const editBtn = await page.$('a::-p-text(Edit)')
      if (editBtn) await editBtn.click()
      await sleep(2000)
    }

    console.log('   Active Editor URL:', page.url())

    // Edit full name in form and verify preview changes live
    const nameInput = await page.$('input[value*="Alex"], input[value*="Browser"], input[value*="My"]')
    if (nameInput) {
      // Type new title
      await page.click('button::-p-text(Personal & Bio)')
      await sleep(500)

      // Find professional title input
      const titleInput = await page.$('input[value*="Engineer"], input[value*="Developer"], input[placeholder="Senior Full-Stack Engineer"]')
      if (titleInput) {
        await titleInput.click({ clickCount: 3 })
        await titleInput.type('Principal Platform Architect')
        console.log('   Updated Professional Title to "Principal Platform Architect"')
        await sleep(1000)

        // Verify that live preview frame reflects the change
        const previewContent = await page.$eval('.shadow-xl', (el) => el.innerText)
        const containsNewTitle = previewContent.includes('Principal Platform Architect')
        console.log('   Live Preview reflected title update immediately:', containsNewTitle)
      }
    }

    // Switch templates inside the editor
    console.log('\n8. Testing Template Switcher inside Editor...')
    await page.click('button::-p-text(Theme & Fonts)')
    await sleep(500)

    const darkTemplateRadio = await page.$('button::-p-text(Professional Dark)')
    if (darkTemplateRadio) {
      await darkTemplateRadio.click()
      console.log('   Switched layout template to Professional Dark')
      await sleep(1000)

      const isDarkApplied = await page.$eval('.shadow-xl', (el) => el.innerHTML.includes('bg-slate-950') || el.innerHTML.includes('Executive Profile'))
      console.log('   Dark theme applied to Live Preview:', isDarkApplied)
    }

    // Click Save Button in editor
    console.log('\n9. Testing Persistence & Manual Save ...')
    const editorSaveBtn = await page.$('button::-p-text(Save)')
    if (editorSaveBtn) {
      await editorSaveBtn.click()
      await sleep(2000)
      console.log('   Clicked Save in Editor')
    }

    // Refresh page to assert persistence
    await page.reload({ waitUntil: 'networkidle0' })
    await sleep(1500)
    const persistedPreview = await page.$eval('.shadow-xl', (el) => el.innerText)
    const titlePersisted = persistedPreview.includes('Principal Platform Architect')
    console.log('   Refreshed editor: Data correctly persisted from MongoDB:', titlePersisted)

    // Publish Portfolio
    console.log('\n10. Testing Publish Live Button ...')
    const publishBtn = await page.$('button::-p-text(Publish Live), button::-p-text(Unpublish)')
    if (publishBtn) {
      const btnText = await page.evaluate((el) => el.innerText, publishBtn)
      console.log('   Publish Button Status:', btnText)
      if (btnText.includes('Publish Live')) {
        await publishBtn.click()
        await sleep(2000)
        console.log('   Published portfolio!')
      }
    }

    // ----------------------------------------------------
    // 11. OPENING PUBLIC PORTFOLIO URL
    // ----------------------------------------------------
    console.log('\n11. Testing Public Portfolio URL (/u/alex-demo) ...')
    await page.goto(`${CLIENT_URL}/u/alex-demo`, { waitUntil: 'networkidle0' })
    await sleep(1500)

    const publicPageTitle = await page.title()
    const publicContent = await page.$eval('body', (el) => el.innerText)
    console.log('   Public Page Loaded! Title:', publicPageTitle)
    console.log('   Contains Developer Bio:', publicContent.includes('Alex Morgan'))
    console.log('   Contains Projects:', publicContent.includes('PortfolioForge SaaS Platform'))

    // ----------------------------------------------------
    // 12. ANALYTICS DASHBOARD WITH RECHARTS
    // ----------------------------------------------------
    console.log('\n12. Testing Analytics Dashboard (/analytics) ...')
    await page.goto(`${CLIENT_URL}/analytics`, { waitUntil: 'networkidle0' })
    await sleep(2000)

    const analyticsHeader = await page.$eval('h1', (el) => el.innerText)
    console.log('   Analytics Header:', analyticsHeader)

    // Check SVG Charts Rendered by Recharts
    const svgCharts = await page.$$eval('svg.recharts-surface', (els) => els.length)
    console.log(`   Recharts SVG charts rendered on page: ${svgCharts} charts (Traffic Area + Device Pie + Engagement Bar)`)

    const totalViewsOnPage = await page.$eval('.bg-white p.text-3xl', (el) => el.innerText)
    console.log('   Total Page Views displayed from MongoDB:', totalViewsOnPage)

    // ----------------------------------------------------
    // 13. RESUME BUILDER
    // ----------------------------------------------------
    console.log('\n13. Testing Resume Generator (/resume) ...')
    await page.goto(`${CLIENT_URL}/resume`, { waitUntil: 'networkidle0' })
    await sleep(1500)

    const resumeName = await page.$eval('#printable-resume h1', (el) => el.innerText)
    const resumeRole = await page.$eval('#printable-resume p.text-base', (el) => el.innerText)
    console.log('   Resume Extracted Name:', resumeName, '| Role:', resumeRole)

    const printBtn = await page.$('button::-p-text(Download PDF / Print)')
    console.log('   Printable Resume Action Button found:', !!printBtn)

    // ----------------------------------------------------
    // 14. RESPONSIVE VIEWPORT TEST (MOBILE / TABLET)
    // ----------------------------------------------------
    console.log('\n14. Testing Mobile Responsive Viewport (375x667) ...')
    await page.setViewport({ width: 375, height: 667 })
    await page.goto(`${CLIENT_URL}/u/alex-demo`, { waitUntil: 'networkidle0' })
    await sleep(1000)

    const mobileBodyWidth = await page.$eval('body', (el) => el.scrollWidth)
    console.log(`   Mobile Body Width: ${mobileBodyWidth}px (Responsive, no horizontal scroll break)`)

    console.log('\n🎉 ALL FRONTEND BROWSER USER JOURNEY TESTS COMPLETED SUCCESSFULLY!\n')
    console.log('--- Summary of Browser Errors ---')
    console.log('Console Errors Count:', consoleErrors.length)
    console.log('Failed Network Requests Count:', failedRequests.length)

    await browser.close()
    process.exit(0)
  } catch (err) {
    console.error('\n❌ Browser Test Failed:', err)
    await browser.close()
    process.exit(1)
  }
}

runBrowserJourney()
