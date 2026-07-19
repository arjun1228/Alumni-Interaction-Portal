import React from 'react';
import { School, Moon, Sun, MessageSquare, Briefcase, Calendar, Sparkles, ArrowRight, GraduationCap, Users } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { Logo } from './Logo';

export const LandingPage = ({ onGetStarted, theme, toggleTheme }) => {
  const scrollToFeatures = () => {
    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 theme-transition flex flex-col">
      {/* Sticky Premium Navbar */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-900 theme-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 dark:bg-indigo-600 text-white p-2 rounded-xl shadow-md">
              <Logo className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">AlumniConnect</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-600 dark:text-slate-350"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-500 animate-in spin-in-12" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600 animate-in spin-in-12" />
              )}
            </button>

            <button
              onClick={onGetStarted}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2 btn-primary-premium text-white text-sm font-semibold rounded-xl cursor-pointer shadow-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-32 lg:pb-28">
          {/* Glowing blur effects for background */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <ScrollReveal animationClass="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 glass-badge text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
                <GraduationCap className="w-3.5 h-3.5" /> University Network
              </span>
            </ScrollReveal>

            <ScrollReveal animationClass="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                Bridge the Gap Between <br className="hidden sm:inline" />
                <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent hero-gradient-hover cursor-pointer">Campus and Career</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal animationClass="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Connect students with alumni mentors, discover exclusive job openings, register for networking events, and power up your professional journey with our AI Career Mentor.
              </p>
            </ScrollReveal>

            <ScrollReveal animationClass="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-8 py-4 btn-primary-premium text-white font-bold rounded-2xl cursor-pointer flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={scrollToFeatures}
                  className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-2xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  Explore Features
                </button>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section id="features-section" className="py-20 bg-white dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-900 theme-transition relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <ScrollReveal>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Designed for Modern Student & Alumni Interaction
                </h2>
              </ScrollReveal>
              <ScrollReveal animationClass="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
                <p className="mt-4 text-slate-500 dark:text-slate-400">
                  Four powerful modules integrated into a single cohesive campus platform.
                </p>
              </ScrollReveal>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <ScrollReveal className="h-full" style={{ animationDelay: '100ms' }}>
                <div className="group h-full glass-card p-6 rounded-2xl">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 relative inline-block pb-1">
                    Community Feed
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                    Share milestones, seek advice, and engage in campus discussions with structured, categorized posts.
                  </p>
                </div>
              </ScrollReveal>

              {/* Feature 2 */}
              <ScrollReveal className="h-full" style={{ animationDelay: '200ms' }}>
                <div className="group h-full glass-card p-6 rounded-2xl">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 relative inline-block pb-1">
                    Jobs & Internships
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                    Access targeted job openings posted directly by university alumni. Apply instantly to start your career.
                  </p>
                </div>
              </ScrollReveal>

              {/* Feature 3 */}
              <ScrollReveal className="h-full" style={{ animationDelay: '300ms' }}>
                <div className="group h-full glass-card p-6 rounded-2xl">
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 relative inline-block pb-1">
                    Events & Workshops
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-600 dark:bg-amber-400 transition-all duration-300 group-hover:w-full"></span>
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                    RSVP to panels, webinars, and mixer events. Keep up with campus happenings in real time.
                  </p>
                </div>
              </ScrollReveal>

              {/* Feature 4 */}
              <ScrollReveal className="h-full" style={{ animationDelay: '400ms' }}>
                <div className="group h-full glass-card p-6 rounded-2xl">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 relative inline-block pb-1">
                    AI Career Mentor
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 dark:bg-purple-400 transition-all duration-300 group-hover:w-full"></span>
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                    Get custom advice on your resume, practice for standard interview sessions, and analyze skill discrepancies.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-900 bg-white dark:bg-slate-950 py-8 theme-transition mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <Logo className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-slate-800 dark:text-white">AlumniConnect</span>
          </div>
          <p>© {new Date().getFullYear()} AlumniConnect Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
