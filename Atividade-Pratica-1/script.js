let actualSong;
let audio;
let startTime;
let score = 0;
let combo = 0;
let gameRunning = false;

const scoreText = document.getElementById("score");
const feedbackText = document.getElementById("feedback");
const rankingList = document.getElementById("ranking");
const selector = document.getElementById("songSelector");
const game = document.getElementById("game");
const hitLine = document.querySelector(".hit-line");

let keysPressed = {};

// gerar notas
function generateNotes() {
  const keys = ["a", "s", "d", "f"];
  const notes = [];

  for (let i = 0; i < 60; i++) {
    const isLong = Math.random() < 0.2;

    notes.push({
      time: i * 600,
      keyw: keys[Math.floor(Math.random() * keys.length)],
      duration: isLong ? 1500 : 0
    });
  }

  return notes;
}

const songs = [
  {
    name: "Electro World",
    file: "Assets/Music/Electro World - Perfume.mp3",
    notes: generateNotes()
  },
  {
    name: "Song 2",
    file: "Assets/Music/x.mp3"
  }
];

// select
songs.forEach((song, index) => {
  const option = document.createElement("option");
  option.value = index;
  option.textContent = song.name;
  selector.appendChild(option);
});

// teclado
document.addEventListener("keydown", (event) => {
  if (!gameRunning) return;

  const key = event.key.toLowerCase();

  if (!keysPressed[key]) {
    keysPressed[key] = true;
    verifyHit(key);
  }
});

document.addEventListener("keyup", (event) => {
  keysPressed[event.key.toLowerCase()] = false;
});

// sistema de hit
function verifyHit(key) {

  const possibleNotes = actualSong.notes.filter(note =>
    note.keyw === key && !note.hit && note.element
  );

  if (possibleNotes.length === 0) {
    feedbackText.textContent = "MISS";
    combo = 0;
    updateScore();
    return;
  }

  possibleNotes.sort((a, b) => {
    const distA = Math.abs(a.element.getBoundingClientRect().top - hitLine.getBoundingClientRect().top);
    const distB = Math.abs(b.element.getBoundingClientRect().top - hitLine.getBoundingClientRect().top);
    return distA - distB;
  });

  const note = possibleNotes[0];
  const distance = Math.abs(
    note.element.getBoundingClientRect().top - hitLine.getBoundingClientRect().top
  );

  if (distance < 30) {
    feedbackText.textContent = ".✦ ݁˖PEERFECT!.✦ ݁˖";
    score += 5;
    combo++;
    note.hit = true;

  } else if (distance < 60) {
    feedbackText.textContent = ".ᐟ.ᐟGOOD!.ᐟ.ᐟ";
    score += 3;
    combo++;
    note.hit = true;

  } else if (distance < 90) {
    feedbackText.textContent = "BAD";
    combo = 0;
    note.hit = true;
  } else {
    feedbackText.textContent = "MISS";
    combo = 0;
    return;
  }

  hitEffect(note.element.parentElement);
  note.element.remove();

  updateScore();
}

// efeito visual
function hitEffect(column) {
  column.style.background = "white";
  setTimeout(() => column.style.background = "", 100);
}

// criar nota
function createNote(noteData) {
  const column = document.querySelector(
    `.column[data-key="${noteData.keyw}"]`
  );

  if (!column) return;

  const note = document.createElement("div");
  note.classList.add("note");

  /*if (noteData.duration > 0) {
    note.classList.add("long-note");
    note.style.height = (noteData.duration / 10) + "px";
  }*/ // tentativa de criar notas grandes de manter pressionado

  column.appendChild(note);

  noteData.element = note;

  setTimeout(() => {
    if (!noteData.hit) combo = 0;
    note.remove();
  }, 2000 + noteData.duration);
}

// loop
function gameLoop() {
  if (!gameRunning) return;

  const presentTime = Date.now() - startTime;

  actualSong.notes.forEach(note => {
    if (!note.created && presentTime >= note.time) {
      createNote(note);
      note.created = true;
    }

    // nota longa apresenta problemas ainda
    /*if (
      note.duration > 0 &&
      note.hit &&
      note.element &&
      keysPressed[note.keyw]
    ) {
      const noteRect = note.element.getBoundingClientRect();
      const lineRect = hitLine.getBoundingClientRect();
      const distance = Math.abs(noteRect.top - lineRect.top);

      if (distance < 40) {
        score += 0.3;
        combo++;
      }
    }*/
  });

  updateScore();
  requestAnimationFrame(gameLoop);
}

// score
function updateScore() {
  scoreText.textContent = "Score: " + Math.floor(score) + " | Combo: " + combo;
}

// start
function startGame() {

  document.getElementById("endScreen").style.display = "none";
  game.style.display = "flex";

  score = 0;
  combo = 0;
  keysPressed = {};

  feedbackText.textContent = "";
  updateScore();

  document.querySelectorAll(".note").forEach(n => n.remove());

  actualSong = songs[selector.value];
  if (!actualSong) return;

  actualSong.notes.forEach(n => {
    n.hit = false;
    n.created = false;
  });

  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  audio = new Audio(actualSong.file);
  audio.play();

  startTime = Date.now();
  gameRunning = true;

  audio.onended = endGame;

  gameLoop();
}

// fim
function endGame() {
  gameRunning = false;

  const data = JSON.parse(localStorage.getItem("ranking")) || [];

  data.push({
    song: actualSong.name,
    score: Math.floor(score)
  });

  data.sort((a, b) => b.score - a.score);

  localStorage.setItem("ranking", JSON.stringify(data));

  renderRanking();

  document.getElementById("finalScore").textContent =
    "Score final: " + Math.floor(score);

  document.getElementById("endScreen").style.display = "block";
}

// ranking
function renderRanking() {
  const data = JSON.parse(localStorage.getItem("ranking")) || [];

  rankingList.innerHTML = "";

  data.slice(0, 10).forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${item.song} - ${item.score}`;
    rankingList.appendChild(li);
  });
}

renderRanking();