import bookCover from '@/assets/images/wiki/book-cover.png'

// 개발용 메모리 모의 응답: 서버나 실제 데이터를 변경하지 않는다.
// 이 파일은 개발 모드에서만 불러오므로, 아래 샘플 이미지(Figma 시안 이미지)는 배포 결과물에 포함되지 않는다.
// 제출 요청에 '실패'라는 글자가 들어 있으면 서버 오류를 흉내 내서, 실패해도 입력이 유지되는지 시험할 수 있다.
/** 서버 응답을 기다리는 느낌을 내기 위한 모의 지연 시간(ms)이다. 테스트에서는 기다리지 않는다. */
const WAIT_MS = 400

/** 모의 도서 정보. 단체 목록과 검수 진행 화면의 도서 카드에 쓴다. */
const book = {
  title: '애주가의 절주 일기',
  progressLabel: '32화까지 읽음',
  statusLabel: '스포일러 보호 중',
  coverImageSrc: bookCover,
  editLabel: '32화 수정',
  currentEpisode: 32,
  episodeUnit: '화',
}

/** 모의 단체 목록이다. 단체 이름은 모두 예시이며, 목록은 샘플 하나만 둔다. */
const groups = [{ id: 'g1', name: '그리핀도르', scale: '중', memberCount: 12 }]

/** 단체 식별자별 모의 상세 정보(구성원·관계·주요 행적)다. */
const details = {
  g1: {
    members: [
      { id: 'p1', name: '서하준', unlockEpisode: 1 },
      { id: 'p2', name: '이도윤', unlockEpisode: 3 },
      { id: 'p3', name: '박지우', unlockEpisode: 7 },
    ],
    relations: {},
    milestones: [
      { id: 'm1', content: '폭풍을 피해 새로운 항로를 제안', unlockEpisode: 12 },
      { id: 'm2', content: '선원들을 설득해 항해를 이어감', unlockEpisode: 10 },
      { id: 'm3', content: '낡은 지도를 발견', unlockEpisode: 7 },
      { id: 'm4', content: '첫 출항', unlockEpisode: 4 },
    ],
  },
}

// 검수 진행 상황 샘플: r1은 Figma 시안(관리자 검토 대기), r2·r3은 단계별 모양을 확인하기 위한 개발용 값이다.
/** 검수 신청 식별자별 모의 데이터다. r1은 시안 그대로이고 r2(반려)·r3(승인)는 단계별 모양 확인용이다. */
const reviews = {
  r1: { id: 'r1', status: 'PENDING_REVIEW', submittedAt: '2026-10-01T09:30:00+09:00' },
  r2: { id: 'r2', status: 'REJECTED', submittedAt: '2026-09-28T18:10:00+09:00' },
  r3: { id: 'r3', status: 'APPROVED', submittedAt: '2026-09-20T11:00:00+09:00' },
}

let lastProposalNumber = 0

/** 서버 응답을 기다리는 시간을 흉내 낸다. 테스트에서는 기다리지 않는다. */
const wait = () =>
  import.meta.env.MODE === 'test' ? Promise.resolve() : new Promise((r) => setTimeout(r, WAIT_MS))

/** 없는 대상을 요청했을 때 서버가 돌려주는 404 오류 모양을 만든다. */
const notFound = () => ({ response: { status: 404, data: { error: { code: 'NOT_FOUND' } } } })

/** 제출 내용에 '실패'가 들어 있으면 서버에 연결하지 못한 상황을 흉내 낸다. */
const failIfRequested = (data) => {
  if (JSON.stringify(data).includes('실패')) throw new Error('모의 서버 연결 실패')
}

/** 관계에 쓸 단체 요약(이름, 규모, 인원)을 식별자로 찾는다. */
const toSummary = (id) => groups.find((group) => group.id === id)

/** 단체 하나의 상세 정보를 만든다. 상세 데이터가 없는 단체는 빈 목록으로 채운다. */
const buildDetail = (group) => {
  const detail = details[group.id] ?? { members: [], relations: {}, milestones: [] }

  return {
    ...group,
    members: detail.members,
    relations: Object.fromEntries(
      Object.entries(detail.relations).map(([type, ids]) => [type, ids.map(toSummary)]),
    ),
    milestones: detail.milestones,
  }
}

/** 제출을 접수하고 관리자 검토 대기 상태로 응답한다. 승인 전 제안은 목록에 섞지 않는다. */
const acceptProposal = (data) => {
  failIfRequested(data)
  lastProposalNumber += 1

  return { proposalId: `proposal-${lastProposalNumber}`, status: 'PENDING_REVIEW' }
}

/** 개발 중 API 요청을 받아 모의 응답을 돌려준다. 실제 API와 같은 `(method, path, data)` 모양이다. */
export const request = async (method, path, data) => {
  await wait()

  if (method === 'get' && path === '/wiki/groups') {
    return {
      book,
      personCount: 7,
      items: groups.map(({ id, name, memberCount }) => ({
        id,
        name,
        memberCount,
      })),
    }
  }

  const detailMatch = path.match(/^\/wiki\/groups\/([^/]+)$/)
  if (method === 'get' && detailMatch) {
    const group = groups.find((item) => item.id === decodeURIComponent(detailMatch[1]))
    if (!group) throw notFound()

    return { book, group: buildDetail(group) }
  }

  if (method === 'post' && path === '/wiki/group-proposals') return acceptProposal(data)

  const editMatch = path.match(/^\/wiki\/groups\/([^/]+)\/edit-proposals$/)
  if (method === 'post' && editMatch) return acceptProposal(data)

  const reviewMatch = path.match(/^\/wiki\/reviews\/([^/]+)$/)
  if (method === 'get' && reviewMatch) {
    const review = reviews[decodeURIComponent(reviewMatch[1])]
    if (!review) throw notFound()

    return {
      ...review,
      book: {
        title: book.title,
        coverImageSrc: book.coverImageSrc,
        reflectedEpisode: book.currentEpisode,
        episodeUnit: book.episodeUnit,
      },
    }
  }

  throw notFound()
}
