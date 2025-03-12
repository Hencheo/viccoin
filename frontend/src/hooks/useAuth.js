import { useDispatch, useSelector } from 'react-redux';
import { login, logout, register, checkAuth } from '../actions/authActions';
import { useMemo } from 'react';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  
  const signIn = async (email, password) => {
    return await dispatch(login(email, password));
  };
  
  const signUp = async (nome, email, password) => {
    return await dispatch(register(nome, email, password));
  };
  
  const signOut = async () => {
    return await dispatch(logout());
  };
  
  const checkAuthStatus = async () => {
    return await dispatch(checkAuth());
  };
  
  const authState = useMemo(() => ({
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    loading: auth.loading,
    error: auth.error,
  }), [auth.isAuthenticated, auth.user, auth.loading, auth.error]);
  
  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    checkAuthStatus,
  };
}; 