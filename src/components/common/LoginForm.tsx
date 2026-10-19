import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputField } from './InputField';
// import { SocialLogin } from './SocialLogin';
import { authService } from '../../services/auth.service';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(email, password);

      if (response.data?.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          alert(`Login successful! Welcome ${response.data.user.role || 'User'}.`);
        } else {
          alert('Login successful!');
        }
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-[0_4px_25px_rgba(0,0,0,0.05)] border border-gray-50">
      <h2 className="text-xl font-bold text-gray-900">Welcome</h2>
      <p className="mt-1 text-xs text-gray-500 my-5">Please enter your details to sign in</p>

      {/* Social Buttons */}
      {/* <div className="mt-5">
        <SocialLogin />
      </div> */}

      {/* Divider */}
      {/* <div className="my-5 flex items-center">
        <div className="grow border-t border-gray-200"></div>
        <span className="mx-3 text-[11px] font-medium tracking-wider text-gray-400 uppercase">OR</span>
        <div className="grow border-t border-gray-200"></div>
      </div> */}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <InputField
          label="Tài khoản (Email / Username / MSSV)"
          type="text"
          placeholder="admin, hung.nv, 26107002..."
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />

        <InputField
          label="Password"
          isPassword
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        />

        {/* Options */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600">Remember Me</span>
          </label>
          <a href="#" className="text-xs text-rose-500 hover:underline">
            Forgot Password?
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[#4e73df] py-2.5 text-xs font-semibold text-white transition hover:bg-[#3e63cf] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
        >
          {loading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        {/* Demo Quick Fill */}
        <div className="pt-3 border-t border-gray-100">
          <p className="text-[11px] font-semibold text-gray-500 mb-2">Tài khoản mẫu để test nhanh:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('admin');
                setPassword('adminpassword123');
              }}
              className="rounded-md border border-gray-200 bg-gray-50/80 py-1.5 px-2 text-center text-[11px] font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition cursor-pointer"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('hung.nv');
                setPassword('Teacher@123');
              }}
              className="rounded-md border border-gray-200 bg-gray-50/80 py-1.5 px-2 text-center text-[11px] font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition cursor-pointer"
            >
              Giảng viên
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('26107002');
                setPassword('05092008');
              }}
              className="rounded-md border border-gray-200 bg-gray-50/80 py-1.5 px-2 text-center text-[11px] font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition cursor-pointer"
            >
              Sinh viên
            </button>
          </div>
        </div>
      </form>

      {/* Footer link */}
      {/* <p className="mt-5 text-center text-xs text-gray-500">
        Don't have an account?{' '}
        <a href="#" className="font-semibold text-blue-600 hover:underline">
          Create Account
        </a>
      </p> */}
    </div>
  );
};