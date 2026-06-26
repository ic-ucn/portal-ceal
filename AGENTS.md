# Portal CEIC / CEAL UCN

## Product Rules

- The portal is for students and CEAL members of Ingenieria Civil UCN.
- Do not show "demo", "simulacion", "backend", "local", "mock" or developer-oriented wording in the UI.
- Keep public student routes useful without requiring member access.
- Keep internal CEAL routes protected behind the CEAL role.
- Never expose sensitive candidate-list data such as RUT or PPA in the app, generated docs, screenshots, commits, or logs.
- CEAL member accounts are generated from public candidacy context, using only name, role, username, email-style identifier, initials and permissions.

## Data Model

- `src/mock-data.js` is the static fallback seed for GitHub Pages.
- `server.mjs` provides the local operational backend and persists to `.data/portal-db.json`.
- `.data/` is runtime state and must stay untracked.
- The same flows must work with the local backend and with static localStorage fallback.
- Mallas use `data/curricula.js`: Plan O Catalogo 2016 and Plan P Catalogo 2025.

## Verification

Before publishing, run:

```powershell
npm run check
npm run quality
node scripts/qa-portal.mjs
```

Also verify the current local app in browser at desktop and mobile widths:

- login as student
- CEAL first-login password setup and login
- home, comunicados, calendario/acuerdos, casos, material, mallas, apoyo, perfil
- CEAL gestion, editor, case management, material validation, new agreement
- malla close button, Plan O / Plan P switch, mobile semester switch
- material upload with a real file and download
- case creation and CEAL response/update

## Publishing

- After user-facing changes, update `https://ceicucn.cl` by committing the scoped changes and pushing `main` to `origin`.
- When `src/app.js` or `src/styles.css` changes, bump the static asset query string in `index.html` so GitHub Pages/CDN does not serve stale files.
- After pushing, verify production with a cache-busted load of `https://ceicucn.cl` at desktop and mobile widths.

## Design Constraints

- Keep the interface quiet, academic, direct and practical.
- Avoid marketing copy.
- Avoid empty or decorative modules.
- Use stable dimensions for cards, nav, malla columns, chips, bottom nav and buttons.
- Mobile must not horizontally overflow or overlap the bottom navigation.
