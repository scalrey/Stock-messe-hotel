
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button, Card } from '../components/UI';
import { API_URL } from '../services/mockData';
import { ShieldAlert, Wifi, WifiOff, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Verificar se a API está online ao carregar
  useEffect(() => {
    const checkApi = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        // Tenta um endpoint simples (ex: stats ou apenas o root da api)
        const res = await fetch(API_URL.replace('/login', '/stats'), { 
          method: 'GET',
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        setApiStatus(res.ok ? 'online' : 'offline');
      } catch (e) {
        setApiStatus('offline');
      }
    };
    checkApi();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setIsConnecting(true);
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Email ou senha incorretos.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao tentar fazer login.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleForgotPassword = () => {
    alert("Para redefinir a sua senha, por favor contacte o Administrador do Sistema (S6 ou TIC).");
  };

  return (
    <div className="min-h-screen bg-brand-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/8/87/Emblem_of_the_Angolan_Army.png" 
            alt="Exército Angolano" 
            className="h-24 w-auto drop-shadow-2xl"
          />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white">
          MESSE HOTEL HUAMBO
        </h2>
        <p className="mt-2 text-center text-sm text-brand-200 uppercase tracking-widest font-semibold">
          Sistema de Gestão de Stock
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border-brand-700">
          <form className="space-y-6" onSubmit={handleLogin}>
            <Input
              label="Email de Utilizador"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: admin@messe.com"
              disabled={isConnecting}
              required
            />

            <div>
              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduza o código de acesso"
                disabled={isConnecting}
                required
              />
              <div className="flex justify-end mt-1">
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-brand-600 hover:text-brand-500"
                >
                  Esqueceu a senha?
                </button>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                <ShieldAlert size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <Button 
                type="submit" 
                className="w-full flex justify-center items-center py-3 text-base"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    A autenticar...
                  </>
                ) : 'Entrar no Sistema'}
              </Button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-tighter text-gray-400">
              <div className="flex items-center gap-1">
                <span>API:</span>
                <code className="bg-gray-50 px-1 rounded">{API_URL}</code>
              </div>
              <div className="flex items-center gap-1 font-bold">
                {apiStatus === 'checking' && <Loader2 size={12} className="animate-spin" />}
                {apiStatus === 'online' && (
                  <span className="text-green-600 flex items-center gap-1">
                    <Wifi size={12} /> ONLINE
                  </span>
                )}
                {apiStatus === 'offline' && (
                  <span className="text-red-600 flex items-center gap-1">
                    <WifiOff size={12} /> OFFLINE
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
        
        <p className="mt-8 text-center text-xs text-brand-300">
          &copy; {new Date().getFullYear()} Messe Hotel do Huambo. Reservado ao pessoal autorizado.
        </p>
      </div>
    </div>
  );
};

export default Login;
