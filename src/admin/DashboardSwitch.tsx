'use client'
import { useAuth } from '@payloadcms/ui'
import React from 'react'

import AssistantPanel from './AssistantPanel'
import DealerStart from './DealerStart'
import HqSummary from './HqSummary'

/** Dealers get a simple "What's your offer?" start screen. HQ gets the network summary and its own tools. */
export default function DashboardSwitch() {
  const { user } = useAuth() as any
  if (!user) return null
  if (user.role === 'dealer') return <DealerStart />
  return (
    <>
      <HqSummary />
      <AssistantPanel />
    </>
  )
}
