import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const FALLBACK_TRACKS = [
  { id: 1, title: 'SoundHelix 1', artist: 'SoundHelix', album: 'Preview Set', language: 'English', duration: 356, mood: 'Electronic', emoji: '🎧', color: ['#1db954', '#0f6f38'], src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'SoundHelix 2', artist: 'SoundHelix', album: 'Preview Set', language: 'English', duration: 299, mood: 'Chill', emoji: '🌌', color: ['#0ea5e9', '#1d4ed8'], src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'SoundHelix 3', artist: 'SoundHelix', album: 'Preview Set', language: 'English', duration: 311, mood: 'Ambient', emoji: '🌊', color: ['#ef4444', '#f97316'], src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 4, title: 'SoundHelix 4', artist: 'SoundHelix', album: 'Preview Set', language: 'English', duration: 287, mood: 'Focus', emoji: '🚀', color: ['#6366f1', '#1e3a8a'], src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
];

const MIX_CARDS = [
  { id: 'mix-1', title: 'Bollywood Top 50', subtitle: 'Gaana style picks for your evenings', emoji: '🔥', c1: '#ef4444', c2: '#f97316' },
  { id: 'mix-2', title: 'Daily Drive Mix', subtitle: 'Spotify-inspired smooth transitions', emoji: '🚘', c1: '#22c55e', c2: '#166534' },
  { id: 'mix-3', title: 'Indie Fresh', subtitle: 'New independent artists of the week', emoji: '✨', c1: '#8b5cf6', c2: '#4338ca' },
  { id: 'mix-4', title: 'Gym Hype', subtitle: 'High energy tracks for workouts', emoji: '⚡', c1: '#0ea5e9', c2: '#1d4ed8' },
];

const NAV = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'search', label: 'Search', icon: '⌕' },
  { id: 'library', label: 'Your Library', icon: '☰' },
  { id: 'radio', label: 'Radio', icon: '◉' },
];

const PLAYLISTS = [
  { id: 'liked', name: 'Liked Songs', count: 74, accent: 'accent-green' },
  { id: 'hindi', name: 'Hindi Hits', count: 41, accent: 'accent-warm' },
  { id: 'english', name: 'English Pop', count: 29, accent: 'accent-blue' },
  { id: 'focus', name: 'Focus Mode', count: 22, accent: 'accent-violet' },
];

const COLOR_PALETTE = [
  ['#1db954', '#0f6f38'],
  ['#0ea5e9', '#1d4ed8'],
  ['#ef4444', '#f97316'],
  ['#6366f1', '#1e3a8a'],
  ['#22c55e', '#166534'],
  ['#8b5cf6', '#4338ca'],
  ['#14b8a6', '#0f766e'],
  ['#ec4899', '#9333ea'],
];

const emojiForGenre = (genre = '') => {
  const g = genre.toLowerCase();
  if (g.includes('dance') || g.includes('electronic')) return '🪩';
  if (g.includes('hip') || g.includes('rap')) return '🎤';
  if (g.includes('rock')) return '🎸';
  if (g.includes('pop')) return '🎵';
  if (g.includes('ambient') || g.includes('chill')) return '🌙';
  if (g.includes('indie')) return '✨';
  return '🎧';
};

const paletteForSeed = (seedText) => {
  let hash = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    hash = seedText.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
};

const fetchTracksFromFreeApis = async () => {
  const terms = ['bollywood', 'arijit singh', 'ed sheeran', 'indie india', 'lofi beats'];

  const responses = await Promise.all(
    terms.map((term) =>
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=18`)
    )
  );

  const payloads = await Promise.all(
    responses.map(async (response) => {
      if (!response.ok) throw new Error('Failed to load iTunes catalog');
      return response.json();
    })
  );

  const seen = new Set();
  const merged = [];

  payloads.forEach((payload) => {
    (payload.results || []).forEach((item) => {
      if (!item.previewUrl) return;
      const key = item.trackId || `${item.artistName}-${item.trackName}`;
      if (seen.has(key)) return;
      seen.add(key);

      const color = paletteForSeed(`${item.artistName || ''}${item.trackName || ''}`);
      merged.push({
        id: key,
        title: item.trackName || 'Untitled Track',
        artist: item.artistName || 'Unknown Artist',
        album: item.collectionName || 'Unknown Album',
        language: (item.country || 'Global').toUpperCase(),
        duration: Math.max(25, Math.round((item.trackTimeMillis || 30000) / 1000)),
        mood: item.primaryGenreName || 'Mix',
        emoji: emojiForGenre(item.primaryGenreName),
        color,
        src: item.previewUrl,
      });
    });
  });

  return merged.slice(0, 40);
};

const fmt = (seconds) => {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};

function SongRow({ track, index, isCurrent, isPlaying, isLiked, onPlay, onLike }) {
  return (
    <div className={`song-row ${isCurrent ? 'song-row--active' : ''}`} onClick={() => onPlay(track)} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onPlay(track)}>
      <span className="song-index">{isCurrent && isPlaying ? '♪' : index + 1}</span>
      <span className="song-art" style={{ background: `linear-gradient(135deg, ${track.color[0]}, ${track.color[1]})` }}>{track.emoji}</span>
      <span className="song-main">
        <span className="song-title">{track.title}</span>
        <span className="song-sub">{track.artist} · {track.album}</span>
      </span>
      <span className="song-pill">{track.language}</span>
      <span className="song-pill">{track.mood}</span>
      <button
        type="button"
        className={`song-like ${isLiked ? 'song-like--active' : ''}`}
        onClick={(event) => {
          event.stopPropagation();
          onLike(track.id);
        }}
      >
        {isLiked ? '♥' : '♡'}
      </button>
      <span className="song-time">{fmt(track.duration)}</span>
    </div>
  );
}

export default function App() {
  const [activeNav, setActiveNav] = useState('home');
  const [tracks, setTracks] = useState(FALLBACK_TRACKS);
  const [currentTrackId, setCurrentTrackId] = useState(FALLBACK_TRACKS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [totalDuration, setTotalDuration] = useState(FALLBACK_TRACKS[0].duration);
  const [volume, setVolume] = useState(78);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [sleepLeft, setSleepLeft] = useState(0);
  const [search, setSearch] = useState('');
  const [activePlaylist, setActivePlaylist] = useState('liked');
  const [apiLoading, setApiLoading] = useState(false);
  const [apiSource, setApiSource] = useState('Fallback');
  const [apiError, setApiError] = useState('');
  const [lyricsPreview, setLyricsPreview] = useState('');
  const [liked, setLiked] = useState(new Set([1, 3, 5, 9]));

  const currentTrack = useMemo(() => tracks.find((track) => track.id === currentTrackId) || tracks[0], [tracks, currentTrackId]);

  const audioRef = useRef(new Audio(FALLBACK_TRACKS[0].src));
  const sleepTimerRef = useRef(null);

  const loadTracksFromApi = useCallback(async () => {
    setApiLoading(true);
    setApiError('');
    try {
      const apiTracks = await fetchTracksFromFreeApis();
      if (!apiTracks.length) throw new Error('No playable tracks returned');
      setTracks(apiTracks);
      setCurrentTrackId(apiTracks[0].id);
      setTotalDuration(apiTracks[0].duration);
      setElapsed(0);
      setApiSource('iTunes Search API');
    } catch (error) {
      setApiError(error.message || 'Unable to fetch tracks');
      setApiSource('Fallback');
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTracksFromApi();
  }, [loadTracksFromApi]);

  const homeTracks = useMemo(() => tracks.slice(0, 6), [tracks]);
  const chartTracks = useMemo(() => tracks.filter((track) => track.language.includes('IN')).slice(0, 8), [tracks]);
  const queueTracks = useMemo(() => tracks.slice(4), [tracks]);

  const filteredTracks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((track) => {
      const blob = `${track.title} ${track.artist} ${track.album} ${track.language} ${track.mood}`.toLowerCase();
      return blob.includes(q);
    });
  }, [search, tracks]);

  const nextTrack = useCallback((direction) => {
    if (!tracks.length || !currentTrack) return;
    const index = tracks.findIndex((track) => track.id === currentTrack.id);
    const nextIndex = shuffle
      ? Math.floor(Math.random() * tracks.length)
      : (index + direction + tracks.length) % tracks.length;
    setCurrentTrackId(tracks[nextIndex].id);
    setIsPlaying(true);
  }, [currentTrack, shuffle, tracks]);

  const playTrack = useCallback((track) => {
    if (currentTrack && track.id === currentTrack.id) {
      setIsPlaying((state) => !state);
      return;
    }
    setCurrentTrackId(track.id);
    setElapsed(0);
    setTotalDuration(track.duration);
    setIsPlaying(true);
  }, [currentTrack]);

  useEffect(() => {
    if (!currentTrack) return undefined;
    const audio = audioRef.current;

    const handleTimeUpdate = () => setElapsed(audio.currentTime || 0);
    const handleLoadedMetadata = () => {
      setTotalDuration(Number.isFinite(audio.duration) ? audio.duration : currentTrack.duration);
    };
    const handleEnded = () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play().catch(() => setIsPlaying(false));
        return;
      }
      nextTrack(1);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack.duration, nextTrack, repeat]);

  useEffect(() => {
    if (!currentTrack) return;
    const audio = audioRef.current;
    audio.src = currentTrack.src;
    audio.load();
    setElapsed(0);
    setTotalDuration(currentTrack.duration);

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (!currentTrack) return;

    const fetchLyricsPreview = async () => {
      try {
        const response = await fetch(
          `https://api.lyrics.ovh/v1/${encodeURIComponent(currentTrack.artist)}/${encodeURIComponent(currentTrack.title)}`
        );
        if (!response.ok) {
          setLyricsPreview('Lyrics preview unavailable for this track.');
          return;
        }
        const payload = await response.json();
        const firstLine = (payload.lyrics || '').split('\n').find((line) => line.trim().length > 8);
        setLyricsPreview(firstLine ? firstLine.trim() : 'Lyrics loaded from free API.');
      } catch {
        setLyricsPreview('Lyrics preview unavailable for this track.');
      }
    };

    fetchLyricsPreview();
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
      return;
    }
    audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    return () => {
      audioRef.current.pause();
      clearInterval(sleepTimerRef.current);
    };
  }, []);

  const progress = (elapsed / Math.max(totalDuration, 1)) * 100;

  const seekTrack = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const seekTime = totalDuration * ratio;
    audioRef.current.currentTime = seekTime;
    setElapsed(seekTime);
  };

  const toggleLike = (id) => {
    setLiked((state) => {
      const next = new Set(state);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const cycleSpeed = () => {
    setPlaybackRate((speed) => {
      if (speed === 1) return 1.25;
      if (speed === 1.25) return 1.5;
      return 1;
    });
  };

  const toggleSleepTimer = () => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
      setSleepLeft(0);
      return;
    }

    setSleepLeft(15 * 60);
    sleepTimerRef.current = setInterval(() => {
      setSleepLeft((seconds) => {
        if (seconds <= 1) {
          clearInterval(sleepTimerRef.current);
          sleepTimerRef.current = null;
          setIsPlaying(false);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-badge">S</span>
          <div className="brand-text">
            <strong>SPOTGAANA</strong>
            <small>Premium UI</small>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`nav-btn ${activeNav === item.id ? 'nav-btn--active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <section className="playlists">
          <h3>Your Playlists</h3>
          {PLAYLISTS.map((playlist) => (
            <button
              type="button"
              key={playlist.id}
              className={`playlist-btn ${playlist.accent} ${activePlaylist === playlist.id ? 'playlist-btn--active' : ''}`}
              onClick={() => setActivePlaylist(playlist.id)}
            >
              <span>{playlist.name}</span>
              <small>{playlist.count} tracks</small>
            </button>
          ))}
        </section>

        <section className="volume-panel">
          <div className="volume-header">
            <span>Volume</span>
            <strong>{volume}%</strong>
          </div>
          <input type="range" value={volume} onChange={(event) => setVolume(Number(event.target.value))} min="0" max="100" />
        </section>
      </aside>

      <main className="main-pane">
        <header className="top-bar">
          <div className="search-wrap">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search songs, artists, albums, moods"
            />
          </div>
          <div className="top-actions">
            <button type="button" className="chip" onClick={loadTracksFromApi}>{apiLoading ? 'Loading API...' : 'Refresh API'}</button>
            <button type="button" className="avatar">SA</button>
          </div>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <p className="kicker">Good Evening</p>
            <h1>Spotify flow meets Gaana soul</h1>
            <p>Stream chartbusters, indie drops, Hindi favorites, and smooth night-drive mixes in one place.</p>
            <p>{lyricsPreview}</p>
            <div className="hero-actions">
              <button type="button" className="cta cta--solid" onClick={() => setIsPlaying(true)}>Play Now</button>
              <button type="button" className="cta cta--ghost" onClick={() => setActiveNav('library')}>Open Library</button>
            </div>
          </div>
          <div className="hero-current" style={{ background: `linear-gradient(140deg, ${currentTrack.color[0]}, ${currentTrack.color[1]})` }}>
            <span className="hero-emoji">{currentTrack.emoji}</span>
            <h3>{currentTrack.title}</h3>
            <p>{currentTrack.artist}</p>
            <small>Now Playing • {fmt(elapsed)} / {fmt(totalDuration)}</small>
          </div>
        </section>

        <section className="panel" style={{ marginBottom: '12px' }}>
          <div className="panel-title-row">
            <h2>Live Data Source</h2>
            <button type="button">{apiSource}</button>
          </div>
          <p style={{ color: '#afbab1', fontSize: '13px' }}>
            Songs are fetched from free APIs: iTunes Search for audio previews and lyrics.ovh for lyric snippets.
            {apiError ? ` Last API issue: ${apiError}` : ''}
          </p>
        </section>

        <section className="section-grid">
          <article className="panel">
            <div className="panel-title-row">
              <h2>Made For You</h2>
              <button type="button">Show all</button>
            </div>
            <div className="card-grid">
              {homeTracks.map((track) => (
                <button
                  type="button"
                  key={track.id}
                  className="music-card"
                  onClick={() => playTrack(track)}
                >
                  <div className="music-art" style={{ background: `linear-gradient(145deg, ${track.color[0]}, ${track.color[1]})` }}>{track.emoji}</div>
                  <strong>{track.title}</strong>
                  <small>{track.artist}</small>
                </button>
              ))}
            </div>
          </article>

          <article className="panel panel--narrow">
            <div className="panel-title-row">
              <h2>Top Charts India</h2>
              <button type="button">Live</button>
            </div>
            <div className="chart-list">
              {(chartTracks.length ? chartTracks : tracks.slice(0, 8)).map((track, index) => (
                <button type="button" key={track.id} className="chart-row" onClick={() => playTrack(track)}>
                  <strong>{index + 1}</strong>
                  <span>{track.title}</span>
                  <small>{track.artist}</small>
                </button>
              ))}
            </div>
          </article>
        </section>

        <section className="section-stack">
          <article className="panel">
            <div className="panel-title-row">
              <h2>Mood Mixes</h2>
              <button type="button">Refresh</button>
            </div>
            <div className="mix-grid">
              {MIX_CARDS.map((mix) => (
                <div key={mix.id} className="mix-card" style={{ background: `linear-gradient(130deg, ${mix.c1}, ${mix.c2})` }}>
                  <span>{mix.emoji}</span>
                  <strong>{mix.title}</strong>
                  <small>{mix.subtitle}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-title-row">
              <h2>All Songs</h2>
              <button type="button">{filteredTracks.length} found</button>
            </div>
            <div className="song-list">
              {filteredTracks.map((track, index) => (
                <SongRow
                  key={track.id}
                  track={track}
                  index={index}
                  isCurrent={track.id === currentTrack.id}
                  isPlaying={isPlaying}
                  isLiked={liked.has(track.id)}
                  onPlay={playTrack}
                  onLike={toggleLike}
                />
              ))}
            </div>
          </article>
        </section>
      </main>

      <aside className="queue-pane">
        <section className="panel queue-panel">
          <div className="panel-title-row">
            <h2>Up Next</h2>
            <button type="button">Queue</button>
          </div>
          <div className="queue-list">
            {queueTracks.map((track) => (
              <button type="button" key={track.id} className="queue-row" onClick={() => playTrack(track)}>
                <span className="queue-art" style={{ background: `linear-gradient(140deg, ${track.color[0]}, ${track.color[1]})` }}>{track.emoji}</span>
                <span>
                  <strong>{track.title}</strong>
                  <small>{track.artist}</small>
                </span>
                <em>{fmt(track.duration)}</em>
              </button>
            ))}
          </div>
        </section>
      </aside>

      <footer className="player-bar">
        <section className="player-left">
          <span className="player-art" style={{ background: `linear-gradient(135deg, ${currentTrack.color[0]}, ${currentTrack.color[1]})` }}>{currentTrack.emoji}</span>
          <div>
            <strong>{currentTrack.title}</strong>
            <small>{currentTrack.artist} • {currentTrack.album}</small>
          </div>
          <button type="button" className={`player-like ${liked.has(currentTrack.id) ? 'player-like--active' : ''}`} onClick={() => toggleLike(currentTrack.id)}>
            {liked.has(currentTrack.id) ? '♥' : '♡'}
          </button>
        </section>

        <section className="player-center">
          <div className="controls">
            <button type="button" className={shuffle ? 'active' : ''} onClick={() => setShuffle((value) => !value)}>⇄</button>
            <button type="button" onClick={() => nextTrack(-1)}>⏮</button>
            <button type="button" className="play-main" onClick={() => setIsPlaying((value) => !value)}>{isPlaying ? '⏸' : '▶'}</button>
            <button type="button" onClick={() => nextTrack(1)}>⏭</button>
            <button type="button" className={repeat ? 'active' : ''} onClick={() => setRepeat((value) => !value)}>⟳</button>
          </div>
          <div className="progress-row">
            <small>{fmt(elapsed)}</small>
            <button type="button" className="progress-track" onClick={seekTrack}>
              <span style={{ width: `${progress}%` }} />
            </button>
            <small>{fmt(totalDuration)}</small>
          </div>
        </section>

        <section className="player-right">
          <span>{sleepLeft > 0 ? `SLEEP ${fmt(sleepLeft)}` : 'LIVE'}</span>
          <button type="button" onClick={cycleSpeed}>{playbackRate.toFixed(2).replace('.00', '')}x</button>
          <button type="button" onClick={toggleSleepTimer}>{sleepLeft > 0 ? '⏱' : '🛌'}</button>
          <button type="button">📻</button>
          <button type="button">🖥</button>
        </section>
      </footer>
    </div>
  );
}
