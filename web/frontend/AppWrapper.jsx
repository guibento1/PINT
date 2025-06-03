import React from 'react';
import FrontOfficeApp from './frontOffice/src/App';
import BackOfficeApp from './backOffice/src/App';

export default function AppWrapper() {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) return <FrontOfficeApp />;

  if (user.role === 'admin') {
    return <BackOfficeApp />;
  }

  return <FrontOfficeApp />;
}
