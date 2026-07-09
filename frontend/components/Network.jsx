import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { Search, MapPin, X, UserCircle } from 'lucide-react';
import { Profile } from './Profile';
import { fetchAllUsers } from '../services/api';

export const Network = ({ currentUser, onNavigate, onChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Directory from live Database
  useEffect(() => {
    const loadDirectory = async () => {
      setIsLoading(true);
      try {
        const users = await fetchAllUsers();
        // Remove any users with 'admin' role
        const nonAdminUsers = users.filter(user => user.role !== UserRole.ADMIN && user.role !== 'admin');
        setUsersList(nonAdminUsers);
      } catch (error) {
        console.error("Failed to load directory", error);
        setUsersList([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadDirectory();
  }, []);

  const isStudentView = currentUser.role === UserRole.UNDERGRADUATE;

  // Filter logic: 
  // - Students can see both Students & Alumni.
  // - Alumni can see ONLY Alumni.
  const filteredUsers = usersList.filter(user => {
    // 1. Don't show self
    if (user.id === currentUser.id || user._id === currentUser.id) return false;

    // 2. Role-based filtering
    // If the logged in user is Alumni (not student), exclude students (UNDERGRADUATE)
    if (!isStudentView && user.role !== UserRole.GRADUATE && user.role !== 'alumni') {
      return false;
    }

    // 3. Search query matching
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(term) ||
      (user.title && user.title.toLowerCase().includes(term)) ||
      (user.company && user.company.toLowerCase().includes(term)) ||
      (user.skills && user.skills.some(skill => skill.toLowerCase().includes(term))) ||
      (user.interests && user.interests.some(interest => interest.toLowerCase().includes(term)));

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            {isStudentView ? 'Find Mentors & Peers' : 'Community Directory'}
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
              {usersList.length} members in DB
            </span>
          </h1>
          <p className="text-slate-500 mt-1">
            {isStudentView 
              ? 'Connect with alumni, students, and peers to grow your network.' 
              : 'Connect with fellow alumni members.'}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={isStudentView ? "Search by company, role, or skill (e.g., 'Google', 'React')..." : "Search by alumni name, skills, or company..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Grid Results */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-500 text-sm mt-3">Loading directory...</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(user => {
            const displayRole = user.role === UserRole.GRADUATE || user.role === 'alumni' ? 'Alumni' : 'Student';
            return (
              <div
                key={user.id || user._id}
                onClick={() => setSelectedUser(user)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-50" />
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                    ${displayRole === 'Alumni' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                    {displayRole}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{user.name}</h3>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  {user.title} {user.company && <span className="text-slate-500">at {user.company}</span>}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <MapPin className="w-3 h-3" />
                  {user.location || 'Unknown Location'}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {(user.skills || user.interests || []).slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {((user.skills || user.interests || []).length > 3) && (
                    <span className="px-2 py-1 bg-slate-50 text-slate-400 rounded text-xs">
                      +{(user.skills || user.interests || []).length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <UserCircle className="w-8 h-8" />
          </div>
          <h3 className="text-slate-900 font-medium">No profiles found</h3>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search terms.</p>
        </div>
      )}

      {/* Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
          <div className="bg-slate-50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in duration-200">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 z-10 bg-white/50 hover:bg-white p-2 rounded-full backdrop-blur-sm transition-all"
            >
              <X className="w-6 h-6 text-slate-800" />
            </button>
            <div className="p-6">
              <Profile user={selectedUser} readOnly={true} onNavigate={onNavigate} onChat={onChat} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
