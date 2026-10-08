'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

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
        const res = await axios.get('/api/auth/me', { withCredentials: true });
        const fetchedUser = res.data?.data?.user || res.data?.user || null;
        setUser(fetchedUser);
        if (fetchedUser && typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(fetchedUser));
        }
      } catch (err) {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_user');
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
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user');
      }
      router.push('/');
    } catch (err) {
      console.error('logout failed:', err);
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user');
      }
      router.push('/');
    }
  };

  const updatePicture = async (pictureUrl) => {
    const res = await axios.put(
      '/api/auth/picture',
      { picture: pictureUrl },
      { withCredentials: true }
    );
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