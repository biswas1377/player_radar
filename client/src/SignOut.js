import React from 'react';

export default function SignOut({ onSignOut }) {
  const handleSignOut = () => {
    localStorage.removeItem('token');
    onSignOut();
    window.location.reload();
  };

  return (
    <button onClick={handleSignOut} style={{ margin: 16 }}>
      Sign Out
    </button>
  );
}
