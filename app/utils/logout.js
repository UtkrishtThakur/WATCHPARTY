/**
 * File: app/utils/logout.js
 * Purpose: Logout handler - clears user session from localStorage, redirects to home
 */
export function logout() {
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Redirect to home page
  window.location.href = '/';
}
