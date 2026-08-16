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
// DOM-ЭЛЕМЕНТЫ (ВСЕ)
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
// 1-8. АВТОРИЗАЦИЯ, ПРОФИЛЬ, ЧАТ (без изменений)
// ============================================================
// ... (весь ваш код до функции заявок) ...
// Чтобы не дублировать 1000 строк, я предполагаю, что у вас уже есть рабочий код до этого момента.
// Я дам только новые функции заявок, которые нужно вставить вместо старых.

// ============================================================
// 9. ЗАПРОСЫ (ПЕРЕПИСАННЫЕ)
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

async function loadRequests() {
    if (!currentUser) return;
    const list = document.getElementById('requestsList');
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

        // Входящие
        if (incomingPending.length === 0) {
            html += `<div style="color:rgba(255,255,255,0.4); text-align:center; padding:20px;">Нет входящих заявок</div>`;
        } else {
            const results = await Promise.all(incomingPending.map(async ([key, req]) => {
                const snap = await db.ref('users/' + req.from).once('value');
                const user = snap.val();
                return { key, req, user };
            }));
            results.forEach(({ key, req, user }) => {
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
            });
        }

        html += `</div><div id="outgoingList" style="display:none; max-height:300px; overflow-y:auto;">`;

        // Исходящие
        if (outgoingPending.length === 0) {
            html += `<div style="color:rgba(255,255,255,0.4); text-align:center; padding:20px;">Нет исходящих заявок</div>`;
        } else {
            const results = await Promise.all(outgoingPending.map(async ([key, req]) => {
                const snap = await db.ref('users/' + req.to).once('value');
                const user = snap.val();
                return { key, req, user };
            }));
            results.forEach(({ key, req, user }) => {
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
            });
        }

        html += `</div></div>`;
        list.innerHTML = html;

        // Добавляем обработчики
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

        // Переключение вкладок
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
        console.error('Ошибка загрузки заявок:', err);
        list.innerHTML = `<div style="color:red; padding:10px;">Ошибка загрузки: ${err.message}</div>`;
    }
}

function acceptRequest(key, friendUid) {
    console.log('✅ Принимаем заявку:', key, 'от пользователя:', friendUid);
    const chatId = [currentUser.uid, friendUid].sort().join('_');
    const chatRef = db.ref('chats/' + chatId);
    chatRef.set({
        participants: [currentUser.uid, friendUid],
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
        // Обновляем бейдж
        updateRequestsBadge();
        // Закрываем модалку
        requestsModal.classList.remove('show');
        // Обновляем список чатов
        loadChatList();
        // Получаем данные партнёра для открытия чата
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
// 10-14. ОСТАЛЬНЫЕ ФУНКЦИИ (БЕЗ ИЗМЕНЕНИЙ)
// ============================================================
// Здесь должны быть функции блокировки, вспомогательные, звонки, состояние авторизации, выход.
// Так как они уже были в вашем коде, я их не повторяю.
// Если у вас нет остальных функций, просто скопируйте их из предыдущего полного файла.

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
    auth.signOut();
});

settingsBtn.addEventListener('click', openProfile);

console.log('✅ ZING app.js загружен и готов к работе!');
