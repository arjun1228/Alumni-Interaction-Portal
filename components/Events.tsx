
import React, { useState } from 'react';
import { Calendar, Users, Video, MapPin, Clock, Plus, X } from 'lucide-react';
import { EventListing, UserRole, User } from '../types';
import { createEvent } from '../services/api';

interface EventsProps {
   events: EventListing[];
   setEvents: React.Dispatch<React.SetStateAction<EventListing[]>>;
   currentUser: User;
}

export const Events: React.FC<EventsProps> = ({ events, setEvents, currentUser }) => {
   const [selectedEvent, setSelectedEvent] = useState<EventListing | null>(null);
   const [isCreating, setIsCreating] = useState(false);

   // New Event Form State
   const [title, setTitle] = useState('');
   const [date, setDate] = useState('');
   const [time, setTime] = useState('');
   const [type, setType] = useState<'WEBINAR' | 'HACKATHON' | 'MEETUP' | 'WORKSHOP'>('WEBINAR');
   const [description, setDescription] = useState('');

   const handleCreateEvent = async (e: React.FormEvent) => {
      e.preventDefault();
      const eventData = {
         title,
         date,
         time,
         type,
         description,
         organizer: currentUser,
         attendees: 0,
         image: `https://picsum.photos/seed/${Date.now()}/600/300`
      };

      try {
         const savedEvent = await createEvent(eventData);
         setEvents([savedEvent, ...events]);
         setIsCreating(false);
         setTitle('');
         setDescription('');
      } catch (error) {
         console.error("Failed to create event", error);
      }
   };

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-bold text-slate-800">Upcoming Events</h1>
               <p className="text-slate-500 mt-1">Workshops, webinars, and hackathons</p>
            </div>
            {currentUser.role === UserRole.GRADUATE && (
               <button
                  onClick={() => setIsCreating(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
               >
                  <Plus className="w-4 h-4" /> Create Event
               </button>
            )}
         </div>

         <div className="grid md:grid-cols-2 gap-6">
            {events.map((event) => (
               <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
               >
                  <div className="h-40 overflow-hidden relative">
                     <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-700">
                        {event.type}
                     </div>
                  </div>
                  <div className="p-5">
                     <div className="flex gap-3 text-sm text-slate-500 mb-2">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-indigo-500" /> {event.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-indigo-500" /> {event.time}</span>
                     </div>
                     <h3 className="text-lg font-bold text-slate-900 mb-2">{event.title}</h3>

                     <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                           <img src={event.organizer.avatar} className="w-6 h-6 rounded-full" alt="" />
                           <span className="text-xs text-slate-600">By {event.organizer.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                           <Users className="w-3 h-3" /> {event.attendees} going
                        </div>
                     </div>

                     <button className="w-full mt-4 bg-white border border-indigo-600 text-indigo-600 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
                        {currentUser.role === UserRole.GRADUATE ? 'View Details' : 'Register Now'}
                     </button>
                  </div>
               </div>
            ))}
         </div>

         {/* EVENT DETAILS MODAL */}
         {selectedEvent && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
                  <div className="h-48 relative">
                     <img src={selectedEvent.image} className="w-full h-full object-cover" alt="Event cover" />
                     <button
                        onClick={() => setSelectedEvent(null)}
                        className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
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
                        <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
                           {currentUser.role === UserRole.GRADUATE ? 'Edit Event' : 'Confirm Registration'}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* CREATE EVENT MODAL */}
         {isCreating && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl w-full max-w-lg animate-in zoom-in duration-200">
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
                           <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-slate-50 text-slate-900 border rounded-lg p-2.5">
                              <option value="WEBINAR">Webinar</option>
                              <option value="HACKATHON">Hackathon</option>
                              <option value="WORKSHOP">Workshop</option>
                              <option value="MEETUP">Meetup</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                           <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-slate-50 text-slate-900 border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"></textarea>
                        </div>
                     </div>
                     <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Publish Event</button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};
