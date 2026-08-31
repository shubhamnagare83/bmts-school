import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { Lock, Mail } from 'lucide-react';
import apiClient from '@/api/client';
import motherTeresaPhoto from '@/assets/mother_teresa_hq.webp';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await apiClient.post('/auth/login', {
        login: loginInput,
        password,
      });

      if (res.data.success) {
        const { user, accessToken, token } = res.data.data;
        const jwt = accessToken || token;

        login(
          {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            name: user.name || user.username,
          },
          jwt
        );

        toast.success(`Welcome back, ${user.username}!`);

        // Redirect based on role
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'FACULTY') navigate('/faculty');
        else navigate('/student');
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        'Invalid credentials. Please check your username and password.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-950 via-[#001f3f] to-slate-900">
      <Card className="w-full max-w-lg shadow-2xl border border-slate-700/50 rounded-2xl overflow-hidden bg-white">
        {/* Official School Header matching requested format */}
        <div className="bg-[#002244] text-white p-6 text-center relative overflow-hidden border-b-4 border-amber-400 shadow-md">
          {/* Subtle background glow */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Mother Teresa Photo in Circular Frame */}
          <div className="flex justify-center mb-3 relative">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-white to-amber-300 shadow-xl overflow-hidden">
              <img 
                src={motherTeresaPhoto} 
                alt="Mother Teresa" 
                className="w-full h-full object-cover rounded-full bg-white shadow-inner"
              />
            </div>
          </div>

          {/* Tagline */}
          <p className="text-amber-300 font-serif italic text-xs tracking-wider mb-1">
            — Human Resource Development Center's —
          </p>

          {/* Bharat Ratna */}
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-serif tracking-wide drop-shadow-sm">
            Bharat Ratna
          </h2>

          {/* School Main Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-sans mt-0.5 leading-tight drop-shadow-md">
            MOTHER TERESA ENGLISH SCHOOL
          </h1>

          {/* Yellow Address Badge */}
          <div className="inline-block mt-3 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-bold px-4 py-1 rounded-full shadow text-xs sm:text-[13px] border border-amber-500 tracking-wide">
            Gangapur Dist.Chha.Sambhajinagar - 431109
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <CardContent className="space-y-4 pt-2">
            <div className="text-center pb-2">
              <h3 className="text-lg font-bold text-slate-800">School Portal Sign In</h3>
              <p className="text-xs text-slate-500">Enter your credentials to access the portal</p>
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email address"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              required
              iconPrefix={<Mail className="h-4 w-4 text-slate-400" />}
              className="h-11 text-sm"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              iconPrefix={<Lock className="h-4 w-4 text-slate-400" />}
              className="h-11 text-sm"
            />
          </CardContent>

          <CardFooter className="pt-4 flex-col gap-2">
            <Button type="submit" className="w-full h-11 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all" isLoading={isLoading}>
              Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;


