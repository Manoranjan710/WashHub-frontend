import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CentersListClient from './CentersListClient';
import { api } from '@/lib/axios';
import { CenterSearchResult } from '@/types/center';

// ─── Module mocks ─────────────────────────────────────────────────────────────

// CenterCard is tested in its own file. Here we replace it with a minimal stub
// so this test file only cares about CentersListClient's own behaviour (filtering,
// geo search, AI search, empty states) rather than card rendering details.
jest.mock('./CenterCard', () => ({
  __esModule: true,
  default: ({ center }: { center: CenterSearchResult }) => (
    <div data-testid="center-card">{center.name}</div>
  ),
}));

jest.mock('@/lib/axios', () => ({
  api: { get: jest.fn() },
}));

const mockGet = jest.mocked(api.get);

// ─── Test helpers ─────────────────────────────────────────────────────────────

// IntersectionObserver is used for infinite scroll; jsdom doesn't include it.
beforeAll(() => {
  global.IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    unobserve: jest.fn(),
  })) as unknown as typeof IntersectionObserver;
});

// A fresh QueryClient per test prevents query cache from leaking between tests.
// refetchOnMount: false keeps initialData stable — without this, React Query
// considers initialData immediately stale and triggers a background refetch
// that would overwrite the data we pass in.
function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

// Factory: build a CenterSearchResult with sensible defaults
function makeCenter(overrides: Partial<CenterSearchResult> = {}): CenterSearchResult {
  return {
    id: 'c1',
    name: 'Sparkle Wash',
    address: '12 Main St, Mumbai',
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

const CENTERS = [
  makeCenter({ id: '1', name: 'Alpha Wash',   address: 'Mumbai',   avg_rating: 4.5 }),
  makeCenter({ id: '2', name: 'Beta Clean',   address: 'Delhi',    avg_rating: 3.0 }),
  makeCenter({ id: '3', name: 'Gamma Shine',  address: 'Pune',     avg_rating: 4.8 }),
];

const INITIAL_DATA = { centers: CENTERS, hasMore: false, page: 1 };
const EMPTY_DATA   = { centers: [],      hasMore: false, page: 1 };

// ─── Initial render ───────────────────────────────────────────────────────────

describe('CentersListClient — initial render', () => {
  test('renders a card for every center in initialData', () => {
    renderWithQuery(<CentersListClient initialData={INITIAL_DATA} />);

    // getAllByTestId counts the stub cards we injected via the CenterCard mock
    expect(screen.getAllByTestId('center-card')).toHaveLength(3);
  });

  test('shows "No centers found" when initialData is empty', () => {
    renderWithQuery(<CentersListClient initialData={EMPTY_DATA} />);
    expect(screen.getByText(/no centers found/i)).toBeInTheDocument();
  });
});

// ─── Text filter ─────────────────────────────────────────────────────────────

describe('CentersListClient — text filter', () => {
  test('hides centers whose name does not match the typed query', async () => {
    const user = userEvent.setup();
    renderWithQuery(<CentersListClient initialData={INITIAL_DATA} />);

    // The filter is a <input type="search"> — role is "searchbox"
    await user.type(screen.getByRole('searchbox'), 'alpha');

    expect(screen.getByText('Alpha Wash')).toBeInTheDocument();
    expect(screen.queryByText('Beta Clean')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma Shine')).not.toBeInTheDocument();
  });

  test('matches by address as well as name', async () => {
    const user = userEvent.setup();
    renderWithQuery(<CentersListClient initialData={INITIAL_DATA} />);

    await user.type(screen.getByRole('searchbox'), 'delhi');

    // Only "Beta Clean" has address "Delhi"
    expect(screen.getByText('Beta Clean')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Wash')).not.toBeInTheDocument();
  });

  test('shows "Clear filters" button once the user has typed something', async () => {
    const user = userEvent.setup();
    renderWithQuery(<CentersListClient initialData={INITIAL_DATA} />);

    // Ensure no centers match so the empty state — which has "Clear filters" — appears
    await user.type(screen.getByRole('searchbox'), 'zzz');

    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  test('"Clear filters" button resets the text filter', async () => {
    const user = userEvent.setup();
    renderWithQuery(<CentersListClient initialData={INITIAL_DATA} />);

    await user.type(screen.getByRole('searchbox'), 'zzz');
    await user.click(screen.getByRole('button', { name: /clear filters/i }));

    // All 3 centers should be visible again
    expect(screen.getAllByTestId('center-card')).toHaveLength(3);
  });
});

// ─── Rating filter ────────────────────────────────────────────────────────────

describe('CentersListClient — rating filter', () => {
  test('hides centers below the selected minimum rating', async () => {
    const user = userEvent.setup();
    renderWithQuery(<CentersListClient initialData={INITIAL_DATA} />);

    // Find the rating <select> by its current display value
    const ratingSelect = screen.getByDisplayValue('Any rating');
    await user.selectOptions(ratingSelect, '4');

    // Alpha Wash (4.5) and Gamma Shine (4.8) pass; Beta Clean (3.0) does not
    expect(screen.getByText('Alpha Wash')).toBeInTheDocument();
    expect(screen.getByText('Gamma Shine')).toBeInTheDocument();
    expect(screen.queryByText('Beta Clean')).not.toBeInTheDocument();
  });
});

// ─── Geolocation ─────────────────────────────────────────────────────────────

describe('CentersListClient — geolocation', () => {
  const mockGetCurrentPosition = jest.fn();

  beforeEach(() => {
    mockGetCurrentPosition.mockReset();
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    });
  });

  test('"Use my location" button is present in the filter bar', () => {
    renderWithQuery(<CentersListClient initialData={EMPTY_DATA} />);
    expect(screen.getByRole('button', { name: /use my location/i })).toBeInTheDocument();
  });

  test('calls navigator.geolocation.getCurrentPosition when clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<CentersListClient initialData={EMPTY_DATA} />);

    await user.click(screen.getByRole('button', { name: /use my location/i }));

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
  });

  test('shows an error message when the user denies location access', async () => {
    // Call the error callback immediately to simulate denial
    mockGetCurrentPosition.mockImplementation((_success: unknown, error: () => void) => error());

    const user = userEvent.setup();
    renderWithQuery(<CentersListClient initialData={EMPTY_DATA} />);

    await user.click(screen.getByRole('button', { name: /use my location/i }));

    expect(screen.getByText(/location access denied/i)).toBeInTheDocument();
  });

  test('shows "Clear location" button after successful geolocation', async () => {
    // Call the success callback immediately with fake coordinates
    mockGetCurrentPosition.mockImplementation(
      (success: (pos: { coords: { latitude: number; longitude: number } }) => void) =>
        success({ coords: { latitude: 19.076, longitude: 72.877 } })
    );

    // When coords change the component fires a new query (geo search); mock it
    mockGet.mockResolvedValue({
      data: { data: { centers: [], hasMore: false, page: 1 } },
    });

    const user = userEvent.setup();
    renderWithQuery(<CentersListClient initialData={EMPTY_DATA} />);

    await user.click(screen.getByRole('button', { name: /use my location/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear location/i })).toBeInTheDocument();
    });
  });
});

// ─── AI semantic search ───────────────────────────────────────────────────────

describe('CentersListClient — AI search', () => {
  const aiInput = () =>
    screen.getByPlaceholderText(/eco-friendly steam clean/i);

  const searchButton = () =>
    screen.getByRole('button', { name: /^search$/i });

  test('the Search button is disabled when the AI input is empty', () => {
    renderWithQuery(<CentersListClient initialData={EMPTY_DATA} />);
    // The button has disabled={!aiQuery.trim()}, so an empty field disables it
    expect(searchButton()).toBeDisabled();
  });

  test('shows AI result cards after a successful search', async () => {
    const user = userEvent.setup();
    const aiCenter = makeCenter({ id: 'ai1', name: 'Eco Steam Wash' });

    mockGet.mockResolvedValueOnce({
      data: { data: { centers: [aiCenter], degraded: false } },
    });

    renderWithQuery(<CentersListClient initialData={INITIAL_DATA} />);

    await user.type(aiInput(), 'eco steam');
    await user.click(searchButton());

    // waitFor is required: the api call is async and state updates after it resolves
    await waitFor(() => {
      expect(screen.getByText('Eco Steam Wash')).toBeInTheDocument();
    });

    // The semantic mode banner should also appear
    expect(screen.getByText(/best matches for/i)).toBeInTheDocument();
  });

  test('shows an error banner when the AI search API call fails', async () => {
    const user = userEvent.setup();

    mockGet.mockRejectedValueOnce(new Error('Network error'));

    renderWithQuery(<CentersListClient initialData={EMPTY_DATA} />);

    await user.type(aiInput(), 'eco steam');
    await user.click(searchButton());

    await waitFor(() => {
      expect(screen.getByText(/search failed/i)).toBeInTheDocument();
    });
  });

  test('"Clear search" exits semantic mode and restores the browse list', async () => {
    const user = userEvent.setup();

    mockGet.mockResolvedValueOnce({
      data: { data: { centers: [makeCenter({ id: 'ai1', name: 'Eco Steam Wash' })], degraded: false } },
    });

    renderWithQuery(<CentersListClient initialData={INITIAL_DATA} />);

    await user.type(aiInput(), 'eco steam');
    await user.click(searchButton());

    // Wait until semantic mode is active
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /clear search/i }));

    // Semantic mode banner gone; back to the normal browse list
    expect(screen.queryByText(/best matches for/i)).not.toBeInTheDocument();
    expect(screen.getAllByTestId('center-card')).toHaveLength(3);
  });
});
