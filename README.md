# PhishGuard Web Dashboard
////////////
> **Final Year Project - PSM 2 Demo 1 (40%)**  
> Advanced phishing detection system web interface

---

## 🎯 Project Overview

PhishGuard is a comprehensive phishing detection system consisting of:

1. **Desktop Application** (`psm1_phishguard`) - Electron + React client for local URL scanning
2. **Web Dashboard** (this repository) - Next.js web interface for user management and analytics
3. **Backend API** (`phish.equators.site/api`) - RESTful API connecting both systems

This web dashboard provides users with:
- Account management (registration, login, authentication)
- Scan history and analytics from desktop app
- Real-time threat detection statistics
- User profile and settings management

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- Backend API running at `https://phish.equators.site/api`

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/AlMahmud22/phish.equators.tech.git
cd phish.equators.tech
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_BASE_URL=https://phish.equators.site/api
NEXT_PUBLIC_APP_NAME=PhishGuard
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
phish.equators.tech/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with Header/Footer
│   ├── page.tsx           # Landing page
│   ├── login/             # Authentication pages
│   ├── register/          
│   └── dashboard/         # Protected user dashboard
├── components/            # Reusable React components
│   ├── Header.tsx         # Navigation component
│   └── Footer.tsx         # Footer component
├── lib/                   # Utility functions
│   └── api.ts             # Axios API client with interceptors
├── types/                 # TypeScript type definitions
│   └── index.ts           # Core types (User, Scan, etc.)
├── styles/                # Global styles
│   └── globals.css        # Tailwind CSS & custom styles
├── hooks/                 # Custom React hooks (future)
├── docs/                  # Project documentation
│   └── unit9_setup.md     # Unit 9 setup documentation
└── public/                # Static assets
```

---

## 🛠️ Tech Stack

### Core Framework
- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5.9.3** - Type-safe development

### Styling
- **TailwindCSS 4.1.17** - Utility-first CSS framework
- **PostCSS** - CSS transformation
- **Autoprefixer** - CSS vendor prefixes

### API Communication
- **Axios 1.13.2** - HTTP client with interceptors
- JWT authentication with automatic token handling

### Development Tools
- **ESLint** - Code linting with Next.js config
- **TypeScript** - Static type checking

---

## 📋 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

---

## 🎨 Features

### ✅ Implemented (Unit 9)
- [x] Modern, responsive UI with TailwindCSS
- [x] User authentication (login/register)
- [x] Protected dashboard route
- [x] API integration with Axios
- [x] JWT token management
- [x] Error handling and validation
- [x] Mobile-responsive navigation
- [x] TypeScript type safety

### 🚧 Planned (Future Units)
- [ ] Real-time scan history table
- [ ] Advanced analytics and charts
- [ ] User profile management
- [ ] Settings and preferences
- [ ] OAuth integration (Google, GitHub)
- [ ] Real-time notifications
- [ ] Export scan reports (PDF, CSV)
- [ ] Dark mode support

---

## 🔐 Authentication Flow

1. User registers or logs in through web forms
2. Credentials sent to backend API (`/auth/login` or `/auth/register`)
3. Backend validates and returns JWT token
4. Token stored in `localStorage`
5. All subsequent API requests include token in `Authorization` header
6. Dashboard checks for token on mount, redirects to login if missing
7. 401 responses trigger automatic logout and redirect

---

## 🌐 API Integration

### Base Configuration
```typescript
Base URL: https://phish.equators.site/api
Timeout: 10 seconds
Headers: 
  - Content-Type: application/json
  - Authorization: Bearer <token>
```

### Endpoints Used
- `POST /auth/login` - User authentication
- `POST /auth/register` - New user registration
- `GET /user/profile` - Fetch user data
- `GET /analytics/dashboard` - Dashboard statistics

### Error Handling
- Network errors display user-friendly messages
- 401 errors trigger automatic logout
- Form validation prevents invalid submissions

---

## 🎯 Design Philosophy

### Code Style
All code uses clear, explanatory comments:
```typescript
/// setup base axios instance for REST communication
export const api = axios.create({ ... });
```

### Component Architecture
- Small, focused components
- Reusable UI elements
- Type-safe props and state
- Client-side rendering for interactive pages

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-friendly interface elements

---

## 📖 Documentation

Detailed documentation for each development unit:
- [Unit 9 - Setup & Architecture](docs/unit9_setup.md)

---

## 🔗 Related Repositories

- **Desktop App**: `psm1_phishguard` (Electron + React)
- **Backend API**: `phish.equators.site` (REST API)

---

## 👥 Development Team

**Project**: Final Year Project  
**Phase**: PSM 2 - Demo 1 (40%)  
**Institution**: [Your Institution Name]

---

## 📝 License

This project is part of a final year academic project.

---

## 🆘 Troubleshooting

### Development server won't start
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### API connection errors
- Verify backend API is running
- Check `.env.local` configuration
- Ensure `NEXT_PUBLIC_API_BASE_URL` is correct

### TypeScript errors
```bash
# Regenerate TypeScript config
rm tsconfig.json
npm run dev  # Next.js will recreate it
```

---

## 📧 Contact

For questions or issues, please contact the development team.

---

**Built with ❤️ using Next.js and TailwindCSS**
