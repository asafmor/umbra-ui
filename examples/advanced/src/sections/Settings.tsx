import { Bell, Palette, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Banner,
  Card,
  Columns,
  FormField,
  Page,
  SegmentedFilter,
  TextField,
  Toggle,
  VerticalNav,
  type Density,
} from 'umbra-ui';
import { renderLink } from '../router';

export interface AppSettings {
  density: Density;
  reduceMotion: boolean;
  flatBackground: boolean;
  emailAlerts: boolean;
  weeklyDigest: boolean;
  lateOrders: boolean;
  name: string;
  email: string;
}

export const defaultSettings: AppSettings = {
  density: 'default',
  reduceMotion: false,
  flatBackground: false,
  emailAlerts: true,
  weeklyDigest: false,
  lateOrders: true,
  name: 'Person 1',
  email: 'person1@example.com',
};

const panes = [
  { id: 'appearance', label: 'Appearance', icon: <Palette />, href: '#/settings' },
  { id: 'notifications', label: 'Notifications', icon: <Bell />, href: '#/settings/notifications' },
  { id: 'profile', label: 'Profile', icon: <UserRound />, href: '#/settings/profile' },
];
const densities = [
  { id: 'compact', label: 'Compact' },
  { id: 'default', label: 'Default' },
  { id: 'spacious', label: 'Spacious' },
];

/** A settings page: side navigation, and rows of `FormField` whose controls take effect at once. */
export function Settings({
  pane = 'appearance',
  settings,
  onChange,
}: {
  pane: string | undefined;
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}) {
  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    onChange({ ...settings, [key]: value });
  const toggle = (key: 'reduceMotion' | 'flatBackground' | 'emailAlerts' | 'weeklyDigest' | 'lateOrders') => (
    <Toggle checked={settings[key]} onChange={(checked) => set(key, checked)} />
  );
  const row = (label: string, description: string, control: ReactNode) => (
    <FormField key={label} layout="row" surface label={label} description={description}>
      {control}
    </FormField>
  );

  const content: Record<string, ReactNode> = {
    appearance: (
      <>
        <FormField layout="row" surface label="Density" description="Spacing, row heights and text sizes.">
          <SegmentedFilter
            aria-label="Density"
            items={densities}
            value={settings.density}
            onChange={(id: string | null) => id && set('density', id as Density)}
          />
        </FormField>
        {row('Reduce motion', 'Removes movement and keeps only fades.', toggle('reduceMotion'))}
        {row('Flat background', 'Removes the gradient behind the page.', toggle('flatBackground'))}
      </>
    ),
    notifications: (
      <>
        {row('Email alerts', 'One message for every order that changes.', toggle('emailAlerts'))}
        {row('Weekly digest', 'A summary on Monday morning.', toggle('weeklyDigest'))}
        {row('Late orders', 'A notice when an order passes its due date.', toggle('lateOrders'))}
      </>
    ),
    profile: (
      <>
        {row(
          'Name',
          'Shown on the orders you own.',
          <TextField value={settings.name} onChange={(value) => set('name', value)} />,
        )}
        {row(
          'Email',
          'Where the alerts go.',
          <TextField type="email" value={settings.email} onChange={(value) => set('email', value)} />,
        )}
      </>
    ),
  };
  const current = panes.find((p) => p.id === pane);

  return (
    <Page context="green">
      {/* Navigation and its pane belong together, so they stay side by side below the minimum window. */}
      <Columns narrow="keep">
        <VerticalNav
          aria-label="Settings"
          size="content"
          items={panes}
          value={pane}
          renderLink={renderLink}
        />
        <Card title={current?.label ?? 'Settings'} label={current?.label ?? 'Settings'}>
          <div style={{ display: 'grid', gap: 'var(--umbra-space-3)' }}>
            {content[pane] ?? <Banner tone="warning" title="There is no such settings section." />}
          </div>
        </Card>
      </Columns>
    </Page>
  );
}
