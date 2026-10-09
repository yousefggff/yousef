import { useCallback, useEffect, useRef, useState } from 'react'
import { dateKey, initialState, load, reconcile, save, STORAGE_KEY } from './engine'
import type { State } from './engine'
export function usePlanner() {
  const [initial] = useState(() => { try { return { state: load(localStorage), error: '' } } catch { return { state: initialState(), error: 'Saved progress could not be read. Your original data has been preserved. Import a valid backup in Settings to recover it.' } } })
  const [state, setState] = useState(initial.state)
  const [error, setError] = useState(initial.error)
  const [today, setToday] = useState(dateKey())
  const ref = useRef(state)
  const transact = useCallback(async (fn: (s: State) => State, replace = false) => {
    const operation = () => {
      try {
        const before = replace ? ref.current : load(localStorage)
        const next = fn(before)
        save(localStorage, next)
        ref.current = next; setState(next); setError('')
        return { before, next }
      } catch (e) { setError(e instanceof Error ? `${e.message} Progress was not saved. Export a backup or check browser storage access.` : 'Unable to save progress.'); return null }
    }
    if (navigator.locks) return navigator.locks.request('ascend-progress', operation)
    return operation()
  }, [])
  useEffect(() => {
    const refresh = () => { const now = dateKey(); setToday(now); void transact(s => reconcile(s, now)) }
    const sync = (e: StorageEvent) => { if (e.key === STORAGE_KEY) refresh() }
    if (!initial.error) refresh()
    window.addEventListener('focus', refresh); window.addEventListener('storage', sync)
    const timer = window.setInterval(refresh, 30000)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('storage', sync) }
  }, [initial.error, transact])
  return { state, today, error, transact }
}
