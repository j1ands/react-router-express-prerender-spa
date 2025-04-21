# React Router v7 w/ Pre-rendering & no SSR + Express

Coming back to React after a couple of years of SvelteKit, I was hoping to recreate the same developer experience. The good news is that Vite is the backbone of the SvelteKit experience and leveraging it for a React Router v7 app is the default approach. Here is the experience I was hoping to produce:

DEV:
- vite dev server with HMR
- react router v7 powering client-side routing
- express server running in a separate process on a different port

PROD:
- vite build
- react router v7 powering client-side routing
- prerendered routes with react router's vite plugin
- express server servering the prerendered routes and the index.html as a fallback

I was able to achieve this largely by following the docs here: [react router framework adoption from component routes](https://reactrouter.com/upgrading/component-routes#enable-ssr-andor-pre-rendering).

For a more complete guide, follow these steps (working as of 2025-04-20):

(If you have an existing vite + react router + express app that's missing pre-rendering, you can skip to step ten. Though, if you have any issues, confirm that your setup matches the first nine steps.)

(An alternative guide based off of `create-react-router` is coming soon.)

1. `npx create-vite@latest`
  a. Choose the React framework and TypeScript variant
2. Remove `type: module` from the `package.json` file
3. Save the following dependencies in your `package.json`:
```
// dev dependencies
"@react-router/dev": "^7.5.0",
"@react-router/node": "^7.5.0",
"@types/express": "^5.0.1",
"nodemon": "^3.1.9",
"npm-run-all": "^4.1.5"

// dependencies
"express": "^5.1.0",
"isbot": "^5",
"react-router": "^7.5.0",
```
4. Rename `tsconfig.node.json` to `tsconfig.config.json`
5. Add a new `tsconfig.node.json` file with the following content:
```
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": ".",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["server.ts"],
  "exclude": ["node_modules", "dist"]
}
```
6. Update `tsconfig.json` with the following references:
```
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.config.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```
7. Update the `tsconfig.app.json` file to include the following:
```
"compilerOptions": {
  "rootDirs": [".", "./.react-router/types"]
},
"include": ["src", ".react-router/types/**/*"]
```
8. Create a `server.ts` file with the following content:
```
import express from 'express'
import path from 'path';
import fs from 'fs';

async function createServer() {
  const app = express()
  const PORT = process.env.PORT || 3000;
  const isDev = process.env.NODE_ENV === 'development';

  app.use(express.static(path.resolve(__dirname, '../build/client')));

  const htmlTemplate = isDev ? null : fs.readFileSync(
    path.resolve(__dirname, '../dist/__spa-fallback.html'), 
    'utf-8'
  );

  app.use('/{*splat}', async (_, res) => {
    if (!isDev) {
      res.send(htmlTemplate);
    } else {
      res.send("Not found").status(404);
    }
  })

  app.listen(PORT, () => {
    console.log(`app listening on port ${PORT}`);
  })
}

createServer()
```
9. Update the `vite.config.ts` file to utilize the react router plugin, instead of the default vite react plugin:
```
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    reactRouter()
  ],
  build: {
    outDir: 'build/client',
    emptyOutDir: true,
    manifest: true
  }
});
```
10. Create a `react-router.config.ts` file with the following content:
```
import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  ssr: false,
  prerender: true,
  future: {
    unstable_viteEnvironmentApi: true
  }
} satisfies Config;
```

**NOTE**
The `unstable_viteEnvironmentApi` flag is required for the prerender option to work when ssr is false. Specifically, it avoids the early return [here](https://github.com/remix-run/react-router/blob/main/packages/react-router-dev/vite/plugin.ts#L1661-L1667) when vite is building the production server bundle.

11. Delete the project root `index.html` file and create a `src/root.tsx` file with the following content:
```
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

export function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>My App</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}
```
12. For the sake of being thorough in this prerender setup, create two new files: `src/pages/home.tsx` and `src/pages/about.tsx`.

```
export default function Home() {
  return <h1>Home</h1>
}
```

```
import type { Route } from "./+types/about";

export async function loader() {
  const post = {
    title: "Hellos",
  };
  return post;
}

export default function About({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.title}</div>;
}
```

**NOTE**

Don't worry about any linting errors in the `src/pages/about.tsx` file. This is expected at this time.

13. Add a `src/catchall.tsx` file with the following content:
```
export default function Component() {
  return <div>Hello, world!</div>;
}
```

14. Add a `src/routes.ts` file with the following content:
```
import {
  type RouteConfig,
  route,
  index
} from "@react-router/dev/routes";

export default [
  // * matches all URLs, the ? makes it optional so it will match / as well
  index("./App.tsx"),
  route("/home", "./pages/home.tsx"),
  route("/about", "./pages/about.tsx"),
  route("*?", "./catchall.tsx"),
] satisfies RouteConfig;
```
15. Update the package.json scripts to include the following:
```
"build": "NODE_ENV=production npm-run-all -s build:tsc build:vite copy-html",
"build:tsc": "tsc -b",
"build:vite": "vite build",
"copy-html": "mkdir -p dist && cp build/client/__spa-fallback.html dist/",
"debug-vite-build": "node --inspect-brk ./node_modules/vite/bin/vite.js build --watch",
"dev": "NODE_ENV=development npm-run-all -s build:tsc -p watch:server start:client start:server",
"lint": "eslint .",
"preview": "NODE_ENV=production npm-run-all -s build start:server",
"start:client": "vite --port 3000",
"start:server": "PORT=3001 nodemon dist/server.js",
"watch:server": "tsc -w -p tsconfig.node.json",
"typecheck": "react-router typegen && tsc"
```
16. Update the .gitignore file to include the following:
```
.react-router/
build/
```
17. Before running the app, you'll need an entry.client.tsx and entry.server.tsx file. Here are the default contents for each, as included in the create-react-router template after running `npx react-router reveal`:
```
// entry.client.tsx
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
```

```
// entry.server.tsx
import { PassThrough } from "node:stream";

import type { AppLoadContext, EntryContext } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";

export const streamTimeout = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext
  // If you have middleware enabled:
  // loadContext: unstable_RouterContextProvider
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    let readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    setTimeout(abort, streamTimeout + 1000);
  });
}
```
18. Replace the contents of the `src/App.tsx` file with the following:
```
import './App.css'
import { NavLink } from 'react-router'

function App() {

  return (
    <nav className="nav">
      <NavLink to="/home">Home</NavLink>
      <NavLink to="/about">About</NavLink>
    </nav>
  )
}

export default App
```
19. Replace the contents of the `src/App.css` file with the following:
```
.nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
} 
```
20. Delete the `src/main.tsx` file.
21. Prior to running `npm run dev`, ensure your browser's cache for localhost is cleared.
22. Try either:

```
npm run dev
```
or
```
npm run build
npm run preview
```
23. Have fun!