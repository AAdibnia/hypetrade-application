import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface LoginFormProps {
  onLogin: (email: string, password: string, remember: boolean) => boolean;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (validateForm()) {
      const ok = onLogin(email, password, remember);
      if (!ok) {
        setFormError('Invalid email or password');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-6">Log In</h2>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
                              className={`bg-gray-100 border border-gray-200 text-black placeholder:text-gray-400 h-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>
        </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
                          className={`bg-gray-100 border border-gray-200 text-black placeholder:text-gray-400 h-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${errors.password ? 'border-red-500' : ''}`}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span>Remember me</span>
        </label>
        <span className="text-xs text-gray-500">Private device only</span>
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-2">
          {formError}
        </div>
      )}

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8">
        Log In
      </Button>
      </form>
    </div>
  );
}
