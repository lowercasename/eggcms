// src/admin/components/Shell.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'
import { Trash2, EyeOff } from 'lucide-react'
import ItemList from './ItemList'
import EntryHeader from './EntryHeader'
import Sidebar from './Sidebar'
import Modal, { ModalBody, ModalFooter } from './Modal'
import LinkModal from './richtext/LinkModal'
import { AuthProvider } from '../context/AuthContext'
import { DirtyStateProvider } from '../contexts/DirtyStateContext'
import { SchemasContext } from '../App'
import { samplePages, sampleSchemas } from '../lib/sample'
import { Button } from './ui'
import { useState } from 'react'

const meta = { title: 'Shell/Pieces' } satisfies Meta
export default meta
type Story = StoryObj

function At({ path, children }: { path: string; children: React.ReactNode }) {
  const { hook } = memoryLocation({ path, static: true })
  return (
    <Router hook={hook}>
      <AuthProvider>
        <SchemasContext.Provider value={{ schemas: sampleSchemas, siteName: 'Elena Govor' }}>
          <DirtyStateProvider>{children}</DirtyStateProvider>
        </SchemasContext.Provider>
      </AuthProvider>
    </Router>
  )
}

export const SidebarNav: Story = {
  render: () => (
    <At path="/collections/page/p5">
      <div className="h-[600px] flex">
        <Sidebar schemas={sampleSchemas} />
      </div>
    </At>
  ),
}

export const EntryList: Story = {
  render: () => (
    <At path="/collections/page/p5">
      <div className="h-[760px] flex">
        <ItemList items={samplePages} schemaName="page" schemaLabel="Pages" labelField="title" onHide={() => {}} />
      </div>
    </At>
  ),
}

export const EntryListCreating: Story = {
  render: () => (
    <At path="/collections/page/new">
      <div className="h-[760px] flex">
        <ItemList items={samplePages} schemaName="page" schemaLabel="Pages" labelField="title" onHide={() => {}} creating />
      </div>
    </At>
  ),
}

export const EntryListEmpty: Story = {
  render: () => (
    <At path="/collections/page">
      <div className="h-[560px] flex">
        <ItemList items={[]} schemaName="page" schemaLabel="Pages" labelField="title" onHide={() => {}} />
      </div>
    </At>
  ),
}

export const Headers: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="flex flex-col gap-4 bg-page py-4">
      <EntryHeader
        title="South Pacific"
        status="published"
        menu={[
          { label: 'Take off the website', icon: <EyeOff />, onSelect: () => {} },
          { label: 'Delete page', icon: <Trash2 />, destructive: true, onSelect: () => {} },
        ]}
      />
      <EntryHeader title="South Pacific" status="edited" onShowList={() => {}} />
      <EntryHeader title="Untitled page" untitled status="draft" />
    </div>
  ),
}

export const Dialog: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        {open && (
          <Modal title="Image settings" onClose={() => setOpen(false)} maxWidth="lg">
            <ModalBody>
              <p className="m-0 text-[15px] text-ink-2">Dialog content goes here.</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save</Button>
            </ModalFooter>
          </Modal>
        )}
      </>
    )
  },
}

export const LinkDialog: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Add a link</Button>
        {open && <LinkModal onSaveExternal={() => setOpen(false)} onSaveInternal={() => setOpen(false)} onRemove={() => setOpen(false)} onClose={() => setOpen(false)} />}
      </>
    )
  },
}
