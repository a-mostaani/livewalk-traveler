const ANDROID_DOWNLOAD_URL = 'https://rendezvous-livewalk-apks.webpeter.com/api/downloads/LivelyWalk-Traveler.apk';

export function AndroidDownload() {
  return (
    <section className="android-download" aria-labelledby="android-download-heading">
      <div className="android-download-copy">
        <span className="android-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M8.1 5.1 6.7 2.7a.6.6 0 0 1 1-.6l1.5 2.5a8.7 8.7 0 0 1 5.6 0l1.5-2.5a.6.6 0 1 1 1 .6l-1.4 2.4A7.6 7.6 0 0 1 20 11H4a7.6 7.6 0 0 1 4.1-5.9ZM8 8.6a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Zm8 0a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8ZM4 12h16v6.7a2 2 0 0 1-2 2h-1v1.8a1.5 1.5 0 0 1-3 0v-1.8h-4v1.8a1.5 1.5 0 0 1-3 0v-1.8H6a2 2 0 0 1-2-2V12Z" />
          </svg>
        </span>
        <div>
          <span className="overline">LIVELYWALK FOR ANDROID</span>
          <h2 id="android-download-heading">Take Traveler with you.</h2>
          <p>Download the current Android app directly to your phone.</p>
        </div>
      </div>
      <div className="android-download-action">
        <a className="button button-primary android-download-button" href={ANDROID_DOWNLOAD_URL} download>
          <span aria-hidden="true">↓</span> Download for Android
        </a>
        <ol aria-label="Android installation steps">
          <li>Tap download.</li>
          <li>Allow your browser to install unknown apps if prompted.</li>
          <li>Open LivelyWalk.</li>
        </ol>
      </div>
    </section>
  );
}
