// app.js
// Plain global JS, no modules.

// -------------------
// Data generator
// -------------------
const TAGS = [
  "Coffee","Hiking","Movies","Live Music","Board Games","Cats","Dogs","Traveler",
  "Foodie","Tech","Art","Runner","Climbing","Books","Yoga","Photography"
];
const FIRST_NAMES = [
  "Alex","Sam","Jordan","Taylor","Casey","Avery","Riley","Morgan","Quinn","Cameron",
  "Jamie","Drew","Parker","Reese","Emerson","Rowan","Shawn","Harper","Skyler","Devon"
];
const CITIES = [
  "Brooklyn","Manhattan","Queens","Jersey City","Hoboken","Astoria",
  "Williamsburg","Bushwick","Harlem","Lower East Side"
];
const JOBS = [
  "Product Designer","Software Engineer","Data Analyst","Barista","Teacher",
  "Photographer","Architect","Chef","Nurse","Marketing Manager","UX Researcher"
];
const BIOS = [
  "Weekend hikes and weekday lattes.",
  "Dog parent. Amateur chef. Karaoke enthusiast.",
  "Trying every taco in the city — for science.",
  "Bookstore browser and movie quote machine.",
  "Gym sometimes, Netflix always.",
  "Looking for the best slice in town.",
  "Will beat you at Mario Kart.",
  "Currently planning the next trip."
];

const UNSPLASH_SEEDS = [
  "1515462277126-2b47b9fa09e6",
  "1520975916090-3105956dac38",
  "1519340241574-2cec6aef0c01",
  "1554151228-14d9def656e4",
  "1548142813-c348350df52b",
  "1517841905240-472988babdf9",
  "1535713875002-d1d0cf377fde",
  "1545996124-0501ebae84d0",
  "1524504388940-b1c1722653e1",
  "1531123897727-8f129e1688ce",
];

function sample(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickTags() { return Array.from(new Set(Array.from({length:4}, ()=>sample(TAGS)))); }
function imgFor(seed) {
  return `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=1200&q=80`;
}

function generateProfiles(count = 12) {
  const profiles = [];
  for (let i = 0; i < count; i++) {
    profiles.push({
      id: `p_${i}_${Date.now().toString(36)}`,
      name: sample(FIRST_NAMES),
      age: 18 + Math.floor(Math.random() * 22),
      city: sample(CITIES),
      title: sample(JOBS),
      bio: sample(BIOS),
      tags: pickTags(),
      // Multi-photo support for double-tap
      imgs: [
        imgFor(sample(UNSPLASH_SEEDS)),
        imgFor(sample(UNSPLASH_SEEDS)),
        imgFor(sample(UNSPLASH_SEEDS)),
      ],
      imgIndex: 0,
    });
  }
  return profiles;
}

// -------------------
// UI rendering
// -------------------
const deckEl = document.getElementById("deck");
const shuffleBtn = document.getElementById("shuffleBtn");
const likeBtn = document.getElementById("likeBtn");
const nopeBtn = document.getElementById("nopeBtn");
const superLikeBtn = document.getElementById("superLikeBtn");

let profiles = [];

// -------------------
// Helpers for "top card"
// -------------------
function topCardEl() {
  // last child is visually on top (based on how they're appended)
  return deckEl.querySelector(".card:last-child");
}

function topProfile() {
  const card = topCardEl();
  if (!card) return null;
  const id = card.dataset.id;
  return profiles.find(p => p.id === id) || null;
}

function removeProfileCard(card) {
  if (!card) return;

  const id = card.dataset.id;
  profiles = profiles.filter(p => p.id !== id);
  card.remove();

  // After removal, bind gestures to the new top card (if any)
  const next = topCardEl();
  if (next) bindGestures(next);

  if (profiles.length === 0) resetDeck();
}

function animateAndRemove(direction) {
  const card = topCardEl();
  if (!card) return;

  // Prevent double-trigger on the same card during the animation window
  if (card.dataset.removing === "1") return;
  card.dataset.removing = "1";

  card.style.transition = "transform 250ms ease, opacity 250ms ease";
  card.style.opacity = "0";

  if (direction === "left")  card.style.transform = "translateX(-120%) rotate(-12deg)";
  if (direction === "right") card.style.transform = "translateX(120%) rotate(12deg)";
  if (direction === "up")    card.style.transform = "translateY(-120%)";

  setTimeout(() => {
    removeProfileCard(card);
  }, 260);
}

function doNope() { animateAndRemove("left"); }
function doLike() { animateAndRemove("right"); }
function doSuperLike() { animateAndRemove("up"); }

// -------------------
// Gesture binding
// -------------------
function bindGestures(card) {
  // avoid double-binding
  if (card.dataset.gesturesBound === "1") return;
  card.dataset.gesturesBound = "1";

  let startX = 0, startY = 0;
  let dragging = false;

  card.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    card.setPointerCapture(e.pointerId);
    card.style.transition = "none";
  });

  card.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const rot = dx / 20;
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
  });

  card.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // thresholds
    const TH = 90;
    const TH_UP = -90;

    card.style.transition = "transform 200ms ease";

    if (dx <= -TH) return doNope();
    if (dx >= TH) return doLike();
    if (dy <= TH_UP) return doSuperLike();

    // snap back
    card.style.transform = "";
  });
  
  card.addEventListener("pointercancel", () => {
    dragging = false;
    card.style.transition = "transform 200ms ease";
    card.style.transform = "";
  });
  // Double-tap / double-click: show next photo in the profile
  card.addEventListener("dblclick", () => {
    const p = topProfile();
    if (!p) return;

    p.imgIndex = (p.imgIndex + 1) % p.imgs.length;

    const img = card.querySelector("img.card__media");
    if (img) img.src = p.imgs[p.imgIndex];
  });
}

// -------------------
// Render
// -------------------
function renderDeck() {
  deckEl.setAttribute("aria-busy", "true");
  deckEl.innerHTML = "";

  profiles.forEach((p) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = p.id;

    const img = document.createElement("img");
    img.className = "card__media";
    img.src = p.imgs[p.imgIndex] || p.imgs[0];
    img.alt = `${p.name} — profile photo`;

    const body = document.createElement("div");
    body.className = "card__body";

    const titleRow = document.createElement("div");
    titleRow.className = "title-row";
    titleRow.innerHTML = `
      <h2 class="card__title">${p.name}</h2>
      <span class="card__age">${p.age}</span>
    `;

    const meta = document.createElement("div");
    meta.className = "card__meta";
    meta.textContent = `${p.title} • ${p.city}`;

    const chips = document.createElement("div");
    chips.className = "card__chips";
    p.tags.forEach((t) => {
      const c = document.createElement("span");
      c.className = "chip";
      c.textContent = t;
      chips.appendChild(c);
    });

    body.appendChild(titleRow);
    body.appendChild(meta);
    body.appendChild(chips);

    card.appendChild(img);
    card.appendChild(body);

    deckEl.appendChild(card);
  });

  // Bind gestures after render so the top card exists
  const top = topCardEl();
  if (top) bindGestures(top);

  deckEl.removeAttribute("aria-busy");
}

function resetDeck() {
  profiles = generateProfiles(12);
  renderDeck();
}

// -------------------
// Controls
// -------------------
likeBtn.addEventListener("click", doLike);
nopeBtn.addEventListener("click", doNope);
superLikeBtn.addEventListener("click", doSuperLike);
shuffleBtn.addEventListener("click", resetDeck);

// Boot
resetDeck();
