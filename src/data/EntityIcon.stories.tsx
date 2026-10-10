import type { Meta, StoryObj } from '@storybook/react-vite';
import { Globe, Package, Truck } from 'lucide-react';
import { brokenImage, emblem, flag, row, Section, Sheet } from '../stories/dataValues';
import { EntityIcon } from './EntityIcon';

const meta = {
  title: 'Data/EntityIcon',
  component: EntityIcon,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof EntityIcon>;
export default meta;
type Story = StoryObj<typeof meta>;

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const names = [
  'Region 1',
  'Region 2',
  'Client A',
  'Client B',
  'Orders',
  'North depot',
  'Team West',
  'Site 20',
];

/** The three kinds of mark, every size and shape, and the label. */
export const Marks: Story = {
  render: () => (
    <Sheet>
      <Section label="Image, icon, generated (size follows the text)">
        <div style={row}>
          <EntityIcon src={emblem} name="Client A" />
          <EntityIcon src={flag} name="Region 1" shape="square" />
          <EntityIcon icon={<Truck />} name="Deliveries" />
          <EntityIcon name="Region 2" />
          <EntityIcon src={brokenImage} name="Client B" />
          <EntityIcon src={brokenImage} icon={<Globe />} name="Web orders" />
        </div>
      </Section>
      <Section label="The colour comes from the name">
        <div style={row}>
          {names.map((name) => (
            <EntityIcon key={name} size="md" name={name} />
          ))}
        </div>
      </Section>
      <Section label="Sizes xs to xl">
        <div style={row}>
          {sizes.map((size) => (
            <EntityIcon key={size} size={size} name="Client B" />
          ))}
          {sizes.map((size) => (
            <EntityIcon key={size} size={size} src={emblem} name="Client A" />
          ))}
        </div>
      </Section>
      <Section label="Shapes: rounded, circle, square">
        <div style={row}>
          <EntityIcon size="lg" name="Team West" />
          <EntityIcon size="lg" name="Team West" shape="circle" />
          <EntityIcon size="lg" name="Team West" shape="square" />
          <EntityIcon size="lg" icon={<Package />} name="Stock" shape="circle" />
        </div>
      </Section>
      <Section label="One or two letters, and a given colour">
        <div style={row}>
          <EntityIcon size="lg" name="North depot" letters={1} />
          <EntityIcon size="lg" name="North depot" letters={2} />
          <EntityIcon size="lg" name="North depot" color="#1b1329" />
        </div>
      </Section>
      <Section label="With a label">
        <div style={{ ...row, alignItems: 'flex-start', flexDirection: 'column', gap: 6 }}>
          <EntityIcon name="Region 2" label />
          <EntityIcon src={emblem} name="Client A" label />
          <EntityIcon icon={<Truck />} label="Deliveries" />
          <EntityIcon size="lg" name="Team West" label={<strong>Team West</strong>} />
        </div>
      </Section>
      <Section label="A label that does not fit truncates" width={140}>
        <div style={{ display: 'grid', gap: 6 }}>
          <EntityIcon name="North depot" label="North depot and distribution centre" />
          <EntityIcon
            size="md"
            src={flag}
            shape="square"
            name="Region 1"
            label="Region 1 and its districts"
          />
        </div>
      </Section>
    </Sheet>
  ),
};

/** The `parts` prop (a node, `null`, a function), tokens, and the blocks composed by hand. */
export const Customised: Story = {
  render: () => (
    <Sheet>
      <Section label="parts: a node replaces the mark">
        <EntityIcon
          name="Region 2"
          label
          parts={{
            mark: (
              <EntityIcon.Mark kind="generated" color="#47395e">
                R2
              </EntityIcon.Mark>
            ),
          }}
        />
      </Section>
      <Section label="parts: null hides the label">
        <EntityIcon size="md" name="Client A" label parts={{ label: null }} />
      </Section>
      <Section label="parts: a function adjusts the label">
        <EntityIcon
          name="Client B"
          label
          parts={{
            label: (p) => (
              <EntityIcon.Label style={{ color: 'var(--umbra-color-fixed-accent-text)' }}>
                {p.children}
              </EntityIcon.Label>
            ),
          }}
        />
      </Section>
      <Section label="Tokens">
        <div
          style={
            {
              ...row,
              '--umbra-entity-icon-size': '40px',
              '--umbra-entity-icon-radius': '50% 0',
              '--umbra-entity-icon-bg': 'var(--umbra-color-base-surface3)',
              '--umbra-entity-icon-gap': '12px',
            } as React.CSSProperties
          }
        >
          <EntityIcon name="Site 20" label />
        </div>
      </Section>
      <Section label="Blocks composed by hand">
        <EntityIcon.Root size="lg" shape="circle">
          <EntityIcon.Mark kind="icon">
            <Globe />
          </EntityIcon.Mark>
          <EntityIcon.Label>Web orders</EntityIcon.Label>
        </EntityIcon.Root>
      </Section>
    </Sheet>
  ),
};
