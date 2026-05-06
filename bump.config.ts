import { defineConfig } from 'bumpp'

export default defineConfig({
  tag: '%s',
  // Bump all non-private workspace packages (root + packages/*) in lockstep.
  recursive: true,
})
