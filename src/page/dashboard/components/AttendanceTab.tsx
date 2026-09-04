import React, { useState, useEffect } from 'react';
import { academicService, type Schedule } from '../../../services/academic.service';
import { ClipboardCheck, CheckCircle, AlertCircle, Search, UserCheck, UserX, Clock } from 'lucide-react';

export default function AttendanceTab() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection states
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  
  // Mark Attendance states
  const [studentId, setStudentId] = useState('');
  const [status, setStatus] = useState<'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE'>('PRESENT');
  const [notes, setNotes] = useState('');
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Stats view
  const [searchStudentId, setSearchStudentId] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsMessage, setStatsMessage] = useState<{ type: 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await academicService.getSchedule();
      const sorted = (res.data || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSchedules(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    
    setSubmitLoading(true);
    setMessage(null);
    try {
      await academicService.markAttendance({
        scheduleId: selectedSchedule.id,
        studentId,
        status,
        notes
      });
      setMessage({ type: 'success', text: `Marked ${status} for student ${studentId}` });
      // Reset form but keep schedule selected
      setStudentId('');
      setNotes('');
      setStatus('PRESENT');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to mark attendance' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSearchStats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchStudentId.trim()) return;
    
    setStatsLoading(true);
    setStatsMessage(null);
    setStats(null);
    try {
      const res = await academicService.getStudentAttendanceStats(searchStudentId.trim());
      setStats(res.data);
    } catch (err: any) {
      setStatsMessage({ type: 'error', text: err.response?.data?.message || 'Student not found or failed to fetch stats' });
    } finally {
      setStatsLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
          <ClipboardCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Attendance Management</h2>
          <p className="text-sm text-gray-500">Mark student attendance and view statistics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Mark Attendance */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Mark Attendance</h3>
            </div>
            
            <div className="p-5 space-y-5">
              {message && (
                <div className={`p-3 rounded-lg flex items-start gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {message.type === 'success' ? <CheckCircle size={16} className="mt-0.5" /> : <AlertCircle size={16} className="mt-0.5" />}
                  <span className="font-medium">{message.text}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Select Schedule (Class Session)</label>
                {loading ? (
                  <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                ) : (
                  <select 
                    value={selectedSchedule?.id || ''} 
                    onChange={e => setSelectedSchedule(schedules.find(s => s.id === e.target.value) || null)} 
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white text-sm"
                  >
                    <option value="" disabled>-- Select a session --</option>
                    {schedules.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.classInfo?.code} | {formatDate(s.date)} | {s.shift}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedSchedule && (
                <form onSubmit={handleMarkAttendance} className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Student UUID</label>
                    <input 
                      required value={studentId} onChange={e => setStudentId(e.target.value)} 
                      type="text" placeholder="Paste Student UUID here" 
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none text-sm font-mono" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${status === 'PRESENT' ? 'bg-green-50 border-green-500 text-green-700 font-bold' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                        <input type="radio" name="status" value="PRESENT" checked={status === 'PRESENT'} onChange={() => setStatus('PRESENT')} className="hidden" />
                        <UserCheck size={18} /> Present
                      </label>
                      <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${status === 'ABSENT' ? 'bg-red-50 border-red-500 text-red-700 font-bold' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                        <input type="radio" name="status" value="ABSENT" checked={status === 'ABSENT'} onChange={() => setStatus('ABSENT')} className="hidden" />
                        <UserX size={18} /> Absent
                      </label>
                      <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${status === 'LATE' ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                        <input type="radio" name="status" value="LATE" checked={status === 'LATE'} onChange={() => setStatus('LATE')} className="hidden" />
                        <Clock size={18} /> Late
                      </label>
                      <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${status === 'EXCUSED' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                        <input type="radio" name="status" value="EXCUSED" checked={status === 'EXCUSED'} onChange={() => setStatus('EXCUSED')} className="hidden" />
                        <AlertCircle size={18} /> Excused
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Notes (Optional)</label>
                    <input 
                      value={notes} onChange={e => setNotes(e.target.value)} 
                      type="text" placeholder="e.g. 15 minutes late" 
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none text-sm" 
                    />
                  </div>

                  <button type="submit" disabled={submitLoading} className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70 transition flex items-center justify-center gap-2">
                    {submitLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Submit Attendance
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900">Student Attendance Statistics</h3>
            </div>
            <div className="p-5">
              <form onSubmit={handleSearchStats} className="flex gap-3 mb-6">
                <input 
                  required value={searchStudentId} onChange={e => setSearchStudentId(e.target.value)} 
                  type="text" placeholder="Enter Student UUID to search" 
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none text-sm font-mono" 
                />
                <button type="submit" disabled={statsLoading} className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-black transition flex items-center gap-2">
                  {statsLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={16} />}
                  Search
                </button>
              </form>

              {statsMessage && (
                <div className="p-3 rounded-lg flex items-center gap-2 text-sm bg-red-50 text-red-800 mb-4">
                  <AlertCircle size={16} />
                  <span className="font-medium">{statsMessage.text}</span>
                </div>
              )}

              {stats && (
                <div className="animate-in fade-in space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                      <p className="text-xs text-gray-500 font-semibold uppercase">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.stats.total}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                      <p className="text-xs text-green-700 font-semibold uppercase">Present</p>
                      <p className="text-2xl font-bold text-green-700">{stats.stats.PRESENT}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                      <p className="text-xs text-red-700 font-semibold uppercase">Absent</p>
                      <p className="text-2xl font-bold text-red-700">{stats.stats.ABSENT}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-center">
                      <p className="text-xs text-orange-700 font-semibold uppercase">Late</p>
                      <p className="text-2xl font-bold text-orange-700">{stats.stats.LATE}</p>
                    </div>
                  </div>

                  {stats.records && stats.records.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Recent Records</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {stats.records.slice(0, 10).map((r: any) => (
                          <div key={r.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 bg-white shadow-sm">
                            <div className="text-sm">
                              <p className="font-semibold text-gray-900 text-xs text-gray-500">ID: {r.scheduleId.substring(0,8)}...</p>
                              {r.notes && <p className="text-xs text-gray-500 italic">"{r.notes}"</p>}
                            </div>
                            <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider
                              ${r.status === 'PRESENT' ? 'bg-green-100 text-green-800' : 
                                r.status === 'ABSENT' ? 'bg-red-100 text-red-800' : 
                                r.status === 'LATE' ? 'bg-orange-100 text-orange-800' : 
                                'bg-blue-100 text-blue-800'}`}
                            >
                              {r.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
