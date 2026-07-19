import React, { useState, useEffect } from 'react';
import { Users, Activity, Search, School, GraduationCap, MessageSquare, LogOut, Briefcase, Calendar, ClipboardList, Menu, X, Sun, Moon, Trash2 } from 'lucide-react';
import { fetchAdminStudents, fetchAdminActivities, fetchAdminAlumni, sendMessageToUser, approveAlumni, rejectAlumni, deleteAdminUser } from '../services/api';
import { Feed } from './Feed';
import { Jobs } from './Jobs';
import { Events } from './Events';
import { useToast } from './Toast';
import { Logo } from './Logo';
import { SearchInput } from './SearchInput';

export const AdminDashboard = ({ currentUser, posts, setPosts, jobs, setJobs, events, setEvents, onNavigate, onChat, onLogout, theme, toggleTheme }) => {
    const toast = useToast();
    const [activeView, setActiveView] = useState('STUDENTS');
    const [students, setStudents] = useState([]);
    const [alumni, setAlumni] = useState([]);
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [alumniStatusFilter, setAlumniStatusFilter] = useState('all');

    // Message Composing state
    const [messageTargetUser, setMessageTargetUser] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch Data
                const [studentsData, alumniData, activitiesData] = await Promise.all([
                    fetchAdminStudents(),
                    fetchAdminAlumni(),
                    fetchAdminActivities()
                ]);

                setStudents(studentsData);
                setAlumni(alumniData);
                setActivities(activitiesData);
            } catch (error) {
                console.error('Failed to fetch admin data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter logic
    const filteredStudents = students.filter(student =>
        (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (student.department?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const filteredAlumni = alumni.filter(alum => {
        const matchesSearch = (alum.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (alum.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (alum.company?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;

        if (alumniStatusFilter !== 'all') {
            const status = alum.approvalStatus || 'pending';
            return status === alumniStatusFilter;
        }

        return true;
    });

    const filteredActivities = activities.filter(activity => {
        const matchesSearch = (activity.content?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (activity.author?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        const isAuthorStudent = activity.author?.role === 'UNDERGRADUATE';

        if (activeView === 'STUDENT_ACTIVITIES') return isAuthorStudent;
        if (activeView === 'ALUMNI_ACTIVITIES') return !isAuthorStudent;

        return true;
    });

    const handleMessage = (user) => {
        setMessageTargetUser(user);
        setMessageText('');
    };

    const handleApproveAlumni = async (id) => {
        try {
            await approveAlumni(id);
            setAlumni(prev => prev.map(alum => {
                if ((alum.id || alum._id) === id) {
                    return { ...alum, approvalStatus: 'approved' };
                }
                return alum;
            }));
            toast('Alumni approved successfully!', 'success');
        } catch (error) {
            console.error('Approve failed:', error);
            toast(error.message || 'Failed to approve alumni', 'error');
        }
    };

    const handleRejectAlumni = async (id) => {
        try {
            await rejectAlumni(id);
            setAlumni(prev => prev.map(alum => {
                if ((alum.id || alum._id) === id) {
                    return { ...alum, approvalStatus: 'rejected' };
                }
                return alum;
            }));
            toast('Alumni rejected successfully!', 'success');
        } catch (error) {
            console.error('Reject failed:', error);
            toast(error.message || 'Failed to reject alumni', 'error');
        }
    };

    const handleDeleteUser = async (userId, userName, userType) => {
        if (!window.confirm(`Permanently delete ${userName}'s account? This cannot be undone.`)) return;
        try {
            await deleteAdminUser(userId);
            if (userType === 'student') {
                setStudents(prev => prev.filter(s => (s.id || s._id) !== userId));
            } else {
                setAlumni(prev => prev.filter(a => (a.id || a._id) !== userId));
            }
            toast(`${userName} has been permanently deleted.`, 'success');
        } catch (error) {
            console.error('Delete failed:', error);
            toast(error.message || 'Failed to delete user', 'error');
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 theme-transition">
            {/* Sidebar backdrop for mobile */}
            {isSidebarOpen && (
                <div 
                    onClick={() => setIsSidebarOpen(false)} 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-10 md:hidden transition-opacity"
                />
            )}

            {/* Sidebar - Simplified for Admin */}
            <aside className={`w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20 transition-transform duration-300 ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}>
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Logo className="w-6 h-6 text-blue-400" />
                        Admin Portal
                    </h2>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors cursor-pointer"
                        aria-label="Close Sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-2">Directories</div>
                    <button
                        onClick={() => { setActiveView('STUDENTS'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeView === 'STUDENTS'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            }`}
                    >
                        <Users className="w-5 h-5" />
                        Student Directory
                    </button>
                    <button
                        onClick={() => { setActiveView('ALUMNI'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeView === 'ALUMNI'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            }`}
                    >
                        <GraduationCap className="w-5 h-5" />
                        Alumni Directory
                    </button>

                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-6">Monitoring</div>
                    <button
                        onClick={() => { setActiveView('STUDENT_ACTIVITIES'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeView === 'STUDENT_ACTIVITIES'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            }`}
                    >
                        <Activity className="w-5 h-5" />
                        Student Activities
                    </button>
                    <button
                        onClick={() => { setActiveView('ALUMNI_ACTIVITIES'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeView === 'ALUMNI_ACTIVITIES'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            }`}
                    >
                        <Activity className="w-5 h-5" />
                        Alumni Activities
                    </button>

                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-6">User Content</div>
                    <button
                        onClick={() => { setActiveView('FEED'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeView === 'FEED'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            }`}
                    >
                        <GraduationCap className="w-5 h-5" />
                        Community Feed
                    </button>
                    <button
                        onClick={() => { setActiveView('JOBS'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeView === 'JOBS'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            }`}
                    >
                        <Briefcase className="w-5 h-5" />
                        Jobs & Internships
                    </button>
                    <button
                        onClick={() => { setActiveView('EVENTS'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeView === 'EVENTS'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            }`}
                    >
                        <Calendar className="w-5 h-5" />
                        Events & Workshops
                    </button>

                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-6">Audit</div>
                    <button
                        onClick={() => { setActiveView('ACTIVITY_LOG'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeView === 'ACTIVITY_LOG'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            }`}
                    >
                        <ClipboardList className="w-5 h-5" />
                        Activity Log
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-lg text-white">
                            {currentUser.name ? currentUser.name[0] : 'A'}
                        </div>
                        <div>
                            <p className="font-medium text-sm text-white">{currentUser.name}</p>
                            <p className="text-xs text-slate-400">Administrator</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-800">
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? (
                                <>
                                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Light Mode</span>
                                </>
                            ) : (
                                <>
                                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Dark Mode</span>
                                </>
                            )}
                        </button>
                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            >
                                <LogOut className="w-3.5 h-3.5" /> Sign Out
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-0 md:ml-64 overflow-y-auto min-w-0 bg-slate-50 dark:bg-slate-950">
                {/* Header */}
                <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center sticky top-0 z-10 shadow-sm theme-transition">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                            aria-label="Open Sidebar"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                            {activeView === 'STUDENTS' && 'Student Directory'}
                            {activeView === 'ALUMNI' && 'Alumni Directory'}
                            {activeView === 'STUDENT_ACTIVITIES' && 'Student Activities'}
                            {activeView === 'ALUMNI_ACTIVITIES' && 'Alumni Activities'}
                            {activeView === 'FEED' && 'Community Feed'}
                            {activeView === 'JOBS' && 'Career Opportunities'}
                            {activeView === 'EVENTS' && 'Upcoming Events'}
                            {activeView === 'ACTIVITY_LOG' && 'Admin Activity Log'}
                        </h1>
                    </div>
                    {['STUDENTS', 'ALUMNI', 'STUDENT_ACTIVITIES', 'ALUMNI_ACTIVITIES', 'ACTIVITY_LOG'].includes(activeView) && (
                        <SearchInput
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-[150px] sm:max-w-xs md:max-w-sm ml-auto mr-4 text-sm"
                        />
                    )}
                </header>

                {/* Content Area */}
                <div className="p-8">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        </div>
                    ) : (
                        <>
                            {/* STUDENTS DIRECTORY TABLE */}
                            {activeView === 'STUDENTS' && (
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                                <tr>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Student</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Department</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Year</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Verified</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                                    <tr key={student.id || student._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <img src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}`} alt={student.name} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 object-cover" />
                                                                <div>
                                                                    <div className="font-semibold text-slate-900 dark:text-white">{student.name}</div>
                                                                    <div className="text-sm text-slate-500 dark:text-slate-400">{student.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                                                                {student.department || 'General'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-350 text-sm">
                                                            {student.yearOfStudy ? `Year ${student.yearOfStudy}` : 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${student.isVerified ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400 border-green-200 dark:border-green-900/40' : 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/40'}`}>
                                                                {student.isVerified ? 'Yes' : 'No'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => handleMessage(student)}
                                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <MessageSquare className="w-4 h-4" /> Message
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(student.id || student._id, student.name, 'student')}
                                                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-4 h-4" /> Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-450">No students found matching your search.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ALUMNI DIRECTORY TABLE */}
                            {activeView === 'ALUMNI' && (
                                <>
                                    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                                        {['all', 'pending', 'approved', 'rejected'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setAlumniStatusFilter(status)}
                                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer capitalize shrink-0 ${
                                                    alumniStatusFilter === status
                                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                {status} Alumni
                                            </button>
                                        ))}
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                                    <tr>
                                                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Alumni</th>
                                                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Current Role</th>
                                                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Approval Status</th>
                                                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {filteredAlumni.length > 0 ? filteredAlumni.map((alum) => (
                                                        <tr key={alum.id || alum._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <img src={alum.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(alum.name)}`} alt={alum.name} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 object-cover" />
                                                                    <div>
                                                                        <div className="font-semibold text-slate-900 dark:text-white">{alum.name}</div>
                                                                        <div className="text-sm text-slate-500 dark:text-slate-400">{alum.email}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div>
                                                                    <div className="font-medium text-slate-900 dark:text-white">{alum.title || 'Alumni Member'}</div>
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{alum.company}</div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase border
                                                                    ${alum.approvalStatus === 'approved' ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400 border-green-200 dark:border-green-900/40' :
                                                                      alum.approvalStatus === 'rejected' ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/40' :
                                                                      'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/40'}`}>
                                                                    {alum.approvalStatus || 'pending'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-wrap items-center gap-3">
                                                                    <button
                                                                        onClick={() => handleMessage(alum)}
                                                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1 cursor-pointer"
                                                                    >
                                                                        <MessageSquare className="w-4 h-4" /> Message
                                                                    </button>
                                                                    {alum.approvalStatus !== 'approved' && (
                                                                        <button
                                                                            onClick={() => handleApproveAlumni(alum.id || alum._id)}
                                                                            className="text-green-600 hover:text-green-800 dark:text-green-450 dark:hover:text-green-300 text-sm font-semibold flex items-center gap-1 cursor-pointer"
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                    )}
                                                                    {alum.approvalStatus !== 'rejected' && (
                                                                        <button
                                                                            onClick={() => handleRejectAlumni(alum.id || alum._id)}
                                                                            className="text-red-600 hover:text-red-800 dark:text-red-455 dark:hover:text-red-300 text-sm font-semibold flex items-center gap-1 cursor-pointer"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDeleteUser(alum.id || alum._id, alum.name, 'alumni')}
                                                                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium flex items-center gap-1 cursor-pointer"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" /> Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan={4} className="text-center py-8 text-slate-500 dark:text-slate-450">No alumni found matching your search.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* STUDENT ACTIVITIES TABLE */}
                            {activeView === 'STUDENT_ACTIVITIES' && (
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                                <tr>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Student</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-center">Registrations for Events / Workshops</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-center">Jobs Applied</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                                    <tr key={student.id || student._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <img src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}`} alt={student.name} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 object-cover" />
                                                                <div>
                                                                    <div className="font-semibold text-slate-900 dark:text-white">{student.name}</div>
                                                                    <div className="text-sm text-slate-500 dark:text-slate-400">{student.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-200 text-base">
                                                            {student.eventsRegistered ?? 0}
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-200 text-base">
                                                            {student.jobsAppliedCount ?? 0}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={3} className="text-center py-8 text-slate-500 dark:text-slate-455">No students found matching your search.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ALUMNI ACTIVITIES TABLE */}
                            {activeView === 'ALUMNI_ACTIVITIES' && (
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                                <tr>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Alumni</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-center">Jobs Added</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-center">Events / Workshops Hosted</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredAlumni.length > 0 ? filteredAlumni.map((alum) => (
                                                    <tr key={alum.id || alum._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <img src={alum.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(alum.name)}`} alt={alum.name} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 object-cover" />
                                                                <div>
                                                                    <div className="font-semibold text-slate-900 dark:text-white">{alum.name}</div>
                                                                    <div className="text-sm text-slate-500 dark:text-slate-400">{alum.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-200 text-base">
                                                            {alum.jobsPosted ?? 0}
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-200 text-base">
                                                            {alum.eventsCreated ?? 0}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={3} className="text-center py-8 text-slate-500 dark:text-slate-455">No alumni found matching your search.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* COMMUNITY FEED */}
                            {activeView === 'FEED' && (
                                <Feed posts={posts} setPosts={setPosts} currentUser={currentUser} />
                            )}

                            {/* JOBS & INTERNSHIPS */}
                            {activeView === 'JOBS' && (
                                <Jobs jobs={jobs} setJobs={setJobs} currentUser={currentUser} />
                            )}

                            {/* EVENTS & WORKSHOPS */}
                            {activeView === 'EVENTS' && (
                                <Events events={events} setEvents={setEvents} currentUser={currentUser} />
                            )}

                            {/* ADMIN ACTIVITY LOG */}
                            {activeView === 'ACTIVITY_LOG' && (
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                                <tr>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Admin ID</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Action</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Target Type</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Target ID</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Time</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {activities.length > 0 ? activities.map((log) => (
                                                    <tr key={log._id || log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                        <td className="px-6 py-3 text-xs font-mono text-slate-500 dark:text-slate-450 truncate max-w-[120px]">{log.adminId}</td>
                                                        <td className="px-6 py-3">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30">
                                                                {log.action}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-350">{log.targetType}</td>
                                                        <td className="px-6 py-3 text-xs font-mono text-slate-500 dark:text-slate-450 truncate max-w-[120px]">{log.targetId}</td>
                                                        <td className="px-6 py-3 text-xs text-slate-400 dark:text-slate-500">
                                                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-450">No admin actions recorded yet.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* COMPOSE OUTREACH MESSAGE MODAL */}
            {messageTargetUser && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-850 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Message {messageTargetUser.name}</h3>
                            <button 
                                onClick={() => setMessageTargetUser(null)} 
                                className="text-slate-400 hover:text-slate-605 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!messageText.trim()) return;
                            setIsSendingMessage(true);
                            try {
                                await sendMessageToUser(messageTargetUser.id || messageTargetUser._id, messageText);
                                toast('Message sent successfully! ✉️', 'success');
                                setMessageTargetUser(null);
                            } catch (err) {
                                // Error toast
                                toast(err.message || 'Failed to send message.', 'error');
                            } finally {
                                setIsSendingMessage(false);
                            }
                        }} className="p-6 space-y-4 bg-white dark:bg-slate-900">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Select Template</label>
                                <div className="space-y-1.5">
                                    {[
                                        { label: "Custom Message (Blank)", text: "" },
                                        { label: "Resume Improvement", text: "Your resume could use some improvements — consider updating it for better opportunities." },
                                        { label: "Profile Completion", text: "Please complete your profile to get the most out of AlumniConnect." },
                                        { label: "Inactivity Check", text: "We noticed some inactivity on your account — let us know if you need any help." }
                                    ].map((tpl, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setMessageText(tpl.text)}
                                            className="w-full text-left text-xs bg-slate-50 dark:bg-slate-950 hover:bg-indigo-50 dark:hover:bg-indigo-955/40 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 transition-all font-semibold cursor-pointer"
                                        >
                                            {tpl.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Message Body</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="w-full form-input-custom rounded-xl p-3 text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setMessageTargetUser(null)} 
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSendingMessage || !messageText.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {isSendingMessage ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
