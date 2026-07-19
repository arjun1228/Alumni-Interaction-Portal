import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { fetchAnalyticsData } from '../services/api';
import { Loader2, Download } from 'lucide-react';
import { useToast } from './Toast';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-lg text-sm font-semibold animate-in fade-in zoom-in duration-200 transition-all">
        <p className="text-slate-500 dark:text-slate-400 mb-1 font-bold">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 mt-1.5">
            <span 
              className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-2 ring-indigo-500/20 dark:ring-offset-slate-900" 
              style={{ backgroundColor: item.color || item.fill || '#4f46e5' }} 
            />
            <span className="text-slate-800 dark:text-slate-200 capitalize">
              {item.name}: <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.value}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const Analytics = () => {
  const toast = useToast();
  const [dateRange, setDateRange] = useState('30'); // '7', '30', 'all'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (range) => {
    setIsLoading(true);
    try {
      const data = await fetchAnalyticsData(range);
      setAnalyticsData(data);
    } catch (err) {
      console.error(err);
      toast(err.message || 'Failed to load analytics data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(dateRange);
  }, [dateRange]);

  const handleExportCSV = () => {
    if (!analyticsData) return;
    
    const { cards, skillData, activityData } = analyticsData;
    
    let csv = "Metric,Value,Change\n";
    csv += `Total Students Reached,${cards.totalStudents.value},${cards.totalStudents.change}\n`;
    csv += `Jobs Filled,${cards.jobsFilled.value},${cards.jobsFilled.change}\n`;
    csv += `Mentorship Sessions,${cards.mentorshipSessions.value},${cards.mentorshipSessions.change}\n\n`;
    
    csv += "Skill,Demand (Jobs Count)\n";
    skillData.forEach(item => {
      csv += `"${item.name}",${item.students}\n`;
    });
    csv += "\n";
    
    csv += "Day,Page Views,Posts Created\n";
    activityData.forEach(item => {
      csv += `${item.name},${item.views},${item.posts}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `alumniconnect_analytics_last_${dateRange}_days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Analytics data exported successfully! 📊", "success");
  };

  const getRangeLabel = () => {
    if (dateRange === '7') return 'Last 7 days';
    if (dateRange === '30') return 'Last 30 days';
    return 'All time';
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 theme-transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Alumni Insights</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track student engagement and trending skills.</p>
        </div>
        
        {/* Filters and Actions */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm font-semibold"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          
          <button
            onClick={handleExportCSV}
            disabled={isLoading || !analyticsData}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
          <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">Calculating platform stats for {getRangeLabel().toLowerCase()}...</p>
        </div>
      ) : analyticsData ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Charts Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Top Skills in Demand</h3>
              <div className="h-64 [--tooltip-bg:#fff] [--tooltip-border:#e2e8f0] [--tooltip-color:#0f172a] [--axis-tick:#64748b] [--axis-line:#cbd5e1] [--grid-line:#e2e8f0] dark:[--tooltip-bg:#0f172a] dark:[--tooltip-border:#1e293b] dark:[--tooltip-color:#f8fafc] dark:[--axis-tick:#94a3b8] dark:[--axis-line:#334155] dark:[--grid-line:#1e293b]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.skillData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-line)" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: 'var(--axis-tick)'}} stroke="var(--axis-line)" />
                    <YAxis tick={{fontSize: 12, fill: 'var(--axis-tick)'}} stroke="var(--axis-line)" />
                    <Tooltip 
                      content={<CustomTooltip />} 
                      cursor={{ fill: 'var(--grid-line)', opacity: 0.15 }}
                      isAnimationActive={true}
                      animationDuration={150}
                      wrapperStyle={{ outline: 'none', border: 'none', backgroundColor: 'transparent' }}
                    />
                    <Bar 
                      dataKey="students" 
                      fill="#4f46e5" 
                      radius={[4, 4, 0, 0]} 
                      isAnimationActive={true} 
                      animationDuration={1000}
                      activeBar={{ fill: '#6366f1', stroke: '#818cf8', strokeWidth: 2, fillOpacity: 0.95 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Portal Activity (Weekly)</h3>
              <div className="h-64 [--tooltip-bg:#fff] [--tooltip-border:#e2e8f0] [--tooltip-color:#0f172a] [--axis-tick:#64748b] [--axis-line:#cbd5e1] [--grid-line:#e2e8f0] dark:[--tooltip-bg:#0f172a] dark:[--tooltip-border:#1e293b] dark:[--tooltip-color:#f8fafc] dark:[--axis-tick:#94a3b8] dark:[--axis-line:#334155] dark:[--grid-line:#1e293b]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.activityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-line)" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: 'var(--axis-tick)'}} stroke="var(--axis-line)" />
                    <YAxis tick={{fontSize: 12, fill: 'var(--axis-tick)'}} stroke="var(--axis-line)" />
                    <Tooltip 
                      content={<CustomTooltip />} 
                      isAnimationActive={true}
                      animationDuration={150}
                      wrapperStyle={{ outline: 'none', border: 'none', backgroundColor: 'transparent' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="views" name="Page Views" stroke="#4f46e5" strokeWidth={2} isAnimationActive={true} animationDuration={1000} />
                    <Line type="monotone" dataKey="posts" name="Posts Created" stroke="#10b981" strokeWidth={2} isAnimationActive={true} animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className="bg-indigo-600 dark:bg-indigo-700/80 rounded-xl p-6 text-white shadow-md dark:shadow-none hover:scale-[1.02] hover:shadow-lg transition-all duration-200 cursor-default animate-in fade-in"
            >
              <div className="text-indigo-200 text-sm font-medium">Total Students Reached</div>
              <div className="text-3xl font-bold mt-2">{analyticsData.cards.totalStudents.value}</div>
              <div className="text-indigo-200 text-xs mt-1">{analyticsData.cards.totalStudents.change}</div>
            </div>
            <div 
              className="bg-emerald-600 dark:bg-emerald-700/80 rounded-xl p-6 text-white shadow-md dark:shadow-none hover:scale-[1.02] hover:shadow-lg transition-all duration-200 cursor-default animate-in fade-in"
            >
              <div className="text-emerald-100 text-sm font-medium">Jobs Filled</div>
              <div className="text-3xl font-bold mt-2">{analyticsData.cards.jobsFilled.value}</div>
              <div className="text-emerald-100 text-xs mt-1">{analyticsData.cards.jobsFilled.change}</div>
            </div>
            <div 
              className="bg-violet-600 dark:bg-violet-750/80 rounded-xl p-6 text-white shadow-md dark:shadow-none hover:scale-[1.02] hover:shadow-lg transition-all duration-200 cursor-default animate-in fade-in"
            >
              <div className="text-violet-200 text-sm font-medium">Mentorship Sessions</div>
              <div className="text-3xl font-bold mt-2">{analyticsData.cards.mentorshipSessions.value}</div>
              <div className="text-violet-200 text-xs mt-1">{analyticsData.cards.mentorshipSessions.change}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-450">Unable to load analytics data.</p>
        </div>
      )}
    </div>
  );
};
