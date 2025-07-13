let currentOpenFAQ = null;
let currentOpenProduct = null;

const DATA = {};

const state = {
  screen: "genres",
  currentGenre: null,
  expandedArtist: null,
  currentSong: null,
  audio: new Audio(),
  isPlaying: false
};

state.audio.addEventListener('ended', () => handlePlayerAction('next'));

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60) || 0;
  const secs = Math.floor(seconds % 60) || 0;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const app = document.getElementById("app");
const navButtons = document.querySelectorAll("#navigation button");

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    state.screen = btn.dataset.screen;
    render();
  });
});

async function loadGenre(genre) {
  if (DATA[genre]) return;
  const response = await fetch(`./data/${genre}.json`);
  DATA[genre] = await response.json();
}

function render() {
  app.innerHTML = "";
  updateNavigation();
  updateMiniPlayer();
  updateFullPlayer();
  if (state.screen === "genres") renderGenres();
  else if (state.screen === "artists") renderArtists();
  else if (state.screen === "player") renderPlayer();
  else if (state.screen === "description") renderDescription();
}

function updateNavigation() {
  const navigation = document.getElementById("navigation");
  const buttons = navigation.querySelectorAll("button");
  
  // Hide all buttons by default
  buttons.forEach(btn => btn.style.display = "none");
  
  let hasVisibleButtons = false;
  
  if (state.screen === "genres") {
    // Main menu: no buttons visible
    navigation.classList.add("hidden");
    return;
  }
  
  if (state.screen === "player") {
    // Player screen: show "меню" and "разделы" buttons
    buttons.forEach(btn => {
      if (btn.dataset.screen === "genres" || btn.dataset.screen === "artists") {
        btn.style.display = "flex";
        hasVisibleButtons = true;
      }
    });
  } else {
    // Artists, description or other screens: show "меню" and conditionally "плеер"
    buttons.forEach(btn => {
      if (btn.dataset.screen === "genres") {
        btn.style.display = "flex";
        hasVisibleButtons = true;
      }
      if (btn.dataset.screen === "player" && state.currentSong) {
        btn.style.display = "flex";
        hasVisibleButtons = true;
      }
    });
  }
  
  // Show/hide navigation based on visible buttons
  if (hasVisibleButtons) {
    navigation.classList.remove("hidden");
  } else {
    navigation.classList.add("hidden");
  }
}

function renderGenres() {
  const genres = ["стендапы", "шумилов сергей", "описание и контакты"];
  genres.forEach(genre => {
    const el = document.createElement("div");
    el.className = "card genre";
    el.textContent = genre.toUpperCase();

    el.addEventListener("click", async () => {
      if (genre === "описание и контакты") {
        state.screen = "description";
        render();
      } else {
        state.currentGenre = genre;
        await loadGenre(genre);
        state.screen = "artists";
        render();
      }
    });

    app.appendChild(el);
  });
}

function renderArtists() {
  const artists = DATA[state.currentGenre] || [];
  artists.forEach((artist, index) => {
    const card = document.createElement("div");
    card.className = "card artist";

    const title = document.createElement("div");
    title.textContent = artist.name;
    card.appendChild(title);

    card.addEventListener("click", () => {
      state.expandedArtist = state.expandedArtist === index ? null : index;
      render();
    });

    if (state.expandedArtist === index) {
      const img = document.createElement("img");
      img.className = "artist-cover";
      img.src = `${artist.path}/${artist.cover}`;
      card.appendChild(img);

      const ul = document.createElement("ul");
      ul.className = "song-list";
      artist.songs.forEach(song => {
        const li = document.createElement("li");
        li.textContent = song.name;
        const fullPath = `${artist.path}/${song.file_name}`;
        li.addEventListener("click", () => playSong(artist.name, song.name, fullPath, `${artist.path}/${artist.cover}`));
        ul.appendChild(li);
      });
      card.appendChild(ul);
    }

    app.appendChild(card);
  });
}

function renderPlayer() {
  if (!state.currentSong) {
    const msg = document.createElement("div");
    msg.textContent = "ничего не выбрано";
    app.appendChild(msg);
    return;
  }
  // Player screen content can be minimal since updateFullPlayer handles the UI
}

function playSong(artistName, songTitle, songPath, coverPath) {
  state.currentSong = {
    genre: state.currentGenre,
    artist: artistName,
    song: songTitle,
    path: songPath,
    cover: coverPath
  };
  state.audio.onloadedmetadata = null;
  state.audio.ontimeupdate = null;

  state.audio.src = songPath;
  state.audio.play();
  state.isPlaying = true;
  
  // Set up Media Session for lock screen controls
  setupMediaSession();
  
  // Don't auto-redirect to player screen - stay in current view
  render();
}

function handlePlayerAction(action) {
  const artists = DATA[state.currentSong.genre];
  let allSongs = [];

  artists.forEach(artist => {
    artist.songs.forEach(song => {
      allSongs.push({
        artist: artist.name,
        song: song.name,
        path: `${artist.path}/${song.file_name}`,
        cover: `${artist.path}/${artist.cover}`
      });
    });
  });

  const currentIndex = allSongs.findIndex(
    s => s.song === state.currentSong.song && s.artist === state.currentSong.artist
  );

  if (action === "next") {
    const nextIndex = (currentIndex + 1) % allSongs.length;
    playSong(allSongs[nextIndex].artist, allSongs[nextIndex].song, allSongs[nextIndex].path, allSongs[nextIndex].cover);
    return;
  }

  if (action === "prev") {
    const prevIndex = (currentIndex - 1 + allSongs.length) % allSongs.length;
    playSong(allSongs[prevIndex].artist, allSongs[prevIndex].song, allSongs[prevIndex].path, allSongs[prevIndex].cover);
    return;
  }

  if (action === "random") {
    const randomIndex = Math.floor(Math.random() * allSongs.length);
    const song = allSongs[randomIndex];
    playSong(song.artist, song.song, song.path, song.cover);
    return;
  }

  if (action === "play") {
    state.audio.play();
    state.isPlaying = true;
  }

  if (action === "pause") {
    state.audio.pause();
    state.isPlaying = false;
  }

  // Update play/pause button in full player
  const playPauseBtn = document.querySelector(".play-pause-btn");
  if (playPauseBtn) {
    playPauseBtn.innerHTML = getSvgIcon(state.isPlaying ? 'pause' : 'play');
  }

  // Update play/pause button in mini player
  const miniPlayPauseBtn = document.querySelector(".mini-controls button");
  if (miniPlayPauseBtn) {
    miniPlayPauseBtn.innerHTML = getSvgIcon(state.isPlaying ? 'pause' : 'play');
  }

  // Update media session playback state
  updateMediaSessionPlaybackState();

  render();
}

function renderDescription() {
  app.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("h2");
  title.textContent = "О приложении:";
  card.appendChild(title);

  const text = document.createElement("p");
  text.textContent = `Я устал от пользовательской политики медиа-платформ, поэтому решил создать что-то простое — чтобы слушать то, что хочу, когда хочу, и на любом устройстве.

  Так появился Blur — пример того, как я представляю себе персональный аудиоплеер.

  Если вы хотите узнать больше обо мне или моих проектах — welcome:`;
  
  text.style.whiteSpace = "pre-line";
  text.style.textAlign = "left";
  card.appendChild(text);

  const btnContainer = document.createElement("div");
  btnContainer.style.display = "flex";
  btnContainer.style.flexDirection = "column";
  btnContainer.style.gap = "12px";
  btnContainer.style.marginTop = "20px";
  btnContainer.style.alignItems = "flex-start";

  const websiteBtn = document.createElement("button");
  websiteBtn.textContent = "🌐 Сайт";
  websiteBtn.className = "link-button";
  websiteBtn.addEventListener("click", () => {
    window.open("https://sh-development.ru", "_blank");
  });
  btnContainer.appendChild(websiteBtn);

  const telegramBtn = document.createElement("button");
  telegramBtn.textContent = "💬 Telegram";
  telegramBtn.className = "link-button";
  telegramBtn.addEventListener("click", () => {
    window.open("https://t.me/sergey_showmelove", "_blank");
  });
  btnContainer.appendChild(telegramBtn);

  const mailBtn = document.createElement("button");
  mailBtn.textContent = "✉️ Почта";
  mailBtn.className = "link-button";
  mailBtn.addEventListener("click", () => {
    navigator.clipboard.writeText("wumilovsergey@gmail.com").then(() => {
      alert("wumilovsergey@gmail.com - Почта скопирована");
    });
  });
  btnContainer.appendChild(mailBtn);

  card.appendChild(btnContainer);
  app.appendChild(card);
}

function updateMiniPlayer() {
  // Remove existing mini player
  const existingPlayer = document.getElementById("mini-player");
  if (existingPlayer) {
    existingPlayer.remove();
  }

  // Only show mini player when not on player screen and music is playing
  if (state.screen === "player" || !state.currentSong) {
    return;
  }

  const { artist, song, cover } = state.currentSong;
  
  const miniPlayer = document.createElement("div");
  miniPlayer.id = "mini-player";
  miniPlayer.className = "mini-player";

  const songInfo = document.createElement("div");
  songInfo.className = "mini-player-info";
  
  const img = document.createElement("img");
  img.src = cover;
  img.className = "mini-cover";
  songInfo.appendChild(img);

  const title = document.createElement("div");
  title.className = "mini-title";
  const firstChar = artist.charAt(0);
  title.textContent = firstChar === firstChar.toUpperCase() ? `${artist} - ${song}` : `${song}`;
  songInfo.appendChild(title);

  const controls = document.createElement("div");
  controls.className = "mini-controls";

  const playPauseBtn = document.createElement("button");
  playPauseBtn.innerHTML = getSvgIcon(state.isPlaying ? 'pause' : 'play');
  playPauseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handlePlayerAction(state.isPlaying ? "pause" : "play");
  });

  const nextBtn = document.createElement("button");
  nextBtn.innerHTML = getSvgIcon('next');
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handlePlayerAction("next");
  });

  controls.append(playPauseBtn, nextBtn);

  miniPlayer.appendChild(songInfo);
  miniPlayer.appendChild(controls);

  // Click mini player to go to full player
  miniPlayer.addEventListener("click", (e) => {
    if (!e.target.closest("button")) {
      state.screen = "player";
      render();
    }
  });

  document.body.appendChild(miniPlayer);
}

function updateFullPlayer() {
  // Remove existing full player if any
  const existingPlayer = document.getElementById("full-player");
  if (existingPlayer) {
    existingPlayer.remove();
  }

  // Only show full player on player screen and when music is playing
  if (state.screen !== "player" || !state.currentSong) {
    return;
  }

  const { artist, song, cover } = state.currentSong;

  const fullPlayer = document.createElement("div");
  fullPlayer.id = "full-player";
  fullPlayer.className = "full-player";

  const img = document.createElement("img");
  img.className = "full-player-cover";
  img.src = cover;
  fullPlayer.appendChild(img);

  const info = document.createElement("div");
  info.className = "full-player-info";
  const firstChar = artist.charAt(0);
  info.textContent = firstChar === firstChar.toUpperCase() ? `${artist} - ${song}` : `${song}`;
  fullPlayer.appendChild(info);

  const progressContainer = document.createElement('div');
  progressContainer.className = 'full-progress-container';

  const progressBar = document.createElement('div');
  progressBar.className = 'full-progress-bar';
  
  const progressHandle = document.createElement('div');
  progressHandle.className = 'full-progress-handle';
  
  progressContainer.appendChild(progressBar);
  progressContainer.appendChild(progressHandle);
  fullPlayer.appendChild(progressContainer);

  // Add seek functionality
  let isDragging = false;
  
  const handleSeek = (e) => {
    if (!state.audio.duration) return;
    
    const rect = progressContainer.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * state.audio.duration;
    
    state.audio.currentTime = newTime;
    progressBar.style.width = `${percent * 100}%`;
    progressHandle.style.left = `${percent * 100}%`;
  };

  progressContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    handleSeek(e);
  });

  progressContainer.addEventListener('touchstart', (e) => {
    isDragging = true;
    handleSeek(e.touches[0]);
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      handleSeek(e);
    }
  });

  document.addEventListener('touchmove', (e) => {
    if (isDragging) {
      e.preventDefault();
      handleSeek(e.touches[0]);
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  document.addEventListener('touchend', () => {
    isDragging = false;
  });

  const timeInfo = document.createElement('div');
  timeInfo.className = 'full-time-info';
  fullPlayer.appendChild(timeInfo);

  const controls = document.createElement("div");
  controls.className = "full-player-controls";

  const prevBtn = document.createElement("button");
  prevBtn.innerHTML = getSvgIcon('prev');
  prevBtn.addEventListener("click", () => handlePlayerAction("prev"));

  const playPauseBtn = document.createElement("button");
  playPauseBtn.innerHTML = getSvgIcon(state.isPlaying ? 'pause' : 'play');
  playPauseBtn.className = "play-pause-btn";
  playPauseBtn.addEventListener("click", () => handlePlayerAction(state.isPlaying ? "pause" : "play"));

  const nextBtn = document.createElement("button");
  nextBtn.innerHTML = getSvgIcon('next');
  nextBtn.addEventListener("click", () => handlePlayerAction("next"));

  const randomBtn = document.createElement("button");
  randomBtn.innerHTML = getSvgIcon('shuffle');
  randomBtn.addEventListener("click", () => handlePlayerAction("random"));

  controls.append(prevBtn, playPauseBtn, nextBtn, randomBtn);
  fullPlayer.appendChild(controls);
  
  document.body.appendChild(fullPlayer);

  state.audio.ontimeupdate = () => {
    if (!state.audio.duration || isDragging) return;
    const percent = (state.audio.currentTime / state.audio.duration) * 100;
    progressBar.style.width = `${percent}%`;
    progressHandle.style.left = `${percent}%`;
  };
}

function getSvgIcon(type) {
  const icons = {
    play: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>`,
    pause: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>`,
    prev: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
    </svg>`,
    next: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
    </svg>`,
    shuffle: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
    </svg>`
  };
  return icons[type] || '';
}

function setupMediaSession() {
  if (!('mediaSession' in navigator)) {
    console.log('Media Session API not supported');
    return;
  }

  if (!state.currentSong) return;

  const { artist, song, cover } = state.currentSong;

  // Set metadata
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song,
    artist: artist,
    album: state.currentGenre || 'Blur Music Player',
    artwork: [
      { src: cover, sizes: '256x256', type: 'image/jpeg' },
      { src: cover, sizes: '512x512', type: 'image/jpeg' }
    ]
  });

  // Set action handlers
  navigator.mediaSession.setActionHandler('play', () => {
    handlePlayerAction('play');
  });

  navigator.mediaSession.setActionHandler('pause', () => {
    handlePlayerAction('pause');
  });

  navigator.mediaSession.setActionHandler('previoustrack', () => {
    handlePlayerAction('prev');
  });

  navigator.mediaSession.setActionHandler('nexttrack', () => {
    handlePlayerAction('next');
  });

  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (details.seekTime && state.audio.duration) {
      state.audio.currentTime = details.seekTime;
    }
  });

  // Set initial playback state
  updateMediaSessionPlaybackState();
}

function updateMediaSessionPlaybackState() {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.playbackState = state.isPlaying ? 'playing' : 'paused';

  // Update position state for scrubbing
  if (state.audio.duration) {
    navigator.mediaSession.setPositionState({
      duration: state.audio.duration,
      playbackRate: state.audio.playbackRate,
      position: state.audio.currentTime
    });
  }
}

// Update position state periodically
setInterval(() => {
  if (state.isPlaying && state.audio.duration) {
    updateMediaSessionPlaybackState();
  }
}, 1000);


render();
