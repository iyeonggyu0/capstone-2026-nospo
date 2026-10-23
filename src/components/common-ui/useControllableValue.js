import { useState } from 'react'

/** 선택형 공통 UI에서 외부 제어값 또는 내부 기본값을 사용한다. */
export const useControllableValue = ({ value, defaultValue, onChange }) => {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const setValue = (nextValue) => {
    if (!isControlled) setInternalValue(nextValue)
    onChange?.(nextValue)
  }

  return [currentValue, setValue]
}
