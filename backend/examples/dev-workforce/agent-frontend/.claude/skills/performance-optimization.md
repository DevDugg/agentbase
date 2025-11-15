# Performance Optimization Skill

Optimize React applications for speed, efficiency, and Core Web Vitals.

## Capabilities

- Analyze and fix performance bottlenecks
- Optimize bundle size
- Implement code splitting and lazy loading
- Optimize images and assets
- Implement caching strategies
- Optimize Core Web Vitals (LCP, FID, CLS)
- Use profiling tools effectively

## Performance Optimization Checklist

### 1. Bundle Size Optimization

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'utils': ['date-fns', 'lodash-es']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
```

### 2. Code Splitting & Lazy Loading

```typescript
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

// Lazy load route components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

// Lazy load with prefetch
const AdminPanel = lazy(() =>
  import(/* webpackPrefetch: true */ './pages/AdminPanel')
);

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Suspense>
  );
}

// Component-level code splitting
function HeavyFeature() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Load Chart</button>
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <LazyChart />
        </Suspense>
      )}
    </div>
  );
}

const LazyChart = lazy(() => import('./components/HeavyChart'));
```

### 3. Memoization

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive components
const ExpensiveList = memo<{ items: Item[]; onItemClick: (id: string) => void }>(
  ({ items, onItemClick }) => {
    console.log('ExpensiveList rendered');
    return (
      <ul>
        {items.map((item) => (
          <li key={item.id} onClick={() => onItemClick(item.id)}>
            {item.name}
          </li>
        ))}
      </ul>
    );
  },
  // Custom comparison function
  (prevProps, nextProps) => {
    return (
      prevProps.items.length === nextProps.items.length &&
      prevProps.onItemClick === nextProps.onItemClick
    );
  }
);

function ParentComponent() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState('');

  // Memoize expensive calculations
  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  // Memoize callbacks
  const handleItemClick = useCallback((id: string) => {
    console.log('Item clicked:', id);
  }, []);

  return (
    <>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      <ExpensiveList items={filteredItems} onItemClick={handleItemClick} />
    </>
  );
}
```

### 4. Virtual Scrolling

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: string[] }) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10 // Render 10 extra items outside viewport
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: '500px',
        overflow: 'auto'
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <div style={{ padding: '10px' }}>{items[virtualItem.index]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. Image Optimization

```typescript
// Optimized image component
function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <picture>
      {/* Modern formats */}
      <source srcSet={`${src}.avif`} type="image/avif" />
      <source srcSet={`${src}.webp`} type="image/webp" />

      {/* Responsive images */}
      <source
        media="(max-width: 768px)"
        srcSet={`${src}-mobile.jpg`}
      />
      <source
        media="(max-width: 1200px)"
        srcSet={`${src}-tablet.jpg`}
      />

      <img
        src={`${src}.jpg`}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s'
        }}
      />
    </picture>
  );
}

// Blur placeholder
function ImageWithBlurPlaceholder({
  src,
  blurDataURL,
  alt
}: {
  src: string;
  blurDataURL: string;
  alt: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      {/* Blur placeholder */}
      <img
        src={blurDataURL}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          filter: 'blur(10px)',
          opacity: isLoaded ? 0 : 1,
          transition: 'opacity 0.3s'
        }}
      />

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s'
        }}
      />
    </div>
  );
}
```

### 6. Debounce & Throttle

```typescript
import { useState, useEffect, useRef } from 'react';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook
function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, delay - (Date.now() - lastRan.current));

    return () => clearTimeout(handler);
  }, [value, delay]);

  return throttledValue;
}

// Usage
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### 7. Web Workers for Heavy Computation

```typescript
// worker.ts
self.addEventListener('message', (e: MessageEvent) => {
  const { type, data } = e.data;

  if (type === 'PROCESS_DATA') {
    // Heavy computation
    const result = processLargeDataset(data);
    self.postMessage({ type: 'RESULT', data: result });
  }
});

function processLargeDataset(data: any[]) {
  // Expensive operation
  return data.map((item) => ({
    ...item,
    processed: true,
    timestamp: Date.now()
  }));
}

// useWorker.ts
import { useEffect, useRef, useState } from 'react';

export function useWorker<T, R>(workerPath: string) {
  const workerRef = useRef<Worker>();
  const [result, setResult] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(new URL(workerPath, import.meta.url));

    workerRef.current.onmessage = (e: MessageEvent) => {
      setResult(e.data.data);
      setLoading(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [workerPath]);

  const execute = (data: T) => {
    setLoading(true);
    workerRef.current?.postMessage({ type: 'PROCESS_DATA', data });
  };

  return { execute, result, loading };
}

// Usage
function HeavyComputation() {
  const { execute, result, loading } = useWorker<any[], ProcessedData>(
    './worker.ts'
  );

  const handleProcess = () => {
    execute(largeDataset);
  };

  return (
    <div>
      <button onClick={handleProcess} disabled={loading}>
        Process Data
      </button>
      {loading && <p>Processing...</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

### 8. Profiling & Monitoring

```typescript
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  // Send to analytics
  console.log({
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  });

  // Send to monitoring service
  if (actualDuration > 100) {
    console.warn(`Slow render detected in ${id}: ${actualDuration}ms`);
  }
};

function App() {
  return (
    <Profiler id="App" onRender={onRender}>
      <YourApp />
    </Profiler>
  );
}

// Core Web Vitals monitoring
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics endpoint
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
getFCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Performance Best Practices

1. **Code split** routes and heavy components
2. **Lazy load** images and non-critical resources
3. **Memoize** expensive computations and components
4. **Virtualize** long lists
5. **Debounce** user input handlers
6. **Optimize** images (modern formats, lazy loading)
7. **Use Web Workers** for heavy computations
8. **Monitor** Core Web Vitals
9. **Profile** regularly with React DevTools
10. **Minimize** bundle size
