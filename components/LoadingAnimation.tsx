import React from 'react';

interface LoadingAnimationProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  className = "", 
  size = "md",
  color = "bg-blue-600 dark:bg-blue-500"
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          ${color}
          animate-morphing-loader
        `}
      />
      <style>{`
        @keyframes morphing-loader {
          0% {
            border-radius: 50%;
            transform: rotate(0deg) scale(1);
          }
          25% {
            border-radius: 10%;
            transform: rotate(90deg) scale(1.1);
          }
          50% {
            border-radius: 50%;
            transform: rotate(180deg) scale(1);
          }
          75% {
            border-radius: 10%;
            transform: rotate(270deg) scale(1.1);
          }
          100% {
            border-radius: 50%;
            transform: rotate(360deg) scale(1);
          }
        }
        .animate-morphing-loader {
          animation: morphing-loader 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
