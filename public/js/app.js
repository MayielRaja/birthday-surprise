// Import Firebase references
import { db } from './firebase.js';
import { doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Confetti Canvas Particle System
class ConfettiShower {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.colors = ['#ff2a74', '#8a2be2', '#ffd700', '#00f0ff', '#ff5722', '#ff00ff'];
    this.active = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.loop();
  }

  spawn() {
    if (this.particles.length < 150) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -20,
        width: Math.random() * 8 + 6,
        height: Math.random() * 12 + 8,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 5 - 2.5,
        speedX: Math.random() * 3 - 1.5,
        speedY: Math.random() * 4 + 2,
        opacity: Math.random() * 0.4 + 0.6
      });
    }
  }

  burst(x, y) {
    const burstCount = 80;
    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 4;
      this.particles.push({
        x: x,
        y: y,
        width: Math.random() * 6 + 4,
        height: Math.random() * 10 + 6,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 12 - 6,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed - 2, // slight upward bias
        opacity: 1
      });
    }
  }

  loop() {
    if (!this.active) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.spawn();

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;

      if (p.y > this.canvas.height + 20) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      this.ctx.restore();
    }

    requestAnimationFrame(() => this.loop());
  }

  stop() {
    this.active = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles = [];
  }
}

// Global elements
const countdownScreen = document.getElementById('countdown-screen');
const celebrationScreen = document.getElementById('celebration-screen');
const toastContainer = document.getElementById('toast-container');

// Toast notifier
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}

// Audio Player logic
const audio = document.getElementById('bg-audio');
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const musicDisk = document.getElementById('music-disk');

playBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play()
      .then(() => {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        musicDisk.classList.add('playing');
        showToast('Playing music...', 'success');
      })
      .catch(err => {
        console.error('Audio play failed:', err);
        showToast('Click again to play music', 'error');
      });
  } else {
    audio.pause();
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    musicDisk.classList.remove('playing');
  }
});

// App State
let appConfig = null;
let timerInterval = null;
let celebrationUnlocked = false;
let confetti = null;

// Check parameters for secret preview mode
const urlParams = new URLSearchParams(window.location.search);
const isPreview = urlParams.get('preview') === 'true';

// Fetch settings from Firestore
async function initApp() {
  try {
    const docRef = doc(db, 'config', 'settings');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      appConfig = docSnap.data();
    } else {
      // Initialize Firestore document on first ever load
      appConfig = {
        friendName: "SYAMA",
        birthdayDate: "2026-09-07",
        passcode: "1234"
      };
      await setDoc(docRef, appConfig);
    }
    
    // Update title dynamically
    const titleEl = document.getElementById('countdown-title');
    if (titleEl && appConfig.friendName) {
      titleEl.innerText = `Surprise for ${appConfig.friendName}`;
    }

    // Update teaser message
    const teaserEl = document.getElementById('countdown-teaser');
    teaserEl.innerText = `The surprise unlocks on your birthday, ${new Date(appConfig.birthdayDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}!`;

    // Start timer checks
    startCountdown();

    // Start balloons floating immediately on page load
    startBalloons();
  } catch (err) {
    console.error("Firebase config load error:", err);
    showToast('Failed to connect to Firebase database. Check keys in firebase.js.', 'error');
  }
}

// Countdown Clock Timer Loop
function startCountdown() {
  const targetDate = new Date(appConfig.birthdayDate + 'T00:00:00');

  function updateClock() {
    const now = new Date();
    const difference = targetDate - now;

    // Check if birthday has arrived (or preview is set)
    if (difference <= 0 || isPreview) {
      clearInterval(timerInterval);
      unlockCelebration();
      return;
    }

    // Time calculations
    const d = Math.floor(difference / (1000 * 60 * 60 * 24));
    const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((difference % (1000 * 60)) / 1000);

    // Render timer box elements
    document.getElementById('days').innerText = String(d).padStart(2, '0');
    document.getElementById('hours').innerText = String(h).padStart(2, '0');
    document.getElementById('minutes').innerText = String(m).padStart(2, '0');
    document.getElementById('seconds').innerText = String(s).padStart(2, '0');
  }

  updateClock();
  timerInterval = setInterval(updateClock, 1000);
}

// Unlock celebration and gallery
async function unlockCelebration() {
  if (celebrationUnlocked) return;
  celebrationUnlocked = true;

  // Swap screen views
  countdownScreen.style.display = 'none';
  celebrationScreen.style.display = 'flex';

  // Customize headers
  if (appConfig) {
    document.getElementById('celebration-title').innerText = `Happy Birthday, ${appConfig.friendName}! 💖`;
    
    // Custom letter content text update
    const letterBody = document.getElementById('letter-content');
    if (letterBody) {
      letterBody.innerHTML = `
        Happy Birthday, ${appConfig.friendName}! 💖<br><br>
        Today is all about you! We've locked away some of our best memories and snapshots of laughter here. 
        Scroll down below to stroll down our memory lane and relive some of our most precious moments. 
        Wishing you a year filled with magic, success, and endless joy!
      `;
    }
  }

  // Spawn confetti
  const canvas = document.getElementById('confetti-canvas');
  confetti = new ConfettiShower(canvas);
  confetti.start();

  // Load memories
  loadMemories();

  // Setup Birthday Cake Candle Clicks
  setupCakeBlowout();
  
  if (isPreview) {
    showToast('Admin Preview Mode Active', 'success');
  }
}

// Spawns floating balloons continuously
function startBalloons() {
  const container = document.getElementById('balloon-container');
  if (!container) return;

  const colors = ['#ff2a74', '#8a2be2', '#ffd700', '#00f0ff', '#ff5722', '#ff00ff', '#4caf50'];
  
  function spawnBalloon() {
    const balloon = document.createElement('div');
    balloon.className = 'balloon-element';
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomLeft = Math.random() * 90 + 5; // 5% to 95%
    const randomDuration = Math.random() * 8 + 10; // 10s to 18s
    
    balloon.style.backgroundColor = randomColor;
    balloon.style.left = `${randomLeft}%`;
    balloon.style.animationDuration = `${randomDuration}s`;
    
    container.appendChild(balloon);
    
    // Clean up
    balloon.addEventListener('animationend', () => {
      balloon.remove();
    });
  }

  // Spawn initial set
  for (let i = 0; i < 6; i++) {
    setTimeout(spawnBalloon, i * 600);
  }
  
  // Continuously spawn
  setInterval(spawnBalloon, 1800);
}

// Interactive Cake candle blowout logic
function setupCakeBlowout() {
  const cakeContainer = document.getElementById('cake-container');
  const cake = document.getElementById('birthday-cake');
  const cardLetterWrapper = document.getElementById('card-letter-wrapper');
  const galleryContainer = document.getElementById('gallery-container');

  if (cake) {
    cake.addEventListener('click', () => {
      if (cakeContainer.classList.contains('extinguished')) return;
      
      // Get center position of the cake
      const rect = cake.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      // Blow out candles
      cakeContainer.classList.add('extinguished');
      
      // Explosion confetti bursts
      if (confetti) {
        confetti.burst(x, y);
        setTimeout(() => confetti.burst(x - 60, y - 20), 150);
        setTimeout(() => confetti.burst(x + 60, y - 20), 300);
        setTimeout(() => confetti.burst(x, y - 50), 450);
      }
      
      showToast('Happy Birthday! Make a wish! 🎂🎉', 'success');

      // Auto start music when they blow out the candles (if paused)
      if (audio && audio.paused) {
        audio.play().then(() => {
          playIcon.style.display = 'none';
          pauseIcon.style.display = 'block';
          musicDisk.classList.add('playing');
        }).catch(() => {});
      }
      
      // Wait for smoke animation, then slide out cake and reveal letter
      setTimeout(() => {
        cakeContainer.style.transition = 'opacity 1s ease, transform 1s ease';
        cakeContainer.style.opacity = '0';
        cakeContainer.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
          cakeContainer.style.display = 'none';
          
          // Reveal Envelope Letter
          cardLetterWrapper.classList.add('reveal');
          
          // Fade in Memory Gallery
          galleryContainer.style.display = 'block';
          setTimeout(() => {
            galleryContainer.style.opacity = '1';
          }, 100);
        }, 1000);
      }, 1800);
    });
  }
}

// Fetch and render memories from Firestore
async function loadMemories() {
  const galleryEl = document.getElementById('memories-gallery');
  galleryEl.innerHTML = '';

  try {
    const colRef = collection(db, 'memories');
    const querySnapshot = await getDocs(colRef);
    const memories = [];
    
    querySnapshot.forEach(doc => {
      memories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    if (memories.length === 0) {
      galleryEl.innerHTML = `
        <div class="empty-gallery glass-panel">
          <p>Memory lane is empty right now.</p>
          <p style="font-size: 0.85rem;">Go to the Admin panel to upload your photos and videos!</p>
        </div>
      `;
      return;
    }

    // Sort chronological by date added
    memories.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));

    memories.forEach(memory => {
      const card = document.createElement('div');
      card.className = 'gallery-item';
      
      const randomRotate = (Math.random() * 8 - 4).toFixed(2);
      card.style.setProperty('--rotation', `${randomRotate}deg`);

      // Determine content (photo vs video vs audio)
      let mediaHTML = '';
      if (memory.type === 'video') {
        mediaHTML = `
          <video controls preload="metadata">
            <source src="${memory.fileUrl}" type="video/mp4">
            Your browser does not support videos.
          </video>
        `;
      } else if (memory.type === 'audio') {
        mediaHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%; gap:15px; background:rgba(15, 11, 30, 0.05); color:var(--accent-purple); padding: 15px; border-radius:4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
            <audio controls style="width: 100%;">
              <source src="${memory.fileUrl}">
              Your browser does not support audio files.
            </audio>
          </div>
        `;
      } else {
        mediaHTML = `
          <img src="${memory.fileUrl}" alt="${memory.title}" loading="lazy">
        `;
      }

      card.innerHTML = `
        <div class="gallery-media-wrapper">
          ${mediaHTML}
        </div>
        <div class="gallery-caption">
          <h3>${escapeHTML(memory.title)}</h3>
          <p>${escapeHTML(memory.caption)}</p>
        </div>
      `;
      
      galleryEl.appendChild(card);
    });

  } catch (err) {
    console.error("Memories loading error:", err);
    showToast('Could not load shared memories from cloud.', 'error');
  }
}

// Utility function to escape HTML
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Bootstrap application on page load
initApp();
