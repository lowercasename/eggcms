// .storybook/preview.tsx
import type { Preview } from '@storybook/react-vite'
import '../src/admin/index.css'

const preview: Preview = {
  parameters: {
    layout: 'padded',
    backgrounds: {
      options: {
        page: { name: 'Page', value: '#F4F2ED' },
        panel: { name: 'Panel', value: '#FFFFFF' },
      },
    },
    a11y: {
      // Fail the a11y check in the test runner rather than only warning.
      test: 'error',
    },
    options: {
      storySort: {
        order: ['Foundations', 'Primitives', 'Fields', 'Editors', 'Media', 'Shell', 'Screens'],
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'page' },
  },
}

export default preview
