import { Button } from '@/components/common-ui'

/**
 * 변경한 단체를 검수에 제출하는 하단 영역이다.
 * 제출 함수가 연결되지 않았거나 제출 중이면 제출 버튼을 비활성으로 두어 중복 제출을 막는다.
 * `저장 안 함`은 바꾼 내용을 버리고 나가며, `임시 저장 후 돌아가기`는 저장한 뒤 나간다(인물 화면과 같은 방식).
 * 임시 저장에 실패하면 안내를 보여주고 화면에 머물러, 같은 버튼으로 다시 시도할 수 있다.
 * 화면에 떠 있지 않고 내용 아래에 이어지므로 카드를 가리지 않으며, 내용이 짧으면 화면 아래에 붙는다.
 *
 * @param {object} props 컴포넌트 props
 * @param {boolean} [props.isSubmitting=false] 제출 요청 중인지 여부
 * @param {string} [props.errorMessage] 제출 실패 안내 문구
 * @param {string} [props.saveDraftError] 임시 저장 실패 안내 문구
 * @param {() => void} [props.onSubmit] `검수 제출`을 눌렀을 때 실행. 없으면 비활성
 * @param {() => void} [props.onDiscard] `저장 안 함`을 눌렀을 때 실행(바꾼 내용 버리고 나가기)
 * @param {() => void} [props.onSaveDraft] `임시 저장 후 돌아가기`를 눌렀을 때 실행. 없으면 비활성
 */
export const GroupSubmitBar = ({
  isSubmitting = false,
  errorMessage,
  saveDraftError,
  onSubmit,
  onDiscard,
  onSaveDraft,
}) => (
  <div className="flex flex-col gap-1.5 bg-surface px-5 pt-2.5 pb-3.5">
    {(errorMessage || saveDraftError) && (
      <p className="text-center text-caption text-red-error" role="alert">
        {errorMessage || saveDraftError}
      </p>
    )}
    <Button
      className="disabled:cursor-not-allowed disabled:opacity-50"
      disabled={!onSubmit || isSubmitting}
      height="46px"
      onClick={onSubmit}
      text={isSubmitting ? '제출 중...' : '검수 제출'}
    />
    <div className="flex items-center justify-center gap-2 text-caption text-text-secondary">
      <button
        className="-my-3.5 min-h-11 px-1 disabled:opacity-50"
        disabled={isSubmitting}
        onClick={onDiscard}
        type="button"
      >
        저장 안함
      </button>
      <span aria-hidden="true">|</span>
      <button
        className="-my-3.5 min-h-11 px-1 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!onSaveDraft || isSubmitting}
        onClick={onSaveDraft}
        type="button"
      >
        임시 저장
      </button>
    </div>
  </div>
)
