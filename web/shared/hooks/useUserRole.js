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

        const admin =
          userData.roles.find((roleEntry) => roleEntry.role === "admin")?.id || 0;

        const formando =
          userData.roles.find((roleEntry) => roleEntry.role === "formando")?.id || 0;

        const formador =
          userData.roles.find((roleEntry) => roleEntry.role === "formador")?.id || 0;

        const extractedRoles = [formando,formador,admin];

        setRoles(extractedRoles);
      } catch (e) {
        console.error('Erro ao processar user do sessionStorage:', e);
      }
    }

    setLoading(false);
  }, []);

  return {
    roles,
    isFormador: roles[1],
    isFormando: roles[0],
    loading,
  };
}
