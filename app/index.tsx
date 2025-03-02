import { Redirect } from 'expo-router';

export default function Index() {
  // For now, we'll redirect to the auth flow
  // Later, this can check for authentication and redirect appropriately
  return <Redirect href="/(auth)/login" />;
} 