import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Sales from './pages/Sales';
import Users from './pages/Users';
import PDV from './pages/PDV';
import TestPage from './pages/TestPage';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#132d46', // Azul escuro Sborg
      light: '#1a1e29', // Azul muito escuro Sborg
      dark: '#0f1f35',
    },
    secondary: {
      main: '#01c38e', // Verde Sborg
      light: '#33d1a3',
      dark: '#00a074',
    },
    warning: {
      main: '#01c38e', // Verde Sborg para destaque
      light: '#e8faf6',
      dark: '#00a074',
    },
    background: {
      default: '#ffffff', // Branco Sborg
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1e29', // Azul muito escuro Sborg
      secondary: '#132d46',
    },
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
    h4: {
      fontWeight: 'bold',
      color: '#424242',
    },
    h6: {
      fontWeight: 'bold',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#132d46',
          height: 80,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/test" element={<TestPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/sales" element={<Sales />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/pdv" element={<PDV />} />
                      <Route path="/test-api" element={<TestPage />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
