import { useState, ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/NotificationPanel';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFirestore } from '@/hooks/useFirestore';
import { Ferme } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Building2,
  Users,
  Home,
  Settings,
  LogOut,
  Menu,
  BedDouble,
  BarChart3,
  Package,
  X,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MobileLayoutProps {
  children: ReactNode;
}

export const MobileLayout = ({ children }: MobileLayoutProps) => {
  const { user, logout, isSuperAdmin, isAdmin, isUser, hasAllFarmsAccess } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stockNotifications, setStockNotifications] = useState(0);
  const { data: fermes } = useFirestore<Ferme>('fermes');

  const getFermeName = (fermeId: string) => {
    if (!fermeId) return '-';
    if (fermeId === 'all') return 'Toutes les fermes';
    if (!fermes || fermes.length === 0) return fermeId;
    const ferme = fermes.find(f => f.id === fermeId);
    return ferme?.nom || fermeId;
  };

  // Track stock notifications
  useEffect(() => {
    if (!user) return;

    let unsubscribeAlerts: (() => void) | undefined;
    let unsubscribeTransfers: (() => void) | undefined;

    const alertQuery = hasAllFarmsAccess
      ? query(collection(db, 'stock_alerts'), where('acknowledged', '==', false))
      : query(collection(db, 'stock_alerts'),
          where('secteurId', '==', user.fermeId || ''),
          where('acknowledged', '==', false));

    unsubscribeAlerts = onSnapshot(alertQuery, (snapshot) => {
      const alertCount = snapshot.docs.length;

      const transferQuery = query(
        collection(db, 'stock_transfers'),
        where('toSecteurId', '==', user.fermeId || '')
      );

      unsubscribeTransfers = onSnapshot(transferQuery, (transferSnapshot) => {
        const pendingTransferCount = transferSnapshot.docs
          .filter(doc => {
            const data = doc.data();
            return data.status === 'pending' || data.status === 'in_transit';
          }).length;
        setStockNotifications(alertCount + pendingTransferCount);
      });
    });

    return () => {
      unsubscribeAlerts?.();
      unsubscribeTransfers?.();
    };
  }, [user, hasAllFarmsAccess]);

  const navigation = [
    {
      name: 'Tableau de bord',
      href: '/',
      icon: Home,
      show: true,
      notificationCount: 0
    },
    {
      name: 'Fermes',
      href: '/fermes',
      icon: Building2,
      show: hasAllFarmsAccess || isUser,
      notificationCount: 0
    },
    {
      name: 'Ouvriers',
      href: '/ouvriers',
      icon: Users,
      show: !isUser,
      notificationCount: 0
    },
    {
      name: 'Chambres',
      href: '/chambres',
      icon: BedDouble,
      show: isSuperAdmin || isAdmin || isUser,
      notificationCount: 0
    },
    {
      name: 'Stock',
      href: '/stock',
      icon: Package,
      show: isSuperAdmin || isAdmin || isUser,
      notificationCount: stockNotifications
    },
    {
      name: 'Statistiques',
      href: '/statistiques',
      icon: BarChart3,
      show: true,
      notificationCount: 0
    },
    {
      name: 'Administration',
      href: '/admin',
      icon: Settings,
      show: isSuperAdmin,
      notificationCount: 0
    }
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin': return 'Super Administrateur';
      case 'admin': return 'Administrateur';
      case 'user': return 'Utilisateur';
      default: return role;
    }
  };

  const getCurrentPageName = () => {
    const currentNav = navigation.find(nav => nav.href === location.pathname);
    return currentNav?.name || 'Page';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Menu and Logo */}
            <div className="flex items-center space-x-3">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden p-2 hover:bg-gray-100"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <SheetHeader className="px-4 py-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-blue-50 rounded-lg">
                          <img
                            src="https://cdn.builder.io/api/v1/image/assets%2F54187f8fd2324ab0baf205c15c42f7d5%2F58ff0b28018a4660a6f30e69fd206000?format=webp&width=400"
                            alt="AromaHerbes"
                            className="h-6 w-auto object-contain"
                          />
                        </div>
                        <div>
                          <SheetTitle className="text-sm font-semibold text-gray-900">
                            Gestion des Secteurs
                          </SheetTitle>
                          {user?.fermeId && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {getFermeName(user.fermeId)}
                            </p>
                          )}
                        </div>
                      </div>
                    </SheetHeader>

                    {/* Navigation */}
                    <div className="flex-1 px-2 py-4 space-y-1">
                      {navigation
                        .filter(item => item.show)
                        .map((item) => {
                          const isActive = location.pathname === item.href;
                          const Icon = item.icon;
                          
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={cn(
                                "flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "text-gray-700 hover:bg-gray-100"
                              )}
                            >
                              <div className="flex items-center space-x-3">
                                <Icon className={cn(
                                  "h-5 w-5",
                                  isActive ? "text-blue-600" : "text-gray-500"
                                )} />
                                <span>{item.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {item.notificationCount > 0 && (
                                  <Badge 
                                    variant="destructive" 
                                    className="h-5 w-5 p-0 flex items-center justify-center text-xs"
                                  >
                                    {item.notificationCount}
                                  </Badge>
                                )}
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </Link>
                          );
                        })}
                    </div>

                    {/* User Profile in Menu */}
                    <div className="border-t border-gray-200 p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                            {getInitials(user?.nom || user?.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.nom || user?.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getRoleLabel(user?.role || '')}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={logout}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Déconnexion
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-50 rounded-lg lg:hidden">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F54187f8fd2324ab0baf205c15c42f7d5%2F58ff0b28018a4660a6f30e69fd206000?format=webp&width=400"
                    alt="AromaHerbes"
                    className="h-6 w-auto object-contain"
                  />
                </div>
                <div className="hidden lg:block">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {getCurrentPageName()}
                  </h1>
                  {user?.fermeId && (
                    <p className="text-sm text-gray-500">
                      {getFermeName(user.fermeId)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Notifications and User */}
            <div className="flex items-center space-x-2">
              <NotificationBell />
              
              {/* Desktop User Menu */}
              <div className="hidden lg:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                          {getInitials(user?.nom || user?.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.nom || user?.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {getRoleLabel(user?.role || '')}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Paramètres</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Déconnexion</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile User Avatar */}
              <div className="lg:hidden">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                    {getInitials(user?.nom || user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation (Hidden on mobile) */}
      <nav className="hidden lg:block bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4">
            {navigation
              .filter(item => item.show)
              .map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                    {item.notificationCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="h-5 w-5 p-0 flex items-center justify-center text-xs ml-1"
                      >
                        {item.notificationCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mobile-container lg:max-w-7xl lg:mx-auto lg:px-4 lg:sm:px-6 lg:lg:px-8 lg:py-6">
          {children}
        </div>
      </main>
    </div>
  );
};
