import path from 'path'
import { fileURLToPath } from 'url'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import { AiActivity } from './collections/AiActivity'
import { Claims } from './collections/Claims'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Users } from './collections/Users'
import { BrandRules } from './globals/BrandRules'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const after = process.env.DEMO_STAGE === 'after'

// "before" = studio + empty CMS; "after" = the generated Halden model.
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',
  db: sqliteAdapter({ client: { url: process.env.DATABASE_URI || 'file:./after.db' } }),
  editor: lexicalEditor(),
  collections: after ? [Users, Media, Pages, Claims, AiActivity] : [Users, Media],
  globals: after ? [BrandRules] : [],
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    components: after
      ? {
          beforeDashboard: ['/admin/AssistantPanel'],
          views: { review: { Component: '/admin/ReviewQueue', path: '/review' } },
        }
      : {},
  },
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
