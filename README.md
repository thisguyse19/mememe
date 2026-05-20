# mememe

Personal hobby landing page — React, Vite, Tailwind CSS v4, and Framer Motion. Designed with soft glass surfaces, layered gradients, and responsive layout.

## Scripts

- `npm run dev` — local development
- `npm run build` — production build (uses `/mememe/` base path for GitHub Pages)
- `npm run preview` — preview the production build locally (`npm run preview -- --base /mememe/` if you need the Pages base path)

## GitHub Pages

1. In the repository **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Push to `main`; the **Deploy GitHub Pages** workflow builds and publishes the site.

For a fork or renamed repository, update the `repo` segment in `vite.config.ts` so `base` matches `https://<user>.github.io/<repo>/`.

## Secret channel (demo)

- **Long-press** the slim pill at the bottom (home-indicator style) to arm the hidden input.
- **Keyboard:** press **Escape three times** quickly (when not already armed) as an alternate trigger.
- Enter the four-letter code **`test`** to see the placeholder “Bringing you to …” state. More codes can be added in `src/config/secrets.ts`.

## Later

This stack is ready to add React Router, deploy to Vercel, and connect Supabase when you are ready.
