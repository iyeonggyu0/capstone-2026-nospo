import { useEffect, useState } from 'react'
import { collectUnusedPersonImages, PERSON_IMAGE_LOCK } from '../utils/personDraftStorage'

/** 편집 중인 다른 탭이 참조하는 이미지를 정리하지 않도록 공유 잠금을 유지한다. */
export const usePersonDraftLease = () => {
  const [ready, setReady] = useState(
    () => typeof navigator === 'undefined' || !navigator.locks?.request,
  )
  useEffect(() => {
    if (!navigator.locks?.request) return
    let closed = false
    let release
    const held = new Promise((resolve) => {
      release = resolve
    })
    navigator.locks
      .request(PERSON_IMAGE_LOCK, { mode: 'shared' }, async () => {
        if (closed) return
        setReady(true)
        await held
      })
      .then(() => {
        if (closed) void collectUnusedPersonImages().catch(() => {})
      })
      .catch(() => {})
    return () => {
      closed = true
      release()
    }
  }, [])
  return ready
}
