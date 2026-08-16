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
let statusListener = null; // будет хранить функцию отмены
let typingListener = null; // функция отмены
let typingTimeout = null;
let friendRequestsListener = null;
let chatListListener = null;

const FIREBASE_DB_URL = 'https://zing-4a547-default-rtdb.europe-west1.firebasedatabase.app';

// ============================================================
// DOM-ЭЛЕМЕНТЫ (все)
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

const registerEmail = document.getElementById('registerEmail');
const sendCodeRegisterBtn = document.getElementById('sendCodeRegisterBtn');
const registerStep2 = document.getElementById('registerStep2');
const registerCodeInput = document.getElementById('registerCodeInput');
const verifyRegisterBtn = document.getElementById('verifyRegisterBtn');
const registerMessage = document.getElementById('registerMessage');
const registerMessageText = document.getElementById('registerMessageText');

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
const chatStatus = document.getElementById('chatStatus');
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

// ============================================================
// 1. АВТОРИЗАЦИЯ (вкладки)
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
// 2. ВХОД ПО ПАРОЛЮ
// ============================================================
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
// 3. ВХОД ПО КОДУ
// ============================================================
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
                    if (!userData) {
                        showCodeLoginMessage('Пользователь не найден. Зарегистрируйтесь.', false);
                        return;
                    }
                    const uid = Object.keys(userData)[0];
                    const savedPassword = userData[uid].password;
                    if (!savedPassword) {
                        showCodeLoginMessage('Пароль не сохранён. Используйте сброс.', false);
                        return;
                    }
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

// ============================================================
// 4. РЕГИСТРАЦИЯ
// ============================================================
sendCodeRegisterBtn.addEventListener('click', () => {
    const email = registerEmail.value.trim();
    if (!email || !email.includes('@')) {
        showRegisterMessage('Введите корректный email.', false);
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
        showRegisterMessage('Код отправлен на почту!', true);
        registerStep2.style.display = 'block';
    })
    .catch(err => {
        showRegisterMessage('Ошибка: ' + err.message, false);
    });
});

verifyRegisterBtn.addEventListener('click', () => {
    const code = registerCodeInput.value.trim();
    if (!code || code.length !== 6) {
        showRegisterMessage('Введите 6-значный код.', false);
        return;
    }
    const emailKey = currentEmail.replace(/\./g, '_');
    const url = `${FIREBASE_DB_URL}/codes/${emailKey}.json`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data || data.code !== code || Date.now() - data.createdAt > 10*60*1000) {
                showRegisterMessage('Неверный или истёкший код.', false);
                return;
            }
            fetch(url, { method: 'DELETE' }).catch(() => {});
            auth.fetchSignInMethodsForEmail(currentEmail)
                .then(methods => {
                    if (methods.length > 0) {
                        showRegisterMessage('Этот email уже зарегистрирован. Войдите по паролю.', false);
                        return;
                    }
                    const tempPassword = Math.random().toString(36).slice(-8);
                    return auth.createUserWithEmailAndPassword(currentEmail, tempPassword)
                        .then(userCred => {
                            tempUserForPassword = userCred.user;
                            showSetPassword(userCred.user);
                        });
                })
                .catch(err => {
                    showRegisterMessage('Ошибка: ' + err.message, false);
                });
        })
        .catch(err => {
            showRegisterMessage('Ошибка: ' + err.message, false);
        });
});

// ============================================================
// 5. УСТАНОВКА ПАРОЛЯ
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
            return db.ref('users/' + user.uid).update({
                firstName: currentEmail.split('@')[0] || 'User',
                email: currentEmail,
                createdAt: Date.now()
            });
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
// 6. ПРОФИЛЬ
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
// 7. ЧАТ (с поддержкой статуса и печатания, исправлены слушатели)
// ============================================================
function showChat() {
    authBox.style.display = 'none';
    profileBox.style.display = 'none';
    chatBox.style.display = 'flex';
    setPasswordBox.style.display = 'none';
    updateChatHeader();
    loadChatList();
    updateRequestsBadge();
    listenForFriendRequests();
    setUserStatus(currentUser.uid, true);
}

function updateChatHeader() {
    if (currentUserProfile) {
        const name = (currentUserProfile.firstName || '') + (currentUserProfile.lastName ? ' ' + currentUserProfile.lastName : '');
        chatUserName.innerHTML = (name || 'Пользователь') + `<small id="chatStatus" class="chat-status">онлайн</small>`;
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

// ===== Статус пользователя =====
function setUserStatus(uid, online) {
    const updates = {
        online: online,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    };
    db.ref('users/' + uid + '/status').update(updates)
        .catch(err => console.error('Ошибка обновления статуса:', err));
}

// Слушаем статус собеседника (исправлено)
function listenPartnerStatus(partnerUid) {
    if (statusListener) {
        // Если statusListener – функция отмены, вызываем её
        if (typeof statusListener === 'function') {
            statusListener();
        }
        statusListener = null;
    }
    const statusRef = db.ref('users/' + partnerUid + '/status');
    statusListener = statusRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        updatePartnerStatusUI(data);
    });
}

function updatePartnerStatusUI(data) {
    const statusEl = document.getElementById('chatStatus');
    if (!statusEl) return;
    if (data.online) {
        statusEl.textContent = 'онлайн';
        statusEl.className = 'chat-status online';
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
            statusEl.textContent = text;
            statusEl.className = 'chat-status';
        } else {
            statusEl.textContent = 'не в сети';
            statusEl.className = 'chat-status';
        }
    }
}

// ===== Индикатор «печатает» (исправлено) =====
function listenTyping(chatId) {
    if (typingListener) {
        if (typeof typingListener === 'function') {
            typingListener();
        }
        typingListener = null;
    }
    const typingRef = db.ref('chats/' + chatId + '/typing');
    typingListener = typingRef.on('value', (snapshot) => {
        const typingData = snapshot.val();
        const statusEl = document.getElementById('chatStatus');
        if (!statusEl) return;
        if (typingData && typingData.uid !== currentUser.uid && typingData.isTyping) {
            statusEl.textContent = 'печатает...';
            statusEl.className = 'chat-status typing';
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

// ===== Загрузка списка чатов =====
function loadChatList() {
    if (chatListListener) {
        if (typeof chatListListener === 'function') {
            chatListListener();
        }
        chatListListener = null;
    }
    const chatsRef = db.ref('chats');
    chatListListener = chatsRef.on('value', (snapshot) => {
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

// ===== Открытие чата =====
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
    callBtn.style.display = 'inline-block';
    callBtn.onclick = () => startCall(partnerUid, partnerData.firstName);

    listenPartnerStatus(partnerUid);
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

// ===== Загрузка сообщений =====
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

// ===== Отправка сообщения =====
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

// ===== Возврат в список чатов (с принудительным обновлением) =====
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
    // Снимаем слушатели статуса и печатания
    if (statusListener) {
        if (typeof statusListener === 'function') statusListener();
        statusListener = null;
    }
    if (typingListener) {
        if (typeof typingListener === 'function') typingListener();
        typingListener = null;
    }
    // Принудительно обновляем список чатов (он и так обновляется через слушатель, но на всякий случай)
    loadChatList();
});

// ============================================================
// 8. ПОИСК И ЗАЯВКИ
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
// 9. ЗАПРОСЫ (реальное время)
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

// Слушатель для новых входящих заявок
function listenForFriendRequests() {
    if (friendRequestsListener) {
        if (typeof friendRequestsListener === 'function') friendRequestsListener();
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
        console.log('🔍 Загружаем заявки для пользователя:', currentUser.uid);
        const incomingSnap = await db.ref('friendRequests').orderByChild('to').equalTo(currentUser.uid).once('value');
        console.log('📦 Входящие данные:', incomingSnap.val());
        const outgoingSnap = await db.ref('friendRequests').orderByChild('from').equalTo(currentUser.uid).once('value');
        console.log('📦 Исходящие данные:', outgoingSnap.val());

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
                                <div class="name">${user.firstName || 'Пользователь'} ${user.lastName || ''}</div>
                                <div class="email">${user.email || ''}</div>
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
                                <div class="name">${user.firstName || 'Пользователь'} ${user.lastName || ''}</div>
                                <div class="email">${user.email || ''}</div>
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

        console.log('✅ Загрузка заявок завершена');

    } catch (err) {
        console.error('❌ Ошибка загрузки заявок:', err);
        list.innerHTML = `<div style="color:red; padding:10px;">Ошибка загрузки: ${err.message}</div>`;
    }
}

function acceptRequest(key, friendUid) {
    console.log('✅ Принимаем заявку:', key, 'от пользователя:', friendUid);
    const chatId = [currentUser.uid, friendUid].sort().join('_');
    const chatRef = db.ref('chats/' + chatId);
    chatRef.set({
        participants: { [currentUser.uid]: true, [friendUid]: true },
        lastMessage: 'Начните общение!',
        lastTimestamp: Date.now()
    })
    .then(() => {
        console.log('✅ Чат создан, удаляем заявку');
        return db.ref('friendRequests/' + key).remove();
    })
    .then(() => {
        console.log('✅ Заявка удалена');
        showProfileMessage('✅ Заявка принята! Чат создан.', true);
        updateRequestsBadge();
        requestsModal.classList.remove('show');
        // Обновляем список чатов
        loadChatList();
        return db.ref('users/' + friendUid).once('value');
    })
    .then(snapshot => {
        const partner = snapshot.val();
        if (partner) {
            console.log('✅ Открываем чат с:', partner.firstName);
            openChat(chatId, friendUid, partner);
        } else {
            console.warn('⚠️ Партнёр не найден');
        }
    })
    .catch(err => {
        console.error('❌ Ошибка принятия заявки:', err);
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
// 10. БЛОКИРОВКА
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
// 11. ВСПОМОГАТЕЛЬНЫЕ
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

function showRegisterMessage(text, success) {
    registerMessage.style.display = 'flex';
    registerMessage.className = 'message show' + (success ? ' success' : '');
    registerMessage.querySelector('.icon').textContent = success ? '✅' : '⚠️';
    registerMessageText.textContent = text;
    setTimeout(() => registerMessage.style.display = 'none', 5000);
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
        fromName: currentUserProfile.firstName || 'Пользователь',
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
        if (currentUser) {
            setUserStatus(currentUser.uid, false);
        }
        authBox.style.display = 'flex';
        profileBox.style.display = 'none';
        chatBox.style.display = 'none';
        setPasswordBox.style.display = 'none';
        if (messagesListener) messagesListener.off();
        // Отписываемся от всех слушателей
        if (statusListener) { if (typeof statusListener === 'function') statusListener(); statusListener = null; }
        if (typingListener) { if (typeof typingListener === 'function') typingListener(); typingListener = null; }
        if (friendRequestsListener) { if (typeof friendRequestsListener === 'function') friendRequestsListener(); friendRequestsListener = null; }
        if (chatListListener) { if (typeof chatListListener === 'function') chatListListener(); chatListListener = null; }
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
