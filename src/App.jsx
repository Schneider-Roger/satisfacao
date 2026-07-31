import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth Context
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './contexts/PrivateRoute';
import { AdminRoute } from './contexts/AdminRoute';

// Pages
import Survey from './pages/Survey';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Responses from './pages/admin/Responses';
import Users from './pages/admin/Users';
import Settings from './pages/admin/Settings';
import Ouvidoria from './pages/Ouvidoria';
import OuvidoriaPanel from './pages/admin/OuvidoriaPanel';

// Layouts
import AdminLayout from './layouts/AdminLayout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota Pública (Pesquisa de Satisfação) */}
          <Route path="/" element={<Survey />} />
          <Route path="/ouvidoria" element={<Ouvidoria />} />

          {/* Rota de Login do Admin */}
          <Route path="/login" element={<Login />} />

          {/* Rotas Privadas do Admin (envolvidas pelo Layout) */}
          <Route element={<PrivateRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="respostas" element={<Responses />} />
              <Route path="ouvidoria" element={<OuvidoriaPanel />} />
              
              {/* Rotas Exclusivas de Administrador */}
              <Route element={<AdminRoute />}>
                <Route path="usuarios" element={<Users />} />
                <Route path="configuracoes" element={<Settings />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback para URLs não encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
