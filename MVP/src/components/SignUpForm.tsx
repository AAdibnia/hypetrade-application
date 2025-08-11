import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface SignUpFormProps {
  onSignUp: (email: string, password: string) => void;
}

export function SignUpForm({ onSignUp }: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string 
  }>({});

  const validateForm = () => {
    const newErrors: { 
      email?: string; 
      password?: string; 
      confirmPassword?: string 
    } = {};

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

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSignUp(email, password);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-6">Sign Up</h2>
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
          placeholder="Enter your password (8+ characters)"
                          className={`bg-gray-100 border border-gray-200 text-black placeholder:text-gray-400 h-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${errors.password ? 'border-red-500' : ''}`}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
                          className={`bg-gray-100 border border-gray-200 text-black placeholder:text-gray-400 h-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${errors.confirmPassword ? 'border-red-500' : ''}`}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8">
        Sign Up
      </Button>
      </form>
    </div>
  );
}
