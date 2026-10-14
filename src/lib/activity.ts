import type { Payload } from 'payload'

export async function logActivity(
  payload: Payload,
  a: {
    task: string
    page?: string | number | null
    inputSummary?: string
    output?: unknown
    accepted?: boolean
    usedBackup?: boolean
    userId?: string | number | null
  },
) {
  try {
    await payload.create({
      collection: 'ai-activity',
      data: {
        task: a.task,
        page: a.page ?? undefined,
        inputSummary: a.inputSummary?.slice(0, 240),
        output: a.output as any,
        accepted: a.accepted ?? false,
        usedBackup: a.usedBackup ?? false,
        requestedBy: a.userId ?? undefined,
      } as any,
    })
  } catch (e) {
    console.warn('[ai] could not log activity', (e as Error).message)
  }
}
