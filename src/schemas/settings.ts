import { defineSingleton, f } from '../lib/schema'

export default defineSingleton({
  name: 'settings',
  label: 'Site Settings',
  fields: [
    f.string('siteTitle', { required: true, default: 'My Site' }),
    f.string('tagline'),
    f.image('logo'),
    f.text('footerText'),
  ],
})
