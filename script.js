// 投票小程序 JavaScript

// 全局变量
let votes = JSON.parse(localStorage.getItem('votes')) || [];
let currentVote = null;

// DOM 元素
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
    // 绑定事件监听器
    bindEvents();
    // 渲染投票列表
    renderVotesList();
}

// 绑定事件监听器
function bindEvents() {
    // 选项卡切换
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
    
    // 添加选项
    addOptionBtn.addEventListener('click', addOption);
    
    // 删除选项
    optionsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-option')) {
            removeOption(e.target);
        }
    });
    
    // 创建投票表单提交
    createVoteForm.addEventListener('submit', createVote);
    
    // 投票表单提交
    voteForm.addEventListener('submit', submitVote);
    
    // 返回列表
    backToListBtn.addEventListener('click', () => {
        switchTab('list');
    });
}

// 切换选项卡
function switchTab(tabId) {
    // 更新按钮状态
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        }
    });
    
    // 更新内容显示
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
            content.classList.add('active');
        }
    });
    
    // 如果切换到列表，重新渲染
    if (tabId === 'list') {
        renderVotesList();
    }
}

// 添加选项
function addOption() {
    const optionCount = optionsContainer.children.length;
    const optionItem = document.createElement('div');
    optionItem.className = 'option-item';
    optionItem.innerHTML = `
        <input type="text" class="option-input" required placeholder="选项 ${optionCount + 1}">
        <button type="button" class="remove-option">×</button>
    `;
    optionsContainer.appendChild(optionItem);
    
    // 更新删除按钮状态
    updateRemoveButtons();
}

// 删除选项
function removeOption(btn) {
    const optionCount = optionsContainer.children.length;
    if (optionCount > 2) {
        btn.parentElement.remove();
        // 更新删除按钮状态
        updateRemoveButtons();
        // 更新选项占位符
        updateOptionPlaceholders();
    }
}

// 更新删除按钮状态
function updateRemoveButtons() {
    const removeBtns = optionsContainer.querySelectorAll('.remove-option');
    removeBtns.forEach((btn, index) => {
        btn.disabled = index < 2;
    });
}

// 更新选项占位符
function updateOptionPlaceholders() {
    const optionInputs = optionsContainer.querySelectorAll('.option-input');
    optionInputs.forEach((input, index) => {
        input.placeholder = `选项 ${index + 1}`;
    });
}

// 创建投票
function createVote(e) {
    e.preventDefault();
    
    // 获取表单数据
    const title = document.getElementById('voteTitle').value;
    const description = document.getElementById('voteDescription').value;
    const isMultiple = document.getElementById('isMultiple').checked;
    const optionInputs = optionsContainer.querySelectorAll('.option-input');
    
    // 收集选项
    const options = Array.from(optionInputs).map(input => ({
        text: input.value,
        votes: 0
    }));
    
    // 创建投票对象
    const vote = {
        id: Date.now().toString(),
        title,
        description,
        options,
        isMultiple,
        createdAt: new Date().toLocaleString(),
        totalVotes: 0
    };
    
    // 添加到投票列表
    votes.unshift(vote);
    
    // 保存到本地存储
    saveVotes();
    
    // 重置表单
    createVoteForm.reset();
    
    // 重置选项容器
    resetOptionsContainer();
    
    // 切换到列表页
    switchTab('list');
    
    // 显示成功提示
    alert('投票创建成功！');
}

// 重置选项容器
function resetOptionsContainer() {
    optionsContainer.innerHTML = `
        <div class="option-item">
            <input type="text" class="option-input" required placeholder="选项 1">
            <button type="button" class="remove-option" disabled>×</button>
        </div>
        <div class="option-item">
            <input type="text" class="option-input" required placeholder="选项 2">
            <button type="button" class="remove-option">×</button>
        </div>
    `;
}

// 保存投票到本地存储
function saveVotes() {
    localStorage.setItem('votes', JSON.stringify(votes));
}

// 渲染投票列表
function renderVotesList() {
    if (votes.length === 0) {
        votesList.innerHTML = `
            <div class="empty-state">
                <h3>暂无投票</h3>
                <p>点击"创建投票"开始创建您的第一个投票</p>
            </div>
        `;
        return;
    }
    
    votesList.innerHTML = votes.map(vote => `
        <div class="vote-item" data-vote-id="${vote.id}">
            <h3>${vote.title}</h3>
            <p>${vote.description}</p>
            <div class="vote-meta">
                <span>创建时间: ${vote.createdAt}</span>
                <span>总票数: ${vote.totalVotes}</span>
                <button class="view-vote-btn" data-vote-id="${vote.id}">查看投票</button>
            </div>
        </div>
    `).join('');
    
    // 绑定查看投票事件
    const viewVoteBtns = votesList.querySelectorAll('.view-vote-btn');
    viewVoteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const voteId = btn.dataset.voteId;
            viewVote(voteId);
        });
    });
    
    // 绑定投票项点击事件
    const voteItems = votesList.querySelectorAll('.vote-item');
    voteItems.forEach(item => {
        item.addEventListener('click', () => {
            const voteId = item.dataset.voteId;
            viewVote(voteId);
        });
    });
}

// 查看投票详情
function viewVote(voteId) {
    currentVote = votes.find(vote => vote.id === voteId);
    if (!currentVote) return;
    
    // 渲染投票详情
    renderVoteDetail();
    
    // 切换到详情页
    document.getElementById('detail').classList.add('active');
    document.getElementById('list').classList.remove('active');
    document.getElementById('create').classList.remove('active');
    
    // 更新选项卡按钮状态
    tabBtns.forEach(btn => btn.classList.remove('active'));
}

// 渲染投票详情
function renderVoteDetail() {
    if (!currentVote) return;
    
    // 设置标题和描述
    document.getElementById('detailTitle').textContent = currentVote.title;
    document.getElementById('detailDescription').textContent = currentVote.description;
    
    // 渲染选项
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
    
    // 渲染结果
    renderResults();
}

// 提交投票
function submitVote(e) {
    e.preventDefault();
    
    if (!currentVote) return;
    
    // 获取选中的选项
    const selectedOptions = Array.from(voteForm.querySelectorAll('input[name="voteOption"]:checked'));
    if (selectedOptions.length === 0) {
        alert('请至少选择一个选项');
        return;
    }
    
    // 更新投票计数
    selectedOptions.forEach(option => {
        const index = parseInt(option.value);
        currentVote.options[index].votes++;
        currentVote.totalVotes++;
    });
    
    // 保存到本地存储
    saveVotes();
    
    // 重新渲染详情
    renderVoteDetail();
    
    // 显示成功提示
    alert('投票成功！');
    
    // 重置表单
    voteForm.reset();
}

// 渲染结果
function renderResults() {
    if (!currentVote) return;
    
    const resultsContainer = document.getElementById('results');
    const totalVotes = currentVote.totalVotes;
    
    resultsContainer.innerHTML = `
        <h3>投票结果</h3>
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
            总票数: ${totalVotes}
        </div>
    `;
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);
