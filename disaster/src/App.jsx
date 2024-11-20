// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MessageSquare, ListTodo, Activity, MessageCircle } from 'lucide-react';
import Chat from './components/Chat';
import Tasks from './components/Tasks';
import SystemHealth from './components/SystemHealth';
import Feedback from './components/Feedback';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { to: '/', icon: <MessageSquare size={20} />, label: 'Chat' },
    { to: '/tasks', icon: <ListTodo size={20} />, label: 'Tasks' },
    { to: '/health', icon: <Activity size={20} />, label: 'System Health' },
    { to: '/feedback', icon: <MessageCircle size={20} />, label: 'Feedback' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white p-4 hidden md:block">
      <h1 className="text-xl font-bold mb-8">Disaster Prep Assistant</h1>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-800 ${
              location.pathname === item.to ? 'bg-gray-800' : ''
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="h-screen flex flex-col md:flex-row">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 bg-gray-50 overflow-auto">
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/health" element={<SystemHealth />} />
            <Route path="/feedback" element={<Feedback />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
