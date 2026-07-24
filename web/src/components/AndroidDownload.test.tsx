import { render, screen } from '@testing-library/react';
import { AndroidDownload } from './AndroidDownload';

describe('AndroidDownload', () => {
  it('offers the stable Android package and concise install guidance', () => {
    render(<AndroidDownload />);

    expect(screen.getByRole('link', { name: /download for android/i })).toHaveAttribute(
      'href',
      'https://rendezvous-livewalk-apks.webpeter.com/api/downloads/LivelyWalk-Traveler.apk',
    );
    expect(screen.getByText(/allow your browser to install unknown apps/i)).toBeInTheDocument();
    expect(screen.queryByText(/commit|version/i)).not.toBeInTheDocument();
  });
});
