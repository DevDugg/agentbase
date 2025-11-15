# React Component Development Skill

Build production-ready React components with TypeScript, accessibility, and best practices.

## Capabilities

- Create reusable, typed React components
- Implement proper accessibility (WCAG 2.1 AA)
- Design component APIs with TypeScript
- Handle edge cases and error states
- Write comprehensive tests
- Optimize for performance
- Support responsive design

## Component Template

```typescript
import React, { useState, useCallback, useRef, useEffect } from 'react';

// Props interface with JSDoc comments
interface ButtonProps {
  /** Button text or content */
  children: React.ReactNode;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Additional CSS classes */
  className?: string;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** Icon to display before text */
  icon?: React.ReactNode;
}

/**
 * Accessible, customizable button component
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="lg" onClick={handleClick}>
 *   Click Me
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      fullWidth = false,
      onClick,
      className = '',
      type = 'button',
      icon,
      ...props
    },
    ref
  ) => {
    // Combine class names
    const classNames = [
      'button',
      `button--${variant}`,
      `button--${size}`,
      fullWidth && 'button--full-width',
      loading && 'button--loading',
      disabled && 'button--disabled',
      className
    ]
      .filter(Boolean)
      .join(' ');

    // Handle click with loading state
    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (loading || disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      },
      [loading, disabled, onClick]
    );

    return (
      <button
        ref={ref}
        type={type}
        className={classNames}
        onClick={handleClick}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="button__spinner" role="status" aria-label="Loading">
              <LoadingSpinner />
            </span>
            <span className="sr-only">Loading...</span>
          </>
        ) : (
          <>
            {icon && <span className="button__icon">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Loading spinner component
function LoadingSpinner() {
  return (
    <svg className="spinner" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="spinner__circle" cx="12" cy="12" r="10" />
    </svg>
  );
}
```

## Styles (CSS Module)

```css
/* Button.module.css */
.button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: inherit;
  font-weight: 600;
  line-height: 1.5;
  text-align: center;
  white-space: nowrap;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Variants */
.button--primary {
  background: #0066cc;
  color: white;
}

.button--primary:hover:not(:disabled) {
  background: #0052a3;
}

.button--secondary {
  background: #6c757d;
  color: white;
}

.button--secondary:hover:not(:disabled) {
  background: #5a6268;
}

.button--danger {
  background: #dc3545;
  color: white;
}

.button--danger:hover:not(:disabled) {
  background: #c82333;
}

/* Sizes */
.button--sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.button--md {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.button--lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

/* States */
.button--full-width {
  width: 100%;
}

.button--loading {
  pointer-events: none;
  opacity: 0.7;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Loading spinner */
.button__spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
}

.spinner {
  animation: rotate 1s linear infinite;
  width: 100%;
  height: 100%;
}

.spinner__circle {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-dasharray: 60;
  stroke-dashoffset: 45;
  stroke-linecap: round;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Click me
      </Button>
    );

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', async () => {
    const handleClick = vi.fn();
    render(
      <Button loading onClick={handleClick}>
        Click me
      </Button>
    );

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    await userEvent.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('applies correct variant classes', () => {
    const { rerender } = render(<Button variant="primary">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('button--primary');

    rerender(<Button variant="danger">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('button--danger');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Click me</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
```

## Custom Hook Example

```typescript
// useToggle.ts
import { useState, useCallback } from 'react';

interface UseToggleReturn {
  value: boolean;
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
  setValue: (value: boolean) => void;
}

export function useToggle(initialValue = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((v) => !v);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return { value, toggle, setTrue, setFalse, setValue };
}

// Usage
function Modal() {
  const { value: isOpen, setTrue: open, setFalse: close } = useToggle(false);

  return (
    <>
      <Button onClick={open}>Open Modal</Button>
      {isOpen && <ModalDialog onClose={close} />}
    </>
  );
}
```

## Best Practices

1. **Use TypeScript** for type safety
2. **Make components accessible** (ARIA, semantic HTML, keyboard support)
3. **Forward refs** for flexibility
4. **Use memo** for performance when needed
5. **Write tests** for all components
6. **Support dark mode** when applicable
7. **Document props** with JSDoc
8. **Handle edge cases** (loading, error, empty states)
