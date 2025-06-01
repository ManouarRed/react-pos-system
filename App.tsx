
import React, { useState, useEffect } from 'react';
import { POSForm } from './components/POSForm';
import { AdminPage } from './components/admin/AdminPage';
import { Button } from './components/common/Button';
import { LoginPage } from './components/auth/LoginPage'; // New Login Page

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'pos' | 'admin'>('pos');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Default to false

  // Check for saved auth state (e.g., from localStorage - very basic, not secure)
  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true'); // Persist very basically
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    setCurrentView('pos'); // Redirect to POS or login after logout
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-indigo-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {currentView === 'pos' ? 'Point of Sale System' : 'Admin Panel'}
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setCurrentView('pos')}
              variant={currentView === 'pos' ? 'primary' : 'ghost'}
              className={`mr-2 ${currentView === 'pos' ? 'bg-indigo-500' : 'hover:bg-indigo-600 text-indigo-100'}`}
            >
              POS
            </Button>
            <Button
              onClick={() => setCurrentView('admin')}
              variant={currentView === 'admin' ? 'primary' : 'ghost'}
              className={`${currentView === 'admin' ? 'bg-indigo-500' : 'hover:bg-indigo-600 text-indigo-100'}`}
            >
              Admin
            </Button>
            <Button
              onClick={handleLogout}
              variant="danger"
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4 mt-4">
        <main>
          {currentView === 'pos' && <POSForm />}
          {currentView === 'admin' && <AdminPage />}
        </main>
      </div>

      <footer className="text-center mt-12 py-6 border-t border-gray-300 bg-white">
        <p className="text-sm text-gray-600">&copy; 2024 POS & Admin System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
