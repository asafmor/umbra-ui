import { Mail } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Badge, Card, IconButton, ListItem, Tag, type CardRootProps } from 'umbra-ui';
import type { Contact } from '../data';

/**
 * A card of contacts that `Card` and `ListItem` do not give as they are: a count next to the title
 * and each person's role beside their name. It uses all four customisation layers, cheapest first:
 *
 * 1. Tokens: `--umbra-card-radius` and `--umbra-list-item-padding-x`, set on the root for this card only.
 * 2. Props:  `tone`, `size="compact"`, and the layout props (`size`, `priority`) passed on to `Card.Root`.
 * 3. Parts:  the `title` part of `ListItem` as a function (keeps the default title and adds a tag),
 *            and its `meta` part hidden with `null`.
 * 4. Blocks: `Card.Root`, `Card.Header`, `Card.Title`, `Card.Actions` and `Card.Body` put together by
 *            hand, because the header needs a badge between the title and the actions.
 */
export function ContactsCard({ contacts, ...root }: { contacts: Contact[] } & CardRootProps) {
  const tokens = { '--umbra-card-radius': '2px', '--umbra-list-item-padding-x': '0px' } as CSSProperties;
  return (
    <Card.Root tone="neutral" aria-label="Contacts" {...root} style={{ ...tokens, ...root.style }}>
      <Card.Header>
        <Card.Title>Contacts</Card.Title>
        <Badge count={contacts.length} tone="accent" label={(n) => `${n} contacts`} />
        <Card.Actions>
          <IconButton icon={<Mail />} label="Write to all contacts" />
        </Card.Actions>
      </Card.Header>
      <Card.Body>
        {contacts.map((contact) => (
          <ListItem
            key={contact.email}
            size="compact"
            title={contact.name}
            description={contact.email}
            meta={contact.role}
            parts={{
              title: (props) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <ListItem.Title {...props} />
                  <Tag size="small" tone={contact.role === 'Director' ? 'accent' : 'neutral'}>
                    {contact.role}
                  </Tag>
                </span>
              ),
              meta: null,
            }}
          />
        ))}
      </Card.Body>
    </Card.Root>
  );
}
