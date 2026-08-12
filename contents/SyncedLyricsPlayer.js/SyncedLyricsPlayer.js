import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SyncedLyricsPlayer({ trackId }) {
  const [track, setTrack] = useState(null);
  const [lyrics, setLyrics] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const audioRef = useRef(null);

  // 1. Fetch Track Data & Synced Lyrics from Supabase
  useEffect(() => {
    async function loadTrackData() {
      // Get track metadata
      const { data: trackData } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', trackId)
        .single();

      if (trackData) setTrack(trackData);

      // Get .lrc format lyrics
      const { data: lyricData } = await supabase
        .from('synced_lyrics')
        .select('lrc_content')
        .eq('track_id', trackId)
        .single();

      if (lyricData?.lrc_content) {
        parseLRC(lyricData.lrc_content);
      }
    }

    if (trackId) loadTrackData();
  }, [trackId]);

  // 2. Parse .LRC format into timestamps & text
  const parseLRC = (lrcText) => {
    const lines = lrcText.split('\n');
    const parsed = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    lines.forEach((line) => {
      const match = timeRegex.exec(line);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3], 10);
        const totalSeconds = minutes * 60 + seconds + milliseconds / (match[3].length === 3 ? 1000 : 100);
        const text = line.replace(timeRegex, '').trim();
        if (text) parsed.push({ time: totalSeconds, text });
      }
    });

    setLyrics(parsed);
  };

  // 3. Track audio time & match active lyric line
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);

    // Find current line index based on playback time
    const index = lyrics.findIndex((line, i) => {
      const nextLine = lyrics[i + 1];
      return time >= line.time && (!nextLine || time < nextLine.time);
    });

    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  if (!track) return <div className="p-4 text-white">Loading audio track...</div>;

  return (
    <div className="max-w-md mx-auto bg-neutral-900 text-white rounded-2xl p-6 shadow-xl space-y-6">
      {/* Track Cover & Info */}
      <div className="flex items-center space-x-4">
        <img
          src={track.cover_art_url}
          alt={track.title}
          className="w-20 h-20 rounded-xl object-cover shadow-md"
        />
        <div>
          <h2 className="text-xl font-bold">{track.title}</h2>
          <p className="text-sm text-neutral-400">Soundmick Stream</p>
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={track.audio_url}
        controls
        onTimeUpdate={handleTimeUpdate}
        className="w-full rounded-lg"
      />

      {/* Real-time Synced Lyrics View */}
      <div className="h-64 overflow-y-auto space-y-4 text-center py-4 px-2 scrollbar-hide">
        {lyrics.length > 0 ? (
          lyrics.map((line, idx) => (
            <p
              key={idx}
              className={`transition-all duration-300 text-lg font-semibold ${
                idx === activeIndex
                  ? 'text-green-400 scale-105 opacity-100'
                  : 'text-neutral-500 opacity-50'
              }`}
            >
              {line.text}
            </p>
          ))
        ) : (
          <p className="text-neutral-500 italic">No lyrics provided for this track.</p>
        )}
      </div>
    </div>
  );
}
