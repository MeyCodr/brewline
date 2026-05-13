'use client';

import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { NavIcon } from '@/components/ui/NavIcon';
import { Modal } from '@/components/ui/Modal';

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('maya@brewline.cafe');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError('Invalid email or password.');
      } else {
        router.replace('/dashboard');
      }
    });
  }

  return (
    <div
      className="grid min-h-screen"
      style={{ gridTemplateColumns: '1.2fr 1fr' }}
    >
      {/* Left art panel */}
      <div
        className="relative min-h-[600px]"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(140deg, rgba(28,25,23,0.78) 0%, rgba(28,25,23,0.55) 60%, rgba(28,25,23,0.85) 100%)' }}
        />
        <div className="relative h-full p-12 flex flex-col text-white" style={{ paddingLeft: 56, paddingRight: 56 }}>
          <div className="flex items-center gap-3" style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 500 }}>
            <Logo size={44} />
            <span>Brewline</span>
          </div>

          <h1
            className="mt-auto mb-4 max-w-[460px] font-normal leading-tight"
            style={{ fontFamily: 'var(--font-fraunces)', fontSize: 52, letterSpacing: '-0.025em' }}
          >
            Run the floor.<br />Pour the coffee.<br />Watch the day unfold.
          </h1>
          <p className="text-[15px] leading-relaxed opacity-85 max-w-[440px]">
            A modern operating system for independent cafes. Orders, kitchen, tables and guest menu — together in one calm dashboard.
          </p>

          <div className="mt-9 pt-6 max-w-[440px] relative" style={{ borderTop: '1px solid rgba(255,255,255,0.18)' }}>
            <span
              className="absolute top-2.5 -left-2"
              style={{ fontFamily: 'var(--font-fraunces)', fontSize: 80, lineHeight: 1, color: 'var(--brand-1)', opacity: 0.55 }}
            >
              &ldquo;
            </span>
            <p
              className="pl-6 text-[17px] leading-relaxed mb-2.5"
              style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic' }}
            >
              It used to take three different apps. Now my morning rush feels handled before the first pour.
            </p>
            <p className="pl-6 text-[12px] opacity-70">— Owner, Field Notes Coffee · Brooklyn</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div
        className="flex items-center justify-center p-12"
        style={{ background: 'var(--canvas)' }}
      >
        <div className="w-full max-w-[380px]">
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--brand-text)' }}>
            Welcome back
          </div>
          <h2
            className="text-[32px] font-medium tracking-tight mb-1"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            Sign in to your cafe
          </h2>
          <p className="text-[14px] mb-7" style={{ color: 'var(--muted)' }}>
            Use the credentials your manager gave you.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="block mb-3.5">
              <span className="block text-[12px] font-semibold mb-1.5" style={{ color: '#57534e' }}>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 border rounded-[10px] text-[14px] outline-none transition-all duration-150"
                style={{
                  background: '#fff',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--brand-1)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-tint)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </label>

            <label className="block mb-3.5">
              <span className="block text-[12px] font-semibold mb-1.5" style={{ color: '#57534e' }}>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 border rounded-[10px] text-[14px] outline-none transition-all duration-150"
                style={{ background: '#fff', borderColor: 'var(--border)', color: 'var(--text)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--brand-1)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-tint)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </label>

            {error && (
              <div className="mb-4 px-3 py-2.5 bg-red-50 text-red-600 text-[13px] rounded-[10px] border border-red-100">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between mb-5">
              <label className="flex items-center gap-1.5 text-[12.5px] cursor-pointer" style={{ color: '#57534e' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ accentColor: 'var(--brand-1)' }}
                />
                Stay signed in on this register
              </label>
              <button type="button" onClick={() => setForgotOpen(true)} className="text-[12px] font-semibold" style={{ color: 'var(--brand-text)' }}>
                Forgot?
              </button>
            </div>

            <Button type="submit" block size="lg" disabled={isPending}>
              {isPending ? 'Opening shift…' : 'Open today\'s shift'}
              {!isPending && <NavIcon name="arrow-right" size={14} />}
            </Button>
          </form>

          <div className="flex items-center gap-2 text-[12px] mt-5 justify-center" style={{ color: 'var(--muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_0_3px_rgba(74,222,128,0.25)]" />
            All systems calm · v1.0
          </div>
        </div>
      </div>

      {/* Forgot password modal */}
      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset password" size="sm">
        <div className="flex flex-col gap-4">
          <div className="text-center text-4xl">🔑</div>
          <p className="text-[14px] leading-relaxed text-center m-0" style={{ color: 'var(--muted)' }}>
            Password resets are managed by your cafe manager.
          </p>
          <div className="rounded-xl p-4 text-[13px]" style={{ background: 'var(--brand-tint)', color: 'var(--brand-text)' }}>
            <strong className="block mb-1 text-[12px] uppercase tracking-wide">Contact your manager</strong>
            Ask them to update your password from the admin panel, or provide you with new credentials.
          </div>
          <Button variant="primary" block onClick={() => setForgotOpen(false)}>Got it</Button>
        </div>
      </Modal>
    </div>
  );
}
