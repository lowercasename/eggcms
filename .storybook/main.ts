// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/admin/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  staticDirs: ['../src/admin/stories/public'],
  async viteFinal(config) {
    // The app's vite config is rooted at src/admin and served under /admin/;
    // Storybook wants the project root and its own base.
    config.root = root
    config.base = '/'
    config.server = { ...config.server, proxy: undefined }
    config.resolve = {
      ...config.resolve,
      alias: [
        ...(Array.isArray(config.resolve?.alias) ? config.resolve!.alias : []),
        // Stories talk to an in-memory library instead of the real server.
        { find: /^(\.\.\/)+lib\/api$/, replacement: path.resolve(root, 'src/admin/lib/api.mock.ts') },
        { find: '@', replacement: path.resolve(root, 'src') },
      ],
    }
    return config
  },
}

export default config
