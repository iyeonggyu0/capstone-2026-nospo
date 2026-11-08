import { apiClient } from '@/lib/api-client'

// 단체 API 계약은 아직 확정되지 않았다. 아래 주소와 요청·응답 모양은 연동 전의 가안이며,
// 백엔드 명세가 정해지면 이 파일만 고친다. 개발 중에는 mock-wiki.js의 모의 응답을 사용한다.
/** 개발 서버에서만 모의 응답을 쓴다. 배포 빌드에서는 항상 false라 모의 코드가 번들에서 빠진다. */
const mockEnabled = import.meta.env.DEV
/** 개발 중에만 모의 응답 모듈을 불러온다. */
const mock = mockEnabled ? import('./mock-wiki') : null

/** 개발 중에는 모의 응답을, 아니면 공통 `apiClient`로 실제 서버를 호출한다. */
const request = async (method, path, data, config = {}) => {
  if (mock) return (await mock).request(method, path, data, config)
  const response = await apiClient.request({ method, url: `/v1${path}`, data, ...config })
  return response.data.data
}

/** 제출할 단체 초안에서 서버가 필요로 하는 이름과 등장 회차만 남긴다. */
const toGroupPayload = ({ name, unlockEpisode }) => ({ name, unlockEpisode })

/** 단체 목록, 상세, 검수 제출 요청 모음이다. 제출한 제안은 관리자 검토 대기(PENDING_REVIEW) 상태가 된다. */
export const groupApi = {
  list: (editionId) => request('get', '/wiki/groups', undefined, { params: { editionId } }),
  detail: (groupId) => request('get', `/wiki/groups/${encodeURIComponent(groupId)}`),
  submitGroups: ({ editionId, groups, removedGroupIds = [] }) =>
    request('post', '/wiki/group-proposals', {
      editionId,
      groups: groups.map(toGroupPayload),
      removedGroupIds,
    }),
  submitGroupDetail: ({ groupId, members, relations, milestones }) =>
    request('post', `/wiki/groups/${encodeURIComponent(groupId)}/edit-proposals`, {
      members,
      relations,
      milestones,
    }),
}

/** 신청한 위키의 검수 진행 상황 요청이다. */
export const reviewApi = {
  progress: (reviewId) => request('get', `/wiki/reviews/${encodeURIComponent(reviewId)}`),
}

/** 지금 모의 응답을 쓰는 중인지 화면에서 알아볼 수 있게 내보낸다. */
export const isGroupApiMock = mockEnabled

/** 요청 실패를 사용자가 읽을 수 있는 안내 문구로 바꾼다. */
export const groupError = (error) =>
  error?.response
    ? '요청을 처리하지 못했습니다. 입력 내용을 확인해 주세요.'
    : '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'
