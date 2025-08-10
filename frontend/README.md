# Book to Course Converter Frontend

React TypeScript frontend for transforming PDF books into interactive AI-generated courses.

## Features

- **Modern React Setup**: React 18 with TypeScript and Vite
- **UI Components**: Ant Design with styled-components for custom styling
- **State Management**: Zustand for global state, React Query for server state
- **Routing**: React Router DOM for navigation
- **Code Quality**: ESLint, Prettier, and TypeScript strict mode
- **Feature-Driven Architecture**: Organized by features, not file types

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Ant Design (antd)
- **Styling**: Styled-components with theme support
- **State Management**: Zustand + React Query (@tanstack/react-query)
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Code Quality**: ESLint, Prettier, TypeScript

## Project Structure

```
frontend/
├── src/
│   ├── assets/          # Static files (images, icons)
│   ├── components/      # Shared UI components
│   │   ├── ui/         # Basic UI elements
│   │   ├── forms/      # Reusable form components
│   │   └── layout/     # Layout components
│   ├── features/       # Feature-based modules
│   │   └── home/       # Home page feature
│   ├── hooks/          # Shared custom hooks
│   ├── providers/      # Context providers
│   ├── routes/         # Route configuration
│   ├── services/       # API service layer
│   ├── stores/         # Global state management
│   ├── styles/         # Global styles and theme
│   ├── types/          # Global TypeScript types
│   ├── utils/          # Utility functions
│   └── main.tsx        # App entry point
├── package.json        # Dependencies and scripts
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── eslint.config.js    # ESLint configuration
└── .prettierrc         # Prettier configuration
```

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:3000

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is formatted
- `npm run type-check` - Check TypeScript types

### Code Quality

The project is configured with:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** in strict mode
- Absolute imports with path mapping (`@/` prefix)

### Feature Development

When creating new features:

1. Create a new folder in `src/features/`
2. Follow the feature structure:
   ```
   feature/
   ├── components/    # Feature-specific components
   ├── hooks/         # Feature-specific hooks
   ├── services/      # Feature API calls
   ├── stores/        # Feature state management
   ├── types/         # Feature TypeScript types
   └── index.ts       # Feature public API
   ```

### Component Guidelines

- Use **PascalCase** for component names
- Create component folders with `index.ts` for clean imports
- Use TypeScript interfaces for props
- Follow the anti-corruption layer pattern for external libraries
- Prefer composition over inheritance

### Styling Guidelines

- Use styled-components for custom styling
- Leverage the global theme for consistency
- Use Ant Design components as base UI elements
- Follow responsive design principles

## Testing Strategy

Following the API-First development approach:
- **No Frontend Unit Tests**: Frontend does not contain its own tests
- **E2E Testing Only**: All testing is done via end-to-end tests in a separate project
- **Full Stack Testing**: Tests run against complete backend + frontend system

## Environment Configuration

The frontend is configured to connect to the backend API:
- Development: http://localhost:8000
- Production: Configure via environment variables

## Build and Deployment

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Deploy static files** from the `dist/` directory to your hosting platform

## Contributing

1. Follow the established code style (ESLint + Prettier)
2. Use TypeScript strict mode
3. Follow the feature-driven architecture
4. Update documentation as needed
5. Ensure all code quality checks pass

## License

This project is part of the Book to Course Converter MVP.
