/** 브라우저의 입력 유효성 검사 결과를 화면에 표시할 메시지로 변환한다. */
export const validateFields = (form, messages) =>
  Object.fromEntries(
    Object.entries(messages).flatMap(([name, message]) => {
      const input = form.elements.namedItem(name)
      return input && !input.validity.valid ? [[name, message]] : []
    }),
  )
