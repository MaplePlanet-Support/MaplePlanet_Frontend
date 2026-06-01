import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  answerContactPost,
  createContactPost,
  downloadContactAttachment,
  downloadPublicContactAttachment,
  getContactPost,
  getPublicContactPost,
  listContactPosts,
  listPublicContactPosts,
  type ContactPostDetail,
  type ContactPostSummary,
} from '@/api/contact'
import { ApiError } from '@/api/client'
import { setPageMeta } from '@/lib/seo'

type Message = { type: 'ok' | 'err' | 'info'; text: string }

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 403) return '관리자 키가 올바르지 않습니다.'
    if (error.status === 413) return '첨부 이미지가 너무 큽니다. 파일당 3MB 이하로 줄여주세요.'
    if (error.message.includes('닉네임') || error.message.includes('비밀번호')) return error.message
    return error.message || fallback
  }
  if (error instanceof TypeError) return '서버에 연결할 수 없습니다.'
  return fallback
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function prettyJson(value?: string) {
  if (!value) return ''
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

export default function Contact() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [nickname, setNickname] = useState('')
  const [presetCode, setPresetCode] = useState('')
  const [secret, setSecret] = useState(true)
  const [images, setImages] = useState<FileList | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [writing, setWriting] = useState(false)

  const [adminKey, setAdminKey] = useState('')
  const [posts, setPosts] = useState<ContactPostSummary[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<ContactPostDetail | null>(null)
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminMessage, setAdminMessage] = useState<Message | null>(null)
  const [answerContent, setAnswerContent] = useState('')
  const [answerSaving, setAnswerSaving] = useState(false)
  const [publicPosts, setPublicPosts] = useState<ContactPostSummary[]>([])
  const [publicDetail, setPublicDetail] = useState<ContactPostDetail | null>(null)
  const [viewNickname, setViewNickname] = useState('')
  const [viewPresetCode, setViewPresetCode] = useState('')
  const [publicLoading, setPublicLoading] = useState(false)
  const [publicMessage, setPublicMessage] = useState<Message | null>(null)

  const selectedPost = useMemo(
    () => posts.find(post => String(post.id) === selectedId),
    [posts, selectedId],
  )

  useEffect(() => {
    setPageMeta({
      title: '문의 게시판 | PlanetCompare',
      description: 'PlanetCompare 문의 게시판입니다. 오류 제보, 기능 제안, 프리셋 세팅 확인 요청, 이미지 첨부와 비밀글 작성을 지원합니다.',
      path: '/contact',
    })
    void loadPublicPosts()
  }, [])

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (secret && !presetCode.trim()) {
      setMessage({ type: 'err', text: '비밀글은 작성자 확인을 위해 저장 코드를 입력해야 합니다.' })
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('content', content)
      formData.append('nickname', nickname)
      formData.append('presetCode', presetCode)
      formData.append('secret', String(secret))
      Array.from(images ?? []).slice(0, 10).forEach(file => formData.append('images', file))

      const res = await createContactPost(formData)
      setMessage({
        type: 'ok',
        text: res.presetAttached
          ? `문의가 접수되었습니다. 글 번호는 ${res.id}번이고, 현재 프리셋 세팅도 함께 저장되었습니다.`
          : `문의가 접수되었습니다. 글 번호는 ${res.id}번입니다.`,
      })
      setTitle('')
      setContent('')
      setPresetCode('')
      setImages(null)
      setWriting(false)
      await loadPublicPosts()
    } catch (error) {
      setMessage({ type: 'err', text: errorMessage(error, '문의 접수에 실패했습니다.') })
    } finally {
      setSubmitting(false)
    }
  }

  async function loadPosts() {
    setAdminLoading(true)
    setAdminMessage(null)
    try {
      const list = await listContactPosts(adminKey)
      setPosts(list)
      setSelectedId(list[0] ? String(list[0].id) : '')
      setDetail(null)
      setAdminMessage({ type: 'ok', text: `${list.length}개의 문의를 불러왔습니다.` })
    } catch (error) {
      setAdminMessage({ type: 'err', text: errorMessage(error, '문의 목록을 불러오지 못했습니다.') })
    } finally {
      setAdminLoading(false)
    }
  }

  async function loadPublicPosts() {
    setPublicLoading(true)
    setPublicMessage(null)
    try {
      setPublicPosts(await listPublicContactPosts())
    } catch (error) {
      setPublicMessage({ type: 'err', text: errorMessage(error, '문의 목록을 불러오지 못했습니다.') })
    } finally {
      setPublicLoading(false)
    }
  }

  async function loadPublicDetail(post: ContactPostSummary) {
    setPublicLoading(true)
    setPublicMessage(null)
    try {
      setPublicDetail(await getPublicContactPost(
        post.id,
        post.secret ? viewNickname : undefined,
        post.secret ? viewPresetCode : undefined,
      ))
    } catch (error) {
      setPublicDetail(null)
      setPublicMessage({ type: 'err', text: errorMessage(error, '문의 글을 열 수 없습니다.') })
    } finally {
      setPublicLoading(false)
    }
  }

  async function loadDetail(id: string) {
    if (!id) return
    setSelectedId(id)
    setAdminLoading(true)
    setAdminMessage(null)
    try {
      const next = await getContactPost(Number(id), adminKey)
      setDetail(next)
      setAnswerContent(next.answerContent ?? '')
    } catch (error) {
      setAdminMessage({ type: 'err', text: errorMessage(error, '문의 상세를 불러오지 못했습니다.') })
    } finally {
      setAdminLoading(false)
    }
  }

  async function saveAnswer() {
    if (!detail) return
    setAnswerSaving(true)
    setAdminMessage(null)
    try {
      const next = await answerContactPost(detail.id, adminKey, answerContent)
      setDetail(next)
      setAnswerContent(next.answerContent ?? '')
      setPosts(posts.map(post => post.id === next.id ? { ...post, answered: true } : post))
      setPublicPosts(publicPosts.map(post => post.id === next.id ? { ...post, answered: true } : post))
      if (publicDetail?.id === next.id) {
        setPublicDetail({ ...publicDetail, answerContent: next.answerContent, answeredAt: next.answeredAt, answered: true })
      }
      setAdminMessage({ type: 'ok', text: '답변을 저장했습니다.' })
    } catch (error) {
      setAdminMessage({ type: 'err', text: errorMessage(error, '답변 저장에 실패했습니다.') })
    } finally {
      setAnswerSaving(false)
    }
  }

  async function openAttachment(id: number) {
    try {
      const blob = await downloadContactAttachment(id, adminKey)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      setAdminMessage({ type: 'err', text: errorMessage(error, '첨부 파일을 열지 못했습니다.') })
    }
  }

  async function openPublicAttachment(id: number) {
    try {
      const blob = await downloadPublicContactAttachment(
        id,
        publicDetail?.secret ? viewNickname : undefined,
        publicDetail?.secret ? viewPresetCode : undefined,
      )
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      setPublicMessage({ type: 'err', text: errorMessage(error, '첨부 파일을 열지 못했습니다.') })
    }
  }

  const messageClass = (msg: Message) =>
    msg.type === 'ok'
      ? 'border-win/20 bg-win-bg text-win'
      : msg.type === 'info'
        ? 'border-maple/20 bg-maple-bg text-maple'
        : 'border-lose/20 bg-red-50 text-lose'

  return (
    <div className="min-h-screen bg-[#F4F6F9] px-4 py-10 text-left text-foreground sm:px-6">
      <main className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-xl border border-black/8 bg-white p-5 shadow-sm lg:col-span-2 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="mb-2 text-2xl font-bold">문의 게시판</h1>
              <p className="text-sm leading-7 text-muted-foreground">
                이전 문의를 먼저 확인하고, 필요한 경우 문의글 작성 버튼으로 새 글을 남겨주세요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWriting(open => !open)}
              className="h-10 rounded-md bg-maple px-4 text-sm font-semibold text-white transition-colors hover:bg-maple/90"
            >
              {writing ? '작성 닫기' : '문의글 작성'}
            </button>
          </div>

          {writing && (
          <form className="mt-5 flex flex-col gap-4 border-t border-border pt-5" onSubmit={submit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">제목</span>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={120}
                required
                className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">내용</span>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={5000}
                required
                rows={8}
                className="resize-y rounded-md border border-border bg-background px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">유저 이름</span>
                <input
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  maxLength={30}
                  required
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">저장 코드</span>
                <input
                  value={presetCode}
                  onChange={e => setPresetCode(e.target.value)}
                  maxLength={30}
                  type="text"
                  autoComplete="off"
                  name="contact-preset-code"
                  spellCheck={false}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">사진 첨부</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={e => setImages(e.target.files)}
                className="text-sm text-muted-foreground file:mr-3 file:h-9 file:rounded-md file:border-0 file:bg-maple file:px-3 file:text-xs file:font-semibold file:text-white"
              />
              <span className="text-xs text-muted-foreground">최대 10개, 파일당 3MB 이하</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={secret} onChange={e => setSecret(e.target.checked)} />
              비밀글로 저장
            </label>

            {message && (
              <div className={`rounded-md border px-3 py-2 text-xs ${messageClass(message)}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-md bg-maple px-4 text-sm font-semibold text-white transition-colors hover:bg-maple/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? '접수 중...' : '문의 접수'}
            </button>
          </form>
          )}
        </section>

        <aside className="order-3 flex flex-col gap-4">
          <section className="rounded-xl border border-black/8 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-lg font-bold">작성 팁</h2>
            <ul className="list-inside list-disc space-y-1 text-sm leading-7 text-muted-foreground">
              <li>계산 오류 제보는 직업, 비교 슬롯, 입력한 버프 조건을 같이 적어주세요.</li>
              <li>저장 코드를 입력하면 운영자가 같은 프리셋 세팅으로 확인할 수 있습니다.</li>
              <li>저장 코드는 검증에만 사용되며 문의 글에는 저장하지 않습니다.</li>
            </ul>
          </section>

          <section className="rounded-xl border border-black/8 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-bold">관리자 조회</h2>
            <div className="flex gap-2">
              <input
                value={adminKey}
                onChange={e => setAdminKey(e.target.value)}
                type="text"
                placeholder="관리자 키"
                autoComplete="off"
                name="contact-admin-key"
                spellCheck={false}
                className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => void loadPosts()}
                disabled={adminLoading}
                className="h-9 rounded-md border border-border bg-background px-3 text-xs font-semibold hover:bg-muted disabled:opacity-60"
              >
                불러오기
              </button>
            </div>

            {posts.length > 0 && (
              <select
                value={selectedId}
                onChange={e => void loadDetail(e.target.value)}
                className="mt-3 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {posts.map(post => (
                  <option key={post.id} value={post.id}>
                    #{post.id} {post.secret ? '[비밀] ' : ''}{post.answered ? '[답변] ' : ''}{post.title} · {post.nickname}
                  </option>
                ))}
              </select>
            )}

            {selectedPost && !detail && (
              <button
                type="button"
                onClick={() => void loadDetail(String(selectedPost.id))}
                disabled={adminLoading}
                className="mt-2 h-9 w-full rounded-md bg-foreground px-3 text-xs font-semibold text-background disabled:opacity-60"
              >
                선택 글 보기
              </button>
            )}

            {adminMessage && (
              <div className={`mt-3 rounded-md border px-3 py-2 text-xs ${messageClass(adminMessage)}`}>
                {adminMessage.text}
              </div>
            )}

            {detail && (
              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                <div>
                  <div className="text-xs text-muted-foreground">#{detail.id} · {formatDate(detail.createdAt)}</div>
                  <h3 className="mt-1 text-base font-bold">{detail.title}</h3>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {detail.nickname} · {detail.secret ? '비밀글' : '공개글'} · {detail.presetAttached ? '프리셋 있음' : '프리셋 없음'}
                  </div>
                </div>
                <p className="whitespace-pre-wrap rounded-md bg-muted/30 p-3 text-sm leading-6">{detail.content}</p>

                <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/10 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-muted-foreground">
                      관리자 답변 {detail.answeredAt && <span className="font-normal">· {formatDate(detail.answeredAt)}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => void saveAnswer()}
                      disabled={answerSaving}
                      className="h-8 rounded-md bg-maple px-3 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {answerSaving ? '저장 중...' : '답변 저장'}
                    </button>
                  </div>
                  <textarea
                    value={answerContent}
                    onChange={e => setAnswerContent(e.target.value)}
                    maxLength={5000}
                    rows={6}
                    placeholder="유저에게 보여줄 답변을 입력하세요."
                    className="resize-y rounded-md border border-border bg-white px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                {detail.attachments.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-semibold text-muted-foreground">첨부</div>
                    {detail.attachments.map(file => (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => void openAttachment(file.id)}
                        className="h-8 rounded-md border border-border px-3 text-left text-xs hover:bg-muted"
                      >
                        {file.filename} · {(file.sizeBytes / 1024).toFixed(1)}KB
                      </button>
                    ))}
                  </div>
                )}

                {detail.presetConfigJson && (
                  <div>
                    <div className="mb-1 text-xs font-semibold text-muted-foreground">프리셋 세팅</div>
                    <pre className="max-h-80 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                      {prettyJson(detail.presetConfigJson)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </section>
        </aside>

        <section className="order-2 rounded-xl border border-black/8 bg-white p-5 shadow-sm lg:col-span-2 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">문의 목록</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                공개글은 누구나 볼 수 있고, 비밀글은 작성자와 관리자만 내용을 볼 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadPublicPosts()}
              disabled={publicLoading}
              className="h-9 rounded-md border border-border bg-background px-3 text-xs font-semibold hover:bg-muted disabled:opacity-60"
            >
              새로고침
            </button>
          </div>

          {publicMessage && (
            <div className={`mb-3 rounded-md border px-3 py-2 text-xs ${messageClass(publicMessage)}`}>
              {publicMessage.text}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="max-h-[520px] overflow-auto rounded-lg border border-border">
              {publicPosts.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  아직 등록된 문의가 없습니다.
                </div>
              ) : (
                publicPosts.map(post => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => void loadPublicDetail(post)}
                    className={`flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-muted/40 ${
                      publicDetail?.id === post.id ? 'bg-maple-bg' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span>#{post.id}</span>
                      {post.secret && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-muted-foreground">비밀</span>}
                      {post.presetAttached && <span className="rounded bg-maple-bg px-1.5 py-0.5 text-[10px] text-maple">프리셋</span>}
                      {post.answered && <span className="rounded bg-win-bg px-1.5 py-0.5 text-[10px] text-win">답변</span>}
                    </span>
                    <span className="line-clamp-1 text-sm text-foreground">{post.title}</span>
                    <span className="text-xs text-muted-foreground">{post.nickname} · {formatDate(post.createdAt)}</span>
                  </button>
                ))
              )}
            </div>

            <div className="min-h-[320px] rounded-lg border border-border bg-muted/10 p-4">
              {!publicDetail ? (
                <div className="flex h-full flex-col justify-center gap-3 text-sm text-muted-foreground">
                  <p>목록에서 글을 선택해 내용을 확인하세요.</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={viewNickname}
                      onChange={e => setViewNickname(e.target.value)}
                      placeholder="비밀글 유저 이름"
                      className="h-9 rounded-md border border-border bg-white px-3 text-sm"
                    />
                    <input
                      value={viewPresetCode}
                      onChange={e => setViewPresetCode(e.target.value)}
                      type="text"
                      placeholder="비밀글 저장 코드"
                      autoComplete="off"
                      name="contact-view-code"
                      spellCheck={false}
                      className="h-9 rounded-md border border-border bg-white px-3 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <article className="flex flex-col gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">#{publicDetail.id} · {formatDate(publicDetail.createdAt)}</div>
                    <h3 className="mt-1 text-lg font-bold">{publicDetail.title}</h3>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {publicDetail.nickname} · {publicDetail.secret ? '비밀글' : '공개글'}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap rounded-md bg-white p-3 text-sm leading-6">{publicDetail.content}</p>
                  {publicDetail.answerContent && (
                    <div className="rounded-md border border-win/20 bg-win-bg/50 p-3">
                      <div className="mb-2 text-xs font-semibold text-win">
                        관리자 답변 {publicDetail.answeredAt && <span className="font-normal text-muted-foreground">· {formatDate(publicDetail.answeredAt)}</span>}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{publicDetail.answerContent}</p>
                    </div>
                  )}
                  {publicDetail.attachments.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="text-xs font-semibold text-muted-foreground">첨부</div>
                      {publicDetail.attachments.map(file => (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => void openPublicAttachment(file.id)}
                          className="h-8 rounded-md border border-border bg-white px-3 text-left text-xs hover:bg-muted"
                        >
                          {file.filename} · {(file.sizeBytes / 1024).toFixed(1)}KB
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
