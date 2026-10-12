import React, { useState } from 'react';
import { FileSpreadsheet, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { userService, type ImportResponse } from '../../../services/user.service';

const ImportUsersTab: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<'STUDENTS' | 'TEACHERS'>('STUDENTS');
    const [enrollmentYear, setEnrollmentYear] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [importResult, setImportResult] = useState<ImportResponse | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
            const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (error: any) {
            console.error('Import error:', error);
            setErrorMsg(error.response?.data?.message || 'Failed to import users. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-3xl">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-green-600" />
                            Bulk Import {importType === 'STUDENTS' ? 'Students' : 'Teachers'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 max-w-lg">
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
                                                        <th className="py-1 px-2 font-semibold">MSSV/MSGV</th>
                                                        <th className="py-1 px-2 font-semibold">Password</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {importResult.successRows.map((row, i) => (
                                                        <tr key={i} className="border-b border-green-50/50">
                                                            <td className="py-1 px-2">{row.row}</td>
                                                            <td className="py-1 px-2 truncate max-w-[150px]" title={row.email}>{row.email}</td>
                                                            <td className="py-1 px-2 font-mono text-xs font-bold">{row.studentCode || row.teacherCode}</td>
                                                            <td className="py-1 px-2 font-mono text-xs">{row.defaultPassword || 'N/A'}</td>
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
    );
};

export default ImportUsersTab;
