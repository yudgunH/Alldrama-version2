import React from 'react';

interface NotFoundMessageProps {
  message: string;
  description: string;
}

export default function NotFoundMessage({ message, description }: NotFoundMessageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h1 className="text-2xl text-white font-bold">{message}</h1>
      <p className="text-gray-400 mt-4">{description}</p>
    </div>
  );
}
