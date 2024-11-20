// src/components/SystemHealth.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ActivitySquare, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const SystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://127.0.0.1:5000/system/health');
      setHealth(response.data);
    } catch (error) {
      console.error('Error checking system health:', error);
      setError('Failed to fetch system health status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    return status === 'healthy' ? 'text-green-500' : 'text-red-500';
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <ActivitySquare className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">System Health</h2>
        <button
          onClick={checkHealth}
          className="p-2 hover:bg-gray-100 rounded-full transition"
          title="Refresh"
        >
          <RefreshCw className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center">
          <XCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      ) : (
        health && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-md shadow">
                <div className="text-sm text-gray-500">API Status</div>
                <div className={`flex items-center ${getStatusColor(health.status)}`}>
                  {health.status === 'healthy' ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 mr-2" />
                  )}
                  {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md shadow">
                <div className="text-sm text-gray-500">MongoDB Status</div>
                <div className={`flex items-center ${health.mongodb_status === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
                  {health.mongodb_status === 'connected' ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 mr-2" />
                  )}
                  {health.mongodb_status.charAt(0).toUpperCase() + health.mongodb_status.slice(1)}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 mt-4">
              Last updated: {new Date(health.timestamp).toLocaleString()}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default SystemHealth;
