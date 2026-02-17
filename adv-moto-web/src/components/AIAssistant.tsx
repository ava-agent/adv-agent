/**
 * AI Route Assistant Component
 *
 * Floating AI chat panel that helps users find routes via natural language.
 * Uses streaming responses from the Supabase Edge Function + Claude claude-haiku-4-5.
 */

import { useState, useRef, useCallback } from 'react'
import { DataService } from '../services/dataService'
import type { Route } from '../types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface AIAssistantProps {
  onRouteSelect?: (route: Route) => void
  routes?: Route[]
}

const QUICK_PROMPTS = [
  '适合新手的入门路线',
  '有涉水路段的挑战线',
  '草原风景好的路线',
  '海拔最高的越野线',
]

export function AIAssistant({ onRouteSelect, routes }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: '你好！我是ADV路线助手 🏍️\n\n告诉我你想要什么样的路线，我来为你推荐！\n\n比如：「我想找一条适合周末骑行的轻度越野路线」'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recommendedIds, setRecommendedIds] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || isLoading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: query }
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', isStreaming: true }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setIsLoading(true)

    try {
      let streamedText = ''

      const result = await DataService.getAIRecommendations(
        query,
        (chunk) => {
          streamedText += chunk
          setMessages(prev => prev.map(m =>
            m.id === assistantMsg.id
              ? { ...m, content: streamedText, isStreaming: true }
              : m
          ))
        }
      )

      // Update with final content (non-streaming fallback or extracted IDs)
      const finalContent = streamedText || result.message
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id
          ? { ...m, content: finalContent, isStreaming: false }
          : m
      ))
      setRecommendedIds(result.routeIds)
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id
          ? { ...m, content: '抱歉，推荐服务暂时不可用，请稍后再试。', isStreaming: false }
          : m
      ))
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt)
  }

  const recommendedRoutes = (routes || []).filter(r => recommendedIds.includes(r._id))

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff6b35, #f4a261)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(255,107,53,0.4)',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          zIndex: 1000,
          transition: 'transform 0.2s',
        }}
        title="AI路线助手"
        aria-label="打开AI路线助手"
      >
        🤖
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '16px',
            width: 'min(360px, calc(100vw - 32px))',
            height: 'min(520px, calc(100vh - 120px))',
            background: '#1a1a1d',
            border: '1px solid rgba(255,107,53,0.3)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(90deg, rgba(255,107,53,0.15), rgba(244,162,97,0.1))',
            borderBottom: '1px solid rgba(255,107,53,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
              <div>
                <div style={{ color: '#ff6b35', fontWeight: 600, fontSize: '14px' }}>AI路线助手</div>
                <div style={{ color: '#666', fontSize: '11px' }}>由 Claude claude-haiku-4-5 驱动</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '18px', padding: '4px' }}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 12px',
                  borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #ff6b35, #f4a261)'
                    : '#2a2a2e',
                  color: msg.role === 'user' ? '#fff' : '#e0e0e0',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {msg.content || (msg.isStreaming ? (
                    <span style={{ opacity: 0.6 }}>思考中...</span>
                  ) : '')}
                  {msg.isStreaming && msg.content && (
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '14px',
                      background: '#ff6b35',
                      marginLeft: '2px',
                      animation: 'blink 0.8s infinite'
                    }} />
                  )}
                </div>
              </div>
            ))}

            {/* Recommended route cards */}
            {!isLoading && recommendedRoutes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>推荐路线：</div>
                {recommendedRoutes.map(route => (
                  <button
                    key={route._id}
                    onClick={() => onRouteSelect?.(route)}
                    style={{
                      background: 'rgba(255,107,53,0.1)',
                      border: '1px solid rgba(255,107,53,0.3)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#e0e0e0',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff6b35' }}>{route.title}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                      {route.distanceKm}km · 难度{route.difficultyLevel} · {route.terrainTags.join(' ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            flexShrink: 0
          }}>
            {QUICK_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isLoading}
                style={{
                  flexShrink: 0,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,107,53,0.3)',
                  background: 'rgba(255,107,53,0.08)',
                  color: '#ff6b35',
                  fontSize: '11px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} style={{
            padding: '10px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: '8px',
            flexShrink: 0
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="描述你想要的路线..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#2a2a2e',
                color: '#e0e0e0',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: input.trim() && !isLoading
                  ? 'linear-gradient(135deg, #ff6b35, #f4a261)'
                  : '#333',
                color: input.trim() && !isLoading ? '#fff' : '#666',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? '...' : '发送'}
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </>
  )
}
