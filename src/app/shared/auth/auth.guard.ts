import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export function hasSignedInUser(): boolean {
  const userDetails = localStorage.getItem('userdetails');
  if (!userDetails) {
    return false;
  }

  try {
    const parsed: unknown = JSON.parse(userDetails);
    if (typeof parsed !== 'object' || parsed === null) {
      return false;
    }

    const details = parsed as Record<string, unknown>;
    const user = typeof details['user'] === 'object' && details['user'] !== null
      ? details['user'] as Record<string, unknown>
      : details;
    const userId = user['id'] ?? user['userId'] ?? details['userId'];

    return typeof userId === 'number' || (typeof userId === 'string' && userId.trim().length > 0);
  } catch (error) {
    console.error('Failed to read the signed-in user details:', error);
    return false;
  }
}

export const requireAuth: CanActivateFn = () => {
  return hasSignedInUser() || inject(Router).parseUrl('/login');
};

export const redirectSignedInUser: CanActivateFn = () => {
  return hasSignedInUser() ? inject(Router).parseUrl('/dashboard') : true;
};
