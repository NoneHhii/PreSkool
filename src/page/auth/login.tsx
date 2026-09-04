import React from 'react';
import { LoginForm } from '../../components/common/LoginForm.tsx';
import banner from "../../assets/images/banner_side_login.png";

const LoginPage: React.FC = () => {
  return (
    <main className="relative min-h-screen w-full bg-white flex flex-col justify-between overflow-hidden">
      {/* Container chính: 2 cột trên Desktop (md:), 1 cột trên Mobile */}
      <div className="grid min-h-[calc(100vh-60px)] w-full grid-cols-1 md:grid-cols-2">
        
        {/* Banner minh hoạ bên trái (ẩn trên Mobile) */}
        <div className="relative hidden min-h-[80vh] md:flex md:min-h-0">
          <img
            src={banner}
            alt="Authentication Illustration"
            className="absolute inset-0 h-full w-full object-cover object-top-left"
          />
        </div>

        {/* Form đăng nhập bên phải */}
        <div className="flex flex-col items-center justify-center p-6 md:p-12">
          {/* Brand Logo */}
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-tr from-blue-500 to-sky-400 text-white font-bold text-base shadow-sm">
              <span className="-rotate-12">📘</span>
            </div>
            <span className="text-2xl font-bold text-gray-800 tracking-tight">
              Pre<span className="font-semibold text-gray-900">Skool</span>
            </span>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}

export default LoginPage;