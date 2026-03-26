//Def the keys we will use
const notes = [
    {time: 1000, keyw: "a"},
    {time: 1000, keyw: "s"},
    {time: 1000, keyw: "d"},
    {time: 1000, keyw: "f"}
];

const presentTime = audio.currentTime * 1000; //Sync the time
let actualSong;
let audio;
let startTime;

//Map the songs we have
const songs = [
  {
    name: "song1",
    file: "Assets/Sounds/x.mp3",
    notes: [
      { time: 1000 },
      { time: 2000 },
      { time: 3000 }
    ]
  },
  {
    name: "song2",
    file: "Assets/Sounds/y.mp3",
    notes: [
      { time: 500 },
      { time: 1500 },
      { time: 2500 }
    ]
  }
];

//What song the user chose?
const selector = document.getElementById("songSelector");

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  verifyHit(key);
});

function verifyHit(key) {
  const presentTime = Date.now() - startTime;

  actualSong.key.forEach(notes => {
    if (notes.keyw === key && !notes.hit) {
      const diff = Math.abs(presentTime - notes.time);

      if (diff < 150) {
        console.log("PERRRFECT");
        notes.hit = true;
      } else if (diff < 300) {
        console.log("Good");
        notes.hit = true;
      }
    }
  });
}

function createNote(noteData) {
  const column = document.querySelector(
    `.coluna[data-key="${noteData.key}"]`
  );

  const note = document.createElement("div");
  note.classList.add("nota");

  column.appendChild(note);
}

function gameLoop() {
  const presentTime = Date.now() - startTime;

  actualSong.notes.forEach(note => {
    if (!note.created && presentTime >= note.time) {
      createNote();
      note.created = true;
    }
  });
  requestAnimationFrame(gameLoop);
}

songs.forEach((song, index) => {
  const option = document.createElement("option");
  option.value = index;
  option.textContent = song.name;
  selector.appendChild(option);
});

function startGame() {
  const index = selector.value;
  actualSong = musicas[index];

  audio = new Audio(actualSong.file);
  audio.play();

  startTime = Date.now();
  gameLoop();
}