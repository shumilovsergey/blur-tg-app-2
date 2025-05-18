// app.js

// Sample hardcoded data (normally from ./data/*.json)
const DATA = {
  classical: [
    {
      name: "Beethoven",
      cover: "./data/covers/beethoven.jpg",
      songs: ["Symphony No.5", "Für Elise"]
    },
    {
      name: "Mozart",
      cover: "./data/covers/mozart.jpg",
      songs: ["Requiem", "Eine kleine Nachtmusik"]
    }
  ],
  jazz: [
    {
      name: "Miles Davis",
      cover: "./data/covers/miles.jpg",
      songs: ["So What", "Freddie Freeloader"]
    }
  ],
  electronic: [
    {
      name: "Daft Punk",
      cover: "./data/covers/daftpunk.jpg",
      songs: ["Get Lucky", "Harder Better Faster Stronger"]
    }
  ]
};

const state = {
  screen: "genres",
  currentGenre: null,
  expandedArtist: null,
  currentSong: null,
  playOrder: [],
  random: false
};

const app = document.getElementById("app");
const navButtons = document.querySelectorAll("#navigation button");

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    state.screen = btn.dataset.screen;
    render();
  });
});

function render() {
  app.innerHTML = "";
  if (state.screen === "genres") renderGenres();
  else if (state.screen === "artists") renderArtists();
  else if (state.screen === "player") renderPlayer();
}

function renderGenres() {
  Object.keys(DATA).forEach(genre => {
    const el = document.createElement("div");
    el.className = "card genre";
    el.textContent = genre.toUpperCase();
    el.addEventListener("click", () => {
      state.currentGenre = genre;
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
      artist.songs.forEach(song => {
        const li = document.createElement("li");
        li.textContent = song;
        li.addEventListener("click", () => playSong(artist.name, song));
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

  ["Prev", "Play", "Pause", "Next", "Random"].forEach(action => {
    const btn = document.createElement("button");
    btn.textContent = action;
    btn.addEventListener("click", () => handlePlayerAction(action.toLowerCase()));
    controls.appendChild(btn);
  });

  card.appendChild(controls);
  app.appendChild(card);
}

function playSong(artistName, songTitle) {
  const artist = DATA[state.currentGenre].find(a => a.name === artistName);
  state.currentSong = {
    genre: state.currentGenre,
    artist: artist.name,
    song: songTitle,
    cover: artist.cover
  };
  state.screen = "player";
  render();
}

function handlePlayerAction(action) {
  const genreArtists = DATA[state.currentSong.genre];
  let allSongs = [];

  genreArtists.forEach(a => {
    a.songs.forEach(s => allSongs.push({
      artist: a.name,
      song: s,
      cover: a.cover
    }));
  });

  const currentIndex = allSongs.findIndex(
    s => s.song === state.currentSong.song && s.artist === state.currentSong.artist
  );

  if (action === "next") {
    const nextIndex = (currentIndex + 1) % allSongs.length;
    state.currentSong = { ...allSongs[nextIndex], genre: state.currentGenre };
  }

  if (action === "prev") {
    const prevIndex = (currentIndex - 1 + allSongs.length) % allSongs.length;
    state.currentSong = { ...allSongs[prevIndex], genre: state.currentGenre };
  }

  if (action === "random") {
    const randomIndex = Math.floor(Math.random() * allSongs.length);
    state.currentSong = { ...allSongs[randomIndex], genre: state.currentGenre };
  }

  if (action === "play" || action === "pause") {
    // Stub: You'd integrate with Web Audio API or HTML5 <audio> here
    alert(`${action === "play" ? "Playing" : "Paused"}: ${state.currentSong.song}`);
  }

  render();
}

// Initial render
render();