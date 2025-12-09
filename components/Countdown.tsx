'use client';

import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: string;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'yellow' | 'white';
}

export default function Countdown({ 
  targetDate, 
  onComplete, 
  size = 'md',
  color = 'purple' 
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      } else {
        if (onComplete) onComplete();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const sizeClasses = {
    sm: {
      container: 'text-2xl',
      box: 'w-12 h-12 text-lg',
      label: 'text-xs',
    },
    md: {
      container: 'text-3xl',
      box: 'w-16 h-16 text-2xl',
      label: 'text-sm',
    },
    lg: {
      container: 'text-4xl',
      box: 'w-20 h-20 text-3xl',
      label: 'text-base',
    },
  };

  const colorClasses = {
    purple: {
      bg: 'bg-purple',
      text: 'text-white-600',
      label: 'text-purple-400',
    },
    yellow: {
      bg: 'bg-yellow-400',
      text: 'text-gray-900',
      label: 'text-yellow-600',
    },
    white: {
      bg: 'bg-white/20',
      text: 'text-white',
      label: 'text-white/80',
    },
  };

  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];

  return (
    <div className={`flex items-center space-x-3 ${sizeClass.container}`}>
      {/* Days */}
      <div className="text-center">
        <div className={`${sizeClass.box} ${colorClass.bg} rounded-lg flex items-center justify-center font-bold ${colorClass.text} shadow-lg`}>
          {String(timeLeft.days).padStart(2, '0')}
        </div>
        <p className={`${sizeClass.label} ${colorClass.label} font-semibold mt-1`}>Days</p>
      </div>

      {/* Hours */}
      <div className="text-center">
        <div className={`${sizeClass.box} ${colorClass.bg} rounded-lg flex items-center justify-center font-bold ${colorClass.text} shadow-lg`}>
          {String(timeLeft.hours).padStart(2, '0')}
        </div>
        <p className={`${sizeClass.label} ${colorClass.label} font-semibold mt-1`}>Hours</p>
      </div>

      {/* Minutes */}
      <div className="text-center">
        <div className={`${sizeClass.box} ${colorClass.bg} rounded-lg flex items-center justify-center font-bold ${colorClass.text} shadow-lg`}>
          {String(timeLeft.minutes).padStart(2, '0')}
        </div>
        <p className={`${sizeClass.label} ${colorClass.label} font-semibold mt-1`}>Mins</p>
      </div>

      {/* Seconds */}
      <div className="text-center">
        <div className={`${sizeClass.box} ${colorClass.bg} rounded-lg flex items-center justify-center font-bold ${colorClass.text} shadow-lg animate-pulse`}>
          {String(timeLeft.seconds).padStart(2, '0')}
        </div>
        <p className={`${sizeClass.label} ${colorClass.label} font-semibold mt-1`}>Secs</p>
      </div>
    </div>
  );
}

