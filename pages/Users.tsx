import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/mockData';
import { User, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Input, Modal } from '../components/UI';
import { Plus, Edit2, Trash2, ShieldCheck, User as UserIcon } from 'lucide-react';

// Zod Schema
const userSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.nativeEnum(UserRole)
});

type UserFormData = z.infer<typeof userSchema>;

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Protected Route Logic (Inline)
  useEffect(() => {
    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema)
  });

  const loadUsers = async () => {
    const data = await api.getUsers();
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    reset({ name: '', email: '', role: UserRole.OPERATOR });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setValue('name', user.name);
    setValue('email', user.email);
    setValue('role', user.role);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (id === currentUser?.id) {
      alert("Você não pode excluir a si mesmo.");
      return;
    }
    if (confirm("Tem certeza que deseja excluir este utilizador?")) {
      await api.deleteUser(id);
      loadUsers();
    }
  };

  const onSubmit = async (data: UserFormData) => {
    if (editingUser) {
      await api.updateUser({ ...editingUser, ...data });
    } else {
      await api.createUser(data);
    }
    setIsModalOpen(false);
    loadUsers();
  };

  if (currentUser?.role !== UserRole.ADMIN) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestão de Utilizadores</h2>
        <Button onClick={openCreateModal}>
          <Plus size={20} className="mr-2 inline" /> Novo Utilizador
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilizador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {u.avatar ? (
                          <img className="h-10 w-10 rounded-full" src={u.avatar} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-brand-200 flex items-center justify-center text-brand-700">
                            <UserIcon size={20} />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{u.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {u.role === UserRole.ADMIN ? <ShieldCheck size={12} className="mr-1" /> : <UserIcon size={12} className="mr-1" />}
                      {u.role === UserRole.ADMIN ? 'Administrador' : 'Operador'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditModal(u)} className="text-brand-600 hover:text-brand-900 mr-4">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome Completo"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Ex: João da Silva"
          />
          
          <Input
            label="Email (Login)"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="Ex: joao@messe.com"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
            <select
              {...register('role')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value={UserRole.OPERATOR}>Operador</option>
              <option value={UserRole.ADMIN}>Administrador</option>
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editingUser ? 'Salvar Alterações' : 'Criar Utilizador'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;