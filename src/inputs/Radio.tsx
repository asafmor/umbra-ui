import { createContext, useContext, useRef, type ReactNode } from 'react';
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from 'react-aria-components';
import { cx, renderPart, type Part } from '../utils/parts';
import {
  GroupDescribedBy,
  GroupOptions,
  groupClass,
  groupLabelClass,
  Marker,
  SlotDescription,
  SlotError,
  SlotLabel,
  TextSlotsProvider,
  useTextSlots,
  type BlockProps,
} from './fieldParts';
import styles from './Radio.module.css';
import { FieldContext, noField, ReportValidation, useFieldControl, useUnnamedGroup } from './useField';
import { defined } from '../utils/defined';
import { rootRender } from '../utils/passThrough';

export type RadioVariant = 'default' | 'card';

const VariantContext = createContext<RadioVariant>('default');

export interface RadioRootProps extends BlockProps {
  /** What the group's `value` is when this option is chosen. */
  value: string;
  disabled?: boolean | undefined;
  /** Accessible name of an option that has no visible label. */
  'aria-label'?: string | undefined;
}

function Root({
  value,
  disabled,
  'aria-label': ariaLabel,
  className,
  style,
  children,
  ...rest
}: RadioRootProps) {
  const slots = useTextSlots();
  const describedBy = [...slots.describedBy, useContext(GroupDescribedBy)].filter(Boolean).join(' ');
  return (
    <AriaRadio
      {...rootRender('label', { ...rest, id: undefined })}
      data-umbra="radio"
      data-variant={useContext(VariantContext)}
      {...defined({ className: cx(styles.root, className), style })}
      value={value}
      {...defined({
        isDisabled: disabled,
        'aria-label': ariaLabel,
        'aria-labelledby': slots.labelledBy || undefined,
        'aria-describedby': describedBy || undefined,
      })}
    >
      <TextSlotsProvider value={slots}>{children}</TextSlotsProvider>
    </AriaRadio>
  );
}

/** The ring; it holds a dot while the option is chosen. */
function Mark({ className, style, children }: BlockProps) {
  return (
    <span data-part="mark" aria-hidden="true" className={cx(styles.mark, className)} style={style}>
      {children ?? <span className={styles.ring} />}
    </span>
  );
}

/** An icon or a small image; shown by the `card` variant. */
function Media({ className, style, children }: BlockProps) {
  return (
    <span data-part="media" aria-hidden="true" className={cx(styles.media, className)} style={style}>
      {children}
    </span>
  );
}

function Label(props: BlockProps) {
  return <SlotLabel {...props} className={cx(styles.label, props.className)} />;
}

function Description(props: BlockProps) {
  return <SlotDescription {...props} className={cx(styles.description, props.className)} />;
}

export interface RadioProps extends Omit<RadioRootProps, 'children'> {
  /** The label; the title of a `card` option. */
  children?: ReactNode | undefined;
  /** A second line under the label. */
  description?: ReactNode | undefined;
  /** An icon or a small image, shown by the `card` variant. It hides when the card is narrow. */
  media?: ReactNode | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        mark?: Part<BlockProps> | undefined;
        media?: Part<{ children: ReactNode }> | undefined;
        label?: Part<{ children: ReactNode }> | undefined;
        description?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

/** One option of a `RadioGroup`. */
export function Radio({ children, description, media, parts, ...root }: RadioProps) {
  const card = useContext(VariantContext) === 'card';
  return (
    <Root {...root}>
      {renderPart(parts?.mark, {}, (p) => (
        <Mark {...p} />
      ))}
      {card &&
        media != null &&
        renderPart(parts?.media, { children: media }, (p) => <Media>{p.children}</Media>)}
      {children != null && renderPart(parts?.label, { children }, (p) => <Label>{p.children}</Label>)}
      {description != null &&
        renderPart(parts?.description, { children: description }, (p) => (
          <Description>{p.children}</Description>
        ))}
    </Root>
  );
}

Radio.Root = Root;
Radio.Mark = Mark;
Radio.Media = Media;
Radio.Label = Label;
Radio.Description = Description;

export interface RadioGroupRootProps extends BlockProps {
  /** Controlled: the `value` of the chosen option. */
  value?: string | null | undefined;
  defaultValue?: string | undefined;
  onChange?: ((value: string) => void) | undefined;
  /** `default`: a dot and a label. `card`: a bordered tile with a title, a description and an icon. */
  variant?: RadioVariant | undefined;
  /** The direction of the options, and of the arrow keys that move between them. */
  orientation?: 'vertical' | 'horizontal' | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  /** The text of the required marker after the group label. */
  requiredLabel?: string | undefined;
  /** Form field name. */
  name?: string | undefined;
  id?: string | undefined;
  /** Accessible name of a group that has no visible label. */
  'aria-label'?: string | undefined;
}

function GroupRoot({
  value,
  defaultValue,
  onChange,
  variant = 'default',
  orientation = 'vertical',
  disabled,
  readOnly,
  invalid,
  required,
  requiredLabel = 'Required',
  name,
  id,
  'aria-label': ariaLabel,
  className,
  style,
  children,
  ...rest
}: RadioGroupRootProps) {
  const slots = useTextSlots();
  const control = useFieldControl({
    id,
    disabled,
    required,
    invalid: invalid || slots.hasError,
    labelledBy: slots.labelledBy,
    describedBy: slots.describedBy,
  });
  const group = useRef<HTMLDivElement>(null);
  useUnnamedGroup(group, name);
  return (
    <AriaRadioGroup
      {...rootRender('div', rest)}
      data-umbra="radio-group"
      data-variant={variant}
      {...defined({ className: cx(groupClass, className), style, value, defaultValue, onChange })}
      orientation={orientation}
      isDisabled={control.disabled}
      {...defined({ isReadOnly: readOnly })}
      // Only when it is set: a `false` would tell React Aria that the app decides, and silence the
      // control's own validation (required, on submit).
      {...defined({ isInvalid: control.invalid || undefined })}
      isRequired={control.required}
      ref={group}
      {...defined({
        name,
        id: control.id,
        'aria-label': ariaLabel,
        'aria-labelledby': control.labelledBy,
        'aria-describedby': control.describedBy,
      })}
    >
      <ReportValidation />
      <TextSlotsProvider
        value={{ ...slots, marker: required && <Marker kind="required">{requiredLabel}</Marker> }}
      >
        <VariantContext value={variant}>
          {/* The group has taken the field around it; nothing inside it should take it too. */}
          <FieldContext value={noField}>
            <GroupDescribedBy value={control.describedBy}>{children}</GroupDescribedBy>
          </FieldContext>
        </VariantContext>
      </TextSlotsProvider>
    </AriaRadioGroup>
  );
}

function GroupLabel(props: BlockProps) {
  return <SlotLabel {...props} className={cx(groupLabelClass, props.className)} />;
}

export interface RadioGroupProps extends Omit<RadioGroupRootProps, 'children'> {
  /** The options. */
  children?: ReactNode | undefined;
  /** The group's label. */
  label?: ReactNode | undefined;
  /** A line under the label. */
  description?: ReactNode | undefined;
  /** An error message under the options, shown with an icon. Setting it makes the group invalid. */
  error?: ReactNode | undefined;
  /**
   * Lays the options in a grid of at most this many columns; columns drop as the group narrows.
   * `card` options are always in a grid, of one column by default.
   */
  columns?: number | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        label?: Part<{ children: ReactNode }> | undefined;
        description?: Part<{ children: ReactNode }> | undefined;
        options?: Part<{ columns?: number | undefined; children: ReactNode }> | undefined;
        error?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

/** A choice of exactly one option among a few, all visible at once. */
export function RadioGroup({
  children,
  label,
  description,
  error,
  columns,
  parts,
  ...root
}: RadioGroupProps) {
  const grid = columns ?? (root.variant === 'card' ? 1 : undefined);
  return (
    <GroupRoot {...root} invalid={root.invalid || error != null}>
      {label != null &&
        renderPart(parts?.label, { children: label }, (p) => <GroupLabel>{p.children}</GroupLabel>)}
      {description != null &&
        renderPart(parts?.description, { children: description }, (p) => (
          <SlotDescription>{p.children}</SlotDescription>
        ))}
      {renderPart(parts?.options, { columns: grid, children }, (p) => (
        <GroupOptions {...p} />
      ))}
      {error != null &&
        renderPart(parts?.error, { children: error }, (p) => <SlotError>{p.children}</SlotError>)}
    </GroupRoot>
  );
}

RadioGroup.Root = GroupRoot;
RadioGroup.Label = GroupLabel;
RadioGroup.Description = SlotDescription;
RadioGroup.Options = GroupOptions;
RadioGroup.Error = SlotError;
