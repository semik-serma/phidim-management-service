'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export function useAuth({ redirectIfUnauthenticated = true } = {}) {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('auth_user');
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        const fetchedUser = res.data?.data?.user || res.data?.user || null;
        setUser(fetchedUser);
        if (fetchedUser && typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(fetchedUser));
        }
      } catch (err) {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_token');
          document.cookie = 'jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        }
        if (redirectIfUnauthenticated) {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, redirectIfUnauthenticated]);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('logout failed:', err);
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        document.cookie = 'jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      }
      router.push('/');
    }
  };

  const updatePicture = async (pictureUrl) => {
    const res = await api.put('/auth/picture', { picture: pictureUrl });
    if (res.data?.data?.user) {
      setUser(res.data.data.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(res.data.data.user));
      }
    }
    return res.data;
  };

  const role = user?.role?.toLowerCase() || '';
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';
  const isAccountant = role === 'accountant';

  const hasRole = (...roles) => {
    return roles.map((r) => r.toLowerCase()).includes(role);
  };

  return {
    user,
    role,
    isAdmin,
    isStaff,
    isAccountant,
    hasRole,
    loading,
    logout,
    setUser,
    updatePicture,
  };
}