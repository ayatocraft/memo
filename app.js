// --- DataStore: localStorageを管理 ---
const DataStore = {
    getMemos: () => JSON.parse(localStorage.getItem('memos')) || [],
    saveMemos: (memos) => localStorage.setItem('memos', JSON.stringify(memos)),
};

// --- タブ間通信 ---
const channel = new BroadcastChannel('memo_app_channel');

// --- ページのパスに応じて初期化処理を分岐 ---
if (window.location.pathname.endsWith('home.html') || window.location.pathname === '/') {
    initHomePage();
} else if (window.location.pathname.endsWith('memo.html')) {
    initMemoPage();
}

// --- Homeページの初期化 ---
function initHomePage() {
    const newMemoBtn = document.getElementById('newMemoBtn');
    const memoList = document.getElementById('memoList');
    const archiveList = document.getElementById('archiveList');
    const memoGrid = document.getElementById('memoGrid');
    const welcomeMessage = document.getElementById('welcomeMessage');

    newMemoBtn.addEventListener('click', () => window.open('memo.html'));
    
    function renderHomePage() {
        memoList.innerHTML = '';
        archiveList.innerHTML = '';
        memoGrid.innerHTML = '';

        const memos = DataStore.getMemos();
        const activeMemos = memos.filter(memo => !memo.archived);
        const archivedMemos = memos.filter(memo => memo.archived);

        if (memos.length === 0) {
            welcomeMessage.classList.remove('hidden');
            memoGrid.classList.add('hidden');
        } else {
            welcomeMessage.classList.add('hidden');
            memoGrid.classList.remove('hidden');
        }

        activeMemos.forEach(memo => renderSidebarItem(memo, memoList));
        archivedMemos.forEach(memo => renderSidebarItem(memo, archiveList));
        activeMemos.forEach(renderMemoCard);
    }
    
    function renderSidebarItem(memo, listElement) {
        const li = document.createElement('li');
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'memo-title';
        titleSpan.textContent = memo.title || '無題のメモ';
        li.appendChild(titleSpan);

        const archiveIcon = document.createElement('span');
        archiveIcon.className = 'action-icon';
        archiveIcon.textContent = memo.archived ? '↩️' : '📦';
        archiveIcon.title = memo.archived ? 'アクティブに戻す' : 'アーカイブ';
        archiveIcon.onclick = (e) => {
            e.stopPropagation();
            toggleArchive(memo.id);
        };
        li.appendChild(archiveIcon);

        const deleteIcon = document.createElement('span');
        deleteIcon.className = 'action-icon';
        deleteIcon.textContent = '🗑️';
        deleteIcon.title = '削除';
        deleteIcon.onclick = (e) => {
            e.stopPropagation();
            deleteMemo(memo.id);
        };
        li.appendChild(deleteIcon);
        
        li.addEventListener('click', () => window.open(`memo.html?id=${memo.id}`));
        listElement.appendChild(li);
    }
    
    function renderMemoCard(memo) {
        const card = document.createElement('div');
        card.className = 'memo-card';
        card.onclick = () => window.open(`memo.html?id=${memo.id}`);

        const title = document.createElement('div');
        title.className = 'memo-card-title';
        title.textContent = memo.title || '無題のメモ';

        const body = document.createElement('div');
        body.className = 'memo-card-body';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = memo.body;
        body.textContent = tempDiv.textContent || '';

        card.appendChild(title);
        card.appendChild(body);
        memoGrid.appendChild(card);
    }

    function toggleArchive(id) {
        let memos = DataStore.getMemos();
        const memo = memos.find(m => m.id === id);
        if (memo) {
            memo.archived = !memo.archived;
            DataStore.saveMemos(memos);
            renderHomePage();
        }
    }
    
    function deleteMemo(id) {
        if (!confirm('本当にこのメモを削除しますか？')) return;
        let memos = DataStore.getMemos();
        memos = memos.filter(m => m.id !== id);
        DataStore.saveMemos(memos);
        renderHomePage();
        channel.postMessage({ type: 'deleted', id: id });
    }

    channel.onmessage = (event) => {
        if (event.data.type === 'update') {
            renderHomePage();
        }
    };
    
    renderHomePage();
}

// --- Memoページの初期化 ---
function initMemoPage() {
    const memoTitle = document.getElementById('memoTitle');
    const memoBody = document.getElementById('memoBody');
    const saveBtn = document.getElementById('saveBtn');
    const archiveBtn = document.getElementById('archiveBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const homeBtn = document.getElementById('homeBtn');
    const addLinkBtn = document.getElementById('addLinkBtn');
    const addImageBtn = document.getElementById('addImageBtn');
    const imageInput = document.getElementById('imageInput');
    
    const params = new URLSearchParams(window.location.search);
    let currentId = params.get('id') ? Number(params.get('id')) : null;
    let isNewMemo = currentId === null;

    if (isNewMemo) {
        currentId = Date.now();
        document.title = "新しいメモ";
    } else {
        const memos = DataStore.getMemos();
        const memo = memos.find(m => m.id === currentId);
        if (memo) {
            memoTitle.value = memo.title;
            memoBody.innerHTML = memo.body;
            document.title = memo.title || "メモの編集";
            archiveBtn.textContent = memo.archived ? 'アクティブに戻す' : 'アーカイブ';
        }
    }

    homeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });

    addLinkBtn.addEventListener('click', () => {
        const text = prompt("リンクとして表示するテキストを入力してください:", "");
        if (!text) return;
        const url = prompt("リンク先のURLを入力してください:", "https://");
        if (!url) return;
        
        const safeUrl = url.startsWith('http') ? url : `https://${url}`;
        const linkHtml = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        
        memoBody.focus();
        document.execCommand('insertHTML', false, linkHtml);
    });
    
    addImageBtn.addEventListener('click', () => { imageInput.click(); });
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            insertImageFile(file);
        }
    });

    memoBody.addEventListener('paste', (event) => {
        const items = event.clipboardData.items;
        for (const item of items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                event.preventDefault();
                const imageFile = item.getAsFile();
                insertImageFile(imageFile);
                return;
            }
        }
    });

    function insertImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgHtml = `<img src="${e.target.result}" alt="添付画像">`;
            memoBody.focus();
            document.execCommand('insertHTML', false, imgHtml);
        };
        reader.readAsDataURL(file);
    }
    
    function saveMemo(andArchive = false) {
        let memos = DataStore.getMemos();
        const memoIndex = memos.findIndex(m => m.id === currentId);

        const currentArchivedState = (memoIndex > -1) ? memos[memoIndex].archived : false;

        const updatedMemo = {
            id: currentId,
            title: memoTitle.value || '',
            body: memoBody.innerHTML,
            archived: andArchive ? !currentArchivedState : currentArchivedState,
        };
        
        if (memoIndex > -1) {
            memos[memoIndex] = updatedMemo;
        } else {
            memos.push(updatedMemo);
        }
        
        DataStore.saveMemos(memos);
        channel.postMessage({ type: 'update' });
        isNewMemo = false;
    }

    function handleSaveClick() {
        saveMemo();
        document.title = memoTitle.value || "メモの編集";
        alert('保存しました');
    }

    function handleArchiveClick() {
        saveMemo(true); 
        window.close();
    }

    function handleDeleteClick() {
        if (!confirm('本当にこのメモを削除しますか？')) return;
        let memos = DataStore.getMemos();
        memos = memos.filter(m => m.id !== currentId);
        DataStore.saveMemos(memos);
        channel.postMessage({ type: 'update' });
        window.close();
    }

    memoBody.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            window.open(e.target.href);
        }
    });

    saveBtn.addEventListener('click', handleSaveClick);
    archiveBtn.addEventListener('click', handleArchiveClick);
    deleteBtn.addEventListener('click', handleDeleteClick);
    
    channel.onmessage = (event) => {
        if (event.data.type === 'deleted' && event.data.id === currentId) {
            window.close();
        }
    };
}

