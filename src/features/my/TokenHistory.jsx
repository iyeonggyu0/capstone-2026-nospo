import { faCircle, faCirclePlus, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from '@/components/common-ui'
import { maskEmail } from './maskEmail'

/** AI 토큰 가용 잔액과 거래 이력을 표시한다. */
export const TokenHistory = ({ profile, balance, member, credits, list, items, preview }) => (
  <div className="flex flex-col gap-4">
    <section className="flex items-center gap-3" aria-label="프로필">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-subtle text-teal-strong">
        {profile?.profileImageUrl ? (
          <img src={profile.profileImageUrl} alt="" className="size-full object-cover" />
        ) : (
          <FontAwesomeIcon icon={faUser} />
        )}
      </div>
      <div className="min-w-0">
        {!preview && member.isPending ? (
          <p className="text-body text-text-secondary">회원 정보를 불러오고 있어요.</p>
        ) : !preview && member.isError ? (
          <button
            type="button"
            className="text-body text-teal-strong"
            onClick={() => member.refetch()}
          >
            회원 정보 다시 불러오기
          </button>
        ) : (
          <>
            <p className="truncate text-title font-bold">{profile?.nickname}</p>
            <p className="truncate text-caption text-text-secondary">{maskEmail(profile?.email)}</p>
          </>
        )}
      </div>
    </section>
    <section
      className="flex flex-col gap-2 rounded-xl bg-teal-subtle p-4"
      aria-label="사용 가능한 토큰"
    >
      <p className="flex items-center gap-2 text-body font-medium text-blue-action">
        <FontAwesomeIcon icon={faCircle} />
        사용 가능한 토큰
      </p>
      {!preview && credits.isPending ? (
        <p role="status" className="text-body">
          불러오는 중
        </p>
      ) : !preview && credits.isError ? (
        <button
          type="button"
          className="self-start text-body text-teal-strong"
          onClick={() => credits.refetch()}
        >
          잔액 다시 불러오기
        </button>
      ) : (
        <p className="text-display font-bold">{balance?.available?.toLocaleString('ko-KR')}개</p>
      )}
      <p className="text-caption text-text-secondary">
        AI 기능을 실행할 때 필요한 수량을 먼저 알려드려요.
      </p>
    </section>
    <section aria-labelledby="token-history-title">
      <div className="flex items-center justify-between">
        <h3 id="token-history-title" className="text-body font-medium">
          토큰 내역
        </h3>
        <span className="text-label-sm text-teal-strong">전체</span>
      </div>
      {!preview && list.isPending && (
        <p className="mt-4 text-body text-text-secondary" role="status">
          내역을 불러오고 있어요.
        </p>
      )}
      {!preview && list.isError && !list.data && (
        <p className="mt-4 text-body text-text-secondary" role="alert">
          내역을 불러오지 못했어요.{' '}
          <button type="button" className="text-teal-strong" onClick={() => list.refetch()}>
            다시 시도
          </button>
        </p>
      )}
      {(preview || list.data) && !items.length && (
        <p className="mt-4 text-body text-text-secondary">아직 토큰 내역이 없어요.</p>
      )}
      <ul className="mt-2">
        {items.map((item) => (
          <li key={item.transactionId} className="flex gap-3 py-2">
            <div className="flex w-5 shrink-0 justify-center pt-1 text-amber-foreground">
              <FontAwesomeIcon
                icon={item.amount > 0 ? faCirclePlus : faCircle}
                className={item.amount > 0 ? 'text-teal-strong' : 'text-caption'}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body font-medium">
                {item.reason ||
                  ({
                    USE: 'AI 토큰 사용',
                    GRANT: '토큰 지급',
                    RECOVERY: '토큰 회수',
                    REFUND: '토큰 복구',
                  }[item.type] ??
                    '토큰 내역')}
              </p>
              <p className="mt-1 text-caption text-text-secondary">
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
                  : '날짜 정보 없음'}
              </p>
            </div>
            <span
              className={`shrink-0 text-body font-medium ${item.amount > 0 ? 'text-teal-strong' : 'text-amber-foreground'}`}
            >
              {item.amount > 0 ? '+' : ''}
              {item.amount}
            </span>
          </li>
        ))}
      </ul>
      {!preview && list.hasNextPage && (
        <Button
          text={
            list.isFetchingNextPage
              ? '불러오는 중'
              : list.isFetchNextPageError
                ? '다시 불러오기'
                : '더 보기'
          }
          color="neutral"
          height="38px"
          disabled={list.isFetchingNextPage}
          onClick={() => list.fetchNextPage()}
        />
      )}
    </section>
  </div>
)
