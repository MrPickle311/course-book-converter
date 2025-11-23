
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig(async () => {
    const { default: mdx } = await import('@mdx-js/rollup');
    const { default: remarkGfm } = await import('remark-gfm');
    const { default: rehypeHighlight } = await import('rehype-highlight');

    return {
      plugins: [
        // MDX must run before React so .mdx is compiled prior to react-swc
        mdx({
          providerImportSource: '@mdx-js/react',
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeHighlight],
        }),
        react(),
      ],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.mdx'],
      alias: {
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'next-themes@0.4.6': 'next-themes',
        'lucide-react@0.487.0': 'lucide-react',
        'input-otp@1.4.2': 'input-otp',
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
    },
  };
  });