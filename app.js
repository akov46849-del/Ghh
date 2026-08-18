// ============================================================
// КОНФИГ FIREBASE
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyBjJ0U5hcGDmxrWKKa0RvTK3d9q5FvgHIk",
    authDomain: "zing-4a547.firebaseapp.com",
    databaseURL: "https://zing-4a547-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "zing-4a547",
    storageBucket: "zing-4a547.firebasestorage.app",
    messagingSenderId: "1030163494482",
    appId: "1:1030163494482:web:ede622e8b1f6859714518b"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

// ============================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================
let currentUser = null;
let currentUserProfile = null;
let currentChatId = null;
let currentChatPartnerUid = null;
let messagesListener = null;
let statusListener = null;
let typingListener = null;
let typingTimeout = null;
let friendRequestsListener = null;

// ============================================================
// DOM-ЭЛЕМЕНТЫ
// ============================================================
const authBox = document.getElementById('authBox');
const profileBox = document.getElementById('profileBox');
const chatBox = document.getElementById('chatBox');

const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');
const loginMessageText = document.getElementById('loginMessageText');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');

const registerName = document.getElementById('registerName');
const registerUsername = document.getElementById('registerUsername');
const registerPassword = document.getElementById('registerPassword');
const registerBtn = document.getElementById('registerBtn');
const registerMessage = document.getElementById('registerMessage');
const registerMessageText = document.getElementById('registerMessageText');

const profileName = document.getElementById('profileName');
const profileUsername = document.getElementById('profileUsername');
const profileGender = document.getElementById('profileGender');
const profileBio = document.getElementById('profileBio');
const profileAvatar = document.getElementById('profileAvatar');
const profileAvatarInput = document.getElementById('profileAvatarInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const profileMessage = document.getElementById('profileMessage');
const profileMessageText = document.getElementById('profileMessageText');

const chatAvatar = document.getElementById('chatAvatar');
const chatDisplayName = document.getElementById('chatDisplayName');
const chatUserName = document.getElementById('chatUserName'); // контейнер для имени и статуса
const logoutBtn = document.getElementById('logoutBtn');
const settingsBtn = document.getElementById('settingsBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const chatList = document.getElementById('chatList');
const activeChat = document.getElementById('activeChat');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const fileBtn = document.getElementById('fileBtn');
const fileInput = document.getElementById('fileInput');
const backToChatList = document.getElementById('backToChatList');
const activeChatName = document.getElementById('activeChatName');
const activeChatStatus = document.getElementById('activeChatStatus');
const blockUserBtn = document.getElementById('blockUserBtn');
const callBtn = document.getElementById('callBtn');
const incomingCallModal = document.getElementById('incomingCallModal');
const incomingCaller = document.getElementById('incomingCaller');
const acceptCallBtn = document.getElementById('acceptCallBtn');
const rejectCallBtn = document.getElementById('rejectCallBtn');
const callContainer = document.getElementById('callContainer');
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const hangupBtn = document.getElementById('hangupBtn');

const requestsBtn = document.getElementById('requestsBtn');
const requestsModal = document.getElementById('requestsModal');
const requestsModalClose = document.getElementById('requestsModalClose');
const requestsList = document.getElementById('requestsList');
const requestsBadge = document.getElementById('requestsBadge');

const passwordModal = document.getElementById('passwordModal');
const passwordModalClose = document.getElementById('passwordModalClose');
const oldPassword = document.getElementById('oldPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const changePasswordConfirmBtn = document.getElementById('changePasswordConfirmBtn');
const passwordModalMessage = document.getElementById('passwordModalMessage');
const passwordModalMessageText = document.getElementById('passwordModalMessageText');

// ============================================================
// 1. ВКЛАДКИ АВТОРИЗАЦИИ
// ============================================================
document.querySelectorAll('.auth-tabs button').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.auth-tabs button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const tab = this.dataset.tab;
        document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(tab).classList.add('active');
    });
});

// ============================================================
// 2. РЕГИСТРАЦИЯ
// ============================================================
registerBtn.addEventListener('click', () => {
    const displayName = registerName.value.trim();
    const username = registerUsername.value.trim().toLowerCase();
    const password = registerPassword.value.trim();

    if (!displayName || !username || !password) {
        showRegisterMessage('Заполните все поля.', false);
        return;
    }
    if (username.length < 3) {
        showRegisterMessage('Логин должен быть не менее 3 символов.', false);
        return;
    }
    if (password.length < 6) {
        showRegisterMessage('Пароль должен быть не менее 6 символов.', false);
        return;
    }

    registerBtn.disabled = true;
    registerBtn.innerHTML = '<div class="spinner"></div>';

    db.ref('usernames/' + username).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                showRegisterMessage('Этот логин уже занят.', false);
                throw new Error('username_taken');
            }
            const email = username + '@zing.local';
            return auth.createUserWithEmailAndPassword(email, password);
        })
        .then(userCred => {
            const uid = userCred.user.uid;
            const updates = {};
            updates['users/' + uid] = {
                displayName: displayName,
                username: username,
                avatar: '',
                gender: 'Секрет',
                bio: '',
                createdAt: Date.now(),
                online: true,
                lastSeen: Date.now(),
                blocked: []
            };
            updates['usernames/' + username] = uid;
            return db.ref().update(updates);
        })
        .then(() => {
            showRegisterMessage('✅ Регистрация успешна!', true);
            setTimeout(() => {
                const user = auth.currentUser;
                if (user) {
                    currentUser = user;
                    loadUserProfile(user.uid);
                }
            }, 500);
        })
        .catch(err => {
            if (err.message === 'username_taken') {
                // уже показано
            } else {
                showRegisterMessage('Ошибка: ' + err.message, false);
            }
        })
        .finally(() => {
            registerBtn.disabled = false;
            registerBtn.innerHTML = 'Зарегистрироваться';
        });
});

function showRegisterMessage(text, success) {
    registerMessage.style.display = 'flex';
    registerMessage.className = 'message show' + (success ? ' success' : '');
    registerMessage.querySelector('.icon').textContent = success ? '✅' : '⚠️';
    registerMessageText.textContent = text;
    setTimeout(() => registerMessage.style.display = 'none', 5000);
}

// ============================================================
// 3. ВХОД
// ============================================================
loginBtn.addEventListener('click', () => {
    const username = loginUsername.value.trim().toLowerCase();
    const password = loginPassword.value.trim();

    if (!username || !password) {
        showLoginMessage('Введите логин и пароль.', false);
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<div class="spinner"></div>';

    db.ref('usernames/' + username).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                showLoginMessage('Пользователь с таким логином не найден.', false);
                throw new Error('user_not_found');
            }
            const email = username + '@zing.local';
            return auth.signInWithEmailAndPassword(email, password);
        })
        .then(() => {
            showLoginMessage('✅ Вход выполнен!', true);
        })
        .catch(err => {
            if (err.message !== 'user_not_found') {
                showLoginMessage('Ошибка: ' + err.message, false);
            }
        })
        .finally(() => {
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Войти';
        });
});

function showLoginMessage(text, success) {
    loginMessage.style.display = 'flex';
    loginMessage.className = 'message show' + (success ? ' success' : '');
    loginMessage.querySelector('.icon').textContent = success ? '✅' : '⚠️';
    loginMessageText.textContent = text;
    setTimeout(() => loginMessage.style.display = 'none', 5000);
}

// ============================================================
// 4. СБРОС ПАРОЛЯ
// ============================================================
resetPasswordBtn.addEventListener('click', () => {
    const username = loginUsername.value.trim().toLowerCase();
    if (!username) {
        showLoginMessage('Введите логин для сброса пароля.', false);
        return;
    }
    const email = username + '@zing.local';
    auth.sendPasswordResetEmail(email)
        .then(() => {
            showLoginMessage('Ссылка для сброса отправлена на почту (логин@zing.local).', true);
        })
        .catch(err => {
            showLoginMessage('Ошибка: ' + err.message, false);
        });
});

// ============================================================
// 5. ПРОФИЛЬ
// ============================================================
function loadUserProfile(uid) {
    db.ref('users/' + uid).once('value')
        .then(snapshot => {
            const data = snapshot.val();
            if (data) {
                currentUserProfile = data;
                showChat();
            } else {
                showChat();
            }
        })
        .catch(() => {
            showChat();
        });
}

function openProfile() {
    chatBox.style.display = 'none';
    profileBox.style.display = 'flex';
    if (currentUserProfile) {
        profileName.value = currentUserProfile.displayName || '';
        profileUsername.value = currentUserProfile.username || '';
        profileGender.value = currentUserProfile.gender || 'Секрет';
        profileBio.value = currentUserProfile.bio || '';
        if (currentUserProfile.avatar) {
            profileAvatar.style.backgroundImage = `url(${currentUserProfile.avatar})`;
            profileAvatar.innerHTML = '';
        } else {
            profileAvatar.style.backgroundImage = '';
            profileAvatar.innerHTML = currentUserProfile.displayName ? currentUserProfile.displayName.charAt(0).toUpperCase() : '👤';
        }
    }
}

function closeProfile() {
    profileBox.style.display = 'none';
    chatBox.style.display = 'flex';
}

saveProfileBtn.addEventListener('click', () => {
    const displayName = profileName.value.trim();
    if (!displayName) {
        showProfileMessage('Имя обязательно.', false);
        return;
    }
    const updates = {
        displayName: displayName,
        gender: profileGender.value || 'Секрет',
        bio: profileBio.value.trim() || '',
        updatedAt: Date.now()
    };
    saveProfileBtn.disabled = true;
    saveProfileBtn.innerHTML = '<div class="spinner"></div>';
    db.ref('users/' + currentUser.uid).update(updates)
        .then(() => {
            currentUserProfile = { ...currentUserProfile, ...updates };
            showProfileMessage('Профиль сохранён! ✅', true);
            updateChatHeader();
        })
        .catch(err => {
            showProfileMessage('Ошибка: ' + err.message, false);
        })
        .finally(() => {
            saveProfileBtn.disabled = false;
            saveProfileBtn.innerHTML = '<i class="fas fa-check"></i> Сохранить профиль';
        });
});

profileAvatar.addEventListener('click', () => profileAvatarInput.click());
profileAvatarInput.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    const storageRef = storage.ref('avatars/' + currentUser.uid + '/' + Date.now() + '_' + file.name);
    const uploadTask = storageRef.put(file);
    uploadTask.on('state_changed', null, null, () => {
        uploadTask.snapshot.ref.getDownloadURL().then(url => {
            db.ref('users/' + currentUser.uid + '/avatar').set(url)
                .then(() => {
                    currentUserProfile.avatar = url;
                    profileAvatar.style.backgroundImage = `url(${url})`;
                    profileAvatar.innerHTML = '';
                    updateChatHeader();
                    showProfileMessage('Аватар обновлён!', true);
                })
                .catch(err => showProfileMessage('Ошибка: ' + err.message, false));
        });
    });
});

function showProfileMessage(text, success) {
    profileMessage.style.display = 'flex';
    profileMessage.className = 'message show' + (success ? ' success' : '');
    profileMessage.querySelector('.icon').textContent = success ? '✅' : '⚠️';
    profileMessageText.textContent = text;
    setTimeout(() => profileMessage.style.display = 'none', 5000);
}

// ============================================================
// 6. СМЕНА ПАРОЛЯ
// ============================================================
const changePasswordBtn = document.getElementById('changePasswordBtn');
changePasswordBtn.addEventListener('click', () => {
    passwordModal.classList.add('show');
    oldPassword.value = '';
    newPasswordInput.value = '';
    confirmPasswordInput.value = '';
    passwordModalMessage.style.display = 'none';
});

passwordModalClose.addEventListener('click', () => {
    passwordModal.classList.remove('show');
});

changePasswordConfirmBtn.addEventListener('click', () => {
    const old = oldPassword.value.trim();
    const newPwd = newPasswordInput.value.trim();
    const confirm = confirmPasswordInput.value.trim();
    if (!old || !newPwd || !confirm) {
        showPasswordModalMessage('Заполните все поля.', false);
        return;
    }
    if (newPwd.length < 6) {
        showPasswordModalMessage('Новый пароль должен быть не менее 6 символов.', false);
        return;
    }
    if (newPwd !== confirm) {
        showPasswordModalMessage('Пароли не совпадают.', false);
        return;
    }
    changePasswordConfirmBtn.disabled = true;
    changePasswordConfirmBtn.innerHTML = '<div class="spinner"></div>';

    const user = auth.currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, old);
    user.reauthenticateWithCredential(credential)
        .then(() => user.updatePassword(newPwd))
        .then(() => {
            showPasswordModalMessage('Пароль успешно изменён!', true);
            setTimeout(() => passwordModal.classList.remove('show'), 1500);
        })
        .catch(err => {
            showPasswordModalMessage('Ошибка: ' + err.message, false);
        })
        .finally(() => {
            changePasswordConfirmBtn.disabled = false;
            changePasswordConfirmBtn.innerHTML = 'Изменить пароль';
        });
});

function showPasswordModalMessage(text, success) {
    passwordModalMessage.style.display = 'flex';
    passwordModalMessage.className = 'message show' + (success ? ' success' : '');
    passwordModalMessage.querySelector('.icon').textContent = success ? '✅' : '⚠️';
    passwordModalMessageText.textContent = text;
    setTimeout(() => passwordModalMessage.style.display = 'none', 5000);
}

// ============================================================
// 7. УДАЛЕНИЕ АККАУНТА
// ============================================================
deleteAccountBtn.addEventListener('click', () => {
    if (!confirm('Вы уверены, что хотите удалить аккаунт? Все данные будут потеряны.')) return;
    const uid = currentUser.uid;
    const username = currentUserProfile.username;
    const updates = {};
    updates['users/' + uid] = null;
    updates['usernames/' + username] = null;
    db.ref().update(updates)
        .then(() => currentUser.delete())
        .then(() => {
            showProfileMessage('Аккаунт удалён.', true);
            setTimeout(() => location.reload(), 2000);
        })
        .catch(err => {
            showProfileMessage('Ошибка: ' + err.message, false);
        });
});

closeProfileBtn.addEventListener('click', closeProfile);

// ============================================================
// 8. ЧАТ
// ============================================================
function showChat() {
    authBox.style.display = 'none';
    profileBox.style.display = 'none';
    chatBox.style.display = 'flex';
    updateChatHeader(); // показываем только своё имя без статуса
    loadChatList();
    updateRequestsBadge();
    listenForFriendRequests();
    setUserStatus(currentUser.uid, true);
}

function updateChatHeader() {
    if (currentUserProfile) {
        const name = currentUserProfile.displayName || 'Пользователь';
        chatDisplayName.textContent = name;
        const avatar = currentUserProfile.avatar || name.charAt(0).toUpperCase();
        if (avatar && avatar.startsWith('http')) {
            chatAvatar.style.backgroundImage = `url(${avatar})`;
            chatAvatar.style.backgroundSize = 'cover';
            chatAvatar.textContent = '';
        } else {
            chatAvatar.style.backgroundImage = '';
            chatAvatar.textContent = avatar;
        }
        // Скрываем статус (он будет только в активном чате)
        const statusEl = chatUserName.querySelector('.chat-status');
        if (statusEl) statusEl.style.display = 'none';
    }
}

function setUserStatus(uid, online) {
    const updates = {
        online: online,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    };
    db.ref('users/' + uid + '/status').update(updates)
        .catch(err => console.error('Ошибка обновления статуса:', err));
}

function listenPartnerStatus(partnerUid) {
    if (statusListener) {
        statusListener.off();
        statusListener = null;
    }
    const statusRef = db.ref('users/' + partnerUid + '/status');
    statusListener = statusRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        updateActiveChatStatus(data);
    });
}

function updateActiveChatStatus(data) {
    if (!activeChatStatus) return;
    if (data.online) {
        activeChatStatus.textContent = 'онлайн';
        activeChatStatus.className = 'chat-status online';
    } else {
        const lastSeen = data.lastSeen;
        if (lastSeen) {
            const date = new Date(lastSeen);
            const now = new Date();
            const diffMs = now - date;
            const diffMin = Math.floor(diffMs / 60000);
            let text = 'был(а) ';
            if (diffMin < 1) text += 'только что';
            else if (diffMin < 60) text += diffMin + ' мин назад';
            else if (diffMin < 1440) text += Math.floor(diffMin / 60) + ' ч назад';
            else text += 'вчера в ' + date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            activeChatStatus.textContent = text;
            activeChatStatus.className = 'chat-status';
        } else {
            activeChatStatus.textContent = 'не в сети';
            activeChatStatus.className = 'chat-status';
        }
    }
}

function listenTyping(chatId) {
    if (typingListener) {
        typingListener.off();
        typingListener = null;
    }
    const typingRef = db.ref('chats/' + chatId + '/typing');
    typingListener = typingRef.on('value', (snapshot) => {
        const typingData = snapshot.val();
        if (!activeChatStatus) return;
        if (typingData && typingData.uid !== currentUser.uid && typingData.isTyping) {
            activeChatStatus.textContent = 'печатает...';
            activeChatStatus.className = 'chat-status typing';
        } else {
            // Восстанавливаем статус (онлайн/офлайн)
            if (currentChatPartnerUid) {
                listenPartnerStatus(currentChatPartnerUid);
            }
        }
    });
}

function setTyping(chatId, isTyping) {
    if (!chatId) return;
    const typingRef = db.ref('chats/' + chatId + '/typing');
    if (isTyping) {
        typingRef.set({ uid: currentUser.uid, isTyping: true, timestamp: Date.now() });
    } else {
        typingRef.set({ uid: currentUser.uid, isTyping: false });
    }
}

function loadChatList() {
    const chatsRef = db.ref('chats');
    chatsRef.off();
    chatList.innerHTML = '<div style="color:rgba(255,255,255,0.3); padding:20px; text-align:center;">Загрузка...</div>';

    chatsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        chatList.innerHTML = '';
        if (!data) {
            chatList.innerHTML = '<div style="color:rgba(255,255,255,0.3); padding:20px; text-align:center;">Нет чатов. Начните общение!</div>';
            return;
        }

        const userChats = Object.entries(data).filter(([chatId, chat]) => {
            return chat.participants && chat.participants[currentUser.uid] === true;
        });

        if (userChats.length === 0) {
            chatList.innerHTML = '<div style="color:rgba(255,255,255,0.3); padding:20px; text-align:center;">Нет чатов. Начните общение!</div>';
            return;
        }

        userChats.sort((a, b) => (b[1].lastTimestamp || 0) - (a[1].lastTimestamp || 0));

        userChats.forEach(([chatId, chat]) => {
            const partnerUid = Object.keys(chat.participants).find(uid => uid !== currentUser.uid);
            if (!partnerUid) return;
            db.ref('users/' + partnerUid).once('value').then(snap => {
                const partner = snap.val();
                if (!partner) return;
                const div = document.createElement('div');
                div.className = 'chat-item';
                const avatarLetter = (partner.avatar && partner.avatar.startsWith('http')) ? '' : (partner.displayName ? partner.displayName.charAt(0).toUpperCase() : '?');
                div.innerHTML = `
                    <div class="chat-avatar" style="${partner.avatar && partner.avatar.startsWith('http') ? `background-image:url(${partner.avatar}); background-size:cover;` : ''}">${avatarLetter}</div>
                    <div class="chat-info">
                        <div class="chat-name">${partner.displayName || 'Пользователь'}</div>
                        <div class="chat-last">${chat.lastMessage || 'Напишите первым'}</div>
                    </div>
                    <div class="chat-time">${chat.lastTimestamp ? new Date(chat.lastTimestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</div>
                `;
                div.addEventListener('click', () => {
                    openChat(chatId, partnerUid, partner);
                });
                chatList.appendChild(div);
            });
        });
    });
}

function openChat(chatId, partnerUid, partnerData) {
    currentChatId = chatId;
    currentChatPartnerUid = partnerUid;
    activeChat.style.display = 'flex';
    chatList.style.display = 'none';
    document.getElementById('searchBox').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    activeChatName.textContent = partnerData.displayName || 'Пользователь';
    activeChatStatus.textContent = 'загрузка...';
    activeChatStatus.className = 'chat-status';
    blockUserBtn.style.display = 'inline-block';
    blockUserBtn.onclick = () => {
        if (confirm('Заблокировать пользователя ' + (partnerData.displayName || '') + '?')) {
            blockUser(partnerUid);
        }
    };
    callBtn.style.display = 'inline-block';
    callBtn.onclick = () => startCall(partnerUid, partnerData.displayName);

    // Слушаем статус собеседника
    listenPartnerStatus(partnerUid);
    // Слушаем печатание
    listenTyping(chatId);

    loadMessages(chatId);

    messageInput.addEventListener('input', function() {
        if (currentChatId) {
            setTyping(currentChatId, true);
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                setTyping(currentChatId, false);
            }, 2000);
        }
    });
}

function loadMessages(chatId) {
    if (messagesListener) {
        messagesListener.off();
        messagesListener = null;
    }
    const messagesRef = db.ref('messages/' + chatId);
    messagesContainer.innerHTML = '';
    let first = true;
    messagesRef.limitToLast(50).on('child_added', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        if (data.deletedBy && data.deletedBy.includes(currentUser.uid)) return;
        const msgEl = document.createElement('div');
        msgEl.className = 'msg';
        if (data.from === currentUser.uid) msgEl.classList.add('me');
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar-msg';
        db.ref('users/' + data.from).once('value').then(snap => {
            const sender = snap.val();
            if (sender) {
                const letter = (sender.avatar && sender.avatar.startsWith('http')) ? '' : (sender.displayName ? sender.displayName.charAt(0).toUpperCase() : '?');
                if (sender.avatar && sender.avatar.startsWith('http')) {
                    avatarDiv.style.backgroundImage = `url(${sender.avatar})`;
                    avatarDiv.style.backgroundSize = 'cover';
                    avatarDiv.textContent = '';
                } else {
                    avatarDiv.textContent = letter;
                }
            }
        });
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const senderSpan = document.createElement('div');
        senderSpan.className = 'sender';
        senderSpan.textContent = data.from === currentUser.uid ? 'Вы' : (data.senderName || 'Unknown');
        const textSpan = document.createElement('div');
        textSpan.className = 'text';
        if (data.type === 'image') {
            const img = document.createElement('img');
            img.src = data.text;
            img.className = 'image-msg';
            img.style.maxWidth = '200px';
            img.style.borderRadius = '12px';
            img.style.marginTop = '4px';
            textSpan.appendChild(img);
        } else {
            textSpan.textContent = data.text || '';
        }
        const timeSpan = document.createElement('div');
        timeSpan.className = 'time';
        if (data.timestamp) {
            const date = new Date(data.timestamp);
            timeSpan.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (data.from === currentUser.uid) {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '✕';
            deleteBtn.style.cssText = 'background:none; border:none; color:rgba(255,255,255,0.3); cursor:pointer; font-size:12px; margin-left:8px;';
            deleteBtn.title = 'Удалить у себя';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteMessage(chatId, snapshot.key, false);
            });
            deleteBtn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (confirm('Удалить это сообщение у всех?')) {
                    deleteMessage(chatId, snapshot.key, true);
                }
            });
            timeSpan.appendChild(deleteBtn);
        }
        bubble.appendChild(senderSpan);
        bubble.appendChild(textSpan);
        bubble.appendChild(timeSpan);
        msgEl.appendChild(avatarDiv);
        msgEl.appendChild(bubble);
        messagesContainer.appendChild(msgEl);
        if (first) { messagesContainer.scrollTop = messagesContainer.scrollHeight; first = false; }
    });
    messagesListener = messagesRef;
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentChatId) return;
    const messagesRef = db.ref('messages/' + currentChatId);
    messagesRef.push({
        from: currentUser.uid,
        text: text,
        type: 'text',
        timestamp: Date.now(),
        senderName: currentUserProfile.displayName || 'Пользователь',
        deletedBy: []
    });
    db.ref('chats/' + currentChatId).update({
        lastMessage: text,
        lastTimestamp: Date.now()
    });
    messageInput.value = '';
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

fileBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const storageRef = storage.ref('images/' + Date.now() + '_' + file.name);
    const uploadTask = storageRef.put(file);
    uploadTask.on('state_changed', null, null, () => {
        uploadTask.snapshot.ref.getDownloadURL().then(url => {
            const messagesRef = db.ref('messages/' + currentChatId);
            messagesRef.push({
                from: currentUser.uid,
                text: url,
                type: 'image',
                timestamp: Date.now(),
                senderName: currentUserProfile.displayName || 'Пользователь',
                deletedBy: []
            });
            db.ref('chats/' + currentChatId).update({
                lastMessage: '📷 Фото',
                lastTimestamp: Date.now()
            });
            fileInput.value = '';
        });
    });
});

function deleteMessage(chatId, messageId, forEveryone = false) {
    const ref = db.ref('messages/' + chatId + '/' + messageId);
    if (forEveryone) {
        ref.remove();
    } else {
        ref.child('deletedBy').push(currentUser.uid);
    }
}

backToChatList.addEventListener('click', () => {
    if (messagesListener) {
        messagesListener.off();
        messagesListener = null;
    }
    activeChat.style.display = 'none';
    chatList.style.display = 'block';
    document.getElementById('searchBox').style.display = 'flex';
    currentChatId = null;
    currentChatPartnerUid = null;
    callBtn.style.display = 'none';
    if (typingListener) typingListener.off();
    if (statusListener) statusListener.off();
    // Сбрасываем статус в активном чате
    activeChatStatus.textContent = '';
    loadChatList();
});

// ============================================================
// 9. ПОИСК
// ============================================================
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;
    db.ref('users').orderByChild('username').startAt(query).endAt(query + '\uf8ff')
        .once('value')
        .then(snapshot => {
            const results = snapshot.val();
            searchResults.style.display = 'block';
            searchResults.innerHTML = '';
            if (!results) {
                searchResults.innerHTML = '<div style="color:rgba(255,255,255,0.5); padding:10px;">Ничего не найдено</div>';
                return;
            }
            Object.entries(results).forEach(([uid, user]) => {
                if (uid === currentUser.uid) return;
                const isBlocked = (currentUserProfile.blocked || []).includes(uid);
                const div = document.createElement('div');
                div.className = 'result-item';
                div.innerHTML = `
                    <span>${user.displayName || 'Пользователь'} (@${user.username})</span>
                    ${isBlocked ? '<span style="color:rgba(255,255,255,0.3);">Заблокирован</span>' :
                    `<button class="btn-secondary" style="padding:4px 16px; border-radius:30px; border:1px solid rgba(255,255,255,0.2); background:transparent; color:#fff; cursor:pointer;" data-uid="${uid}">Добавить</button>`}
                `;
                if (!isBlocked) {
                    div.querySelector('button').addEventListener('click', function() {
                        sendFriendRequest(this.dataset.uid);
                    });
                }
                searchResults.appendChild(div);
            });
        })
        .catch(err => {
            console.error('❌ Ошибка поиска:', err);
            searchResults.style.display = 'block';
            searchResults.innerHTML = '<div style="color:red; padding:10px;">Ошибка поиска: ' + err.message + '</div>';
        });
});

function sendFriendRequest(toUid) {
    db.ref('friendRequests').orderByChild('from').equalTo(currentUser.uid).once('value')
        .then(snapshot => {
            const requests = snapshot.val();
            if (requests) {
                const existing = Object.values(requests).find(req => req.to === toUid && req.status === 'pending');
                if (existing) {
                    showProfileMessage('Заявка уже отправлена.', false);
                    return;
                }
            }
            const ref = db.ref('friendRequests').push();
            ref.set({
                from: currentUser.uid,
                to: toUid,
                status: 'pending',
                timestamp: Date.now()
            }).then(() => {
                showProfileMessage('Заявка отправлена!', true);
                searchResults.style.display = 'none';
                updateRequestsBadge();
            }).catch(err => {
                showProfileMessage('Ошибка: ' + err.message, false);
            });
        });
}

// ============================================================
// 10. ЗАПРОСЫ
// ============================================================
function updateRequestsBadge() {
    if (!currentUser) return;
    db.ref('friendRequests').orderByChild('to').equalTo(currentUser.uid)
        .once('value')
        .then(snapshot => {
            const data = snapshot.val();
            let count = 0;
            if (data) {
                count = Object.values(data).filter(req => req.status === 'pending').length;
            }
            if (count > 0) {
                requestsBadge.style.display = 'inline';
                requestsBadge.textContent = count;
            } else {
                requestsBadge.style.display = 'none';
            }
        })
        .catch(err => console.error('Ошибка обновления бейджа:', err));
}

function listenForFriendRequests() {
    if (friendRequestsListener) {
        friendRequestsListener.off();
        friendRequestsListener = null;
    }
    if (!currentUser) return;
    const requestsRef = db.ref('friendRequests').orderByChild('to').equalTo(currentUser.uid);
    friendRequestsListener = requestsRef.on('child_added', (snapshot) => {
        const request = snapshot.val();
        if (request && request.status === 'pending') {
            updateRequestsBadge();
            if (requestsModal.classList.contains('show')) {
                loadRequests();
            }
        }
    });
}

async function loadRequests() {
    if (!currentUser) {
        console.warn('⚠️ loadRequests: пользователь не авторизован');
        return;
    }
    const list = document.getElementById('requestsList');
    if (!list) {
        console.error('❌ Элемент requestsList не найден в DOM');
        return;
    }
    list.innerHTML = '<div style="color:rgba(255,255,255,0.4); text-align:center; padding:20px;">Загрузка...</div>';

    try {
        const incomingSnap = await db.ref('friendRequests').orderByChild('to').equalTo(currentUser.uid).once('value');
        const outgoingSnap = await db.ref('friendRequests').orderByChild('from').equalTo(currentUser.uid).once('value');

        const incomingData = incomingSnap.val() || {};
        const outgoingData = outgoingSnap.val() || {};

        const incomingPending = Object.entries(incomingData).filter(([key, req]) => req.status === 'pending');
        const outgoingPending = Object.entries(outgoingData).filter(([key, req]) => req.status === 'pending');

        let html = `
            <div class="requests-tabs">
                <button class="active" data-rtab="incoming">Входящие (${incomingPending.length})</button>
                <button data-rtab="outgoing">Исходящие (${outgoingPending.length})</button>
            </div>
            <div id="requestsContentInner">
                <div id="incomingList" style="max-height:300px; overflow-y:auto;">
        `;

        if (incomingPending.length === 0) {
            html += `<div style="color:rgba(255,255,255,0.4); text-align:center; padding:20px;">Нет входящих заявок</div>`;
        } else {
            for (const [key, req] of incomingPending) {
                const snap = await db.ref('users/' + req.from).once('value');
                const user = snap.val();
                if (user) {
                    html += `
                        <div class="request-item" data-key="${key}">
                            <div class="info">
                                <div class="name">${user.displayName || 'Пользователь'}</div>
                                <div class="username">@${user.username || ''}</div>
                            </div>
                            <div class="actions">
                                <button class="accept" data-key="${key}" data-uid="${req.from}">Принять</button>
                                <button class="reject" data-key="${key}">Отклонить</button>
                            </div>
                        </div>
                    `;
                }
            }
        }

        html += `</div><div id="outgoingList" style="display:none; max-height:300px; overflow-y:auto;">`;

        if (outgoingPending.length === 0) {
            html += `<div style="color:rgba(255,255,255,0.4); text-align:center; padding:20px;">Нет исходящих заявок</div>`;
        } else {
            for (const [key, req] of outgoingPending) {
                const snap = await db.ref('users/' + req.to).once('value');
                const user = snap.val();
                if (user) {
                    html += `
                        <div class="request-item" data-key="${key}">
                            <div class="info">
                                <div class="name">${user.displayName || 'Пользователь'}</div>
                                <div class="username">@${user.username || ''}</div>
                            </div>
                            <div class="actions">
                                <button class="cancel" data-key="${key}">Отменить</button>
                            </div>
                        </div>
                    `;
                }
            }
        }

        html += `</div></div>`;
        list.innerHTML = html;

        document.querySelectorAll('.accept').forEach(btn => {
            btn.addEventListener('click', function() {
                const key = this.dataset.key;
                const uid = this.dataset.uid;
                acceptRequest(key, uid);
            });
        });
        document.querySelectorAll('.reject').forEach(btn => {
            btn.addEventListener('click', function() {
                const key = this.dataset.key;
                rejectRequest(key);
            });
        });
        document.querySelectorAll('.cancel').forEach(btn => {
            btn.addEventListener('click', function() {
                const key = this.dataset.key;
                cancelRequest(key);
            });
        });

        document.querySelectorAll('.requests-tabs button').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.requests-tabs button').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const tab = this.dataset.rtab;
                document.getElementById('incomingList').style.display = tab === 'incoming' ? 'block' : 'none';
                document.getElementById('outgoingList').style.display = tab === 'outgoing' ? 'block' : 'none';
            });
        });

    } catch (err) {
        console.error('❌ Ошибка загрузки заявок:', err);
        list.innerHTML = `<div style="color:red; padding:10px;">Ошибка загрузки: ${err.message}</div>`;
    }
}

function acceptRequest(key, friendUid) {
    const chatId = [currentUser.uid, friendUid].sort().join('_');
    const chatRef = db.ref('chats/' + chatId);
    chatRef.set({
        participants: { [currentUser.uid]: true, [friendUid]: true },
        lastMessage: 'Начните общение!',
        lastTimestamp: Date.now()
    })
    .then(() => db.ref('friendRequests/' + key).remove())
    .then(() => {
        showProfileMessage('✅ Заявка принята! Чат создан.', true);
        updateRequestsBadge();
        requestsModal.classList.remove('show');
        loadChatList();
        return db.ref('users/' + friendUid).once('value');
    })
    .then(snapshot => {
        const partner = snapshot.val();
        if (partner) {
            openChat(chatId, friendUid, partner);
        }
    })
    .catch(err => {
        showProfileMessage('Ошибка: ' + err.message, false);
    });
}

function rejectRequest(key) {
    db.ref('friendRequests/' + key).remove()
        .then(() => {
            showProfileMessage('Заявка отклонена.', true);
            loadRequests();
            updateRequestsBadge();
        })
        .catch(err => {
            showProfileMessage('Ошибка: ' + err.message, false);
        });
}

function cancelRequest(key) {
    db.ref('friendRequests/' + key).remove()
        .then(() => {
            showProfileMessage('Заявка отменена.', true);
            loadRequests();
            updateRequestsBadge();
        })
        .catch(err => {
            showProfileMessage('Ошибка: ' + err.message, false);
        });
}

requestsBtn.addEventListener('click', () => {
    requestsModal.classList.add('show');
    loadRequests();
});

requestsModalClose.addEventListener('click', () => {
    requestsModal.classList.remove('show');
});

requestsModal.addEventListener('click', (e) => {
    if (e.target === requestsModal) {
        requestsModal.classList.remove('show');
    }
});

// ============================================================
// 11. БЛОКИРОВКА
// ============================================================
function blockUser(uid) {
    const blockedList = currentUserProfile.blocked || [];
    if (blockedList.includes(uid)) {
        showProfileMessage('Пользователь уже заблокирован.', false);
        return;
    }
    blockedList.push(uid);
    db.ref('users/' + currentUser.uid + '/blocked').set(blockedList)
        .then(() => {
            currentUserProfile.blocked = blockedList;
            showProfileMessage('Пользователь заблокирован.', true);
            backToChatList.click();
        })
        .catch(err => {
            showProfileMessage('Ошибка: ' + err.message, false);
        });
}

// ============================================================
// 12. ЗВОНКИ (WebRTC)
// ============================================================
let peerConnection = null;
let localStream = null;
let currentCallId = null;
let callInitiator = false;

async function startCall(partnerUid, partnerName) {
    if (!currentUser) return;
    if (peerConnection) {
        alert('У вас уже есть активный звонок.');
        return;
    }
    const callRef = db.ref('calls').push();
    currentCallId = callRef.key;
    const callData = {
        from: currentUser.uid,
        to: partnerUid,
        status: 'calling',
        timestamp: Date.now(),
        fromName: currentUserProfile.displayName || 'Пользователь',
        toName: partnerName || 'Собеседник'
    };
    await callRef.set(callData);
    callInitiator = true;
    await createPeerConnection(partnerUid, callRef.key);
    callRef.on('value', snapshot => {
        const data = snapshot.val();
        if (!data) return;
        if (data.status === 'answered') {
            showCallUI();
        } else if (data.status === 'rejected' || data.status === 'ended') {
            endCall();
        }
    });
}

async function createPeerConnection(partnerUid, callId) {
    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };
    peerConnection = new RTCPeerConnection(configuration);
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    localVideo.srcObject = localStream;
    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            db.ref('calls/' + callId + '/candidates').push({
                candidate: event.candidate,
                from: currentUser.uid
            });
        }
    };
    if (callInitiator) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        db.ref('calls/' + callId + '/offer').set({
            sdp: offer.sdp,
            type: offer.type
        });
    }
    db.ref('calls/' + callId + '/offer').on('value', async snapshot => {
        const data = snapshot.val();
        if (data && !callInitiator) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            db.ref('calls/' + callId + '/answer').set({
                sdp: answer.sdp,
                type: answer.type
            });
        }
    });
    db.ref('calls/' + callId + '/answer').on('value', async snapshot => {
        const data = snapshot.val();
        if (data && callInitiator) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
        }
    });
    db.ref('calls/' + callId + '/candidates').on('child_added', async snapshot => {
        const data = snapshot.val();
        if (data.from !== currentUser.uid) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    });
}

async function answerCall(callId, callerUid) {
    currentCallId = callId;
    callInitiator = false;
    db.ref('calls/' + callId + '/status').set('answered');
    await createPeerConnection(callerUid, callId);
    showCallUI();
    incomingCallModal.classList.remove('show');
}

function rejectCall(callId) {
    db.ref('calls/' + callId + '/status').set('rejected');
    incomingCallModal.classList.remove('show');
}

function endCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    callContainer.style.display = 'none';
    remoteVideo.srcObject = null;
    localVideo.srcObject = null;
    if (currentCallId) {
        db.ref('calls/' + currentCallId + '/status').set('ended');
        db.ref('calls/' + currentCallId).off();
        currentCallId = null;
    }
    callInitiator = false;
}

function showCallUI() {
    callContainer.style.display = 'flex';
    incomingCallModal.classList.remove('show');
}

hangupBtn.addEventListener('click', endCall);

auth.onAuthStateChanged(user => {
    if (user) {
        const callsRef = db.ref('calls');
        callsRef.orderByChild('to').equalTo(user.uid).on('child_added', snapshot => {
            const data = snapshot.val();
            if (data && data.status === 'calling' && data.from !== user.uid) {
                incomingCaller.textContent = data.fromName || 'Неизвестный';
                incomingCallModal.classList.add('show');
                const callId = snapshot.key;
                acceptCallBtn.onclick = () => answerCall(callId, data.from);
                rejectCallBtn.onclick = () => rejectCall(callId);
            }
        });
    }
});

// ============================================================
// 13. СОСТОЯНИЕ АВТОРИЗАЦИИ
// ============================================================
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        setUserStatus(user.uid, true);
        loadUserProfile(user.uid);
    } else {
        if (currentUser) {
            setUserStatus(currentUser.uid, false);
        }
        authBox.style.display = 'flex';
        profileBox.style.display = 'none';
        chatBox.style.display = 'none';
        if (messagesListener) messagesListener.off();
        if (statusListener) statusListener.off();
        if (typingListener) typingListener.off();
        if (friendRequestsListener) friendRequestsListener.off();
        currentUser = null;
        currentUserProfile = null;
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        callContainer.style.display = 'none';
        remoteVideo.srcObject = null;
        localVideo.srcObject = null;
        currentCallId = null;
        callInitiator = false;
    }
});

// ============================================================
// 14. ВЫХОД
// ============================================================
logoutBtn.addEventListener('click', () => {
    if (currentUser) {
        setUserStatus(currentUser.uid, false);
    }
    auth.signOut();
});

settingsBtn.addEventListener('click', openProfile);

console.log('✅ ZING app.js загружен и готов к работе!');
