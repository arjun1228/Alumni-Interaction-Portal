import React, { useState } from 'react';
import { Calendar, Users, Video, MapPin, Clock, Plus, X, Upload, CheckCircle, Trash2 } from 'lucide-react';
import { UserRole } from '../types';
import { createEvent, rsvpEvent, uploadImage, deleteEvent, cancelRsvpEvent } from '../services/api';

export const Events = ({ events, setEvents, currentUser }) => {
   const [selectedEvent, setSelectedEvent] = useState(null);
   const [isCreating, setIsCreating] = useState(false);

   // New Event Form State
   const [title, setTitle] = useState('');
   const [date, setDate] = useState('');
   const [time, setTime] = useState('');
   const [type, setType] = useState('WEBINAR');
   const [description, setDescription] = useState('');
   
   // RSVP State
   const [isRegistering, setIsRegistering] = useState(false);
   const [successMessage, setSuccessMessage] = useState('');

   // Image Upload State
   const [coverUrl, setCoverUrl] = useState('');
   const [isUploading, setIsUploading] = useState(false);

    const handleDeleteEvent = async (eventId) => {
       if (window.confirm("Delete this event posting permanently?")) {
          try {
             await deleteEvent(eventId);
             setEvents(events.filter(ev => (ev.id || ev._id) !== eventId));
          } catch (err) {
             console.error("Failed to delete event", err);
             alert(err.message || "Failed to delete event");
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

   const handleCreateEvent = async (e) => {
      e.preventDefault();
      const eventData = {
         title,
         date,
         time,
         type,
         description,
         organizer: currentUser,
         attendees: 0,
         image: coverUrl || `https://picsum.photos/seed/${Date.now()}/600/300`
      };

      try {
         const savedEvent = await createEvent(eventData);
         setEvents([savedEvent, ...events]);
         setIsCreating(false);
         // Reset Form
         setTitle('');
         setDescription('');
         setDate('');
         setTime('');
         setCoverUrl('');
      } catch (error) {
         console.error("Failed to create event", error);
      }
   };

   const handleRegisterForEvent = async (eventId) => {
      setIsRegistering(true);
      try {
         await rsvpEvent(eventId, currentUser.id || currentUser._id);
         setSuccessMessage('Successfully registered!');
         
         // Update events list locally
         setEvents(events.map(ev => {
            if (ev.id === eventId || ev._id === eventId) {
               return { ...ev, attendees: (ev.attendees || 0) + 1 };
            }
            return ev;
         }));

         // Update modal details
         setSelectedEvent(prev => {
            if (prev && (prev.id === eventId || prev._id === eventId)) {
               return { ...prev, attendees: (prev.attendees || 0) + 1 };
            }
            return prev;
         });

         setTimeout(() => {
            setSuccessMessage('');
            setSelectedEvent(null);
         }, 1500);
      } catch (error) {
         console.error('Failed to register for event:', error);
      } finally {
         setIsRegistering(false);
      }
   };

   const handleCancelRsvp = async (eventId) => {
      setIsRegistering(true);
      try {
         await cancelRsvpEvent(eventId);
         setSuccessMessage('RSVP cancelled successfully!');
         
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
            setSuccessMessage('');
            setSelectedEvent(null);
         }, 1500);
      } catch (error) {
         console.error('Failed to cancel RSVP:', error);
      } finally {
         setIsRegistering(false);
      }
   };

   return (
      <div className="space-y-6">
         {/* Success Message Banner */}
         {successMessage && (
            <div className="fixed top-5 right-5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-3 rounded-xl shadow-lg z-100 flex items-center gap-2 animate-bounce">
               <CheckCircle className="w-5 h-5 text-emerald-600" />
               <span className="font-semibold">{successMessage}</span>
            </div>
         )}

         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-bold text-slate-800">Upcoming Events</h1>
               <p className="text-slate-500 mt-1">Workshops, webinars, and hackathons</p>
            </div>
            {(currentUser.role === UserRole.GRADUATE || currentUser.role?.toLowerCase() === 'admin') && (
               <button
                  onClick={() => setIsCreating(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
               >
                  <Plus className="w-4 h-4" /> Create Event
               </button>
            )}
         </div>

         {events.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
               <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
               <p className="text-slate-500 text-sm">No upcoming events scheduled.</p>
            </div>
         ) : (
            <div className="grid md:grid-cols-2 gap-6">
               {events.map((event) => (
                  <div
                     key={event.id || event._id}
                     onClick={() => setSelectedEvent(event)}
                     className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
                  >
                     <div className="h-40 overflow-hidden relative">
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-700">
                           {event.type}
                        </div>
                        {(currentUser.role?.toLowerCase() === 'admin') && (
                           <button
                              onClick={(e) => {
                                 e.stopPropagation();
                                 handleDeleteEvent(event.id || event._id);
                              }}
                              className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md transition-colors"
                              title="Delete Event"
                              aria-label="Delete Event"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        )}
                     </div>
                     <div className="p-5">
                        <div className="flex gap-3 text-sm text-slate-500 mb-2">
                           <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-indigo-500" /> {event.date}</span>
                           <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-indigo-500" /> {event.time}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{event.title}</h3>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                           <div className="flex items-center gap-2">
                              <img src={event.organizer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.organizer?.name || 'Graduate')}`} className="w-6 h-6 rounded-full" alt="" />
                              <span className="text-xs text-slate-600">By {event.organizer?.name || 'Graduate'}</span>
                           </div>
                           <div className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                              <Users className="w-3 h-3" /> {event.attendees} going
                           </div>
                        </div>

                        <button className="w-full mt-4 bg-white border border-indigo-600 text-indigo-600 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
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
               <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
                  <div className="h-48 relative">
                     <img src={selectedEvent.image} className="w-full h-full object-cover" alt="Event cover" />
                     <button
                        onClick={() => setSelectedEvent(null)}
                        className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
                        aria-label="Close Event Details"
                     >
                        <X className="w-5 h-5" />
                     </button>
                  </div>
                  <div className="p-8">
                     <div className="flex gap-2 mb-4">
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{selectedEvent.type}</span>
                     </div>
                     <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedEvent.title}</h2>
                     <div className="flex flex-wrap gap-6 text-slate-600 mb-6">
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-600" /> {selectedEvent.date}</span>
                        <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-600" /> {selectedEvent.time}</span>
                        <span className="flex items-center gap-2"><Users className="w-4 h-4 text-indigo-600" /> {selectedEvent.attendees} Registered</span>
                     </div>

                     <div className="prose prose-slate mb-8">
                        <h3 className="text-lg font-bold text-slate-800">About this event</h3>
                        <p>{selectedEvent.description || "No description provided."}</p>
                     </div>

                     <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                        <button onClick={() => setSelectedEvent(null)} className="px-5 py-2.5 text-slate-600 font-medium">Close</button>
                        {(() => {
                           if (currentUser.role === UserRole.GRADUATE || currentUser.role?.toLowerCase() === 'admin') {
                              return (
                                 <button onClick={() => setSelectedEvent(null)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
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
                                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                                 >
                                    {isRegistering ? 'Cancelling...' : 'Cancel RSVP'}
                                 </button>
                              );
                           }
                           return (
                              <button 
                                 onClick={() => handleRegisterForEvent(selectedEvent.id || selectedEvent._id)}
                                 disabled={isRegistering}
                                 className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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
               <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
                  <form onSubmit={handleCreateEvent} className="p-6">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Create New Event</h2>
                        <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
                           <X className="w-6 h-6" />
                        </button>
                     </div>
                     <div className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
                           <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 text-slate-900 border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                              <input required type="text" value={date} onChange={e => setDate(e.target.value)} placeholder="Oct 24, 2023" className="w-full bg-slate-50 text-slate-900 border rounded-lg p-2.5" />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                              <input required type="text" value={time} onChange={e => setTime(e.target.value)} placeholder="6:00 PM EST" className="w-full bg-slate-50 text-slate-900 border rounded-lg p-2.5" />
                           </div>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                           <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-50 text-slate-900 border rounded-lg p-2.5">
                              <option value="WEBINAR">Webinar</option>
                              <option value="HACKATHON">Hackathon</option>
                              <option value="WORKSHOP">Workshop</option>
                              <option value="MEETUP">Meetup</option>
                           </select>
                        </div>
                        <div>
                           <label className="flex text-sm font-medium text-slate-700 mb-1 items-center gap-2">
                              Cover Image
                              {isUploading && <span className="text-xs text-indigo-600 animate-pulse">Uploading to Cloudinary...</span>}
                           </label>
                           <div className="flex items-center gap-3">
                              <label className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-dashed rounded-lg p-3 cursor-pointer flex items-center justify-center gap-2 text-sm transition-colors">
                                 <Upload className="w-4 h-4" />
                                 <span>Upload cover photo</span>
                                 <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                              </label>
                           </div>
                           {coverUrl && (
                              <div className="mt-2 relative h-28 rounded-lg overflow-hidden border border-slate-200">
                                 <img src={coverUrl} className="w-full h-full object-cover" alt="Cover Preview" />
                                 <button type="button" onClick={() => setCoverUrl('')} className="absolute top-2 right-2 bg-slate-950/60 hover:bg-slate-950 text-white p-1 rounded-full">
                                    <X className="w-4 h-4" />
                                 </button>
                              </div>
                           )}
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                           <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-slate-50 text-slate-900 border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"></textarea>
                        </div>
                     </div>
                     <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
                        <button type="submit" disabled={isUploading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">Publish Event</button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};
