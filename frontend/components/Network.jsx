import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { Search, MapPin, X, UserCircle } from 'lucide-react';
import { Profile } from './Profile';
import { SearchInput } from './SearchInput';
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
    <div className="space-y-6 text-slate-805 dark:text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-805 dark:text-white flex items-center gap-3">
            {isStudentView ? 'Find Mentors & Peers' : 'Community Directory'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isStudentView 
              ? 'Connect with alumni, students, and peers to grow your network.' 
              : 'Connect with fellow alumni members.'}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <SearchInput
          placeholder={isStudentView ? "Search by company, role, or skill (e.g., 'Google', 'React')..." : "Search by alumni name, skills, or company..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid Results */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-3">Loading directory...</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user, index) => {
            const displayRole = user.role === UserRole.GRADUATE || user.role === 'alumni' ? 'Alumni' : 'Student';
            const delay = Math.min(index * 60, 600);
            return (
              <div
                key={`${user.id || user._id}-${filteredUsers.length}-${searchTerm}`}
                onClick={() => setSelectedUser(user)}
                style={{ animationDelay: `${delay}ms` }}
                className={`animate-in fade-in slide-in-from-bottom-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 cursor-pointer hover:-translate-y-1 hover:shadow-md hover:shadow-indigo-100/5 dark:hover:shadow-none network-card-hover group relative overflow-hidden ${
                  displayRole === 'Alumni'
                    ? 'hover:border-emerald-500 dark:hover:border-emerald-500'
                    : 'hover:border-indigo-500 dark:hover:border-indigo-500'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <img 
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} 
                    alt={user.name} 
                    className={`w-16 h-16 rounded-full object-cover border-2 bg-white dark:bg-slate-900 ring-2 ring-offset-2 ${
                      displayRole === 'Alumni' 
                        ? 'border-emerald-500 dark:border-emerald-400 ring-emerald-500/30 dark:ring-emerald-400/20 dark:ring-offset-slate-900' 
                        : 'border-indigo-500 dark:border-indigo-400 ring-indigo-500/30 dark:ring-indigo-400/20 dark:ring-offset-slate-900'
                    } ${user.avatar && !user.avatar.includes('ui-avatars.com') ? 'avatar-saturate' : ''}`} 
                  />
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                    ${displayRole === 'Alumni' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'}`}>
                    {displayRole}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user.name}</h3>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {user.title} {user.company && <span className="text-slate-500 dark:text-slate-400">at {user.company}</span>}
                </p>

                {user.location && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {user.location}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {(user.skills || user.interests || []).slice(0, 3).map(tag => (
                    <span 
                      key={tag} 
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded text-xs font-medium transition-all duration-150 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200/50 dark:hover:border-indigo-800/30 border border-transparent"
                    >
                      {tag}
                    </span>
                  ))}
                  {((user.skills || user.interests || []).length > 3) && (
                    <span className="px-2 py-1 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 rounded text-xs">
                      +{(user.skills || user.interests || []).length - 3} more
                    </span>
                  )}
                </div>

                {/* Hover-reveal action button */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-linear-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 dark:to-transparent translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out flex justify-center items-center pointer-events-none group-hover:pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(user);
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]
                      ${displayRole === 'Alumni'
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'}`}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-700">
            <UserCircle className="w-8 h-8" />
          </div>
          <h3 className="text-slate-900 dark:text-white font-medium">No profiles found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Try adjusting your search terms.</p>
        </div>
      )}

      {/* Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
          <div className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in duration-200 shadow-2xl">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 z-10 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 p-2 rounded-full backdrop-blur-sm transition-all cursor-pointer text-slate-800 dark:text-slate-300 dark:hover:text-white"
            >
              <X className="w-6 h-6" />
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
