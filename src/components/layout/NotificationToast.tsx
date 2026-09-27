import React from 'react';
import { useData } from '../../context/DataContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notifications, dismissNotification } = useData();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map(n => {
        const getIcon = () => {
          switch (n.type) {
            case 'success':
              return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
            case 'error':
              return <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />;
            case 'warning':
              return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />;
            default:
              return <Info className="h-4 w-4 text-teal-400 shrink-0" />;
          }
        };

        const getBorderColor = () => {
          switch (n.type) {
            case 'success': return 'border-emerald-600/40 bg-slate-900/95';
            case 'error': return 'border-rose-600/40 bg-slate-900/95';
            case 'warning': return 'border-amber-600/40 bg-slate-900/95';
            default: return 'border-teal-600/40 bg-slate-900/95';
          }
        };

        return (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-md transition-all ${getBorderColor()}`}
          >
            {getIcon()}
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-slate-100">{n.title}</h4>
              <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{n.message}</p>
            </div>
            <button
              onClick={() => dismissNotification(n.id)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
