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
import { LandingPage } from './components/LandingPage';
import { VerifyEmail } from './components/VerifyEmail';

import { Logo } from './components/Logo';

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
  Loader2,
  BarChart2,
  LogOut,
  Menu,
  X,
  School,
  UserCircle,
  MessageSquare,
  Users,
  Sun,
  Moon
} from 'lucide-react';

import { Routes, Route } from 'react-router-dom';
import { PostView } from './components/PostView';
import { fetchPosts, fetchJobs, fetchEvents, fetchCurrentUser, fetchTrendingTopics, selectGoogleRole } from './services/api';
import { useToast } from './components/Toast';

function App() {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState(ViewState.FEED);
  const [activeChatUser, setActiveChatUser] = useState(null); // New state for navigation
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showAuthScreen, setShowAuthScreen] = useState(false);

  // Role selection modal states for Google OAuth signup
  const [roleSelectRole, setRoleSelectRole] = useState('student');
  const [roleSelectDept, setRoleSelectDept] = useState('');
  const [roleSelectYear, setRoleSelectYear] = useState('1');
  const [roleSelectCompany, setRoleSelectCompany] = useState('');
  const [roleSelectTitle, setRoleSelectTitle] = useState('');
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  // Theme State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Global State
  const [posts, setPosts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);

  const [hashtagFilter, setHashtagFilter] = useState(null);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchCurrentUser()
      .then(user => {
        if (user) {
          setCurrentUser(user);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingUser(false));

    const handleLoadError = (err) => {
      console.error(err);
      setLoadError("Couldn't load the latest data — check your connection and try refreshing.");
    };

    fetchPosts().then(setPosts).catch(handleLoadError);
    fetchJobs().then(setJobs).catch(handleLoadError);
    fetchEvents().then(setEvents).catch(handleLoadError);
  }, []);

  useEffect(() => {
    fetchTrendingTopics().then(setTrendingTopics).catch((err) => {
      console.error(err);
      setLoadError("Couldn't load the latest data — check your connection and try refreshing.");
    });
  }, [posts]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setCurrentView(ViewState.FEED);
    setActiveChatUser(null);
    setShowAuthScreen(false);
    toast('You\'ve been signed out. See you next time! 👋', 'info');
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium cursor-pointer ${currentView === view
        ? isStudent ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:shadow-none' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50 dark:shadow-none'
        : 'text-slate-550 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
        }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  // Premium dark-themed Loading state (Inspired by FinPulse loader design)
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white theme-transition">
        <div className="relative flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
          {/* Glowing blur effects behind loader */}
          <div className="absolute w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
          {/* Logo icon */}
          <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-500/25 mb-1">
            <School className="w-8 h-8 animate-pulse" />
          </div>
          {/* Centered spinner */}
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-400"></div>
          <div className="flex flex-col items-center text-center gap-1">
            <h3 className="font-bold text-lg text-slate-100 tracking-wide">Connecting to AlumniConnect...</h3>
            <p className="text-xs text-slate-400">Securing your session & loading recent updates</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/post/:id" element={<PostView currentUser={currentUser} theme={theme} />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="*" element={<>
        {!currentUser ? (
          showAuthScreen ? (
            <AuthScreen onLogin={(user) => { setCurrentUser(user); setShowAuthScreen(false); }} onBack={() => setShowAuthScreen(false)} />
          ) : (
            <LandingPage onGetStarted={() => setShowAuthScreen(true)} theme={theme} toggleTheme={toggleTheme} />
          )
        ) : (
          currentUser.role?.toUpperCase() === 'ADMIN' || currentUser.role?.toLowerCase() === 'admin' ? (
            <Suspense fallback={
              <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-400"></div>
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
                theme={theme}
                toggleTheme={toggleTheme}
              />
            </Suspense>
          ) : (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 theme-transition flex">
              {/* Sidebar */}
              <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:overflow-y-auto md:translate-x-0 flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-8">
                    <div className={`${isStudent ? 'bg-indigo-600' : 'bg-emerald-600'} text-white p-2 rounded-lg`}>
                      <Logo className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold text-slate-850 dark:text-white tracking-tight">AlumniConnect</span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-wider px-4 mb-2">Menu</div>
                    <NavItem view={ViewState.FEED} icon={LayoutDashboard} label="Community Feed" />
                    <NavItem view={ViewState.JOBS} icon={Briefcase} label="Jobs & Internships" />
                    <NavItem view={ViewState.EVENTS} icon={Calendar} label="Events & Workshops" />
                    <NavItem view={ViewState.COACH || ViewState.AI_MENTOR} icon={Sparkles} label="AI Career Mentor" />
                    <NavItem view={ViewState.NETWORK} icon={Users} label="Network" />
                    <NavItem view={ViewState.MESSAGES} icon={MessageSquare} label={isStudent ? "Mentors" : "Messages"} />
                    {(currentUser.role === UserRole.GRADUATE || currentUser.role === 'alumni') && (
                      <NavItem view={ViewState.ANALYTICS} icon={BarChart2} label="Analytics" />
                    )}
                  </div>

                  <div className="space-y-2 mt-6">
                    <div className="text-xs font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-wider px-4 mb-2">Account</div>
                    <NavItem view={ViewState.PROFILE} icon={UserCircle} label="My Profile" />
                  </div>
                </div>

                <div className="absolute bottom-0 w-full p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{currentUser.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.title}</p>
                    </div>
                  </div>
                  {/* Theme Toggle & Sign Out actions */}
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                    <button
                      onClick={toggleTheme}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      aria-label="Toggle Theme"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          <span>Light Mode</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Dark Mode</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <main className="flex-1 h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 theme-transition">
                <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
                  <div className="flex items-center gap-2">
                    <div className={`${isStudent ? 'bg-indigo-600' : 'bg-emerald-600'} text-white p-1.5 rounded`}>
                      <Logo className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white">AlumniConnect</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={toggleTheme}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                      aria-label="Toggle Theme"
                    >
                      {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                    </button>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                      {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                  </div>
                </div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                  {loadError && (
                    <div className="mb-6 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-lg flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="text-red-550 font-medium">⚠️</div>
                        <p className="text-sm text-red-700 dark:text-red-400">{loadError}</p>
                      </div>
                      <button onClick={() => setLoadError(null)} className="text-red-400 hover:text-red-650 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main View Area */}
                    <div className="flex-1 min-w-0">
                      {currentView === ViewState.FEED && (
                        <Feed
                          posts={posts}
                          setPosts={setPosts}
                          currentUser={currentUser}
                          hashtagFilter={hashtagFilter}
                          setHashtagFilter={setHashtagFilter}
                        />
                      )}
                      {currentView === ViewState.JOBS && <Jobs jobs={jobs} setJobs={setJobs} currentUser={currentUser} />}
                      {currentView === ViewState.EVENTS && <Events events={events} setEvents={setEvents} currentUser={currentUser} />}
                      {(currentView === ViewState.COACH || currentView === ViewState.AI_MENTOR) && (
                        <div className="w-full flex flex-col h-[calc(100vh-7rem)] md:h-[calc(100vh-4rem)] animate-in fade-in">
                          <div className="mb-6 text-center shrink-0">
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">AI Career Mentor</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Ask about resume improvement, interview questions, or skill gaps</p>
                          </div>
                          <Suspense fallback={
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex justify-center py-12 flex-1">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                          }>
                            <AICoach />
                          </Suspense>
                        </div>
                      )}
                      {currentView === ViewState.ANALYTICS && (currentUser.role === UserRole.GRADUATE || currentUser.role === 'alumni') && <Analytics theme={theme} />}
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
                      <div className="hidden lg:block w-80 space-y-6 shrink-0 sticky top-8 self-start">
                        {/* Academic Calendar Widget for Students */}
                        {isStudent && <AcademicCalendar />}

                        {/* Shared Widget: Trending Topics - ONLY FOR STUDENTS */}
                        {isStudent && (
                          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Trending Topics</h3>
                            <div className="flex flex-wrap gap-2">
                              {trendingTopics.map(item => (
                                <span
                                  key={item.tag}
                                  onClick={() => {
                                    setHashtagFilter(item.tag);
                                    setCurrentView(ViewState.FEED);
                                  }}
                                  className={`text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-colors flex items-center gap-1.5
                                    ${hashtagFilter === item.tag
                                      ? 'bg-indigo-600 text-white shadow-sm'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'}`}
                                >
                                  {item.tag}
                                  {item.count > 0 && <span className={`text-[10px] ${hashtagFilter === item.tag ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>({item.count})</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Alumni Specific Widget: Network Stats (Mock) */}
                        {!isStudent && (
                          <div className="bg-emerald-600 dark:bg-emerald-700/80 rounded-xl shadow-sm p-5 text-white">
                            <h3 className="font-bold mb-1">Your Impact</h3>
                            <p className="text-emerald-100 dark:text-emerald-200 text-xs mb-4">This month's contributions</p>
                            <div className="grid grid-cols-2 gap-4 text-center">
                              <div className="bg-white/10 rounded-lg p-2">
                                <div className="text-2xl font-bold">12</div>
                                <div className="text-xs text-emerald-100 dark:text-emerald-250">Profile Views</div>
                              </div>
                              <div className="bg-white/10 rounded-lg p-2">
                                <div className="text-2xl font-bold">3</div>
                                <div className="text-xs text-emerald-100 dark:text-emerald-250">Mentorships</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </main>

              {/* Mobile Menu Overlay */}
              {mobileMenuOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 md:hidden"
                  onClick={() => setMobileMenuOpen(false)}
                />
              )}
            </div>
          )
        )
        }
        
        {/* GOOGLE FIRST-LOGIN ROLE SELECTION MODAL */}
        {currentUser && currentUser.needsRoleSelection && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-8 text-center animate-in zoom-in duration-200">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-955/30 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-slate-805 dark:text-white mb-2">Complete Your Profile</h2>
              <p className="text-slate-600 dark:text-slate-350 text-sm mb-6">
                Welcome to AlumniConnect! Please specify whether you are registering as a student or an alumni member.
              </p>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmittingRole(true);
                try {
                  const selectionData = {
                    role: roleSelectRole,
                    department: roleSelectRole === 'student' ? roleSelectDept : undefined,
                    yearOfStudy: roleSelectRole === 'student' ? roleSelectYear : undefined,
                    currentCompany: roleSelectRole === 'alumni' ? roleSelectCompany : undefined,
                    jobTitle: roleSelectRole === 'alumni' ? roleSelectTitle : undefined
                  };
                  const updatedUser = await selectGoogleRole(currentUser.id || currentUser._id, selectionData);
                  
                  if (updatedUser.approvalStatus === 'pending') {
                    toast('Alumni registration pending admin approval! 🔍', 'info');
                    localStorage.removeItem('token');
                    setCurrentUser(null);
                  } else {
                    setCurrentUser(updatedUser);
                    toast('Welcome to AlumniConnect! 🎓', 'success');
                  }
                } catch (err) {
                  console.error(err);
                  toast(err.message || 'Failed to select role.', 'error');
                } finally {
                  setIsSubmittingRole(false);
                }
              }} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Choose Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRoleSelectRole('student')}
                      className={`py-3 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                        roleSelectRole === 'student'
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleSelectRole('alumni')}
                      className={`py-3 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                        roleSelectRole === 'alumni'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      Alumni
                    </button>
                  </div>
                </div>

                {roleSelectRole === 'student' ? (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Department / Major</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={roleSelectDept}
                        onChange={(e) => setRoleSelectDept(e.target.value)}
                        className="w-full form-input-custom rounded-xl p-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Year of Study</label>
                      <select
                        value={roleSelectYear}
                        onChange={(e) => setRoleSelectYear(e.target.value)}
                        className="w-full form-input-custom rounded-xl p-3 text-sm"
                      >
                        <option value="1">1st Year (Freshman)</option>
                        <option value="2">2nd Year (Sophomore)</option>
                        <option value="3">3rd Year (Junior)</option>
                        <option value="4">4th Year (Senior)</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Current Company</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Google"
                        value={roleSelectCompany}
                        onChange={(e) => setRoleSelectCompany(e.target.value)}
                        className="w-full form-input-custom rounded-xl p-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Job Title</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Software Engineer"
                        value={roleSelectTitle}
                        onChange={(e) => setRoleSelectTitle(e.target.value)}
                        className="w-full form-input-custom rounded-xl p-3 text-sm"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingRole}
                  className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-750 text-white font-bold py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-6"
                >
                  {isSubmittingRole && <Loader2 className="animate-spin w-5 h-5" />}
                  Confirm Selection
                </button>
              </form>
            </div>
          </div>
        )}
      </> } />
    </Routes>
  );
}

export default App;
