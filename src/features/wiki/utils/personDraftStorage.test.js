import { afterEach, expect, it, vi } from 'vitest'
import { collectUnusedPersonImages, getPersonDraftKey } from './personDraftStorage'

afterEach(() => vi.unstubAllGlobals())

it('getPersonDraftKey는 모드와 bookId에 따라 초안 저장 키를 생성한다', () => {
  expect(getPersonDraftKey('book-1', 'CREATE')).toBe('nospo:wiki-person-draft:create:book-1')
  expect(getPersonDraftKey('book-1', 'UPDATE')).toBe('nospo:wiki-person-draft:book-1')
  expect(getPersonDraftKey(undefined, 'CREATE')).toBe('nospo:wiki-person-draft:create:preview')
})

it('열린 편집기가 없을 때 저장된 초안에 없는 이미지 키만 정리한다', async () => {
  const removed = []
  const keys = ['nospo:wiki-person-draft:used', 'nospo:wiki-person-draft:orphan', 'unrelated']
  const database = {
    close: vi.fn(),
    transaction: () => {
      const tx = {
        objectStore: (name) =>
          name === 'person-drafts'
            ? {
                getAll: () => {
                  const request = { result: [{ people: [{ imageKey: keys[0] }] }] }
                  queueMicrotask(() => request.onsuccess())
                  return request
                },
              }
            : {
                openCursor: () => {
                  let index = 0
                  const request = {}
                  const next = () => {
                    request.result =
                      index < keys.length
                        ? {
                            key: keys[index],
                            delete: () => removed.push(keys[index]),
                            continue: () => {
                              index += 1
                              queueMicrotask(next)
                            },
                          }
                        : null
                    request.onsuccess()
                    if (!request.result) queueMicrotask(() => tx.oncomplete())
                  }
                  queueMicrotask(next)
                  return request
                },
              },
      }
      return tx
    },
  }
  vi.stubGlobal('window', {
    indexedDB: {
      open: () => {
        const request = { result: database }
        queueMicrotask(() => request.onsuccess())
        return request
      },
    },
  })
  vi.stubGlobal('navigator', { locks: { request: async (_, __, callback) => callback({}) } })
  await collectUnusedPersonImages()
  expect(removed).toEqual([keys[1]])
  expect(database.close).toHaveBeenCalledOnce()
})

it('다른 탭이 편집 중이면 이미지 저장소를 열지 않는다', async () => {
  const open = vi.fn()
  vi.stubGlobal('window', { indexedDB: { open } })
  vi.stubGlobal('navigator', { locks: { request: async (_, __, callback) => callback(null) } })
  await collectUnusedPersonImages()
  expect(open).not.toHaveBeenCalled()
})
