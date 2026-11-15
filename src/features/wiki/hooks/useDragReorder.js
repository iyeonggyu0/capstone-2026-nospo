import { useEffect, useRef, useState } from 'react'

/** 끌어서 놓을 자리를 위쪽에 표시하는 선(항목 위쪽 안쪽 그림자)이다. */
const DROP_BEFORE_CLASS = 'shadow-[inset_0_2px_0_0] shadow-teal-strong'

/** 목록 맨 끝에 놓을 자리를 아래쪽에 표시하는 선이다. */
const DROP_AFTER_CLASS = 'shadow-[inset_0_-2px_0_0] shadow-teal-strong'

/**
 * 하나 이상의 목록 안에서 항목을 끌어 순서를 바꾸거나 다른 목록으로 옮기는 hook이다.
 * 마우스와 터치는 포인터 이벤트로, 키보드는 손잡이에서 위·아래 방향키로 옮긴다.
 * 실제 데이터 변경은 하지 않고, 옮기기를 마치면 `onMove`로 새 위치만 알려준다.
 *
 * @param {object} options 옵션
 * @param {Record<string, string[]>} options.lists 목록 키별 항목 식별자 배열. 키 순서가 목록의 위아래 순서다.
 * @param {(id: string, toListKey: string, toIndex: number) => void} options.onMove 옮기기를 마쳤을 때 실행. `toIndex`는 옮기는 항목을 뺀 목록 기준 위치다.
 * @returns {{
 *   getItemProps: (id: string, listKey: string) => { ref: Function, className: string, style?: object },
 *   getListProps: (listKey: string) => { ref: Function, className: string },
 *   getHandleProps: (id: string, listKey: string) => object,
 * }} 항목, 목록, 손잡이에 펼쳐 넣을 props를 만드는 함수들
 */
export const useDragReorder = ({ lists, onMove }) => {
  // DOM 요소를 기억하는 Map은 그리는 중에 값이 바뀌어도 화면에 영향이 없으므로, 한 번만 만들어 둔다.
  const [itemElements] = useState(() => new Map())
  const [listElements] = useState(() => new Map())
  const [handleElements] = useState(() => new Map())
  const dragRef = useRef(null)
  const pendingFocusId = useRef(null)
  const [drag, setDrag] = useState(null)

  // 방향키로 옮긴 뒤 목록이 다시 그려져도 같은 손잡이에 포커스가 남도록 되돌린다.
  useEffect(() => {
    if (pendingFocusId.current == null) return
    handleElements.get(pendingFocusId.current)?.focus()
    pendingFocusId.current = null
  })

  /** 키별 DOM 요소를 기억해 두는 ref 함수를 만든다. */
  const createRef = (store, key) => (element) => {
    if (element) store.set(key, element)
    else store.delete(key)
  }

  /** 포인터의 세로 위치에서, 끌던 항목이 들어갈 목록과 위치를 계산한다. */
  const findTarget = (clientY, dragId) => {
    let nearestKey = null
    let nearestDistance = Infinity

    Object.keys(lists).forEach((key) => {
      const element = listElements.get(key)
      if (!element) return

      const rect = element.getBoundingClientRect()
      const distance = Math.max(rect.top - clientY, clientY - rect.bottom, 0)
      if (distance < nearestDistance) {
        nearestKey = key
        nearestDistance = distance
      }
    })
    if (nearestKey == null) return null

    const index = lists[nearestKey]
      .filter((id) => id !== dragId)
      .filter((id) => {
        const element = itemElements.get(id)
        if (!element) return false

        const rect = element.getBoundingClientRect()
        return clientY > rect.top + rect.height / 2
      }).length

    return { listKey: nearestKey, index }
  }

  /** 손잡이를 누르면 끌기를 시작한다. 마우스는 왼쪽 버튼만 받는다. */
  const handlePointerDown = (event, id, listKey) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    event.currentTarget.setPointerCapture?.(event.pointerId)
    const next = {
      id,
      listKey,
      startY: event.clientY,
      offsetY: 0,
      target: { listKey, index: lists[listKey].indexOf(id) },
    }
    dragRef.current = next
    setDrag(next)
  }

  /** 끄는 동안 항목이 포인터를 따라가게 하고 들어갈 자리를 갱신한다. */
  const handlePointerMove = (event) => {
    const current = dragRef.current
    if (!current) return

    const next = {
      ...current,
      offsetY: event.clientY - current.startY,
      target: findTarget(event.clientY, current.id) ?? current.target,
    }
    dragRef.current = next
    setDrag(next)
  }

  /** 끌기를 마친다. `commit`이면 바뀐 위치를 알리고, 아니면(취소) 그대로 둔다. */
  const finishDrag = (commit) => {
    const current = dragRef.current
    dragRef.current = null
    setDrag(null)
    if (!commit || !current) return

    const { listKey, index } = current.target
    const originalIndex = lists[current.listKey].indexOf(current.id)
    if (listKey !== current.listKey || index !== originalIndex) {
      onMove(current.id, listKey, index)
    }
  }

  /** 손잡이에서 위·아래 방향키로 한 칸씩 옮긴다. 목록의 끝에서는 이웃 목록으로 넘어간다. */
  const handleKeyDown = (event, id, listKey) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return

    event.preventDefault()
    const keys = Object.keys(lists)
    const ids = lists[listKey]
    const index = ids.indexOf(id)
    const keyIndex = keys.indexOf(listKey)
    pendingFocusId.current = id

    if (event.key === 'ArrowUp') {
      if (index > 0) onMove(id, listKey, index - 1)
      else if (keyIndex > 0) onMove(id, keys[keyIndex - 1], lists[keys[keyIndex - 1]].length)
      else pendingFocusId.current = null
      return
    }

    if (index < ids.length - 1) onMove(id, listKey, index + 1)
    else if (keyIndex < keys.length - 1) onMove(id, keys[keyIndex + 1], 0)
    else pendingFocusId.current = null
  }

  /** 항목(`li`)에 펼쳐 넣을 props다. 끄는 항목은 포인터를 따라 움직이고, 놓을 자리에는 선이 보인다. */
  const getItemProps = (id, listKey) => {
    const props = { ref: createRef(itemElements, id), className: '' }
    if (!drag) return props

    if (drag.id === id) {
      return {
        ...props,
        className: 'relative z-10 bg-surface shadow-lg',
        style: { transform: `translateY(${drag.offsetY}px)` },
      }
    }

    if (drag.target.listKey !== listKey) return props

    const ids = lists[listKey].filter((candidate) => candidate !== drag.id)
    const position = ids.indexOf(id)
    if (position === drag.target.index) return { ...props, className: DROP_BEFORE_CLASS }
    if (position === ids.length - 1 && drag.target.index === ids.length) {
      return { ...props, className: DROP_AFTER_CLASS }
    }

    return props
  }

  /** 목록(`ul`)에 펼쳐 넣을 props다. 비어 있는 목록으로 옮기는 중이면 영역을 강조한다. */
  const getListProps = (listKey) => {
    const isEmptyTarget =
      drag?.target.listKey === listKey && lists[listKey].every((id) => id === drag.id)

    return {
      ref: createRef(listElements, listKey),
      className: isEmptyTarget ? 'min-h-12 rounded bg-teal-strong/10' : 'min-h-12',
    }
  }

  /** 드래그 손잡이 버튼에 펼쳐 넣을 props다. */
  const getHandleProps = (id, listKey) => ({
    ref: createRef(handleElements, id),
    onPointerDown: (event) => handlePointerDown(event, id, listKey),
    onPointerMove: handlePointerMove,
    onPointerUp: () => finishDrag(true),
    onPointerCancel: () => finishDrag(false),
    onKeyDown: (event) => handleKeyDown(event, id, listKey),
  })

  return { getItemProps, getListProps, getHandleProps }
}
