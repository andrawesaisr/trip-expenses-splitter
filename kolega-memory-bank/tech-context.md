# Technical Context

## Technology Stack
- **Framework**: Next.js 14+ (latest stable)
- **Language**: TypeScript 5+
- **Database**: MongoDB (local or cloud instance)
- **ODM**: Mongoose for MongoDB object modeling
- **Package Manager**: npm (default with Node.js)
- **Runtime**: Node.js 18+
- **Styling**: Custom CSS with responsive design

## Dependencies
- **Core**: next, react, react-dom, typescript
- **Database**: mongoose, @types/node
- **Development Tools**: eslint, @next/eslint-config-next
- **Type Definitions**: @types/react, @types/react-dom

## Configuration Files
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript compiler configuration
- `next.config.js` - Next.js framework configuration
- `.eslintrc.json` - ESLint rules and settings
- `.env.local` - Environment variables (development)
- `.gitignore` - Git ignore patterns

## Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Environment mode (development/production)

## Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Project Structure
```
/
├── pages/
│   ├── api/           # API routes
│   │   ├── trips/     # Trip CRUD endpoints
│   │   │   ├── index.ts    # GET /api/trips, POST /api/trips
│   │   │   └── [id].ts     # GET/PUT/DELETE /api/trips/[id]
│   │   ├── expenses/  # Expense CRUD endpoints
│   │   └── health.ts  # Health check endpoint
│   ├── trips/         # Trip pages
│   │   ├── index.tsx  # All trips listing page
│   │   ├── new.tsx    # Create new trip page
│   │   └── [id]/      # Dynamic trip routes
│   │       ├── index.tsx  # Trip detail page
│   │       └── edit.tsx   # Edit trip page
│   ├── _app.tsx       # App component wrapper
│   └── index.tsx      # Homepage
├── components/        # Reusable components
│   ├── Layout.tsx     # Main layout with navigation
│   ├── TripForm.tsx   # Trip creation/editing form
│   ├── TripList.tsx   # Trip listing component
│   ├── TripDetail.tsx # Trip detail view with participant and expense management
│   ├── ExpenseForm.tsx # Expense creation/editing form
│   ├── ExpenseList.tsx # Expense listing with filtering and sorting
│   └── ExpenseSummary.tsx # Expense summary with balance calculations
├── hooks/
│   └── useExpenses.ts # Custom hook for expense management
├── lib/
│   ├── mongodb.ts     # Database connection utility
│   └── models/        # Mongoose models
│       ├── Trip.ts    # Trip model with participant schema
│       ├── Expense.ts # Expense model with split calculations
│       └── index.ts   # Model exports
├── styles/
│   ├── globals.css    # Global styles and CSS framework
│   └── expense.css    # Expense-specific styles
├── types/
│   └── expense.ts     # Expense TypeScript definitions
└── kolega-memory-bank/  # Project documentation
```

## Database Schema

### Trip Model
```typescript
interface IPerson {
  name: string
  email?: string
}

interface ITrip {
  name: string
  people: IPerson[]
  createdAt: Date
  updatedAt: Date
}
```

### Key Features
- Name validation (required, max 100 characters)
- People array validation (at least one person required)
- Email validation (optional, proper format when provided)
- Automatic timestamps
- Indexes for performance optimization

## API Endpoints

### Trip Management
- `GET /api/trips` - Retrieve all trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/[id]` - Get specific trip
- `PUT /api/trips/[id]` - Update trip
- `DELETE /api/trips/[id]` - Delete trip

### Expense Management
- `GET /api/expenses` - Retrieve expenses (with optional tripId filter)
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/[id]` - Get specific expense with split calculations
- `PUT /api/expenses/[id]` - Update expense (supports partial updates)
- `DELETE /api/expenses/[id]` - Delete expense

### Response Format
```json
{
  "success": true,
  "data": { /* trip/expense data */ },
  "message": "Operation successful"
}
```

## Frontend Components

### Layout System
- **Layout.tsx**: Main wrapper with navigation and footer
- **Navigation**: Responsive navbar with trip management links
- **Footer**: Application information and credits

### Trip Components
- **TripForm.tsx**: Create/edit form with participant management
- **TripList.tsx**: Display all trips with action buttons
- **TripDetail.tsx**: Detailed view with inline participant editing

### Form Features
- Real-time validation
- Error state handling
- Loading states
- Duplicate prevention
- Email format validation

## Styling System

### Custom CSS Framework
- Responsive grid system
- Consistent color palette
- Button component system
- Form styling utilities
- Layout helpers

### Key Classes
- `.card` - White container with shadow
- `.button` - Base button styling
- `.form-input` - Standardized input styling
- `.navbar` - Navigation bar styling
- Responsive utilities

## Error Handling
- Client-side form validation
- Server-side API validation
- Database error handling
- User-friendly error messages
- Loading states and feedback

## Performance Considerations
- Next.js automatic code splitting
- MongoDB connection pooling
- Efficient database queries
- Optimized CSS delivery
- Component-level error boundaries

## Development Workflow
1. Start development server with `npm run dev` (or `npm run dev -- --port 9002` for custom port)
2. Server runs on http://localhost:3001 (or specified port)
3. Hot reloading for rapid development
4. TypeScript compilation and error checking
5. ESLint for code quality
6. MongoDB connection for data persistence

## Latest Test Results ✅
- **Server Status**: Successfully running on port 3001
- **API Health**: All endpoints responding correctly (200/201 status codes)
- **Database**: MongoDB connected and functional
- **Trip Management**: CRUD operations verified working
- **Expense Management**: API endpoints and data flow confirmed
- **Page Compilation**: All Next.js routes compiling successfully
- **Data Persistence**: Trip creation and retrieval tested successfully
- **UI Modernization**: Complete modern UI overhaul implemented
- **Runtime Errors**: All post-UI-enhancement errors fixed

## UI Modernization Complete ✅
- **Design System**: Comprehensive CSS variables and utility classes
- **Modern Components**: All components updated with modern design patterns
- **Settlement UX**: Ultra-simplified debt calculations and payment flows
- **Responsive Design**: Mobile-first approach with improved touch interactions
- **Visual Hierarchy**: Clear typography, spacing, and color system
- **User Experience**: Intuitive navigation and simplified workflows
- **Accessibility**: Better contrast ratios and keyboard navigation
- **Performance**: Optimized CSS and component architecture

## Issues Fixed ✅
- **CSS Syntax Error**: Fixed `resize-vertical` Tailwind class issue
- **MongoDB Warnings**: Removed duplicate schema index definitions
- **Runtime Errors**: Fixed ExpenseSummary component prop mismatch
- **Missing Functions**: Added formatCurrency export for compatibility
- **Component Styling**: Updated all components to use modern card system
- **API URL Resolution**: Dynamic URL handling for any port
- **Text Visibility Issue**: Fixed white text on white background in Trip Summary
- **Component Props**: Updated SettlementSummary and SettlementDisplay prop interfaces
- **Modern Design System**: Complete TripSummary component rewrite with proper contrast
- **Form Text Visibility**: Fixed white text on white background in all form inputs and selects
- **Date Input Styling**: Added specific styling for date picker elements
- **ExpenseList User Selection**: Added participant selection for personalized balance view
- **Personal Balance Tracking**: Enhanced UX with debt/credit visualization

## Build System Fixes ✅ COMPLETED
- **ESLint Configuration**: Fixed missing TypeScript ESLint packages (@typescript-eslint/eslint-plugin, @typescript-eslint/parser)
- **TypeScript Compilation Errors**: Fixed all type mismatches and compilation issues
- **React Hook Violations**: Fixed conditional hook calls in ExpenseList component
- **React Unescaped Entities**: Fixed all apostrophe issues in JSX (you're → you&apos;re, etc.)
- **Map Iteration Issues**: Fixed ES2015 iteration compatibility in balance calculator
- **Import/Export Errors**: Fixed model import issues (Trip vs ITrip, Expense vs IExpense)
- **API Error Handling**: Fixed all unknown error type issues with proper instanceof checks
- **Type Assertions**: Added proper type casting for complex Mongoose document types
- **Function Signatures**: Fixed component prop type mismatches
- **Implicit Any Types**: Fixed all implicit any type errors in API routes

## Testing Status
- ✅ Development server running successfully
- ✅ Database connectivity verified
- ✅ API endpoints tested and functional
- ✅ All pages loading correctly
- ✅ Form validation working
- ✅ CRUD operations tested
- ✅ Responsive design verified
- ✅ Error handling functional
- ✅ **PRODUCTION BUILD SUCCESSFUL**: All TypeScript, ESLint, and compilation errors resolved
- ✅ **Build Optimization**: Next.js build completed with proper route optimization and code splitting