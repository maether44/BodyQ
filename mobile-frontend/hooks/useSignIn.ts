import { useState } from 'react';
import { signInUser } from '../services/authService';

export function useSignIn() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleSignIn = async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const authData = await signInUser(email, password);
      return authData;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { handleSignIn, loading, error };
}