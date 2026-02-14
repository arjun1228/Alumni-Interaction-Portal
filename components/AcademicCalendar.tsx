
import React from 'react';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';

export const AcademicCalendar: React.FC = () => {
  const events = [
    { id: 1, title: 'Mid-Semester Exams', date: 'Oct 15 - Oct 25', type: 'EXAM' },
    { id: 2, title: 'Hackathon Registration Deadline', date: 'Oct 28', type: 'DEADLINE' },
    { id: 3, title: 'Career Fair Fall 2023', date: 'Nov 02', type: 'EVENT' },
    { id: 4, title: 'Winter Break Starts', date: 'Dec 15', type: 'HOLIDAY' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
        <CalendarIcon className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-800">Academic Calendar</h3>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="flex gap-3 items-start">
            <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg shrink-0 ${
              event.type === 'EXAM' ? 'bg-red-50 text-red-600' :
              event.type === 'DEADLINE' ? 'bg-amber-50 text-amber-600' :
              event.type === 'HOLIDAY' ? 'bg-green-50 text-green-600' :
              'bg-indigo-50 text-indigo-600'
            }`}>
              <span className="text-xs font-bold uppercase">{event.date.split(' ')[0]}</span>
              <span className="text-sm font-bold">{event.date.split(' ')[1].replace(/[^0-9]/g, '')}</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{event.title}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                {event.type === 'DEADLINE' && <AlertCircle className="w-3 h-3" />}
                {event.type === 'EXAM' ? 'Academic' : event.type}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 text-xs text-indigo-600 font-medium hover:text-indigo-700 hover:underline text-center">
        View Full Schedule
      </button>
    </div>
  );
};
