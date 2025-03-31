# Tabli Development Guide

## Commands
- Build: `npm run build-dev` (development) or `npm run build-prod` (production)
- Test: `npm run test` (run all tests)
- Test single file: `npx jest __tests__/tabWindowTest.ts`
- Lint: `npm run lint` (check) or `npm run lintfix` (auto-fix)
- Watch: `npm run watch` (development) or `npm run watch-prod` (production)
- Storybook: `npm run storybook`

## Code Style
- TypeScript with React functional components and hooks
- 2-space indentation, no max line length
- Use PascalCase for components (FilteredTabWindowUI)
- Use camelCase for utils and non-components (tabWindowUtils)
- Components in .tsx files, utilities in .ts files
- Favor immutable state patterns (Immer used extensively)
- Use type definitions rather than interfaces where possible
- Error handling with try/catch blocks and loglevel library
- Tests use Jest with snapshot testing

## Architecture
- Chrome extension with popup and background contexts
- State managed in service worker running in background
- UI components should update state by calling functions in `actionsClient.ts`
- `actionsClient.ts` sends messages to service worker
- Service worker handles these messages in `actionsServer.ts`
- React for UI components with TypeScript for type safety
- Components are small and focused with clear responsibilities