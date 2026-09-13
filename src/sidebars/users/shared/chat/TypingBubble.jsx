import React from "react";

/** WhatsApp-style typing bubble (left side) */
export function TypingBubble({ name }) {
  return (
    <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="inline-flex items-center gap-2 bg-white border border-slate-200/80 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm">
        <div className="flex items-center gap-1 h-3">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-duration:0.9s] [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-duration:0.9s] [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-duration:0.9s]" />
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          {name ? `${name} is typing` : "typing"}
        </span>
      </div>
    </div>
  );
}

/** Compact connection pill for chat headers */
export function ChatConnectionPill({ isConnected }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
        isConnected
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-amber-50 text-amber-700 border border-amber-200"
      }`}
      title={isConnected ? "Realtime connected" : "Connecting… messages may delay"}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
        }`}
      />
      {isConnected ? "Live" : "Connecting"}
    </span>
  );
}

export default TypingBubble;
