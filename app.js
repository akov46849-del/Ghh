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

const FIREBASE_DB_URL = 'https://zing-4a547-default-rtdb.europe-west1.firebasedatabase.app';

// ============================================================
// DOM-ЭЛЕМЕНТЫ
// ============================================================
const authBox = document.getElementById('authBox');
const profileBox = document.getElementById('profileBox');
const chatBox = document.getElementById('chatBox');

const emailInput = document.getElementById('emailInput');
const sendCodeBtn = document.getElementById('sendCodeBtn');
const btnText = document.getElementById('btnText');
const spinner = document.getElementById('spinner');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const codeInput = document.getElementById('codeInput');
const verifyCodeBtn = document.getElementById('verifyCodeBtn');
const resendCodeBtn = document.getElementById('resendCodeBtn');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');
const codeMessage = document.getElementById('codeMessage');
const codeMessageText = document.getElementById('codeMessageText');
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');

const firstName = document.getElementById('firstName');
const lastName = document.getElementById('lastName');
const gender = document.getElementById('gender');
const bio = document.getElementById('bio');
const avatarUrl = document.getElementById('avatarUrl');
const avatarPreview = document.getElementById('avatarPreview');
const profileAvatar = document.getElementById('profileAvatar');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const profileMessage = document.getElementById('profileMessage');
const profileMessageText = document.getElementById('profileMessageText');

const chatAvatar = document.getElementById('chatAvatar');
const chatUserName = document.getElementById('chatUserName');
const logoutBtn = document.getElementById('logoutBtn');

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

// ============================================================
// 1. АВТОРИЗАЦИЯ
// ============================================================

// --- Отправка кода ---
sendCodeBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    if (!email || !email.includes('@')) {
        showMessage('Введите корректный email.', false);
        return;
    }
    currentEmail = email;
    sendCodeBtn.disabled = true;
    btnText.textContent = 'Отправка...';
    spinner.style.display = 'inline-block';
    messageBox.classList.remove('show');

    const url = `${FIREBASE_DB_URL}/emailQueue.json`;
    const data = { email, status: 'pending', timestamp: Date.now() };

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
    })
    .then(() => {
        btnText.textContent = 'Отправлено! ✅';
        spinner.style.display = 'none';
        sendCodeBtn.disabled = false;
        showMessage('Код отправлен на вашу почту! Проверьте ящик.', true);
        step1.style.display = 'none';
        step2.style.display = 'block';
        setTimeout(() => { btnText.textContent = 'Отправить код'; }, 3000);
    })
    .catch(err => {
        btnText.textContent = 'Отправить код';
        spinner.style.display = 'none';
        sendCodeBtn.disabled = false;
        showMessage('Ошибка: ' + err.message, false);
    });
});

// --- Проверка кода (ИСПРАВЛЕННАЯ ЛОГИКА) ---
verifyCodeBtn.addEventListener('click', () => {
    const code = codeInput.value.trim();
    if (!code || code.length !== 6) {
        showCodeMessage('Введите 6-значный код.', false);
        return;
    }

    const emailKey = currentEmail.replace(/\./g, '_');
    const url = `${FIREBASE_DB_URL}/codes/${emailKey}.json`;

    fetch(url)
    .then(response => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
    })
    .then(data => {
        if (!data) {
            showCodeMessage('Код не найден. Запросите новый.', false);
            return;
        }
        const storedCode = data.code;
        const createdAt = data.createdAt;
        const now = Date.now();
        const tenMinutes = 10 * 60 * 1000;

        if (now - createdAt > tenMinutes) {
            showCodeMessage('Код истёк. Запросите новый.', false);
            return;
        }
        if (storedCode !== code) {
            showCodeMessage('Неверный код. Попробуйте снова.', false);
            return;
        }

        // Удаляем код
        fetch(url, { method: 'DELETE' }).catch(() => {});

        // ========== ИСПРАВЛЕННАЯ ЛОГИКА ВХОДА (TRY/CATCH) ==========
        const tempPassword = Math.random().toString(36).slice(-8);

        // Пытаемся создать пользователя
        auth.createUserWithEmailAndPassword(currentEmail, tempPassword)
            .then(userCred => {
                // Успешно создан новый пользователь
                const uid = userCred.user.uid;
                return db.ref('users/' + uid + '/password').set(tempPassword)
                    .then(() => userCred);
            })
            .then(() => {
                showCodeMessage('✅ Вход выполнен!', true);
            })
            .catch(err => {
                if (err.code === 'auth/email-already-in-use') {
                    // Пользователь уже существует – ищем пароль в базе
                    db.ref('users').orderByChild('email').equalTo(currentEmail).once('value')
                        .then(snapshot => {
                            const userData = snapshot.val();
                            if (!userData) throw new Error('Пользователь не найден в базе');
                            const uid = Object.keys(userData)[0];
                            const savedPassword = userData[uid].password;
                            if (!savedPassword) {
                                // Пароль не сохранён – создаём новый
                                const newPass = Math.random().toString(36).slice(-8);
                                return db.ref('users/' + uid + '/password').set(newPass)
                                    .then(() => auth.signInWithEmailAndPassword(currentEmail, newPass));
                            } else {
                                return auth.signInWithEmailAndPassword(currentEmail, savedPassword);
                            }
                        })
                        .then(() => {
                            showCodeMessage('✅ Вход выполнен!', true);
                        })
                        .catch(loginErr => {
                            showCodeMessage('Ошибка входа: ' + loginErr.message, false);
                        });
                } else {
                    // Другая ошибка
                    showCodeMessage('Ошибка: ' + err.message, false);
                }
            });
    })
    .catch(err => {
        showCodeMessage('Ошибка: ' + err.message, false);
    });
});

// --- Повторная отправка ---
resendCodeBtn.addEventListener('click', () => {
    const emailKey = currentEmail.replace(/\./g, '_');
    fetch(`${FIREBASE_DB_URL}/codes/${emailKey}.json`, { method: 'DELETE' }).catch(() => {});
    const url = `${FIREBASE_DB_URL}/emailQueue.json`;
    const data = { email: currentEmail, status: 'pending', timestamp: Date.now() };
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
    })
    .then(() => {
        showCodeMessage('Новый код отправлен!', true);
        codeInput.value = '';
    })
    .catch(err => {
        showCodeMessage('Ошибка: ' + err.message, false);
    });
});

// --- Сброс пароля ---
resetPasswordBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    if (!email || !email.includes('@')) {
        showMessage('Введите email для сброса пароля.', false);
        return;
    }
    auth.sendPasswordResetEmail(email)
        .then(() => {
            showMessage('Ссылка для сброса пароля отправлена на вашу почту.', true);
        })
        .catch(err => {
            showMessage('Ошибка: ' + err.message, false);
        });
});

// --- Удаление аккаунта ---
deleteAccountBtn.addEventListener('click', () => {
    if (!confirm('Вы уверены, что хотите удалить аккаунт? Все данные будут потеряны.')) return;
    const uid = currentUser.uid;
    db.ref('users/' + uid).remove()
        .then(() => currentUser.delete())
        .then(() => {
            showProfileMessage('Аккаунт удалён.', true);
            setTimeout(() => { location.reload(); }, 2000);
        })
        .catch(err => {
            showProfileMessage('Ошибка: ' + err.message, false);
        });
});

// ============================================================
// 2. ПРОФИЛЬ
// ============================================================
function showProfileForm() {
    authBox.style.display = 'none';
    profileBox.style.display = 'block';
    chatBox.style.display = 'none';
    if (currentUser && currentUser.email) {
        const name = currentUser.email.split('@')[0];
        firstName.value = name;
    }
    avatarUrl.addEventListener('input', updateAvatarPreview);
    updateAvatarPreview();
}

function updateAvatarPreview() {
    const url = avatarUrl.value.trim();
    if (url) {
        avatarPreview.innerHTML = `<img src="${url}" alt="avatar">`;
        profileAvatar.innerHTML = `<img src="${url}" alt="avatar" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
        avatarPreview.innerHTML = `<i class="fas fa-user"></i>`;
        profileAvatar.innerHTML = '👤';
    }
}

saveProfileBtn.addEventListener('click', () => {
    const name = firstName.value.trim();
    if (!name) {
        showProfileMessage('Имя обязательно для заполнения', false);
        return;
    }
    const profile = {
        firstName: name,
        lastName: lastName.value.trim() || '',
        gender: gender.value || 'Секрет',
        bio: bio.value.trim() || '',
        avatar: avatarUrl.value.trim() || '',
        email: currentUser.email,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        blocked: []
    };

    saveProfileBtn.disabled = true;
    saveProfileBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;"></div> Сохранение...';

    db.ref('users/' + currentUser.uid).set(profile)
        .then(() => {
            currentUserProfile = profile;
            showProfileMessage('Профиль сохранён! ✅', true);
            saveProfileBtn.innerHTML = '<i class="fas fa-check"></i> Сохранить профиль';
            saveProfileBtn.disabled = false;
            setTimeout(() => showChat(), 800);
        })
        .catch(err => {
            showProfileMessage('Ошибка: ' + err.message, false);
            saveProfileBtn.innerHTML = '<i class="fas fa-check"></i> Сохранить профиль';
            saveProfileBtn.disabled = false;
        });
});

function showProfileMessage(text, success = true) {
    profileMessage.style.display = 'flex';
    profileMessage.className = 'message show';
    if (success) {
        profileMessage.classList.add('success');
        profileMessage.querySelector('.icon').textContent = '✅';
    } else {
        profileMessage.classList.remove('success');
        profileMessage.querySelector('.icon').textContent = '⚠️';
    }
    profileMessageText.textContent = text;
    setTimeout(() => { profileMessage.style.display = 'none'; }, 4000);
}

// ============================================================
// 3. ЧАТ
// ============================================================
function showChat() {
    authBox.style.display = 'none';
    profileBox.style.display = 'none';
    chatBox.style.display = 'block';

    if (currentUserProfile) {
        const name = currentUserProfile.firstName + (currentUserProfile.lastName ? ' ' + currentUserProfile.lastName : '');
        chatUserName.innerHTML = name + `<small>онлайн</small>`;
        const avatar = currentUserProfile.avatar || currentUserProfile.firstName.charAt(0).toUpperCase();
        if (avatar.startsWith('http')) {
            chatAvatar.style.backgroundImage = `url(${avatar})`;
            chatAvatar.style.backgroundSize = 'cover';
            chatAvatar.textContent = '';
        } else {
            chatAvatar.textContent = avatar;
        }
    }
    loadChatList();
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
        senderName: currentUserProfile.firstName + ' ' + (currentUserProfile.lastName || ''),
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
                senderName: currentUserProfile.firstName + ' ' + (currentUserProfile.lastName || ''),
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
// 4. ПОИСК И ЗАЯВКИ
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
                    showCodeMessage('Заявка уже отправлена.', false);
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
                showCodeMessage('Заявка отправлена!', true);
                searchResults.style.display = 'none';
            }).catch(err => {
                showCodeMessage('Ошибка: ' + err.message, false);
            });
        });
}

// ============================================================
// 5. БЛОКИРОВКА
// ============================================================
function blockUser(uid) {
    const blockedList = currentUserProfile.blocked || [];
    if (blockedList.includes(uid)) {
        showCodeMessage('Пользователь уже заблокирован.', false);
        return;
    }
    blockedList.push(uid);
    db.ref('users/' + currentUser.uid + '/blocked').set(blockedList)
        .then(() => {
            currentUserProfile.blocked = blockedList;
            showCodeMessage('Пользователь заблокирован.', true);
            backToChatList.click();
        })
        .catch(err => {
            showCodeMessage('Ошибка: ' + err.message, false);
        });
}

// ============================================================
// 6. ВСПОМОГАТЕЛЬНЫЕ
// ============================================================
function showMessage(text, isSuccess = true) {
    messageBox.className = 'message show';
    if (isSuccess) {
        messageBox.classList.add('success');
        messageBox.querySelector('.icon').textContent = '✅';
    } else {
        messageBox.classList.remove('success');
        messageBox.querySelector('.icon').textContent = '⚠️';
    }
    messageText.textContent = text;
    setTimeout(() => { messageBox.classList.remove('show'); }, 5000);
}

function showCodeMessage(text, success = true) {
    codeMessage.style.display = 'flex';
    if (success) {
        codeMessage.classList.add('success');
        codeMessage.querySelector('.icon').textContent = '✅';
    } else {
        codeMessage.classList.remove('success');
        codeMessage.querySelector('.icon').textContent = '⚠️';
    }
    codeMessageText.textContent = text;
    setTimeout(() => { codeMessage.style.display = 'none'; }, 5000);
}

// ============================================================
// 7. ВЫХОД
// ============================================================
logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        if (messagesListener) {
            messagesListener.off();
            messagesListener = null;
        }
        currentUser = null;
        currentUserProfile = null;
        authBox.style.display = 'block';
        profileBox.style.display = 'none';
        chatBox.style.display = 'none';
        searchResults.style.display = 'none';
        chatList.innerHTML = '';
        messagesContainer.innerHTML = '';
        activeChat.style.display = 'none';
        chatList.style.display = 'block';
        document.getElementById('searchBox').style.display = 'flex';
        emailInput.value = '';
        step1.style.display = 'block';
        step2.style.display = 'none';
        codeInput.value = '';
    });
});

// ============================================================
// 8. СОСТОЯНИЕ АВТОРИЗАЦИИ
// ============================================================
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        db.ref('users/' + user.uid).once('value')
            .then((snapshot) => {
                const data = snapshot.val();
                if (data) {
                    currentUserProfile = data;
                    showChat();
                } else {
                    showProfileForm();
                }
            })
            .catch(() => {
                showProfileForm();
            });
    } else {
        currentUser = null;
        currentUserProfile = null;
        authBox.style.display = 'block';
        profileBox.style.display = 'none';
        chatBox.style.display = 'none';
        if (messagesListener) {
            messagesListener.off();
            messagesListener = null;
        }
        step1.style.display = 'block';
        step2.style.display = 'none';
    }
});
