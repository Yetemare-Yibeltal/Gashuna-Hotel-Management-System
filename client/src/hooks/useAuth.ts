import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, logout, updateUser } = useAuthStore();

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isReceptionist = user?.role === 'receptionist';
  const isAdminOrManager = isAdmin || isManager;

  const hasPermission = (requiredRoles: string[]): boolean =>
    !!user && requiredRoles.includes(user.role);

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    isManager,
    isReceptionist,
    isAdminOrManager,
    hasPermission,
    login,
    logout,
    updateUser,
  };
};
