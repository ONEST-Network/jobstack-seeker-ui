
export const mockJobCategories = [
  {
    title: "Jobs for You",
    subtitle: "Based on your profile and preferences",
    jobs: [
      {
        id: 6,
        title: "Industrial Tailor",
        company: "Fashion Textiles Ltd",
        location: "Bangalore, Karnataka",
        salary: "₹18,000 - ₹25,000",
        salaryPeriod: "monthly",
        type: "Full-time",
        experience: "2-4 years",
        postedTime: "1 hour ago",
        trustScore: 8,
        matchScore: 9,
        verified: true,
        benefits: ["Accommodation", "PF", "ESIC", "Overtime Pay"],
        logo: "✂️",
        description: "Industrial tailoring position in garment manufacturing unit. Daily production targets with quality standards.",
        requirements: ["2+ years industrial tailoring experience", "Speed: 15 minutes per garment", "Quality control knowledge"],
        openings: 50,
        workingHours: "8 hours/day",
        monthlyInHand: "₹18,500",
        monthlyPfEsic: "₹2,200",
        monthlyEsicInsurance: "₹350",
        monthlyAverageOt: "₹3,000",
        dailyAdvanceSalary: "10%",
        stayProvided: true,
        costPerSharingBed: "₹2,500",
        companyRegistration: "CIN: U17110KA2015PTC078945",
        agencyDetails: "License No: MH/2023/AGY/1234",
        contactPerson: {
          name: "Rajesh Kumar",
          email: "rajesh@fashiontextiles.com",
          phone: "+91 9876543210"
        },
        applicationRequirements: {
          ageLimit: "18-45 years",
          skillCheck: "Sample stitching task",
          speedBenchmark: "15 minutes per task",
          education: "8th Pass minimum"
        },
        media: [
          {
            type: 'video' as const,
            url: 'https://example.com/tailor-job-details.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=200&fit=crop',
            alt: 'Industrial tailoring workshop',
            duration: '3:20'
          },
          {
            type: 'image' as const,
            url: 'https://images.unsplash.com/photo-1586963568037-3b42d3ba21c4?w=400&h=200&fit=crop',
            alt: 'Factory location exterior'
          }
        ]
      },
      {
        id: 7,
        title: "Warehouse Loader and Picker",
        company: "LogiCorp Solutions",
        location: "Gurgaon, Haryana",
        salary: "₹16,000 - ₹22,000",
        salaryPeriod: "monthly",
        type: "Full-time",
        experience: "0-2 years",
        postedTime: "3 hours ago",
        trustScore: 7,
        matchScore: 8,
        verified: true,
        benefits: ["Transportation", "PF", "ESIC", "Food Allowance"],
        logo: "📦",
        description: "Warehouse operations including loading, unloading, and order picking. Physical work with growth opportunities.",
        requirements: ["Physical fitness", "Basic literacy", "Willingness to work in shifts"],
        openings: 30,
        workingHours: "9 hours/day",
        monthlyInHand: "₹17,200",
        monthlyPfEsic: "₹2,000",
        monthlyEsicInsurance: "₹300",
        monthlyAverageOt: "₹2,500",
        dailyAdvanceSalary: "5%",
        stayProvided: false,
        companyRegistration: "CIN: U63090HR2018PTC074123",
        agencyDetails: "License No: HR/2023/AGY/5678",
        contactPerson: {
          name: "Amit Singh",
          email: "amit@logicorp.com",
          phone: "+91 9123456789"
        },
        applicationRequirements: {
          ageLimit: "18-40 years",
          skillCheck: "Physical fitness test",
          speedBenchmark: "Load 100 packages in 30 minutes",
          education: "8th Pass minimum"
        },
        media: [
          {
            type: 'video' as const,
            url: 'https://example.com/warehouse-operations.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=200&fit=crop',
            alt: 'Warehouse loading operations',
            duration: '2:45'
          }
        ]
      },
      {
        id: 8,
        title: "Field Sales Executive",
        company: "SalesForce India",
        location: "Mumbai, Maharashtra",
        salary: "₹20,000 - ₹35,000",
        salaryPeriod: "monthly",
        type: "Full-time",
        experience: "1-3 years",
        postedTime: "5 hours ago",
        trustScore: 9,
        matchScore: 8,
        verified: true,
        benefits: ["Travel Allowance", "Commission", "PF", "Medical"],
        logo: "🚗",
        description: "Field sales role covering Mumbai region. Direct customer interaction and sales target achievement.",
        requirements: ["Sales experience", "Two-wheeler license", "Good communication skills"],
        openings: 15,
        workingHours: "8 hours/day",
        monthlyInHand: "₹22,000",
        monthlyPfEsic: "₹2,400",
        monthlyEsicInsurance: "₹400",
        monthlyAverageOt: "₹4,000",
        dailyAdvanceSalary: "8%",
        stayProvided: false,
        companyRegistration: "CIN: U51909MH2012PTC234567",
        agencyDetails: "License No: MH/2023/AGY/9012",
        contactPerson: {
          name: "Priya Sharma",
          email: "priya@salesforce.in",
          phone: "+91 9876543221"
        },
        applicationRequirements: {
          ageLimit: "21-35 years",
          skillCheck: "Sales pitch demonstration",
          speedBenchmark: "5 customer visits per day",
          education: "12th Pass minimum"
        },
        media: [
          {
            type: 'video' as const,
            url: 'https://example.com/field-sales-demo.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=200&fit=crop',
            alt: 'Field sales executive with client',
            duration: '2:15'
          }
        ]
      },
      {
        id: 9,
        title: "In Store Promoter",
        company: "Retail Promotions Co",
        location: "Delhi, Delhi",
        salary: "₹15,000 - ₹20,000",
        salaryPeriod: "monthly",
        type: "Part-time",
        experience: "0-2 years",
        postedTime: "2 hours ago",
        trustScore: 6,
        matchScore: 7,
        verified: true,
        benefits: ["Flexible Hours", "Performance Bonus", "Training"],
        logo: "🛍️",
        description: "Product promotion in retail stores. Customer engagement and product demonstration.",
        requirements: ["Good communication", "Presentable appearance", "Customer service skills"],
        openings: 25,
        workingHours: "6 hours/day",
        monthlyInHand: "₹16,500",
        monthlyPfEsic: "₹1,800",
        monthlyEsicInsurance: "₹250",
        monthlyAverageOt: "₹1,500",
        dailyAdvanceSalary: "0%",
        stayProvided: false,
        companyRegistration: "CIN: U52100DL2019PTC349876",
        agencyDetails: "License No: DL/2023/AGY/3456",
        contactPerson: {
          name: "Neha Gupta",
          email: "neha@retailpromo.com",
          phone: "+91 9123456780"
        },
        applicationRequirements: {
          ageLimit: "18-30 years",
          skillCheck: "Product presentation",
          speedBenchmark: "Engage 20 customers per hour",
          education: "10th Pass minimum"
        },
        media: [
          {
            type: 'image' as const,
            url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop',
            alt: 'In-store product promotion'
          }
        ]
      },
      {
        id: 10,
        title: "Recruitment Associate",
        company: "TalentHub Recruiters",
        location: "Hyderabad, Telangana",
        salary: "₹18,000 - ₹28,000",
        salaryPeriod: "monthly",
        type: "Full-time",
        experience: "1-2 years",
        postedTime: "6 hours ago",
        trustScore: 8,
        matchScore: 7,
        verified: true,
        benefits: ["Incentives", "Training", "PF", "Medical"],
        logo: "👥",
        description: "End-to-end recruitment process management. Candidate sourcing, screening, and interview coordination.",
        requirements: ["HR experience", "Communication skills", "Computer literacy"],
        openings: 8,
        workingHours: "9 hours/day",
        monthlyInHand: "₹20,500",
        monthlyPfEsic: "₹2,300",
        monthlyEsicInsurance: "₹380",
        monthlyAverageOt: "₹2,000",
        dailyAdvanceSalary: "0%",
        stayProvided: false,
        companyRegistration: "CIN: U74999TG2020PTC140123",
        agencyDetails: "License No: TG/2023/AGY/7890",
        contactPerson: {
          name: "Ravi Reddy",
          email: "ravi@talenthub.com",
          phone: "+91 9876543234"
        },
        applicationRequirements: {
          ageLimit: "22-32 years",
          skillCheck: "Interview simulation",
          speedBenchmark: "Screen 10 candidates per day",
          education: "Graduate preferred"
        },
        media: [
          {
            type: 'video' as const,
            url: 'https://example.com/recruitment-process.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
            alt: 'Recruitment interview process',
            duration: '2:30'
          }
        ]
      },
      {
        id: 1,
        title: "Electrician",
        company: "PowerTech Solutions",
        location: "Mumbai, Maharashtra",
        salary: "₹25,000 - ₹35,000",
        salaryPeriod: "monthly",
        type: "Full-time",
        experience: "2-5 years",
        postedTime: "2 hours ago",
        trustScore: 8,
        matchScore: 9,
        verified: true,
        benefits: ["Insurance", "Transportation", "Accommodation"],
        logo: "🔌",
        description: "We need a skilled electrician...",
        requirements: ["2+ years experience", "Valid electrical license", "Safety certificate"],
        openings: 12,
        workingHours: "8 hours/day",
        monthlyInHand: "₹28,000",
        monthlyPfEsic: "₹3,200",
        monthlyEsicInsurance: "₹450",
        monthlyAverageOt: "₹4,500",
        dailyAdvanceSalary: "15%",
        stayProvided: true,
        costPerSharingBed: "₹3,000",
        companyRegistration: "CIN: U74140MH2018PTC309876",
        agencyDetails: "License No: MH/2023/AGY/2468",
        contactPerson: {
          name: "Suresh Patel",
          email: "suresh@powertech.com",
          phone: "+91 9876543210"
        },
        applicationRequirements: {
          ageLimit: "20-45 years",
          skillCheck: "Electrical wiring test",
          speedBenchmark: "Complete basic circuit in 30 minutes",
          education: "ITI Electrical preferred"
        },
        media: [
          {
            type: 'video' as const,
            url: 'https://example.com/electrician-job-video.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=200&fit=crop',
            alt: 'Electrician working on electrical panel',
            duration: '2:30'
          },
          {
            type: 'image' as const,
            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop',
            alt: 'Modern electrical workshop'
          }
        ]
      },
      {
        id: 2,
        title: "Welder",
        company: "MetalWorks Industries",
        location: "Pune, Maharashtra",
        salary: "₹22,000 - ₹30,000",
        salaryPeriod: "monthly",
        type: "Full-time",
        experience: "1-3 years",
        postedTime: "4 hours ago",
        trustScore: 7,
        matchScore: 8,
        verified: true,
        benefits: ["Insurance", "PF"],
        logo: "🔥",
        description: "Join our welding team for industrial projects...",
        requirements: ["1+ years experience", "Welding certificate", "Safety training"],
        openings: 8,
        workingHours: "9 hours/day",
        monthlyInHand: "₹24,500",
        monthlyPfEsic: "₹2,800",
        monthlyEsicInsurance: "₹380",
        monthlyAverageOt: "₹3,500",
        dailyAdvanceSalary: "12%",
        stayProvided: false,
        companyRegistration: "CIN: U28111MH2020PTC345678",
        agencyDetails: "License No: MH/2023/AGY/3579",
        contactPerson: {
          name: "Vikram Singh",
          email: "vikram@metalworks.com",
          phone: "+91 9123456789"
        },
        applicationRequirements: {
          ageLimit: "18-40 years",
          skillCheck: "Welding demonstration",
          speedBenchmark: "Weld 2 metal pieces in 20 minutes",
          education: "10th Pass minimum"
        },
        media: [
          {
            type: 'video' as const,
            url: 'https://example.com/welding-demo.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=200&fit=crop',
            alt: 'Welder at work with sparks flying',
            duration: '1:45'
          }
        ]
      }
    ]
  },
  {
    title: "Jobs Near You",
    subtitle: "Within 15km of your location",
    jobs: [
      {
        id: 3,
        title: "Security Guard",
        company: "SecureNation Services",
        location: "Andheri, Mumbai",
        salary: "₹18,000 - ₹22,000",
        salaryPeriod: "monthly",
        type: "Full-time",
        experience: "0-2 years",
        postedTime: "1 day ago",
        trustScore: 6,
        matchScore: 7,
        verified: true,
        benefits: ["Night Shift Allowance", "Food"],
        logo: "🛡️",
        description: "Security position for residential complex...",
        requirements: ["Physical fitness", "No criminal record", "Basic education"],
        media: [
          {
            type: 'image' as const,
            url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop',
            alt: 'Security guard at building entrance'
          }
        ]
      }
    ]
  },
  {
    title: "Jobs for Women",
    subtitle: "Women-friendly workplace opportunities",
    jobs: [
      {
        id: 4,
        title: "Tailor",
        company: "Fashion Creations",
        location: "Delhi, Delhi",
        salary: "₹20,000 - ₹28,000",
        salaryPeriod: "monthly",
        type: "Part-time",
        experience: "1-4 years",
        postedTime: "3 days ago",
        trustScore: 9,
        matchScore: 8,
        verified: true,
        benefits: ["Flexible Hours", "Training"],
        logo: "✂️",
        description: "Tailor position in women-friendly environment...",
        requirements: ["Tailoring experience", "Basic sewing skills", "Attention to detail"],
        media: [
          {
            type: 'video' as const,
            url: 'https://example.com/tailoring-workshop.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=200&fit=crop',
            alt: 'Tailor working on sewing machine',
            duration: '3:15'
          }
        ]
      }
    ]
  },
  {
    title: "For Freshers",
    subtitle: "Entry-level opportunities",
    jobs: [
      {
        id: 5,
        title: "Machine Operator",
        company: "AutoParts Manufacturing",
        location: "Bangalore, Karnataka",
        salary: "₹15,000 - ₹20,000",
        salaryPeriod: "monthly",
        type: "Full-time",
        experience: "0-1 years",
        postedTime: "1 week ago",
        trustScore: 5,
        matchScore: 6,
        verified: false,
        benefits: ["Training", "Growth Opportunities"],
        logo: "⚙️",
        description: "Entry-level machine operator position...",
        requirements: ["Willingness to learn", "Basic education", "Physical fitness"],
        media: [
          {
            type: 'image' as const,
            url: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=400&h=200&fit=crop',
            alt: 'Manufacturing floor with machines'
          }
        ]
      }
    ]
  }
];
