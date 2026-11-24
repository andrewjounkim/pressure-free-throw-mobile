import { router } from 'expo-router';

/** Returns to the home screen: back if it's under us in the stack, otherwise replace. */
export function goHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
