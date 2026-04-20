
# Medical Dashboard UI Prototype

Interactive medical dashboard prototype on mock data. The original visual source came from Figma and has been extended into a clickable demo-ready frontend prototype.

## Local run

Run `npm i` to install dependencies.

Run `npm run dev` to start the development server.

Run `npm run build` to create the production build.

## GitHub Pages deploy

The project is already configured for GitHub Pages:

- production routing uses hash URLs, so direct page refreshes do not break on static hosting;
- Vite builds assets with a relative base path;
- `.github/workflows/deploy-pages.yml` publishes `dist` automatically.

### What to do

1. Create an empty GitHub repository.
2. Push this project to the `main` branch.
3. In GitHub open `Settings -> Pages` and make sure the source is `GitHub Actions`.
4. After the workflow finishes, the site will open at:

`https://<your-github-username>.github.io/<repo-name>/`

## Notes

- Because GitHub Pages is static hosting, URLs will look like `#/patients`, `#/appointments` and so on.
- Mock data is stored in browser `localStorage`, so demo changes persist between page reloads on the same device/browser.
  
