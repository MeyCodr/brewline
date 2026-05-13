import { LoginForm } from './LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return <LoginForm />;
}
