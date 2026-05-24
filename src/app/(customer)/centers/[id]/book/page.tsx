// Server component — receives params and searchParams from Next.js, passes
// them as plain props so the client component avoids useSearchParams()
// (which would require a Suspense boundary in the page tree).
import BookingFlow from '@/components/booking/BookingFlow';

export default function BookPage({
  params,
  searchParams,
}: {
  params:       { id: string };
  searchParams: { serviceId?: string };
}) {
  return (
    <BookingFlow
      centerId={params.id}
      serviceId={searchParams.serviceId ?? ''}
    />
  );
}
