module.exports = {
  apps: [
    {
      name: 'bolt-app',
      script: 'npm',
      args: 'run dev',
      watch: false,
      env: {
        NODE_ENV: 'development',
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
      },
    },
    {
      name: 'bolt-app-production',
      script: 'npm',
      args: 'run preview',
      watch: false,
      env: {
        NODE_ENV: 'production',
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
      },
    }
  ],
}; 