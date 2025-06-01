
import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

// WARNING: This is a MOCK login for frontend demonstration ONLY.
// DO NOT use this in a production environment. Real authentication requires a secure backend.
const MOCK_USERNAME = 'admin';
const MOCK_PASSWORD = 'password';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username === MOCK_USERNAME && password === MOCK_PASSWORD) {
      onLoginSuccess();
    } else {
      setError('Invalid username or password. (Hint: admin/password)');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 p-4">
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Admin Login</h1>
        {error && (
          <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm mb-6 text-center" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Username"
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Enter your username"
            autoComplete="username"
          />
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          <Button type="submit" variant="primary" size="lg" className="w-full">
            Login
          </Button>
        </form>
        <p className="text-xs text-gray-500 mt-6 text-center">
          This is a simulated login for demonstration purposes.
        </p>
      </div>
    </div>
  );
};
