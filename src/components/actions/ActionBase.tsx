// ActionBase (internal): renders an action as <a> (navigation) or <button> (in-page action), so
// every button and link component shares one implementation. It is the only place that opens a
// new tab: external links always get rel="noopener noreferrer" (AGENTS §14.1).

import type { MouseEventHandler, ReactNode } from 'react';

interface Common {
  readonly children: ReactNode;
  readonly className?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-describedby'?: string;
  readonly 'data-testid'?: string;
}

export interface ActionLinkProps extends Common {
  readonly href: string;
  /** Opens in a new tab, safely. */
  readonly external?: boolean;
  /** Download attribute, e.g. for the CV (ARCHITECTURE §8.3). */
  readonly download?: boolean | string;
}

export interface ActionButtonProps extends Common {
  readonly href?: undefined;
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  readonly type?: 'button' | 'submit';
  readonly disabled?: boolean;
  readonly 'aria-pressed'?: boolean;
  readonly 'aria-expanded'?: boolean;
  readonly 'aria-controls'?: string;
}

export type ActionProps = ActionLinkProps | ActionButtonProps;

export function ActionBase(props: ActionProps) {
  if (props.href !== undefined) {
    const { href, external, download, children, ...rest } = props;
    const downloadAttr = download === true ? '' : download || undefined;
    if (external) {
      return (
        // eslint-disable-next-line no-restricted-syntax -- the single shared external-link implementation
        <a {...rest} href={href} download={downloadAttr} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    return (
      <a {...rest} href={href} download={downloadAttr}>
        {children}
      </a>
    );
  }
  const { type = 'button', children, ...rest } = props;
  return (
    <button {...rest} type={type}>
      {children}
    </button>
  );
}
