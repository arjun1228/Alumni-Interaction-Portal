
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { Search, MessageCircle, Send, ArrowLeft, MoreVertical, UserCircle, X, CheckCheck } from 'lucide-react';
import { Profile } from './Profile';

interface MessagingProps {
  currentUser: User;
}

// Extended Message Interface for Persistence
interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string; // Stored as string for JSON compatibility
  read: boolean;
}

// Mock Directory Data (Fallback)
const MOCK_DIRECTORY: User[] = [
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

export const Messaging: React.FC<MessagingProps> = ({ currentUser }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. PERSISTENT MESSAGE STATE
  const [messages, setMessages] = useState<DirectMessage[]>(() => {
    try {
      const stored = localStorage.getItem('ac_direct_messages');
      if (stored) return JSON.parse(stored);
      
      // Initial Seed Data if empty
      return [
        { 
          id: 'm1', 
          senderId: 'd1', 
          receiverId: currentUser.id, 
          text: `Hi ${currentUser.name.split(' ')[0]}! I noticed your profile and thought we could connect.`, 
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          read: false 
        }
      ];
    } catch (e) {
      return [];
    }
  });

  // Save to LocalStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('ac_direct_messages', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (selectedUser) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedUser]);

  const isStudent = currentUser.role === UserRole.UNDERGRADUATE;
  
  // 2. DYNAMIC DIRECTORY (Mock + LocalStorage Users)
  const directory = useMemo(() => {
    try {
      const storedUsersStr = localStorage.getItem('alumniconnect_users');
      const storedUsers: Record<string, { data: User }> = storedUsersStr ? JSON.parse(storedUsersStr) : {};
      const localUsers = Object.values(storedUsers).map(u => u.data);
      
      // Merge unique users
      const allUsers = [...MOCK_DIRECTORY];
      localUsers.forEach(u => {
        if (!allUsers.find(m => m.id === u.id)) {
          allUsers.push(u);
        }
      });

      return allUsers.filter(u => 
        u.id !== currentUser.id &&
        u.role !== currentUser.role && // Only show opposite role
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         (u.title && u.title.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    } catch (e) {
      return MOCK_DIRECTORY.filter(u => u.role !== currentUser.role);
    }
  }, [currentUser.role, currentUser.id, searchTerm]);

  // 3. SEND MESSAGE LOGIC
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser) return;

    const newMessage: DirectMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      text: messageInput,
      timestamp: new Date().toISOString(),
      read: false
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setMessageInput('');

    // 4. SIMULATE REALISTIC REPLY
    setTimeout(() => {
      const replyText = `Thanks for the message! I'm currently offline but I'll get back to you regarding "${newMessage.text.substring(0, 15)}..." soon.`;
      
      const replyMessage: DirectMessage = {
        id: (Date.now() + 100).toString(),
        senderId: selectedUser.id,
        receiverId: currentUser.id,
        text: replyText,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      setMessages(prev => [...prev, replyMessage]);
    }, 2000);
  };

  // Filter messages for the active conversation
  const activeConversation = useMemo(() => {
    if (!selectedUser) return [];
    return messages.filter(m => 
      (m.senderId === currentUser.id && m.receiverId === selectedUser.id) ||
      (m.senderId === selectedUser.id && m.receiverId === currentUser.id)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, selectedUser, currentUser.id]);

  // Get last message for sidebar preview
  const getLastMessage = (userId: string) => {
    const chat = messages.filter(m => 
      (m.senderId === currentUser.id && m.receiverId === userId) ||
      (m.senderId === userId && m.receiverId === currentUser.id)
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return chat;
  };

  return (
    <div className="h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex">
      {/* Sidebar List */}
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-200`}>
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-1">
            {isStudent ? 'Alumni Directory' : 'Student Messages'}
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
           {directory.map(user => {
             const lastMsg = getLastMessage(user.id);
             return (
               <div 
                 key={user.id}
                 onClick={() => setSelectedUser(user)}
                 className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${selectedUser?.id === user.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
               >
                 <div className="relative">
                   <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                   {/* Online Indicator Mock */}
                   <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-baseline mb-1">
                     <h3 className="font-semibold text-slate-900 truncate">{user.name}</h3>
                     {lastMsg && (
                       <span className="text-[10px] text-slate-400">
                         {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                     )}
                   </div>
                   <p className={`text-xs truncate ${lastMsg && !lastMsg.read && lastMsg.receiverId === currentUser.id ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                     {lastMsg ? (lastMsg.senderId === currentUser.id ? `You: ${lastMsg.text}` : lastMsg.text) : user.title}
                   </p>
                 </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-slate-50`}>
        {selectedUser ? (
          <>
            <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="md:hidden p-1 hover:bg-slate-100 rounded-full">
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <img src={selectedUser.avatar} alt={selectedUser.name} className="w-10 h-10 rounded-full border border-slate-200" />
                <div>
                  <h3 className="font-bold text-slate-800">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    {selectedUser.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setIsProfileOpen(true)}
                   className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-indigo-600 transition-colors"
                   title="View Profile"
                 >
                    <UserCircle className="w-5 h-5" />
                 </button>
                 <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <MoreVertical className="w-5 h-5" />
                 </button>
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
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] group relative ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                         <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                           isMe
                             ? 'bg-indigo-600 text-white rounded-br-none' 
                             : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                         }`}>
                           {msg.text}
                         </div>
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

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <input 
                type="text" 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 transition-all focus:bg-white"
              />
              <button 
                type="submit"
                disabled={!messageInput.trim()}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
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

        {/* Profile Modal */}
        {isProfileOpen && selectedUser && (
           <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-slate-50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in duration-200">
                 <button 
                   onClick={() => setIsProfileOpen(false)}
                   className="absolute top-4 right-4 z-10 bg-white/50 hover:bg-white p-2 rounded-full backdrop-blur-sm transition-all"
                 >
                    <X className="w-6 h-6 text-slate-800" />
                 </button>
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
