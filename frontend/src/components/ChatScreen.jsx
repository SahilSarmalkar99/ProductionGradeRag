import {
  Bot,
  User,
  Sparkles,
  Loader2,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatScreen({
  messages = [],
  question,
  onQuestionChange,
  onSubmit,
  loading = false,
  status,
}) {
  const [openProcess, setOpenProcess] = useState(null);

  const messagesEndRef = useRef(null);

  /*
   * Auto scroll to latest message
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!question?.trim() || loading) return;

    onSubmit?.(question.trim());
  };

  return (
    <section className="flex h-full min-h-[600px] flex-col overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="relative flex shrink-0 items-center justify-between overflow-hidden border-b border-black/[0.06] bg-white/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5">
        {/* Subtle premium glow */}
        <div className="pointer-events-none absolute -left-10 -top-12 h-28 w-28 rounded-full bg-[#8b72c7]/10 blur-3xl" />

        <div className="relative flex min-w-0 items-center gap-3.5 sm:gap-4">
          {/* AI ICON */}
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[#dcd3ef] bg-gradient-to-br from-[#f1edfa] to-[#e7e0f5] text-[#7058b0] shadow-[0_5px_18px_rgba(112,88,176,0.12)] sm:h-12 sm:w-12">
            {/* Glow */}
            <div className="absolute inset-0 rounded-[14px] bg-[#8b72c7]/10 blur-md" />

            <Sparkles size={20} strokeWidth={1.8} className="relative" />
          </div>

          {/* TITLE */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#292633] sm:text-base">
                RAG Assistant
              </h2>

              {/* AI badge */}
              <span className="hidden rounded-full border border-[#ddd5ed] bg-[#f6f3fa] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8068b0] xs:inline-flex sm:inline-flex">
                AI
              </span>
            </div>

            <p className="mt-0.5 truncate text-[11px] leading-5 text-[#8f8b98] sm:text-xs">
              Ask questions about your knowledge base
            </p>
          </div>
        </div>

        {/* STATUS */}
        <div className="relative ml-3 shrink-0">
          {loading ? (
            <div className="flex items-center gap-2 rounded-full border border-[#ded6ed] bg-[#f7f4fb] px-3 py-2 text-[11px] font-medium text-[#7058b0] shadow-[0_4px_14px_rgba(112,88,176,0.08)] sm:px-3.5">
              {/* Loading animation */}
              <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                <span className="absolute h-full w-full animate-ping rounded-full bg-[#9b84c9]/50" />
                <span className="relative h-2 w-2 rounded-full bg-[#8066b3]" />
              </span>

              <span className="hidden sm:inline">Thinking...</span>

              <span className="sm:hidden">AI</span>
            </div>
          ) : status ? (
            <div className="flex max-w-[180px] items-center gap-2 rounded-full border border-[#dbe8c9] bg-[#f4f8ee] px-3 py-2 text-[11px] font-medium text-[#718d4b] shadow-[0_4px_14px_rgba(113,141,75,0.07)] sm:max-w-[220px] sm:px-3.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e4efd6]">
                <CheckCircle2 size={13} strokeWidth={2} />
              </span>

              <span className="truncate">{status}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-[#fafafa] px-3 py-2 text-[11px] font-medium text-[#8d8995]">
              <span className="h-2 w-2 rounded-full bg-[#bcb8c2]" />
              Ready
            </div>
          )}
        </div>
      </header>

      {/* =====================================================
          CHAT AREA
      ====================================================== */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6">
        {/* EMPTY STATE */}
        {messages.length === 0 && !loading && (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1eef8] text-[#765db5]">
              <Bot size={28} />
            </div>

            <h3 className="text-lg font-semibold text-[#302d3b]">
              Ask your knowledge base
            </h3>

            <p className="mt-2 max-w-sm text-xs leading-5 text-[#9995a3]">
              Ask a question and the RAG agent will retrieve relevant documents
              and generate an answer.
            </p>
          </div>
        )}

        {/* =================================================
            MESSAGES
        ================================================== */}
        <div className="space-y-8">
          {messages.map((message) => {
            /*
             * =================================================
             * USER MESSAGE
             * =================================================
             */
            if (message.role === "user") {
              return (
                <div key={message.id} className="flex justify-end">
                  <div className="flex max-w-[92%] items-start gap-2 sm:max-w-[78%]">
                    <div className="rounded-2xl rounded-tr-md bg-[#302b3c] px-4 py-3 text-sm leading-6 text-white shadow-sm">
                      {message.content}
                    </div>

                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eeeaff] text-[#735db0]">
                      <User size={14} />
                    </div>
                  </div>
                </div>
              );
            }

            /*
             * =================================================
             * ASSISTANT MESSAGE
             * =================================================
             */
            return (
              <div key={message.id} className="flex items-start gap-3">
                {/* BOT ICON */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eeeaff] text-[#7058b0]">
                  <Bot size={17} />
                </div>

                {/* RESPONSE */}
                <div className="min-w-0 max-w-[96%] flex-1">
                  <div className="overflow-hidden rounded-2xl rounded-tl-md border border-black/[0.06] bg-[#fafafd] shadow-sm">
                    <div className="px-4 py-5 sm:px-6">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          /*
                           * =================================================
                           * HEADINGS
                           * =================================================
                           */

                          h1: ({ children }) => (
                            <h1 className="mb-4 mt-1 text-xl font-bold tracking-tight text-[#292633]">
                              {children}
                            </h1>
                          ),

                          h2: ({ children }) => (
                            <h2 className="mb-3 mt-6 text-lg font-bold tracking-tight text-[#302c3a] first:mt-0">
                              {children}
                            </h2>
                          ),

                          h3: ({ children }) => (
                            <h3 className="mb-2 mt-5 text-base font-semibold text-[#373341]">
                              {children}
                            </h3>
                          ),

                          h4: ({ children }) => (
                            <h4 className="mb-2 mt-4 text-sm font-semibold text-[#413c4b]">
                              {children}
                            </h4>
                          ),

                          /*
                           * =================================================
                           * PARAGRAPH
                           * =================================================
                           */

                          p: ({ children }) => (
                            <p className="mb-4 text-[13px] leading-6 text-[#575260] last:mb-0">
                              {children}
                            </p>
                          ),

                          /*
                           * =================================================
                           * BOLD
                           * =================================================
                           */

                          strong: ({ children }) => (
                            <strong className="font-semibold text-[#302b39]">
                              {children}
                            </strong>
                          ),

                          /*
                           * =================================================
                           * ITALIC
                           * =================================================
                           */

                          em: ({ children }) => (
                            <em className="text-[#625c6a]">{children}</em>
                          ),

                          /*
                           * =================================================
                           * UNORDERED LIST
                           * =================================================
                           */

                          ul: ({ children }) => (
                            <ul className="mb-4 ml-5 list-disc space-y-1.5 text-[13px] leading-6 text-[#575260]">
                              {children}
                            </ul>
                          ),

                          /*
                           * =================================================
                           * ORDERED LIST
                           * =================================================
                           */

                          ol: ({ children }) => (
                            <ol className="mb-4 ml-5 list-decimal space-y-1.5 text-[13px] leading-6 text-[#575260]">
                              {children}
                            </ol>
                          ),

                          /*
                           * =================================================
                           * LIST ITEM
                           * =================================================
                           */

                          li: ({ children }) => (
                            <li className="pl-1">{children}</li>
                          ),

                          /*
                           * =================================================
                           * LINKS
                           * =================================================
                           */

                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-[#7258b2] underline decoration-[#c9bde7] underline-offset-2 transition-colors hover:text-[#50378c]"
                            >
                              {children}
                              <ExternalLink size={11} />
                            </a>
                          ),

                          /*
                           * =================================================
                           * BLOCKQUOTE
                           * =================================================
                           */

                          blockquote: ({ children }) => (
                            <blockquote className="my-4 border-l-4 border-[#cfc5e8] bg-[#f5f2fa] px-4 py-3 text-[13px] italic leading-6 text-[#6d6678]">
                              {children}
                            </blockquote>
                          ),

                          /*
                           * =================================================
                           * HORIZONTAL RULE
                           * =================================================
                           */

                          hr: () => (
                            <hr className="my-6 border-0 border-t border-black/[0.07]" />
                          ),

                          /*
                           * =================================================
                           * TABLE
                           * =================================================
                           */

                          table: ({ children }) => (
                            <div className="my-5 w-full overflow-x-auto rounded-xl border border-black/[0.07] bg-white">
                              <table className="w-full min-w-[600px] border-collapse text-left text-[12px]">
                                {children}
                              </table>
                            </div>
                          ),

                          /*
                           * =================================================
                           * TABLE HEAD
                           * =================================================
                           */

                          thead: ({ children }) => (
                            <thead className="bg-[#f4f1f9]">{children}</thead>
                          ),

                          /*
                           * =================================================
                           * TABLE BODY
                           * =================================================
                           */

                          tbody: ({ children }) => (
                            <tbody className="divide-y divide-black/[0.06]">
                              {children}
                            </tbody>
                          ),

                          /*
                           * =================================================
                           * TABLE ROW
                           * =================================================
                           */

                          tr: ({ children }) => (
                            <tr className="transition-colors hover:bg-[#faf9fc]">
                              {children}
                            </tr>
                          ),

                          /*
                           * =================================================
                           * TABLE HEADER
                           * =================================================
                           */

                          th: ({ children }) => (
                            <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#5e566d]">
                              {children}
                            </th>
                          ),

                          /*
                           * =================================================
                           * TABLE CELL
                           * =================================================
                           */

                          td: ({ children }) => (
                            <td className="px-4 py-3 align-top text-[12px] leading-5 text-[#625d69]">
                              {children}
                            </td>
                          ),

                          /*
                           * =================================================
                           * CODE
                           * =================================================
                           */

                          code: ({ children, className }) => {
                            const isBlock = className?.includes("language-");

                            if (isBlock) {
                              return (
                                <code className="block overflow-x-auto rounded-xl bg-[#24212d] p-4 font-mono text-[12px] leading-5 text-[#eeeaf5]">
                                  {children}
                                </code>
                              );
                            }

                            return (
                              <code className="rounded-md bg-[#eeebf4] px-1.5 py-0.5 font-mono text-[11px] text-[#67578a]">
                                {children}
                              </code>
                            );
                          },

                          /*
                           * =================================================
                           * PRE
                           * =================================================
                           */

                          pre: ({ children }) => (
                            <pre className="my-4 overflow-x-auto rounded-xl bg-[#24212d] p-0">
                              {children}
                            </pre>
                          ),
                        }}
                      >
                        {message.content || "No answer was generated."}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* =================================================
                      AGENT PROCESS
                  ================================================== */}

                  {message.process && message.process.length > 0 && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-black/[0.06] bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenProcess(
                            openProcess === message.id ? null : message.id,
                          )
                        }
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <span className="text-xs font-medium text-[#716c7b]">
                          Agent process
                        </span>

                        <ChevronDown
                          size={15}
                          className={`text-[#9d98a6] transition-transform ${
                            openProcess === message.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {openProcess === message.id && (
                        <div className="border-t border-black/[0.05] px-4 py-3">
                          {Array.isArray(message.process) ? (
                            <div className="space-y-2">
                              {message.process.map((step, index) => (
                                <div
                                  key={index}
                                  className="flex gap-3 text-xs leading-5 text-[#85808e]"
                                >
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eeeaff] text-[9px] font-semibold text-[#725bad]">
                                    {index + 1}
                                  </span>

                                  <span className="min-w-0 break-words">
                                    {typeof step === "string"
                                      ? step
                                      : JSON.stringify(step)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words text-xs leading-5 text-[#85808e]">
                              {typeof message.process === "string"
                                ? message.process
                                : JSON.stringify(message.process, null, 2)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* =================================================
              LOADING
          ================================================== */}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eeeaff] text-[#7058b0]">
                <Bot size={17} />
              </div>

              <div className="rounded-2xl rounded-tl-md border border-black/[0.06] bg-[#fafafd] px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-[#8f8a9c]">
                  <Loader2 size={14} className="animate-spin" />

                  <span>Retrieving documents and generating answer...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* =====================================================
          INPUT
      ====================================================== */}

      <div className="shrink-0 border-t border-black/[0.06] bg-white p-3 sm:p-4">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 rounded-2xl border border-black/[0.08] bg-[#fafafd] p-2 transition-all focus-within:border-[#a89ad0] focus-within:ring-4 focus-within:ring-[#eeeaff]"
        >
          <textarea
            value={question}
            onChange={(e) => onQuestionChange?.(e.target.value)}
            placeholder="Ask something about your documents..."
            rows={1}
            disabled={loading}
            className="max-h-32 min-h-[42px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-[#36323f] outline-none placeholder:text-[#aaa6b1] disabled:opacity-60"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();

                if (!loading && question?.trim()) {
                  onSubmit?.(question.trim());
                }
              }
            }}
          />

          <button
            type="submit"
            disabled={loading || !question?.trim()}
            className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#302b3c] px-4 text-xs font-semibold text-white transition-all hover:bg-[#453c55] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Ask"}
          </button>
        </form>

        <p className="mt-2 text-center text-[10px] text-[#aaa6b1]">
          Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </section>
  );
}
