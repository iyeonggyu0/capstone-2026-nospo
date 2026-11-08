/**
 * 화면 본문의 최소 높이다. 스크롤 영역 높이에서 공통 헤더 높이(76px = 4.75rem)를 뺀 값이라,
 * 본문이 짧아도 하단 제출 영역이 항상 화면 아래에 붙는다.
 * 헤더 높이는 공통 `Header`(main 형태)의 높이와 같으므로, 헤더가 바뀌면 이 값도 함께 확인한다.
 */
export const SCREEN_MIN_HEIGHT_CLASS = 'min-h-[calc(100%-4.75rem)]'

/** 검수 진행 단계다. Figma `신청 위키 검수 B · 진행`의 순서와 안내 문구를 따른다. */
export const REVIEW_STEPS = [
  { id: 'submit', title: '제출', description: '입력한 위키 내용과 해금 시점이 접수되었어요.' },
  { id: 'review', title: '검수', description: '검수 의견을 반영해 한 항목을 수정해 주세요.' },
  { id: 'done', title: '완료', description: '수정본이 승인되면 위키에 안전하게 반영됩니다.' },
]

/**
 * 검수 상태(서버 값)와 현재 단계의 대응이다.
 * `PENDING_REVIEW`는 명세서의 관리자 검토 대기, `REJECTED`는 반려 후 수정 재제출, `APPROVED`는 승인이다.
 */
export const REVIEW_STATUS_STEP = {
  PENDING_REVIEW: 'submit',
  REJECTED: 'review',
  APPROVED: 'done',
}

/** 제출 직후(관리자 검토 대기) 단계에서만 보여주는 안내 문구다. */
export const REVIEW_SUBMITTED_NOTICE = '제출이 되었어요! 검수가 끝나면 토큰이 지급될 예정입니다.'
