import { render, screen } from '@testing-library/react';
import CenterMap from './CenterMap';

// react-leaflet renders a canvas-based map that requires real browser DOM APIs
// (ResizeObserver, SVG, etc.) not available in jsdom. Mocking the entire module
// lets us verify that CenterMap passes the right props without a real map.
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null,
  // Marker renders its children so the Popup content reaches the DOM
  Marker: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  // useMap is called inside the RecenterMap sub-component
  useMap: () => ({ setView: jest.fn() }),
}));

// Leaflet's module-level code calls L.icon() and sets Marker.prototype.options.
// Mocking it prevents "window is not defined" and similar jsdom errors.
jest.mock('leaflet', () => ({
  icon: jest.fn(() => ({})),
  Marker: { prototype: { options: {} } },
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CenterMap', () => {
  const defaultProps = { lat: 19.076, lng: 72.877, name: 'Sparkle Wash' };

  test('renders the map container', () => {
    render(<CenterMap {...defaultProps} />);
    // The map container is the outer element; its presence confirms the
    // component mounted without errors.
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  test('displays the center name inside the map popup', () => {
    render(<CenterMap {...defaultProps} />);
    // The Popup mock renders its children — the name prop — directly in the DOM.
    expect(screen.getByText('Sparkle Wash')).toBeInTheDocument();
  });

  test('displays a different center name when props change', () => {
    render(<CenterMap lat={28.6} lng={77.2} name="Delhi Auto Wash" />);
    expect(screen.getByText('Delhi Auto Wash')).toBeInTheDocument();
  });
});
