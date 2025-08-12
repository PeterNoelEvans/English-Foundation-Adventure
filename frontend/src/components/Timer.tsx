import React, { useState, useEffect } from 'react';

interface TimerProps {
  duration: number; // Duration in minutes
  onTimeUp?: () => void;
  showMotivational?: boolean;
  className?: string;
}

const Timer: React.FC<TimerProps> = ({ 
  duration, 
  onTimeUp, 
  showMotivational = true,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert to seconds
  const [isActive, setIsActive] = useState(true);
  const [motivationalMessage, setMotivationalMessage] = useState('');

  // Motivational messages based on time remaining
  const getMotivationalMessage = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const percentage = (seconds / (duration * 60)) * 100;

    if (percentage > 80) {
      return "Great start! You've got plenty of time! 🚀";
    } else if (percentage > 60) {
      return "Keep going! You're doing well! 💪";
    } else if (percentage > 40) {
      return "Halfway there! Stay focused! 🎯";
    } else if (percentage > 20) {
      return "Almost there! Don't give up! ⭐";
    } else if (percentage > 10) {
      return "Final push! You can do it! 🔥";
    } else if (percentage > 5) {
      return "Last few minutes! Finish strong! 💎";
    } else {
      return "Time's almost up! Quick finish! ⏰";
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          const newTime = prevTime - 1;
          
          // Update motivational message
          if (showMotivational) {
            setMotivationalMessage(getMotivationalMessage(newTime));
          }

          // Handle time up
          if (newTime <= 0) {
            setIsActive(false);
            if (onTimeUp) {
              onTimeUp();
            }
            return 0;
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, timeLeft, onTimeUp, showMotivational, duration]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color based on time remaining
  const getTimerColor = () => {
    const percentage = (timeLeft / (duration * 60)) * 100;
    
    if (percentage > 60) return 'text-green-600';
    if (percentage > 30) return 'text-yellow-600';
    if (percentage > 10) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get timer background color
  const getTimerBgColor = () => {
    const percentage = (timeLeft / (duration * 60)) * 100;
    
    if (percentage > 60) return 'bg-green-100 border-green-300';
    if (percentage > 30) return 'bg-yellow-100 border-yellow-300';
    if (percentage > 10) return 'bg-orange-100 border-orange-300';
    return 'bg-red-100 border-red-300';
  };

  return (
    <div className={`timer-container ${className}`}>
      {/* Main Timer Display */}
      <div className={`timer-display ${getTimerBgColor()} border-2 rounded-lg p-4 mb-3 transition-all duration-300`}>
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Time Remaining</div>
          <div className={`text-4xl font-bold ${getTimerColor()} font-mono`}>
            {formatTime(timeLeft)}
          </div>
          {timeLeft <= 0 && (
            <div className="text-red-600 font-semibold mt-2">
              ⏰ Time's Up!
            </div>
          )}
        </div>
      </div>

      {/* Motivational Message */}
      {showMotivational && motivationalMessage && (
        <div className="motivational-message text-center mb-4">
          <div className="text-lg font-medium text-gray-700">
            {motivationalMessage}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-container mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(((duration * 60 - timeLeft) / (duration * 60)) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              (timeLeft / (duration * 60)) > 0.6 ? 'bg-green-500' :
              (timeLeft / (duration * 60)) > 0.3 ? 'bg-yellow-500' :
              (timeLeft / (duration * 60)) > 0.1 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${((duration * 60 - timeLeft) / (duration * 60)) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="timer-controls text-center">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isActive 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isActive ? '⏸️ Pause' : '▶️ Resume'}
        </button>
      </div>
    </div>
  );
};

export default Timer; 