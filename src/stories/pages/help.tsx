// What the planning and the analysis page share: the app's key bindings, and the two help controls of a
// page header (a tour over real elements of the page, and the sheet of keyboard shortcuts).
import { CircleHelp, Route } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  Button,
  IconButton,
  ShortcutsSheet,
  Spotlight,
  UmbraProvider,
  type ContextTint,
  type Density,
  type Shortcut,
  type ShortcutsSheetSectionData,
  type SpotlightStep,
} from '../../index';

/**
 * The key bindings of the two pages. None has an `action`: the control that owns one binds it while it
 * is mounted (`shortcut="…"` on a button), so a key of the other page does nothing here.
 */
export const pageShortcuts: Shortcut[] = [
  { id: 'app.tour', keys: 'Shift+T', label: 'Take the tour', group: 'Help' },
  { id: 'planning.copy', keys: 'Shift+C', label: 'Copy the month', group: 'Planning' },
  { id: 'analysis.scale', keys: 'Shift+S', label: 'Edit the scale', group: 'Analysis' },
  { id: 'analysis.export', keys: 'Mod+E', label: 'Export the report', group: 'Analysis' },
];

/** The provider of the two stories: the globals of the Storybook toolbar, and the key bindings. */
export function withShortcuts(children: ReactNode, globals: Record<string, unknown>) {
  return (
    <UmbraProvider
      density={globals.density as Density}
      context={globals.context as ContextTint}
      locale={globals.direction === 'rtl' ? 'he' : undefined}
      shortcuts={pageShortcuts}
    >
      {children}
    </UmbraProvider>
  );
}

/** The tour button and the help button of a page header, with their two overlays. */
export function PageHelp({ steps, keys }: { steps: SpotlightStep[]; keys?: ShortcutsSheetSectionData[] }) {
  const [touring, setTouring] = useState(false);
  return (
    <>
      <Button iconStart={<Route />} shortcut="app.tour" onPress={() => setTouring(true)}>
        Tour
      </Button>
      <ShortcutsSheet
        trigger={<IconButton icon={<CircleHelp />} label="Keyboard shortcuts" />}
        extra={keys}
      />
      <Spotlight open={touring} onOpenChange={setTouring} steps={steps} />
    </>
  );
}
