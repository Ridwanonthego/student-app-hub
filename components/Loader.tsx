
import React from 'react';

const Loader: React.FC<{ text?: string; className?: string }> = ({ text = "Loading...", className = "border-lime-400" }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className={`w-12 h-12 rounded-full animate-spin border-4 border-solid ${className} border-t-transparent`}></div>
      <p className="text-slate-400 font-mono">{text}</p>
    </div>
  );
};

export default Loader;
