import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CenterReviews from './CenterReviews';
import { api } from '@/lib/axios';
import { Review } from '@/types/center';

// Replace the axios instance with a jest spy so tests can control API responses
// without making real network requests.
jest.mock('@/lib/axios', () => ({
  api: { get: jest.fn() },
}));

// jest.mocked gives TypeScript the correct mock type so .mockResolvedValueOnce
// etc. are available without casting.
const mockGet = jest.mocked(api.get);

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'r1',
    booking_id: 'b1',
    customer_id: 'u1',
    center_id: 'c1',
    rating: 4,
    comment: 'Great service!',
    vendor_reply: null,
    created_at: '2024-03-15T10:00:00Z',
    customer: { name: 'Alice' },
    ...overrides,
  };
}

// ─── Empty state ─────────────────────────────────────────────────────────────

describe('CenterReviews — empty state', () => {
  test('shows a prompt when there are no reviews', () => {
    render(
      <CenterReviews
        centerId="c1"
        initialData={{ reviews: [], total: 0, pages: 0 }}
      />
    );
    // When total === 0, the component renders an invite-to-review message
    // instead of the reviews list.
    expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument();
  });
});

// ─── Review card content ──────────────────────────────────────────────────────

describe('CenterReviews — review cards', () => {
  test('renders all reviews provided in initialData', () => {
    const reviews = [
      makeReview({ id: 'r1', customer: { name: 'Alice' } }),
      makeReview({ id: 'r2', customer: { name: 'Bob' } }),
    ];

    render(
      <CenterReviews
        centerId="c1"
        initialData={{ reviews, total: 2, pages: 1 }}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  test('shows the review comment when present', () => {
    render(
      <CenterReviews
        centerId="c1"
        initialData={{
          reviews: [makeReview({ comment: 'Excellent wash!' })],
          total: 1,
          pages: 1,
        }}
      />
    );
    expect(screen.getByText('Excellent wash!')).toBeInTheDocument();
  });

  test('hides the comment section when comment is null', () => {
    render(
      <CenterReviews
        centerId="c1"
        initialData={{
          reviews: [makeReview({ comment: null })],
          total: 1,
          pages: 1,
        }}
      />
    );
    // The paragraph only renders when comment is truthy
    expect(screen.queryByText('Great service!')).not.toBeInTheDocument();
  });

  test('shows the vendor reply section when a reply exists', () => {
    render(
      <CenterReviews
        centerId="c1"
        initialData={{
          reviews: [makeReview({ vendor_reply: 'Thank you for your kind words!' })],
          total: 1,
          pages: 1,
        }}
      />
    );
    expect(screen.getByText(/response from owner/i)).toBeInTheDocument();
    expect(screen.getByText('Thank you for your kind words!')).toBeInTheDocument();
  });

  test('hides the vendor reply section when vendor_reply is null', () => {
    render(
      <CenterReviews
        centerId="c1"
        initialData={{
          reviews: [makeReview({ vendor_reply: null })],
          total: 1,
          pages: 1,
        }}
      />
    );
    expect(screen.queryByText(/response from owner/i)).not.toBeInTheDocument();
  });

  test('renders the correct number of filled stars for a rating of 4', () => {
    render(
      <CenterReviews
        centerId="c1"
        initialData={{
          reviews: [makeReview({ rating: 4 })],
          total: 1,
          pages: 1,
        }}
      />
    );
    expect(screen.getAllByText('★')).toHaveLength(4);
    expect(screen.getAllByText('☆')).toHaveLength(1);
  });
});

// ─── "Load more" button ───────────────────────────────────────────────────────

describe('CenterReviews — pagination', () => {
  test('shows the "Load more" button with remaining count when more pages exist', () => {
    // page starts at 1, pages = 2, total = 3, showing 2 reviews → 1 remaining
    render(
      <CenterReviews
        centerId="c1"
        initialData={{
          reviews: [
            makeReview({ id: 'r1' }),
            makeReview({ id: 'r2', customer: { name: 'Bob' } }),
          ],
          total: 3,
          pages: 2,
        }}
      />
    );
    expect(screen.getByRole('button', { name: /load more reviews \(1 remaining\)/i })).toBeInTheDocument();
  });

  test('hides the "Load more" button when all pages are loaded', () => {
    // page = 1 and pages = 1 → page is NOT less than pages → no button
    render(
      <CenterReviews
        centerId="c1"
        initialData={{
          reviews: [makeReview()],
          total: 1,
          pages: 1,
        }}
      />
    );
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
  });

  test('appends new reviews when "Load more" is clicked', async () => {
    const user = userEvent.setup();
    const review1 = makeReview({ id: 'r1', customer: { name: 'Alice' } });
    const review2 = makeReview({ id: 'r2', customer: { name: 'Bob' } });

    // Simulate the API returning the second page of reviews
    mockGet.mockResolvedValueOnce({
      data: {
        data: { reviews: [review2], total: 2, pages: 2 },
      },
    });

    render(
      <CenterReviews
        centerId="c1"
        initialData={{ reviews: [review1], total: 2, pages: 2 }}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /load more/i }));

    // waitFor is needed because the API call is async — React re-renders after
    // the promise resolves, not synchronously when the button is clicked.
    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    // After loading page 2 of 2, there are no more pages — button disappears
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
  });

  test('calls the API with the correct centerId and next page number', async () => {
    const user = userEvent.setup();

    mockGet.mockResolvedValueOnce({
      data: { data: { reviews: [], total: 1, pages: 2 } },
    });

    render(
      <CenterReviews
        centerId="center-99"
        initialData={{ reviews: [makeReview()], total: 1, pages: 2 }}
      />
    );

    await user.click(screen.getByRole('button', { name: /load more/i }));

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        '/centers/center-99/reviews',
        { params: { page: 2 } }
      );
    });
  });
});
