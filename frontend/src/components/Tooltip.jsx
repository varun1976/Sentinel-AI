import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export default function Tooltip({ text, title, children }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      {children || (
        <button
          type="button"
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          onClick={() => setShow(!show)}
          className="text-slate-500 hover:text-sky-400 transition-colors ml-1 focus:outline-none"
          aria-label="Information tooltip"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      )}

      {show && (
        <div className="absolute z-50 bottom-full mb-1.5 left-1/2 -translate-x-1/2 w-60 p-2.5 bg-[#121824] border border-slate-700/80 rounded text-xs text-slate-300 pointer-events-none transition-all shadow-xl font-normal leading-relaxed">
          {title && <div className="font-semibold text-sky-400 mb-0.5">{title}</div>}
          <p>{text}</p>
        </div>
      )}
    </div>
  );
}
