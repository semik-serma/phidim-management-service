'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export function useAuth({ redirectIfUnauthenticated = true } = {}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/api/auth/me', { withCredentials: true });
        setUser(res.data?.data?.user || res.data?.user || null);
      } catch (err) {
        setUser(null);
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
      router.push('/');
    } catch (err) {
      console.error('logout failed:', err);
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
    }
    return res.data;
  };

  return { user, loading, logout, setUser, updatePicture };
}