// src/components/Tasks.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Circle, Trash2, Plus, Loader } from 'lucide-react';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/tasks');
      // Assuming response.data is an array of tasks
      const formattedTasks = response.data.map(task => ({
        id: task.task_id, // mapping 'task_id' to 'id'
        title: task.description, // mapping 'description' to 'title'
        completed: task.status === 'completed' // mapping 'status' to 'completed'
      }));
      setTasks(formattedTasks);
    } catch (error) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const response = await axios.post('http://127.0.0.1:5000/tasks', {
        description: newTask,
        status: 'pending' // assuming backend expects 'description' and 'status'
      });
      const newTaskFormatted = {
        id: response.data.task_id,
        title: response.data.description,
        completed: response.data.status === 'completed'
      };
      setTasks([...tasks, newTaskFormatted]);
      setNewTask('');
    } catch (error) {
      setError('Failed to add task');
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const newStatus = task.completed ? 'pending' : 'completed';
      const response = await axios.patch(`http://127.0.0.1:5000/tasks/${taskId}`, {
        status: newStatus
      });
      const updatedTask = {
        id: response.data.task_id,
        title: response.data.description,
        completed: response.data.status === 'completed'
      };
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    } catch (error) {
      setError('Failed to update task');
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      setError('Failed to delete task');
      console.error('Error deleting task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 mt-4 md:mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Tasks</h2>

      <form onSubmit={addTask} className="mb-4 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5 mr-1" />
          Add
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-md ${
            filter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          } transition`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1 rounded-md ${
            filter === 'active' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          } transition`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1 rounded-md ${
            filter === 'completed' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          } transition`}
        >
          Completed
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center text-gray-500">No tasks to display.</div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3">
                <button onClick={() => toggleTask(task.id)} className="focus:outline-none">
                  {task.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                  {task.title}
                </span>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-red-500 hover:text-red-700 focus:outline-none"
                title="Delete Task"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
