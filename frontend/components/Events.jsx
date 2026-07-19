import React, { useState } from 'react';
import { Calendar, Users, Video, MapPin, Clock, Plus, X, Upload, CheckCircle, Trash2, Sparkles, Loader2, Edit } from 'lucide-react';
import { UserRole } from '../types';
import { createEvent, rsvpEvent, uploadImage, deleteEvent, cancelRsvpEvent, enhanceEventDescription, updateEvent } from '../services/api';
import { useToast } from './Toast';

export const Events = ({ events, setEvents, currentUser }) => {
   const toast = useToast();
   const [selectedEvent, setSelectedEvent] = useState(null);
   const [isCreating, setIsCreating] = useState(false);
   const [editingEvent, setEditingEvent] = useState(null);

   // New Event Form State
   const [title, setTitle] = useState('');
   const [date, setDate] = useState('');
   const [time, setTime] = useState('');
   const [type, setType] = useState('WEBINAR');
   const [description, setDescription] = useState('');
   
   // RSVP State
   const [isRegistering, setIsRegistering] = useState(false);

   // Image Upload State
   const [coverUrl, setCoverUrl] = useState('');
   const [isUploading, setIsUploading] = useState(false);

   // AI Enhance description state
   const [isEnhancing, setIsEnhancing] = useState(false);
   const [enhancedPreview, setEnhancedPreview] = useState(null);
   const [enhanceError, setEnhanceError] = useState('');
   const [dateError, setDateError] = useState('');

    const handleDeleteEvent = async (eventId) => {
       if (window.confirm("Delete this event posting permanently?")) {
          try {
             await deleteEvent(eventId);
             setEvents(events.filter(ev => (ev.id || ev._id) !== eventId));
             toast('Event deleted.', 'info', 2500);
          } catch (err) {
             console.error("Failed to delete event", err);
             toast(err.message || "Failed to delete event", 'error');
          }
       }
    };

   const handleFileChange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try {
         const url = await uploadImage(file);
         setCoverUrl(url);
      } catch (err) {
         console.error('Failed to upload image:', err);
      } finally {
         setIsUploading(false);
      }
   };

   const resetForm = () => {
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setCoverUrl('');
      setEnhancedPreview(null);
      setEnhanceError('');
      setDateError('');
      setEditingEvent(null);
   };

   const handleEditClick = (event) => {
      setEditingEvent(event);
      setTitle(event.title || '');
      
      let formattedDate = '';
      if (event.dateTime) {
         try {
            formattedDate = new Date(event.dateTime).toISOString().substring(0, 10);
         } catch (e) {
            formattedDate = event.date || '';
         }
      } else {
         formattedDate = event.date || '';
      }
      setDate(formattedDate);

      let formattedTime = event.time || '';
      if (!formattedTime && event.dateTime) {
         try {
            formattedTime = new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
         } catch (e) {}
      }
      setTime(formattedTime);
      
      setType(event.type || 'WEBINAR');
      setDescription(event.description || '');
      setCoverUrl(event.image || event.coverImage || '');
      setIsCreating(true);
   };

   const handleEnhanceDescription = async () => {
      if (!description.trim() || isEnhancing) return;
      setIsEnhancing(true);
      setEnhanceError('');
      setEnhancedPreview(null);
      try {
         const result = await enhanceEventDescription(description);
         setEnhancedPreview(result);
      } catch (err) {
         console.error('Enhance description failed:', err);
         setEnhanceError(err.message || "Couldn't enhance right now — try again");
      } finally {
         setIsEnhancing(false);
      }
   };

   const handleUseEnhancedDescription = () => {
      if (enhancedPreview) {
         setDescription(enhancedPreview);
         setEnhancedPreview(null);
         setEnhanceError('');
         toast('✨ Enhanced description applied!', 'info', 2000);
      }
   };

   const handleDismissEnhancedDescription = () => {
      setEnhancedPreview(null);
      setEnhanceError('');
   };

   const handleCreateEvent = async (e) => {
      e.preventDefault();
      
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today && !editingEvent) {
         setDateError('Event date cannot be in the past');
         toast('Event date cannot be in the past.', 'error');
         return;
      }

      const eventData = {
         title,
         date,
         time,
         type,
         description,
         organizer: currentUser,
         attendees: editingEvent ? (editingEvent.attendees || 0) : 0,
         image: coverUrl || `https://picsum.photos/seed/${Date.now()}/600/300`
      };

      try {
         if (editingEvent) {
            const savedEvent = await updateEvent(editingEvent.id || editingEvent._id, eventData);
            setEvents(events.map(ev => (ev.id === editingEvent.id || ev._id === editingEvent._id) ? savedEvent : ev));
            setIsCreating(false);
            resetForm();
            toast(`Event "${savedEvent.title || title}" updated! 🎉`, 'success');
         } else {
            const savedEvent = await createEvent(eventData);
            setEvents([savedEvent, ...events]);
            setIsCreating(false);
            resetForm();
            toast(`Event "${savedEvent.title || title}" created! 🎉`, 'success');
         }
      } catch (error) {
         console.error("Failed to save event", error);
         toast(error.message || 'Failed to save event.', 'error');
      }
   };

   const handleRegisterForEvent = async (eventId) => {
      setIsRegistering(true);
      try {
         await rsvpEvent(eventId, currentUser.id || currentUser._id);
         toast('🎉 You\'re registered for this event!', 'success');
         
         const currentUserId = currentUser.id || currentUser._id;

         // Update events list locally
         setEvents(events.map(ev => {
            if (ev.id === eventId || ev._id === eventId) {
               const updatedList = [...(ev.attendeesList || [])];
               if (!updatedList.includes(currentUserId)) {
                  updatedList.push(currentUserId);
               }
               return { 
                  ...ev, 
                  attendees: (ev.attendees || 0) + 1,
                  attendeesList: updatedList
               };
            }
            return ev;
         }));

         // Update modal details
         setSelectedEvent(prev => {
            if (prev && (prev.id === eventId || prev._id === eventId)) {
               const updatedList = [...(prev.attendeesList || [])];
               if (!updatedList.includes(currentUserId)) {
                  updatedList.push(currentUserId);
               }
               return { 
                  ...prev, 
                  attendees: (prev.attendees || 0) + 1,
                  attendeesList: updatedList
               };
            }
            return prev;
         });

         setTimeout(() => {
            setSelectedEvent(null);
         }, 1500);
      } catch (error) {
         console.error('Failed to register for event:', error);
         toast(error.message || 'Registration failed — please try again.', 'error');
      } finally {
         setIsRegistering(false);
      }
   };

   const handleCancelRsvp = async (eventId) => {
      setIsRegistering(true);
      try {
         await cancelRsvpEvent(eventId);
         toast('RSVP cancelled successfully!', 'info');
         
         const currentUserId = currentUser.id || currentUser._id;
         // Update events list locally
         setEvents(events.map(ev => {
            if (ev.id === eventId || ev._id === eventId) {
               const updatedList = (ev.attendeesList || []).filter(id => id.toString() !== currentUserId.toString());
               return { 
                  ...ev, 
                  attendees: Math.max(0, (ev.attendees || 0) - 1),
                  attendeesList: updatedList
               };
            }
            return ev;
         }));

         // Update modal details
         setSelectedEvent(prev => {
            if (prev && (prev.id === eventId || prev._id === eventId)) {
               const updatedList = (prev.attendeesList || []).filter(id => id.toString() !== currentUserId.toString());
               return { 
                  ...prev, 
                  attendees: Math.max(0, (prev.attendees || 0) - 1),
                  attendeesList: updatedList
               };
            }
            return prev;
         });

         setTimeout(() => {
            setSelectedEvent(null);
         }, 1500);
      } catch (error) {
         console.error('Failed to cancel RSVP:', error);
      } finally {
         setIsRegistering(false);
      }
   };

   return (
      <div className="space-y-6 text-slate-805 dark:text-slate-100">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-bold text-slate-805 dark:text-white">Upcoming Events</h1>
               <p className="text-slate-500 dark:text-slate-400 mt-1">Workshops, webinars, and hackathons</p>
            </div>
            {(currentUser.role === UserRole.GRADUATE || currentUser.role?.toLowerCase() === 'admin') && (
               <button
                  onClick={() => setIsCreating(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
               >
                  <Plus className="w-4 h-4" /> Create Event
               </button>
            )}
         </div>

         {events.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
               <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-655 mx-auto mb-3" />
               <p className="text-slate-500 dark:text-slate-450 text-sm">No upcoming events scheduled.</p>
            </div>
         ) : (
            <div className="grid md:grid-cols-2 gap-6">
               {events.map((event) => (
                  <div
                     key={event.id || event._id}
                     onClick={() => setSelectedEvent(event)}
                     className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-200 group cursor-pointer"
                  >
                     <div className="h-40 overflow-hidden relative">
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-700 dark:text-indigo-400">
                           {event.type}
                        </div>
                        {(currentUser.role?.toLowerCase() === 'admin' || (event.organizer && (event.organizer._id || event.organizer.id || event.organizer) === (currentUser._id || currentUser.id))) && (
                           <div className="absolute top-3 right-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(event);
                                 }}
                                 className="bg-white/95 dark:bg-slate-900 hover:bg-white text-indigo-600 dark:text-indigo-400 p-1.5 rounded-full shadow-md transition-colors cursor-pointer"
                                 title="Edit Event"
                                 aria-label="Edit Event"
                              >
                                 <Edit className="w-4 h-4" />
                              </button>
                              {(currentUser.role?.toLowerCase() === 'admin') && (
                                 <button
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       handleDeleteEvent(event.id || event._id);
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                                    title="Delete Event"
                                    aria-label="Delete Event"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              )}
                           </div>
                        )}

                     </div>
                     <div className="p-5">
                        <div className="flex gap-3 text-sm text-slate-500 dark:text-slate-450 mb-2">
                           <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-indigo-500" /> {event.date}</span>
                           <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-indigo-500" /> {event.time}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">{event.title}</h3>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                           <div className="flex items-center gap-2">
                              <img src={event.organizer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.organizer?.name || 'Deleted User')}`} className="w-6 h-6 rounded-full border border-slate-100 dark:border-slate-850" alt="" />
                              <span className="text-xs text-slate-600 dark:text-slate-400">By {event.organizer?.name || 'Deleted User'}</span>
                           </div>
                           <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-350 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-full">
                              <Users className="w-3 h-3 text-slate-455" /> {event.attendees} going
                           </div>
                        </div>

                        <button className="w-full mt-4 bg-white dark:bg-slate-900 border border-indigo-650 text-indigo-650 dark:border-indigo-500 dark:text-indigo-400 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer">
                           {(currentUser.role === UserRole.GRADUATE || currentUser.role?.toLowerCase() === 'admin') ? 'View Details' : 'Register Now'}
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {/* EVENT DETAILS MODAL */}
         {selectedEvent && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-850 rounded-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
                  <div className="h-48 relative">
                     <img src={selectedEvent.image} className="w-full h-full object-cover" alt="Event cover" />
                     <button
                        onClick={() => setSelectedEvent(null)}
                        className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm cursor-pointer"
                        aria-label="Close Event Details"
                     >
                        <X className="w-5 h-5" />
                     </button>
                  </div>
                  <div className="p-8">
                     <div className="flex gap-2 mb-4">
                        <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold">{selectedEvent.type}</span>
                     </div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{selectedEvent.title}</h2>
                     <div className="flex flex-wrap gap-6 text-slate-650 dark:text-slate-350 mb-6 text-sm">
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> {selectedEvent.date}</span>
                        <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> {selectedEvent.time}</span>
                        <span className="flex items-center gap-2"><Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> {selectedEvent.attendees} Registered</span>
                     </div>

                     <div className="prose prose-slate dark:prose-invert mb-8 text-slate-700 dark:text-slate-300">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">About this event</h3>
                        <p>{selectedEvent.description || "No description provided."}</p>
                     </div>

                     <div className="flex justify-end gap-3 border-t border-slate-105 dark:border-slate-800 pt-6">
                        <button onClick={() => setSelectedEvent(null)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium cursor-pointer">Close</button>
                        {(() => {
                           const currentUserId = currentUser.id || currentUser._id;
                           const isOrganizer = selectedEvent.organizer && (selectedEvent.organizer.id || selectedEvent.organizer._id || selectedEvent.organizer) === currentUserId;
                           const isAdmin = currentUser.role?.toLowerCase() === 'admin';
                           
                           if (isOrganizer || isAdmin) {
                              return (
                                 <button
                                    onClick={() => {
                                       setSelectedEvent(null);
                                       handleEditClick(selectedEvent);
                                    }}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors animate-in fade-in cursor-pointer"
                                 >
                                    Edit Event
                                 </button>
                              );
                           }
                           return null;
                        })()}
                        {(() => {
                           if (currentUser.role === UserRole.GRADUATE || currentUser.role?.toLowerCase() === 'admin') {

                              return (
                                 <button onClick={() => setSelectedEvent(null)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 cursor-pointer">
                                    Close Info
                                 </button>
                              );
                           }
                           const currentUserId = currentUser.id || currentUser._id;
                           const isAlreadyRegistered = selectedEvent.attendeesList?.some(id => id.toString() === currentUserId.toString());
                           if (isAlreadyRegistered) {
                              return (
                                 <button 
                                    onClick={() => handleCancelRsvp(selectedEvent.id || selectedEvent._id)}
                                    disabled={isRegistering}
                                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                                 >
                                    {isRegistering ? 'Cancelling...' : 'Cancel Registration'}
                                 </button>

                              );
                           }
                           return (
                              <button 
                                 onClick={() => handleRegisterForEvent(selectedEvent.id || selectedEvent._id)}
                                 disabled={isRegistering}
                                 className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                 {isRegistering ? 'Registering...' : 'Confirm Registration'}
                              </button>
                           );
                        })()}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* CREATE EVENT MODAL */}
         {isCreating && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
                  <form onSubmit={handleCreateEvent} className="p-6">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>

                        <button type="button" onClick={() => { setIsCreating(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                           <X className="w-6 h-6" />
                        </button>
                      </div>
                     <div className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Event Title</label>
                           <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full form-input-custom rounded-lg p-2.5" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                              <input 
                                 required 
                                 type="date" 
                                 value={date} 
                                 onChange={e => {
                                    setDate(e.target.value);
                                    if (e.target.value) {
                                       const selected = new Date(e.target.value);
                                       const today = new Date();
                                       today.setHours(0,0,0,0);
                                       if (selected < today) {
                                          setDateError('Event date cannot be in the past');
                                       } else {
                                          setDateError('');
                                       }
                                    } else {
                                       setDateError('');
                                    }
                                 }} 
                                 className={`w-full form-input-custom rounded-lg p-2.5 ${dateError ? 'border-red-500!' : ''}`} 
                              />
                              {dateError && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{dateError}</p>}
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
                              <input required type="text" value={time} onChange={e => setTime(e.target.value)} placeholder="6:00 PM EST" className="w-full form-input-custom rounded-lg p-2.5" />
                           </div>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                           <select value={type} onChange={e => setType(e.target.value)} className="w-full form-input-custom rounded-lg p-2.5">
                              <option value="WEBINAR">Webinar</option>
                              <option value="HACKATHON">Hackathon</option>
                              <option value="WORKSHOP">Workshop</option>
                              <option value="MEETUP">Meetup</option>
                           </select>
                        </div>
                        <div>
                           <label className="flex text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 items-center gap-2">
                              Cover Image
                              {isUploading && <span className="text-xs text-indigo-600 dark:text-indigo-400 animate-pulse">Uploading to Cloudinary...</span>}
                           </label>
                           <div className="flex items-center gap-3">
                              <label className="w-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg p-3 cursor-pointer flex items-center justify-center gap-2 text-sm transition-colors">
                                 <Upload className="w-4 h-4 text-slate-400" />
                                 <span>Upload cover photo</span>
                                 <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                              </label>
                           </div>
                           {coverUrl && (
                              <div className="mt-2 relative h-28 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                 <img src={coverUrl} className="w-full h-full object-cover" alt="Cover Preview" />
                                 <button type="button" onClick={() => setCoverUrl('')} className="absolute top-2 right-2 bg-slate-950/60 hover:bg-slate-950 text-white p-1 rounded-full cursor-pointer">
                                    <X className="w-4 h-4" />
                                 </button>
                              </div>
                           )}
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                               <button
                                  type="button"
                                  onClick={handleEnhanceDescription}
                                  disabled={!description.trim() || isEnhancing || isUploading}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer
                                     text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200
                                     dark:text-indigo-400 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 dark:border-indigo-900/60
                                     disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Improve writing with AI"
                                  aria-label="Enhance description with AI"
                               >
                                  {isEnhancing ? (
                                     <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                     <Sparkles className="w-3 h-3" />
                                  )}
                                  {isEnhancing ? 'Enhancing...' : 'Enhance'}
                               </button>
                            </div>
                            <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full form-input-custom rounded-lg p-2.5"></textarea>
                            
                            {enhancedPreview && (
                               <div className="mt-2 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-xl p-3 animate-in slide-in-from-top duration-200">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                     <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                     <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">AI Suggestion</span>
                                  </div>
                                  <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{enhancedPreview}</p>
                                  <div className="flex gap-2 mt-2.5">
                                     <button
                                        type="button"
                                        onClick={handleUseEnhancedDescription}
                                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                     >
                                        ✓ Use this
                                     </button>
                                     <button
                                        type="button"
                                        onClick={handleDismissEnhancedDescription}
                                        className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-450 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-855 transition-colors cursor-pointer"
                                     >
                                        Keep original
                                     </button>
                                  </div>
                                </div>
                            )}

                            {enhanceError && (
                               <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                  <X className="w-3 h-3" /> {enhanceError}
                                </p>
                            )}
                        </div>
                     </div>
                     <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => { setIsCreating(false); resetForm(); }} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-805 dark:hover:text-slate-200 font-medium cursor-pointer">Cancel</button>
                        <button type="submit" disabled={isUploading || isEnhancing || !!dateError} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-sm">Publish Event</button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};
