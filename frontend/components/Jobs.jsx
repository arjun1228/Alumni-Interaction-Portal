import React, { useState } from 'react';
import { MapPin, Briefcase, Calendar, Building2, X, Globe, Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { UserRole } from '../types';
import { createJob, applyToJob, deleteJob, semanticSearchJobs } from '../services/api';
import { useToast } from './Toast';
import { SearchInput } from './SearchInput';

export const Jobs = ({ jobs, setJobs, currentUser }) => {
  const toast = useToast();
  const [selectedJob, setSelectedJob] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState({});
  const [aiSearchResults, setAiSearchResults] = useState(null);
  const [isAiSearching, setIsAiSearching] = useState(false);

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) {
      setAiSearchResults(null);
      return;
    }

    setIsAiSearching(true);
    try {
      const results = await semanticSearchJobs(searchTerm);
      setAiSearchResults(results);
    } catch (err) {
      console.error(err);
      toast(err.message || 'Search failed. Please try again.', 'error');
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleApplyClick = async (jobId) => {
    try {
      await applyToJob(jobId);
      setAppliedJobs(prev => ({ ...prev, [jobId]: true }));
      toast('🚀 Application submitted! Good luck!', 'success');
    } catch (err) {
      console.error("Failed to track application:", err);
      toast(err.message || 'Application failed — please try again.', 'error');
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
        toast('Job posting deleted.', 'info', 2500);
      } catch (err) {
        console.error("Failed to delete job", err);
        toast(err.message || "Failed to delete job", 'error');
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
      toast(`Job "${savedJob.title || newTitle}" posted successfully! 💼`, 'success');
    } catch (error) {
      console.error("Failed to create job", error);
      toast(error.message || 'Failed to create job posting.', 'error');
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

  const displayedJobs = (aiSearchResults !== null)
    ? aiSearchResults.filter(job => !isAlumni || job.type === 'FULL_TIME')
    : jobs.filter(job => !isAlumni || job.type === 'FULL_TIME');

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-805 dark:text-white">Career Opportunities</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Curated roles from our alumni network</p>
        </div>
        {currentUser.role === UserRole.GRADUATE && (
          <button
            onClick={() => setIsPosting(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" /> Post Opportunity
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <SearchInput
            placeholder="Search by title, company, skills, or keywords..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!e.target.value.trim()) {
                setAiSearchResults(null);
              }
            }}
            onClear={() => {
              setSearchTerm('');
              setAiSearchResults(null);
            }}
          />
          <button
            type="submit"
            disabled={isAiSearching}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shrink-0 disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-2"
          >
            {isAiSearching ? 'Searching...' : (
              <>
                <Search className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </form>

        {/* AI search indicator banner */}
        {aiSearchResults !== null && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-indigo-50 dark:bg-indigo-950/80 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                AI Mode
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Showing AI-ranked results for "{searchTerm}"
              </span>
            </div>
            <button
              onClick={() => {
                setAiSearchResults(null);
                setSearchTerm('');
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>

      {isAiSearching ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
          <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">Analyzing job listings and matching with your query...</p>
        </div>
      ) : (
        <div className="grid gap-4 py-2 px-1">
          {displayedJobs.length > 0 ? displayedJobs.map((job) => (
            <div
              key={job.id || job._id}
              onClick={() => setSelectedJob(job)}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 cursor-pointer group job-card hover:border-indigo-300 dark:hover:border-indigo-500"
            >
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{job.title}</h3>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm mt-1">
                    <span className="font-medium">{job.company}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {job.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border
                  ${job.type === 'INTERNSHIP' 
                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50' 
                    : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50'}`}>
                  {job.type.replace('_', ' ')}
                </span>
                {(currentUser.role?.toLowerCase() === 'admin') && (
                  <button
                    onClick={() => handleDeleteJob(job.id || job._id)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                    title="Delete Opportunity"
                    aria-label="Delete Opportunity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <p className="mt-4 text-slate-600 dark:text-slate-300 text-sm line-clamp-2">{job.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-2">
                {(job.skills || []).map(skill => (
                  <span key={skill} className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs px-2 py-1 rounded font-medium">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <img src={job.postedBy?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.postedBy?.name || 'Deleted User')}`} className="w-5 h-5 rounded-full border border-slate-100 dark:border-slate-800" alt="poster" />
                <span>Posted by {job.postedBy?.name || 'Deleted User'} • {job.postedDate || 'Just now'}</span>
              </div>
            </div>
          </div>
          )) : (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
              No jobs found matching your criteria.
            </div>
          )}
        </div>
      )}

      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedJob.title}</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{selectedJob.company}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedJob(null)} 
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer text-slate-500 dark:text-slate-400"
                  aria-label="Close Job Details"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 text-sm text-slate-650 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-400" /> {selectedJob.location}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-4 h-4 text-slate-400" /> {selectedJob.type}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-slate-400" /> Posted {selectedJob.postedDate || 'Just now'}</span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-2">Description</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
                </div>

                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.skills.map(s => (
                        <span key={s} className="bg-slate-100 dark:bg-slate-950 text-slate-705 dark:text-slate-300 px-3 py-1 rounded-full text-sm font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button onClick={() => setSelectedJob(null)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium cursor-pointer">
                  Close
                </button>
                {(() => {
                  const jobId = selectedJob.id || selectedJob._id;
                  const isAlreadyApplied = appliedJobs[jobId];
                  if (isAlreadyApplied) {
                    return (
                      <span className="px-5 py-2.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50 rounded-xl font-medium flex items-center gap-2">
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
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        Apply Now <Globe className="w-4 h-4" />
                      </a>
                    );
                  }
                  return (
                    <button
                      disabled={isApplying}
                      onClick={() => handleDirectApply(jobId)}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-850 rounded-2xl w-full max-w-lg animate-in zoom-in duration-200">
            <form onSubmit={handlePostJob} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Post New Opportunity</h2>
                <button type="button" onClick={() => setIsPosting(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Job Title</label>
                  <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full form-input-custom rounded-lg p-2.5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Company</label>
                    <input required type="text" value={newCompany} onChange={e => setNewCompany(e.target.value)} className="w-full form-input-custom rounded-lg p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Location</label>
                    <input required type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)} className="w-full form-input-custom rounded-lg p-2.5" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Type</label>
                  <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full form-input-custom rounded-lg p-2.5">
                    <option value="INTERNSHIP">Internship</option>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Required Skills (comma separated)</label>
                  <input required type="text" placeholder="e.g. React, Node.js, TypeScript" value={newSkills} onChange={e => setNewSkills(e.target.value)} className="w-full form-input-custom rounded-lg p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Description</label>
                  <textarea required value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={4} className="w-full form-input-custom rounded-lg p-2.5"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-707 dark:text-slate-300 mb-1">Application Link</label>
                  <input required type="url" placeholder="https://..." value={newLink} onChange={e => setNewLink(e.target.value)} className="w-full form-input-custom rounded-lg p-2.5" />
                </div>              
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsPosting(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-805 dark:hover:text-slate-200 font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 cursor-pointer shadow-sm">Post Job</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
