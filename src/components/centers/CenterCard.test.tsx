import { render, screen } from '@testing-library/react';
import CenterCard from './CenterCard';
import { useAuthStore } from '@/store/authStore';
import { CenterSearchResult } from '@/types/center';

// Replace the real Zustand store with a Jest mock so we control what
// `user` equals in each test without touching localStorage or real state.
jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));
 
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// A factory helper — build a valid center and override only the fields
// each test cares about. This keeps individual tests short and readable.
function makeCenter(overrides: Partial<CenterSearchResult> = {}): CenterSearchResult {
  return {
    id: 'center-1',
    name: 'Sparkle Wash',
    address: '12 Main Street, Mumbai',
    latitude: 19.076,
    longitude: 72.877,
    avg_rating: 4,
    total_reviews: 10,
    service_count: 3,
    distance_km: null,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Before every test, pretend the user is logged out.
// Individual tests can call mockUseAuthStore.mockReturnValue(...) to override this.
beforeEach(() => {
  // Zustand selector: (s) => s.user — the mock receives the selector and we
  // just return the value we want directly.
  mockUseAuthStore.mockReturnValue(null);
});

// ─── Rendering basics ────────────────────────────────────────────────────────

describe('CenterCard — basic rendering', () => {
  test('renders the center name', () => {
    render(<CenterCard center={makeCenter()} />);
    // getByText throws if the element is not found — good for must-exist content
    expect(screen.getByText('Sparkle Wash')).toBeInTheDocument();
  });

  test('renders the address', () => {
    render(<CenterCard center={makeCenter()} />);
    expect(screen.getByText('12 Main Street, Mumbai')).toBeInTheDocument();
  });

  test('renders the service count', () => {
    render(<CenterCard center={makeCenter({ service_count: 5 })} />);
    expect(screen.getByText(/5 services available/i)).toBeInTheDocument();
  });

  test('uses singular "service" when count is 1', () => {
    render(<CenterCard center={makeCenter({ service_count: 1 })} />);
    expect(screen.getByText(/1 service available/i)).toBeInTheDocument();
  });

  test('renders rating and review count', () => {
    render(<CenterCard center={makeCenter({ avg_rating: 3.7, total_reviews: 22 })} />);
    expect(screen.getByText(/3\.7/)).toBeInTheDocument();
    expect(screen.getByText(/22/)).toBeInTheDocument();
  });

  test('uses singular "review" when count is 1', () => {
    render(<CenterCard center={makeCenter({ total_reviews: 1 })} />);
    expect(screen.getByText(/1 review\b/i)).toBeInTheDocument();
  });
});

// ─── Distance badge ──────────────────────────────────────────────────────────

describe('CenterCard — distance badge', () => {
  test('shows distance badge when distance_km is provided', () => {
    render(<CenterCard center={makeCenter({ distance_km: 2.5 })} />);
    // queryByText returns null instead of throwing — use it to assert presence
    expect(screen.getByText('2.5 km')).toBeInTheDocument();
  });

  test('hides distance badge when distance_km is null', () => {
    render(<CenterCard center={makeCenter({ distance_km: null })} />);
    // queryByText is the right tool when you expect something NOT to be there
    expect(screen.queryByText(/km/)).not.toBeInTheDocument();
  });
});

// ─── Navigation link (auth-aware) ────────────────────────────────────────────

describe('CenterCard — View & Book link', () => {
  test('links directly to center page when user is logged in', () => {
    // Override the default (null) with a real user object
    mockUseAuthStore.mockReturnValue({
      id: 'u1',
      name: 'Test User',
      email: 'test@test.com',
      role: 'customer',
    } as ReturnType<typeof useAuthStore>);

    render(<CenterCard center={makeCenter({ id: 'center-42' })} />);

    // getByRole is preferred — it mirrors how a screen reader finds the element
    const link = screen.getByRole('link', { name: /view & book/i });
    expect(link).toHaveAttribute('href', '/centers/center-42');
  });

  test('redirects through login when user is logged out', () => {
    // mockUseAuthStore already returns null from beforeEach
    render(<CenterCard center={makeCenter({ id: 'center-42' })} />);

    const link = screen.getByRole('link', { name: /view & book/i });
    expect(link).toHaveAttribute('href', '/login?redirect=/centers/center-42');
  });
});

// ─── Star rating ─────────────────────────────────────────────────────────────

describe('CenterCard — star rating display', () => {
  test('fills exactly 3 stars for a rating of 3', () => {
    render(<CenterCard center={makeCenter({ avg_rating: 3 })} />);
    // The component renders ★ for filled and ☆ for empty
    const filled = screen.getAllByText('★');
    const empty = screen.getAllByText('☆');
    expect(filled).toHaveLength(3);
    expect(empty).toHaveLength(2);
  });

  test('fills all 5 stars for a rating of 5', () => {
    render(<CenterCard center={makeCenter({ avg_rating: 5 })} />);
    expect(screen.getAllByText('★')).toHaveLength(5);
    expect(screen.queryAllByText('☆')).toHaveLength(0);
  });
});
