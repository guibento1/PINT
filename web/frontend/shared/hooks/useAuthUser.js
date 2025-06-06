import { useEffect, useState } from 'react';
import axios from 'axios';

export default function useAuthUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get('http://localhost:3000/utilizador/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.error('Erro ao validar token:', err);
        sessionStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
