
import React, { useState } from 'react';
import { User, UserRole, ViewState, Project } from '../types';
import { MapPin, Mail, BookOpen, Calendar, Briefcase, Award, Download, Building2, Code2, GraduationCap, Edit2, X, MessageSquare, ExternalLink, Plus, Trash2 } from 'lucide-react';

interface ProfileProps {
  user: User;
  onUpdateUser?: React.Dispatch<React.SetStateAction<User | null>>;
  onNavigate?: (view: ViewState) => void;
  onChat?: (user: User) => void;
  readOnly?: boolean;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onNavigate, onChat, readOnly = false }) => {
  const isStudent = user.role === UserRole.UNDERGRADUATE;
  const [isEditing, setIsEditing] = useState(false);

  // Edit State
  const [editName, setEditName] = useState(user.name);
  const [editTitle, setEditTitle] = useState(user.title || '');
  const [editBio, setEditBio] = useState(user.bio || '');
  const [editLocation, setEditLocation] = useState(user.location || '');

  // Alumni Specific Fields
  const [editCompany, setEditCompany] = useState(user.company || '');
  const [editDepartment, setEditDepartment] = useState(user.department || '');
  const [editExperience, setEditExperience] = useState(user.yearsOfExperience || '');

  // Project Editing State
  const [editProjects, setEditProjects] = useState<Project[]>(user.projects || []);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectTech, setNewProjectTech] = useState('');

  const handleAddProject = () => {
    if (!newProjectTitle || !newProjectDesc) return;
    const newProject: Project = {
      id: Date.now().toString(),
      title: newProjectTitle,
      description: newProjectDesc,
      technologies: newProjectTech.split(',').map(s => s.trim()).filter(Boolean),
      link: '#'
    };
    setEditProjects([...editProjects, newProject]);
    setNewProjectTitle('');
    setNewProjectDesc('');
    setNewProjectTech('');
  };

  const handleRemoveProject = (id: string) => {
    setEditProjects(editProjects.filter(p => p.id !== id));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        name: editName,
        title: editTitle,
        bio: editBio,
        location: editLocation,
        company: editCompany,
        department: editDepartment,
        yearsOfExperience: editExperience,
        projects: editProjects
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className={`h-32 ${isStudent ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gradient-to-r from-emerald-600 to-teal-700'}`}></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-white"
            />
            <div className="flex gap-3">
              {onChat && (
                <button
                  onClick={() => onChat(user)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
              )}
              {!readOnly && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-3 h-3" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-slate-600 font-medium flex items-center gap-2 mt-1">
              {isStudent ? <GraduationCap className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
              {user.title} {user.university && `at ${user.university}`}
            </p>
            {user.location && (
              <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                <MapPin className="w-3 h-3" /> {user.location}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="md:col-span-2 space-y-6">

          {/* About / Bio / Experience */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              {isStudent ? 'Experience & Background' : 'Professional Summary'}
            </h2>
            <div className="prose prose-slate text-sm">
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {isStudent ? (user.experience || "No experience listed yet.") : (user.bio || "No professional summary added.")}
              </p>
            </div>

            {/* Resume Link */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-xs">PDF</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user.name.split(' ')[0]}'s Resume.pdf</p>
                    <p className="text-xs text-slate-500">Updated 2 days ago</p>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-indigo-600">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Project Showcase */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-600" />
              {isStudent ? 'Project Showcase' : 'Key Projects'}
            </h2>

            {user.projects && user.projects.length > 0 ? (
              <div className="space-y-4">
                {user.projects.map((project) => (
                  <div key={project.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800">{project.title}</h3>
                      {project.link && (
                        <a href={project.link} className="text-indigo-600 hover:text-indigo-700">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, i) => (
                        <span key={i} className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500 text-sm">No projects added yet.</p>
              </div>
            )}
          </div>

          {/* Student Specific: Learning Interests */}
          {isStudent && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                What I want to learn
              </h2>
              <div className="flex flex-wrap gap-2">
                {user.interests?.map((interest, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100">
                    {interest}
                  </span>
                )) || <span className="text-slate-500 text-sm">No learning interests listed.</span>}
              </div>
            </div>
          )}

          {/* Alumni Specific: Job Description */}
          {!isStudent && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Current Role Details
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Job Description</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {user.bio || "No description provided."}
                  </p>
                </div>
                <div className="flex gap-4 pt-2">
                  <div className="flex-1 p-3 bg-slate-50 rounded-lg">
                    <span className="block text-xs text-slate-500">Company</span>
                    <span className="font-medium text-slate-700">{user.company || 'N/A'}</span>
                  </div>
                  <div className="flex-1 p-3 bg-slate-50 rounded-lg">
                    <span className="block text-xs text-slate-500">Department</span>
                    <span className="font-medium text-slate-700">{user.department || 'General'}</span>
                  </div>
                  <div className="flex-1 p-3 bg-slate-50 rounded-lg">
                    <span className="block text-xs text-slate-500">Experience</span>
                    <span className="font-medium text-slate-700">{user.yearsOfExperience || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Stats/Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              {isStudent ? 'Academic Details' : 'Skills & Expertise'}
            </h2>

            {isStudent ? (
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Department</p>
                    <p className="text-sm text-slate-600">{user.department || 'General Engineering'}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Course</p>
                    <p className="text-sm text-slate-600">{user.course || 'B.Tech Computer Science'}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Year of Study</p>
                    <p className="text-sm text-slate-600">Year {user.yearOfStudy || 1}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Skills</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.skills?.map(s => (
                        <span key={s} className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{s}</span>
                      )) || <span className="text-xs text-slate-500">None listed</span>}
                    </div>
                  </div>
                </li>
              </ul>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {user.skills?.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2">Willing to mentor on:</p>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• System Design</li>
                    <li>• Career Growth</li>
                    <li>• Interview Prep</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-200">
            <h3 className="font-bold text-lg mb-2">
              {isStudent ? 'Looking for guidance?' : 'Want to give back?'}
            </h3>
            <p className="text-indigo-100 text-sm mb-4">
              {isStudent
                ? 'Connect with alumni mentors who can help you achieve your career goals.'
                : 'Your experience is valuable. Host a webinar or review resumes today.'}
            </p>
            {onChat && (
              <button
                onClick={() => onChat(user)}
                className="w-full bg-white text-indigo-600 py-2 rounded-lg font-medium text-sm hover:bg-indigo-50 transition-colors"
              >
                {isStudent ? 'Find a Mentor' : 'Offer Mentorship'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            <form onSubmit={handleSaveProfile} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Edit Profile</h2>
                <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input required type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{isStudent ? 'Major' : 'Job Title'}</label>
                    <input required type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                    <input required type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                {/* Alumni Specific Edit Fields */}
                {!isStudent && (
                  <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">Role Details</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                      <input type="text" value={editCompany} onChange={e => setEditCompany(e.target.value)} className="w-full border rounded-lg p-2.5" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                        <input type="text" value={editDepartment} onChange={e => setEditDepartment(e.target.value)} className="w-full border rounded-lg p-2.5" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Yrs)</label>
                        <input type="text" value={editExperience} onChange={e => setEditExperience(e.target.value)} placeholder="e.g. 5+ Years" className="w-full border rounded-lg p-2.5" />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{isStudent ? 'Experience / Background' : 'Professional Summary / Job Description'}</label>
                  <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={4} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"></textarea>
                </div>

                {/* Project Management */}
                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-3">Projects</label>

                  <div className="space-y-3 mb-4">
                    {editProjects.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <div className="font-bold text-sm">{p.title}</div>
                          <div className="text-xs text-slate-500">{p.technologies.join(', ')}</div>
                        </div>
                        <button type="button" onClick={() => handleRemoveProject(p.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={newProjectTitle}
                      onChange={e => setNewProjectTitle(e.target.value)}
                      className="w-full text-sm border rounded p-2"
                    />
                    <input
                      type="text"
                      placeholder="Technologies (comma separated)"
                      value={newProjectTech}
                      onChange={e => setNewProjectTech(e.target.value)}
                      className="w-full text-sm border rounded p-2"
                    />
                    <textarea
                      placeholder="Short description..."
                      value={newProjectDesc}
                      onChange={e => setNewProjectDesc(e.target.value)}
                      className="w-full text-sm border rounded p-2"
                      rows={2}
                    />
                    <button
                      type="button"
                      onClick={handleAddProject}
                      disabled={!newProjectTitle || !newProjectDesc}
                      className="w-full bg-slate-800 text-white text-xs font-bold py-2 rounded hover:bg-slate-700 disabled:opacity-50"
                    >
                      Add Project
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
