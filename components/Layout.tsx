
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  LogOut, 
  Menu,
  X,
  User as UserIcon,
  ShieldAlert,
  Users,
  ArrowDownCircle
} from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  if (!user) return null;

  return <Layout />;
};

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Entrada', href: '/movements', icon: ArrowDownCircle },
    { name: 'Requisições', href: '/requisitions', icon: ClipboardList },
    { name: 'Stock & Itens', href: '/stock', icon: Package },
    // Only show Users link if admin
    ...(user?.role === UserRole.ADMIN ? [{ name: 'Utilizadores', href: '/users', icon: Users }] : []),
  ];

  // URL direta da imagem original para garantir estabilidade
  const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/8/87/Emblem_of_the_Angolan_Army.png";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 z-50 flex w-64 flex-col bg-brand-900 transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-28 items-center justify-between px-4 bg-brand-900 border-b border-brand-800">
          <div className="flex items-center gap-3 w-full">
            <img 
              src={LOGO_URL} 
              alt="Exército Angolano" 
              className="h-16 w-auto object-contain drop-shadow-md"
            />
            <h1 className="text-md font-bold text-white tracking-wider leading-tight">
              MESSE HOTEL<br/>DO HUAMBO
            </h1>
          </div>
          <button className="lg:hidden text-white absolute top-4 right-4" onClick={() => setSidebarOpen(false)}><X size={24} /></button>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <nav className="flex-1 space-y-1 px-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive ? 'bg-brand-700 text-white' : 'text-brand-100 hover:bg-brand-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-brand-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {user?.avatar ? (
                <img className="h-8 w-8 rounded-full" src={user.avatar} alt="" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white">
                  <UserIcon size={16} />
                </div>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs font-medium text-brand-200">
                {user?.role === UserRole.ADMIN ? 'Administrador' : 'Operador'}
              </p>
            </div>
            <button onClick={logout} className="ml-auto text-brand-200 hover:text-white">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between bg-white px-6 shadow-sm lg:hidden">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="text-gray-500">
                <Menu size={24} />
              </button>
              <img src={LOGO_URL} alt="Logo" className="h-10 w-auto object-contain" />
              <span className="font-semibold text-gray-700 text-sm">Messe Hotel do Huambo</span>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
