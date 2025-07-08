# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/2c9c5f70-02e9-4ef7-900f-a4965d3fc0e7

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2c9c5f70-02e9-4ef7-900f-a4965d3fc0e7) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Environment Configuration

### DigiLocker Integration

To enable DigiLocker integration for automatic profile import, you need to configure the following environment variables:

```bash
# Agent API base URL for DigiLocker integration
VITE_AGENT_URL=https://your-agent-api-url.com

# Bearer token for agent API authentication  
VITE_AGENT_TOKEN=your-agent-api-token-here
```

**How it works:**

1. When users click "Import from DigiLocker", the app calls `VITE_AGENT_URL/api/v1/discover/digilocker-request`
2. This returns a DigiLocker OAuth URL for user authentication
3. DigiLocker authentication opens in a popup window (iframe is blocked by X-Frame-Options)
4. After user completes authentication, the redirect URL contains an authorization code
5. The authorization code is automatically detected via popup monitoring or postMessage communication
6. The app calls `VITE_AGENT_URL/api/v1/discover/digilocker-auth` with the code
7. The response contains verified user data (name, DOB, gender, Aadhaar, location) which auto-fills the profile

**Bridge Page Setup (Optional but Recommended):**

For automatic code detection to work optimally, you should host the `public/digilocker-bridge.html` file on the redirect domain (`studiodemo.dhiway.com`) at the path `/wallet-redirect`. This bridge page:

- Extracts the authorization code from the URL parameters
- Sends the code back to the parent application via postMessage
- Provides a user-friendly interface showing the authentication status
- Auto-closes the popup after successful communication

**Security Notes:**
- All API calls use Bearer token authentication
- User data is processed client-side and not stored by the agent API
- Only verified fields from DigiLocker are auto-filled and marked as verified
- The popup approach prevents X-Frame-Options issues while maintaining security

**Fallback Options:**
- If automatic detection fails, users can manually copy and paste the authorization code
- The system provides clear instructions for manual code extraction
- Multiple communication methods ensure reliability across different browsers

If these environment variables are not configured, the DigiLocker import option will be disabled with an appropriate message.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2c9c5f70-02e9-4ef7-900f-a4965d3fc0e7) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# Creds Job Bridge

A modern job search and application platform built with React, TypeScript, and Tailwind CSS.

## Features

### Enhanced Job Search with Lazy Loading

The application now includes improved job search functionality with:

- **Progressive Loading States**: Different loading indicators for initial load, refresh, and slow responses
- **Request Timeout Handling**: 30-second timeout with automatic retry logic
- **Caching**: 5-minute cache to reduce API calls and improve performance
- **Better Error Handling**: Graceful fallbacks and retry mechanisms
- **Loading Indicators**: Visual feedback in search bar and content areas

#### Loading States

- `initial`: First-time loading with skeleton placeholders
- `loading`: Refreshing existing data
- `partial`: Slow response indicator (after 5 seconds)
- `complete`: Successfully loaded
- `error`: Error state with retry options

#### Key Improvements

1. **No More Multiple Refreshes**: The app now handles slow BAP API responses gracefully
2. **Cached Results**: Shows cached data while refreshing in background
3. **Smart Retry Logic**: Exponential backoff (1s, 2s, 4s delays)
4. **Request Cancellation**: Prevents multiple simultaneous requests
5. **User Feedback**: Clear loading messages and status indicators

### Components

- **JobListView**: Enhanced with progressive loading and error states
- **JobDiscovery**: Search bar with loading indicators
- **LoadingMessage**: Reusable loading component with different states
- **EmptyState**: Consistent empty state handling
- **LoadingSkeleton**: Skeleton loading placeholders

### Usage

The enhanced job search automatically handles:
- Slow API responses
- Network timeouts
- Retry logic
- Caching
- User feedback

No additional configuration required - the improvements are built into the existing components.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: React Context API
- **HTTP Client**: Custom API client with timeout handling
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/
│   ├── job-search/          # Job search components
│   ├── job-application/     # Job application flow
│   ├── ui/                  # Reusable UI components
│   │   └── loading-states.tsx  # Loading state components
│   └── ...
├── hooks/
│   └── useJobSearch.tsx     # Enhanced job search hook
├── lib/
│   └── api.ts              # API client with timeout handling
└── ...
```

## API Integration

The application integrates with BAP (Beckn Application Protocol) APIs for job search functionality. The enhanced loading system ensures a smooth user experience even when the BAP API is slow or unresponsive.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
