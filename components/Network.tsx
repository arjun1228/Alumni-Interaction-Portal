
import React, { useState, useMemo } from 'react';
import { User, UserRole, ViewState } from '../types';
import { Search, MapPin, Briefcase, GraduationCap, X, Filter, UserCircle } from 'lucide-react';
import { Profile } from './Profile';

interface NetworkProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
}

// Extended Mock Data for Directory
const MOCK_USERS: User[] = [
  {
    id: 'd1',
    name: 'Sarah Jenkins',
    email: 'sarah@example.com',
    role: UserRole.GRADUATE,
    title: 'Product Manager',
    company: 'TechCorp',
    avatar: 'https://picsum.photos/id/64/100/100',
    university: 'State University',
    bio: 'Experienced PM with a background in CS. Passionate about helping students transition into product roles.',
    skills: ['Product Management', 'Agile', 'Roadmapping', 'User Research'],
    location: 'San Francisco, CA',
    graduationYear: 2020,
    projects: [
       { id: 'p1', title: 'AI Analytics Dashboard', description: 'Led the product launch for a new analytics suite.', technologies: ['React', 'Python', 'AI'] }
    ]
  },
  {
    id: 'd2',
    name: 'David Chen',
    email: 'david@example.com',
    role: UserRole.GRADUATE,
    title: 'Senior Engineer',
    company: 'StartupX',
    avatar: 'https://picsum.photos/id/91/100/100',
    university: 'State University',
    bio: 'Full stack engineer loving React and Node. Originally from the Class of 2019.',
    skills: ['React', 'Node.js', 'AWS', 'System Design'],
    location: 'Remote',
    graduationYear: 2019
  },
  {
    id: 'd3',
    name: 'Emily Zhang',
    email: 'emily@example.com',
    role: UserRole.GRADUATE,
    title: 'CTO',
    company: 'TechStart',
    avatar: 'https://picsum.photos/id/65/100/100',
    university: 'State University',
    bio: 'Building the next big thing. Happy to give advice on startup culture and leadership.',
    skills: ['Leadership', 'System Design', 'Scaling', 'Python'],
    location: 'New York, NY',
    graduationYear: 2018
  },
  {
    id: 'd4',
    name: 'James Wilson',
    email: 'james@example.com',
    role: UserRole.GRADUATE,
    title: 'DevOps Lead',
    company: 'CloudScale',
    avatar: 'https://picsum.photos/id/99/100/100',
    university: 'State University',
    bio: 'Infrastructure as code enthusiast. Ask me about Kubernetes.',
    skills: ['Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
    location: 'Austin, TX',
    graduationYear: 2021
  },
  {
    id: 's1',
    name: 'Alex Johnson',
    email: 'alex@edu.com',
    role: UserRole.UNDERGRADUATE,
    title: 'Computer Science Student',
    avatar: 'https://picsum.photos/200/200?random=1',
    university: 'State University',
    department: 'Computer Science',
    yearOfStudy: 3,
    interests: ['AI', 'Web Dev', 'Open Source'],
    skills: ['JavaScript', 'Python'],
    experience: 'Looking for summer internships in frontend development.',
    projects: [
      { id: 'sp1', title: 'Campus Event Tracker', description: 'Built a mobile app for tracking campus events.', technologies: ['Flutter', 'Firebase'] },
      { id: 'sp2', title: 'Portfolio Website', description: 'Personal portfolio built with React and Tailwind.', technologies: ['React', 'Tailwind'] }
    ]
  },
  {
    id: 's2',
    name: 'Michael Brown',
    email: 'michael@edu.com',
    role: UserRole.UNDERGRADUATE,
    title: 'Data Science Major',
    avatar: 'https://picsum.photos/200/200?random=2',
    university: 'State University',
    department: 'Statistics',
    yearOfStudy: 2,
    interests: ['Data Science', 'Machine Learning', 'Big Data'],
    skills: ['R', 'Python', 'SQL'],
    experience: 'Working on a research project about climate change data.',
    projects: [
       { id: 'sp3', title: 'Climate Data Analysis', description: 'Analyzed 50 years of climate data using Python pandas.', technologies: ['Python', 'Pandas', 'Matplotlib'] }
    ]
  },
  {
    id: 's3',
    name: 'Lisa Wong',
    email: 'lisa@edu.com',
    role: UserRole.UNDERGRADUATE,
    title: 'UX Design Student',
    avatar: 'https://picsum.photos/200/200?random=3',
    university: 'State University',
    department: 'Design',
    yearOfStudy: 4,
    interests: ['UI/UX', 'Accessibility', 'Mobile Design'],
    skills: ['Figma', 'Adobe XD', 'Prototyping'],
    experience: 'Created the redesign for the university library app.'
  }
];

export const Network: React.FC<NetworkProps> = ({ currentUser, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Combine Mock Users with Registered Users from LocalStorage
  const allUsers = useMemo(() => {
    try {
      const storedUsersStr = localStorage.getItem('alumniconnect_users');
      const storedUsers: Record<string, { data: User }> = storedUsersStr ? JSON.parse(storedUsersStr) : {};
      const localUsers = Object.values(storedUsers).map(u => u.data);
      // Filter out potential duplicates if needed, though for now simple spread is fine
      return [...MOCK_USERS, ...localUsers.filter(u => !MOCK_USERS.find(m => m.id === u.id))];
    } catch (e) {
      return MOCK_USERS;
    }
  }, []);

  // Filter logic: Show users of the OPPOSITE role (Alumni see Students, Students see Alumni)
  // Search checks name, title, skills, company, or interests
  const filteredUsers = allUsers.filter(user => {
    if (user.id === currentUser.id) return false; // Don't show self
    
    const isOppositeRole = user.role !== currentUser.role;
    if (!isOppositeRole) return false;

    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(term) ||
      (user.title && user.title.toLowerCase().includes(term)) ||
      (user.company && user.company.toLowerCase().includes(term)) ||
      (user.skills && user.skills.some(skill => skill.toLowerCase().includes(term))) ||
      (user.interests && user.interests.some(interest => interest.toLowerCase().includes(term)));

    return matchesSearch;
  });

  const isStudentView = currentUser.role === UserRole.UNDERGRADUATE;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isStudentView ? 'Find Mentors & Alumni' : 'Discover Talent'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isStudentView 
              ? 'Connect with graduates who can guide your career path.' 
              : 'Explore profiles of bright students ready for internships and roles.'}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder={isStudentView ? "Search by company, role, or skill (e.g., 'Google', 'React')..." : "Search by major, skill, or name..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Grid Results */}
      {filteredUsers.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(user => (
            <div 
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-50" />
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                  ${user.role === UserRole.GRADUATE ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                  {user.role === UserRole.GRADUATE ? 'Alumni' : 'Student'}
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
          ))}
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
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in duration-200">
                <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 z-10 bg-white/50 hover:bg-white p-2 rounded-full backdrop-blur-sm transition-all"
                >
                <X className="w-6 h-6 text-slate-800" />
                </button>
                <div className="p-6">
                <Profile user={selectedUser} readOnly={true} onNavigate={onNavigate} />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
