import React, { useState } from 'react';
import { UserRole } from '../types';
import { MapPin, Mail, BookOpen, Calendar, Briefcase, Award, Download, Building2, Code2, GraduationCap, Edit2, X, MessageSquare, ExternalLink, Plus, Trash2, Loader2 } from 'lucide-react';
import { updateUser, uploadImage } from '../services/api';

export const Profile = ({ user, onUpdateUser, onNavigate, onChat, readOnly = false, isSidebar = false }) => {
  const isStudent = user.role === UserRole.UNDERGRADUATE || user.role === 'student' || user.role === UserRole.STUDENT;
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
  const [editProjects, setEditProjects] = useState(user.projects || []);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectTech, setNewProjectTech] = useState('');

  // Student specific editing state
  const [editResumeName, setEditResumeName] = useState(user.resumeName || '');
  const [editResumeLink, setEditResumeLink] = useState(user.resumeLink || '');
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [editInterests, setEditInterests] = useState(user.interests || []);
  const [newInterest, setNewInterest] = useState('');

  // Alumni specific skills state
  const [editSkills, setEditSkills] = useState(user.skills || []);
  const [newSkill, setNewSkill] = useState('');

  // Student academic fields
  const [editCourse, setEditCourse] = useState(user.course || '');
  const [editYearOfStudy, setEditYearOfStudy] = useState(user.yearOfStudy || 1);

  // Alumni mentoring fields
  const [editWillingToMentor, setEditWillingToMentor] = useState(user.willingToMentor || ['System Design', 'Career Growth', 'Interview Prep']);
  const [newMentorTopic, setNewMentorTopic] = useState('');

  const handleResumeFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingResume(true);
    try {
      const url = await uploadImage(file);
      setEditResumeLink(url);
      setEditResumeName(file.name);
    } catch (err) {
      console.error('Failed to upload resume:', err);
      alert('Failed to upload resume. Please try again.');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;
    if (!editInterests.includes(newInterest.trim())) {
      setEditInterests([...editInterests, newInterest.trim()]);
    }
    setNewInterest('');
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (!editSkills.includes(newSkill.trim())) {
      setEditSkills([...editSkills, newSkill.trim()]);
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skill) => {
    setEditSkills(editSkills.filter(s => s !== skill));
  };

  const handleAddMentorTopic = () => {
    if (!newMentorTopic.trim()) return;
    if (!editWillingToMentor.includes(newMentorTopic.trim())) {
      setEditWillingToMentor([...editWillingToMentor, newMentorTopic.trim()]);
    }
    setNewMentorTopic('');
  };

  const handleRemoveMentorTopic = (topic) => {
    setEditWillingToMentor(editWillingToMentor.filter(t => t !== topic));
  };

  const handleAddProject = () => {
    if (!newProjectTitle || !newProjectDesc) return;
    const newProject = {
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

  const handleRemoveProject = (id) => {
    setEditProjects(editProjects.filter(p => p.id !== id));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const updatedData = {
      ...user,
      name: editName,
      title: isStudent ? 'Student' : editTitle,
      bio: editBio,
      location: editLocation,
      company: editCompany,
      department: editDepartment,
      yearsOfExperience: editExperience,
      projects: editProjects,
      resumeName: editResumeName,
      resumeLink: editResumeLink,
      interests: editInterests,
      skills: editSkills,
      willingToMentor: editWillingToMentor,
      course: editCourse,
      yearOfStudy: editYearOfStudy
    };

    try {
      const savedUser = await updateUser(user.id || user._id, updatedData);
      if (onUpdateUser) {
        onUpdateUser(savedUser);
      }
    } catch (error) {
      console.error("Failed to update profile", error);
      if (onUpdateUser) {
        onUpdateUser(updatedData);
      }
    }
    setIsEditing(false);
  };

  return (
    <div className={isSidebar ? "space-y-4" : "max-w-4xl mx-auto space-y-6 text-slate-800 dark:text-slate-100"}>
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className={`${isSidebar ? 'h-20' : 'h-32'} ${isStudent ? 'bg-linear-to-r from-indigo-500 to-purple-600' : 'bg-linear-to-r from-emerald-600 to-teal-700'}`}></div>
        <div className={isSidebar ? "px-4 pb-4" : "px-8 pb-8"}>
          <div className={`relative flex justify-between items-end ${isSidebar ? '-mt-8 mb-4' : '-mt-12 mb-6'}`}>
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
              alt={user.name}
              width={isSidebar ? 64 : 96}
              height={isSidebar ? 64 : 96}
              className={`${isSidebar ? 'w-16 h-16 rounded-xl border-2' : 'w-24 h-24 rounded-2xl border-4'} border-white dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 object-cover`}
            />
            <div className="flex gap-3">
              {onChat && (
                <button
                  onClick={() => onChat(user)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer border border-transparent dark:border-slate-800"
                >
                  <MessageSquare className="w-4 h-4 text-slate-450" />
                  Message
                </button>
              )}
              {!readOnly && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Edit2 className="w-3 h-3" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          <div>
            <h1 className={isSidebar ? "text-lg font-bold text-slate-900 dark:text-white" : "text-2xl font-bold text-slate-900 dark:text-white"}>{user.name}</h1>
            {!isStudent && (user.jobTitle || user.currentCompany) ? (
              <p className="text-slate-600 dark:text-slate-350 font-medium flex items-center gap-2 mt-1 text-sm">
                <Briefcase className="w-4 h-4 text-slate-400" />
                {user.jobTitle && user.currentCompany
                  ? `${user.jobTitle} at ${user.currentCompany}`
                  : (user.jobTitle || user.currentCompany)}
              </p>
            ) : null}
            {user.createdAt && (
              <p className="text-slate-500 dark:text-slate-450 text-sm flex items-center gap-2 mt-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            )}
            {user.location && (
              <p className="text-slate-500 dark:text-slate-455 text-sm flex items-center gap-2 mt-1">
                <MapPin className="w-3 h-3 text-slate-400" /> {user.location}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={isSidebar ? "flex flex-col gap-4" : "grid md:grid-cols-3 gap-6"}>
        {/* Left Column - Details */}
        <div className={isSidebar ? "space-y-4" : "md:col-span-2 space-y-6"}>

          {/* About / Bio / Experience */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              {isStudent ? 'Experience & Background' : 'Professional Summary'}
            </h2>
            <div className="prose prose-slate dark:prose-invert text-sm max-w-none">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {isStudent ? (user.experience || "No experience listed yet.") : (user.bio || "No professional summary added.")}
              </p>
            </div>

            {/* Resume Link */}
            {user.resumeLink && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-850 animate-in fade-in">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-xs">PDF</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-805 dark:text-white">{user.resumeName || `${user.name.split(' ')[0]}'s Resume.pdf`}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Updated recently</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={user.resumeLink.startsWith('http') ? user.resumeLink : `http://127.0.0.1:5000${user.resumeLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-xs"
                      title="View Resume"
                    >
                      <ExternalLink className="w-4 h-4" /> View
                    </a>
                    <a 
                      href={user.resumeLink.startsWith('http') ? user.resumeLink : `http://127.0.0.1:5000${user.resumeLink}`}
                      download={user.resumeName || `${user.name.split(' ')[0]}_Resume.pdf`}
                      className="p-1.5 bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-xs"
                      title="Download Resume"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Project Showcase */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Code2 className="w-5 h-5 text-indigo-500" />
              {isStudent ? 'Project Showcase' : 'Key Projects'}
            </h2>

            {user.projects && user.projects.length > 0 ? (
              <div className="space-y-4">
                {user.projects.map((project) => (
                  <div key={project.id || project._id} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/40 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 dark:text-white">{project.title}</h3>
                      {project.link && (
                        <a href={project.link} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-750">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-350 mb-3">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {(project.technologies || []).map((tech, i) => (
                        <span key={i} className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-2 py-0.5 rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-450 text-sm">No projects added yet.</p>
              </div>
            )}
          </div>

          {/* Student Specific: Learning Interests */}
          {isStudent && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                <Code2 className="w-5 h-5 text-indigo-500" />
                What I want to learn
              </h2>
              <div className="flex flex-wrap gap-2">
                {user.interests?.map((interest, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium border border-indigo-100 dark:border-indigo-900/50">
                    {interest}
                  </span>
                )) || <span className="text-slate-500 dark:text-slate-455 text-sm">No learning interests listed.</span>}
              </div>
            </div>
          )}

          {/* Alumni Specific: Current Role Details */}
          {!isStudent && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                Current Role Details
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Job Description</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-350 mt-1 leading-relaxed">
                    {user.bio || "No description provided."}
                  </p>
                </div>
                <div className="flex gap-4 pt-2">
                  <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg">
                    <span className="block text-xs text-slate-500 dark:text-slate-450">Company</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{user.company || 'N/A'}</span>
                  </div>
                  <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg">
                    <span className="block text-xs text-slate-500 dark:text-slate-450">Department</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{user.department || 'General'}</span>
                  </div>
                  <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg">
                    <span className="block text-xs text-slate-500 dark:text-slate-450">Experience</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{user.yearsOfExperience || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Stats/Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
              {isStudent ? 'Academic Details' : 'Skills & Expertise'}
            </h2>

            {isStudent ? (
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-slate-450 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Department</p>
                    <p className="text-sm text-slate-600 dark:text-slate-350">{user.department || 'Not specified'}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-slate-455 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Course</p>
                    <p className="text-sm text-slate-600 dark:text-slate-355">{user.course || 'Not specified'}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-455 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Year of Study</p>
                    <p className="text-sm text-slate-600 dark:text-slate-355">{user.yearOfStudy ? `Year ${user.yearOfStudy}` : 'Not specified'}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-slate-455 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Skills</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.skills?.map(s => (
                        <span key={s} className="text-xs bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 font-medium">{s}</span>
                      )) || <span className="text-xs text-slate-500">None listed</span>}
                    </div>
                  </div>
                </li>
              </ul>
            ) : (
              <div className="space-y-3">
                {user.skills && user.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">No skills listed yet.</p>
                )}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-850">
                  <p className="text-xs font-semibold text-slate-550 dark:text-slate-450 uppercase tracking-wider mb-2">Willing to mentor on:</p>
                  <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1.5">
                    {(user.willingToMentor && user.willingToMentor.length > 0 ? user.willingToMentor : ['System Design', 'Career Growth', 'Interview Prep']).map((topic) => (
                      <li key={topic} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-indigo-600 dark:bg-indigo-700/80 rounded-xl p-6 text-white shadow-lg shadow-indigo-200/50 dark:shadow-none">
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
                className="w-full bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 py-2 rounded-lg font-medium text-sm hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
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
          <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-850 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            <form onSubmit={handleSaveProfile} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Profile</h2>
                <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Full Name</label>
                  <input required type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full form-input-custom rounded-lg p-2.5" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {!isStudent ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Job Title</label>
                      <input required type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full form-input-custom rounded-lg p-2.5" />
                    </div>
                  ) : null}
                  <div className={isStudent ? "col-span-2" : ""}>
                    <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Location</label>
                    <input required type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} className="w-full form-input-custom rounded-lg p-2.5" />
                  </div>
                </div>

                {/* Alumni Specific Edit Fields */}
                {!isStudent && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl space-y-4 border border-emerald-100 dark:border-emerald-900/50 animate-in fade-in">
                    <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-800 pb-2">Role Details</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Company</label>
                      <input type="text" value={editCompany} onChange={e => setEditCompany(e.target.value)} className="w-full form-input-custom rounded-lg p-2.5" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Experience (Yrs)</label>
                      <input type="text" value={editExperience} onChange={e => setEditExperience(e.target.value)} placeholder="e.g. 5+ Years" className="w-full form-input-custom rounded-lg p-2.5" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Professional Bio</label>
                      <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={4} className="w-full form-input-custom rounded-lg p-2.5" placeholder="Write a short professional bio..."></textarea>
                    </div>

                    {/* Resume Upload for Alumni */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">
                        Resume File (.pdf)
                        {isUploadingResume && <Loader2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin" />}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept=".pdf"
                          id="resume-file-input-alumni"
                          className="hidden"
                          onChange={handleResumeFileChange}
                        />
                        <label
                          htmlFor="resume-file-input-alumni"
                          className="cursor-pointer px-4 py-2 bg-white dark:bg-slate-900 border rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-colors flex items-center gap-2"
                        >
                          <Download className="w-4 h-4 text-slate-400 rotate-180" />
                          {editResumeName ? 'Change Resume' : 'Upload Resume'}
                        </label>
                        {editResumeName && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]" title={editResumeName}>
                            {editResumeName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Skills & Expertise Tag Manager */}
                    <div>
                      <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Skills &amp; Expertise</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Add a skill (e.g. React, Machine Learning)"
                          value={newSkill}
                          onChange={e => setNewSkill(e.target.value)}
                          className="flex-1 text-sm form-input-custom rounded-lg p-2"
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {editSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-705 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs font-semibold animate-in zoom-in duration-150"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-200 focus:outline-none cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                        {editSkills.length === 0 && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">No skills added yet.</span>
                        )}
                      </div>
                    </div>

                    {/* Willing to Mentor On Tag Manager */}
                    <div>
                      <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Willing to Mentor On</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Add a topic (e.g. System Design, Career Growth)"
                          value={newMentorTopic}
                          onChange={e => setNewMentorTopic(e.target.value)}
                          className="flex-1 text-sm form-input-custom rounded-lg p-2"
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleAddMentorTopic(); }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddMentorTopic}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {editWillingToMentor.map((topic, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-705 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs font-semibold animate-in zoom-in duration-150"
                          >
                            {topic}
                            <button
                              type="button"
                              onClick={() => handleRemoveMentorTopic(topic)}
                              className="text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-200 focus:outline-none cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                        {editWillingToMentor.length === 0 && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">No topics added yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Student Specific Edit Fields */}
                {isStudent && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-4 border border-slate-100 dark:border-slate-850 animate-in fade-in">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-205 dark:border-slate-850 pb-2">Student Profile Details</h3>

                    {/* Academic Details Edit Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Department</label>
                        <input
                          type="text"
                          value={editDepartment}
                          onChange={e => setEditDepartment(e.target.value)}
                          className="w-full form-input-custom rounded-lg p-2.5 text-sm"
                          placeholder="e.g. Computer Science"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Course</label>
                        <input
                          type="text"
                          value={editCourse}
                          onChange={e => setEditCourse(e.target.value)}
                          className="w-full form-input-custom rounded-lg p-2.5 text-sm"
                          placeholder="e.g. B.Tech Computer Science"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Year of Study</label>
                        <select
                          value={editYearOfStudy}
                          onChange={e => setEditYearOfStudy(Number(e.target.value))}
                          className="w-full form-input-custom rounded-lg p-2.5 text-sm"
                        >
                          <option value={1}>Year 1</option>
                          <option value={2}>Year 2</option>
                          <option value={3}>Year 3</option>
                          <option value={4}>Year 4</option>
                        </select>
                      </div>
                    </div>

                    {/* Student Skills Tag Manager */}
                    <div>
                      <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Academic Skills</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Add a skill (e.g. Java, Python)"
                          value={newSkill}
                          onChange={e => setNewSkill(e.target.value)}
                          className="flex-1 text-sm form-input-custom rounded-lg p-2"
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {editSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 rounded-lg text-xs font-semibold animate-in zoom-in duration-150"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="text-indigo-400 hover:text-indigo-600 focus:outline-none cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                        {editSkills.length === 0 && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">No skills added yet.</span>
                        )}
                      </div>
                    </div>

                    {/* Resume Upload Selection */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">
                        Resume File (.pdf)
                        {isUploadingResume && <Loader2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" />}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept=".pdf"
                          id="resume-file-input-student"
                          className="hidden"
                          onChange={handleResumeFileChange}
                        />
                        <label
                          htmlFor="resume-file-input-student"
                          className="cursor-pointer px-4 py-2 bg-white dark:bg-slate-900 border rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-colors flex items-center gap-2"
                        >
                          <Download className="w-4 h-4 text-slate-400 rotate-180" />
                          {editResumeName ? 'Change Resume' : 'Upload Resume'}
                        </label>
                        {editResumeName && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]" title={editResumeName}>
                            {editResumeName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* What I want to learn Tags Manager */}
                    <div>
                      <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">What I want to learn</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Add an interest (e.g. Next.js)"
                          value={newInterest}
                          onChange={e => setNewInterest(e.target.value)}
                          className="flex-1 text-sm form-input-custom rounded-lg p-2"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddInterest();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddInterest}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {editInterests.map((interest, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-705 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 rounded-lg text-xs font-semibold animate-in zoom-in duration-150"
                          >
                            {interest}
                            <button
                              type="button"
                              onClick={() => setEditInterests(editInterests.filter(i => i !== interest))}
                              className="text-indigo-400 hover:text-indigo-600 focus:outline-none cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                        {editInterests.length === 0 && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">No learning interests listed.</span>
                        )}
                      </div>
                    </div>

                    {/* Experience / Background for Student */}
                    <div>
                      <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Experience / Background</label>
                      <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={4} className="w-full form-input-custom rounded-lg p-2.5" placeholder="Tell us about your background..."></textarea>
                    </div>
                  </div>
                )}

                {/* Project Management */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-3">Projects</label>

                  <div className="space-y-3 mb-4">
                    {editProjects.map(p => (
                      <div key={p.id || p._id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{p.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{(p.technologies || []).join(', ')}</div>
                        </div>
                        <button type="button" onClick={() => handleRemoveProject(p.id || p._id)} className="text-red-400 hover:text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={newProjectTitle}
                      onChange={e => setNewProjectTitle(e.target.value)}
                      className="w-full text-sm form-input-custom rounded p-2"
                    />
                    <input
                      type="text"
                      placeholder="Technologies (comma separated)"
                      value={newProjectTech}
                      onChange={e => setNewProjectTech(e.target.value)}
                      className="w-full text-sm form-input-custom rounded p-2"
                    />
                    <textarea
                      placeholder="Short description..."
                      value={newProjectDesc}
                      onChange={e => setNewProjectDesc(e.target.value)}
                      className="w-full text-sm form-input-custom rounded p-2"
                      rows={2}
                    />
                    <button
                      type="button"
                      onClick={handleAddProject}
                      disabled={!newProjectTitle || !newProjectDesc}
                      className="w-full bg-slate-800 dark:bg-slate-900 text-white text-xs font-bold py-2 rounded hover:bg-slate-700 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                    >
                      Add Project
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-805 dark:hover:text-slate-200 font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium cursor-pointer shadow-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
