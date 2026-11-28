import { useState } from 'react'
import { Button } from '@/components/common-ui'
import bookCoverPreview from '@/assets/images/wiki-book-cover-preview.png'

/** 검색한 도서의 위키가 없을 때 도서 정보를 보여주고 작성을 안내한다. */
export const WikiEmptyStateDialog = ({ book = {}, onStartCreation, onClose, disabled = false }) => {
  const [notice, setNotice] = useState('')

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-text-primary/35 px-9 py-8 backdrop-blur-[1.5px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby="wiki-empty-title"
        aria-modal="true"
        className="w-full max-w-[318px] rounded-xl bg-surface p-6 shadow-xl"
        role="dialog"
      >
        <h1 className="text-title font-bold text-text-primary" id="wiki-empty-title">
          등록된 위키가 없어요!
        </h1>
        <p className="mt-1 text-label text-text-secondary">
          읽으면서 채워나가면 AI 토큰을 받을 수 있어요.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <img
            alt=""
            className="size-[52px] shrink-0 rounded-md object-cover"
            src={book.coverUrl || bookCoverPreview}
          />
          <div className="min-w-0">
            <p className="truncate text-body font-medium text-text-primary">
              {book.title || '선택한 도서'}
            </p>
            {(book.category || book.format || book.author) && (
              <p className="mt-1 truncate text-caption text-text-secondary">
                {[book.category, book.format, book.author].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        <Button
          className="mt-5 rounded-lg font-bold"
          color="neutral"
          disabled={disabled}
          height="38px"
          onClick={onStartCreation}
          text="위키 작성하기"
          textStyle="label"
        />
        <button
          className="mt-1 min-h-8 w-full text-caption text-text-secondary"
          onClick={() => setNotice('도서 등록 요청은 담당 화면 연결 후 이용할 수 있어요.')}
          type="button"
        >
          등록 요청하기
        </button>
        {notice && (
          <p className="mt-2 text-center text-caption text-text-secondary" role="status">
            {notice}
          </p>
        )}
      </section>
    </div>
  )
}
