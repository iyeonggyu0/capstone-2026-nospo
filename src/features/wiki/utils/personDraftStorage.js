const DATABASE_NAME = 'nospo-wiki-drafts'
const DATABASE_VERSION = 1
const DRAFT_STORE = 'person-drafts'
const IMAGE_STORE = 'person-images'
export const PERSON_IMAGE_LOCK = 'nospo:wiki-person-images'

const openDatabase = () =>
  new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('이 브라우저에서는 이미지 임시 저장을 지원하지 않아요.'))
      return
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(DRAFT_STORE)) database.createObjectStore(DRAFT_STORE)
      if (!database.objectStoreNames.contains(IMAGE_STORE)) database.createObjectStore(IMAGE_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const withStore = async (storeName, mode, action) => {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode)
    const request = action(transaction.objectStore(storeName))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => reject(transaction.error)
  })
}

/** 제출 진행 상태는 IndexedDB 트랜잭션이 끝난 뒤에만 저장 성공으로 처리한다. */
const journalStore = async (mode, action) => {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE, mode)
    const request = action(transaction.objectStore(DRAFT_STORE))
    transaction.oncomplete = () => {
      database.close()
      resolve(request.result)
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error)
    }
    transaction.onabort = () => {
      database.close()
      reject(transaction.error ?? new Error('저장 취소'))
    }
  })
}

export const getSubmissionJournal = (key) => journalStore('readonly', (store) => store.get(key))
export const saveSubmissionJournal = (key, journal) =>
  journalStore('readwrite', (store) => store.put(journal, key))
export const deleteSubmissionJournal = (key) =>
  journalStore('readwrite', (store) => store.delete(key))

/** 이미지 파일 원본을 IndexedDB에 저장해 blob URL 만료 후에도 복구할 수 있게 한다. */
export const storePersonImage = (key, file) =>
  withStore(IMAGE_STORE, 'readwrite', (store) => store.put(file, key))

/** 저장한 이미지 파일 원본을 다시 가져온다. */
export const getPersonImage = (key) => withStore(IMAGE_STORE, 'readonly', (store) => store.get(key))

/** 도서 ID와 작성 모드에 따른 초안 저장 키를 생성한다. */
export const getPersonDraftKey = (bookId, mode = 'UPDATE') =>
  mode === 'CREATE'
    ? `nospo:wiki-person-draft:create:${bookId ?? 'preview'}`
    : `nospo:wiki-person-draft:${bookId ?? 'preview'}`

const omitImageUrl = (person) => {
  const storedPerson = { ...person }
  delete storedPerson.imageUrl
  return storedPerson
}

const stripPreviewUrls = (draft) => {
  if (Array.isArray(draft)) {
    return draft.map(omitImageUrl)
  }
  if (draft && typeof draft === 'object' && Array.isArray(draft.people)) {
    return {
      ...draft,
      people: draft.people.map(omitImageUrl),
    }
  }
  return draft
}

/** 초안 인물 목록을 이미지 blob 키와 함께 브라우저에 영구 저장한다. */
export const storePersonDraft = (key, draft) =>
  withStore(DRAFT_STORE, 'readwrite', (store) => store.put(stripPreviewUrls(draft), key))

/** 다른 탭의 초안이 바뀌지 않았을 때만 초안을 제거한다. 이미지는 다른 탭이 참조할 수 있어 보존한다. */
export const deletePersonDraftIfUnchanged = async (key, submitted) => {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(DRAFT_STORE, 'readwrite')
    const drafts = tx.objectStore(DRAFT_STORE)
    let removed = false
    const request = drafts.get(key)
    request.onsuccess = () => {
      const saved = request.result
      if (!saved || JSON.stringify(saved) !== JSON.stringify(stripPreviewUrls(submitted))) return
      drafts.delete(key)
      removed = true
    }
    tx.oncomplete = () => {
      database.close()
      resolve(removed)
    }
    tx.onerror = () => {
      database.close()
      reject(tx.error)
    }
    tx.onabort = () => {
      database.close()
      reject(tx.error ?? new Error('초안 정리 취소'))
    }
  })
}

/** 열린 편집기가 없을 때 한 트랜잭션에서 저장된 초안이 참조하지 않는 이미지만 정리한다. */
export const collectUnusedPersonImages = async () => {
  if (!navigator.locks?.request) return
  return navigator.locks.request(PERSON_IMAGE_LOCK, { ifAvailable: true }, async (lock) => {
    if (!lock) return
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
      const tx = database.transaction([DRAFT_STORE, IMAGE_STORE], 'readwrite')
      const drafts = tx.objectStore(DRAFT_STORE).getAll()
      const images = tx.objectStore(IMAGE_STORE)
      drafts.onsuccess = () => {
        const referenced = new Set(
          drafts.result.flatMap((draft) => {
            const people = Array.isArray(draft) ? draft : draft?.people
            return Array.isArray(people)
              ? people.map((person) => person.imageKey).filter(Boolean)
              : []
          }),
        )
        const cursor = images.openCursor()
        cursor.onsuccess = () => {
          const item = cursor.result
          if (!item) return
          if (
            typeof item.key === 'string' &&
            item.key.startsWith('nospo:wiki-person-draft:') &&
            !referenced.has(item.key)
          )
            item.delete()
          item.continue()
        }
      }
      tx.oncomplete = () => {
        database.close()
        resolve()
      }
      tx.onerror = () => {
        database.close()
        reject(tx.error)
      }
      tx.onabort = () => {
        database.close()
        reject(tx.error ?? new Error('이미지 정리 취소'))
      }
    })
  })
}

/** 저장하지 않기로 한 인물 초안과 초안 이미지 파일을 제거한다. */
export const deletePersonDraft = async (key, imageKeys = []) => {
  const savedDraft = await withStore(DRAFT_STORE, 'readonly', (store) => store.get(key))
  const savedPeople = Array.isArray(savedDraft) ? savedDraft : (savedDraft?.people ?? [])
  const keys = new Set([
    ...imageKeys,
    ...savedPeople.map((person) => person.imageKey).filter(Boolean),
  ])

  await Promise.all(
    [...keys].map((imageKey) =>
      withStore(IMAGE_STORE, 'readwrite', (store) => store.delete(imageKey)),
    ),
  )
  await withStore(DRAFT_STORE, 'readwrite', (store) => store.delete(key))
}

/** 저장된 초안과 이미지 파일을 읽고 화면에서 사용할 새 미리보기 URL을 만든다. */
export const restorePersonDraft = async (key) => {
  const savedDraft = await withStore(DRAFT_STORE, 'readonly', (store) => store.get(key))
  const people = Array.isArray(savedDraft) ? savedDraft : savedDraft?.people
  if (!Array.isArray(people)) return null

  return {
    people: await Promise.all(
      people.map(async (person) => {
        if (!person.imageKey) return person
        const image = await withStore(IMAGE_STORE, 'readonly', (store) =>
          store.get(person.imageKey),
        )
        return { ...person, imageUrl: image ? URL.createObjectURL(image) : '' }
      }),
    ),
    position: Array.isArray(savedDraft) ? null : (savedDraft.position ?? null),
    positionUnit: Array.isArray(savedDraft) ? null : (savedDraft.positionUnit ?? null),
  }
}
