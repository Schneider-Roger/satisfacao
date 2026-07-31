import React, { useState, useEffect, useContext } from 'react';
import { Plus, Trash2, Shield, User, Eye, EyeOff, Lock, X } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

const Users = () => {
  const { user, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Edit password states
  const [editingUser, setEditingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const fetchUsers = () => {
    const API_URL = import.meta.env.VITE_API_URL != null ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
    fetch(`${API_URL}/api/users`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          logout();
          throw new Error('Sessão expirada');
        }
        if (!res.ok) throw new Error('Acesso negado');
        return res.json();
      })
      .then(data => {
        setUsers(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar usuários:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    
    setIsSaving(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL != null ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, email, password, role })
      });

      if (res.ok) {
        setName('');
        setEmail('');
        setPassword('');
        setRole('user');
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao criar usuário');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
      const API_URL = import.meta.env.VITE_API_URL != null ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert('Erro ao excluir usuário');
      }
    } catch (err) {
      alert('Erro de conexão');
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !editingUser) return;
    if (newPassword.length < 6) {
      alert('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setIsUpdatingPassword(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL != null ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/users/${editingUser.id}/password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      
      if (res.ok) {
        alert('Senha atualizada com sucesso!');
        setEditingUser(null);
        setNewPassword('');
      } else {
        alert('Erro ao atualizar a senha');
      }
    } catch (err) {
      alert('Erro de conexão');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Carregando usuários...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Gestão de Usuários</h1>
          <p style={{ color: 'var(--color-text-light)' }}>Gerencie os acessos ao painel administrativo.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Formulário Novo Usuário */}
        <div style={{ width: '350px', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> Novo Usuário
          </h2>
          
          {error && <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

          <form onSubmit={handleAddUser}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Nome Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Nível de Acesso</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none', backgroundColor: 'white' }}
              >
                <option value="user">Usuário Comum (Visualizar e Tratar)</option>
                <option value="admin">Administrador (Acesso Total)</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={isSaving}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600 }}
            >
              {isSaving ? 'Salvando...' : 'Cadastrar Usuário'}
            </button>
          </form>
        </div>

        {/* Lista de Usuários */}
        <div style={{ flex: 1, backgroundColor: 'white', borderRadius: 'var(--radius-lg)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-main)', fontWeight: 600, fontSize: '0.875rem' }}>Nome / E-mail</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-main)', fontWeight: 600, fontSize: '0.875rem' }}>Permissão</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-main)', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{u.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 500,
                      backgroundColor: u.role === 'admin' ? '#eff6ff' : '#f3f4f6',
                      color: u.role === 'admin' ? '#1d4ed8' : '#4b5563'
                    }}>
                      {u.role === 'admin' ? <Shield size={14} /> : <User size={14} />}
                      {u.role === 'admin' ? 'Admin' : 'Comum'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    {u.email !== 'marketing@copercana.com.br' && u.id !== user?.id && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setEditingUser(u); setNewPassword(''); setShowNewPassword(false); }} style={{ color: '#3b82f6', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }} title="Mudar Senha">
                          <Lock size={18} />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }} title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum usuário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Mudar Senha */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', margin: 0 }}>Mudar Senha</h2>
              <button onClick={() => setEditingUser(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Nova senha para <strong>{editingUser.name}</strong>
              </p>
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  onClick={() => setEditingUser(null)}
                  style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword || !newPassword}
                  style={{ padding: '0.6rem 1.2rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: (isUpdatingPassword || !newPassword) ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: (isUpdatingPassword || !newPassword) ? 0.6 : 1 }}
                >
                  {isUpdatingPassword ? 'Salvando...' : 'Salvar Senha'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
