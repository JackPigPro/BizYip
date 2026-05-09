'use client'

import { createContext, useContext, useMemo, useState } from 'react'

type AppStateContextType = {
  duelDraft: string
  forumDraft: string
  highlightLearn: boolean
  setDuelDraft: (value: string) => void
  setForumDraft: (value: string) => void
  setHighlightLearn: (value: boolean) => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [duelDraft, setDuelDraft] = useState('')
  const [forumDraft, setForumDraft] = useState('')
  const [highlightLearn, setHighlightLearn] = useState(false)

  const value = useMemo(
    () => ({ duelDraft, forumDraft, highlightLearn, setDuelDraft, setForumDraft, setHighlightLearn }),
    [duelDraft, forumDraft, highlightLearn]
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider')
  }
  return context
}
