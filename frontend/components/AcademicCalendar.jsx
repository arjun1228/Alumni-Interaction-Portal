import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, AlertCircle, Plus, Edit2, Trash2, X, CalendarDays, Check } from 'lucide-react';
import { fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../services/api';
import { useToast } from './Toast';

export const AcademicCalendar = () => {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [fullScheduleEvents, setFullScheduleEvents] = useState([]);

  // Form State (for both Add and Edit)
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Academic');

  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      const data = await fetchCalendarEvents(false);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load upcoming events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllEvents = async () => {
    try {
      const data = await fetchCalendarEvents(true);
      setFullScheduleEvents(data);
    } catch (err) {
      console.error('Failed to load all events:', err);
    }
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingEventId(null);
    setTitle('');
    setDate('');
    setCategory('Academic');
  };

  const handleEditClick = (event) => {
    setEditingEventId(event.id || event._id);
    setIsAdding(false);
    setTitle(event.title);
    // Format date string to YYYY-MM-DD for date input
    const formattedDate = new Date(event.date).toISOString().substring(0, 10);
    setDate(formattedDate);
    setCategory(event.category);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    try {
      if (editingEventId) {
        // Edit existing
        const updated = await updateCalendarEvent(editingEventId, { title, date, category });
        setEvents(prev => prev.map(evt => (evt.id === editingEventId || evt._id === editingEventId) ? updated : evt).sort((a, b) => new Date(a.date) - new Date(b.date)));
        setFullScheduleEvents(prev => prev.map(evt => (evt.id === editingEventId || evt._id === editingEventId) ? updated : evt).sort((a, b) => new Date(a.date) - new Date(b.date)));
        setEditingEventId(null);
        toast('Calendar event updated! 📅', 'success');
      } else {
        // Create new
        const created = await createCalendarEvent({ title, date, category });
        setEvents(prev => [...prev, created].sort((a, b) => new Date(a.date) - new Date(b.date)));
        setFullScheduleEvents(prev => [...prev, created].sort((a, b) => new Date(a.date) - new Date(b.date)));
        setIsAdding(false);
        toast(`“${title}” added to your calendar! ✅`, 'success');
      }
      // Reset inputs
      setTitle('');
      setDate('');
      setCategory('Academic');
    } catch (err) {
      console.error('Failed to save calendar event:', err);
      toast(err.message || 'Failed to save calendar event.', 'error');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this calendar event?')) return;
    try {
      await deleteCalendarEvent(eventId);
      setEvents(prev => prev.filter(evt => (evt.id || evt._id) !== eventId));
      setFullScheduleEvents(prev => prev.filter(evt => (evt.id || evt._id) !== eventId));
      toast('Calendar event removed.', 'info', 2500);
    } catch (err) {
      console.error('Failed to delete calendar event:', err);
      toast(err.message || 'Failed to delete event.', 'error');
    }
  };

  const parseDateBadge = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const month = d.toLocaleDateString([], { month: 'short' }).toUpperCase();
      const day = d.toLocaleDateString([], { day: 'numeric' });
      return { month, day };
    } catch (err) {
      return { month: 'OCT', day: '15' };
    }
  };

  const getCategoryColorClass = (cat) => {
    switch (cat) {
      case 'Academic': return 'bg-red-50 text-red-600 border border-red-100';
      case 'Deadline': return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'Holiday': return 'bg-green-50 text-green-600 border border-green-100';
      default: return 'bg-indigo-50 text-indigo-600 border border-indigo-100'; // Event
    }
  };

  const handleViewFullSchedule = () => {
    loadAllEvents();
    setShowFullSchedule(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 relative overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Academic Calendar</h3>
        </div>
        {!isAdding && !editingEventId && (
          <button
            onClick={handleAddClick}
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="Add Event"
            aria-label="Add Event"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Add / Edit Form */}
          {(isAdding || editingEventId) && (
            <form onSubmit={handleSave} className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3 animate-in slide-in-from-top duration-200">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {editingEventId ? 'Edit Event' : 'New Event'}
                </h4>
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingEventId(null); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Semester Exams"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Deadline">Deadline</option>
                    <option value="Event">Event</option>
                    <option value="Holiday">Holiday</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Save Event
              </button>
            </form>
          )}

          {/* Events List */}
          {events.length > 0 ? (
            events.slice(0, 5).map((event) => {
              const { month, day } = parseDateBadge(event.date);
              const isEditingThis = editingEventId === (event.id || event._id);

              if (isEditingThis) return null; // Form renders instead

              return (
                <div key={event.id || event._id} className="group flex gap-3 items-start relative hover:bg-slate-50/50 p-2 -mx-2 rounded-xl transition-colors">
                  <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg shrink-0 font-sans ${getCategoryColorClass(event.category)}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{month}</span>
                    <span className="text-base font-extrabold leading-none mt-0.5">{day}</span>
                  </div>
                  <div className="flex-1 min-w-0 pr-12">
                    <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{event.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                      {event.category === 'Deadline' && <AlertCircle className="w-3 h-3 text-amber-500" />}
                      {event.category}
                    </p>
                  </div>
                  {/* Action items on hover/right */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditClick(event)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all shadow-sm"
                      title="Edit Event"
                      aria-label="Edit Event"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id || event._id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all shadow-sm"
                      title="Delete Event"
                      aria-label="Delete Event"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            !isAdding && (
              <div className="text-center py-6 text-slate-450 text-xs italic">
                No upcoming events listed. Click '+' to add one!
              </div>
            )
          )}
        </div>
      )}

      {events.length > 5 && (
        <button
          onClick={handleViewFullSchedule}
          className="w-full mt-4 text-xs text-indigo-600 font-semibold hover:text-indigo-700 hover:underline text-center flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3"
        >
          <CalendarDays className="w-4 h-4" /> View Full Schedule ({events.length} events)
        </button>
      )}

      {/* Full Schedule Modal */}
      {showFullSchedule && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col animate-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-lg">Full Academic Calendar</h3>
              </div>
              <button
                onClick={() => setShowFullSchedule(false)}
                className="text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {fullScheduleEvents.length > 0 ? (
                fullScheduleEvents.map((event) => {
                  const { month, day } = parseDateBadge(event.date);
                  return (
                    <div key={event.id || event._id} className="group flex gap-3 items-start relative hover:bg-slate-50/50 p-2 -mx-2 rounded-xl transition-colors">
                      <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg shrink-0 font-sans ${getCategoryColorClass(event.category)}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{month}</span>
                        <span className="text-base font-extrabold leading-none mt-0.5">{day}</span>
                      </div>
                      <div className="flex-1 min-w-0 pr-12">
                        <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{event.title}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                          {event.category === 'Deadline' && <AlertCircle className="w-3 h-3 text-amber-500" />}
                          {event.category}
                        </p>
                      </div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setShowFullSchedule(false); handleEditClick(event); }}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all shadow-sm"
                          title="Edit Event"
                          aria-label="Edit Event"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id || event._id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all shadow-sm"
                          title="Delete Event"
                          aria-label="Delete Event"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-400 italic text-sm">
                  No calendar events found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
