import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@roomly/lib', '@roomly/ui-tokens'],
};

export default config;
