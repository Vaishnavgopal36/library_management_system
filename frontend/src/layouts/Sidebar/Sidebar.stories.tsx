import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

const meta: Meta<typeof Sidebar> = {
  title: 'Layouts/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
  // THE FIX: We wrap the isolated component in a 100vh container 
  // just so Storybook knows how tall to make it!
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ height: '100vh', backgroundColor: '#f5f6f8', display: 'flex' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default meta;



const SidebarWrapper = () => {
  const [active, setActive] = useState('Dashboard');

  return (
    <div style={{ display: 'flex', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <Sidebar activeItem={active} onNavigate={setActive} />
      
      {/* Mock content area to show how the layout looks next to the sidebar */}
      <main style={{ flex: 1, padding: '2rem' }}>
        <h2 style={{ color: '#111827', marginTop: 0 }}>{active} View</h2>
        <p style={{ color: '#6b7280' }}>This is where the {active} content cards and tables will be displayed.</p>
      </main>
    </div>
  );
};

export const InteractiveSidebar: StoryObj = {
  render: () => <SidebarWrapper />,
};