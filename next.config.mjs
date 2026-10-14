import { withPayload } from '@payloadcms/next/withPayload'

/** Two dev servers share one codebase, so each gets its own build folder. */
const nextConfig = {
  distDir: process.env.DEMO_STAGE === 'after' ? '.next-after' : '.next',
  typescript: { ignoreBuildErrors: true },
  devIndicators: false, // hides the dev badge so it never appears in recordings
}

export default withPayload(nextConfig)
