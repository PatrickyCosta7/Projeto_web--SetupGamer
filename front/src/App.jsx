import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/header'
import Login from './pages/login/Login'
import Register from './pages/create/Register'
import Dashboard from './pages/home/Dashboard'
import Budget from './pages/orçamento/Budget'
import GameSearch from './pages/Search/GameSearch'
import GameDetails from './pages/Details/GameDetails'
import MySetups from './pages/Setup/MySetups'
import { useContext } from 'react'
import { AuthContext } from './context/AuthContext'

function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext)
  return token ? children : <Navigate to="/login" />
}

export default function App(){
  return (
    <>
      <Header />
      <main style={{ padding: 20 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/budget" element={<PrivateRoute><Budget /></PrivateRoute>} />
          <Route path="/search" element={<GameSearch />} />
          <Route path="/game/:id" element={<GameDetails />} />
          <Route path="/my-setups" element={<PrivateRoute><MySetups /></PrivateRoute>} />
          <Route path="*" element={<div>404 - Página não encontrada</div>} />
        </Routes>
      </main>
    </>
  )
}
