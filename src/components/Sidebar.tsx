import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Library, Settings, ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/library', icon: Library, label: 'Library' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className={`bg-gray-800 text-white h-full transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col`}>
      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            {!isCollapsed && <span className="ml-3 text-xl font-semibold">AudioScribe</span>}
          </div>
          <button
            onClick={() => onToggleCollapse(!isCollapsed)}
            className={`p-1 hover:bg-gray-700 rounded transition-colors ${isCollapsed ? 'mx-auto mt-2' : ''}`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} className={isCollapsed ? 'mx-auto' : ''} />
                  {!isCollapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section - version info */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed ? (
          <div className="text-xs text-gray-400">
            <p>AudioScribe v1.0.0</p>
            <p className="mt-1">© 2024</p>
          </div>
        ) : (
          <div title="AudioScribe v1.0.0">
            <Info size={16} className="mx-auto text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;