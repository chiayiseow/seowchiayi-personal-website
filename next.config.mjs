import postgres from 'postgres';

let sql;
try {
  if (process.env.POSTGRES_URL) {
    sql = postgres(process.env.POSTGRES_URL, {
      ssl: 'allow',
    });
  }
} catch (error) {
  console.warn('Failed to initialize postgres client:', error.message);
}

const nextConfig = {
  experimental: {
    ppr: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  transpilePackages: ['next-mdx-remote'],
  async redirects() {
    if (!process.env.POSTGRES_URL || !sql) {
      console.log('No PostgreSQL URL provided or connection failed, skipping redirects');
      return [];
    }

    try {
      let redirects = await sql`
        SELECT source, destination, permanent
        FROM redirects;
      `;

      return redirects.map(({ source, destination, permanent }) => ({
        source,
        destination,
        permanent: !!permanent,
      }));
    } catch (error) {
      console.error('Error fetching redirects:', error.message);
      return [];
    }
  },
  headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

// Rest of your configuration remains unchanged