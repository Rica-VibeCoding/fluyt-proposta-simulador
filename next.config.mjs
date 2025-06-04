/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para desenvolvimento
  reactStrictMode: true,
  
  // Configuração de paths (equivalente ao alias "@" do Vite)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': new URL('./src', import.meta.url).pathname,
    };
    return config;
  },
  
  // Configurações experimentais
  experimental: {
    typedRoutes: false, // Removido para evitar conflitos
  },
}

export default nextConfig; 