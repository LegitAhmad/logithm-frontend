# Logithm web application

Angular 21 coding education application. The API, deployment topology, typed grading contract and executor-host requirements are documented in [`../logithm-backend/README.md`](../logithm-backend/README.md).

## Run locally

Requires Node.js 22/npm and the running backend on `http://localhost:3000`.

```sh
npm ci
npm start
```

Open `http://localhost:4200`. Start the backend with `CORS_ORIGINS=http://localhost:4200`; use the same browser hostname consistently for cookie-based authentication. `environment.development.ts` selects the local API. Access tokens are browser-local; refresh credentials are httpOnly cookies and never exposed to application JavaScript. The interceptor attaches credentials only to the configured API origin/path and shares concurrent token-refresh attempts.

## Product workflows

- **Courses** (`/dashboard`): create a course, join with a code, browse your courses and toggle favorites.
- **Course details** (`/course/:id`): see assignments and create drafts as a teacher. Students do not see draft-authoring controls.
- **Assignments** (`/assignment/:id`): owner edits draft problem membership and scheduling, publishes, and can return scheduled work to draft before it starts. Once started, membership and schedule are locked. Students open assigned work; workspace links retain context for server-side membership/start/deadline checks.
- **Problem bank** (`/problems`): public and owned problems, search/difficulty filtering, author editing and draft-assignment attachment.
- **Problem authoring** (`/problem-creation`): Markdown statement, typed function contract, native JSON test values, visible/hidden cases, weighted points, structural/numeric/custom validation. `?questionId=...` edits an owned problem; `?assignmentId=...` attaches a new problem to that draft. A failed attachment retains the saved question and offers retry without duplicating it.
- **Coding workspace** (`/problem-detail/:id`): Python, JavaScript, TypeScript or Go starter function, per-problem/language browser draft, Monaco or an accessible plain-text editor, visible-case Run, full Submit, actual return values and nested type diagnostics. Reset explicitly confirms replacing a draft. Prints are debug output, not answers. Hidden tests show only generic grading outcomes.
- **Submission history/results** (`/submissions`, `/submissions/:id`): real current-user data and private visible/hidden case results.
- **Settings** (`/settings`): profile, optional avatar upload and password change with session revocation. Unsupported notification controls are not presented.
- Unknown destinations show a useful 404. Legacy bare editor/problem destinations redirect to a working bank/dashboard, not an empty component.

Browser drafts are local convenience storage, not server backups. Keep a copy if browser storage is unavailable or cleared. Legacy stdout-only questions must be migrated by their owner in the authoring page before execution.

## Authoring example

Contract:

```json
{
  "functionName": "add",
  "parameters": [
    { "name": "a", "type": { "type": "integer" } },
    { "name": "b", "type": { "type": "integer" } }
  ],
  "returnType": { "type": "integer" }
}
```

Tests entered in the UI:

```json
[
  { "input": [5, 10], "expectedOutput": 15, "isHidden": false, "points": 1 },
  { "input": [0, 0], "expectedOutput": 0, "isHidden": true, "points": 2 }
]
```

`input` is the ordered array of arguments; `expectedOutput` is the return value, not a string representation. Arrays/objects, zero, false, null and empty strings retain their types. Validate checks every case; the backend validates independently. The API adapter JSON-encodes values exactly once for transport/storage. Custom Python validators receive `actual`, `expected`, and `args` as parsed values in a separate executor sandbox.

## Build and verification

```sh
npm run build
npm test -- --watch=false
```

Production builds are static and use same-origin `/api`. The supplied non-root nginx image serves SPA deep links, proxies `/api/` to the API without that prefix, and keeps the entry HTML uncached. Use the backend compose file to build/launch both applications. Terminate TLS in a trusted proxy before exposing the application; production refresh cookies require HTTPS.

Routes load on demand rather than bundling every workspace into the landing page. Development SSR/prerendering renders only the public home/login/signup pages; private routes render in the browser, where their access token and authenticated data are available. This also preserves authenticated deep links on reload.

Behavioral tests cover JSON/type/argument/object-shape boundaries rather than generated component-construction assertions. Backend tests and `npm run test:execution` exercise the grading contract and real language wrappers. A production release also requires browser checks against the deployed API and real Piston sandbox/resource-limit checks; a successful frontend build alone does not verify those boundaries.
