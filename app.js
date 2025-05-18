// app.js

const DATA = {};

const state = {
  screen: "genres",
  currentGenre: null,
  expandedArtist: null,
  currentSong: null,
  audio: new Audio(),
  isPlaying: false
};

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
  const genres = ["стендапы", "подкасты", "книги", "шумилов сергей"];
  genres.forEach(genre => {
    const el = document.createElement("div");
    el.className = "card genre";
    el.textContent = genre.toUpperCase();
    el.addEventListener("click", async () => {
      state.currentGenre = genre;
      await loadGenre(genre);
      state.screen = "artists";
      render();
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
      img.src = artist.cover;
      card.appendChild(img);

      const ul = document.createElement("ul");
      ul.className = "song-list";
      artist.songs.forEach(songPath => {
        const li = document.createElement("li");
        const songName = songPath.split("/").pop().replace(".mp3", "").replace(".wav", "");
        li.textContent = songName;
        li.addEventListener("click", () => playSong(artist.name, songName, songPath, artist.cover));
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
    msg.textContent = "No song playing.";
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
  info.textContent = `${artist} - ${song}`;
  card.appendChild(info);

  const controls = document.createElement("div");
  controls.className = "player-controls";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.addEventListener("click", () => handlePlayerAction("prev"));

  const playPauseBtn = document.createElement("button");
  playPauseBtn.textContent = state.isPlaying ? "Pause" : "Play";
  playPauseBtn.addEventListener("click", () => handlePlayerAction(state.isPlaying ? "pause" : "play"));

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.addEventListener("click", () => handlePlayerAction("next"));

  const randomBtn = document.createElement("button");
  randomBtn.textContent = "Random";
  randomBtn.addEventListener("click", () => handlePlayerAction("random"));

  controls.append(prevBtn, playPauseBtn, nextBtn, randomBtn);
  card.appendChild(controls);
  app.appendChild(card);
}

function playSong(artistName, songTitle, songPath, coverPath) {
  state.currentSong = {
    genre: state.currentGenre,
    artist: artistName,
    song: songTitle,
    path: songPath,
    cover: coverPath
  };
  state.audio.src = songPath;
  state.audio.play();
  state.isPlaying = true;
  state.screen = "player";
  render();
}

function handlePlayerAction(action) {
  const artists = DATA[state.currentSong.genre];
  let allSongs = [];

  artists.forEach(a => {
    a.songs.forEach(path => {
      allSongs.push({
        artist: a.name,
        song: path.split("/").pop().replace(".mp3", "").replace(".wav", ""),
        path,
        cover: a.cover
      });
    });
  });

  const currentIndex = allSongs.findIndex(
    s => s.song === state.currentSong.song && s.artist === state.currentSong.artist
  );

  if (action === "next") {
    const nextIndex = (currentIndex + 1) % allSongs.length;
    const nextSong = allSongs[nextIndex];
    playSong(nextSong.artist, nextSong.song, nextSong.path, nextSong.cover);
    return;
  }

  if (action === "prev") {
    const prevIndex = (currentIndex - 1 + allSongs.length) % allSongs.length;
    const prevSong = allSongs[prevIndex];
    playSong(prevSong.artist, prevSong.song, prevSong.path, prevSong.cover);
    return;
  }

  if (action === "random") {
    const randomIndex = Math.floor(Math.random() * allSongs.length);
    const randomSong = allSongs[randomIndex];
    playSong(randomSong.artist, randomSong.song, randomSong.path, randomSong.cover);
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

render();