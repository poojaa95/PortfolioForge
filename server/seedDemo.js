import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from './config/db.js'
import User from './models/User.js'
import Portfolio from './models/Portfolio.js'
import Analytics from './models/Analytics.js'
import PortfolioVersion from './models/PortfolioVersion.js'

const seed = async () => {
  try {
    const databaseName = new URL(process.env.MONGO_URI || 'mongodb://localhost/').pathname.replace(/^\//, '').split('?')[0]
    if (!/^portfolioforge_(audit|test)/i.test(databaseName)) {
      throw new Error('Refusing to seed: MONGO_URI must point to an isolated portfolioforge_audit* or portfolioforge_test* database')
    }

    await connectDB()
    console.log('Connected to MongoDB. Seeding demo user and sample portfolios...')

    const demoEmail = 'alex.demo@portfolioforge.dev'

    // Clean existing demo user data if present
    const existing = await User.findOne({ email: demoEmail })
    if (existing) {
      const portfolios = await Portfolio.find({ userId: existing._id })
      const pIds = portfolios.map((p) => p._id)
      await Analytics.deleteMany({ portfolioId: { $in: pIds } })
      await PortfolioVersion.deleteMany({ portfolioId: { $in: pIds } })
      await Portfolio.deleteMany({ userId: existing._id })
      await User.findByIdAndDelete(existing._id)
      console.log('Cleaned previous demo data.')
    }

    // Create Demo User
    const user = await User.create({
      name: 'Alex Morgan',
      email: demoEmail,
      password: 'Password123!',
      bio: 'Lead Full-Stack Engineer & Cloud Solutions Architect passionate about scalable web platforms, clean architecture, and modern UX.',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    })

    console.log('Isolated demo fixture created.')

    // Create Portfolio 1: Developer Template (Published)
    const portfolio1 = await Portfolio.create({
      userId: user._id,
      title: 'Alex Morgan — Senior Engineer',
      slug: 'alex-demo',
      templateId: 'developer',
      personalInfo: {
        fullName: 'Alex Morgan',
        title: 'Senior Full-Stack Engineer',
        headline: 'Architecting resilient cloud platforms & high-performance web applications.',
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        email: 'alex.morgan@portfolioforge.dev',
        phone: '+1 (555) 234-5678',
        location: 'San Francisco, CA',
      },
      about: {
        summary:
          'Software engineer with 5+ years of experience architecting distributed cloud systems, high-throughput microservices, and modern React applications. Proven track record leading agile engineering squads and shipping products used by 250K+ developers.',
        highlightYears: '5+',
        bioLong:
          'Passionate open-source contributor, advocate for clean code, automated CI/CD pipelines, and zero-downtime deployments.',
      },
      skills: [
        { name: 'React.js / Next.js', category: 'Frontend', proficiencyLevel: 95 },
        { name: 'TypeScript / Node.js', category: 'Backend', proficiencyLevel: 92 },
        { name: 'MongoDB / Mongoose', category: 'Database', proficiencyLevel: 88 },
        { name: 'Tailwind CSS', category: 'Frontend', proficiencyLevel: 94 },
        { name: 'PostgreSQL & Redis', category: 'Database', proficiencyLevel: 86 },
        { name: 'Docker & Kubernetes', category: 'Tools', proficiencyLevel: 84 },
        { name: 'REST & GraphQL APIs', category: 'Backend', proficiencyLevel: 90 },
        { name: 'System Architecture', category: 'Backend', proficiencyLevel: 92 },
      ],
      projects: [
        {
          title: 'PortfolioForge SaaS Platform',
          description:
            'A production-grade no-code portfolio builder with real-time live preview, 5 customizable templates, visitor analytics telemetry, and instant PDF resume generation.',
          technologies: ['React', 'Node.js', 'MongoDB', 'Tailwind CSS'],
          projectImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
          githubUrl: 'https://github.com',
          liveDemoUrl: 'https://example.com',
          featured: true,
        },
        {
          title: 'CloudScale Telemetry Dashboard',
          description:
            'Real-time metrics streaming portal visualizing distributed server latency, memory pressure, and automated alerting thresholds.',
          technologies: ['React', 'TypeScript', 'Recharts', 'Express'],
          projectImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
          githubUrl: 'https://github.com',
          liveDemoUrl: 'https://example.com',
          featured: false,
        },
        {
          title: 'HyperQueue Distributed Task Broker',
          description:
            'High-throughput message queue engine supporting idempotency, exponential retry backoff, and sub-millisecond job scheduling.',
          technologies: ['Node.js', 'Redis', 'Docker'],
          projectImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
          githubUrl: 'https://github.com',
          liveDemoUrl: 'https://example.com',
          featured: true,
        },
      ],
      experience: [
        {
          companyName: 'TechVanguard Systems',
          jobRole: 'Lead Software Architect',
          duration: '2023 - Present',
          location: 'San Francisco, CA',
          description:
            'Architected microservices processing 12M+ monthly requests. Spearheaded frontend component design system that cut sprint velocity cycle by 35%.',
          isCurrent: true,
        },
        {
          companyName: 'Nexus Labs',
          jobRole: 'Senior Full-Stack Developer',
          duration: '2021 - 2023',
          location: 'Remote',
          description:
            'Developed real-time financial tracking widgets, integrated Stripe billing, and improved Lighthouse performance score from 58 to 98.',
          isCurrent: false,
        },
      ],
      education: [
        {
          degree: 'B.S. in Computer Science & Engineering',
          college: 'School of Computing',
          university: 'California Institute of Technology',
          startYear: '2017',
          graduationYear: '2021',
          description: 'Graduated Magna Cum Laude. Focused on Distributed Systems, Cloud Architecture, and Databases.',
          grade: '3.92 GPA',
        },
      ],
      certifications: [
        {
          certificateName: 'AWS Certified Solutions Architect (Professional)',
          issuingOrganization: 'Amazon Web Services',
          date: '2024',
          credentialUrl: 'https://aws.amazon.com',
        },
        {
          certificateName: 'Certified Kubernetes Administrator (CKA)',
          issuingOrganization: 'Cloud Native Computing Foundation',
          date: '2023',
          credentialUrl: 'https://cncf.io',
        },
      ],
      socialLinks: {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com',
      },
      theme: {
        primaryColor: '#8b5cf6',
        accentColor: '#06b6d4',
        font: 'Space Grotesk',
        darkMode: false,
      },
      published: true,
      publishedAt: new Date(),
    })

    // Seed realistic analytics events for Portfolio 1
    const devices = ['desktop', 'desktop', 'desktop', 'mobile', 'mobile', 'tablet']
    const projectsList = ['PortfolioForge SaaS Platform', 'CloudScale Telemetry Dashboard', 'HyperQueue Distributed Task Broker']

    console.log('Generating realistic visitor telemetry for demo charts...')
    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const dayDate = new Date()
      dayDate.setDate(dayDate.getDate() - dayOffset)

      const dailyViews = Math.floor(8 + Math.random() * 15)
      for (let v = 0; v < dailyViews; v++) {
        const dev = devices[Math.floor(Math.random() * devices.length)]
        await Analytics.create({
          portfolioId: portfolio1._id,
          event: 'view',
          device: dev,
          visitorIp: `192.168.1.${Math.floor(10 + Math.random() * 80)}`,
          referrer: v % 2 === 0 ? 'https://linkedin.com' : 'https://github.com',
          createdAt: dayDate,
        })
      }

      const dailyClicks = Math.floor(2 + Math.random() * 6)
      for (let c = 0; c < dailyClicks; c++) {
        const prj = projectsList[Math.floor(Math.random() * projectsList.length)]
        await Analytics.create({
          portfolioId: portfolio1._id,
          event: 'project_click',
          device: 'desktop',
          visitorIp: `192.168.1.${Math.floor(10 + Math.random() * 80)}`,
          metadata: { projectTitle: prj, linkType: 'demo' },
          createdAt: dayDate,
        })
      }
    }

    // Create Portfolio 2: Creative Designer Template
    await Portfolio.create({
      userId: user._id,
      title: 'Alex Morgan — Product & UX Showcase',
      slug: 'alex-creative',
      templateId: 'creative',
      personalInfo: {
        fullName: 'Alex Morgan',
        title: 'Principal Product Designer',
        headline: 'Bridging design systems, user delight, and high-impact digital experiences.',
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        email: 'alex.morgan@portfolioforge.dev',
        phone: '+1 (555) 234-5678',
        location: 'San Francisco, CA',
      },
      about: {
        summary:
          'Product designer and creative director focused on building delightful software interfaces that solve genuine user problems and drive substantial commercial growth.',
        highlightYears: '5+',
      },
      skills: [
        { name: 'Figma & Design Systems', category: 'Design', proficiencyLevel: 98 },
        { name: 'Interactive Prototyping', category: 'Design', proficiencyLevel: 94 },
        { name: 'Tailwind CSS & UI', category: 'Frontend', proficiencyLevel: 92 },
        { name: 'User Research & Testing', category: 'Design', proficiencyLevel: 88 },
      ],
      projects: [
        {
          title: 'Aura Design System',
          description: 'A comprehensive multi-brand design system encompassing 140+ accessible UI components.',
          technologies: ['Figma', 'React', 'Tailwind CSS'],
          projectImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
          githubUrl: 'https://github.com',
          liveDemoUrl: 'https://example.com',
          featured: true,
        },
      ],
      experience: [
        {
          companyName: 'CreativeSphere Studio',
          jobRole: 'Head of Product Design',
          duration: '2022 - Present',
          location: 'San Francisco, CA',
          description: 'Directed brand identity and product design for enterprise SaaS clients.',
          isCurrent: true,
        },
      ],
      theme: {
        primaryColor: '#ec4899',
        accentColor: '#8b5cf6',
        font: 'Poppins',
        darkMode: false,
      },
      published: true,
      publishedAt: new Date(),
    })

    console.log('✅ Demo seed completed successfully!')
    process.exit(0)
  } catch (err) {
    console.error('Seed error:', err)
    process.exit(1)
  }
}

seed()
