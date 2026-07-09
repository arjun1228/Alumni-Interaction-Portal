import React, { useState, useEffect, Suspense } from 'react';
import { ViewState, UserRole } from './types';
import { Feed } from './components/Feed';
import { Jobs } from './components/Jobs';
import { Events } from './components/Events';
import { Analytics } from './components/Analytics';
import { AuthScreen } from './components/AuthScreen';
import { Profile } from './components/Profile';
import { Messaging } from './components/Messaging';
import { Network } from './components/Network';
import { AcademicCalendar } from './components/AcademicCalendar';

const AdminDashboard = React.lazy(() =>
  import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard }))
);
const AICoach = React.lazy(() =>
  import('./components/AICoach').then(module => ({ default: module.AICoach }))
);
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  Sparkles,
  BarChart2,
  LogOut,
  Menu,
  X,
  School,
  UserCircle,
  MessageSquare,
  Users
} from 'lucide-react';

import { Routes, Route } from 'react-router-dom';
import { PostView } from './components/PostView';
import { fetchPosts, fetchJobs, fetchEvents, fetchCurrentUser } from './services/api';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState(ViewState.FEED);
  const [activeChatUser, setActiveChatUser] = useState(null); // New state for navigation
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Global State
  const [posts, setPosts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchCurrentUser()
      .then(user => {
        if (user) {
          setCurrentUser(user);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingUser(false));

    fetchPosts().then(setPosts).catch(console.error);
    fetchJobs().then(setJobs).catch(console.error);
    fetchEvents().then(setEvents).catch(console.error);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setCurrentView(ViewState.FEED);
    setActiveChatUser(null);
  };

  const handleChat = (user) => {
    setActiveChatUser(user);
    setCurrentView(ViewState.MESSAGES);
  };

  const isStudent = currentUser?.role === UserRole.UNDERGRADUATE || currentUser?.role === 'student';

  // Dashboard Layout
  const NavItem = ({ view, icon: Icon, label }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${currentView === view
        ? isStudent ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/post/:id" element={<PostView currentUser={currentUser} />} />
      <Route path="*" element={
        !currentUser ? (
          <AuthScreen onLogin={setCurrentUser} />
        ) : (
          currentUser.role === UserRole.ADMIN || currentUser.role?.toLowerCase() === 'admin' ? (
            <Suspense fallback={
              <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            }>
              <AdminDashboard
                currentUser={currentUser}
                posts={posts}
                setPosts={setPosts}
                jobs={jobs}
                setJobs={setJobs}
                events={events}
                setEvents={setEvents}
                onNavigate={setCurrentView}
                onChat={handleChat}
                onLogout={handleLogout}
              />
            </Suspense>
          ) : (
            <div className="min-h-screen bg-slate-50 flex">
              {/* Sidebar */}
              <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-8">
                    <div className={`${isStudent ? 'bg-indigo-600' : 'bg-emerald-600'} text-white p-2 rounded-lg`}>
                      <School className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight">AlumniConnect</span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">Menu</div>
                    <NavItem view={ViewState.FEED} icon={LayoutDashboard} label="Community Feed" />
                    <NavItem view={ViewState.JOBS} icon={Briefcase} label="Jobs & Internships" />
                    <NavItem view={ViewState.EVENTS} icon={Calendar} label="Events & Workshops" />
                    <NavItem view={ViewState.COACH || ViewState.AI_MENTOR} icon={Sparkles} label="AI Career Mentor" />
                    <NavItem view={ViewState.PROFILE} icon={UserCircle} label="My Profile" />
                    <NavItem view={ViewState.NETWORK} icon={Users} label="Network" />
                    <NavItem view={ViewState.MESSAGES} icon={MessageSquare} label={isStudent ? "Mentors" : "Messages"} />
                    {(currentUser.role === UserRole.GRADUATE || currentUser.role === 'alumni') && (
                      <NavItem view={ViewState.ANALYTICS} icon={BarChart2} label="Analytics" />
                    )}
                  </div>
                </div>

                <div className="absolute bottom-0 w-full p-6 border-t border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</h4>
                      <p className="text-xs text-slate-500 truncate">{currentUser.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </aside>

              {/* Main Content */}
              <main className="flex-1 h-screen overflow-y-auto">
                <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-40">
                  <div className="flex items-center gap-2">
                    <div className={`${isStudent ? 'bg-indigo-600' : 'bg-emerald-600'} text-white p-1.5 rounded`}>
                      <School className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-800">AlumniConnect</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
                    {mobileMenuOpen ? <X /> : <Menu />}
                  </button>
                </div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main View Area */}
                    <div className="flex-1 min-w-0">
                      {currentView === ViewState.FEED && <Feed posts={posts} setPosts={setPosts} currentUser={currentUser} />}
                      {currentView === ViewState.JOBS && <Jobs jobs={jobs} setJobs={setJobs} currentUser={currentUser} />}
                      {currentView === ViewState.EVENTS && <Events events={events} setEvents={setEvents} currentUser={currentUser} />}
                      {(currentView === ViewState.COACH || currentView === ViewState.AI_MENTOR) && (
                        <div className="max-w-3xl mx-auto">
                          <div className="mb-6 text-center">
                            <h1 className="text-2xl font-bold text-slate-800">AI Career Mentor</h1>
                            <p className="text-slate-500 text-sm">Ask about resume improvement, interview questions, or skill gaps</p>
                          </div>
                          <Suspense fallback={
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-center py-12">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                          }>
                            <AICoach />
                          </Suspense>
                        </div>
                      )}
                      {currentView === ViewState.ANALYTICS && (currentUser.role === UserRole.GRADUATE || currentUser.role === 'alumni') && <Analytics />}
                      {currentView === ViewState.PROFILE && (
                        <Profile
                          user={currentUser}
                          onUpdateUser={setCurrentUser}
                          onNavigate={setCurrentView}
                        />
                      )}
                      {currentView === ViewState.NETWORK && (
                        <Network currentUser={currentUser} onNavigate={setCurrentView} onChat={handleChat} />
                      )}
                      {currentView === ViewState.MESSAGES && <Messaging currentUser={currentUser} initialSelectedUser={activeChatUser} />}
                    </div>

                    {/* Right Sidebar Widgets - Only show on Feed for now, or if viewing Feed as a student */}
                    {currentView === ViewState.FEED && (
                      <div className="hidden lg:block w-80 space-y-6 shrink-0">
                        {/* Academic Calendar Widget for Students */}
                        {isStudent && <AcademicCalendar />}

                        {/* Shared Widget: Trending Topics - ONLY FOR STUDENTS */}
                        {isStudent && (
                          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                            <h3 className="font-bold text-slate-800 mb-4">Trending Topics</h3>
                            <div className="flex flex-wrap gap-2">
                              {['#AI', '#Internships', '#ResumeTips', '#Hackathon', '#WebDev'].map(tag => (
                                <span key={tag} className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-200 cursor-pointer transition-colors">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Alumni Specific Widget: Network Stats (Mock) */}
                        {!isStudent && (
                          <div className="bg-emerald-600 rounded-xl shadow-sm p-5 text-white">
                            <h3 className="font-bold mb-1">Your Impact</h3>
                            <p className="text-emerald-100 text-xs mb-4">This month's contributions</p>
                            <div className="grid grid-cols-2 gap-4 text-center">
                              <div className="bg-white/10 rounded-lg p-2">
                                <div className="text-2xl font-bold">12</div>
                                <div className="text-xs text-emerald-100">Profile Views</div>
                              </div>
                              <div className="bg-white/10 rounded-lg p-2">
                                <div className="text-2xl font-bold">3</div>
                                <div className="text-xs text-emerald-100">Mentorships</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </main>

              {/* Mobile Overlay */}
              {mobileMenuOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 md:hidden"
                  onClick={() => setMobileMenuOpen(false)}
                />
              )}
            </div>
          )
        )
      } />
    </Routes>
  );
}

export default App;
