import type { ReactNode } from 'react';
import { Switch as AriaSwitch } from 'react-aria-components';
import { RawIcon } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import { SlotDescription, SlotLabel, TextSlotsProvider, useTextSlots, type BlockProps } from './fieldParts';
import styles from './Toggle.module.css';
import { useFieldControl } from './useField';

export interface ToggleRootProps extends BlockProps {
  /** Controlled state. */
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Focusable, but cannot be changed. */
  readOnly?: boolean;
  /** `small` is for use inside table cells and dense toolbars. Otherwise the size follows the density level. */
  size?: 'default' | 'small';
  /** The side of the switch the label is on. */
  labelPosition?: 'start' | 'end';
  /** Form field name. */
  name?: string;
  /** The form value when on. */
  value?: string;
  id?: string;
  /** Accessible name of a toggle that has no visible label. */
  'aria-label'?: string;
}

function Root({
  checked,
  defaultChecked,
  onChange,
  disabled,
  readOnly,
  size = 'default',
  labelPosition = 'end',
  name,
  value,
  id,
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: ToggleRootProps) {
  const slots = useTextSlots();
  const control = useFieldControl({
    id,
    disabled,
    labelledBy: slots.labelledBy,
    describedBy: slots.describedBy,
  });
  return (
    <AriaSwitch
      data-umbra="toggle"
      data-size={size}
      data-label-position={labelPosition}
      className={cx(styles.root, className)}
      style={style}
      isSelected={checked}
      defaultSelected={defaultChecked}
      onChange={onChange}
      isDisabled={control.disabled}
      isReadOnly={readOnly}
      name={name}
      value={value}
      id={control.id}
      aria-label={ariaLabel}
      aria-labelledby={control.labelledBy}
      aria-describedby={control.describedBy}
    >
      <TextSlotsProvider value={slots}>{children}</TextSlotsProvider>
    </AriaSwitch>
  );
}

/** The track and its thumb. The thumb carries a check mark while the toggle is on. */
function Track({ className, style, children }: BlockProps) {
  return (
    <span data-part="track" aria-hidden="true" className={cx(styles.track, className)} style={style}>
      <span data-part="thumb" className={styles.thumb}>
        {children ?? <RawIcon name="check" />}
      </span>
    </span>
  );
}

function Label(props: BlockProps) {
  return <SlotLabel {...props} className={cx(styles.text, props.className)} />;
}

function Description(props: BlockProps) {
  return <SlotDescription {...props} className={cx(styles.text, props.className)} />;
}

export interface ToggleProps extends Omit<ToggleRootProps, 'children'> {
  /** The label. */
  children?: ReactNode;
  /** A second line under the label. */
  description?: ReactNode;
  /** Replace or hide named pieces. */
  parts?: {
    track?: Part<BlockProps>;
    label?: Part<{ children: ReactNode }>;
    description?: Part<{ children: ReactNode }>;
  };
}

/** A switch for a setting that takes effect at once: on or off. */
export function Toggle({ children, description, parts, ...root }: ToggleProps) {
  return (
    <Root {...root}>
      {renderPart(parts?.track, {}, (p) => (
        <Track {...p} />
      ))}
      {children != null && renderPart(parts?.label, { children }, (p) => <Label>{p.children}</Label>)}
      {description != null &&
        renderPart(parts?.description, { children: description }, (p) => (
          <Description>{p.children}</Description>
        ))}
    </Root>
  );
}

Toggle.Root = Root;
Toggle.Track = Track;
Toggle.Label = Label;
Toggle.Description = Description;
