import React, { useState, useEffect } from 'react';
import { User, Post } from '../types';
import { Users, Activity, Search, School } from 'lucide-react';

interface AdminDashboardProps {
    currentUser: User;
}

type AdminView = 'STUDENTS' | 'ACTIVITIES';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
    const [activeView, setActiveView] = useState<AdminView>('STUDENTS');
    const [students, setStudents] = useState<User[]>([]);
    const [activities, setActivities] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch Students
                const studentsRes = await fetch('http://localhost:5000/api/admin/students');
                const studentsData = await studentsRes.json();
                setStudents(studentsData);

                // Fetch Activities
                const activitiesRes = await fetch('http://localhost:5000/api/admin/activities');
                const activitiesData = await activitiesRes.json();
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

    const filteredActivities = activities.filter(activity =>
        (activity.content?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (activity.author?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar - Simplified for Admin */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <School className="text-blue-400" />
                        Admin Portal
                    </h2>
                </div>

                <nav className="flex-1 p-4 space-y-2">
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
                        onClick={() => setActiveView('ACTIVITIES')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'ACTIVITIES'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Activity className="w-5 h-5" />
                        Student Activities
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-lg">
                            {currentUser.name[0]}
                        </div>
                        <div>
                            <p className="font-medium text-sm">{currentUser.name}</p>
                            <p className="text-xs text-slate-400">Administrator</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 overflow-y-auto">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-800">
                        {activeView === 'STUDENTS' ? 'Student Directory' : 'Recent Activities'}
                    </h1>
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-8">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {activeView === 'STUDENTS' && (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Student</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Department</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Year</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Interests</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}`} alt={student.name} className="w-10 h-10 rounded-full bg-slate-200" />
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
                                                        {student.yearOfStudy ? `Year ${student.yearOfStudy}` : 'Alumni'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {student.interests?.slice(0, 2).map((interest, i) => (
                                                                <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                                    {interest}
                                                                </span>
                                                            ))}
                                                            {(student.interests?.length || 0) > 2 && (
                                                                <span className="text-xs text-slate-400">+{student.interests!.length - 2}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Profile</button>
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

                            {activeView === 'ACTIVITIES' && (
                                <div className="space-y-4 max-w-4xl mx-auto">
                                    {filteredActivities.length > 0 ? filteredActivities.map((activity) => (
                                        <div key={activity.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                            <div className="flex items-start gap-4">
                                                <img src={activity.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.author?.name || 'User')}`} alt={activity.author?.name} className="w-12 h-12 rounded-full bg-slate-200" />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-bold text-slate-900">{activity.author?.name || 'Unknown User'}</h3>
                                                            <p className="text-sm text-slate-500">{activity.author?.title} • {activity.timestamp}</p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${activity.type === 'ACHIEVEMENT' ? 'bg-yellow-100 text-yellow-800' :
                                                                activity.type === 'ADVICE' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {activity.type}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-slate-700">{activity.content}</p>
                                                    <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                                                        <span>{activity.likes} Likes</span>
                                                        <span>{activity.comments} Comments</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-slate-500">No recent activities found.</div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};
