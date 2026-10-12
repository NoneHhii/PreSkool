import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Layout Components
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

// Tab Components
import Overview from './Overview';
import ComingSoon from './ComingSoon';
import ImportUsersTab from './components/ImportUsersTab';
import FacultiesTab from './components/FacultiesTab';
import MajorsTab from './components/MajorsTab';
import HomeroomsTab from './components/HomeroomsTab';
import CoursesTab from './components/CoursesTab';
import ClassesTab from './components/ClassesTab';
import ScheduleTab from './components/ScheduleTab';
import AttendanceTab from './components/AttendanceTab';

// Advanced ERP Subsystem Tabs
import StudentDirectoryTab from './components/StudentDirectoryTab';
import RegistrationTab from './components/RegistrationTab';
import ExaminationTab from './components/ExaminationTab';
import TuitionTab from './components/TuitionTab';
import StudentAffairsTab from './components/StudentAffairsTab';
import LmsTab from './components/LmsTab';
import AdvisorTab from './components/AdvisorTab';

export default function Dashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState<any>(null);

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

    if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    const isAdmin = user.role === 'ADMIN';

    // Format tab name for header
    const formatTabName = (tabId: string) => {
        if (tabId === 'overview') return 'Dashboard Overview';
        if (tabId === 'import') return 'Import Users';
        if (tabId === 'directory') return 'Student Directory';
        if (tabId === 'registration') return 'Course Registration';
        if (tabId === 'exams') return 'Exams & Grading';
        if (tabId === 'tuition') return 'Tuition & Fees';
        if (tabId === 'affairs') return 'Student Affairs & Services';
        if (tabId === 'lms') return 'LMS & E-Learning';
        if (tabId === 'courses') return 'Courses & Curriculum (Môn học)';
        if (tabId === 'homerooms') return 'Homeroom Classes (Lớp sinh hoạt)';
        if (tabId === 'classes') return 'Course Classes (Lớp học phần)';
        if (tabId === 'faculties') return 'Faculties & Majors (Khoa & Ngành)';
        return tabId.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase());
    };

    // Render active tab content
    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <Overview user={user} />;

            // Existing functional tabs (Admin)
            case 'import':
                return isAdmin ? <ImportUsersTab /> : <ComingSoon title="Access Denied" />;
            case 'faculties':
                return isAdmin ? <FacultiesTab /> : <ComingSoon title="Access Denied" />;
            case 'majors':
                return isAdmin ? <MajorsTab /> : <ComingSoon title="Access Denied" />;
            case 'homerooms':
                return isAdmin ? <HomeroomsTab onNavigateTab={setActiveTab} /> : <ComingSoon title="Access Denied" />;
            case 'courses':
                return isAdmin ? <CoursesTab /> : <ComingSoon title="Access Denied" />;
            case 'classes':
                return isAdmin ? <ClassesTab /> : <ComingSoon title="Access Denied" />;

            // Existing functional tabs (All)
            case 'schedule':
                return <ScheduleTab />;
            case 'attendance':
                return <AttendanceTab />;
            case 'profile':
                return <ComingSoon title="My Profile" />;

            // Advanced ERP Subsystem Tabs
            case 'directory':
                return <StudentDirectoryTab user={user} />;
            case 'registration':
                return <RegistrationTab user={user} />;
            case 'exams':
            case 'grades':
                return <ExaminationTab user={user} />;
            case 'tuition':
                return <TuitionTab user={user} />;
            case 'affairs':
            case 'leaves':
                return <StudentAffairsTab user={user} />;
            case 'lms':
            case 'learning':
            case 'assignments':
                return <LmsTab user={user} />;
            case 'advisor':
                return <AdvisorTab user={user} />;

            // Communication & Settings (future)
            case 'virtual':
            case 'discussions':
            case 'messages':
            case 'settings':
                return <ComingSoon title={formatTabName(activeTab)} />;

            default:
                return <ComingSoon title={formatTabName(activeTab)} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex h-screen overflow-hidden">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                handleLogout={handleLogout}
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header title={formatTabName(activeTab)} user={user} />

                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        {renderContent()}
                    </div>
                </div>
            </main>
        </div>
    );
}
