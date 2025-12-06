/**
 * Logout utility
 * Clears user session and redirects to home
 */
export function logout() {
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Redirect to home page
  window.location.href = '/';
}
