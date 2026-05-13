export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const required = ['DATABASE_URL', 'AUTH_SECRET'];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length > 0) {
      throw new Error(
        `[Brewline] Missing required environment variables: ${missing.join(', ')}\n` +
        'Copy .env.example to .env.local and fill in the values.'
      );
    }
  }
}
