import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Search } from './Search'
import { SearchTypeSelect } from './SearchTypeSelect'

const personSearchOptions = [
  { value: 'person', label: '인물명', placeholder: '인물명을 입력하세요.' },
  { value: 'affiliation', label: '소속', placeholder: '소속을 입력하세요.' },
]

/** 실제 렌더링 결과로 부모가 전달한 검색 설정과 접근성 속성을 확인한다. */
const renderSearch = (props = {}) =>
  renderToStaticMarkup(<Search value="" onChange={() => {}} {...props} />)

describe('Search', () => {
  it('도서 이외의 검색 항목과 접근 가능한 이름을 부모 설정대로 표시한다', () => {
    const html = renderSearch({
      options: personSearchOptions,
      searchType: 'affiliation',
      searchLabel: '인물 검색',
      'aria-label': '인물 검색어',
    })

    expect(html).toContain('aria-label="인물 검색"')
    expect(html).toContain('aria-label="인물 검색어"')
    expect(html).toContain('placeholder="소속을 입력하세요."')
    expect(html).toContain('name="searchType" value="affiliation"')
    expect(html).not.toContain('도서 검색')
  })

  it.each([undefined, 'unknown'])('선택 기준이 %s이면 첫 항목을 사용한다', (searchType) => {
    const html = renderSearch({ options: personSearchOptions, searchType })

    expect(html).toContain('name="searchType" value="person"')
    expect(html).toContain('placeholder="인물명을 입력하세요."')
  })

  it.each([undefined, []])('검색 항목이 없으면 일반 검색창을 표시한다 (%j)', (options) => {
    const html = renderSearch({ options })

    expect(html).toContain('role="search"')
    expect(html).toContain('aria-label="검색어"')
    expect(html).toContain('placeholder="검색어를 입력하세요."')
    expect(html).not.toContain('role="combobox"')
    expect(html).not.toContain('name="searchType"')
  })

  it('임의의 검색 기준에도 항목별 숫자 키보드 설정을 적용한다', () => {
    const html = renderSearch({
      options: [{ value: 'identifier', label: '식별번호', inputMode: 'numeric' }],
    })

    expect(html).toMatch(/inputmode="numeric"/i)
  })

  it('직접 전달한 안내 문구와 입력 방식을 항목 설정보다 우선한다', () => {
    const html = renderSearch({
      options: [
        {
          value: 'identifier',
          label: '식별번호',
          placeholder: '항목별 안내',
          inputMode: 'numeric',
        },
      ],
      placeholder: '직접 지정한 안내',
      inputMode: 'text',
    })

    expect(html).toContain('placeholder="직접 지정한 안내"')
    expect(html).toMatch(/inputmode="text"/i)
    expect(html).not.toMatch(/inputmode="numeric"/i)
  })

  it('검색 기준의 이름만으로 숫자 키보드를 강제하지 않는다', () => {
    const html = renderSearch({ options: [{ value: 'isbn', label: 'ISBN' }] })

    expect(html).not.toMatch(/inputmode="numeric"/i)
  })
})

describe('SearchTypeSelect', () => {
  it('빈 목록을 직접 전달해도 오류 없이 비활성 선택 버튼을 표시한다', () => {
    const html = renderToStaticMarkup(<SearchTypeSelect options={[]} />)

    expect(html).toMatch(/<button\b[^>]*\bdisabled=""/)
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('검색 기준')
  })
})
