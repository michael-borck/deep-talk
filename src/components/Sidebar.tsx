import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Library, Settings, ChevronLeft, ChevronRight, Info, Upload, Search, Trash, Archive, MessageCircle, BookOpen, Keyboard, HelpCircle } from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  onAboutClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse, onAboutClick }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/upload', icon: Upload, label: 'Upload & Process' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/library', icon: Library, label: 'Library' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const dataItems = [
    { path: '/search', icon: Search, label: 'Search & Filter' },
    { path: '/chat-history', icon: MessageCircle, label: 'Chat History' },
    { path: '/trash', icon: Trash, label: 'Trash' },
    { path: '/archive', icon: Archive, label: 'Archive' },
  ];

  const helpItems = [
    { path: '/docs', icon: BookOpen, label: 'Documentation' },
    { path: '/shortcuts', icon: Keyboard, label: 'Keyboard Shortcuts' },
    { 
      path: 'https://michael-borck.github.io/deep-talk/troubleshooting', 
      icon: HelpCircle, 
      label: 'Help & Support',
      external: true
    },
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
            {!isCollapsed && <span className="ml-3 text-xl font-semibold">DeepTalk</span>}
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
      <nav className="flex-1 p-4 space-y-6">
        {/* Main Navigation */}
        <div>
          {!isCollapsed && <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Navigation</h3>}
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
        </div>

        {/* Data Management */}
        <div>
          {!isCollapsed && <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Data</h3>}
          <ul className="space-y-2">
            {dataItems.map((item) => {
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
        </div>

        {/* Help & Documentation */}
        <div>
          {!isCollapsed && <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Help</h3>}
          <ul className="space-y-2">
            {helpItems.map((item) => {
              const Icon = item.icon;
              if (item.external) {
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => window.open(item.path, '_blank')}
                      className="flex items-center px-3 py-2 rounded-lg transition-colors hover:bg-gray-700 text-gray-300 w-full text-left"
                      title={isCollapsed ? item.label : ''}
                    >
                      <Icon size={20} className={isCollapsed ? 'mx-auto' : ''} />
                      {!isCollapsed && <span className="ml-3">{item.label}</span>}
                    </button>
                  </li>
                );
              }
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
        </div>
      </nav>

      {/* Bottom section - version info */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed ? (
          <div className="text-xs">
            <button
              onClick={onAboutClick}
              className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
            >
              <Info size={14} />
              <span>DeepTalk v1.0.0</span>
            </button>
            <p className="text-gray-500 mt-1">© 2024</p>
          </div>
        ) : (
          <button
            onClick={onAboutClick}
            title="About DeepTalk"
            className="p-2 hover:bg-gray-700 rounded transition-colors mx-auto block"
          >
            <Info size={16} className="text-gray-400 hover:text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;