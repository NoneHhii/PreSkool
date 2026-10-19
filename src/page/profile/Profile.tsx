import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Save, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { userService, type UserProfile, type UpdateProfileRequest } from '../../services/user.service';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Avatar from '../../components/ui/Avatar';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Form states
  const [formData, setFormData] = useState<UpdateProfileRequest>({});
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  // Status states
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await userService.getMe();
      setProfile(res.data);
      if (res.data.profile) {
        setFormData({
          fullName: res.data.profile.fullName || '',
          phone: res.data.profile.phone || '',
          dateOfBirth: res.data.profile.dateOfBirth ? res.data.profile.dateOfBirth.substring(0, 10) : '',
          gender: res.data.profile.gender || 'MALE',
          address: res.data.profile.address || '',
          avatarUrl: res.data.profile.avatarUrl || '',
        });
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        navigate('/');
      }
      setMessage({ type: 'error', text: 'Không thể tải thông tin hồ sơ.' });
    }
  };

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await userService.updateProfile(formData);
      setProfile(res.data);
      setMessage({ type: 'success', text: 'Cập nhật hồ sơ cá nhân thành công!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Cập nhật thất bại.' });
    } finally {
      setIsSaving(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới xác nhận không khớp!' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      await userService.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Không thể đổi mật khẩu.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <DashboardLayout activeTab="profile" onSelectTab={(tab) => navigate(`/dashboard?tab=${tab}`)}>
        <div className="py-20 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeTab="profile"
      onSelectTab={(tab) => navigate(`/dashboard?tab=${tab}`)}
    >
      <div className="space-y-6">
        <PageHeader
          title="Hồ Sơ & Cài Đặt Tài Khoản"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Settings' },
            { label: 'My Profile' },
          ]}
          onRefresh={fetchProfile}
        />

        {message && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 border shadow-xs animate-in fade-in ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <p className="text-xs font-medium">{message.text}</p>
          </div>
        )}

        <div className="rounded-xl border border-gray-100 bg-white shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4">
            {/* Sidebar Navigation */}
            <div className="border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 p-6">
              <nav className="flex md:flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Thông Tin Cá Nhân</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Lock className="h-4 w-4" />
                  <span>Bảo Mật & Mật Khẩu</span>
                </button>
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="md:col-span-3 p-6 sm:p-8">
              {activeTab === 'profile' && (
                <form onSubmit={submitProfile} className="space-y-6 animate-in fade-in">
                  <div className="flex items-center gap-5 pb-6 border-b border-gray-100">
                    <Avatar
                      src={formData.avatarUrl}
                      name={profile?.profile?.fullName || profile?.username}
                      size="xl"
                      status="online"
                    />
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{profile?.profile?.fullName || profile?.username}</h3>
                      <p className="text-xs text-gray-500">{profile?.email}</p>
                      <span className="mt-1 inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        <ShieldCheck className="h-3 w-3" />
                        {profile?.role}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Họ và Tên</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName || ''}
                        onChange={handleProfileChange}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Số Điện Thoại</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleProfileChange}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                        placeholder="0912345678"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Ngày Sinh</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth || ''}
                        onChange={handleProfileChange}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Giới Tính</label>
                      <select
                        name="gender"
                        value={formData.gender || 'MALE'}
                        onChange={handleProfileChange}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                      >
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Địa Chỉ</label>
                      <textarea
                        name="address"
                        value={formData.address || ''}
                        onChange={handleProfileChange}
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none resize-none focus:border-blue-500 focus:bg-white"
                        placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      isLoading={isSaving}
                      leftIcon={<Save className="h-4 w-4" />}
                    >
                      Lưu Thay Đổi
                    </Button>
                  </div>
                </form>
              )}

              {activeTab === 'security' && (
                <form onSubmit={submitPassword} className="space-y-4 max-w-md animate-in fade-in">
                  <div className="pb-3 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900">Thay Đổi Mật Khẩu</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Để bảo vệ tài khoản, vui lòng đặt mật khẩu có độ dài tối thiểu 6 ký tự.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Mật Khẩu Hiện Tại *</label>
                    <input
                      type="password"
                      name="oldPassword"
                      required
                      minLength={6}
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Mật Khẩu Mới *</label>
                    <input
                      type="password"
                      name="newPassword"
                      required
                      minLength={6}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Xác Nhận Mật Khẩu Mới *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      minLength={6}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      isLoading={isSaving}
                      leftIcon={<Lock className="h-4 w-4" />}
                    >
                      Cập Nhật Mật Khẩu
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
