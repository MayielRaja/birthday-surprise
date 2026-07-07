// Import Firebase references
import { db } from './firebase.js';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Screen elements
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const authCard = document.getElementById('auth-card');
const toastContainer = document.getElementById('toast-container');

// Form inputs & elements
const authForm = document.getElementById('auth-form');
const passcodeVal = document.getElementById('admin-passcode');

const settingsForm = document.getElementById('settings-form');
const friendNameInput = document.getElementById('friend-name');
const birthdayDateInput = document.getElementById('birthday-date');
const newPasscode = document.getElementById('new-passcode');

const uploadForm = document.getElementById('upload-form');
const memoryFileInput = document.getElementById('memory-file');
const memoryTitleInput = document.getElementById('memory-title');
const memoryCaptionInput = document.getElementById('memory-caption');
const dropzone = document.getElementById('dropzone');
const filePreviewContainer = document.getElementById('file-preview-container');
const filePreviewElement = document.getElementById('file-preview-element');
const fileDetails = document.getElementById('file-details');
const uploadSubmitBtn = document.getElementById('upload-submit-btn');

const adminGalleryList = document.getElementById('admin-gallery-list');
const logoutBtn = document.getElementById('logout-btn');
const previewBtn = document.getElementById('preview-btn');

// State
let token = localStorage.getItem('surprise_admin_token') || '';
let configData = null;

// Toast notifier helper
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

// Authentication
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const passcode = passcodeVal.value.trim();

  try {
    const docRef = doc(db, 'config', 'settings');
    const docSnap = await getDoc(docRef);
    let correctPasscode = '1234';

    if (docSnap.exists()) {
      correctPasscode = docSnap.data().passcode;
    }

    if (passcode === correctPasscode) {
      token = passcode;
      localStorage.setItem('surprise_admin_token', token);
      showToast('Authenticated successfully!', 'success');
      showDashboard();
    } else {
      triggerAuthShake();
      showToast('Incorrect passcode.', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Error connecting to database.', 'error');
  }
});

function triggerAuthShake() {
  authCard.classList.add('shake-animation');
  authCard.addEventListener('animationend', () => {
    authCard.classList.remove('shake-animation');
  }, { once: true });
  passcodeVal.value = '';
  passcodeVal.focus();
}

// Dashboard Transition & Loading
function showDashboard() {
  authScreen.style.display = 'none';
  dashboardScreen.style.display = 'flex';
  previewBtn.href = `index.html?preview=true`;
  loadSettings();
  loadAdminMemories();
}

async function loadSettings() {
  try {
    const docRef = doc(db, 'config', 'settings');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      configData = docSnap.data();
      friendNameInput.value = configData.friendName;
      birthdayDateInput.value = configData.birthdayDate;
    }
  } catch (err) {
    showToast('Failed to load settings.', 'error');
  }
}

// Save Settings Form
settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    friendName: friendNameInput.value.trim(),
    birthdayDate: birthdayDateInput.value,
    passcode: configData ? configData.passcode : '1234'
  };

  if (newPasscode.value.trim() !== '') {
    data.passcode = newPasscode.value.trim();
  }

  try {
    const docRef = doc(db, 'config', 'settings');
    await setDoc(docRef, data);
    
    showToast('Settings saved successfully!', 'success');
    configData = data;
    
    if (data.passcode !== token) {
      token = data.passcode;
      localStorage.setItem('surprise_admin_token', token);
    }
    newPasscode.value = '';
  } catch (err) {
    showToast('Failed to update settings.', 'error');
  }
});

// Drag & Drop Handlers
['dragenter', 'dragover'].forEach(eventName => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  }, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
  }, false);
});

dropzone.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  if (files.length) {
    memoryFileInput.files = files;
    handleFileSelected(files[0]);
  }
});

memoryFileInput.addEventListener('change', (e) => {
  if (e.target.files.length) {
    handleFileSelected(e.target.files[0]);
  }
});

function handleFileSelected(file) {
  // 50MB maximum size limit
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    showToast('File size must be under 50MB.', 'error');
    memoryFileInput.value = '';
    filePreviewContainer.style.display = 'none';
    return;
  }

  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  fileDetails.innerText = `${file.name} (${sizeMB} MB)`;

  filePreviewElement.innerHTML = '';
  const reader = new FileReader();

  if (file.type.startsWith('image/')) {
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      filePreviewElement.appendChild(img);
      filePreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else if (file.type.startsWith('video/')) {
    reader.onload = (e) => {
      const video = document.createElement('video');
      video.src = e.target.result;
      video.controls = true;
      video.muted = true;
      filePreviewElement.appendChild(video);
      filePreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else if (file.type.startsWith('audio/')) {
    reader.onload = (e) => {
      const audio = document.createElement('audio');
      audio.src = e.target.result;
      audio.controls = true;
      filePreviewElement.appendChild(audio);
      filePreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    showToast('Unsupported file type.', 'error');
    memoryFileInput.value = '';
    filePreviewContainer.style.display = 'none';
  }
}

// Convert a File into Base64 String Chunks (800KB size chunks)
function fileToBase64Chunks(file, chunkSize = 800 * 1024) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result;
      const chunks = [];
      for (let i = 0; i < base64String.length; i += chunkSize) {
        chunks.push(base64String.substring(i, i + chunkSize));
      }
      resolve({
        chunks,
        mimeType: file.type
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload Memory Form Submission (Base64 Chunking in Firestore)
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = memoryFileInput.files[0];
  if (!file) {
    showToast('Please select a file first.', 'error');
    return;
  }

  uploadSubmitBtn.disabled = true;
  uploadSubmitBtn.innerText = 'Converting & Uploading... Please wait';

  try {
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExt}`;

    let fileType = 'photo';
    if (file.type.startsWith('video/')) {
      fileType = 'video';
    } else if (file.type.startsWith('audio/') || ['.ogg', '.mp3', '.wav', '.m4a'].some(ext => fileExt === ext)) {
      fileType = 'audio';
    }

    // 1. Chunk file into Base64 segments
    const { chunks, mimeType } = await fileToBase64Chunks(file);
    const totalChunks = chunks.length;

    // 2. Write metadata document to "memories" collection
    const newMemory = {
      filename: uniqueFilename,
      title: memoryTitleInput.value.trim(),
      caption: memoryCaptionInput.value.trim(),
      type: fileType,
      mimeType: mimeType,
      totalChunks: totalChunks,
      dateAdded: new Date().toISOString()
    };

    uploadSubmitBtn.innerText = `Uploading metadata...`;
    const memoryDocRef = await addDoc(collection(db, 'memories'), newMemory);

    // 3. Upload chunk documents to "chunks" subcollection
    for (let i = 0; i < totalChunks; i++) {
      const percentage = Math.round(((i + 1) / totalChunks) * 100);
      uploadSubmitBtn.innerText = `Uploading parts: ${percentage}%`;

      await addDoc(collection(db, 'memories', memoryDocRef.id, 'chunks'), {
        index: i,
        data: chunks[i]
      });
    }

    showToast('Memory uploaded successfully!', 'success');
    
    // Reset
    uploadForm.reset();
    filePreviewContainer.style.display = 'none';
    filePreviewElement.innerHTML = '';
    fileDetails.innerText = '';
    loadAdminMemories();
  } catch (err) {
    console.error(err);
    showToast('Connection error during upload.', 'error');
  } finally {
    uploadSubmitBtn.disabled = false;
    uploadSubmitBtn.innerText = 'Upload to Memory Lane';
  }
});

// Re-assemble Base64 chunks into Blob URL (copied helper for admin previews)
function base64ToBlobUrl(base64String, mimeType) {
  try {
    const rawData = base64String.split(',')[1] || base64String;
    const byteCharacters = atob(rawData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (err) {
    return '';
  }
}

async function getMemoryFileUrl(memoryId, mimeType) {
  const chunksSnapshot = await getDocs(collection(db, 'memories', memoryId, 'chunks'));
  const chunksList = [];
  chunksSnapshot.forEach(doc => chunksList.push(doc.data()));
  
  chunksList.sort((a, b) => a.index - b.index);
  const fullBase64 = chunksList.map(c => c.data).join('');
  return base64ToBlobUrl(fullBase64, mimeType);
}

// Load and render memories in editor list
async function loadAdminMemories() {
  adminGalleryList.innerHTML = '<p style="color: var(--text-muted); text-align: center; font-style: italic;">Loading memories...</p>';

  try {
    const colRef = collection(db, 'memories');
    const querySnapshot = await getDocs(colRef);
    const memories = [];

    querySnapshot.forEach(doc => {
      memories.push({
        docId: doc.id,
        ...doc.data()
      });
    });
    
    if (memories.length === 0) {
      adminGalleryList.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
          <p style="font-style: italic; margin-bottom: 5px;">No memories uploaded yet.</p>
        </div>
      `;
      return;
    }

    adminGalleryList.innerHTML = '';
    memories.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

    memories.forEach(memory => {
      const item = document.createElement('div');
      item.className = 'admin-gallery-item';

      // Use dynamic loading preview inside the list thumbnails
      item.innerHTML = `
        <div class="admin-gallery-thumb" id="thumb-${memory.docId}" style="display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.03);">
          <svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite; color: var(--text-muted);">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
          </svg>
        </div>
        <div class="admin-gallery-details">
          <h4>${escapeHTML(memory.title)}</h4>
          <p>${escapeHTML(memory.caption || 'No description')}</p>
          <span style="font-size: 0.7rem; color: var(--text-muted);">Type: ${memory.type} | Added: ${new Date(memory.dateAdded).toLocaleDateString()}</span>
        </div>
        <button class="btn btn-danger btn-delete-memory" style="padding: 8px 12px; font-size: 0.85rem;" title="Delete Memory">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      `;

      // Load thumbnail source in background
      getMemoryFileUrl(memory.docId, memory.mimeType).then(fileUrl => {
        const thumbContainer = item.querySelector(`#thumb-${memory.docId}`);
        if (!thumbContainer) return;
        
        let mediaThumb = '';
        if (memory.type === 'video') {
          mediaThumb = `<video src="${fileUrl}" muted></video>`;
        } else if (memory.type === 'audio') {
          mediaThumb = `
            <div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; color:var(--accent-purple);">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            </div>
          `;
        } else {
          mediaThumb = `<img src="${fileUrl}" alt="">`;
        }
        
        thumbContainer.innerHTML = mediaThumb;
      }).catch(() => {
        const thumbContainer = item.querySelector(`#thumb-${memory.docId}`);
        if (thumbContainer) {
          thumbContainer.innerHTML = `<span style="font-size:0.6rem; color:#ff6b6b;">Error</span>`;
        }
      });

      const deleteBtn = item.querySelector('.btn-delete-memory');
      deleteBtn.addEventListener('click', () => deleteMemory(memory.docId, memory.title));

      adminGalleryList.appendChild(item);
    });
  } catch (err) {
    console.error(err);
    adminGalleryList.innerHTML = '<p style="color: #ff6b6b; text-align: center;">Error loading memories list.</p>';
  }
}

// Delete Memory (removes all subcollection chunk documents and parent)
async function deleteMemory(docId, title) {
  const confirmDelete = confirm(`Are you sure you want to delete "${title}"?`);
  if (!confirmDelete) return;

  try {
    showToast('Deleting memory...', 'success');
    
    // 1. Delete all chunks in subcollection
    const chunksSnapshot = await getDocs(collection(db, 'memories', docId, 'chunks'));
    const deletePromises = [];
    chunksSnapshot.forEach(chunkDoc => {
      deletePromises.push(deleteDoc(doc(db, 'memories', docId, 'chunks', chunkDoc.id)));
    });
    await Promise.all(deletePromises);

    // 2. Delete parent document
    await deleteDoc(doc(db, 'memories', docId));

    showToast('Deleted successfully!', 'success');
    loadAdminMemories();
  } catch (err) {
    console.error(err);
    showToast('Error deleting memory.', 'error');
  }
}

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('surprise_admin_token');
  token = '';
  showToast('Logged out.', 'success');
  authScreen.style.display = 'flex';
  dashboardScreen.style.display = 'none';
  passcodeVal.value = '';
});

// HTML Escaper for XSS
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Initialise auth status
if (token) {
  showDashboard();
} else {
  authScreen.style.display = 'flex';
  dashboardScreen.style.display = 'none';
}
