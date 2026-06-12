process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.PORT = '3000';
process.env.BASE_URL = 'http://localhost:3000';
process.env.WEB_APP_URL = 'http://localhost:3001';
process.env.DATABASE_URL =
  'postgres://postgres:postgres@localhost:5432/postgres';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
