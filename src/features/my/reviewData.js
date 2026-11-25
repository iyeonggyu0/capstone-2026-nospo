export const reviewLabels = {
  PENDING: '검수 중',
  CHANGES_REQUESTED: '수정 요청',
  APPROVED: '승인',
  REJECTED: '반려',
}
export const previewBook = {
  bookId: 'preview-book',
  title: '애주가의 절주 일기',
  coverUrl:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZisW5UzjFSeMfP9SjV-NeFkfHETornqEFVxEFqeyMmS6xSN6zPoWeK4M&s=10',
}
export const previewReviews = [
  {
    submissionId: 'preview-pending',
    bookId: previewBook.bookId,
    status: 'PENDING',
    submittedAt: '2026-10-01T00:00:00Z',
  },
  {
    submissionId: 'preview-pending-2',
    bookId: previewBook.bookId,
    status: 'PENDING',
    submittedAt: '2026-09-30T00:00:00Z',
  },
  {
    submissionId: 'preview-changes',
    bookId: previewBook.bookId,
    status: 'CHANGES_REQUESTED',
    submittedAt: '2026-09-28T00:00:00Z',
    reviewComment: '공개 시점을 확인하고 내용을 수정해 주세요.',
  },
  {
    submissionId: 'preview-approved',
    bookId: previewBook.bookId,
    status: 'APPROVED',
    submittedAt: '2026-09-20T00:00:00Z',
    decidedAt: '2026-09-25T00:00:00Z',
    rewardAmount: 2,
  },
  {
    submissionId: 'preview-rejected',
    bookId: previewBook.bookId,
    status: 'REJECTED',
    submittedAt: '2026-09-11T00:00:00Z',
    reviewComment: '제출 내용을 확인할 수 없습니다.',
  },
]
export const reviewDate = (value) =>
  value
    ? new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(value))
    : '날짜 정보 없음'
