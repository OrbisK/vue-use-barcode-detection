import type { Nuxt } from '@nuxt/schema'
import { existsSync } from 'node:fs'
import process from 'node:process'
import { cancel, confirm, intro, isCancel, outro } from '@clack/prompts'
import { logger } from '@nuxt/kit'
import { colors } from 'consola/utils'
import { resolveModulePath } from 'exsolve'
import { loadFile, writeFile } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'
import { addDependency, detectPackageManager } from 'nypm'
import { join } from 'pathe'
import { hasTTY, isCI } from 'std-env'

const polyfillPkg = 'barcode-detector'

export async function runInstallWizard(nuxt: Nuxt): Promise<void> {
  if (isCI || !hasTTY || nuxt.options.test) return

  const rootDir = nuxt.options.rootDir
  const configPath = findNuxtConfig(rootDir)

  // Already set up — package installed AND polyfill enabled. Nothing to do.
  const polyfillInstalled = !!resolveModulePath(polyfillPkg, { from: rootDir, try: true })
  const currentlyEnabled =
    (nuxt.options as { barcodeDetection?: { polyfill?: boolean } }).barcodeDetection?.polyfill ===
    true
  if (polyfillInstalled && currentlyEnabled) return

  intro(colors.bold(colors.cyan('📷 vue-use-barcode-detection setup')))

  const shouldEnable = await confirm({
    message:
      'Some browsers (Firefox, Safari, Linux Chromium) ship no native BarcodeDetector. Install and enable the `barcode-detector` polyfill?',
    initialValue: true,
  })

  if (isCancel(shouldEnable)) {
    cancel('Setup cancelled.')
    process.exit(0)
  }

  if (!shouldEnable) {
    outro(colors.dim('Skipped. Re-run setup by reinstalling the module.'))
    return
  }

  if (!polyfillInstalled) {
    const packageManager = await detectPackageManager(rootDir)
    try {
      await addDependency(polyfillPkg, { cwd: rootDir, packageManager })
    } catch (error) {
      logger.error(`Failed to install \`${polyfillPkg}\`:`, error)
      outro(colors.red(`Please install \`${polyfillPkg}\` manually.`))
      return
    }
  }

  if (!currentlyEnabled) {
    if (configPath) {
      try {
        await enablePolyfillInConfig(configPath)
      } catch (error) {
        logger.warn(`Could not update \`${configPath}\` automatically:`, error)
        logger.info(`Add \`barcodeDetection: { polyfill: true }\` to your Nuxt config manually.`)
      }
    } else {
      logger.info(
        `No \`nuxt.config\` found — add \`barcodeDetection: { polyfill: true }\` manually.`,
      )
    }
  }

  outro(colors.green(`✨ Polyfill ready.`))
}

function findNuxtConfig(rootDir: string): string | undefined {
  for (const ext of ['ts', 'mts', 'js', 'mjs']) {
    const candidate = join(rootDir, `nuxt.config.${ext}`)
    if (existsSync(candidate)) return candidate
  }
  return undefined
}

async function enablePolyfillInConfig(configPath: string): Promise<void> {
  const mod = await loadFile(configPath)
  const config = getDefaultExportOptions(mod) as {
    barcodeDetection?: { polyfill?: boolean }
  }
  config.barcodeDetection ??= {}
  config.barcodeDetection.polyfill = true
  await writeFile(mod as Parameters<typeof writeFile>[0], configPath)
}
