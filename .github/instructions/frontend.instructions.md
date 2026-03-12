---
applyTo: "public/**"
---

# Frontend Conventions

## Stack

- **Vanilla JavaScript** — no React, Vue, or build step
- **CSS** with custom properties (variables) for theming
- **Chart.js 4** via CDN for forecast chart rendering
- Served as static files by Express from `public/`

## File Structure

```
public/
├── index.html    — Dashboard layout (single page)
├── style.css     — All styles, responsive, custom properties
└── app.js        — Application logic, API calls, DOM manipulation
```

## JavaScript Conventions

- No module bundler — everything in a single `app.js` IIFE/self-invoking scope
- Use `const`/`let`, no `var`
- Async data fetching with `fetch()` and `async`/`await`
- All API calls go through helper functions (`apiGet`, `apiPost`, `apiDelete`)
- State stored in a simple object, UI updated by explicit render functions
- DOM references cached at the top of the file

## CSS Conventions

- Custom properties for colors, spacing, and breakpoints (defined on `:root`)
- Mobile-first responsive design with `@media` queries
- BEM-like class naming (`.weather-card`, `.weather-card__title`)
- No CSS preprocessor (no Sass/Less)

## API Integration

- Base paths: `/api/weather/*` for weather data, `/api/locations/*` for CRUD
- JSON request/response bodies
- Error responses display user-friendly messages
- Loading states managed via CSS classes

## Testing

- **Playwright** for e2e tests — tests live in `tests/e2e/`
- Tests start the real server via `webServer` config in `playwright.config.ts`
- Selectors use `data-testid` attributes or semantic HTML elements
