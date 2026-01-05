// 投票小程序 JavaScript - 支持管理員權限和雲存儲

// Firebase 配置 - 請替換為您的 Firebase 配置
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 初始化 Firebase（如果已配置）
let firebaseApp = null;
let database = null;
let auth = null;

try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        auth = firebase.auth();
    }
} catch (e) {
    console.warn("Firebase 未配置，將使用本地存儲模式");
}

// 全局變量
let votes = [];
let currentVote = null;
let currentUser = null;
let isAdmin = false;

// 管理員密碼（可在這裡修改）
const ADMIN_PASSWORD = "admin123";

// DOM 元素
const loginModal = document.getElementById('loginModal');
const mainContainer = document.getElementById('mainContainer');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const currentUserSpan = document.getElementById('currentUser');
const userRoleSpan = document.getElementById('userRole');
const createTabBtn = document.getElementById('createTabBtn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const createVoteForm = document.getElementById('createVoteForm');
const optionsContainer = document.getElementById('optionsContainer');
const addOptionBtn = document.getElementById('addOption');
const votesList = document.getElementById('votesList');
const voteForm = document.getElementById('voteForm');
const backToListBtn = document.getElementById('backToList');

// 初始化
function init() {
    // 檢查是否已登錄
    const savedUser = localStorage.getItem('currentUser');
    const savedRole = localStorage.getItem('userRole');
    
    if (savedUser && savedRole) {
        currentUser = savedUser;
        isAdmin = savedRole === 'admin';
        showMainApp();
    } else {
        showLoginModal();
    }
    
    // 綁定事件監聽器
    bindEvents();
    
    // 如果已登錄，加載投票數據
    if (currentUser) {
        loadVotes();
    }
}

// 顯示登錄界面
function showLoginModal() {
    loginModal.style.display = 'flex';
    mainContainer.style.display = 'none';
}

// 顯示主應用
function showMainApp() {
    loginModal.style.display = 'none';
    mainContainer.style.display = 'block';
    
    // 更新用戶信息
    currentUserSpan.textContent = currentUser;
    userRoleSpan.textContent = isAdmin ? '管理員' : '普通用戶';
    userRoleSpan.className = `role-badge ${isAdmin ? 'admin' : 'user'}`;
    
    // 根據角色顯示/隱藏創建投票按鈕
    if (isAdmin) {
        createTabBtn.style.display = 'block';
    } else {
        createTabBtn.style.display = 'none';
        // 如果當前在創建頁面，切換到列表頁
        const createTab = document.getElementById('create');
        if (createTab.classList.contains('active')) {
            switchTab('list');
        }
    }
    
    // 渲染投票列表
    renderVotesList();
}

// 綁定事件監聽器
function bindEvents() {
    // 登錄表單提交
    loginForm.addEventListener('submit', handleLogin);
    
    // 登出按鈕
    logoutBtn.addEventListener('click', handleLogout);
    
    // 選項卡切換
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            if (tabId === 'create' && !isAdmin) {
                alert('只有管理員才能創建投票！');
                return;
            }
            switchTab(tabId);
        });
    });
    
    // 添加選項
    addOptionBtn.addEventListener('click', addOption);
    
    // 刪除選項
    optionsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-option')) {
            removeOption(e.target);
        }
    });
    
    // 創建投票表單提交
    createVoteForm.addEventListener('submit', createVote);
    
    // 投票表單提交
    voteForm.addEventListener('submit', submitVote);
    
    // 返回列表
    backToListBtn.addEventListener('click', () => {
        switchTab('list');
    });
}

// 處理登錄
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const isAdminLogin = document.getElementById('isAdmin').checked;
    
    if (!username) {
        alert('請輸入用戶名');
        return;
    }
    
    // 如果是管理員登錄，驗證密碼
    if (isAdminLogin) {
        if (!password) {
            alert('管理員登錄需要輸入密碼！');
            return;
        }
        if (password !== ADMIN_PASSWORD) {
            alert('管理員密碼錯誤！');
            return;
        }
        isAdmin = true;
    } else {
        // 普通用戶不需要密碼
        isAdmin = false;
    }
    
    currentUser = username;
    
    // 保存登錄狀態
    localStorage.setItem('currentUser', currentUser);
    localStorage.setItem('userRole', isAdmin ? 'admin' : 'user');
    
    // 顯示主應用
    showMainApp();
    
    // 加載投票數據
    loadVotes();
}

// 處理登出
function handleLogout() {
    if (confirm('確定要登出嗎？')) {
        currentUser = null;
        isAdmin = false;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        showLoginModal();
        loginForm.reset();
    }
}

// 切換選項卡
function switchTab(tabId) {
    // 更新按鈕狀態
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        }
    });
    
    // 更新內容顯示
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
            content.classList.add('active');
        }
    });
    
    // 如果切換到列表，重新渲染
    if (tabId === 'list') {
        renderVotesList();
    }
}

// 加載投票數據
function loadVotes() {
    if (database) {
        // 使用 Firebase 實時數據庫
        const votesRef = database.ref('votes');
        votesRef.on('value', (snapshot) => {
            const data = snapshot.val();
            votes = data ? Object.values(data) : [];
            // 保持 ID 映射
            if (data) {
                votes = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key
                }));
            }
            renderVotesList();
        });
    } else {
        // 使用本地存儲（備用方案）
        votes = JSON.parse(localStorage.getItem('votes')) || [];
        renderVotesList();
    }
}

// 保存投票數據
function saveVotes() {
    if (database) {
        // 保存到 Firebase
        const votesRef = database.ref('votes');
        const votesObj = {};
        votes.forEach(vote => {
            votesObj[vote.id] = vote;
        });
        votesRef.set(votesObj);
    } else {
        // 保存到本地存儲（備用方案）
        localStorage.setItem('votes', JSON.stringify(votes));
    }
}

// 添加選項
function addOption() {
    const optionCount = optionsContainer.children.length;
    const optionItem = document.createElement('div');
    optionItem.className = 'option-item';
    optionItem.innerHTML = `
        <input type="text" class="option-input" required placeholder="選項 ${optionCount + 1}">
        <button type="button" class="remove-option">×</button>
    `;
    optionsContainer.appendChild(optionItem);
    
    // 更新刪除按鈕狀態
    updateRemoveButtons();
}

// 刪除選項
function removeOption(btn) {
    const optionCount = optionsContainer.children.length;
    if (optionCount > 2) {
        btn.parentElement.remove();
        // 更新刪除按鈕狀態
        updateRemoveButtons();
        // 更新選項占位符
        updateOptionPlaceholders();
    }
}

// 更新刪除按鈕狀態
function updateRemoveButtons() {
    const removeBtns = optionsContainer.querySelectorAll('.remove-option');
    removeBtns.forEach((btn, index) => {
        btn.disabled = index < 2;
    });
}

// 更新選項占位符
function updateOptionPlaceholders() {
    const optionInputs = optionsContainer.querySelectorAll('.option-input');
    optionInputs.forEach((input, index) => {
        input.placeholder = `選項 ${index + 1}`;
    });
}

// 創建投票
function createVote(e) {
    e.preventDefault();
    
    // 檢查管理員權限
    if (!isAdmin) {
        alert('只有管理員才能創建投票！');
        return;
    }
    
    // 獲取表單數據
    const title = document.getElementById('voteTitle').value.trim();
    const description = document.getElementById('voteDescription').value.trim();
    const isMultiple = document.getElementById('isMultiple').checked;
    const optionInputs = optionsContainer.querySelectorAll('.option-input');
    
    if (!title || !description) {
        alert('請填寫完整的投票信息');
        return;
    }
    
    // 收集選項
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(text => text !== '')
        .map(text => ({
            text,
            votes: 0
        }));
    
    if (options.length < 2) {
        alert('請至少添加兩個選項');
        return;
    }
    
    // 創建投票對象
    const vote = {
        id: Date.now().toString(),
        title,
        description,
        options,
        isMultiple,
        createdAt: new Date().toLocaleString('zh-TW'),
        totalVotes: 0,
        createdBy: currentUser
    };
    
    // 添加到投票列表
    votes.unshift(vote);
    
    // 保存投票數據
    saveVotes();
    
    // 重置表單
    createVoteForm.reset();
    
    // 重置選項容器
    resetOptionsContainer();
    
    // 切換到列表頁
    switchTab('list');
    
    // 顯示成功提示
    alert('投票創建成功！');
}

// 重置選項容器
function resetOptionsContainer() {
    optionsContainer.innerHTML = `
        <div class="option-item">
            <input type="text" class="option-input" required placeholder="選項 1">
            <button type="button" class="remove-option" disabled>×</button>
        </div>
        <div class="option-item">
            <input type="text" class="option-input" required placeholder="選項 2">
            <button type="button" class="remove-option">×</button>
        </div>
    `;
}

// 渲染投票列表
function renderVotesList() {
    if (votes.length === 0) {
        votesList.innerHTML = `
            <div class="empty-state">
                <h3>暫無投票</h3>
                <p>${isAdmin ? '點擊"創建投票"開始創建您的第一個投票' : '等待管理員創建投票'}</p>
            </div>
        `;
        return;
    }
    
    votesList.innerHTML = votes.map(vote => `
        <div class="vote-item" data-vote-id="${vote.id}">
            <h3>${vote.title}</h3>
            <p>${vote.description}</p>
            <div class="vote-meta">
                <span>創建時間: ${vote.createdAt}</span>
                <span>總票數: ${vote.totalVotes}</span>
                ${vote.createdBy ? `<span>創建者: ${vote.createdBy}</span>` : ''}
                <button class="view-vote-btn" data-vote-id="${vote.id}">查看投票</button>
            </div>
        </div>
    `).join('');
    
    // 綁定查看投票事件
    const viewVoteBtns = votesList.querySelectorAll('.view-vote-btn');
    viewVoteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const voteId = btn.dataset.voteId;
            viewVote(voteId);
        });
    });
    
    // 綁定投票項點擊事件
    const voteItems = votesList.querySelectorAll('.vote-item');
    voteItems.forEach(item => {
        item.addEventListener('click', () => {
            const voteId = item.dataset.voteId;
            viewVote(voteId);
        });
    });
}

// 查看投票詳情
function viewVote(voteId) {
    currentVote = votes.find(vote => vote.id === voteId);
    if (!currentVote) return;
    
    // 渲染投票詳情
    renderVoteDetail();
    
    // 切換到詳情頁
    document.getElementById('detail').classList.add('active');
    document.getElementById('list').classList.remove('active');
    document.getElementById('create').classList.remove('active');
    
    // 更新選項卡按鈕狀態
    tabBtns.forEach(btn => btn.classList.remove('active'));
}

// 渲染投票詳情
function renderVoteDetail() {
    if (!currentVote) return;
    
    // 設置標題和描述
    document.getElementById('detailTitle').textContent = currentVote.title;
    document.getElementById('detailDescription').textContent = currentVote.description;
    
    // 渲染選項
    const detailOptions = document.getElementById('detailOptions');
    detailOptions.innerHTML = currentVote.options.map((option, index) => `
        <label class="option-label">
            <input type="${currentVote.isMultiple ? 'checkbox' : 'radio'}" 
                   name="voteOption" 
                   value="${index}" 
                   required>
            <span class="option-text">${option.text}</span>
        </label>
    `).join('');
    
    // 渲染結果
    renderResults();
}

// 提交投票
function submitVote(e) {
    e.preventDefault();
    
    if (!currentVote) return;
    
    // 獲取選中的選項
    const selectedOptions = Array.from(voteForm.querySelectorAll('input[name="voteOption"]:checked'));
    if (selectedOptions.length === 0) {
        alert('請至少選擇一個選項');
        return;
    }
    
    // 更新投票計數
    selectedOptions.forEach(option => {
        const index = parseInt(option.value);
        currentVote.options[index].votes++;
        currentVote.totalVotes++;
    });
    
    // 保存投票數據
    saveVotes();
    
    // 重新渲染詳情
    renderVoteDetail();
    
    // 顯示成功提示
    alert('投票成功！');
    
    // 重置表單
    voteForm.reset();
}

// 渲染結果
function renderResults() {
    if (!currentVote) return;
    
    const resultsContainer = document.getElementById('results');
    const totalVotes = currentVote.totalVotes;
    
    resultsContainer.innerHTML = `
        <h3>投票結果</h3>
        ${currentVote.options.map(option => {
            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            return `
                <div class="result-item">
                    <div class="result-label">
                        <span class="result-text">${option.text}</span>
                        <span class="result-count">${option.votes} 票</span>
                    </div>
                    <div class="result-bar">
                        <div class="result-progress" style="width: ${percentage}%"></div>
                    </div>
                    <div class="result-percentage">${percentage}%</div>
                </div>
            `;
        }).join('')}
        <div style="margin-top: 20px; text-align: right; font-weight: 600;">
            總票數: ${totalVotes}
        </div>
    `;
}

// 頁面加載完成後初始化
window.addEventListener('DOMContentLoaded', init);
