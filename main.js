// =====================
// FIREBASE CONFIG
// =====================
const firebaseConfig = {
  apiKey: "AIzaSyBWfk98wwa47Mtgbh3Y4j9MCov0xwzlFmE",
  authDomain: "filgame-8e396.firebaseapp.com",
  projectId: "filgame-8e396",
  storageBucket: "filgame-8e396.firebasestorage.app",
  messagingSenderId: "363137597425",
  appId: "1:363137597425:web:d4242a083cebfc1c458e50",
  measurementId: "G-38HJHCC7Y8"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// =====================
// UTILITY FUNCTIONS
// =====================
function getYouTubeVideoId(url) {
  const regex = /(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}



function getVideoEmbedHTML(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
    }
  }
  return `<div class="video-wrapper" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: white;">Invalid Video URL</div>`;
}

// Custom Modal Functions
function showModal(title, message, onConfirm = null, onCancel = null) {
  const modal = document.getElementById('customModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalOkBtn = document.getElementById('modalOkBtn');

  modalTitle.textContent = title;
  modalMessage.textContent = message;

  // Show modal
  modal.classList.add('active');

  // Handle OK button
  const handleOk = () => {
    modal.classList.remove('active');
    if (onConfirm) onConfirm();
  };

  // Handle Cancel button
  const handleCancel = () => {
    modal.classList.remove('active');
    if (onCancel) onCancel();
  };

  // Remove previous event listeners
  modalOkBtn.onclick = null;
  modalCancelBtn.onclick = null;

  // Add new event listeners
  modalOkBtn.onclick = handleOk;
  modalCancelBtn.onclick = handleCancel;

  // Handle ESC key
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);

  // Handle click outside modal
  modal.onclick = (e) => {
    if (e.target === modal) {
      handleCancel();
    }
  };
}

function showAlert(message, title = 'Notification') {
  showModal(title, message, null, null);
}

function showConfirm(message, title = 'Confirm', onConfirm = null, onCancel = null) {
  showModal(title, message, onConfirm, onCancel);
}

function showPrompt(title, message, defaultValue = '', onConfirm = null, onCancel = null) {
  const modal = document.getElementById('customModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalOkBtn = document.getElementById('modalOkBtn');

  modalTitle.textContent = title;
  modalMessage.innerHTML = message + '<br><input type="text" id="modalInput" value="' + defaultValue + '" style="width: 100%; margin-top: 10px; padding: 5px;">';

  // Show modal
  modal.classList.add('active');

  // Handle OK button
  const handleOk = () => {
    modal.classList.remove('active');
    const inputValue = document.getElementById('modalInput').value;
    if (onConfirm) onConfirm(inputValue);
  };

  // Handle Cancel button
  const handleCancel = () => {
    modal.classList.remove('active');
    if (onCancel) onCancel();
  };

  // Remove previous event listeners
  modalOkBtn.onclick = null;
  modalCancelBtn.onclick = null;

  // Add new event listeners
  modalOkBtn.onclick = handleOk;
  modalCancelBtn.onclick = handleCancel;

  // Handle ESC key
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);

  // Handle click outside modal
  modal.onclick = (e) => {
    if (e.target === modal) {
      handleCancel();
    }
  };
}

// =====================
// PAGE DETECTION
// =====================
const path = window.location.pathname;
if (path.endsWith("index.html") || path === "/") handleIndex();
else if (path.endsWith("upload.html")) handleUpload();
else if (path.endsWith("profile.html")) handleProfile();
else if (path.endsWith("about.html")) handleAbout();
else if (path.endsWith("prompt.html")) handlePrompt();

// =====================
// MOBILE NAV TOGGLE
// =====================
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });
}

// =====================
  // INDEX PAGE
// =====================
function handleIndex() {
  const loginBtn = document.getElementById('loginBtn');
  const uploadNav = document.getElementById('uploadNav');
  const profileNav = document.getElementById('profileNav');
  const searchInput = document.getElementById('searchInput');
  const showMoreBtn = document.getElementById('showMoreBtn');
  const imageBtn = document.getElementById('imageBtn');
  const videoBtn = document.getElementById('videoBtn');

  // Hide nav items by default to prevent flash
  if (uploadNav) uploadNav.style.display = 'none';
  if (profileNav) profileNav.style.display = 'none';

  let allPrompts = [];
  let filteredPrompts = [];
  let displayedCount = 10;
  const copyStates = new Map();

  auth.onAuthStateChanged(user => {
    if (user) {
      loginBtn.textContent = 'Logout';
      uploadNav.style.display = 'block';
      profileNav.style.display = 'block';
      loginBtn.onclick = () => auth.signOut();
    } else {
      loginBtn.textContent = 'Login with Google';
      uploadNav.style.display = 'none';
      profileNav.style.display = 'none';
      loginBtn.onclick = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(err => {
          console.error('Login error:', err);
          showAlert('Login failed: ' + err.message + '. Make sure you are running the site from a local server (not file://) and check popup blocker.');
        });
      };
    }
  });

  // Load all prompts
  db.collection('prompts').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    allPrompts = [];

    snapshot.forEach(doc => {
      const d = doc.data();
      allPrompts.push({ id: doc.id, ...d });
    });

    // Apply current filters
    applyFilters();
  });

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  // Media type filter functionality
  let currentMediaFilter = 'all'; // 'all', 'image', 'video'
  const allBtn = document.getElementById('allBtn');

  if (allBtn) {
    allBtn.addEventListener('click', () => {
      currentMediaFilter = 'all';
      allBtn.classList.add('active');
      imageBtn.classList.remove('active');
      videoBtn.classList.remove('active');
      applyFilters();
    });
  }

  if (imageBtn) {
    imageBtn.addEventListener('click', () => {
      currentMediaFilter = 'image';
      imageBtn.classList.add('active');
      allBtn.classList.remove('active');
      videoBtn.classList.remove('active');
      applyFilters();
    });
  }

  if (videoBtn) {
    videoBtn.addEventListener('click', () => {
      currentMediaFilter = 'video';
      videoBtn.classList.add('active');
      allBtn.classList.remove('active');
      imageBtn.classList.remove('active');
      applyFilters();
    });
  }



  // Show More functionality
  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', () => {
      displayedCount += 10;
      renderGallery(filteredPrompts);
    });
  }

  function applyFilters() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    filteredPrompts = allPrompts.filter(prompt => {
      const matchesSearch = prompt.prompt.toLowerCase().includes(searchTerm) || prompt.owner.toLowerCase().includes(searchTerm);
      const matchesMedia = currentMediaFilter === 'all' || prompt.mediaType === currentMediaFilter;
      return matchesSearch && matchesMedia;
    });

    displayedCount = 10; // Reset displayed count on filter change
    renderGallery(filteredPrompts);
  }

  function renderGallery(prompts) {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    gallery.innerHTML = '';

    if (prompts.length === 0) {
      gallery.innerHTML = '<p>No prompts found matching your criteria.</p>';
      if (showMoreBtn) showMoreBtn.style.display = 'none';
      return;
    }

    const promptsToShow = prompts.slice(0, displayedCount);

    promptsToShow.forEach(prompt => {
      const card = document.createElement('div');
      card.className = 'card';

      let mediaHTML = '';
      if (prompt.mediaType === 'video') {
        const videoId = getYouTubeVideoId(prompt.videoURL);
        if (videoId) {
          mediaHTML = `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
        } else {
          mediaHTML = `<div class="video-wrapper" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: white;">Invalid Video URL</div>`;
        }
      } else {
        mediaHTML = `<img class="thumb" src="${prompt.imageURL}" alt="prompt image">`;
      }

      card.innerHTML = `
        ${mediaHTML}
        <textarea id="prompt-text-${prompt.id}" readonly>${prompt.prompt}</textarea>
        <div class="card-actions">
          <button class="copy-btn">Copy Prompt</button>
          <button class="copy-link-btn" data-id="${prompt.id}">Copy Link</button>
          <button class="save-btn" data-id="${prompt.id}">Save</button>
        </div>
        <div class="meta">
          <img src="${prompt.ownerPhoto}" alt="user">
          <span>${prompt.owner}</span>
        </div>
      `;
      gallery.appendChild(card);

      // Make card clickable to navigate to prompt detail page
      card.onclick = () => {
        window.location = `prompt.html?id=${prompt.id}`;
      };

      // Add copy functionality
      const copyBtn = card.querySelector('.copy-btn');
      const textarea = card.querySelector('textarea');

      // Check if currently in copied state
      if (copyStates.get(prompt.id)) {
        copyBtn.textContent = 'Copied!';
        copyBtn.style.backgroundColor = '#10b981';
      }

      copyBtn.onclick = async (e) => {
        e.stopPropagation();
        if (copyStates.get(prompt.id)) return; // Prevent multiple clicks

        const text = textarea.value;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.backgroundColor = '#10b981'; // Green background for visibility
        copyStates.set(prompt.id, true);

        setTimeout(() => {
          copyBtn.textContent = 'Copy Prompt';
          copyBtn.style.backgroundColor = ''; // Reset background
          copyStates.delete(prompt.id);
        }, 2000);

        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
          } else {
            // fallback
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (!success) throw new Error('Copy failed');
          }


        } catch (err) {
          console.error('Failed to copy: ', err);
        }
      };

      // Add save functionality
      const saveBtn = card.querySelector('.save-btn');
      saveBtn.onclick = async (e) => {
        e.stopPropagation();
        const user = auth.currentUser;
        if (!user) {
          showAlert('Please login to save prompts.');
          return;
        }

        const favoriteId = `${user.uid}_${prompt.id}`;
        const favoriteRef = db.collection('favorites').doc(favoriteId);
        const favoriteSnap = await favoriteRef.get();

        if (favoriteSnap.exists) {
          // Remove save
          await favoriteRef.delete();
          saveBtn.textContent = 'Save';
        } else {
          // Add save
          await favoriteRef.set({
            userId: user.uid,
            promptId: prompt.id,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          saveBtn.textContent = 'Saved';
          showAlert('Prompt saved!');
        }
      };

      // Add copy link functionality
      const copyLinkBtn = card.querySelector('.copy-link-btn');
      copyLinkBtn.onclick = async (e) => {
        e.stopPropagation();
        const link = `${window.location.origin}/prompt.html?id=${prompt.id}`;
        copyLinkBtn.textContent = 'Copied!';
        copyLinkBtn.style.backgroundColor = '#10b981';

        setTimeout(() => {
          copyLinkBtn.textContent = 'Copy Link';
          copyLinkBtn.style.backgroundColor = '';
        }, 2000);

        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(link);
          } else {
            // fallback
            const textArea = document.createElement("textarea");
            textArea.value = link;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (!success) throw new Error('Copy failed');
          }
        } catch (err) {
          console.error('Failed to copy: ', err);
        }
      };

      // Check if already saved
      if (auth.currentUser) {
        const favoriteId = `${auth.currentUser.uid}_${prompt.id}`;
        db.collection('favorites').doc(favoriteId).get().then(snap => {
          if (snap.exists) {
            saveBtn.textContent = 'Saved';
          }
        });
      }
    });

    // Show or hide "Show More" button
    if (showMoreBtn) {
      if (prompts.length > displayedCount) {
        showMoreBtn.style.display = 'block';
      } else {
        showMoreBtn.style.display = 'none';
      }
    }
  }
}

// =====================
// UPLOAD PAGE
// =====================
function handleUpload() {
  const formBox = document.getElementById('formBox');
  const loginBox = document.getElementById('loginBox');
  const loginBtn = document.getElementById('loginBtn');
  const uploadNav = document.getElementById('uploadNav');
  const profileNav = document.getElementById('profileNav');
  const uploadBtn = document.getElementById('uploadPrompt');

  // Hide nav items by default to prevent flash
  if (uploadNav) uploadNav.style.display = 'none';
  if (profileNav) profileNav.style.display = 'none';

  auth.onAuthStateChanged(async user => {
    // Update navigation
    if (user) {
      loginBtn.textContent = 'Logout';
      uploadNav.style.display = 'block';
      profileNav.style.display = 'block';
      loginBtn.onclick = () => auth.signOut();
    } else {
      loginBtn.textContent = 'Login with Google';
      uploadNav.style.display = 'none';
      profileNav.style.display = 'none';
      loginBtn.onclick = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(err => {
          console.error('Login error:', err);
          showAlert('Login failed: ' + err.message + '. Make sure you are running the site from a local server (not file://) and check popup blocker.');
        });
      };
    }
    if (user) {
      loginBox.style.display = 'none';
      formBox.style.display = 'block';

      const userRef = db.collection('users').doc(user.uid);
      const snap = await userRef.get();

      if (!snap.exists) {
        function askUsername() {
          showPrompt('Choose Username', 'Choose a username (no spaces):', '', async (username) => {
            username = username?.trim();
            if (!username) {
              showAlert("Username is required.");
              askUsername();
              return;
            }
            const check = await db.collection('users').where('username', '==', username).get();
            if (!check.empty) {
              showAlert("❌ That username is already taken. Try another.");
              askUsername();
            } else {
              await userRef.set({
                username,
                email: user.email,
                photo: user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              });
              showAlert(`✅ Username '${username}' saved! You can now post prompts.`);
            }
          });
        }
        askUsername();
      }
    } else {
      loginBox.style.display = 'block';
      formBox.style.display = 'none';
    }
  });

  if (loginBtn)
      loginBtn.onclick = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(err => {
          console.error('Login error:', err);
          showAlert('Login failed: ' + err.message + '. Make sure you are running the site from a local server (not file://) and check popup blocker.');
        });
      };

  // Media type toggle
  const mediaTypeSelect = document.getElementById('mediaType');
  const imageGroup = document.getElementById('imageGroup');
  const videoGroup = document.getElementById('videoGroup');
  const imageTabs = document.querySelectorAll('.tutorial-tabs .image-tab');
  const videoTabs = document.querySelectorAll('.tutorial-tabs .video-tab');

  if (mediaTypeSelect) {
    mediaTypeSelect.addEventListener('change', () => {
      if (mediaTypeSelect.value === 'video') {
        imageGroup.style.display = 'none';
        videoGroup.style.display = 'block';
        // Show video tabs, hide image tabs
        imageTabs.forEach(tab => tab.style.display = 'none');
        videoTabs.forEach(tab => tab.style.display = 'inline-block');
        // Set first video tab active
        const firstVideoTab = document.querySelector('.tutorial-tabs .video-tab');
        if (firstVideoTab) {
          firstVideoTab.classList.add('active');
          // Show corresponding pane
          const targetPane = document.getElementById(firstVideoTab.getAttribute('data-tab'));
          if (targetPane) targetPane.classList.add('active');
        }
        // Hide all image panes
        document.querySelectorAll('.tab-pane[id^="image-"]').forEach(pane => pane.classList.remove('active'));
      } else {
        imageGroup.style.display = 'block';
        videoGroup.style.display = 'none';
        // Show image tabs, hide video tabs
        videoTabs.forEach(tab => tab.style.display = 'none');
        imageTabs.forEach(tab => tab.style.display = 'inline-block');
        // Set first image tab active
        const firstImageTab = document.querySelector('.tutorial-tabs .image-tab');
        if (firstImageTab) {
          firstImageTab.classList.add('active');
          // Show corresponding pane
          const targetPane = document.getElementById(firstImageTab.getAttribute('data-tab'));
          if (targetPane) targetPane.classList.add('active');
        }
        // Hide all video panes
        document.querySelectorAll('.tab-pane[id^="video-"]').forEach(pane => pane.classList.remove('active'));
      }
    });
  }

  // Tab functionality for upload tutorials
  const tutorialTabs = document.querySelectorAll('.tutorial-tabs .tab-btn');
  tutorialTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Only allow switching if the tab is visible
      if (tab.style.display !== 'none') {
        // Remove active class from all tabs
        tutorialTabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');

        // Hide all tab panes
        const tabPanes = document.querySelectorAll('.tab-pane');
        tabPanes.forEach(pane => pane.classList.remove('active'));

        // Show the corresponding tab pane
        const targetTab = tab.getAttribute('data-tab');
        const targetPane = document.getElementById(targetTab);
        if (targetPane) {
          targetPane.classList.add('active');
        }
      }
    });
  });

  // Link validation functions
  function validateImageLink(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  function validateVideoLink(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return getYouTubeVideoId(url) !== null;
    }
    return false;
  }

  if (uploadBtn)
    uploadBtn.onclick = async () => {
      const user = auth.currentUser;
      const mediaType = document.getElementById('mediaType').value;
      const img = document.getElementById('imgUrl').value.trim();
      const video = document.getElementById('videoUrl').value.trim();
      const text = document.getElementById('promptText').value.trim();

      if (mediaType === 'image' && !img) return showAlert('Please provide an image link.');
      if (mediaType === 'video' && !video) return showAlert('Please provide a YouTube video link.');
      if (!text) return showAlert('Please enter prompt text.');

      // Validate links before upload
      if (mediaType === 'image') {
        if (!img.startsWith('data:image/')) {
          showAlert('Validating image link...');
          const isValidImage = await validateImageLink(img);
          if (!isValidImage) {
            return showAlert('❌ The image link is not working. Please check the URL and try again.');
          }
        }
      } else if (mediaType === 'video') {
        const isValidVideo = validateVideoLink(video);
        if (!isValidVideo) {
          return showAlert('❌ The video link is not valid. Please provide a proper YouTube URL.');
        }
      }

      const userDoc = await db.collection('users').doc(user.uid).get();
      const u = userDoc.data();

      const promptData = {
        mediaType: mediaType,
        prompt: text,
        owner: u.username,
        ownerPhoto: user.photoURL,
        ownerUID: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (mediaType === 'image') {
        promptData.imageURL = img;
      } else {
        promptData.videoURL = video;
      }

      await db.collection('prompts').add(promptData);
      showAlert('✅ Prompt uploaded successfully!');
      window.location = 'index.html';
    };
}

// =====================
// PROFILE PAGE
// =====================
function handleProfile() {
  const saveBtn = document.getElementById('saveBtn');
  const usernameInput = document.getElementById('usernameInput');
  const loginBtn = document.getElementById('loginBtn');
  const uploadNav = document.getElementById('uploadNav');
  const profileNav = document.getElementById('profileNav');
  if (!saveBtn || !usernameInput) return;

  // Disable save button until user data is loaded
  saveBtn.disabled = true;

  // Hide nav items by default to prevent flash
  if (uploadNav) uploadNav.style.display = 'none';
  if (profileNav) profileNav.style.display = 'none';

  const copyStates = new Map();
  const buttonMap = new Map();

  auth.onAuthStateChanged(async user => {
    // Update navigation
    if (user) {
      loginBtn.textContent = 'Logout';
      uploadNav.style.display = 'block';
      profileNav.style.display = 'block';
      loginBtn.onclick = () => auth.signOut();
    } else {
      loginBtn.textContent = 'Login with Google';
      uploadNav.style.display = 'none';
      profileNav.style.display = 'none';
      loginBtn.onclick = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(err => {
          console.error('Login error:', err);
          showAlert('Login failed: ' + err.message + '. Make sure you are running the site from a local server (not file://) and check popup blocker.');
        });
      };
    }
    if (user) {
      // Load user data
      const userDoc = await db.collection('users').doc(user.uid).get();
      let userData = null;
      if (userDoc.exists) {
        userData = userDoc.data();
      } else {
        // Create user document if it doesn't exist
        await db.collection('users').doc(user.uid).set({
          username: '',
          email: user.email,
          photo: user.photoURL,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        userData = {
          username: '',
          email: user.email,
          photo: user.photoURL,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        // Prompt for username
        showPrompt('Choose Username', 'Choose a username (no spaces):', '', async (username) => {
          username = username?.trim();
          if (!username) {
            showAlert("Username is required.");
            return;
          }
          const check = await db.collection('users').where('username', '==', username).get();
          if (!check.empty) {
            showAlert("❌ That username is already taken. Try another.");
            return;
          } else {
            await db.collection('users').doc(user.uid).set({ username }, { merge: true });
            userData.username = username;
            usernameInput.value = username;
            if (userName) userName.textContent = username;
            showAlert(`✅ Username '${username}' saved!`);
          }
        });
      }

      usernameInput.value = userData.username || '';

      // Display user info
      const userName = document.getElementById('userName');
      const userPhoto = document.getElementById('userPhoto');
      const joinedDate = document.getElementById('joinedDate');

      if (userName) userName.textContent = userData.username || 'No username set';
      if (userPhoto) userPhoto.src = user.photoURL || '';
      if (joinedDate && userData.createdAt) {
        const joinDate = userData.createdAt.toDate();
        joinedDate.textContent = 'Joined: ' + joinDate.toLocaleDateString();
      }

      // Set save button handler only after user data is loaded
      saveBtn.onclick = async () => {
        try {
          const newUsername = usernameInput.value.trim();
          if (!newUsername) return showAlert('Enter a username.');

          const currentUsername = userData.username;
          if (newUsername === currentUsername) return showAlert('No changes to save.');

          // Check if username is taken by another user
          const check = await db.collection('users').where('username', '==', newUsername).get();
          if (!check.empty) return showAlert('❌ Username already taken.');

          // Update user document
          await db.collection('users').doc(user.uid).set({ username: newUsername }, { merge: true });

          userData.username = newUsername;

          // Update display
          const userName = document.getElementById('userName');
          if (userName) userName.textContent = newUsername;

          showAlert('✅ Username updated!');
        } catch (e) {
          showAlert('Error updating username: ' + e.message);
        }
      };

      // Enable save button now that user data is loaded
      saveBtn.disabled = false;

      // Tab switching functionality
      const uploadedBtn = document.getElementById('uploadedBtn');
      const savedBtn = document.getElementById('savedBtn');
      const uploadedSection = document.getElementById('uploadedSection');
      const savedSection = document.getElementById('savedSection');

      if (uploadedBtn && savedBtn && uploadedSection && savedSection) {
        uploadedBtn.onclick = () => {
          uploadedBtn.classList.add('active');
          savedBtn.classList.remove('active');
          uploadedSection.classList.add('active');
          savedSection.classList.remove('active');
        };

        savedBtn.onclick = () => {
          savedBtn.classList.add('active');
          uploadedBtn.classList.remove('active');
          savedSection.classList.add('active');
          uploadedSection.classList.remove('active');
        };
      }

      // Load user's prompts
      const userPrompts = document.getElementById('userPrompts');
      if (!userPrompts) return;

      console.log('Loading prompts for user:', user.uid);
      db.collection('prompts').where('ownerUID', '==', user.uid).onSnapshot(snapshot => {
        console.log('Number of prompts found:', snapshot.size);
        userPrompts.innerHTML = '';
        if (snapshot.empty) {
          userPrompts.innerHTML = '<p>You haven\'t uploaded any prompts yet.</p>';
          return;
        }
        snapshot.forEach(doc => {
          const d = doc.data();
          const card = document.createElement('div');
          card.className = 'card';

          let mediaHTML = '';
          if (d.mediaType === 'video') {
            const videoId = getYouTubeVideoId(d.videoURL);
            if (videoId) {
              mediaHTML = `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
            } else {
              mediaHTML = `<div class="video-wrapper" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: white;">Invalid Video URL</div>`;
            }
          } else {
            mediaHTML = `<img class="thumb" src="${d.imageURL}" alt="prompt image">`;
          }

          card.innerHTML = `
            ${mediaHTML}
            <textarea readonly>${d.prompt}</textarea>
            <div class="card-actions">
              <button class="btn copy-btn">Copy Prompt</button>
              <button class="copy-link-btn" data-id="${doc.id}">Copy Link</button>
              <button class="btn edit-btn" data-id="${doc.id}">Edit</button>
              <button class="btn delete-btn" data-id="${doc.id}">Delete</button>
            </div>
            <div class="meta">
              <img src="${d.ownerPhoto}" alt="user">
              <span>${d.owner}</span>
            </div>
          `;
          userPrompts.appendChild(card);

          // Add copy functionality
          const copyBtn = card.querySelector('.copy-btn');
          const textarea = card.querySelector('textarea');

          // Check if currently in copied state
          if (copyStates.get(doc.id)) {
            copyBtn.textContent = 'Copied!';
            copyBtn.style.backgroundColor = '#10b981';
          }

          copyBtn.onclick = async () => {
            if (copyStates.get(doc.id)) return; // Prevent multiple clicks

            const text = textarea.value;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.backgroundColor = '#10b981'; // Green background for visibility
            copyStates.set(doc.id, true);

            setTimeout(() => {
              copyBtn.textContent = 'Copy Prompt';
              copyBtn.style.backgroundColor = ''; // Reset background
              copyStates.delete(doc.id);
            }, 2000);

            try {
              await navigator.clipboard.writeText(text);
            } catch (err) {
              console.error('Failed to copy: ', err);
            }
          };

          // Add event listeners for edit and delete
          const editBtn = card.querySelector('.edit-btn');
          const deleteBtn = card.querySelector('.delete-btn');

          editBtn.onclick = () => {
            showPrompt('Edit Prompt', 'Edit your prompt:', textarea.value, (newPrompt) => {
              if (newPrompt && newPrompt.trim() !== textarea.value) {
                db.collection('prompts').doc(doc.id).update({ prompt: newPrompt.trim() });
                showAlert('Prompt updated!');
              }
            });
          };

          deleteBtn.onclick = () => {
            showConfirm('Delete Prompt', 'Are you sure you want to delete this prompt?', () => {
              db.collection('prompts').doc(doc.id).delete();
              showAlert('Prompt deleted!');
            });
          };
        });
      });

      // Load saved prompts
      const savedPrompts = document.getElementById('savedPrompts');
      if (!savedPrompts) return;

      console.log('Loading saved prompts for user:', user.uid);
      db.collection('favorites').where('userId', '==', user.uid).onSnapshot(async snapshot => {
        console.log('Number of saved prompts found:', snapshot.size);
        savedPrompts.innerHTML = '';
        if (snapshot.empty) {
          savedPrompts.innerHTML = '<p>You haven\'t saved any prompts yet.</p>';
          return;
        }

        const promptIds = snapshot.docs.map(doc => doc.data().promptId);
        const promptsSnapshot = await db.collection('prompts').where(firebase.firestore.FieldPath.documentId(), 'in', promptIds).get();

        promptsSnapshot.forEach(doc => {
          const d = doc.data();
          const card = document.createElement('div');
          card.className = 'card';

          let mediaHTML = '';
          if (d.mediaType === 'video') {
            const videoId = getYouTubeVideoId(d.videoURL);
            if (videoId) {
              mediaHTML = `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
            } else {
              mediaHTML = `<div class="video-wrapper" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: white;">Invalid Video URL</div>`;
            }
          } else {
            mediaHTML = `<img class="thumb" src="${d.imageURL}" alt="prompt image">`;
          }

          card.innerHTML = `
            ${mediaHTML}
            <textarea readonly>${d.prompt}</textarea>
            <div class="card-actions">
              <button class="btn copy-btn">Copy Prompt</button>
              <button class="btn unsave-btn" data-id="${doc.id}">Unsave</button>
            </div>
            <div class="meta">
              <img src="${d.ownerPhoto}" alt="user">
              <span>${d.owner}</span>
            </div>
          `;
          savedPrompts.appendChild(card);

          // Add copy functionality
          const copyBtn = card.querySelector('.copy-btn');
          const textarea = card.querySelector('textarea');

          // Check if currently in copied state
          if (copyStates.get(doc.id)) {
            copyBtn.textContent = 'Copied!';
            copyBtn.style.backgroundColor = '#10b981';
          }

          copyBtn.onclick = async () => {
            if (copyStates.get(doc.id)) return; // Prevent multiple clicks

            const text = textarea.value;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.backgroundColor = '#10b981'; // Green background for visibility
            copyStates.set(doc.id, true);

            setTimeout(() => {
              copyBtn.textContent = 'Copy Prompt';
              copyBtn.style.backgroundColor = ''; // Reset background
              copyStates.delete(doc.id);
            }, 2000);

            try {
              await navigator.clipboard.writeText(text);
            } catch (err) {
              console.error('Failed to copy: ', err);
            }
          };

          // Add unsave functionality
          const unsaveBtn = card.querySelector('.unsave-btn');
          unsaveBtn.onclick = async () => {
            const favoriteId = `${user.uid}_${doc.id}`;
            await db.collection('favorites').doc(favoriteId).delete();
            showAlert('Prompt unsaved!');
          };
        });
      });
    } else {
      // User not logged in, redirect to index
      window.location = 'index.html';
    }
  });
}

// =====================
// PROMPT DETAIL PAGE
// =====================
function handlePrompt() {
  const urlParams = new URLSearchParams(window.location.search);
  const promptId = urlParams.get('id');

  if (!promptId) {
    showAlert('No prompt ID provided.');
    window.location = 'index.html';
    return;
  }

  const loginBtn = document.getElementById('loginBtn');
  const uploadNav = document.getElementById('uploadNav');
  const profileNav = document.getElementById('profileNav');

  // Hide nav items by default to prevent flash
  if (uploadNav) uploadNav.style.display = 'none';
  if (profileNav) profileNav.style.display = 'none';

  auth.onAuthStateChanged(user => {
    if (user) {
      loginBtn.textContent = 'Logout';
      uploadNav.style.display = 'block';
      profileNav.style.display = 'block';
      loginBtn.onclick = () => auth.signOut();
    } else {
      loginBtn.textContent = 'Login with Google';
      uploadNav.style.display = 'none';
      profileNav.style.display = 'none';
      loginBtn.onclick = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(err => {
          console.error('Login error:', err);
          showAlert('Login failed: ' + err.message + '. Make sure you are running the site from a local server (not file://) and check popup blocker.');
        });
      };
    }
  });

  // Load prompt details
  const promptRef = db.collection('prompts').doc(promptId);
  promptRef.get().then(doc => {
    if (!doc.exists) {
      showAlert('Prompt not found.');
      window.location = 'index.html';
      return;
    }

    const prompt = doc.data();
    renderPromptDetail(prompt, doc.id);
  }).catch(err => {
    console.error('Error loading prompt:', err);
    showAlert('Error loading prompt.');
    window.location = 'index.html';
  });

  function renderPromptDetail(prompt, id) {
    const container = document.getElementById('prompt-detail');
    if (!container) return;

    let mediaHTML = '';
    if (prompt.mediaType === 'video') {
      const videoId = getYouTubeVideoId(prompt.videoURL);
      if (videoId) {
        mediaHTML = `<div class="prompt-media"><div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div></div>`;
      } else {
        mediaHTML = `<div class="prompt-media"><div class="video-wrapper" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: white;">Invalid Video URL</div></div>`;
      }
    } else {
      mediaHTML = `<div class="prompt-media"><img src="${prompt.imageURL}" alt="prompt image"></div>`;
    }

    container.innerHTML = `
      <div class="prompt-hero">
        <h1>Prompt Details</h1>
        <div class="prompt-meta">
          <img src="${prompt.ownerPhoto}" alt="user">
          <span>${prompt.owner}</span>
        </div>
      </div>

      ${mediaHTML}

      <div class="prompt-content">
        <h2>Prompt Text</h2>
        <textarea class="prompt-textarea" readonly>${prompt.prompt}</textarea>
        <div class="prompt-actions">
          <button class="btn" id="copyBtn">Copy Prompt</button>
          <button class="btn copy-link-btn" id="copyLinkBtn">Copy Link</button>
          <button class="btn" id="saveBtn">Save Prompt</button>
        </div>
      </div>

      <div class="prompt-stats">
        <div class="stat-card">
          <h3 id="saveCount">0</h3>
          <p>Saves</p>
        </div>
      </div>

      <div class="related-prompts">
        <h2>More from ${prompt.owner}</h2>
        <div class="related-grid" id="relatedPrompts"></div>
      </div>
    `;

    // Add copy functionality
    const copyBtn = document.getElementById('copyBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const saveBtn = document.getElementById('saveBtn');

    copyBtn.onclick = async () => {
      const text = prompt.prompt;
      copyBtn.textContent = 'Copied!';
      copyBtn.style.backgroundColor = '#10b981';

      setTimeout(() => {
        copyBtn.textContent = 'Copy Prompt';
        copyBtn.style.backgroundColor = '';
      }, 2000);

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          // fallback
          const textArea = document.createElement("textarea");
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const success = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (!success) throw new Error('Copy failed');
        }
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    };

    copyLinkBtn.onclick = async () => {
      const link = `${window.location.origin}/prompt.html?id=${id}`;
      copyLinkBtn.textContent = 'Copied!';
      copyLinkBtn.style.backgroundColor = '#10b981';

      setTimeout(() => {
        copyLinkBtn.textContent = 'Copy Link';
        copyLinkBtn.style.backgroundColor = '';
      }, 2000);

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(link);
        } else {
          // fallback
          const textArea = document.createElement("textarea");
          textArea.value = link;
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const success = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (!success) throw new Error('Copy failed');
        }
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    };

    // Add save functionality
    saveBtn.onclick = async () => {
      const user = auth.currentUser;
      if (!user) {
        showAlert('Please login to save prompts.');
        return;
      }

      const favoriteId = `${user.uid}_${id}`;
      const favoriteRef = db.collection('favorites').doc(favoriteId);
      const favoriteSnap = await favoriteRef.get();

      if (favoriteSnap.exists) {
        // Remove save
        await favoriteRef.delete();
        saveBtn.textContent = 'Save Prompt';
        showAlert('Prompt unsaved!');
      } else {
        // Add save
        await favoriteRef.set({
          userId: user.uid,
          promptId: id,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        saveBtn.textContent = 'Saved!';
        showAlert('Prompt saved!');
      }
    };

    // Check if already saved
    if (auth.currentUser) {
      const favoriteId = `${auth.currentUser.uid}_${id}`;
      db.collection('favorites').doc(favoriteId).get().then(snap => {
        if (snap.exists) {
          saveBtn.textContent = 'Saved!';
        }
      });
    }

    // Load save count
    db.collection('favorites').where('promptId', '==', id).onSnapshot(snapshot => {
      const saveCountEl = document.getElementById('saveCount');
      if (saveCountEl) {
        saveCountEl.textContent = snapshot.size;
      }
    });

    // Load related prompts
    db.collection('prompts').where('ownerUID', '==', prompt.ownerUID).where(firebase.firestore.FieldPath.documentId(), '!=', id).limit(6).get().then(snapshot => {
      const relatedContainer = document.getElementById('relatedPrompts');
      if (!relatedContainer) return;

      if (snapshot.empty) {
        relatedContainer.innerHTML = '<p>No other prompts from this creator.</p>';
        return;
      }

      snapshot.forEach(doc => {
        const d = doc.data();
        const card = document.createElement('div');
        card.className = 'related-card';

        let mediaHTML = '';
        if (d.mediaType === 'video') {
          const videoId = getYouTubeVideoId(d.videoURL);
          if (videoId) {
            mediaHTML = `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
          } else {
            mediaHTML = `<div class="video-wrapper" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: white;">Invalid Video URL</div>`;
          }
        } else {
          mediaHTML = `<img class="thumb" src="${d.imageURL}" alt="prompt image">`;
        }

        card.innerHTML = `
          ${mediaHTML}
          <p>${d.prompt.length > 100 ? d.prompt.substring(0, 100) + '...' : d.prompt}</p>
        `;

        card.onclick = () => {
          window.location = `prompt.html?id=${doc.id}`;
        };

        relatedContainer.appendChild(card);
      });
    });
  }
}

// =====================
// ABOUT PAGE
// =====================
function handleAbout() {
  // Handle navigation visibility for about page
  const loginBtn = document.getElementById('loginBtn');
  const uploadNav = document.getElementById('uploadNav');
  const profileNav = document.getElementById('profileNav');

  // Hide nav items by default to prevent flash
  if (uploadNav) uploadNav.style.display = 'none';
  if (profileNav) profileNav.style.display = 'none';

  auth.onAuthStateChanged(user => {
    if (user) {
      loginBtn.textContent = 'Logout';
      uploadNav.style.display = 'block';
      profileNav.style.display = 'block';
      loginBtn.onclick = () => auth.signOut();
    } else {
      loginBtn.textContent = 'Login with Google';
      uploadNav.style.display = 'none';
      profileNav.style.display = 'none';
      loginBtn.onclick = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(err => {
          console.error('Login error:', err);
          showAlert('Login failed: ' + err.message + '. Make sure you are running the site from a local server (not file://) and check popup blocker.');
        });
      };
    }
  });
}
