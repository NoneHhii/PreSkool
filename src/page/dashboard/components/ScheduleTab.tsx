import React, { useState, useEffect } from 'react';
import { academicService, type Schedule, type Class } from '../../../services/academic.service';
import { Calendar, Plus, AlertCircle, CheckCircle, Clock, MapPin } from 'lucide-react';

export default function ScheduleTab() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Format today as YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({ classId: '', date: today, shift: 'Sáng (Ca 1)', room: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [scheduleRes, classesRes] = await Promise.all([
        academicService.getSchedule(),
        academicService.getClasses() // We need classes to select from in the form
      ]);
      
      // Sort schedule by date
      const sorted = (scheduleRes.data || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setSchedules(sorted);
      setClasses(classesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);
    try {
      // Need to format date as ISO string for backend
      const isoDate = new Date(formData.date).toISOString();
      await academicService.createSchedule({
        ...formData,
        date: isoDate
      });
      setMessage({ type: 'success', text: 'Schedule created successfully!' });
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create schedule' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Schedule Management</h2>
            <p className="text-sm text-gray-500">View and organize class timetables</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={18} />
          {showForm ? 'Cancel' : 'New Schedule'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-auto opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Schedule</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Class</label>
                <select required value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white">
                  <option value="" disabled>Select a Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.code} ({c.course?.name})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Date</label>
                <input required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} type="date" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Shift / Time</label>
                <select required value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white">
                  <option value="Sáng (Ca 1)">Sáng (Ca 1: 07:00 - 09:15)</option>
                  <option value="Sáng (Ca 2)">Sáng (Ca 2: 09:30 - 11:45)</option>
                  <option value="Chiều (Ca 3)">Chiều (Ca 3: 13:00 - 15:15)</option>
                  <option value="Chiều (Ca 4)">Chiều (Ca 4: 15:30 - 17:45)</option>
                  <option value="Tối (Ca 5)">Tối (Ca 5: 18:00 - 20:15)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Room</label>
                <input required value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} type="text" placeholder="e.g. A101" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" />
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={submitLoading || !formData.classId} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70 transition">
                {submitLoading ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : schedules.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center text-gray-500">No schedules found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map(schedule => (
            <div key={schedule.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition">
              <div className="bg-blue-50/50 p-4 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-blue-900 text-lg">{(schedule.class || schedule.classInfo)?.code || 'Lớp học'}</h4>
                  <p className="text-xs text-blue-700 font-medium">{(schedule.class || schedule.classInfo)?.course?.name || 'Môn học'}</p>
                </div>
                <div className="bg-white px-2 py-1 rounded text-xs font-bold text-gray-600 shadow-sm border border-gray-100">
                  {(schedule.class || schedule.classInfo)?.semester ? `Học kỳ ${(schedule.class || schedule.classInfo)?.semester}` : ''}
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold">{formatDate(schedule.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="text-sm font-medium">{schedule.shift}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="text-sm font-medium">{schedule.room}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
