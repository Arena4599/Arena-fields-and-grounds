# Arena Fields & Grounds

A responsive athletic field maintenance app for phone, tablet, and desktop.

Features: per-day baseball and softball checklists; independent maintenance calendars; rainfall readings; work logs with crew time; before and after image pairs; weekly/monthly reports with print and CSV export. Photo uploads are resized on the device. Records and photos are scoped to the signed-in user.

## Current status

Application source is implemented and its local checks pass. Cloud publication was blocked by the managed environment proxy refusing connections to the Sites Git service. The Site was registered but is not deployed. Do not treat the expected Site URL as live.

The included standalone preview is usable locally and saves records in IndexedDB in that browser. It DOES NOT sync between devices. Its data is separate from the hosted application, and clearing browser storage deletes it. Preview data is not migrated into cloud storage. JPEG, PNG, and WebP photos are supported; HEIC depends on browser decoding and gives a conversion message where unsupported.

## Preview on your computer

1. On GitHub, choose **Code → Download ZIP**, then extract it (or clone this repository).
2. In a terminal, open the extracted repository folder and run:

   ```sh
   python3 -m http.server 8000 --directory preview --bind 127.0.0.1
   ```

   Windows: use `py -m http.server 8000 --directory preview --bind 127.0.0.1`.
3. Open **http://localhost:8000** in your browser. Press Ctrl+C in the terminal to stop the server.

No Node installation, dependencies, account setup, or cloud service is needed for the included preview. You can also try opening `preview/index.html` directly, but serving it over localhost gives browser storage a consistent origin.

## Preview on your iPhone or iPad

Keep the computer running and connect it and your device to the same trusted Wi-Fi network. Start the preview with:

```sh
python3 -m http.server 8000 --directory preview --bind 0.0.0.0
```

On Windows, replace `python3` with `py`. Find the computer's local IP address in its Wi-Fi/network settings, then open `http://YOUR-COMPUTER-IP:8000` in Safari on the iPhone or iPad. If the computer asks about firewall access, allow it only on your private network. Stop the server with Ctrl+C when finished. The local server does not require authentication; anyone on that network who can reach the port can open the preview.

Each browser stores its own records. Preview data does not sync across devices. Printing and CSV export work from the Reports screen. For the complete authenticated cloud app with shared storage across your devices, the pending Sites deployment must be completed.

## Development

Node.js 22+ is needed only to rebuild or run source checks:

```sh
node work/build.mjs
node work/check.mjs
node work/local-preview.mjs preview/index.html
```

The generated `preview/index.html` is committed so you can preview without a build.

## Source layout

- work/page.html: application interface and browser logic
- worker/api.js: authenticated API using D1 records and R2 images
- worker/index.js: generated self-contained Worker
- drizzle/0000_records.sql: initial database schema
- .openai/hosting.json: retained Site identity and requested storage bindings
- work/build.mjs: deterministic dependency-free build
- work/check.mjs: screen rendering, calculations, API access, and validation checks
- work/local-preview.mjs: standalone browser-local preview builder

Build: `node work/build.mjs`
Check: `node work/check.mjs`

The checks use a small DOM and database mock. Browser layout, real D1/R2 integration, hosting manifest/migration handling, and production deployment have not been verified. Before publishing, use the Sites source workflow with a fresh source credential for the existing project ID, validate the hosting storage configuration using the installed Sites tooling, include the schema migration in the deployment artifact, push the exact source commit, and deploy privately. Do not create a replacement Site.

A running deployment needs DB (Cloudflare D1), BUCKET (Cloudflare R2), the records table from the migration, and dispatch-injected oai-authenticated-user-id headers. Never expose the Worker directly without a trusted authentication layer.
