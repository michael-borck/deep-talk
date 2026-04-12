import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react';

interface CollapsibleProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}

/**
 * A reusable collapsible section, used to hide advanced/optional settings
 * behind a single click. Closed by default to reduce overwhelm for new users.
 */
export const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  description,
  defaultOpen = false,
  icon: Icon = Wrench,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="card-static overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className="text-surface-500 flex-shrink-0" />
          <div>
            <h3 className="section-title">{title}</h3>
            {description && (
              <p className="text-xs text-surface-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-surface-400">
          <span className="text-xs">{isOpen ? 'Hide' : 'Show'}</span>
          {isOpen
            ? <ChevronDown size={16} />
            : <ChevronRight size={16} />
          }
        </div>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-surface-100">
          {children}
        </div>
      )}
    </div>
  );
};
