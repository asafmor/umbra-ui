import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { VerticalNav } from '../shell/VerticalNav';
import { Rows } from '../stories/placeholders';
import { Modal } from './Modal';

/**
 * No `AppShell` here. Below the minimum window the columns still become tabs, and the modal still
 * fills the window with its navigation behind a "Sections" toggle: the narrow state is read from the
 * window, not set by the shell.
 */
const meta = { title: 'Overlays/Modal without a shell', parameters: { frame: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const sections = ['General', 'Display', 'Advanced'];

export const WithoutAppShell: Story = {
  tags: ['narrow'],
  render: function Render() {
    const [section, setSection] = useState('General');
    return (
      <Columns style={{ height: '100%' }}>
        <Card title="Orders">
          <Modal
            trigger={<Button>Preferences</Button>}
            size="lg"
            title="Preferences"
            nav={
              <VerticalNav
                aria-label="Sections"
                value={section}
                onChange={setSection}
                items={sections.map((name) => ({ id: name, label: name }))}
              />
            }
          >
            <Rows count={6} prefix={section} />
          </Modal>
          <Rows count={8} prefix="Order" />
        </Card>
        <Card title="Reports">
          <Rows count={8} prefix="Report" />
        </Card>
      </Columns>
    );
  },
};
