# Creds Job Bridge

A comprehensive job search and application platform built with React, TypeScript, and Tailwind CSS. This platform serves both job seekers and employers with modern, intuitive interfaces and robust functionality.

## 🚀 Features

### For Job Seekers

- **Advanced Job Search**: Search jobs by role, location, and filters with real-time results
- **Job Discovery**: Browse jobs by categories with media carousels (images/videos)
- **Map View**: Interactive map showing job locations with density indicators
- **Profile Management**: Create and manage multiple candidate profiles
- **Job Applications**: Streamlined application process with profile selection
- **Application Tracking**: Track application status and view detailed responses
- **DigiLocker Integration**: Import verified credentials automatically
- **Voice Profile Creation**: Voice-guided profile setup
- **Score Assessment**: Trust and match score calculations
- **Document Verification**: QR code scanning for certificates and credentials

### For Employers

- **Job Posting**: Multi-step job creation wizard with role-specific forms
- **Media Support**: Upload workplace images and videos


### Technical Features

- **Progressive Loading**: Smart loading states with caching and retry logic
- **Responsive Design**: Mobile-first design with adaptive layouts
- **Real-time Updates**: Live status updates and notifications
- **Offline Support**: Cached data for better performance
- **Accessibility**: WCAG compliant components
- **Internationalization**: Multi-language support ready

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: React Context API, TanStack Query
- **HTTP Client**: Custom API client with timeout handling
- **Icons**: Lucide React
- **Maps**: Custom map implementation
- **Authentication**: Custom auth system with session management
- **File Upload**: Presigned URL uploads with progress tracking

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/               # Authentication dialogs
│   ├── candidates/         # Candidate management
│   ├── employer/          # Employer management
│   ├── header/            # Navigation and user menu
│   ├── job-application/   # Job application flow
│   ├── job-search/        # Job search and discovery
│   ├── map/              # Interactive map components
│   ├── my-applications/   # Application tracking
│   ├── my-jobs/          # Employer job management
│   ├── postJob/          # Job posting wizard
│   ├── profile/          # Profile creation and management
│   ├── provider/         # Employer dashboard
│   ├── score/            # Assessment and scoring
│   └── ui/               # Reusable UI components
├── contexts/             # React contexts
├── hooks/               # Custom React hooks
├── lib/                 # API clients and utilities
├── pages/               # Main page components
├── schemas/             # JSON schemas for roles
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd creds-job-bridge
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**

Create a `.env` file in the root directory:

```bash
# API Configuration
VITE_BAP_URL=https://your-bap-api-url.com
VITE_BPP_URL=https://your-bpp-api-url.com

# DigiLocker Integration (Optional)
VITE_AGENT_URL=https://your-agent-api-url.com
VITE_AGENT_TOKEN=your-agent-api-token-here

# File Upload (Optional)
VITE_UPLOAD_BUCKET=your-s3-bucket-name
VITE_UPLOAD_REGION=your-s3-region
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:5173](http://localhost:5173)

## 🔧 Configuration

### DigiLocker Integration

To enable automatic profile import from DigiLocker:

1. Set the environment variables:
```bash
VITE_AGENT_URL=https://your-agent-api-url.com
VITE_AGENT_TOKEN=your-agent-api-token-here
```

2. Host the bridge page at your redirect domain:
   - Copy `public/digilocker-bridge.html` to your redirect domain
   - Ensure it's accessible at the path specified in your DigiLocker app configuration

### File Upload Configuration

For media uploads (images, videos, documents):

```bash
VITE_UPLOAD_BUCKET=your-s3-bucket-name
VITE_UPLOAD_REGION=your-s3-region
```

## 📱 Usage

### Job Seekers

1. **Browse Jobs**: Use the search bar or explore job categories
2. **View Details**: Click on job cards to see detailed information
3. **Apply**: Select a profile and complete the application
4. **Track Applications**: Monitor application status in "My Applications"
5. **Manage Profiles**: Create and update candidate profiles

### Employers

1. **Post Jobs**: Use the job posting wizard to create detailed job listings
2. **Manage Applications**: Review and shortlist candidates
3. **Track Performance**: Monitor job posting metrics
4. **Organization Setup**: Configure employer profiles and settings

## 🔄 API Integration

The application integrates with:

- **BAP (Beckn Application Protocol)**: For job search and discovery
- **BPP (Beckn Provider Protocol)**: For job posting and management
- **Custom APIs**: For authentication, profile management, and file uploads

### Enhanced Loading System

- **Progressive Loading**: Different states for initial load, refresh, and slow responses
- **Request Timeout**: 30-second timeout with automatic retry logic
- **Caching**: 5-minute cache to reduce API calls
- **Error Handling**: Graceful fallbacks and retry mechanisms

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with custom rules
- **Prettier**: Code formatting (configured via ESLint)

## 🚀 Deployment

### Amplify(AWS) (Recommended)

1. Connect your GitHub repository to AWS Amplify
2. Configure environment variables in amplify dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any static hosting platform:

- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure responsive design for all components

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the code comments for implementation details



---

Built with ❤️ using modern web technologies by Dhiway Team.

