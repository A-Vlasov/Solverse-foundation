/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Добавляем публичную версию информации о боте
    NEXT_PUBLIC_TELEGRAM_BOT_ID: '7955134547',
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: 'Onlyfans_Helper_Bot'
  },
  // Отключаем строгий режим для тестирования
  reactStrictMode: false,
};

export default nextConfig; 