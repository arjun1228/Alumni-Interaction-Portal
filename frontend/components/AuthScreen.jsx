import React, { useState } from 'react';
import { School, Briefcase, GraduationCap, ArrowRight, Loader2, CheckCircle, AlertCircle, Mail, ShieldCheck, RefreshCw } from 'lucide-react';
import { UserRole } from '../types';
import { loginUser, registerStudent, registerAlumni } from '../services/api';
import { useToast } from './Toast';

export const AuthScreen = ({ onLogin }) => {
  const toast = useToast();
  const [view, setView] = useState('LOGIN');
  const [activeTab, setActiveTab] = useState(UserRole.UNDERGRADUATE);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState(''); // Major for students, Job Title for alumni
  const [orgName, setOrgName] = useState(''); // University for students, Company for alumni

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const [verificationToken, setVerificationToken] = useState('');

  // Password Strength Logic
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;

    // Cap score for very short passwords to ensure they don't look "Strong"
    if (pass.length < 6 && score > 1) return 1;

    return score;
  };

  const strengthScore = getPasswordStrength(password);

  const getStrengthConfig = (score) => {
    switch (score) {
      case 0: return { label: '', color: 'bg-slate-200', text: 'text-slate-400' };
      case 1: return { label: 'Weak', color: 'bg-red-500', text: 'text-red-600' };
      case 2: return { label: 'Fair', color: 'bg-amber-400', text: 'text-amber-600' };
      case 3: return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-600' };
      case 4: return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
      default: return { label: '', color: 'bg-slate-200', text: 'text-slate-400' };
    }
  };

  const strengthConfig = getStrengthConfig(strengthScore);

  const generateToken = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const defaultData = activeTab === UserRole.UNDERGRADUATE ? {
        department: 'Computer Science',
        yearOfStudy: 3,
        course: 'B.Tech CS',
        skills: ['Java', 'Python', 'React'],
        interests: ['AI/ML', 'Web Development'],
        experience: 'Aspiring software engineer with a passion for building scalable web applications.'
      } : {
        department: 'Engineering',
        company: 'Tech Corp',
        title: 'Software Engineer',
        yearsOfExperience: '3+ Years',
        skills: ['System Design', 'Cloud Architecture'],
        bio: 'Experienced backend engineer passionate about distributed systems.'
      };

      const user = await loginUser({
        email,
        password,
        role: activeTab,
        name: email.split('@')[0], // Fallback name for auto-created users
        ...defaultData
      });

      if (user.role !== UserRole.ADMIN && user.role !== activeTab) {
        setError(`Please switch to the ${user.role === UserRole.UNDERGRADUATE ? 'Student' : 'Alumni'} login tab.`);
        setIsLoading(false);
        return;
      }
      toast(`Welcome back, ${user.name || user.email.split('@')[0]}! 🎉`, 'success');
      onLogin(user);
    } catch (err) {
      console.error(err);
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        setError('Cannot connect to server. Is the backend running?');
      } else {
        setError(err.message || 'Login failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (activeTab === UserRole.UNDERGRADUATE && !email.toLowerCase().endsWith('.edu')) {
      setError('Student accounts require a valid .edu email address.');
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      const isStudent = activeTab === UserRole.UNDERGRADUATE;

      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        role: activeTab,
        title: title || (isStudent ? 'Student' : 'Alumni'),
        university: isStudent ? orgName : undefined,
        company: !isStudent ? orgName : undefined,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        department: isStudent ? 'Computer Science' : undefined,
        yearOfStudy: isStudent ? 3 : undefined,
        course: isStudent ? 'B.Tech CS' : undefined,
        interests: isStudent ? ['AI/ML', 'Web Development', 'Cloud Computing'] : undefined,
        skills: isStudent ? ['Java', 'Python', 'React'] : ['System Design', 'Leadership', 'Cloud Architecture'],
        experience: isStudent
          ? 'Winner of Campus Hackathon 2023. Built a project management tool using React.'
          : undefined,
        bio: !isStudent
          ? `Experienced professional working at ${orgName}. passionate about mentoring.`
          : undefined,
        location: 'San Francisco, CA'
      };

      setPendingUser(newUser);

      if (activeTab === UserRole.UNDERGRADUATE) {
        setView('VERIFY_UG');
      } else {
        setVerificationToken(generateToken());
        setView('VERIFY_GRAD');
      }
      setIsLoading(false);
    }, 1000);
  };

  const completeRegistration = async () => {
    if (!pendingUser) return;

    setIsLoading(true);
    setError('');
    try {
      const isStudent = activeTab === UserRole.UNDERGRADUATE;
      if (isStudent) {
        await registerStudent({
          name: pendingUser.name,
          email: pendingUser.email.toLowerCase(),
          password: password,
          department: pendingUser.department || 'Computer Science',
          yearOfStudy: pendingUser.yearOfStudy || 3,
          interests: pendingUser.interests || []
        });
      } else {
        await registerAlumni({
          name: pendingUser.name,
          email: pendingUser.email.toLowerCase(),
          password: password,
          currentCompany: pendingUser.company || 'TechCorp',
          jobTitle: pendingUser.title || 'Software Engineer',
          yearsOfExperience: '3 Years',
          professionalBio: pendingUser.bio || 'Alumni member',
          skills: pendingUser.skills || []
        });
      }

      const loggedInUser = await loginUser({
        email: pendingUser.email,
        password: password,
        role: activeTab
      });
      toast(`Account created! Welcome to AlumniConnect, ${loggedInUser.name || pendingUser.name}! 🎓`, 'success', 4500);
      onLogin(loggedInUser);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (view === 'VERIFY_UG') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Simulate Email Verification</h2>
          <p className="text-slate-600 mb-6">
            In a real app, we would send a link to <span className="font-semibold text-slate-800">{email}</span>.
            <br />For this demo, simply click the button below to verify.
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 text-sm text-blue-800 flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p><strong>Demo Mode:</strong> No actual email is sent. This screen simulates the user clicking a link from their inbox.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={completeRegistration}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              Verify & Continue
              <span className="text-indigo-200 text-xs font-normal">(Simulation)</span>
            </button>
            <button
              onClick={() => { setView('REGISTER'); setPendingUser(null); }}
              className="text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Resend Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'VERIFY_GRAD') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Admin Approval Required</h2>
          <p className="text-slate-600 mb-6">
            Alumni accounts require manual verification to maintain network integrity.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Briefcase className="w-24 h-24" />
            </div>
            <h4 className="font-semibold text-slate-700 text-sm mb-1">Verification Details</h4>
            <div className="text-sm text-slate-600 space-y-1 mb-3">
              <p><span className="font-medium">Email:</span> {pendingUser?.email}</p>
              <p><span className="font-medium">Reference Token:</span></p>
            </div>
            <div className="bg-white border border-slate-300 rounded p-2 font-mono text-center text-lg tracking-widest font-bold text-slate-800 select-all">
              {verificationToken}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              This token has been sent to your email. An administrator will review your application shortly.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={completeRegistration}
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              Simulate Admin Approval
              <span className="text-emerald-200 text-xs font-normal">(Hackathon Mode)</span>
            </button>
            <button
              onClick={() => { setView('REGISTER'); setPendingUser(null); }}
              className="text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              Cancel Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[600px]">

        {/* Left Side - Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center order-2 md:order-1">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg text-white transition-colors duration-300 ${activeTab === UserRole.UNDERGRADUATE ? 'bg-indigo-600' : activeTab === UserRole.GRADUATE ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                <School className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-slate-800">AlumniConnect</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">
                {view === 'LOGIN'
                  ? (activeTab === UserRole.UNDERGRADUATE ? 'Student Login' : activeTab === UserRole.GRADUATE ? 'Alumni Login' : 'Admin Portal')
                  : (activeTab === UserRole.UNDERGRADUATE ? 'Student Sign Up' : 'Alumni Sign Up')}
              </h1>
            </div>
            <p className="text-slate-600">
              {view === 'LOGIN'
                ? `Welcome back! Please enter your ${activeTab === UserRole.UNDERGRADUATE ? 'student' : activeTab === UserRole.GRADUATE ? 'alumni' : 'admin'} credentials.`
                : `Join as a ${activeTab === UserRole.UNDERGRADUATE ? 'Student' : 'Alumni'} to connect.`}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={view === 'LOGIN' ? handleLogin : handleRegister} className="space-y-4">
            {view === 'REGISTER' && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. Alex Johnson"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder={activeTab === UserRole.UNDERGRADUATE ? "yourname@university.edu" : "name@company.com"}
              />
            </div>

            {view === 'REGISTER' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {activeTab === UserRole.UNDERGRADUATE ? 'University' : 'Company'}
                  </label>
                  <input
                    required
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder={activeTab === UserRole.UNDERGRADUATE ? "State Univ" : "TechCorp Inc."}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {activeTab === UserRole.UNDERGRADUATE ? 'Major' : 'Job Title'}
                  </label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder={activeTab === UserRole.UNDERGRADUATE ? "Computer Science" : "Senior Developer"}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />

              {/* Password Strength Indicator */}
              {view === 'REGISTER' && password.length > 0 && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex gap-1 h-1.5 mb-2">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${strengthScore >= level ? strengthConfig.color : 'bg-slate-100'
                          }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strengthConfig.text} flex justify-between items-center`}>
                    <span>Strength: {strengthConfig.label}</span>
                    {strengthScore < 4 && <span className="text-slate-400 font-normal hidden sm:inline">Use 8+ chars, numbers & symbols</span>}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 shadow-lg hover:shadow-xl ${activeTab === UserRole.UNDERGRADUATE ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : activeTab === UserRole.GRADUATE ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'}`}
            >
              {isLoading && <Loader2 className="animate-spin w-5 h-5" />}
              {view === 'LOGIN'
                ? (activeTab === UserRole.UNDERGRADUATE ? 'Sign In as Student' : activeTab === UserRole.GRADUATE ? 'Sign In as Alumni' : 'Access Dashboard')
                : 'Create Account'}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              {view === 'LOGIN' ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => { setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setError(''); }}
                className={`ml-2 font-semibold hover:underline ${activeTab === UserRole.UNDERGRADUATE ? 'text-indigo-600 hover:text-indigo-700' : 'text-emerald-600 hover:text-emerald-700'}`}
              >
                {view === 'LOGIN' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>

          {view === 'LOGIN' && (
            <div className="mt-8 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-100">
              <p className="font-bold mb-2">Hackathon Demo Credentials:</p>
              <div className="flex justify-between">
                <span>Use <strong>.edu</strong> for Student tab.</span>
                <span>Use standard email for Alumni tab.</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Interactive Selection */}
        <div className="hidden md:flex bg-slate-900 relative overflow-hidden order-1 md:order-2 flex-col justify-center p-12 text-white">
          <div className={`absolute inset-0 bg-linear-to-br transition-all duration-500 ${activeTab === UserRole.UNDERGRADUATE ? 'from-indigo-600 to-purple-700' : activeTab === UserRole.GRADUATE ? 'from-emerald-600 to-teal-800' : 'from-slate-700 to-slate-900'} opacity-90`}></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center mix-blend-overlay opacity-50"></div>

          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold leading-tight">
                Choose your <br /> <span className={activeTab === UserRole.UNDERGRADUATE ? 'text-yellow-300' : 'text-white'}>Path</span>
              </h2>
              <p className="text-indigo-100 text-lg max-w-sm opacity-90">
                Select your role to access your personalized dashboard.
              </p>
            </div>

            <div className="space-y-4">
              {/* Student Selection Card */}
              <div
                onClick={() => { setActiveTab(UserRole.UNDERGRADUATE); setError(''); setView('LOGIN'); }}
                className={`group cursor-pointer p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${activeTab === UserRole.UNDERGRADUATE
                  ? 'bg-white text-indigo-900 border-white shadow-xl translate-x-4'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeTab === UserRole.UNDERGRADUATE ? 'bg-indigo-100 text-indigo-600' : 'bg-white/20'
                      }`}>
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">For Students</h3>
                      <p className={`text-xs mt-1 ${activeTab === UserRole.UNDERGRADUATE ? 'text-indigo-600' : 'text-indigo-200'}`}>
                        Mentorship & Internships
                      </p>
                    </div>
                  </div>
                  {activeTab === UserRole.UNDERGRADUATE && <CheckCircle className="w-6 h-6 text-indigo-600" />}
                </div>
              </div>

              {/* Alumni Selection Card */}
              <div
                onClick={() => { setActiveTab(UserRole.GRADUATE); setError(''); setView('LOGIN'); }}
                className={`group cursor-pointer p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${activeTab === UserRole.GRADUATE
                  ? 'bg-white text-emerald-900 border-white shadow-xl translate-x-4'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeTab === UserRole.GRADUATE ? 'bg-emerald-100 text-emerald-600' : 'bg-white/20'
                      }`}>
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">For Alumni</h3>
                      <p className={`text-xs mt-1 ${activeTab === UserRole.GRADUATE ? 'text-emerald-600' : 'text-indigo-200'}`}>
                        Recruit & Give Back
                      </p>
                    </div>
                  </div>
                  {activeTab === UserRole.GRADUATE && <CheckCircle className="w-6 h-6 text-emerald-600" />}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
