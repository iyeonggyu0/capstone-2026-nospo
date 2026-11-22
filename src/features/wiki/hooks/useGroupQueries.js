import { useMutation, useQuery } from '@tanstack/react-query'
import { groupApi, personApi } from '../api/wiki'

/** 단체 조회 결과를 캐시에 저장할 때 쓰는 키 모음이다. */
export const groupQueryKeys = {
  list: (editionId) => ['wiki', 'groups', editionId ?? null],
  detail: (groupId) => ['wiki', 'group', groupId ?? null],
  persons: (editionId, positionValue) => [
    'wiki',
    'persons',
    editionId ?? null,
    positionValue ?? null,
  ],
}

/**
 * 단체 구성원으로 고를 수 있는 인물 목록을 현재 진도 기준으로 조회하고 캐싱한다.
 * 진도를 알기 전에는 조회하지 않는다. 아직 공개되지 않은 인물이 섞여 들어오는 것을 막기 위해서다.
 */
export const usePersonList = (editionId, positionValue) =>
  useQuery({
    queryKey: groupQueryKeys.persons(editionId, positionValue),
    queryFn: () => personApi.list(editionId, positionValue),
    enabled: positionValue != null,
  })

/** 도서(판본)의 단체 목록과 도서 정보를 조회하고 캐싱한다. `enabled`가 false면 조회하지 않는다. */
export const useGroupList = (editionId, { enabled = true } = {}) =>
  useQuery({
    queryKey: groupQueryKeys.list(editionId),
    queryFn: () => groupApi.list(editionId),
    enabled,
  })

/** 단체 하나의 상세 정보를 조회하고 캐싱한다. 식별자가 없으면 조회하지 않고, 없는 단체(404)는 다시 시도하지 않는다. */
export const useGroupDetail = (groupId) =>
  useQuery({
    queryKey: groupQueryKeys.detail(groupId),
    queryFn: () => groupApi.detail(groupId),
    enabled: Boolean(groupId),
    retry: (failureCount, error) => error?.response?.status !== 404 && failureCount < 1,
  })

/** 새로 추가한 단체들을 검수에 제출한다. 자동으로 다시 시도하지 않는다. */
export const useSubmitGroups = () =>
  useMutation({ mutationFn: groupApi.submitGroups, retry: false })

/** 단체 상세에서 편집한 구성원·관계·행적을 검수에 제출한다. 자동으로 다시 시도하지 않는다. */
export const useSubmitGroupDetail = () =>
  useMutation({ mutationFn: groupApi.submitGroupDetail, retry: false })
