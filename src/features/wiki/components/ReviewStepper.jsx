/** 단계의 위치로 상태를 정한다. 현재 단계, 이미 지난 단계(done), 앞으로 올 단계(upcoming)로 나눈다. */
const getStepState = (index, currentIndex) => {
  if (index === currentIndex) return 'current'

  return index < currentIndex ? 'done' : 'upcoming'
}

/**
 * 검수 진행 흐름을 세로 단계 목록으로 보여준다. 현재 단계에는 진한 점과 `현재` 칩이 붙는다.
 * Figma에는 현재 단계와 앞으로 올 단계만 있어서, 이미 지난 단계는 현재 단계와 같은 채운 점으로 그린다.
 *
 * @param {object} props 컴포넌트 props
 * @param {Array<{ id: string, title: string, description: string }>} props.steps 단계 목록
 * @param {string} props.currentStepId 현재 단계의 식별자
 */
export const ReviewStepper = ({ steps, currentStepId }) => {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStepId),
  )

  return (
    <ol aria-label="검수 진행 단계" className="flex flex-col">
      {steps.map((step, index) => {
        const state = getStepState(index, currentIndex)
        const isFilled = state !== 'upcoming'

        return (
          <li
            aria-current={state === 'current' ? 'step' : undefined}
            className="flex min-h-19 gap-3"
            key={step.id}
          >
            <div className="flex w-7 shrink-0 flex-col items-center self-stretch">
              <span
                aria-hidden="true"
                className={`flex size-7 shrink-0 items-center justify-center rounded-full ${isFilled ? 'bg-teal-strong' : 'bg-control-neutral'}`}
              >
                <span
                  className={`size-2 rounded-full ${isFilled ? 'bg-white' : 'bg-text-secondary'}`}
                />
              </span>
              <span aria-hidden="true" className="min-h-10 w-px flex-1 bg-border" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.75 pt-0.5">
              <div className="flex items-center gap-2">
                <p
                  className={`text-body font-medium ${state === 'current' ? 'text-teal-strong' : 'text-text-primary'}`}
                >
                  {step.title}
                </p>
                {state === 'current' && (
                  <span className="flex h-7.5 items-center rounded-full bg-teal-strong px-2.75 text-caption text-white">
                    현재
                  </span>
                )}
              </div>
              <p className="text-caption text-text-secondary">{step.description}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
