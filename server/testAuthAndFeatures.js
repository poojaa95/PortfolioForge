import 'dotenv/config'
import crypto from 'node:crypto'
import mongoose from 'mongoose'
import User from './models/User.js'

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api'

const testAuthAndAdvanced = async () => {
  console.log('🔒 Testing Authentication, Security, & Edge Cases...\n')

  try {
    const databaseName = new URL(process.env.MONGO_URI || 'mongodb://localhost/').pathname.replace(/^\//, '').split('?')[0]
    if (!/^portfolioforge_(audit|test)/i.test(databaseName)) {
      throw new Error('Refusing to run: MONGO_URI must point to an isolated portfolioforge_audit* or portfolioforge_test* database')
    }

    // 1. Test Demo User Login
    console.log('1. Testing Login with Demo Account (alex.demo@portfolioforge.dev)...')
    const demoLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.demo@portfolioforge.dev',
        password: 'Password123!',
      }),
    })
    const demoLoginJson = await demoLoginRes.json()
    if (!demoLoginJson.success) throw new Error('Demo login failed')
    const demoToken = demoLoginJson.token
    console.log('   Demo login success! User:', demoLoginJson.user.name)

    // 2. Test fetching Demo User portfolios
    console.log('\n2. Testing GET /api/portfolios for Demo User...')
    const portRes = await fetch(`${BASE_URL}/portfolios`, {
      headers: { Authorization: `Bearer ${demoToken}` },
    })
    const portJson = await portRes.json()
    console.log(`   Found ${portJson.count} portfolios for demo user:`)
    portJson.portfolios.forEach((p) => {
      console.log(`   - "${p.title}" | Template: ${p.templateId} | Slug: /u/${p.slug} | Views: ${p.stats?.views} | Clicks: ${p.stats?.projectClicks}`)
    })

    // 3. Test public access to both seeded portfolios
    console.log('\n3. Testing Public Access to Seeded Portfolios...')
    const p1Res = await fetch(`${BASE_URL}/public/alex-demo`)
    const p1Json = await p1Res.json()
    console.log('   /u/alex-demo accessible:', p1Json.success, '| Title:', p1Json.portfolio?.title)

    const p2Res = await fetch(`${BASE_URL}/public/alex-creative`)
    const p2Json = await p2Res.json()
    console.log('   /u/alex-creative accessible:', p2Json.success, '| Title:', p2Json.portfolio?.title)

    // 4. Test Forgot Password and Reset Password Flow
    console.log('\n4. Testing Forgot Password Flow...')
    const forgotEmail = `reset-test-${Date.now()}@portfolioforge.dev`
    // First register user
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Reset Tester',
        email: forgotEmail,
        password: 'OldPassword123!',
      }),
    })
    const regJson = await regRes.json()
    const userToken = regJson.token

    // Request forgot password
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail }),
    })
    const forgotJson = await forgotRes.json()
    console.log('   Forgot Password Response:', forgotJson.message)
    if (!forgotRes.ok || forgotJson.resetToken) throw new Error('Forgot-password exposed a reset token or returned an error')

    const unknownForgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `unknown-${Date.now()}@portfolioforge.dev` }),
    })
    const unknownForgotJson = await unknownForgotRes.json()
    if (unknownForgotRes.status !== forgotRes.status || unknownForgotJson.message !== forgotJson.message || unknownForgotJson.resetToken) {
      throw new Error('Forgot-password responses differ for existing and unknown accounts')
    }

    // Email delivery is not configured. Seed a hashed reset token directly in
    // the isolated test database to exercise reset validation/one-time use.
    await mongoose.connect(process.env.MONGO_URI)
    const resetUser = await User.findOne({ email: forgotEmail })
    if (!resetUser) throw new Error('Registered reset test account was not found in isolated database')
    const resetToken = crypto.randomBytes(32).toString('hex')
    resetUser.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    resetUser.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000)
    await resetUser.save()
    if (resetUser.resetPasswordToken === resetToken || !/^[a-f0-9]{64}$/.test(resetUser.resetPasswordToken)) {
      throw new Error('Reset token was not stored as a SHA-256 hash')
    }

    const invalidTokenRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'not-a-valid-reset-token', newPassword: 'BrandNewPassword123!' }),
    })
    if (invalidTokenRes.status !== 400) throw new Error('Invalid reset token was not rejected')

    // Reset password with token
    console.log('   Resetting password with token...')
    const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword: 'BrandNewPassword123!',
      }),
    })
    const resetJson = await resetRes.json()
    console.log('   Reset Password Response:', resetJson.message)
    if (!resetRes.ok) throw new Error('Valid hashed reset token was rejected')

    const reusedTokenRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, newPassword: 'AnotherPassword123!' }),
    })
    if (reusedTokenRes.status !== 400) throw new Error('Successful reset token was not invalidated')

    const expiredToken = crypto.randomBytes(32).toString('hex')
    resetUser.resetPasswordToken = crypto.createHash('sha256').update(expiredToken).digest('hex')
    resetUser.resetPasswordExpire = new Date(Date.now() - 1000)
    await resetUser.save()
    const expiredTokenRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: expiredToken, newPassword: 'AnotherPassword123!' }),
    })
    if (expiredTokenRes.status !== 400) throw new Error('Expired reset token was not rejected')

    // Verify login with NEW password
    const verifyLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: forgotEmail,
        password: 'BrandNewPassword123!',
      }),
    })
    const verifyJson = await verifyLogin.json()
    if (!verifyJson.success) throw new Error('Login with new password failed')
    console.log('   Login with updated password successful!')

    const pendingToken = crypto.randomBytes(32).toString('hex')
    resetUser.resetPasswordToken = crypto.createHash('sha256').update(pendingToken).digest('hex')
    resetUser.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000)
    await resetUser.save()
    const changeRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ currentPassword: 'BrandNewPassword123!', newPassword: 'ChangedAgain123!' }),
    })
    if (!changeRes.ok) throw new Error('Authenticated password change failed')
    const changedResetUser = await User.findById(resetUser._id)
    if (changedResetUser.resetPasswordToken || changedResetUser.resetPasswordExpire) throw new Error('Password change did not clear pending reset state')
    const pendingTokenRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: pendingToken, newPassword: 'WouldReuse123!' }),
    })
    if (pendingTokenRes.status !== 400) throw new Error('Password change left a usable reset token')
    const finalLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail, password: 'ChangedAgain123!' }),
    })
    if (!(await finalLogin.json()).success) throw new Error('Login after password change failed')
    console.log('   Invalid/expired/reused tokens rejected; password change invalidated pending reset state.')

    // 5. Test Slug Availability Check
    console.log('\n5. Testing GET /api/portfolios/check-slug/:slug ...')
    const takenSlugRes = await fetch(`${BASE_URL}/portfolios/check-slug/alex-demo`)
    const takenSlugJson = await takenSlugRes.json()
    console.log('   Slug "alex-demo" available:', takenSlugJson.available, '(Expected false)')
    if (takenSlugJson.available !== false) throw new Error('Slug "alex-demo" should be reported as taken')

    const freeSlug = `my-unique-slug-${Date.now()}`
    const freeSlugRes = await fetch(`${BASE_URL}/portfolios/check-slug/${freeSlug}`)
    const freeSlugJson = await freeSlugRes.json()
    console.log(`   Slug "${freeSlug}" available:`, freeSlugJson.available, '(Expected true)')
    if (freeSlugJson.available !== true) throw new Error('Free slug should be reported as available')

    console.log('\n✅ ALL AUTHENTICATION, SECURITY, AND ADVANCED TESTS PASSED!\n')
  } catch (err) {
    console.error('\n❌ Test Error:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect().catch(() => {})
  }
}

testAuthAndAdvanced()
