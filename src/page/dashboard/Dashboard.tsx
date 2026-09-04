import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UploadCloud, LogOut, FileSpreadsheet, CheckCircle, AlertCircle, User, Building2, GraduationCap, BookOpen, Calendar, ClipboardCheck } from 'lucide-react';
import { userService, type ImportResponse } from '../../services/user.service';
import FacultiesTab from './components/FacultiesTab';
import MajorsTab from './components/MajorsTab';
import HomeroomsTab from './components/HomeroomsTab';
import CoursesTab from './components/CoursesTab';
import ClassesTab from './components/ClassesTab';
import ScheduleTab from './components/ScheduleTab';
import AttendanceTab from './components/AttendanceTab';

export default function Dashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState<any>(null);

    const [file, setFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<'STUDENTS' | 'TEACHERS'>('STUDENTS');
    const [enrollmentYear, setEnrollmentYear] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [importResult, setImportResult] = useState<ImportResponse | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr || !localStorage.getItem('token')) {
            navigate('/');
            return;
        }
        setUser(JSON.parse(userStr));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setImportResult(null);
            setErrorMsg(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setUploading(true);
        setImportResult(null);
        setErrorMsg(null);

        try {
            const response = importType === 'STUDENTS'
                ? await userService.importStudents(file, enrollmentYear || undefined)
                : await userService.importUsers(file); // Legacy endpoint for teachers
                
            setImportResult(response);
            setFile(null);
            setEnrollmentYear('');
            // Reset file input
            const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (error: any) {
            console.error('Import error:', error);
            setErrorMsg(error.response?.data?.message || 'Failed to import students. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    const isAdmin = user.role === 'ADMIN';

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <LayoutDashboard className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-800 tracking-tight">PreSkool</span>
                    </div>
                </div>

                <div className="p-4 flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Menu</p>
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            Overview
                        </button>

                        <button
                            onClick={() => navigate('/profile')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900`}
                        >
                            <User className="w-5 h-5" />
                            My Profile
                        </button>

                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => setActiveTab('import')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'import'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <FileSpreadsheet className="w-5 h-5" />
                                    Import Users
                                </button>
                                <button
                                    onClick={() => setActiveTab('faculties')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'faculties'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Building2 className="w-5 h-5" />
                                    Faculties
                                </button>
                                <button
                                    onClick={() => setActiveTab('majors')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'majors'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <GraduationCap className="w-5 h-5" />
                                    Majors
                                </button>
                                <button
                                    onClick={() => setActiveTab('courses')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'courses'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <BookOpen className="w-5 h-5" />
                                    Courses
                                </button>
                                <button
                                    onClick={() => setActiveTab('homerooms')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'homerooms'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <GraduationCap className="w-5 h-5" />
                                    Homerooms
                                </button>
                                <button
                                    onClick={() => setActiveTab('classes')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'classes'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Users className="w-5 h-5" />
                                    Classes
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'schedule'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Calendar className="w-5 h-5" />
                            Schedule
                        </button>
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'attendance'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <ClipboardCheck className="w-5 h-5" />
                            Attendance
                        </button>
                    </nav>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                            {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                            <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
                    <h1 className="text-lg font-semibold text-gray-800 capitalize">
                        {activeTab === 'overview' ? 'Dashboard Overview' : 
                         activeTab === 'import' ? 'Import Users' :
                         activeTab.replace(/([A-Z])/g, ' $1').trim()}
                    </h1>
                </header>

                <div className="p-8">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Welcome back</p>
                                    <p className="text-xl font-bold text-gray-900">{user.role}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'import' && isAdmin && (
                        <div className="max-w-2xl">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <FileSpreadsheet className="w-5 h-5 text-green-600" />
                                            Bulk Import {importType === 'STUDENTS' ? 'Students' : 'Teachers'}
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {importType === 'STUDENTS' 
                                                ? 'Upload an Excel file to bulk enroll freshmen. The system will automatically generate standard student codes (MSSV) and passwords.'
                                                : 'Upload an Excel file to bulk create Teacher accounts.'}
                                        </p>
                                    </div>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button 
                                            onClick={() => { setImportType('STUDENTS'); setImportResult(null); setErrorMsg(null); }} 
                                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${importType === 'STUDENTS' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Students
                                        </button>
                                        <button 
                                            onClick={() => { setImportType('TEACHERS'); setImportResult(null); setErrorMsg(null); }} 
                                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${importType === 'TEACHERS' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Teachers
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {errorMsg && (
                                        <div className="p-4 rounded-lg flex items-start gap-3 border bg-red-50 border-red-200 text-red-800">
                                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm font-medium">{errorMsg}</p>
                                        </div>
                                    )}

                                    {importResult && (
                                        <div className={`p-5 rounded-lg border ${importResult.failed > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                                            <div className="flex items-start gap-3">
                                                {importResult.failed > 0 ? <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" /> : <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />}
                                                <div className="flex-1">
                                                    <h3 className={`font-bold ${importResult.failed > 0 ? 'text-orange-800' : 'text-green-800'}`}>{importResult.message}</h3>
                                                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                                                        <div className="bg-white/60 p-2 rounded text-center shadow-sm">
                                                            <span className="block text-xl font-bold text-gray-700">{importResult.total}</span>
                                                            <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Total</span>
                                                        </div>
                                                        <div className="bg-white/60 p-2 rounded text-center shadow-sm">
                                                            <span className="block text-xl font-bold text-green-600">{importResult.success}</span>
                                                            <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Success</span>
                                                        </div>
                                                        <div className="bg-white/60 p-2 rounded text-center shadow-sm">
                                                            <span className="block text-xl font-bold text-red-500">{importResult.failed}</span>
                                                            <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Failed</span>
                                                        </div>
                                                    </div>

                                                    {importResult.failed > 0 && importResult.errors && importResult.errors.length > 0 && (
                                                        <div className="mt-4 text-sm text-red-700 bg-white/50 p-3 rounded-md border border-red-100 shadow-sm">
                                                            <p className="font-semibold mb-2 text-red-800">Error Details:</p>
                                                            <ul className="list-disc pl-5 space-y-1">
                                                                {importResult.errors.slice(0, 5).map((err, i) => (
                                                                    <li key={i}>Row {err.row}: <span className="font-medium">{err.email || 'N/A'}</span> - {err.message}</li>
                                                                ))}
                                                                {importResult.errors.length > 5 && (
                                                                    <li className="text-red-500 italic mt-2">...and {importResult.errors.length - 5} more errors</li>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {importResult.success > 0 && importResult.successRows && importResult.successRows.length > 0 && (
                                                        <div className="mt-4 text-sm text-green-700 bg-white/50 p-3 rounded-md border border-green-100 shadow-sm max-h-48 overflow-y-auto">
                                                            <p className="font-semibold mb-2 text-green-800">Successfully Imported (Auto-generated Data):</p>
                                                            <table className="w-full text-left border-collapse">
                                                                <thead>
                                                                    <tr className="border-b border-green-200">
                                                                        <th className="py-1 px-2 font-semibold">Row</th>
                                                                        <th className="py-1 px-2 font-semibold">Email</th>
                                                                        <th className="py-1 px-2 font-semibold">MSSV</th>
                                                                        <th className="py-1 px-2 font-semibold">Password</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {importResult.successRows.map((row, i) => (
                                                                        <tr key={i} className="border-b border-green-50/50">
                                                                            <td className="py-1 px-2">{row.row}</td>
                                                                            <td className="py-1 px-2 truncate max-w-[150px]" title={row.email}>{row.email}</td>
                                                                            <td className="py-1 px-2 font-mono text-xs font-bold">{row.studentCode}</td>
                                                                            <td className="py-1 px-2 font-mono text-xs">{row.defaultPassword}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {importType === 'STUDENTS' && (
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">Enrollment Year (Optional)</label>
                                                <input 
                                                    type="number" 
                                                    value={enrollmentYear} 
                                                    onChange={e => setEnrollmentYear(e.target.value)} 
                                                    placeholder="e.g. 2026 (Defaults to current year)" 
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
                                                />
                                                <p className="text-xs text-gray-500">Used to generate the first 2 digits of the MSSV.</p>
                                            </div>
                                        )}

                                        <label
                                            htmlFor="excel-upload"
                                            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <UploadCloud className={`w-10 h-10 mb-3 ${file ? 'text-blue-500' : 'text-gray-400'}`} />
                                                {file ? (
                                                    <>
                                                        <p className="mb-2 text-sm font-semibold text-blue-700">{file.name}</p>
                                                        <p className="text-xs text-blue-500">Ready to upload</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold text-gray-700">Click to upload</span> or drag and drop</p>
                                                        <p className="text-xs text-gray-400">Excel files only (.xlsx, .xls)</p>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                id="excel-upload"
                                                type="file"
                                                accept=".xlsx, .xls"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleImport}
                                            disabled={!file || uploading}
                                            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {uploading ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Importing...
                                                </>
                                            ) : (
                                                'Import Users'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'faculties' && isAdmin && <FacultiesTab />}
                    {activeTab === 'majors' && isAdmin && <MajorsTab />}
                    {activeTab === 'homerooms' && isAdmin && <HomeroomsTab />}
                    {activeTab === 'courses' && isAdmin && <CoursesTab />}
                    {activeTab === 'classes' && isAdmin && <ClassesTab />}
                    {activeTab === 'schedule' && <ScheduleTab />}
                    {activeTab === 'attendance' && <AttendanceTab />}

                </div>
            </main>
        </div>
    );
}
