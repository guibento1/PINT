// web/shared/hooks/useUserRole.js
import { useEffect, useState } from 'react';

export default function useUserRole() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userDataRaw = sessionStorage.getItem('user');

    if (userDataRaw) {
      try {
        const userData = JSON.parse(userDataRaw);
        const extractedRoles = userData.roles?.map((r) => r.role || r) || [];
        setRoles(extractedRoles);
      } catch (e) {
        console.error('Erro ao processar user do sessionStorage:', e);
      }
    }

    setLoading(false);
  }, []);

  return {
    roles,
    isFormador: roles.includes('formador'),
    isFormando: roles.includes('formando'),
    loading,
  };
}
