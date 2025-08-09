import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as ProductsIcon,
  Category as CategoryIcon,
  ShoppingCart as SalesIcon,
  People as UsersIcon,
  AccountCircle,
  Logout,
  QrCodeScanner as PDVIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 200;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [kioskMode, setKioskMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  // Função para alternar modo kiosk com F1 e navegar para PDV
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'F1') {
        event.preventDefault();
        if (!kioskMode) {
          // Se não estiver no modo kiosk, ativa e vai para PDV
          navigate('/pdv');
          setKioskMode(true);
        } else {
          // Se já estiver no modo kiosk, apenas desativa
          setKioskMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [kioskMode, navigate]);

  const getMenuIcon = (text) => {
    switch (text) {
      case 'Dashboard': return '📊';
      case 'PDV': return '🛒';
      case 'Produtos': return '📦';
      case 'Categorias': return '🏷️';
      case 'Vendas': return '📈';
      case 'Usuários': return '👥';
      case 'Licença': return '⚙️';
      default: return '📄';
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'PDV', icon: <PDVIcon />, path: '/pdv' },
    { text: 'Produtos', icon: <ProductsIcon />, path: '/products' },
    { text: 'Categorias', icon: <CategoryIcon />, path: '/categories' },
    { text: 'Vendas', icon: <SalesIcon />, path: '/sales' },
  ];

  if (isAdmin()) {
    menuItems.push({ text: 'Usuários', icon: <UsersIcon />, path: '/users' });
  }

  const drawer = (
    <div>
      <Toolbar sx={{ height: 80, backgroundColor: '#132d46', alignItems: 'center' }}>
        <Typography variant="h6" noWrap component="div" sx={{ color: 'white', fontWeight: 'bold' }}>
          🛒 Sistema PDV
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ backgroundColor: '#132d46', height: '100%', pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1, px: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 1,
                backgroundColor: location.pathname === item.path ? '#01c38e' : '#1a1e29',
                color: 'white',
                '&:hover': {
                  backgroundColor: location.pathname === item.path ? '#01c38e' : '#01c38e',
                },
                mb: 1
              }}
            >
              <ListItemText 
                primary={`${getMenuIcon(item.text)} ${item.text}`} 
                sx={{ 
                  '& .MuiListItemText-primary': { 
                    fontSize: '14px',
                    fontWeight: 'normal'
                  } 
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  // Renderização condicional baseada no modo kiosk
  const kioskStyles = kioskMode ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f5f5f5',
    zIndex: 1000,
    overflow: 'auto'
  } : { display: 'flex' };

  return (
    <Box sx={kioskStyles}>
      <CssBaseline />
      {!kioskMode && (
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            height: 80,
            backgroundColor: '#1976d2'
          }}
        >
          <Toolbar sx={{ height: 80, flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', pl: 4 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' }, position: 'absolute', top: 10, left: 10 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h5" noWrap component="div" sx={{ fontWeight: 'bold', color: 'white', fontSize: '24px' }}>
              🛒 Sistema PDV
            </Typography>
            <Typography variant="body2" noWrap component="div" sx={{ color: '#e3f2fd', fontSize: '14px', mt: 0.5 }}>
              Ponto de Venda
            </Typography>
            <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user?.name?.charAt(0)?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleClose}>
                  <ListItemIcon>
                    <AccountCircle fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{user?.name}</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  <ListItemText secondary={user?.email} />
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Sair</ListItemText>
                </MenuItem>
              </Menu>
            </div>
          </Toolbar>
        </AppBar>
      )}
      {!kioskMode && (
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="mailbox folders"
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: kioskMode ? 2 : 3,
          width: kioskMode ? '100%' : { sm: `calc(100% - ${drawerWidth}px)` },
          height: kioskMode ? '100vh' : 'auto'
        }}
      >
        {!kioskMode && <Toolbar />}
        {children}
        
        {/* Indicadores condicionais */}
        {!kioskMode ? (
          <Box sx={{
            position: 'fixed',
            bottom: 10,
            left: 10,
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 2,
            fontSize: '11px',
            opacity: 0.7,
            zIndex: 1000
          }}>
            Pressione F1 para ir ao PDV (Modo Kiosk)
          </Box>
        ) : (
          <Box sx={{
            position: 'fixed',
            bottom: 10,
            right: 10,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 2,
            fontSize: '12px',
            zIndex: 1001
          }}>
            Modo Kiosk - Pressione F1 para sair
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Layout;