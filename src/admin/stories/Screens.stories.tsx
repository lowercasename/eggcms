// src/admin/stories/Screens.stories.tsx
// The screens from the design handoff, assembled from the real components on
// top of the in-memory API: 2a page editor, 3a media library, 3b new page,
// 3c empty states, plus sign-in and site settings.
import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Router, Route, Switch } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'
import { FilePlus, SearchX, Upload, Plus, Folder, Image as ImageIcon } from 'lucide-react'
import Layout from '../components/Layout'
import Collection from '../pages/Collection'
import Singleton from '../pages/Singleton'
import Media from '../pages/Media'
import Login from '../pages/Login'
import { AuthProvider } from '../context/AuthContext'
import { DirtyStateProvider } from '../contexts/DirtyStateContext'
import { SchemasContext } from '../App'
import { sampleSchemas } from '../lib/sample'
import { resetMockApi } from '../lib/api.mock'
import { Button, Card, EmptyState, SearchInput } from '../components/ui'

const meta = { title: 'Screens', parameters: { layout: 'fullscreen' } } satisfies Meta
export default meta
type Story = StoryObj

function App({ path }: { path: string }) {
  useEffect(() => {
    resetMockApi()
  }, [])
  const { hook } = memoryLocation({ path })
  return (
    <div className="h-screen min-h-[900px]">
      <Router hook={hook}>
        <AuthProvider>
          <SchemasContext.Provider value={{ schemas: sampleSchemas, siteName: 'Elena Govor' }}>
            <DirtyStateProvider>
              <Layout schemas={sampleSchemas}>
                <Switch>
                  <Route path="/collections/:schema/:id?" component={Collection} />
                  <Route path="/singletons/:schema" component={Singleton} />
                  <Route path="/media" component={Media} />
                </Switch>
              </Layout>
            </DirtyStateProvider>
          </SchemasContext.Provider>
        </AuthProvider>
      </Router>
    </div>
  )
}

export const PageEditor: Story = { name: '2a · Page editor', render: () => <App path="/collections/page/p5" /> }
export const MediaLibrary: Story = { name: '3a · Media library', render: () => <App path="/media" /> }
export const NewPage: Story = { name: '3b · New page', render: () => <App path="/collections/page/new" /> }
export const SiteSettings: Story = { name: 'Site settings', render: () => <App path="/singletons/settings" /> }
export const NoPageChosen: Story = { name: 'Collection, nothing chosen', render: () => <App path="/collections/page" /> }
function SignInScreen() {
  const { hook } = memoryLocation({ path: '/login' })
  return (
    <Router hook={hook}>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </Router>
  )
}
export const SignIn: Story = { name: 'Sign in', render: () => <SignInScreen /> }

export const EmptyStates: Story = {
  name: '3c · Empty and no-result states',
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-wrap gap-5">
      <Card className="w-[404px]">
        <div className="px-3.5 py-3 border-b border-line-hair flex items-center gap-2 text-[15px] font-bold">
          <Folder className="w-[17px] h-[17px] text-ink-2" /> Pages
        </div>
        <EmptyState icon={<FilePlus />} title="No pages yet" description="Every page on the website starts here." action={<Button icon={<Plus />}>Make the first page</Button>} />
      </Card>
      <Card className="w-[404px]">
        <div className="px-3.5 py-3 border-b border-line-hair">
          <SearchInput value="anzacs 1919" onChange={() => {}} placeholder="Search pages" />
        </div>
        <EmptyState
          icon={<SearchX />}
          title="No pages match “anzacs 1919”"
          description="Try fewer words, or clear the search to see all 7 pages."
          action={<Button variant="secondary">Clear search</Button>}
        />
      </Card>
      <Card className="w-[404px]">
        <div className="px-3.5 py-3 border-b border-line-hair flex items-center gap-2 text-[15px] font-bold">
          <ImageIcon className="w-[17px] h-[17px] text-ink-2" /> Media
        </div>
        <div className="p-3.5">
          <EmptyState dashed="strong" icon={<Upload />} title="No files yet" description="Drag images and PDFs here, or choose them from your computer." action={<Button icon={<Upload />}>Choose files</Button>} />
        </div>
      </Card>
    </div>
  ),
}
