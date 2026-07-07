import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const SKILL_DATA = [
  { name: 'React', students: 120 },
  { name: 'Python', students: 98 },
  { name: 'AWS', students: 86 },
  { name: 'System Design', students: 75 },
  { name: 'Data Sci', students: 65 },
];

const ACTIVITY_DATA = [
  { name: 'Mon', views: 400, posts: 24 },
  { name: 'Tue', views: 300, posts: 18 },
  { name: 'Wed', views: 550, posts: 35 },
  { name: 'Thu', views: 450, posts: 28 },
  { name: 'Fri', views: 600, posts: 42 },
  { name: 'Sat', views: 200, posts: 10 },
  { name: 'Sun', views: 150, posts: 8 },
];

export const Analytics = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Alumni Insights</h1>
      <p className="text-slate-500">Track student engagement and trending skills.</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-4">Top Skills in Demand</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SKILL_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-4">Portal Activity (Weekly)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ACTIVITY_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#4f46e5" strokeWidth={2} />
                <Line type="monotone" dataKey="posts" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-600 rounded-xl p-6 text-white">
              <div className="text-indigo-200 text-sm font-medium">Total Students Reached</div>
              <div className="text-3xl font-bold mt-2">1,245</div>
              <div className="text-indigo-200 text-xs mt-1">+12% from last month</div>
          </div>
          <div className="bg-emerald-600 rounded-xl p-6 text-white">
              <div className="text-emerald-200 text-sm font-medium">Jobs Filled</div>
              <div className="text-3xl font-bold mt-2">38</div>
              <div className="text-emerald-200 text-xs mt-1">Via alumni referrals</div>
          </div>
          <div className="bg-violet-600 rounded-xl p-6 text-white">
              <div className="text-violet-200 text-sm font-medium">Mentorship Sessions</div>
              <div className="text-3xl font-bold mt-2">156</div>
              <div className="text-violet-200 text-xs mt-1">Powered by AI Match</div>
          </div>
      </div>
    </div>
  );
};
