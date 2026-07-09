import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserRole } from '../types';
import { Search, MessageCircle, Send, ArrowLeft, MoreVertical, UserCircle, X, CheckCheck, Paperclip, ExternalLink, Download, Shield } from 'lucide-react';
import { Profile } from './Profile';
import { fetchAllUsers, fetchMessages, sendMessage } from '../services/api';

// Mock Directory Data (Fallback)
const MOCK_DIRECTORY = [
  {
    id: 'd1',
    name: 'Sarah Jenkins',
    email: 'sarah@example.com',
    role: UserRole.GRADUATE,
    title: 'Product Manager',
    company: 'TechCorp',
    avatar: 'https://picsum.photos/id/64/100/100',
    university: 'State University',
    bio: 'Experienced PM with a background in CS.',
    skills: ['Product Management', 'Agile', 'Roadmapping']
  },
  {
    id: 'd2',
    name: 'David Chen',
    email: 'david@example.com',
    role: UserRole.GRADUATE,
    title: 'Senior Engineer',
    company: 'StartupX',
    avatar: 'https://picsum.photos/id/91/100/100',
    university: 'State University',
    bio: 'Full stack engineer loving React and Node.',
    skills: ['React', 'Node.js', 'AWS']
  },
  {
    id: 's1',
    name: 'Alex Johnson',
    email: 'alex@edu.com',
    role: UserRole.UNDERGRADUATE,
    title: 'Computer Science Student',
    avatar: 'https://picsum.photos/200/200?random=1',
    university: 'State University',
    yearOfStudy: 3,
    interests: ['AI', 'Web Dev']
  }
];

export const Messaging = ({ currentUser, initialSelectedUser }) => {
  const [selectedUser, setSelectedUser] = useState(initialSelectedUser || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. MESSAGES STATE (Backend)
  const [messages, setMessages] = useState([]);
  const [directory, setDirectory] = useState([]);

  // Feature States
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch Directory on Mount
  useEffect(() => {
    const loadDirectory = async () => {
      try {
        const users = await fetchAllUsers();
        // Filter out current user from directory
        const others = users.filter((u) => u.id !== currentUser.id && u._id !== currentUser.id);
        setDirectory(others);
      } catch (error) {
        console.error("Failed to load directory", error);
        setDirectory(MOCK_DIRECTORY); // Fallback
      }
    };
    loadDirectory();
  }, [currentUser.id]);

  // Fetch Messages when a user is selected (and poll for new ones)
  useEffect(() => {
    let intervalId;

    const loadMessages = async () => {
      if (!selectedUser) return;
      try {
        const msgs = await fetchMessages(currentUser.id || currentUser._id, selectedUser.id || selectedUser._id);
        setMessages(msgs);
      } catch (error) {
        console.error("Failed to load messages", error);
      }
    };

    if (selectedUser) {
      loadMessages(); // Initial load
      intervalId = setInterval(loadMessages, 3000); // Poll every 3 seconds
    }

    return () => clearInterval(intervalId);
  }, [selectedUser, currentUser.id]);


  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (selectedUser) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedUser]);

  const isStudent = currentUser.role === UserRole.UNDERGRADUATE;

  // Filtered Directory based on search
  const filteredDirectory = useMemo(() => {
    return directory.filter(u =>
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.title && u.title.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [directory, searchTerm]);


  // 3. SEND MESSAGE LOGIC
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!messageInput.trim() && !attachment) || !selectedUser) return;

    const tempId = Date.now().toString();
    const newMessage = {
      id: tempId,
      senderId: currentUser.id || currentUser._id,
      receiverId: selectedUser.id || selectedUser._id,
      text: messageInput || '',
      timestamp: new Date().toISOString(),
      read: false,
      attachmentName: attachment ? attachment.name : undefined,
      attachmentType: attachment ? attachment.type : undefined
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
    setAttachment(null);

    try {
      await sendMessage({
        senderId: currentUser.id || currentUser._id,
        receiverId: selectedUser.id || selectedUser._id,
        text: newMessage.text,
        timestamp: newMessage.timestamp,
        attachmentName: newMessage.attachmentName,
        attachmentType: newMessage.attachmentType
      });
      // The polling will pick up the real saved message shortly
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  // Filter messages for the active conversation (although API does this, keeping consistent structure)
  const activeConversation = useMemo(() => {
    if (!selectedUser) return [];
    return messages; // API already returns filtered messages for this pair
  }, [messages, selectedUser]);

  // Get last message for sidebar preview
  const getLastMessage = (userId) => {
    const chat = messages.filter(m =>
      ((m.senderId === currentUser.id || m.senderId === currentUser._id) && (m.receiverId === userId || m.receiverId === userId)) ||
      ((m.senderId === userId || m.senderId === userId) && (m.receiverId === currentUser.id || m.receiverId === currentUser._id))
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return chat;
  };

  return (
    <div className="h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex">
      {/* Sidebar List */}
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-200`}>
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-1">
            Messages
          </h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredDirectory.length > 0 ? (
            filteredDirectory.map(user => {
              const lastMsg = getLastMessage(user.id || user._id);
              return (
                <div
                  key={user.id || user._id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${selectedUser?.id === user.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 truncate">{user.name}</h3>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${user.role === UserRole.GRADUATE ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                        {user.role === UserRole.GRADUATE ? 'Alumni' : 'Student'}
                        </span>
                      </div>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${lastMsg && !lastMsg.read && lastMsg.receiverId === currentUser.id ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                      {lastMsg ? ((lastMsg.senderId === currentUser.id || lastMsg.senderId === currentUser._id) ? `You: ${lastMsg.text}` : lastMsg.text) : user.title}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 px-4 text-slate-500 text-sm">
              No contacts found matching search.
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-slate-50 min-w-0`}>
        {selectedUser ? (
          <>
            <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="md:hidden p-1 hover:bg-slate-100 rounded-full">
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{selectedUser.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${selectedUser.role === UserRole.GRADUATE ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                      {selectedUser.role === UserRole.GRADUATE ? 'Alumni' : 'Student'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    {selectedUser.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-indigo-600 transition-colors"
                  title="View Profile Details Sidebar"
                  aria-label="View Profile"
                >
                  <UserCircle className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowBlockMenu(!showBlockMenu)}
                    className={`p-2 hover:bg-slate-100 rounded-full ${showBlockMenu ? 'text-indigo-600 bg-slate-50' : 'text-slate-500'}`}
                    title="More options"
                    aria-label="More options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {showBlockMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in duration-100">
                      {blockedUsers.includes(selectedUser.id || selectedUser._id) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setBlockedUsers(blockedUsers.filter(id => id !== (selectedUser.id || selectedUser._id)));
                            setShowBlockMenu(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 font-semibold flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4" /> Unblock User
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setBlockedUsers([...blockedUsers, selectedUser.id || selectedUser._id]);
                            setShowBlockMenu(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4 text-red-500" /> Block User
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {activeConversation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="font-medium text-slate-600">No messages yet</p>
                  <p className="text-sm">Break the ice! Say hello to {selectedUser.name.split(' ')[0]}.</p>
                </div>
              ) : (
                activeConversation.map(msg => {
                  const isMe = msg.senderId === currentUser.id || msg.senderId === currentUser._id;
                  return (
                    <div key={msg.id || msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] group relative ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                          }`}>
                          {msg.text}
                        </div>
                        {msg.attachmentName && (
                          <div className={`mt-2 flex items-center gap-3 p-3 rounded-xl border text-xs max-w-sm ${isMe
                            ? 'bg-indigo-700/50 border-indigo-500/25 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}>
                            <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs shrink-0 ${isMe ? 'bg-indigo-900/50 text-indigo-200' : 'bg-red-100 text-red-600'}`}>
                              {msg.attachmentName.split('.').pop().toUpperCase() || 'FILE'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{msg.attachmentName}</p>
                              <p className="text-[10px] opacity-75">Resource Attachment</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => alert(`Downloading attachment: ${msg.attachmentName}`)}
                              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-indigo-600 shrink-0"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-1 px-1">
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && <CheckCheck className="w-3 h-3 text-indigo-400" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {blockedUsers.includes(selectedUser.id || selectedUser._id) ? (
              <div className="p-6 bg-red-50 border-t border-slate-200 text-center text-sm font-semibold text-red-700 flex items-center justify-center gap-3">
                <Shield className="w-5 h-5 text-red-500" />
                <span>You have blocked this user. You cannot send or receive messages.</span>
                <button
                  onClick={() => setBlockedUsers(blockedUsers.filter(id => id !== (selectedUser.id || selectedUser._id)))}
                  className="px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Unblock
                </button>
              </div>
            ) : (
              <>
                {attachment && (
                  <div className="px-4 py-2 bg-indigo-50/50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded text-[10px]">
                        {attachment.name.split('.').pop().toUpperCase()}
                      </span>
                      <span className="font-medium truncate max-w-[250px]">{attachment.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setAttachment({ name: e.target.files[0].name, type: e.target.files[0].type });
                      }
                    }}
                  />
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                      className={`p-3 rounded-xl transition-all ${showAttachmentMenu ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
                      title="Add attachment"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    {showAttachmentMenu && (
                      <div className="absolute bottom-14 left-0 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in slide-in-from-bottom duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            fileInputRef.current?.click();
                            setShowAttachmentMenu(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                        >
                          📁 Upload Local File
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const name = currentUser.resumeName || `${currentUser.name.split(' ')[0]}_Resume.pdf`;
                            setAttachment({ name, type: 'application/pdf' });
                            setShowAttachmentMenu(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100 font-medium"
                        >
                          📄 Attach My Resume
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 transition-all focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() && !attachment}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
            <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-indigo-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">Your Messages</h3>
            <p className="max-w-xs mx-auto mt-2 text-sm text-slate-500">
              Select a conversation from the left to start chatting with Alumni or Students.
            </p>
          </div>
        )}

        {/* Full-Screen Profile Modal (all screen sizes) */}
        {isProfileOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-50 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 shadow-2xl">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10 rounded-t-2xl">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Profile Details</h2>
                  <p className="text-sm text-slate-500">{selectedUser.name} &middot; {selectedUser.role === 'alumni' || selectedUser.role === 'graduate' ? 'Alumni' : 'Student'}</p>
                </div>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {/* Full Profile (no isSidebar — uses the full 2-column layout) */}
              <div className="p-6">
                <Profile user={selectedUser} readOnly={true} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
