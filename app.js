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
let currentEmail = '';
let currentChatId = null;
let currentChatPartnerUid = null;
let messagesListener = null;
let tempUserForPassword = null;

const FIREBASE_DB_URL = 'https://zing-4a547-default-rtdb.europe-west1.firebasedatabase.app';

// ============================================================
// DOM-ЭЛЕМЕНТЫ
// ============================================================
const authBox = document.getElementById('authBox');
const profileBox = document.getElementById('profileBox');
const chatBox = document.getElementById('chatBox');
const setPasswordBox = document.getElementById('setPasswordBox');

const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginPasswordBtn = document.getElementById('loginPasswordBtn');
const loginMessage = document.getElementById('loginMessage');
const loginMessageText = document.getElementById('loginMessageText');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');

const codeLoginEmail = document.getElementById('codeLoginEmail');
const sendCodeLoginBtn = document.getElementById('sendCodeLoginBtn');
const codeLoginStep2 = document.getElementById('codeLoginStep2');
const codeLoginInput = document.getElementById('codeLoginInput');
const verifyCodeLoginBtn = document.getElementById('verifyCodeLoginBtn');
const codeLoginMessage = document.getElementById('codeLoginMessage');
const codeLoginMessageText = document.getElementById('codeLoginMessageText');

const newPassword = document.getElementById('newPassword');
const confirmPassword = document.getElementById('confirmPassword');
const setPasswordBtn = document.getElementById('setPasswordBtn');
const setPasswordMessage = document.getElementById('setPasswordMessage');
const setPasswordMessageText = document.getElementById('setPasswordMessageText');
const passwordOptions = document.getElementById('passwordOptions');

const profileFirstName = document.getElementById('profileFirstName');
const profileLastName = document.getElementById('profileLastName');
const profileGender = document.getElementById('profileGender');
const profileBio = document.getElementById('profileBio');
const profileAvatar = document.getElementById('profileAvatar');
const profileAvatarInput = document.getElementById('profileAvatarInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const profileMessage = document.getElementById('profileMessage');
const profileMessageText = document.getElementById('profileMessageText');
const showPasswordBtn = document.getElementById('showPasswordBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const twoFactorToggle = document.getElementById('twoFactorToggle');

const chatAvatar = document.getElementById('chatAvatar');
const chatUserName = document.getElementById('chatUserName');
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
const blockUserBtn = document.getElementById('blockUserBtn');

const passwordModal = document.getElementById('passwordModal');
const passwordModalClose = document.getElementById('passwordModalClose');
const passwordModalCode = document.getElementById('passwordModalCode');
const passwordModalConfirm = document.getElementById('passwordModalConfirm');
const passwordModalResult = document.getElementById('passwordModalResult');

// ============================================================
// 1. АВТОРИЗАЦИЯ
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

loginPasswordBtn.addEventListener('click', () => {
    const email = loginEmail.value.trim();
    const pass = loginPassword.value.trim();
    if (!email || !pass) {
        showLoginMessage('Введите email и пароль.', false);
        return;
    }
    loginPasswordBtn.disabled = true;
    loginPasswordBtn.innerHTML = '<div class="spinner"></div>';

    auth.signInWithEmailAndPassword(email, pass)
        .then(userCred => {
            const uid = userCred.user.uid;
            return db.ref('users/' + uid + '/twoFactorEnabled').once('value')
                .then(snapshot => {
                    const twoFactor = snapshot.val() || false;
                    if (twoFactor) {
                        return send2FACode(email)
                            .then(() => {
                                const code = prompt('Введите код из письма для 2FA:');
                                if (!code) {
                                    auth.signOut();
                                    showLoginMessage('Вход отменён.', false);
                                    return;
                                }
                                return verify2FACode(email, code)
                                    .then(valid => {
                                        if (valid) {
                                            showLoginMessage('✅ Вход выполнен!', true);
                                        } else {
                                            auth.signOut();
                                            showLoginMessage('Неверный код.', false);
                                        }
                                    });
                            });
                    } else {
                        showLoginMessage('✅ Вход выполнен!', true);
                    }
                });
        })
        .catch(err => {
            showLoginMessage('Ошибка: ' + err.message, false);
        })
        .finally(() => {
            loginPasswordBtn.disabled = false;
            loginPasswordBtn.innerHTML = 'Войти';
        });
});

sendCodeLoginBtn.addEventListener('click', () => {
    const email = codeLoginEmail.value.trim();
    if (!email || !email.includes('@')) {
        showCodeLoginMessage('Введите корректный email.', false);
        return;
    }
    currentEmail = email;
    const url = `${FIREBASE_DB_URL}/emailQueue.json`;
    const data = { email, status: 'pending', timestamp: Date.now() };
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => {
        if (!res.ok) throw new Error('Ошибка отправки');
        return res.json();
    })
    .then(() => {
        showCodeLoginMessage('Код отправлен на почту!', true);
        codeLoginStep2.style.display = 'block';
    })
    .catch(err => {
        showCodeLoginMessage('Ошибка: ' + err.message, false);
    });
});

verifyCodeLoginBtn.addEventListener('click', () => {
    const code = codeLoginInput.value.trim();
    if (!code || code.length !== 6) {
        showCodeLoginMessage('Введите 6-значный код.', false);
        return;
    }
    const emailKey = currentEmail.replace(/\./g, '_');
    const url = `${FIREBASE_DB_URL}/codes/${emailKey}.json`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data || data.code !== code || Date.now() - data.createdAt > 10*60*1000) {
                showCodeLoginMessage('Неверный или истёкший код.', false);
                return;
            }
            fetch(url, { method: 'DELETE' }).catch(() => {});
            db.ref('users').orderByChild('email').equalTo(currentEmail).once('value')
                .then(snapshot => {
                    const userData = snapshot.val();
                    if (!userData) throw new Error('Пользователь не найден');
                    const uid = Object.keys(userData)[0];
                    const savedPassword = userData[uid].password;
                    if (!savedPassword) throw new Error('Пароль не сохранён');
                    return auth.signInWithEmailAndPassword(currentEmail, savedPassword);
                })
                .then(() => {
                    showCodeLoginMessage('✅ Вход выполнен!', true);
                })
                .catch(err => {
                    showCodeLoginMessage('Ошибка: ' + err.message, false);
                });
        })
        .catch(err => {
            showCodeLoginMessage('Ошибка: ' + err.message, false);
        });
});

resetPasswordBtn.addEventListener('click', () => {
    const email = loginEmail.value.trim();
    if (!email || !email.includes('@')) {
        showLoginMessage('Введите email для сброса.', false);
        return;
    }
    auth.sendPasswordResetEmail(email)
        .then(() => {
            showLoginMessage('Ссылка для сброса отправлена на почту.', true);
        })
        .catch(err => {
            showLoginMessage('Ошибка: ' + err.message, false);
        });
});

// ============================================================
// 2. УСТАНОВКА ПАРОЛЯ
// ============================================================
function showSetPassword(user) {
    authBox.style.display = 'none';
    profileBox.style.display = 'none';
    chatBox.style.display = 'none';
    setPasswordBox.style.display = 'flex';
    tempUserForPassword = user;
    generatePasswordOptions();
}

function generatePasswordOptions() {
    const options = [];
    for (let i = 0; i < 3; i++) {
        options.push(generateStrongPassword());
    }
    passwordOptions.innerHTML = '';
    options.forEach(pwd => {
        const btn = document.createElement('button');
        btn.textContent = pwd;
        btn.dataset.password = pwd;
        btn.addEventListener('click', function() {
            document.querySelectorAll('.password-generator .options button').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            newPassword.value = this.dataset.password;
            confirmPassword.value = this.dataset.password;
        });
        passwordOptions.appendChild(btn);
    });
}

function generateStrongPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let pwd = '';
    for (let i = 0; i < 14; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
}

setPasswordBtn.addEventListener('click', () => {
    const pwd = newPassword.value.trim();
    const confirm = confirmPassword.value.trim();
    if (!pwd || pwd.length < 6) {
        showSetPasswordMessage('Пароль должен быть не менее 6 символов.', false);
        return;
    }
    if (pwd !== confirm) {
        showSetPasswordMessage('Пароли не совпадают.', false);
        return;
    }
    setPasswordBtn.disabled = true;
    setPasswordBtn.innerHTML = '<div class="spinner"></div>';

    const user = tempUserForPassword;
    if (!user) {
        showSetPasswordMessage('Ошибка: пользователь не найден.', false);
        setPasswordBtn.disabled = false;
        setPasswordBtn.innerHTML = 'Сохранить пароль';
        return;
    }
    user.updatePassword(pwd)
        .then(() => {
            return db.ref('users/' + user.uid + '/password').set(pwd);
        })
        .then(() => {
            showSetPasswordMessage('Пароль установлен! ✅', true);
            setTimeout(() => {
                setPasswordBox.style.display = 'none';
                showChat();
            }, 1000);
        })
        .catch(err => {
            showSetPasswordMessage('Ошибка: ' + err.message, false);
        })
        .finally(() => {
            setPasswordBtn.disabled = false;
            setPasswordBtn.innerHTML = 'Сохранить пароль';
        });
});

// ============================================================
// 3. ПРОФИЛЬ
// ============================================================
function openProfile() {
    chatBox.style.display = 'none';
    profileBox.style.display = 'flex';
    if (currentUserProfile) {
        profileFirstName.value = currentUserProfile.firstName || '';
        profileLastName.value = currentUserProfile.lastName || '';
        profileGender.value = currentUserProfile.gender || 'Секрет';
        profileBio.value = currentUserProfile.bio || '';
        if (currentUserProfile.avatar) {
            profileAvatar.style.backgroundImage = `url(${currentUserProfile.avatar})`;
            profileAvatar.innerHTML = '';
        } else {
            profileAvatar.style.backgroundImage = '';
            profileAvatar.innerHTML = currentUserProfile.firstName ? currentUserProfile.firstName.charAt(0).toUpperCase() : '👤';
        }
        twoFactorToggle.checked = currentUserProfile.twoFactorEnabled || false;
    }
}

function closeProfile() {
    profileBox.style.display = 'none';
    chatBox.style.display = 'flex';
}

saveProfileBtn.addEventListener('click', () => {
    const name = profileFirstName.value.trim();
    if (!name) {
        showProfileMessage('Имя обязательно.', false);
        return;
    }
    const updates = {
        firstName: name,
        lastName: profileLastName.value.trim() || '',
        gender: profileGender.value || 'Секрет',
        bio: profileBio.value.trim() || '',
        twoFactorEnabled: twoFactorToggle.checked,
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

showPasswordBtn.addEventListener('click', () => {
    passwordModal.style.display = 'flex';
    passwordModalResult.textContent = '';
    passwordModalCode.value = '';
    const email = currentUser.email;
    const url = `${FIREBASE_DB_URL}/emailQueue.json`;
    const data = { email, status: 'pending', timestamp: Date.now() };
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => {
        if (!res.ok) throw new Error('Ошибка отправки');
        return res.json();
    })
    .then(() => {
        alert('Код отправлен на вашу почту.');
    })
    .catch(err => alert('Ошибка: ' + err.message));
});

passwordModalConfirm.addEventListener('click', () => {
    const code = passwordModalCode.value.trim();
    if (!code || code.length !== 6) {
        alert('Введите 6-значный код.');
        return;
    }
    const emailKey = currentUser.email.replace(/\./g, '_');
    const url = `${FIREBASE_DB_URL}/codes/${emailKey}.json`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data || data.code !== code || Date.now() - data.createdAt > 10*60*1000) {
                alert('Неверный или истёкший код.');
                return;
            }
            fetch(url, { method: 'DELETE' }).catch(() => {});
            db.ref('users/' + currentUser.uid + '/password').once('value')
                .then(snapshot => {
                    const pwd = snapshot.val();
                    if (pwd) {
                        passwordModalResult.textContent = pwd;
                        passwordModalResult.style.color = '#4ade80';
                        setTimeout(() => { passwordModalResult.textContent = ''; }, 10000);
                    } else {
                        passwordModalResult.textContent = 'Пароль не найден.';
                        passwordModalResult.style.color = '#f5576c';
                    }
                });
        })
        .catch(err => alert('Ошибка: ' + err.message));
});

passwordModalClose.addEventListener('click', () => {
    passwordModal.style.display = 'none';
});

changePasswordBtn.addEventListener('click', () => {
    const newPwd = prompt('Введите новый пароль (мин. 6 символов):');
    if (!newPwd || newPwd.length < 6) {
        alert('Пароль должен быть не менее 6 символов.');
        return;
    }
    const confirmPwd = prompt('Повторите пароль:');
    if (newPwd !== confirmPwd) {
        alert('Пароли не совпадают.');
        return;
    }
    const email = currentUser.email;
    const url = `${FIREBASE_DB_URL}/emailQueue.json`;
    const data = { email, status: 'pending', timestamp: Date.now() };
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => {
        if (!res.ok) throw new Error('Ошибка отправки');
        return res.json();
    })
    .then(() => {
        const code = prompt('Код отправлен на почту. Введите его:');
        if (!code || code.length !== 6) {
            alert('Неверный код.');
            return;
        }
        const emailKey = email.replace(/\./g, '_');
        return fetch(`${FIREBASE_DB_URL}/codes/${emailKey}.json`)
            .then(res => res.json())
            .then(data => {
                if (!data || data.code !== code || Date.now() - data.createdAt > 10*60*1000) {
                    alert('Неверный или истёкший код.');
                    return;
                }
                fetch(`${FIREBASE_DB_URL}/codes/${emailKey}.json`, { method: 'DELETE' }).catch(() => {});
                return currentUser.updatePassword(newPwd)
                    .then(() => {
                        return db.ref('users/' + currentUser.uid + '/password').set(newPwd);
                    })
                    .then(() => {
                        alert('Пароль успешно изменён!');
                    });
            });
    })
    .catch(err => alert('Ошибка: ' + err.message));
});

deleteAccountBtn.addEventListener('click', () => {
    if (!confirm('Вы уверены, что хотите удалить аккаунт? Все данные будут потеряны.')) return;
    const uid = currentUser.uid;
    db.ref('users/' + uid).remove()
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
// 4. ЧАТ
// ============================================================
function showChat() {
    authBox.style.display = 'none';
    profileBox.style.display = 'none';
    chatBox.style.display = 'flex';
    setPasswordBox.style.display = 'none';
    updateChatHeader();
    loadChatList();
}

function updateChatHeader() {
    if (currentUserProfile) {
        const name = (currentUserProfile.firstName || '') + (currentUserProfile.lastName ? ' ' + currentUserProfile.lastName : '');
        chatUserName.innerHTML = (name || 'Пользователь') + `<small>онлайн</small>`;
        const avatar = currentUserProfile.avatar || (currentUserProfile.firstName ? currentUserProfile.firstName.charAt(0).toUpperCase() : 'Z');
        if (avatar && avatar.startsWith('http')) {
            chatAvatar.style.backgroundImage = `url(${avatar})`;
            chatAvatar.style.backgroundSize = 'cover';
            chatAvatar.textContent = '';
        } else {
            chatAvatar.style.backgroundImage = '';
            chatAvatar.textContent = avatar;
        }
    }
}

function loadChatList() {
    const chatsRef = db.ref('chats');
    chatsRef.off();
    chatList.innerHTML = '<div style="color:rgba(255,255,255,0.3); padding:20px; text-align:center;">Загрузка...</div>';
    chatsRef.orderByChild('participants').startAt(currentUser.uid).endAt(currentUser.uid + '\uf8ff')
        .on('value', (snapshot) => {
            const data = snapshot.val();
            chatList.innerHTML = '';
            if (!data) {
                chatList.innerHTML = '<div style="color:rgba(255,255,255,0.3); padding:20px; text-align:center;">Нет чатов. Начните общение!</div>';
                return;
            }
            const chats = Object.entries(data).filter(([id, chat]) => {
                return chat.participants && chat.participants.includes(currentUser.uid);
            });
            if (chats.length === 0) {
                chatList.innerHTML = '<div style="color:rgba(255,255,255,0.3); padding:20px; text-align:center;">Нет чатов. Начните общение!</div>';
                return;
            }
            chats.sort((a, b) => (b[1].lastTimestamp || 0) - (a[1].lastTimestamp || 0));
            chats.forEach(([chatId, chat]) => {
                const partnerUid = chat.participants.find(uid => uid !== currentUser.uid);
                if (!partnerUid) return;
                db.ref('users/' + partnerUid).once('value').then(snap => {
                    const partner = snap.val();
                    if (!partner) return;
                    const div = document.createElement('div');
                    div.className = 'chat-item';
                    const avatarLetter = (partner.avatar && partner.avatar.startsWith('http')) ? '' : (partner.firstName ? partner.firstName.charAt(0).toUpperCase() : '?');
                    div.innerHTML = `
                        <div class="chat-avatar" style="${partner.avatar && partner.avatar.startsWith('http') ? `background-image:url(${partner.avatar}); background-size:cover;` : ''}">${avatarLetter}</div>
                        <div class="chat-info">
                            <div class="chat-name">${partner.firstName} ${partner.lastName || ''}</div>
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
    activeChatName.textContent = partnerData.firstName + ' ' + (partnerData.lastName || '');
    blockUserBtn.style.display = 'inline-block';
    blockUserBtn.onclick = () => {
        if (confirm('Заблокировать пользователя ' + partnerData.firstName + '?')) {
            blockUser(partnerUid);
        }
    };
    loadMessages(chatId);
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
                const letter = (sender.avatar && sender.avatar.startsWith('http')) ? '' : (sender.firstName ? sender.firstName.charAt(0).toUpperCase() : '?');
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
        senderName: (currentUserProfile.firstName || '') + (currentUserProfile.lastName ? ' ' + currentUserProfile.lastName : ''),
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
                senderName: (currentUserProfile.firstName || '') + (currentUserProfile.lastName ? ' ' + currentUserProfile.lastName : ''),
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
});

// ============================================================
// 5. ПОИСК И ЗАЯВКИ
// ============================================================
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;
    db.ref('users').orderByChild('email').startAt(query).endAt(query + '\uf8ff')
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
                    <span>${user.firstName} ${user.lastName || ''} (${user.email})</span>
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
            }).catch(err => {
                showProfileMessage('Ошибка: ' + err.message, false);
            });
        });
}

// ============================================================
// 6. БЛОКИРОВКА
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
// 7. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================
function showLoginMessage(text, success) {
    loginMessage.style.display = 'flex';
    loginMessage.className = 'message show' + (success ? ' success' : '');
    loginMessage.querySelector('.icon').textContent = success ? '✅' : '⚠️';
    loginMessageText.textContent = text;
    setTimeout(() => loginMessage.style.display = 'none', 5000);
}

function showCodeLoginMessage(text, success) {
    codeLoginMessage.style.display = 'flex';
    codeLoginMessage.className = 'message show' + (success ? ' success' : '');
    codeLoginMessage.querySelector('.icon').textContent = success ? '✅' : '⚠️';
    codeLoginMessageText.textContent = text;
    setTimeout(() => codeLoginMessage.style.display = 'none', 5000);
}

function showSetPasswordMessage(text, success) {
    setPasswordMessage.style.display = 'flex';
    setPasswordMessage.className = 'message show' + (success ? ' success' : '');
    setPasswordMessage.querySelector('.icon').textContent = success ? '✅' : '⚠️';
    setPasswordMessageText.textContent = text;
    setTimeout(() => setPasswordMessage.style.display = 'none', 5000);
}

function showProfileMessage(text, success) {
    profileMessage.style.display = 'flex';
    profileMessage.className = 'message show' + (success ? ' success' : '');
    profileMessage.querySelector('.icon').textContent = success ? '✅' : '⚠️';
    profileMessageText.textContent = text;
    setTimeout(() => profileMessage.style.display = 'none', 5000);
}

function send2FACode(email) {
    const url = `${FIREBASE_DB_URL}/emailQueue.json`;
    const data = { email, status: 'pending', timestamp: Date.now() };
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json());
}

function verify2FACode(email, code) {
    const emailKey = email.replace(/\./g, '_');
    const url = `${FIREBASE_DB_URL}/codes/${emailKey}.json`;
    return fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data || data.code !== code || Date.now() - data.createdAt > 10*60*1000) {
                return false;
            }
            fetch(url, { method: 'DELETE' }).catch(() => {});
            return true;
        });
}

// ============================================================
// 8. СОСТОЯНИЕ АВТОРИЗАЦИИ
// ============================================================
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        db.ref('users/' + user.uid).once('value')
            .then(snapshot => {
                const data = snapshot.val();
                if (data) {
                    currentUserProfile = data;
                    if (!data.password) {
                        showSetPassword(user);
                    } else {
                        showChat();
                    }
                } else {
                    showSetPassword(user);
                }
            })
            .catch(() => {
                showSetPassword(user);
            });
    } else {
        authBox.style.display = 'flex';
        profileBox.style.display = 'none';
        chatBox.style.display = 'none';
        setPasswordBox.style.display = 'none';
        if (messagesListener) messagesListener.off();
        currentUser = null;
        currentUserProfile = null;
    }
});

// ============================================================
// 9. ВЫХОД
// ============================================================
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

settingsBtn.addEventListener('click', openProfile);
