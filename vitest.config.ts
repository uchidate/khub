import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next', 'tests/cron'],
    coverage: {
      provider: 'v8',
      // Só mede arquivos que têm testes — evita penalizar código sem testes intencionalmente
      include: [
        'lib/home/**/*.ts',
        'lib/utils/rate-limiter.ts',
        'lib/utils/api-rate-limiter.ts',
        'lib/utils/error.ts',
        'lib/utils/logger.ts',
      ],
      exclude: ['**/*.test.ts'],
      thresholds: {
        lines: 50,
        functions: 40,
        branches: 40,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname) }
  }
})
