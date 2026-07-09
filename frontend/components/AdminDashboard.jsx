import React, { useState, useEffect } from 'react';
import { Users, Activity, Search, School, GraduationCap, MessageSquare, LogOut, Briefcase, Calendar, ClipboardList, Menu, X } from 'lucide-react';
import { fetchAdminStudents, fetchAdminActivities, fetchAdminAlumni } from '../services/api';
import { Feed } from './Feed';
import { Jobs } from './Jobs';
import { Events } from './Events';

export const AdminDashboard = ({ currentUser, posts, setPosts, jobs, setJobs, events, setEvents, onNavigate, onChat, onLogout }) => {
    const [activeView, setActiveView] = useState('STUDENTS');
    const [students, setStudents] = useState([]);
    const [alumni, setAlumni] = useState([]);
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    const filteredAlumni = alumni.filter(alum =>
        (alum.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (alum.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (alum.company?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const filteredActivities = activities.filter(activity => {
        const matchesSearch = (activity.content?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (activity.author?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        const isAuthorStudent = activity.author?.role === 'UNDERGRADUATE';

        if (activeView === 'STUDENT_ACTIVITIES') return isAuthorStudent;
        if (activeView === 'ALUMNI_ACTIVITIES') return !isAuthorStudent; // Assuming non-undergrad is Alumni/Grad

        return true;
    });

    const handleMessage = (user) => {
        if (onChat) {
            onChat(user);
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
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
                        <School className="text-blue-400" />
                        Admin Portal
                    </h2>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                        aria-label="Close Sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-2">Directories</div>
                    <button
                        onClick={() => setActiveView('STUDENTS')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'STUDENTS'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Users className="w-5 h-5" />
                        Student Directory
                    </button>
                    <button
                        onClick={() => setActiveView('ALUMNI')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'ALUMNI'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <GraduationCap className="w-5 h-5" />
                        Alumni Directory
                    </button>

                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-6">Monitoring</div>
                    <button
                        onClick={() => setActiveView('STUDENT_ACTIVITIES')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'STUDENT_ACTIVITIES'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Activity className="w-5 h-5" />
                        Student Activities
                    </button>
                    <button
                        onClick={() => setActiveView('ALUMNI_ACTIVITIES')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'ALUMNI_ACTIVITIES'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Activity className="w-5 h-5" />
                        Alumni Activities
                    </button>

                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-6">User Content</div>
                    <button
                        onClick={() => setActiveView('FEED')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'FEED'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <GraduationCap className="w-5 h-5" />
                        Community Feed
                    </button>
                    <button
                        onClick={() => setActiveView('JOBS')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'JOBS'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Briefcase className="w-5 h-5" />
                        Jobs & Internships
                    </button>
                    <button
                        onClick={() => setActiveView('EVENTS')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'EVENTS'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Calendar className="w-5 h-5" />
                        Events & Workshops
                    </button>

                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-6">Audit</div>
                    <button
                        onClick={() => setActiveView('ACTIVITY_LOG')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'ACTIVITY_LOG'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <ClipboardList className="w-5 h-5" />
                        Activity Log
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-lg">
                            {currentUser.name ? currentUser.name[0] : 'A'}
                        </div>
                        <div>
                            <p className="font-medium text-sm">{currentUser.name}</p>
                            <p className="text-xs text-slate-400">Administrator</p>
                        </div>
                    </div>
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-2 text-slate-400 hover:text-red-400 text-xs transition-colors mt-2"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-0 md:ml-64 overflow-y-auto min-w-0">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                            aria-label="Open Sidebar"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-800">
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
                        <div className="relative w-full max-w-[150px] sm:max-w-xs md:max-w-sm ml-auto mr-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </header>

                {/* Content Area */}
                <div className="p-8">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* STUDENTS DIRECTORY TABLE */}
                            {activeView === 'STUDENTS' && (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Student</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Department</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Year</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Verified</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                                <tr key={student.id || student._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}`} alt={student.name} className="w-10 h-10 rounded-full bg-slate-200 border border-slate-200 object-cover" />
                                                            <div>
                                                                <div className="font-semibold text-slate-900">{student.name}</div>
                                                                <div className="text-sm text-slate-500">{student.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {student.department || 'General'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        {student.yearOfStudy ? `Year ${student.yearOfStudy}` : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                            {student.isVerified ? 'Yes' : 'No'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => handleMessage(student)}
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                                        >
                                                            <MessageSquare className="w-4 h-4" /> Message
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8 text-slate-500">No students found matching your search.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* ALUMNI DIRECTORY TABLE */}
                            {activeView === 'ALUMNI' && (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Alumni</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Current Role</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Approval Status</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredAlumni.length > 0 ? filteredAlumni.map((alum) => (
                                                <tr key={alum.id || alum._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={alum.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(alum.name)}`} alt={alum.name} className="w-10 h-10 rounded-full bg-slate-200 border border-slate-200 object-cover" />
                                                            <div>
                                                                <div className="font-semibold text-slate-900">{alum.name}</div>
                                                                <div className="text-sm text-slate-500">{alum.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium text-slate-900">{alum.title || 'Alumni Member'}</div>
                                                            <div className="text-xs text-slate-500">{alum.company}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase
                                                            ${alum.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                                                              alum.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                                                              'bg-yellow-100 text-yellow-800'}`}>
                                                            {alum.approvalStatus || 'pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => handleMessage(alum)}
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                                        >
                                                            <MessageSquare className="w-4 h-4" /> Message
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-8 text-slate-500">No alumni found matching your search.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* STUDENT ACTIVITIES TABLE */}
                            {activeView === 'STUDENT_ACTIVITIES' && (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Student</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600 text-center">Registrations for Events / Workshops</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600 text-center">Jobs Applied</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                                <tr key={student.id || student._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}`} alt={student.name} className="w-10 h-10 rounded-full bg-slate-200 border border-slate-200 object-cover" />
                                                            <div>
                                                                <div className="font-semibold text-slate-900">{student.name}</div>
                                                                <div className="text-sm text-slate-500">{student.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-slate-800 text-base">
                                                        {student.eventsRegistered ?? 0}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-slate-800 text-base">
                                                        {student.jobsAppliedCount ?? 0}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={3} className="text-center py-8 text-slate-500">No students found matching your search.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* ALUMNI ACTIVITIES TABLE */}
                            {activeView === 'ALUMNI_ACTIVITIES' && (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Alumni</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600 text-center">Jobs Added</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600 text-center">Events / Workshops Hosted</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredAlumni.length > 0 ? filteredAlumni.map((alum) => (
                                                <tr key={alum.id || alum._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={alum.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(alum.name)}`} alt={alum.name} className="w-10 h-10 rounded-full bg-slate-200 border border-slate-200 object-cover" />
                                                            <div>
                                                                <div className="font-semibold text-slate-900">{alum.name}</div>
                                                                <div className="text-sm text-slate-500">{alum.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-slate-800 text-base">
                                                        {alum.jobsPosted ?? 0}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-slate-800 text-base">
                                                        {alum.eventsCreated ?? 0}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={3} className="text-center py-8 text-slate-500">No alumni found matching your search.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
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
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Admin ID</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Action</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Target Type</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Target ID</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {activities.length > 0 ? activities.map((log) => (
                                                <tr key={log._id || log.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 text-xs font-mono text-slate-500 truncate max-w-[120px]">{log.adminId}</td>
                                                    <td className="px-6 py-3">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-slate-600">{log.targetType}</td>
                                                    <td className="px-6 py-3 text-xs font-mono text-slate-500 truncate max-w-[120px]">{log.targetId}</td>
                                                    <td className="px-6 py-3 text-xs text-slate-400">
                                                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8 text-slate-500">No admin actions recorded yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};
