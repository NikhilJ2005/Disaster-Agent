// src/components/Feedback.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Star } from 'lucide-react';

const Feedback = () => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedbackStatus({ type: '', message: '' });

    try {
      await axios.post('http://127.0.0.1:5000/feedback', {
        rating,
        feedback: comment.trim()
      });
      setComment('');
      setRating(5);
      setFeedbackStatus({
        type: 'success',
        message: 'Thank you for your feedback!'
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedbackStatus({
        type: 'error',
        message: 'Failed to submit feedback. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = () => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      return (
        <button
          key={index}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none"
          aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
        >
          <Star
            className={`w-8 h-8 ${
              starValue <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } transition-colors duration-200`}
          />
        </button>
      );
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md mt-4 md:mt-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Feedback</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Rating
          </label>
          <div className="flex space-x-2">
            {renderStars()}
          </div>
        </div>

        <div className="space-y-2">
          <label 
            htmlFor="comment" 
            className="block text-sm font-medium text-gray-700"
          >
            Comments
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you think..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={4}
            required
          />
        </div>

        {feedbackStatus.message && (
          <div
            className={`p-3 rounded-md ${
              feedbackStatus.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {feedbackStatus.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !comment.trim()}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};

export default Feedback;
