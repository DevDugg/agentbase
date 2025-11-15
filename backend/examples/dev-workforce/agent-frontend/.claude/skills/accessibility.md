# Accessibility (a11y) Skill

Build accessible web applications that work for everyone, following WCAG 2.1 AA standards.

## Capabilities

- Implement WCAG 2.1 AA compliance
- Create accessible forms and controls
- Ensure keyboard navigation
- Provide screen reader support
- Design with proper color contrast
- Use semantic HTML
- Implement ARIA patterns correctly

## Accessibility Checklist

### 1. Semantic HTML

```typescript
// ❌ Bad - Non-semantic
function ProductCard() {
  return (
    <div className="card">
      <div className="header">Product Name</div>
      <div>Description goes here</div>
      <div className="button" onClick={handleClick}>
        Buy Now
      </div>
    </div>
  );
}

// ✅ Good - Semantic HTML
function ProductCard() {
  return (
    <article className="card">
      <h2>Product Name</h2>
      <p>Description goes here</p>
      <button onClick={handleClick}>Buy Now</button>
    </article>
  );
}
```

### 2. Keyboard Navigation

```typescript
function AccessibleMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const items = ['Profile', 'Settings', 'Logout'];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
    }
  };

  useEffect(() => {
    if (isOpen && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, isOpen]);

  return (
    <div className="menu">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="menu-items"
      >
        Menu
      </button>

      {isOpen && (
        <ul
          id="menu-items"
          role="menu"
          onKeyDown={handleKeyDown}
          aria-label="User menu"
        >
          {items.map((item, index) => (
            <li key={item} role="none">
              <button
                ref={(el) => (itemRefs.current[index] = el)}
                role="menuitem"
                tabIndex={index === focusedIndex ? 0 : -1}
                onClick={() => handleMenuItemClick(item)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 3. Accessible Forms

```typescript
interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  value: string;
  onChange: (value: string) => void;
}

function AccessibleFormField({
  label,
  id,
  type = 'text',
  required = false,
  error,
  helpText,
  value,
  onChange
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && (
          <span aria-label="required" className="required">
            *
          </span>
        )}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={`${helpText ? helpId : ''} ${error ? errorId : ''}`.trim()}
      />

      {helpText && (
        <p id={helpId} className="help-text">
          {helpText}
        </p>
      )}

      {error && (
        <p id={errorId} className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Usage
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form onSubmit={handleSubmit} aria-label="Login form">
      <AccessibleFormField
        label="Email"
        id="email"
        type="email"
        required
        value={email}
        onChange={setEmail}
        error={errors.email}
        helpText="We'll never share your email"
      />

      <AccessibleFormField
        label="Password"
        id="password"
        type="password"
        required
        value={password}
        onChange={setPassword}
        error={errors.password}
      />

      <button type="submit">Log In</button>
    </form>
  );
}
```

### 4. Focus Management

```typescript
function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Trap focus inside modal
  useEffect(() => {
    if (!isOpen) return;

    // Save previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Get focusable elements
    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleTab);
      // Restore focus
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal"
      >
        <h2 id="modal-title">Modal Title</h2>
        {children}
        <button onClick={onClose} aria-label="Close dialog">
          Close
        </button>
      </div>
    </>
  );
}
```

### 5. Skip Links

```typescript
function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
  );
}

// CSS
const skipLinkStyles = `
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
`;

// Usage in layout
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink />
      <header>
        <Navigation />
      </header>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer>Footer content</footer>
    </>
  );
}
```

### 6. Screen Reader Announcements

```typescript
function LiveRegion({ message, type = 'polite' }: {
  message: string;
  type?: 'polite' | 'assertive';
}) {
  return (
    <div
      role="status"
      aria-live={type}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Hook for announcements
function useAnnounce() {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string) => {
    setAnnouncement(''); // Clear first
    setTimeout(() => setAnnouncement(message), 100);
  };

  return { announcement, announce };
}

// Usage
function SearchResults() {
  const { announcement, announce } = useAnnounce();
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (results.length > 0) {
      announce(`${results.length} results found`);
    }
  }, [results]);

  return (
    <>
      <LiveRegion message={announcement} />
      <ul aria-label="Search results">
        {results.map((result) => (
          <li key={result.id}>{result.title}</li>
        ))}
      </ul>
    </>
  );
}
```

### 7. Color Contrast

```typescript
// Ensure sufficient color contrast (WCAG AA: 4.5:1 for normal text, 3:1 for large text)

const colors = {
  // ✅ Good contrast (7.5:1)
  goodContrast: {
    background: '#ffffff',
    text: '#333333'
  },

  // ❌ Poor contrast (2.1:1) - FAILS
  poorContrast: {
    background: '#ffffff',
    text: '#cccccc'
  },

  // ✅ Good contrast for buttons (4.5:1)
  primaryButton: {
    background: '#0066cc',
    text: '#ffffff'
  }
};

// Use contrast checker tools:
// - WebAIM Contrast Checker
// - Chrome DevTools (Coverage tab)
// - axe DevTools
```

### 8. Accessible Icons & Images

```typescript
// Decorative icons (hidden from screen readers)
function DecorativeIcon() {
  return <Icon aria-hidden="true" />;
}

// Informative icons (with label)
function InformativeIcon() {
  return (
    <>
      <Icon aria-label="Delete" />
      {/* Or with visible text */}
      <Icon aria-hidden="true" />
      <span>Delete</span>
    </>
  );
}

// Images with alt text
function AccessibleImage({ src, alt, isDecorative = false }: {
  src: string;
  alt: string;
  isDecorative?: boolean;
}) {
  return (
    <img
      src={src}
      alt={isDecorative ? '' : alt}
      aria-hidden={isDecorative}
    />
  );
}

// Complex images with long description
function ComplexImage() {
  return (
    <figure>
      <img
        src="chart.png"
        alt="Sales chart"
        aria-describedby="chart-description"
      />
      <figcaption id="chart-description">
        Sales increased by 25% from Q1 to Q2, with the highest spike in March...
      </figcaption>
    </figure>
  );
}
```

### 9. Accessible Data Tables

```typescript
function AccessibleTable({ data }: { data: User[] }) {
  return (
    <table>
      <caption>User Directory</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Email</th>
          <th scope="col">Role</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((user) => (
          <tr key={user.id}>
            <th scope="row">{user.name}</th>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>
              <button aria-label={`Edit ${user.name}`}>Edit</button>
              <button aria-label={`Delete ${user.name}`}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 10. Testing Accessibility

```typescript
// Install testing libraries
// npm install -D @testing-library/react @testing-library/jest-dom jest-axe

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard accessible', async () => {
    const handleClick = vi.fn();
    const { getByRole } = render(<Button onClick={handleClick}>Click</Button>);

    const button = getByRole('button');
    button.focus();
    expect(button).toHaveFocus();

    // Press Enter
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalled();
  });

  it('should have proper ARIA attributes', () => {
    const { getByRole } = render(
      <Button disabled aria-label="Submit form">
        Submit
      </Button>
    );

    const button = getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Submit form');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});
```

## Tools & Resources

- **axe DevTools** - Browser extension for accessibility testing
- **WAVE** - Web accessibility evaluation tool
- **Lighthouse** - Built into Chrome DevTools
- **NVDA/JAWS** - Screen reader testing
- **Pa11y** - Automated accessibility testing
- **eslint-plugin-jsx-a11y** - Lint for accessibility issues

## Best Practices

1. **Use semantic HTML** (header, nav, main, article, etc.)
2. **Provide text alternatives** for non-text content
3. **Ensure keyboard accessibility** for all interactive elements
4. **Use sufficient color contrast** (4.5:1 minimum)
5. **Don't rely on color alone** to convey information
6. **Make focus indicators visible**
7. **Use ARIA attributes** when semantic HTML isn't enough
8. **Test with screen readers** regularly
9. **Support zoom up to 200%**
10. **Provide skip links** for navigation
