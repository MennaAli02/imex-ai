import { defineConfig } from 'vitest/config'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function parseDotEnv(path) {
  try {
    const raw = readFileSync(resolve(process.cwd(), path), 'utf8')
    const out = {}
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim()
    }
    return out
  } catch {
    return {}
  }
}

const env = parseDotEnv('.env')

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/integration/**/*.test.js'],
    globals: true,
    testTimeout: 30000,
    hookTimeout: 20000,
    // Vitest 4 setting for sequential file execution:
    fileParallelism: false,
    env,
  },
})
