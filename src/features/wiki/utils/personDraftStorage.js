const DATABASE_NAME = 'nospo-wiki-drafts'
const DATABASE_VERSION = 1
const DRAFT_STORE = 'person-drafts'
const IMAGE_STORE = 'person-images'

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

/** 이미지 파일 원본을 IndexedDB에 저장해 blob URL 만료 후에도 복구할 수 있게 한다. */
export const storePersonImage = (key, file) =>
  withStore(IMAGE_STORE, 'readwrite', (store) => store.put(file, key))

/** 저장한 이미지 파일 원본을 다시 가져온다. */
export const getPersonImage = (key) => withStore(IMAGE_STORE, 'readonly', (store) => store.get(key))

/** 초안 인물 목록을 이미지 blob 키와 함께 브라우저에 영구 저장한다. */
export const storePersonDraft = (key, people) =>
  withStore(DRAFT_STORE, 'readwrite', (store) => store.put(people, key))

/** 저장된 초안과 이미지 파일을 읽고 화면에서 사용할 새 미리보기 URL을 만든다. */
export const restorePersonDraft = async (key) => {
  const people = await withStore(DRAFT_STORE, 'readonly', (store) => store.get(key))
  if (!Array.isArray(people)) return null

  return Promise.all(
    people.map(async (person) => {
      if (!person.imageKey) return person
      const image = await withStore(IMAGE_STORE, 'readonly', (store) => store.get(person.imageKey))
      return { ...person, imageUrl: image ? URL.createObjectURL(image) : '' }
    }),
  )
}
