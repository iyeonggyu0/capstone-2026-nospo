import bookCover from '@/assets/images/wiki/book-cover.png'

// 개발 중 위키 내용(보기) 화면을 눈으로 확인하기 위한 샘플이다. 서버나 모의 API 데이터에는 섞이지 않는다.
// 이름은 모두 예시이며, 개발 모드에서 주소에 `preview`가 있을 때만 쓴다.

/** 샘플 단체 식별자의 접두사다. 이 접두사로 시작하는 식별자는 서버가 아니라 샘플에서 찾는다. */
export const PREVIEW_GROUP_PREFIX = 'preview-'

/** 샘플 화면에서 쓰는 도서 정보다. */
export const PREVIEW_BOOK = {
  title: '애주가의 절주 일기',
  coverImageSrc: bookCover,
  progressLabel: '32화까지 읽음',
  statusLabel: '스포일러 보호 중',
  editLabel: '32화 수정',
  currentEpisode: 32,
  episodeUnit: '화',
}

/** 샘플 단체 상세다. 40화에 나오는 인물과 행적은 진도 때문에 숨겨지는지 확인하는 용도다. */
export const PREVIEW_GROUP_DETAILS = {
  'preview-g1': {
    id: 'preview-g1',
    name: '그리핀도르',
    scale: '중',
    memberCount: 4,
    members: [
      { id: 'p1', name: '이영규', unlockEpisode: 1 },
      { id: 'p2', name: '배서현', unlockEpisode: 3 },
      { id: 'p3', name: '김민솔', unlockEpisode: 7 },
      { id: 'p9', name: '미래에 나오는 인물', unlockEpisode: 40 },
    ],
    relations: {
      friendly: [{ id: 'preview-g2', name: '래번클로', scale: '소', memberCount: 1 }],
      hostile: [{ id: 'preview-g3', name: '슬리데린', scale: '소', memberCount: 1 }],
    },
    milestones: [
      { id: 'm1', content: '첫 출항', unlockEpisode: 4 },
      { id: 'm2', content: '낡은 지도를 발견', unlockEpisode: 7 },
      { id: 'm3', content: '폭풍을 피해 항로를 제안', unlockEpisode: 12 },
      { id: 'm4', content: '아직 모르는 미래 행적', unlockEpisode: 40 },
    ],
  },
  'preview-g2': {
    id: 'preview-g2',
    name: '래번클로',
    scale: '소',
    memberCount: 1,
    members: [{ id: 'p3', name: '김민솔', unlockEpisode: 7 }],
    relations: {},
    milestones: [],
  },
  'preview-g3': {
    id: 'preview-g3',
    name: '슬리데린',
    scale: '소',
    memberCount: 1,
    members: [{ id: 'p2', name: '배서현', unlockEpisode: 3 }],
    relations: {},
    milestones: [],
  },
  'preview-g4': {
    id: 'preview-g4',
    name: '후플푸프',
    scale: '소',
    memberCount: 1,
    members: [{ id: 'p1', name: '이영규', unlockEpisode: 1 }],
    relations: {},
    milestones: [],
  },
}

/** 샘플 단체 목록(카드용 요약)이다. */
export const PREVIEW_GROUP_ITEMS = Object.values(PREVIEW_GROUP_DETAILS).map(
  ({ id, name, memberCount }) => ({ id, name, memberCount }),
)

/** 샘플 인물 수다. 단체 목록 화면의 `인물` 칩 숫자에 쓴다. */
export const PREVIEW_PERSON_COUNT = 3

/**
 * 개발 모드에서 샘플 단체 식별자인지 확인한다.
 *
 * @param {string | null | undefined} groupId 확인할 단체 식별자
 * @returns {boolean} 샘플에서 찾아야 하면 true
 */
export const isPreviewGroupId = (groupId) =>
  import.meta.env.DEV && typeof groupId === 'string' && groupId.startsWith(PREVIEW_GROUP_PREFIX)
