import React, { useState, useRef } from 'react';
import { School, Briefcase, GraduationCap, ArrowRight, Loader2, CheckCircle, AlertCircle, Mail, ShieldCheck, RefreshCw, Info, Eye, EyeOff, Check, X as XIcon } from 'lucide-react';
import { UserRole } from '../types';
import { loginUser, registerStudent, registerAlumni, resendVerificationEmail, loginGoogleOneTap } from '../services/api';
import { useToast } from './Toast';

export const AuthScreen = ({ onLogin, onBack }) => {
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
  const [showPassword, setShowPassword] = useState(false);
  const googleButtonRef = useRef(null);

  // Clear credentials on mount
  React.useEffect(() => {
    setEmail('');
    setPassword('');
    setName('');
    setTitle('');
    setOrgName('');
  }, []);

  // Initialize Google One Tap Sign-In automatically
  React.useEffect(() => {
    const initializeOneTap = () => {
      if (window.google?.accounts?.id) {
        if (window.googleOneTapInitialized) {
          // Re-render the button on re-mount
          if (googleButtonRef.current) {
            window.google.accounts.id.renderButton(googleButtonRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: googleButtonRef.current.offsetWidth || 400
            });
          }
          try {
            window.google.accounts.id.prompt((notification) => {
              if (notification.isNotDisplayed()) {
                console.log('One Tap prompt call reason:', notification.getNotDisplayedReason());
              }
            });
          } catch (e) {
            console.warn(e);
          }
          return;
        }

        window.googleOneTapInitialized = true;
        try {
          window.google.accounts.id.initialize({
            client_id: "899947425716-cpgp8s0earkghto74iqplda9ntlvueqv.apps.googleusercontent.com",
            callback: async (response) => {
              setIsLoading(true);
              setError('');
              try {
                const user = await loginGoogleOneTap(response.credential);
                toast(`Welcome back, ${user.name || 'User'}! 🎉`, 'success');
                onLogin(user);
              } catch (err) {
                console.error(err);
                setError(err.message || 'Google One Tap authentication failed.');
              } finally {
                setIsLoading(false);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: false,
            use_fedcm: true
          });

          // Render the personalized Google Sign-In button
          if (googleButtonRef.current) {
            window.google.accounts.id.renderButton(googleButtonRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: googleButtonRef.current.offsetWidth || 400
            });
          }

          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed()) {
              console.log('One Tap not displayed reason:', notification.getNotDisplayedReason());
            }
          });
        } catch (err) {
          console.error('Error initializing Google One Tap:', err);
        }
      }
    };

    // If script is already loaded
    if (window.google?.accounts?.id) {
      initializeOneTap();
    } else {
      // Check every 100ms for up to 5 seconds
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id) {
          initializeOneTap();
          clearInterval(interval);
        } else if (attempts >= 50) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [onLogin, toast]);

  // Live password requirements checklist
  const passwordChecks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(password) },
  ];

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
      case 0: return { label: '', color: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-400 dark:text-slate-500' };
      case 1: return { label: 'Weak', color: 'bg-red-500', text: 'text-red-650 dark:text-red-400' };
      case 2: return { label: 'Fair', color: 'bg-amber-400', text: 'text-amber-650 dark:text-amber-405' };
      case 3: return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-650 dark:text-blue-400' };
      case 4: return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-655 dark:text-emerald-400' };
      default: return { label: '', color: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-400 dark:text-slate-500' };
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
        department: '',
        yearOfStudy: null,
        course: '',
        skills: [],
        interests: [],
        experience: ''
      } : {
        department: '',
        company: '',
        title: '',
        yearsOfExperience: '',
        skills: [],
        bio: ''
      };

      const user = await loginUser({
        email,
        password,
        role: activeTab,
        name: email.split('@')[0], // Fallback name for auto-created users
        ...defaultData
      });

      const isUserAdmin = user.role?.toUpperCase() === 'ADMIN' || user.role === 'admin';
      if (!isUserAdmin && user.role !== activeTab) {
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (activeTab === UserRole.UNDERGRADUATE && !email.toLowerCase().endsWith('.edu')) {
      setError('Student accounts require a valid .edu email address.');
      setIsLoading(false);
      return;
    }

    try {
      const isStudent = activeTab === UserRole.UNDERGRADUATE;

      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        role: activeTab,
        title: isStudent ? 'Student' : (title || 'Alumni'),
        university: isStudent ? orgName : undefined,
        company: !isStudent ? orgName : undefined,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        department: '',
        yearOfStudy: null,
        course: '',
        interests: [],
        skills: [],
        experience: '',
        bio: '',
        location: ''
      };

      if (isStudent) {
        await registerStudent({
          name,
          email: email.toLowerCase(),
          password,
          department: '',
          yearOfStudy: null,
          interests: []
        });
        toast('Account created successfully! Please log in.', 'success');
        setPassword('');
        setName('');
        setOrgName('');
        setTitle('');
        setView('LOGIN');
      } else {
        const resData = await registerAlumni({
          name,
          email: email.toLowerCase(),
          password,
          currentCompany: orgName || 'Independent',
          jobTitle: title || 'Alumni Member',
          yearsOfExperience: '1 Year',
          professionalBio: '',
          skills: []
        });
        setPendingUser({ ...newUser, email: email.toLowerCase() });
        setVerificationToken(resData.referenceToken || generateToken());
        setView('VERIFY_GRAD');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!pendingUser?.email) return;
    setIsLoading(true);
    setError('');
    try {
      await resendVerificationEmail(pendingUser.email);
      toast('Verification link resent successfully! Please check your inbox.', 'success');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  if (view === 'VERIFY_UG') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 theme-transition">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-transparent dark:border-slate-850 rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-300 theme-transition">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-955/30 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-650 dark:text-indigo-400">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-805 dark:text-white mb-2">Check Your Email</h2>
          <p className="text-slate-655 dark:text-slate-350 mb-6">
            We have sent a verification link to <span className="font-semibold text-slate-805 dark:text-white">{pendingUser?.email}</span>.
            <br />Please click the link in that email to activate your account.
          </p>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 mb-6 text-left relative overflow-hidden">
            <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-1">Local Testing Notice</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Because we are in development mode, a clickable email preview link has been printed directly to your server console. You can click that link to complete verification.
            </p>
          </div>

          {error && <p className="text-red-500 text-sm mb-4 font-semibold">{error}</p>}

          <div className="space-y-3">
            <button
              onClick={handleResendEmail}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
              Resend Email
            </button>
            <button
              onClick={() => {
                setEmail('');
                setPassword('');
                setName('');
                setOrgName('');
                setTitle('');
                setPendingUser(null);
                setView('LOGIN');
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'VERIFY_GRAD') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 theme-transition">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-transparent dark:border-slate-850 rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-300 theme-transition">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-955/30 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-650 dark:text-amber-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Application Under Review</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Your application is under review. You'll be notified once an administrator approves your account.
          </p>

          <div className="bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 mb-6 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Briefcase className="w-24 h-24 dark:text-white" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1.5">Verification Details</h4>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <p><span className="font-semibold">Email:</span> {pendingUser?.email}</p>
              <p><span className="font-semibold">Reference Code:</span> <span className="font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-850 px-1 py-0.5 rounded font-bold text-slate-900 dark:text-white">{verificationToken}</span></p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setEmail('');
                setPassword('');
                setName('');
                setOrgName('');
                setTitle('');
                setPendingUser(null);
                setView('LOGIN');
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all cursor-pointer"
            >
              Back to Login
            </button>
            <button
              onClick={() => { setView('REGISTER'); setPendingUser(null); }}
              className="text-slate-550 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-205 text-sm font-medium cursor-pointer"
            >
              Cancel Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 theme-transition">
      <div className="max-w-5xl w-full grid md:grid-cols-2 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden min-h-[600px] border border-transparent dark:border-slate-850 theme-transition">

        {/* Left Side - Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center order-2 md:order-1">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div
                onClick={onBack}
                className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-opacity"
                title="Go back to Landing Page"
              >
                <div className={`p-1.5 rounded-lg text-white transition-colors duration-300 ${activeTab === UserRole.UNDERGRADUATE ? 'bg-indigo-600' : activeTab === UserRole.GRADUATE ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                  <School className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-slate-850 dark:text-white">AlumniConnect</span>
              </div>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer flex items-center gap-1"
                >
                  ← Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {view === 'LOGIN'
                  ? (activeTab === UserRole.UNDERGRADUATE ? 'Student Login' : activeTab === UserRole.GRADUATE ? 'Alumni Login' : 'Admin Portal')
                  : (activeTab === UserRole.UNDERGRADUATE ? 'Student Sign Up' : 'Alumni Sign Up')}
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              {view === 'LOGIN'
                ? `Welcome back! Please enter your ${activeTab === UserRole.UNDERGRADUATE ? 'student' : activeTab === UserRole.GRADUATE ? 'alumni' : 'admin'} credentials.`
                : `Join as a ${activeTab === UserRole.UNDERGRADUATE ? 'Student' : 'Alumni'} to connect.`}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-transparent dark:border-red-900/35 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={view === 'LOGIN' ? handleLogin : handleRegister} className="space-y-4">
            {view === 'REGISTER' && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl form-input-custom"
                    placeholder="e.g. Alex Johnson"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl form-input-custom"
                placeholder={activeTab === UserRole.UNDERGRADUATE ? "yourname@university.edu" : "name@company.com"}
              />
            </div>

            {view === 'REGISTER' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {activeTab === UserRole.UNDERGRADUATE ? 'University' : 'Company'}
                  </label>
                  <input
                    required
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl form-input-custom"
                    placeholder={activeTab === UserRole.UNDERGRADUATE ? "State Univ" : "TechCorp Inc."}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {activeTab === UserRole.UNDERGRADUATE ? 'Major' : 'Job Title'}
                  </label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl form-input-custom"
                    placeholder={activeTab === UserRole.UNDERGRADUATE ? "Computer Science" : "Senior Developer"}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl form-input-custom"
                  placeholder="••••••••"
                />
                {showPassword ? (
                  <button
                    type="button"
                    onClick={() => setShowPassword(false)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors p-1 cursor-pointer"
                    aria-label="Hide password"
                    tabIndex={-1}
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPassword(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-355 transition-colors p-1 cursor-pointer"
                    aria-label="Show password"
                    tabIndex={-1}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Password Strength Indicator */}
              {view === 'REGISTER' && password.length > 0 && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex gap-1 h-1.5 mb-2">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${strengthScore >= level ? strengthConfig.color : 'bg-slate-100 dark:bg-slate-800'
                          }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strengthConfig.text} flex justify-between items-center`}>
                    <span>Strength: {strengthConfig.label}</span>
                  </p>

                  {/* Live Requirements Checklist */}
                  <ul className="mt-2.5 space-y-1">
                    {passwordChecks.map((check) => (
                      <li key={check.label} className={`flex items-center gap-2 text-xs transition-colors duration-200 ${check.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-405 dark:text-slate-500'}`}>
                        {check.met
                          ? <Check className="w-3.5 h-3.5 shrink-0" />
                          : <XIcon className="w-3.5 h-3.5 shrink-0" />
                        }
                        {check.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full text-white font-bold py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 shadow-lg hover:shadow-xl ${activeTab === UserRole.UNDERGRADUATE ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/50 dark:shadow-none' : activeTab === UserRole.GRADUATE ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50 dark:shadow-none' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200/50 dark:shadow-none'}`}
            >
              {isLoading && <Loader2 className="animate-spin w-5 h-5" />}
              {view === 'LOGIN'
                ? (activeTab === UserRole.UNDERGRADUATE ? 'Sign In as Student' : activeTab === UserRole.GRADUATE ? 'Sign In as Alumni' : 'Access Dashboard')
                : 'Create Account'}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {activeTab !== 'admin' && activeTab !== 'ADMIN' && (
            <>
              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <span className="relative px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 z-10">Or continue with</span>
              </div>
              {/* Google renders a personalized "Sign in as..." button here */}
              <div ref={googleButtonRef} className="w-full flex items-center justify-center"></div>
            </>
          )}

          <div className="mt-8 text-center">
            <p className="text-slate-500 dark:text-slate-450 text-sm">
              {view === 'LOGIN' ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => { setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setError(''); }}
                className={`ml-2 font-semibold hover:underline cursor-pointer ${activeTab === UserRole.UNDERGRADUATE ? 'text-indigo-600 hover:text-indigo-700' : 'text-emerald-600 hover:text-emerald-700'}`}
              >
                {view === 'LOGIN' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>

          {view === 'LOGIN' && (
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs text-slate-500 dark:text-slate-450 border border-slate-100 dark:border-slate-850 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
              <div className="flex-1 flex justify-between">
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
                      <p className={`text-xs mt-1 ${activeTab === UserRole.UNDERGRADUATE ? 'text-indigo-650' : 'text-indigo-200'}`}>
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
                      <p className={`text-xs mt-1 ${activeTab === UserRole.GRADUATE ? 'text-emerald-650' : 'text-indigo-200'}`}>
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
