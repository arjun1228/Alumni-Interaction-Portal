import React, { useState } from 'react';
import { MapPin, Briefcase, Calendar, Building2, X, Globe, Plus, Search, Trash2 } from 'lucide-react';
import { UserRole } from '../types';
import { createJob, applyToJob, deleteJob } from '../services/api';

export const Jobs = ({ jobs, setJobs, currentUser }) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState({});

  const handleApplyClick = async (jobId) => {
    try {
      await applyToJob(jobId);
      setAppliedJobs(prev => ({ ...prev, [jobId]: true }));
    } catch (err) {
      console.error("Failed to track application:", err);
    }
  };

  const handleDirectApply = async (jobId) => {
    setIsApplying(true);
    try {
      await applyToJob(jobId);
      setAppliedJobs(prev => ({ ...prev, [jobId]: true }));
    } catch (err) {
      console.error("Direct apply failed:", err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Delete this job posting permanently?")) {
      try {
        await deleteJob(jobId);
        setJobs(prev => prev.filter(j => (j.id || j._id) !== jobId));
      } catch (err) {
        console.error("Failed to delete job", err);
        alert(err.message || "Failed to delete job");
      }
    }
  };

  // Job Post Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState(currentUser.company || '');
  const [newLocation, setNewLocation] = useState('Remote');
  const [newType, setNewType] = useState('INTERNSHIP');
  const [newDesc, setNewDesc] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newSkills, setNewSkills] = useState('');

  const handlePostJob = async (e) => {
    e.preventDefault();
    const jobData = {
      title: newTitle,
      company: newCompany,
      location: newLocation,
      type: newType,
      description: newDesc,
      postedBy: currentUser,
      postedDate: 'Just now',
      skills: newSkills.split(',').map(s => s.trim()).filter(Boolean),
      link: newLink
    };

    try {
      const savedJob = await createJob(jobData);
      setJobs([savedJob, ...jobs]);
      setIsPosting(false);
      // Reset Form
      setNewTitle('');
      setNewDesc('');
      setNewLink('');
      setNewSkills('');
    } catch (error) {
      console.error("Failed to create job", error);
    }
  };

  const isAlumni = currentUser.role === UserRole.GRADUATE;

  const filteredJobs = jobs.filter(job => {
    // If the logged-in user is an Alumni, show only Full-Time jobs
    if (isAlumni && job.type !== 'FULL_TIME') {
      return false;
    }

    return (
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.skills && job.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Career Opportunities</h1>
          <p className="text-slate-500 mt-1">Curated roles from our alumni network</p>
        </div>
        {currentUser.role === UserRole.GRADUATE && (
          <button
            onClick={() => setIsPosting(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Post Opportunity
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, company, skills, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredJobs.length > 0 ? filteredJobs.map((job) => (
          <div
            key={job.id || job._id}
            onClick={() => setSelectedJob(job)}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                  <div className="flex items-center gap-2 text-slate-600 text-sm mt-1">
                    <span className="font-medium">{job.company}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border
                  ${job.type === 'INTERNSHIP' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                  {job.type.replace('_', ' ')}
                </span>
                {(currentUser.role?.toLowerCase() === 'admin') && (
                  <button
                    onClick={() => handleDeleteJob(job.id || job._id)}
                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Opportunity"
                    aria-label="Delete Opportunity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <p className="mt-4 text-slate-600 text-sm line-clamp-2">{job.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-2">
                {(job.skills || []).map(skill => (
                  <span key={skill} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <img src={job.postedBy?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.postedBy?.name || 'Graduate')}`} className="w-5 h-5 rounded-full" alt="poster" />
                <span>Posted by {job.postedBy?.name || 'Graduate'} • {job.postedDate || 'Just now'}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-10 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
            No jobs found matching your criteria.
          </div>
        )}
      </div>

      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{selectedJob.title}</h2>
                    <p className="text-slate-500 font-medium">{selectedJob.company}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedJob(null)} 
                  className="p-2 hover:bg-slate-100 rounded-full"
                  aria-label="Close Job Details"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 text-sm text-slate-600 border-b border-slate-100 pb-4">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedJob.location}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {selectedJob.type}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Posted {selectedJob.postedDate || 'Just now'}</span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Description</h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
                </div>

                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.skills.map(s => (
                        <span key={s} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setSelectedJob(null)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium">
                  Close
                </button>
                {(() => {
                  const jobId = selectedJob.id || selectedJob._id;
                  const isAlreadyApplied = appliedJobs[jobId];
                  if (isAlreadyApplied) {
                    return (
                      <span className="px-5 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl font-medium flex items-center gap-2">
                        ✓ Applied
                      </span>
                    );
                  }
                  if (selectedJob.link) {
                    const formattedLink = selectedJob.link.startsWith('http://') || selectedJob.link.startsWith('https://')
                      ? selectedJob.link
                      : `https://${selectedJob.link}`;
                    return (
                      <a
                        href={formattedLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleApplyClick(jobId)}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 flex items-center gap-2"
                      >
                        Apply Now <Globe className="w-4 h-4" />
                      </a>
                    );
                  }
                  return (
                    <button
                      disabled={isApplying}
                      onClick={() => handleDirectApply(jobId)}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isApplying ? 'Applying...' : 'Apply Now'}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE JOB MODAL */}
      {isPosting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg animate-in zoom-in duration-200">
            <form onSubmit={handlePostJob} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Post New Opportunity</h2>
                <button type="button" onClick={() => setIsPosting(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                  <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-50 text-slate-900 border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                    <input required type="text" value={newCompany} onChange={e => setNewCompany(e.target.value)} className="w-full bg-slate-50 text-slate-900 border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                    <input required type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)} className="w-full bg-slate-50 text-slate-900 border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full bg-slate-50 text-slate-900 border rounded-lg p-2.5">
                    <option value="INTERNSHIP">Internship</option>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills (comma separated)</label>
                  <input required type="text" placeholder="e.g. React, Node.js, TypeScript" value={newSkills} onChange={e => setNewSkills(e.target.value)} className="w-full bg-slate-50 text-slate-900 border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea required value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={4} className="w-full bg-slate-50 text-slate-900 border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Application Link</label>
                  <input required type="url" placeholder="https://..." value={newLink} onChange={e => setNewLink(e.target.value)} className="w-full bg-slate-50 text-slate-900 border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsPosting(false)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">Post Job</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
