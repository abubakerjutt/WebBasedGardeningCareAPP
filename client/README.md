# GardenCare Frontend

This is the frontend application for GardenCare, built with Vite + React and Material-UI.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example` and configure your API endpoints.

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout/         # Layout components
│   └── ProtectedRoute.jsx
├── contexts/           # React Context providers
│   ├── AuthContext.jsx
│   └── NotificationContext.jsx
├── pages/              # Page components
│   ├── Auth/          # Authentication pages
│   ├── Dashboard/     # Dashboard pages
│   ├── Plants/        # Plant-related pages
│   ├── Gardens/       # Garden-related pages
│   ├── Weather/       # Weather pages
│   ├── Community/     # Community pages
│   ├── Profile/       # Profile pages
│   ├── Admin/         # Admin pages
│   ├── Home.jsx       # Landing page
│   └── NotFound.jsx   # 404 page
├── utils/             # Utility functions
├── assets/            # Static assets
├── App.jsx            # Main App component
├── main.jsx           # Application entry point
├── App.css            # App-specific styles
└── index.css          # Global styles
```

## Features

- 🌱 **Plant Database**: Browse and manage plants with detailed care information
- 🏡 **Garden Management**: Create and manage gardens, track plant health
- 🌤️ **Weather Integration**: Real-time weather data and gardening advice
- 👥 **Community**: Connect with other gardeners and share experiences
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔐 **Authentication**: Secure user authentication and authorization
- 📊 **Dashboard**: Personalized dashboard with gardening insights
- 🔔 **Notifications**: Real-time notifications and reminders
- 👨‍💼 **Admin Panel**: Administrative controls for system management

## Tech Stack

- **React 19** - Frontend framework
- **Vite** - Build tool and development server
- **Material-UI (MUI)** - Component library and design system
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests
- **Socket.IO Client** - Real-time communication
- **Date-fns** - Date manipulation library

## Environment Variables

Create a `.env` file in the client directory with the following variables:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=GardenCare
VITE_APP_VERSION=1.0.0
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## User Roles

The application supports multiple user roles:

- **Home Owner**: Manage personal gardens and plants
- **Gardener**: Professional gardening services
- **Supervisor**: Oversee multiple gardens and teams
- **Admin**: System administration and user management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
