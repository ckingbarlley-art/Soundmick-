import SyncedLyricsPlayer from '../contents/SyncedLyricsPlayer';

export default function Home() {
  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', padding: '20px', color: '#fff' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px', fontFamily: 'sans-serif' }}>
        Soundmick Player
      </h1>
      {/* Replace 'YOUR_TRACK_ID' with a real track UUID from your Supabase tracks table */}
      <SyncedLyricsPlayer trackId="YOUR_TRACK_ID" />
    </main>
  );
}
