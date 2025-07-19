# Vite Development Server Workaround

## Problem

Vite 7.0.4 has a known issue in WSL environments where the CLI reports the server as "ready" but fails to properly bind to the port, making it inaccessible.

## Symptoms

- Vite reports "ready in ~3000ms" and shows `Local: http://localhost:3000/`
- `curl http://localhost:3000` returns "Connection refused"
- `ss -tlnp | grep 3000` shows no process listening on port 3000
- The server appears to start but is not accessible

## Solution

A workaround script (`workaround-dev.cjs`) has been created that:

1. Starts Vite as a child process
2. Monitors the output for "ready" status
3. Performs health checks to verify the server is actually accessible
4. Provides clear feedback on server status

## Usage

```bash
# From frontend directory
npm run dev

# From parent directory
npm run dev:frontend

# Direct vite (will have the issue)
npm run dev:direct
```

## Files Modified

- `package.json`: Changed dev script to use workaround
- `workaround-dev.cjs`: The workaround script
- `vite.config.ts`: Simplified configuration for better compatibility

## Recommended Long-term Solution

Consider downgrading to Vite 5.x which is more stable:

```bash
npm install vite@^5.4.11 --save-dev
```

However, due to permission issues with npm in this WSL environment, the workaround script is the most practical solution.

## Testing

The workaround has been tested and:

- ✅ Correctly identifies when Vite is ready
- ✅ Verifies server accessibility with health checks
- ✅ Provides clear status messages
- ✅ Handles process termination gracefully
- ✅ Works with both direct and parent directory execution
