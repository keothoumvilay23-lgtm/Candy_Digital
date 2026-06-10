'use client';
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, Trash2 } from 'lucide-react';
import api from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  'Điện thoại tầm giá 15 triệu?',
  'Tai nghe chống ồn tốt nhất?',
  'So sánh iPhone vs Samsung',
  'Khuyến mãi hôm nay?',
];

const GREETING_MESSAGE: Message = {
  role: 'assistant',
  content: 'Xin chào! Tôi là Candy AI 🤖 Tôi có thể giúp bạn tư vấn điện thoại, tai nghe và phụ kiện. Bạn cần tư vấn gì?',
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !sessionToken) initSession();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initSession = async () => {
    try {
      const token = localStorage.getItem('chat_session') || '';
      const { data } = await api.get('/chat/session', { headers: token ? { 'x-session-token': token } : {} });
      const st = data.data.session_token;
      localStorage.setItem('chat_session', st);
      setSessionToken(st);
      if (data.data.messages?.length) {
        setMessages(data.data.messages);
      } else {
        setMessages([GREETING_MESSAGE]);
      }
    } catch {
      setMessages([GREETING_MESSAGE]);
    }
  };

  const clearHistory = async () => {
    if (!sessionToken || loading) return;
    if (messages.length <= 1) {
      setMessages([GREETING_MESSAGE]);
      return;
    }

    try {
      await api.delete(`/chat/session/${sessionToken}/messages`);
      setMessages([GREETING_MESSAGE]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Chưa xóa được lịch sử. Vui lòng thử lại.' }]);
    }
  };

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content }]);
    setLoading(true);

    try {
      const { data } = await api.post('/chat/message', { session_token: sessionToken, message: content });
      setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, tôi gặp sự cố. Vui lòng thử lại.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center hover:bg-primary-600 transition-all"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && messages.length === 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Candy AI</p>
              <p className="text-white/70 text-xs">Tư vấn sản phẩm 24/7</p>
            </div>
            <button
              onClick={clearHistory}
              disabled={loading}
              title="Xóa lịch sử chat"
              className="ml-auto text-white/70 hover:text-white disabled:opacity-40"
            >
              <Trash2 size={17} />
            </button>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start gap-2'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot size={13} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] text-sm rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={13} className="text-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="px-3 py-2 flex gap-1.5 flex-wrap border-t border-gray-100 bg-white">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-xs text-primary border border-primary rounded-full px-2.5 py-1 hover:bg-primary-50 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Nhập câu hỏi..."
              className="flex-1 text-sm border border-gray-200 rounded-full px-3 py-2 outline-none focus:border-primary"
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-40">
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
