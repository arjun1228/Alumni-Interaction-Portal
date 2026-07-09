import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Sparkles, FileText, Briefcase, Zap, Paperclip } from 'lucide-react';
import { askMentorResume, askMentorInterview, askMentorGap } from '../services/api';

export const AICoach = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm your AI Career Mentor. I can help you review your resume, prepare for interviews, or suggest skills to learn. Try clicking one of the quick actions below or just start chatting!",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const readableExtensions = ['txt', 'md', 'json', 'rtf', 'html', 'js', 'ts', 'css'];

    if (ext && readableExtensions.includes(ext)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        setInput(prev => `${prev}\n\n[Resume Content from ${file.name}]:\n${text}`);
      };
      reader.readAsText(file);
    } else {
      alert(`For PDF or Word documents, please copy and paste the text directly into the chat or upload a plain text (.txt, .md) file.`);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textOverride) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text
      }));

      const lowerText = textToSend.toLowerCase();
      let replyText = '';

      if (lowerText.includes('resume') || lowerText.includes('[resume content')) {
        replyText = await askMentorResume({ message: textToSend, history });
      } else if (lowerText.includes('interview') || lowerText.includes('mock') || lowerText.includes('question')) {
        replyText = await askMentorInterview({ message: textToSend, history });
      } else {
        replyText = await askMentorGap({ message: textToSend, history });
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: replyText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errFriendlyMsg = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: error.message || "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errFriendlyMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action) => {
    let prompt = "";
    switch (action) {
      case 'RESUME':
        prompt = "I want you to critique my resume. What should I paste here for you to analyze?";
        break;
      case 'INTERVIEW':
        prompt = "Can you give me a mock interview question for a Junior Full Stack Developer role?";
        break;
      case 'SKILLS':
        prompt = "What are the top 5 skills trending in Cloud Computing right now?";
        break;
    }
    handleSend(prompt);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-4 flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            AI Career Mentor <Sparkles className="w-4 h-4 text-yellow-300" />
          </h2>
          <p className="text-indigo-100 text-xs">Powered by Llama 3.3 (Groq)</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}
            >
              <div className="flex items-start gap-3">
                {msg.role === 'model' && <Bot className="w-5 h-5 mt-1 text-indigo-600 shrink-0" />}
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</div>
                {msg.role === 'user' && <UserIcon className="w-5 h-5 mt-1 text-indigo-200 shrink-0" />}
              </div>
              <div className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              <span className="text-slate-500 text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area & Quick Actions */}
      <div className="p-4 bg-white border-t border-slate-100">
        {messages.length < 3 && (
           <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => handleQuickAction('RESUME')} className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors whitespace-nowrap">
                 <FileText className="w-3 h-3 text-indigo-500" /> Review My Resume
              </button>
              <button onClick={() => handleQuickAction('INTERVIEW')} className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors whitespace-nowrap">
                 <Briefcase className="w-3 h-3 text-emerald-500" /> Mock Interview
              </button>
              <button onClick={() => handleQuickAction('SKILLS')} className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors whitespace-nowrap">
                 <Zap className="w-3 h-3 text-amber-500" /> Trending Skills
              </button>
           </div>
        )}

        <div className="flex gap-2 relative items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md,.json,.rtf,.html,.js,.ts,.css"
            className="hidden"
          />
          <button
            type="button"
            onClick={handleAttachmentClick}
            className="text-slate-500 hover:text-indigo-600 p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
            title="Attach Resume Text File"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about resume tips, interview prep, or career paths..."
            className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl p-3 transition-colors shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center mt-2">
            <span className="text-[10px] text-slate-400">AI can make mistakes. Consider checking important info.</span>
        </div>
      </div>
    </div>
  );
};
