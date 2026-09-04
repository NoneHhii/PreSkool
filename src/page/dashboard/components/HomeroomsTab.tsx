import React, { useState, useEffect } from 'react';
import { academicService, type HomeroomClass, type Major } from '../../../services/academic.service';
import { Plus, AlertCircle, CheckCircle, GraduationCap, Zap } from 'lucide-react';

export default function HomeroomsTab() {
  const [homerooms, setHomerooms] = useState<HomeroomClass[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({ code: '', name: '', majorId: '', cohort: '', advisorId: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Auto Assign Homerooms Modal
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [autoAssignData, setAutoAssignData] = useState({ majorId: '', cohort: '', numberOfClasses: 1, prefix: '', suffix: '' });
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const [unassignedCount, setUnassignedCount] = useState<number | null>(null);
  const [unassignedStudentIds, setUnassignedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [homeroomsRes, majorsRes, teachersRes] = await Promise.all([
        academicService.getHomerooms(),
        academicService.getMajors(),
        academicService.getTeachers()
      ]);
      setHomerooms(homeroomsRes.data || []);
      setMajors(majorsRes.data || []);
      setTeachers(teachersRes.data || []);
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
      await academicService.createHomeroom({
        ...formData,
        advisorId: formData.advisorId || undefined
      });
      setMessage({ type: 'success', text: 'Homeroom class created successfully!' });
      setFormData({ code: '', name: '', majorId: '', cohort: '', advisorId: '' });
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create homeroom class' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const checkUnassigned = async () => {
    if (!autoAssignData.cohort || !autoAssignData.majorId) return;
    try {
      const res = await academicService.getUnassignedHomeroomStudents({
        cohort: autoAssignData.cohort,
        majorId: autoAssignData.majorId
      });
      const students = res.data || [];
      setUnassignedCount(students.length);
      setUnassignedStudentIds(students.map(s => s.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unassignedCount === 0 || unassignedCount === null) {
      alert("No eligible students to assign!");
      return;
    }

    setAutoAssignLoading(true);
    setMessage(null);
    try {
      await academicService.autoAssignHomerooms({
        majorId: autoAssignData.majorId,
        cohort: autoAssignData.cohort,
        studentIds: unassignedStudentIds,
        numberOfClasses: autoAssignData.numberOfClasses,
        prefix: autoAssignData.prefix,
        suffix: autoAssignData.suffix || undefined
      });
      setMessage({ type: 'success', text: `Successfully generated homerooms and assigned ${unassignedCount} freshmen!` });
      setShowAutoAssign(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to auto-assign homerooms' });
    } finally {
      setAutoAssignLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Homeroom Classes</h2>
            <p className="text-sm text-gray-500">Manage student cohorts and academic advisors</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setShowAutoAssign(!showAutoAssign); setShowForm(false); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition shadow-sm"
          >
            <Zap size={18} />
            Auto Assign Freshmen (Phân lớp Tân Sinh Viên)
          </button>
          <button 
            onClick={() => { setShowForm(!showForm); setShowAutoAssign(false); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={18} />
            {showForm ? 'Cancel' : 'New Homeroom'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-auto opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      {/* AUTO ASSIGN HOMEROOMS SECTION */}
      {showAutoAssign && (
        <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-700"><Zap size={20} /></div>
            <div>
              <h3 className="text-lg font-bold text-purple-900">Auto Assign Freshmen to Homerooms</h3>
              <p className="text-sm text-purple-700">Filter freshmen who have no homeroom yet, and automatically generate homeroom classes for them based on a naming convention.</p>
            </div>
          </div>
          
          <form onSubmit={handleAutoAssign} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1: Filter Freshmen */}
              <div className="space-y-4 bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                <h4 className="font-semibold text-gray-900 border-b pb-2">1. Filter Freshmen</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Cohort (Required)</label>
                    <input required value={autoAssignData.cohort} onChange={e => setAutoAssignData({...autoAssignData, cohort: e.target.value})} type="text" placeholder="e.g. K26" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Major (Required)</label>
                    <select required value={autoAssignData.majorId} onChange={e => setAutoAssignData({...autoAssignData, majorId: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-200 outline-none bg-white text-sm">
                      <option value="" disabled>Select Major</option>
                      {majors.map(m => (
                        <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={checkUnassigned} disabled={!autoAssignData.cohort || !autoAssignData.majorId} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg transition disabled:opacity-50">
                    Find Eligible Freshmen
                  </button>
                </div>
              </div>

              {/* Step 2: Naming Convention */}
              <div className="space-y-4 bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                <h4 className="font-semibold text-gray-900 border-b pb-2">2. Class Naming Setup</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Prefix</label>
                    <input required value={autoAssignData.prefix} onChange={e => setAutoAssignData({...autoAssignData, prefix: e.target.value})} type="text" placeholder="e.g. DHKTPM18" className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Suffix (Optional)</label>
                    <input value={autoAssignData.suffix} onChange={e => setAutoAssignData({...autoAssignData, suffix: e.target.value})} type="text" placeholder="e.g. TT" className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                  </div>
                  <div className="p-2 bg-gray-50 rounded border text-xs text-gray-500">
                    Generated classes will be named: <br/>
                    <strong className="text-gray-800">{autoAssignData.prefix || 'PREFIX'}A{autoAssignData.suffix}</strong>, 
                    <strong className="text-gray-800"> {autoAssignData.prefix || 'PREFIX'}B{autoAssignData.suffix}</strong>, etc.
                  </div>
                </div>
              </div>

              {/* Step 3: Execute */}
              <div className="space-y-4 bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                <h4 className="font-semibold text-gray-900 border-b pb-2">3. Execute</h4>
                {unassignedCount !== null && (
                  <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 mb-3">
                    Found <strong>{unassignedCount}</strong> freshmen eligible.
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Number of Classes to Generate</label>
                  <input required value={autoAssignData.numberOfClasses} onChange={e => setAutoAssignData({...autoAssignData, numberOfClasses: Number(e.target.value)})} type="number" min={1} max={26} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                  {unassignedCount !== null && unassignedCount > 0 && autoAssignData.numberOfClasses > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Approx ~{Math.ceil(unassignedCount / autoAssignData.numberOfClasses)} students per class.</p>
                  )}
                </div>
                
                <button type="submit" disabled={autoAssignLoading || !unassignedCount} className="w-full mt-4 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-70 transition flex items-center justify-center gap-2 shadow-sm">
                  {autoAssignLoading ? 'Processing...' : 'Run Auto-Assign'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MANUAL CREATE FORM */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Homeroom Class</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Class Code</label>
                <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} type="text" placeholder="e.g. 26SE01" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" placeholder="e.g. Lớp 26SE01 - KTPM" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Cohort</label>
                <input required value={formData.cohort} onChange={e => setFormData({...formData, cohort: e.target.value})} type="text" placeholder="e.g. K26" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Major</label>
                <select required value={formData.majorId} onChange={e => setFormData({...formData, majorId: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white">
                  <option value="" disabled>Select a Major</option>
                  {majors.map(m => (
                    <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Academic Advisor (Optional)</label>
                <select value={formData.advisorId} onChange={e => setFormData({...formData, advisorId: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white">
                  <option value="">-- No Advisor --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName || t.username} ({t.email})</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={submitLoading || !formData.majorId} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70 transition">
                {submitLoading ? 'Saving...' : 'Save Homeroom'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
        ) : homerooms.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No homeroom classes found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Code</th>
                <th className="p-4">Name</th>
                <th className="p-4">Cohort</th>
                <th className="p-4">Major</th>
                <th className="p-4">Advisor</th>
                <th className="p-4">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {homerooms.map(h => (
                <tr key={h.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-bold text-gray-900">{h.code}</td>
                  <td className="p-4 text-gray-700">{h.name}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800">
                      {h.cohort}
                    </span>
                  </td>
                  <td className="p-4 text-gray-700">{h.major?.name || '-'}</td>
                  <td className="p-4 text-gray-600 text-sm">
                    {h.advisor ? (h.advisor.fullName || h.advisor.username) : <span className="italic text-gray-400">None</span>}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                      {h.students?.length || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
