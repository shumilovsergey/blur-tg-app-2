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
  if (state.screen === "genres") renderGenres();
  else if (state.screen === "artists") renderArtists();
  else if (state.screen === "player") renderPlayer();
}

function renderGenres() {
  const genres = ["стендапы", "шумилов сергей", "описание и контакты"];
  genres.forEach(genre => {
    const el = document.createElement("div");
    el.className = "card genre";
    el.textContent = genre.toUpperCase();

    el.addEventListener("click", async () => {
      if (genre === "описание и контакты") {
        renderDescription();
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

  const { artist, song, cover } = state.currentSong;

  const card = document.createElement("div");
  card.className = "card";

  const img = document.createElement("img");
  img.className = "artist-cover";
  img.src = cover;
  card.appendChild(img);

  const info = document.createElement("div");
  const firstChar = artist.charAt(0);
  info.textContent = firstChar === firstChar.toUpperCase() ? `${artist} - ${song}` : `${song}`;
  card.appendChild(info);

  const progressContainer = document.createElement('div');
  progressContainer.className = 'progress-container';
  progressContainer.style.position = 'relative';
  progressContainer.style.width = '100%';
  progressContainer.style.height = '2px';
  progressContainer.style.background = 'rgba(255, 255, 255, 0.4)';
  progressContainer.style.margin = '8px 0';

  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  progressBar.style.height = '100%';
  progressBar.style.width = '0%';
  progressBar.style.background = '#7b79b5';
  progressContainer.appendChild(progressBar);
  card.appendChild(progressContainer);

  const timeInfo = document.createElement('div');
  timeInfo.className = 'time-info';
  timeInfo.style.fontSize = '0.9em';
  card.appendChild(timeInfo);

  const controls = document.createElement("div");
  controls.className = "player-controls";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "←";
  prevBtn.addEventListener("click", () => handlePlayerAction("prev"));

  const playPauseBtn = document.createElement("button");
  playPauseBtn.textContent = state.isPlaying ? "||" : "▶";
  playPauseBtn.addEventListener("click", () => handlePlayerAction(state.isPlaying ? "pause" : "play"));

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "→";
  nextBtn.addEventListener("click", () => handlePlayerAction("next"));

  const randomBtn = document.createElement("button");
  randomBtn.textContent = "⇄";
  randomBtn.addEventListener("click", () => handlePlayerAction("random"));

  controls.append(prevBtn, playPauseBtn, nextBtn, randomBtn);
  card.appendChild(controls);
  app.appendChild(card);

  state.audio.ontimeupdate = () => {
    if (!state.audio.duration) return;
    const percent = (state.audio.currentTime / state.audio.duration) * 100;
    progressBar.style.width = `${percent}%`;
  };
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
  state.screen = "player";
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


render();
