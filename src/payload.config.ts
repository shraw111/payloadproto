import path from 'path'
import { fileURLToPath } from 'url'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import { AiActivity } from './collections/AiActivity'
import { Claims } from './collections/Claims'
import { Dealers } from './collections/Dealers'
import { Leads } from './collections/Leads'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Users } from './collections/Users'
import { BrandRules } from './globals/BrandRules'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const after = process.env.DEMO_STAGE === 'after'

// "before" = studio + empty CMS; "after" = the generated content model.
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',
  // Development pushes schema changes automatically. Production never does: it runs the committed
  // migrations in src/migrations (`npm run migrate` on start). After changing a collection, run
  // `npm run migrate:create -- <name>` and commit the new migration.
  db: sqliteAdapter({ client: { url: process.env.DATABASE_URI || 'file:./after.db' }, migrationDir: path.resolve(dirname, 'migrations') }),
  editor: lexicalEditor(),
  collections: after ? [Users, Media, Dealers, Pages, Leads, Claims, AiActivity] : [Users, Media],
  globals: after ? [BrandRules] : [],
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    components: after
      ? {
          beforeDashboard: ['/admin/DashboardSwitch'],
          views: { review: { Component: '/admin/ReviewQueue', path: '/review' } },
        }
      : {},
  },
  typescript: { autoGenerate: false, outputFile: path.resolve(dirname, 'payload-types.ts') },
})
