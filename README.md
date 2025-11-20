# Trip Drop

A collaborative trip planning and management application built with Next.js 15, React 19, and Supabase. Plan your trips, share them with friends, and manage your itinerary all in one place.

## Features
-  **Secure Authentication & Authorization**: Integrated Supabase Auth with custom API routes, implemented Row Level Security (RLS) policies, and Bearer token authentication for secure API communication
- **Custom Hooks & State Management**: Modular architecture using custom React hooks for data fetching and Zustand for global state management, promoting code reusability and maintainability
- **RESTful API Design & Database Architecture**: Designed and implemented Next.js API routes following RESTful conventions with proper error handling and validation, leveraging Supabase PostgreSQL

## Responsive Design
#### Desktop
<table>
  <tr>
    <td align="center" valign="top"><img src="public/img/screenshot/desktop-top.png" alt="Desktop Top" width="100%"></td>
    <td align="center" valign="top"><img src="public/img/screenshot/desktop-schedule.png" alt="Desktop Schedule" width="100%"></td>
    <td align="center" valign="top"><img src="public/img/screenshot/desktop-modal.png" alt="Desktop Modal" width="100%"></td>
    <td align="center" valign="top"><img src="public/img/screenshot/desktop-setting.png" alt="Desktop Setting" width="100%"></td>
  </tr>
</table>

#### Mobile
<table>
  <tr>
    <td align="center" valign="top"><img src="public/img/screenshot/mobile-top.png" alt="Mobile Top" width="100%"></td>
    <td align="center" valign="top"><img src="public/img/screenshot/mobile-schedule.png" alt="Mobile Schedule" width="100%"></td>
    <td align="center" valign="top"><img src="public/img/screenshot/mobile-modal.png" alt="Mobile Modal" width="100%"></td>
    <td align="center" valign="top"><img src="public/img/screenshot/mobile-setting.png" alt="Mobile Setting" width="100%"></td>
  </tr>
</table>


## Tech Stack


### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - UI component library
- **Zustand** - State management
- **SWR** - Data fetching and caching
- **Axios** - HTTP client
- **date-fns** - Date manipulation
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - PostGIS extension for geospatial data
- **Next.js API Routes** - Serverless API endpoints

### External Services
- **Google Places API** - Location search and details
- **Google Maps API** - Interactive maps

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google Cloud Platform account with Places API and Maps API enabled
