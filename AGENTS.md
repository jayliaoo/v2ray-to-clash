# AGENTS.md
# Instructions for AI Coding Agents Operating in This Repository

## 1. Project Overview
This is a Cloudflare Worker project that converts V2Ray/VLESS subscription links to Clash configuration YAML format. It automatically fetches upstream subscriptions, processes proxies, adds geolocation flags, builds proxy groups, and serves the final Clash config from R2 storage. The worker runs on a schedule to update the config automatically.

## 2. Core Commands
### Package Manager
Use **pnpm** exclusively for all package operations. The project uses pnpm@10.26.2 as specified in package.json.

### Build & Development
| Command | Description |
|---------|-------------|
| `pnpm dev` | Start local development server with wrangler (runs on http://localhost:8787) |
| `pnpm deploy` | Deploy the worker to Cloudflare production environment |

### Test Commands
Test dependencies (vitest, @cloudflare/vitest-pool-workers) have been removed from the project. There are currently no test commands configured. If tests are added in the future, follow standard vitest patterns for Cloudflare Workers.

## 3. Code Style Guidelines
### General Formatting
- **Indentation**: Use tabs for all files except YAML files, which use spaces (per .editorconfig)
- **Line endings**: LF (Unix style) for all files
- **Charset**: UTF-8
- **Trailing whitespace**: Trim all trailing whitespace
- **Final newlines**: Ensure all files end with a single newline
- **Print width**: 140 characters maximum line length (per Prettier config)
- **Quotes**: Use single quotes for strings (double quotes only when necessary for string interpolation or escaping)
- **Semicolons**: Always use semicolons to end statements

### Imports
- Order imports in this sequence:
  1. Node.js built-in modules first (e.g. `node:buffer`)
  2. Third-party dependencies next (e.g. `yaml`)
  3. Local project imports last (e.g. `../rules.yaml`)
- Do not add unused imports
- Use ES module `import` syntax exclusively (no CommonJS `require`)

### Naming Conventions
- **Functions**: Use camelCase for function names, make names descriptive of their purpose (e.g. `addFlag`, `convert`)
- **Variables**: Use camelCase for all variables and constants
- **Object properties**: Use camelCase for standard properties, follow existing naming patterns for Clash-specific properties (which may contain hyphens, e.g. `ws-opts`, `reality-opts`)
- **Files**: Use lowercase filenames with no spaces, use `.js` extension for JavaScript files

### Syntax & Structure
- Use `async/await` for all asynchronous operations (no promise chaining with `.then()`)
- Use arrow functions for callbacks only when appropriate, prefer named functions for better stack traces
- Prefer `const` for variables that don't change, use `let` only when reassignment is necessary, avoid `var` entirely
- Use conditionals with clear logic, avoid nested ternaries that reduce readability
- Follow existing patterns for proxy parsing and Clash config structure

### Error Handling
- For new code, add try/catch blocks around network requests and potentially failing operations
- In worker handlers, ensure errors are properly handled to avoid worker crashes
- For scheduled tasks, ensure failures don't break future executions

### Type Conventions
- This project uses plain JavaScript (no TypeScript)
- Perform explicit type conversions where necessary (e.g. `Number(url.port)`)
- Validate input data before processing (e.g. check if lines start with `vmess://` before parsing)

## 4. Project Structure
```
├── src/
│   └── index.js          # Main worker entry point (scheduled + fetch handlers)
├── rules.yaml            # Base Clash configuration template with routing rules
├── wrangler.jsonc        # Cloudflare Worker configuration
├── package.json          # Project dependencies and scripts
├── .prettierrc           # Prettier formatting config
└── .editorconfig         # Editor configuration
```

## 5. Key Dependencies
- `yaml`: For parsing and stringifying YAML configuration
- `wrangler`: Cloudflare Worker CLI for development and deployment
- Cloudflare Worker runtime APIs (R2, fetch, scheduled events)

## 6. Contribution Guidelines
- Follow existing code patterns when adding new features
- Test changes locally with `pnpm dev` before deployment
- Do not commit secrets, API keys, or personal subscription URLs to the repository
- Keep the `rules.yaml` file updated with any new routing rules or domain additions
- When modifying proxy parsing logic, ensure compatibility with both VMess and VLESS subscription formats

## 7. Best Practices
- When modifying proxy group logic, maintain the existing group structure (v2net selection, automatic url-test, fallback, AI group)
- Preserve geolocation flag functionality for proxy names
- Ensure all proxy types (VMess, VLESS, Reality) are handled correctly
- Keep scheduled task execution efficient, avoid unnecessary network calls
- Follow Cloudflare Worker best practices for performance and resource usage