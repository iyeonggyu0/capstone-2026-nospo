import { useEffect, useRef, useState } from 'react'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 4096
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/** 등록·수정 저장 전에 이미지를 선택해 미리보기하고 검증한다. */
export const WikiCharacterImagePicker = ({ imageUrl = '', onFileSelected, disabled = false }) => {
  const inputRef = useRef(null)
  const localPreviewRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(imageUrl)
  const [error, setError] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    return () => {
      if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current)
    }
  }, [])

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError('JPEG, PNG, WebP 파일만 선택할 수 있어요.')
      return
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError('이미지는 5 MiB 이하로 선택해 주세요.')
      return
    }

    setIsValidating(true)
    setError('')

    try {
      const bitmap = await createImageBitmap(file)
      const { width, height } = bitmap
      bitmap.close()

      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        setError('이미지의 가로와 세로는 각각 4,096px 이하여야 해요.')
        return
      }
    } catch {
      setError('이미지를 읽을 수 없어요. 파일을 확인해 주세요.')
      return
    } finally {
      setIsValidating(false)
    }

    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current)
    localPreviewRef.current = URL.createObjectURL(file)
    setPreviewUrl(localPreviewRef.current)
    onFileSelected?.(file)
  }

  const canSelect = !disabled && !isValidating

  return (
    <div className="flex flex-col items-start gap-1">
      <input
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />
      <button
        aria-label="인물 이미지 선택"
        className="relative flex size-14 items-center justify-center overflow-hidden rounded-lg bg-teal-strong text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-strong disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!canSelect}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {previewUrl ? (
          <img alt="" className="size-full object-cover" src={previewUrl} />
        ) : (
          <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M12 8v8M8 12h8"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </svg>
        )}
        {isValidating && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-caption">
            확인 중
          </span>
        )}
      </button>
      {error && (
        <p className="text-caption text-red-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
