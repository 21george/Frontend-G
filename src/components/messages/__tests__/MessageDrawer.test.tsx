import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageDrawer } from '../MessageDrawer';

// Stub the heavy hooks so the test only exercises the accessibility contract.
vi.mock('@/hooks/useMessages', () => ({
  useMessages: () => ({ data: undefined, isLoading: false }),
  useSendMessage: () => ({ mutateAsync: vi.fn() }),
  useUploadMessageMedia: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/lib/useSocketChat', () => ({
  useSocketChat: () => ({
    connected: false,
    incomingMessages: [],
    clearIncoming: () => {},
  }),
}));

beforeAll(() => {
  // jsdom does not implement scrollIntoView
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
});

describe('MessageDrawer accessibility (Radix DialogTitle contract)', () => {
  it('renders a DialogTitle when a client is selected', () => {
    render(
      <MessageDrawer
        open
        onClose={() => {}}
        client={{ id: 'c1', name: 'Alice', active: true }}
      />,
    );
    // Radix renders the Title with a generated id and links it via
    // aria-labelledby on DialogContent. We assert on the visible text
    // the title contributes, not the implementation detail.
    expect(
      screen.getByText(/Messages with Alice/i, { selector: 'h2' }),
    ).toBeInTheDocument();
  });

  it('renders a DialogTitle even when no client is selected', () => {
    render(<MessageDrawer open onClose={() => {}} client={null} />);
    expect(
      screen.getByText(/^Messages$/i, { selector: 'h2' }),
    ).toBeInTheDocument();
  });

  it('hides the title visually via sr-only', () => {
    const { container } = render(
      <MessageDrawer
        open
        onClose={() => {}}
        client={{ id: 'c1', name: 'Alice', active: true }}
      />,
    );
    // Radix's Title renders as h2 by default, but forwarding className
    // through forwardRef may keep it as h2 — assert on the text content
    // (the accessible name) plus the sr-only class, regardless of tag.
    const title = screen.getByText(/Messages with Alice/i);
    expect(title).toBeInTheDocument();
    expect(title.className).toMatch(/sr-only/);
  });
});
