let players = [];
let currentTab = 'leaderboard';
let selectedPlayerIds = new Set();
let currentMatches = [];
const API_URL = '/api/players';


const leaderboardBody = document.getElementById('leaderboard-body');
const teamCountBadge = document.getElementById('team-count');
const statTotalTeams = document.getElementById('stat-total-teams');
const statTotalMatches = document.getElementById('stat-total-matches');
const statTopTeam = document.getElementById('stat-top-team');

const teamModal = document.getElementById('team-modal');
const modalTitle = document.getElementById('modal-title');
const teamForm = document.getElementById('team-form');
const fieldId = document.getElementById('field-id');
const fieldName = document.getElementById('field-name');
const fieldWins = document.getElementById('field-wins');
const fieldLosses = document.getElementById('field-losses');
const fieldGd = document.getElementById('field-gd');
const previewPoints = document.getElementById('preview-points');


const logoPreview = document.getElementById('logo-preview');
const fieldLogoFile = document.getElementById('field-logo-file');
const btnUploadTrigger = document.getElementById('btn-upload-trigger');
const btnRemoveLogo = document.getElementById('btn-remove-logo');
const fieldLogoBase64 = document.getElementById('field-logo-base64');

const btnAddTeam = document.getElementById('btn-add-team');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const toastContainer = document.getElementById('toast-container');


document.addEventListener('DOMContentLoaded', init);
btnAddTeam.addEventListener('click', () => openModal());
btnCloseModal.addEventListener('click', closeModal);
btnCancelModal.addEventListener('click', closeModal);
teamForm.addEventListener('submit', handleFormSubmit);


btnUploadTrigger.addEventListener('click', () => fieldLogoFile.click());


fieldLogoFile.addEventListener('change', handleFileSelect);


btnRemoveLogo.addEventListener('click', clearLogoSelection);


fieldWins.addEventListener('input', updatePointsPreview);

// Toast Notifications System
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }
  
  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-message">${message}</div>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, 4000);
}

// Initial Loading
async function init() {
  await fetchPlayers();
}

async function fetchPlayers() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Không thể tải dữ liệu người chơi');

    players = await response.json();
    renderLeaderboard();
    updateStatsDashboard();
    renderTicker();
    if (currentTab === 'pairing') renderPlayerSelector();
  } catch (error) {
    showToast(error.message, 'error');
    leaderboardBody.innerHTML = `
      <tr>
        <td colspan="8" class="td-empty" style="color: var(--accent-red)">
          Lỗi kết nối đến máy chủ. Vui lòng kiểm tra lại.
        </td>
      </tr>
    `;
  }
}


function renderLeaderboard() {
  if (players.length === 0) {
    leaderboardBody.innerHTML = `
      <tr>
        <td colspan="8" class="td-empty">Chưa có người chơi nào được tạo. Hãy nhấn "Thêm Người Chơi".</td>
      </tr>
    `;
    teamCountBadge.textContent = '0';
    return;
  }

  teamCountBadge.textContent = players.length;
  
  leaderboardBody.innerHTML = players.map(player => {
    let rankBadgeClass = 'rank-other';
    if (player.rank === 1) rankBadgeClass = 'rank-1';
    else if (player.rank === 2) rankBadgeClass = 'rank-2';
    else if (player.rank === 3) rankBadgeClass = 'rank-3';
    
    const gdClass = player.goalsDifference > 0 ? 'gd-positive' : (player.goalsDifference < 0 ? 'gd-negative' : '');
    const gdPrefix = player.goalsDifference > 0 ? '+' : '';

    // Create a beautiful avatar with initials as placeholder
    const initials = player.name
      .split(' ')
      .filter(word => word.trim().length > 0)
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || '👤';

    const logoHtml = player.logo 
      ? `<img class="team-logo-img" src="${player.logo}" alt="${escapeHTML(player.name)}">`
      : `<div class="team-logo-placeholder">${initials}</div>`;

    return `
      <tr data-id="${player.id}">
        <td class="col-rank">
          <span class="rank-badge ${rankBadgeClass}">${player.rank}</span>
        </td>
        <td class="col-name">
          <div class="team-identity">
            ${logoHtml}
            <span>${escapeHTML(player.name)}</span>
          </div>
        </td>
        <td class="col-played">${player.played}</td>
        <td class="col-win">${player.wins}</td>
        <td class="col-loss">${player.losses}</td>
        <td class="col-gd ${gdClass}">${gdPrefix}${player.goalsDifference}</td>
        <td class="col-points"><span class="point-text">${player.points}</span></td>
        <td class="col-actions">
          <button onclick="editPlayer('${player.id}')" class="btn-action btn-action-edit" title="Chỉnh sửa">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button onclick="deletePlayer('${player.id}', '${escapeHTML(player.name)}')" class="btn-action btn-action-delete" title="Xóa">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Update upper dashboard status numbers
function updateStatsDashboard() {
  statTotalTeams.textContent = players.length;
  
  // Total matches played in league
  const totalMatches = players.reduce((acc, player) => acc + player.played, 0) / 2;
  statTotalMatches.textContent = Math.round(totalMatches);
  
  if (players.length > 0) {
    statTopTeam.textContent = players[0].name;
    statTopTeam.style.color = 'var(--accent-yellow)';
  } else {
    statTopTeam.textContent = '-';
    statTopTeam.style.color = 'var(--text-main)';
  }
}

// Render Top 3 Players Ticker
function renderTicker() {
  const tickerWrap = document.getElementById('top-players-ticker');
  const tickerItems = document.getElementById('ticker-items');
  if (!tickerWrap || !tickerItems) return;

  const top3 = players.filter(p => p.rank <= 3);
  if (top3.length === 0) {
    tickerWrap.style.display = 'none';
    return;
  }

  tickerWrap.style.display = 'flex';

  const itemsHtml = top3.map(player => {
    let badgeClass = '';
    let medal = '';
    if (player.rank === 1) {
      badgeClass = 'badge-1';
      medal = '🥇';
    } else if (player.rank === 2) {
      badgeClass = 'badge-2';
      medal = '🥈';
    } else {
      badgeClass = 'badge-3';
      medal = '🥉';
    }

    const initials = player.name
      .split(' ')
      .filter(word => word.trim().length > 0)
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || '👤';

    const avatarHtml = player.logo
      ? `<img class="ticker__item-avatar" src="${player.logo}" alt="${escapeHTML(player.name)}">`
      : `<div class="ticker__item-avatar-placeholder">${initials}</div>`;

    return `
      <div class="ticker__item">
        <span class="badge ${badgeClass}">${medal} TOP ${player.rank}</span>
        ${avatarHtml}
        <span>${escapeHTML(player.name)} (${player.points}đ - Hiệu số ${player.goalsDifference > 0 ? '+' : ''}${player.goalsDifference})</span>
      </div>
    `;
  }).join('');

  // Duplicate items to ensure seamless infinite scrolling marquee
  tickerItems.innerHTML = itemsHtml + itemsHtml + itemsHtml + itemsHtml;
}

// File Select and Canvas Compression Logic
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate type
  if (!file.type.startsWith('image/')) {
    showToast('Vui lòng chỉ chọn file ảnh!', 'error');
    return;
  }

  // Validate size (limit input file to 5MB to avoid crash, compression will shrink it anyway)
  if (file.size > 5 * 1024 * 1024) {
    showToast('Kích thước ảnh gốc tối đa 5MB!', 'error');
    return;
  }

  const reader = new FileReader();
  reader.readAsDataURL(file);
  
  // Show loading indicator in preview
  logoPreview.innerHTML = '<span class="placeholder-icon">⌛</span>';

  reader.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;
    
    img.onload = function() {
      // Use Canvas to compress and scale down to 128x128px
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 128;
      const MAX_HEIGHT = 128;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Export as a compressed JPEG string (quality 0.7)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      
      // Store Base64 in hidden input
      fieldLogoBase64.value = compressedDataUrl;
      
      // Update preview UI
      logoPreview.innerHTML = `<img src="${compressedDataUrl}" alt="Preview">`;
      btnRemoveLogo.style.display = 'inline-flex';
      
      showToast('Nạp và tối ưu ảnh đại diện thành công!', 'success');
    };

    img.onerror = function() {
      showToast('Lỗi khi đọc tệp ảnh!', 'error');
      clearLogoSelection();
    };
  };
}

function clearLogoSelection() {
  fieldLogoFile.value = '';
  fieldLogoBase64.value = '';
  logoPreview.innerHTML = '<span class="placeholder-icon">👤</span>';
  btnRemoveLogo.style.display = 'none';
}

// Modal handling
function openModal(playerId = null) {
  teamForm.reset();
  clearLogoSelection();
  
  if (playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    modalTitle.textContent = 'Cập Nhật Người Chơi';
    fieldId.value = player.id;
    fieldName.value = player.name;
    fieldWins.value = player.wins;
    fieldLosses.value = player.losses;
    fieldGd.value = player.goalsDifference;
    
    if (player.logo) {
      fieldLogoBase64.value = player.logo;
      logoPreview.innerHTML = `<img src="${player.logo}" alt="Preview">`;
      btnRemoveLogo.style.display = 'inline-flex';
    }
    
    updatePointsPreview();
  } else {
    modalTitle.textContent = 'Thêm Người Chơi Mới';
    fieldId.value = '';
    previewPoints.textContent = '0';
  }
  
  teamModal.classList.add('active');
  fieldName.focus();
}

function closeModal() {
  teamModal.classList.remove('active');
}

function updatePointsPreview() {
  const wins = parseInt(fieldWins.value) || 0;
  previewPoints.textContent = wins * 3;
}

// Handle Form Submission (Create or Update)
async function handleFormSubmit(event) {
  event.preventDefault();
  
  const id = fieldId.value;
  const name = fieldName.value.trim();
  const wins = parseInt(fieldWins.value) || 0;
  const losses = parseInt(fieldLosses.value) || 0;
  const goalsDifference = parseInt(fieldGd.value) || 0;
  const logo = fieldLogoBase64.value; // Get compressed base64 string
  
  const payload = { name, logo, wins, losses, goalsDifference };
  
  const isEdit = id !== '';
  const url = isEdit ? `${API_URL}/${id}` : API_URL;
  const method = isEdit ? 'PATCH' : 'POST';
  
  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (data.message) {
        if (Array.isArray(data.message)) {
          throw new Error(data.message.join(', '));
        } else {
          throw new Error(data.message);
        }
      }
      throw new Error('Đã có lỗi xảy ra khi lưu thông tin');
    }
    
    showToast(isEdit ? `Cập nhật người chơi "${name}" thành công!` : `Thêm người chơi "${name}" thành công!`, 'success');
    closeModal();
    fetchPlayers();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Trigger edit modal
window.editPlayer = function(id) {
  openModal(id);
};

// Handle delete player
window.deletePlayer = async function(id, name) {
  if (!confirm(`Bạn có chắc chắn muốn xóa người chơi "${name}" khỏi bảng xếp hạng? Thao tác này không thể hoàn tác.`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Không thể xóa người chơi');
    }
    
    showToast(`Đã xóa người chơi "${name}" khỏi bảng xếp hạng!`, 'success');
    fetchPlayers();
  } catch (error) {
    showToast(error.message, 'error');
  }
};


function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`content-${tab}`).classList.add('active');
  document.getElementById(`tab-btn-${tab}`).classList.add('active');

  const addBtn = document.getElementById('btn-add-team');
  if (addBtn) addBtn.style.display = tab === 'leaderboard' ? 'inline-flex' : 'none';

  if (tab === 'pairing') renderPlayerSelector();
}

function renderPlayerSelector() {
  const grid = document.getElementById('player-check-grid');
  if (!grid) return;

  if (players.length === 0) {
    grid.innerHTML = `<p style="padding:30px;color:var(--text-muted);text-align:center;">Chưa có người chơi nào.</p>`;
    return;
  }

  grid.innerHTML = players.map(player => {
    const initials = player.name.split(' ').filter(w => w).map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const avatarHtml = player.logo
      ? `<img class="team-logo-img" src="${player.logo}" alt="${escapeHTML(player.name)}">`
      : `<div class="team-logo-placeholder">${initials}</div>`;
    const isSelected = selectedPlayerIds.has(player.id);
    return `
      <div class="player-check-card ${isSelected ? 'selected' : ''}" onclick="togglePlayerSelection('${player.id}')" id="check-card-${player.id}">
        <div class="check-indicator">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        ${avatarHtml}
        <div class="check-info">
          <div class="check-name">${escapeHTML(player.name)}</div>
          <div class="check-rank">Hạng #${player.rank} · ${player.points}đ</div>
        </div>
      </div>`;
  }).join('');

  updateSelectionUI();
}

function togglePlayerSelection(id) {
  if (selectedPlayerIds.has(id)) {
    selectedPlayerIds.delete(id);
  } else {
    selectedPlayerIds.add(id);
  }
  const card = document.getElementById(`check-card-${id}`);
  if (card) card.classList.toggle('selected', selectedPlayerIds.has(id));
  updateSelectionUI();
  doPairingIfResultVisible();
}

function updateSelectionUI() {
  const count = selectedPlayerIds.size;
  const el = document.getElementById('selected-count');
  if (el) el.textContent = count;
  
  const btn = document.getElementById('btn-do-pairing');
  if (btn) {
    const format = document.querySelector('input[name="pairing-format"]:checked')?.value || 'singles';
    btn.disabled = format === 'doubles' ? count < 4 : count < 2;
  }
}

function onPairingFormatChange() {
  updateSelectionUI();
  doPairingIfResultVisible();
}

function doPairingIfResultVisible() {
  const resultDiv = document.getElementById('pairing-result');
  if (resultDiv && resultDiv.style.display !== 'none') {
    doPairing();
  }
}

function clearSelection() {
  selectedPlayerIds.clear();
  document.querySelectorAll('.player-check-card').forEach(c => c.classList.remove('selected'));
  updateSelectionUI();
  const result = document.getElementById('pairing-result');
  const actions = document.getElementById('pairing-actions');
  if (result) {
    result.style.display = 'none';
    result.innerHTML = '';
  }
  if (actions) actions.style.display = 'none';
}

function doPairing() {
  const selected = players.filter(p => selectedPlayerIds.has(p.id));
  const format = document.querySelector('input[name="pairing-format"]:checked')?.value || 'singles';
  const algo = document.querySelector('input[name="pairing-algo"]:checked')?.value || 'balanced';

  let pool = [...selected];

  // Shuffle if random
  if (algo === 'random') {
    pool.sort(() => Math.random() - 0.5);
  } else {
    // Balanced: sort by rank ascending (strongest first)
    pool.sort((a, b) => a.rank - b.rank);
  }

  const matches = [];
  const waiting = [];

  if (format === 'singles') {
    // 1 vs 1
    const isOdd = pool.length % 2 !== 0;
    const matchCount = Math.floor(pool.length / 2);
    for (let i = 0; i < matchCount; i++) {
      matches.push({
        id: `match-${i}`,
        type: 'singles',
        player1: pool[i * 2],
        player2: pool[i * 2 + 1]
      });
    }
    if (isOdd) {
      waiting.push(pool[pool.length - 1]);
    }
  } else {
    // Doubles: 2 vs 2 (each team is a pair of 2 players, match has 4 players)
    const matchCount = Math.floor(pool.length / 4);
    const activePlayersCount = matchCount * 4;
    
    // Active players pool
    const activePool = pool.slice(0, activePlayersCount);
    // Rest of the players are waiting
    const restPool = pool.slice(activePlayersCount);
    waiting.push(...restPool);

    if (algo === 'balanced') {
      // For each group of 4 players, pair: (1st + 4th) vs (2nd + 3rd)
      for (let i = 0; i < matchCount; i++) {
        const group = activePool.slice(i * 4, (i + 1) * 4);
        matches.push({
          id: `match-${i}`,
          type: 'doubles',
          team1: [group[0], group[3]], // strong + weak
          team2: [group[1], group[2]]  // mid + mid
        });
      }
    } else {
      // Random matching: group of 4 players -> (p0 + p1) vs (p2 + p3)
      for (let i = 0; i < matchCount; i++) {
        const group = activePool.slice(i * 4, (i + 1) * 4);
        matches.push({
          id: `match-${i}`,
          type: 'doubles',
          team1: [group[0], group[1]],
          team2: [group[2], group[3]]
        });
      }
    }
  }

  currentMatches = matches;
  renderPairingResult(matches, waiting);
}

function renderPairingResult(matches, waiting) {
  const resultDiv = document.getElementById('pairing-result');
  const actionsDiv = document.getElementById('pairing-actions');
  if (!resultDiv) return;

  resultDiv.style.display = 'flex';
  if (actionsDiv) actionsDiv.style.display = 'block';

  let html = '';

  // Title
  html += `
    <div class="matchups-title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      Danh Sách Cặp Đấu Đã Chia
    </div>
    <div class="matchup-grid">
  `;

  // Render matches
  matches.forEach((match, index) => {
    if (match.type === 'singles') {
      const p1 = match.player1;
      const p2 = match.player2;
      
      const initials1 = p1.name.split(' ').filter(w => w).map(w => w[0]).join('').substring(0, 2).toUpperCase();
      const avatarHtml1 = p1.logo
        ? `<img class="team-logo-img" src="${p1.logo}" alt="${escapeHTML(p1.name)}">`
        : `<div class="team-logo-placeholder">${initials1}</div>`;

      const initials2 = p2.name.split(' ').filter(w => w).map(w => w[0]).join('').substring(0, 2).toUpperCase();
      const avatarHtml2 = p2.logo
        ? `<img class="team-logo-img" src="${p2.logo}" alt="${escapeHTML(p2.name)}">`
        : `<div class="team-logo-placeholder">${initials2}</div>`;

      html += `
        <div class="matchup-card" id="match-card-${match.id}">
          <div class="matchup-header">
            <span>Trận Đấu Đơn #${index + 1}</span>
            <span class="matchup-header-badge">1 vs 1</span>
          </div>
          <div class="matchup-body">
            <div class="matchup-side">
              <div class="matchup-player-item">
                ${avatarHtml1}
                <div>
                  <div class="matchup-player-name">${escapeHTML(p1.name)}</div>
                  <div class="matchup-player-meta">Hạng #${p1.rank} · ${p1.points}đ</div>
                </div>
              </div>
            </div>
            <div class="matchup-vs">VS</div>
            <div class="matchup-side">
              <div class="matchup-player-item">
                ${avatarHtml2}
                <div>
                  <div class="matchup-player-name">${escapeHTML(p2.name)}</div>
                  <div class="matchup-player-meta">Hạng #${p2.rank} · ${p2.points}đ</div>
                </div>
              </div>
            </div>
          </div>
          <div class="matchup-score-bar" id="score-bar-${match.id}">
            <input type="number" min="0" placeholder="0" class="score-input" id="score-1-${match.id}">
            <span class="score-dash">:</span>
            <input type="number" min="0" placeholder="0" class="score-input" id="score-2-${match.id}">
            <button class="btn-record" onclick="recordMatchScore('${match.id}', false)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Ghi nhận
            </button>
          </div>
        </div>
      `;
    } else {
      // Doubles
      const t1p1 = match.team1[0];
      const t1p2 = match.team1[1];
      const t2p1 = match.team2[0];
      const t2p2 = match.team2[1];

      const renderPlayerRow = (p) => {
        const initials = p.name.split(' ').filter(w => w).map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const avatarHtml = p.logo
          ? `<img class="team-logo-img" src="${p.logo}" alt="${escapeHTML(p.name)}">`
          : `<div class="team-logo-placeholder">${initials}</div>`;
        return `
          <div class="matchup-player-item">
            ${avatarHtml}
            <div>
              <div class="matchup-player-name">${escapeHTML(p.name)}</div>
              <div class="matchup-player-meta">Hạng #${p.rank} · ${p.points}đ</div>
            </div>
          </div>
        `;
      };

      html += `
        <div class="matchup-card" id="match-card-${match.id}">
          <div class="matchup-header">
            <span>Trận Đấu Đôi #${index + 1}</span>
            <span class="matchup-header-badge">2 vs 2</span>
          </div>
          <div class="matchup-body">
            <div class="matchup-side">
              ${renderPlayerRow(t1p1)}
              ${renderPlayerRow(t1p2)}
            </div>
            <div class="matchup-vs">VS</div>
            <div class="matchup-side">
              ${renderPlayerRow(t2p1)}
              ${renderPlayerRow(t2p2)}
            </div>
          </div>
          <div class="matchup-score-bar" id="score-bar-${match.id}">
            <input type="number" min="0" placeholder="0" class="score-input" id="score-1-${match.id}">
            <span class="score-dash">:</span>
            <input type="number" min="0" placeholder="0" class="score-input" id="score-2-${match.id}">
            <button class="btn-record" onclick="recordMatchScore('${match.id}', true)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Ghi nhận
            </button>
          </div>
        </div>
      `;
    }
  });

  html += `</div>`; // Close matchup-grid

  // Render waiting list
  if (waiting.length > 0) {
    html += `
      <div class="waiting-list-card">
        <div class="waiting-list-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Thành Viên Chờ Đấu / Nghỉ Vòng Này (${waiting.length})
        </div>
        <div class="waiting-players-grid">
    `;

    waiting.forEach(p => {
      const initials = p.name.split(' ').filter(w => w).map(w => w[0]).join('').substring(0, 2).toUpperCase();
      const avatarHtml = p.logo
        ? `<img class="team-logo-img" src="${p.logo}" alt="${escapeHTML(p.name)}">`
        : `<div class="team-logo-placeholder">${initials}</div>`;
      html += `
        <div class="waiting-player-item">
          ${avatarHtml}
          <div>
            <div class="matchup-player-name">${escapeHTML(p.name)}</div>
            <div class="matchup-player-meta">Hạng #${p.rank} · ${p.points}đ</div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  resultDiv.innerHTML = html;
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function recordMatchScore(matchId, isDoubles) {
  const match = currentMatches.find(m => m.id === matchId);
  if (!match) {
    showToast('Không tìm thấy thông tin trận đấu!', 'error');
    return;
  }

  const score1Input = document.getElementById(`score-1-${matchId}`);
  const score2Input = document.getElementById(`score-2-${matchId}`);
  if (!score1Input || !score2Input) return;

  const score1Val = score1Input.value.trim();
  const score2Val = score2Input.value.trim();

  if (score1Val === '' || score2Val === '') {
    showToast('Vui lòng nhập đầy đủ điểm số của cả hai bên!', 'error');
    return;
  }

  const s1 = parseInt(score1Val);
  const s2 = parseInt(score2Val);

  if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
    showToast('Điểm số phải là số nguyên lớn hơn hoặc bằng 0!', 'error');
    return;
  }

  if (s1 === s2) {
    showToast('Trận đấu phải phân định thắng thua, không thể nhập tỷ số hòa!', 'error');
    return;
  }

  // Disable inputs and button during update
  const bar = document.getElementById(`score-bar-${matchId}`);
  const btn = bar.querySelector('.btn-record');
  score1Input.disabled = true;
  score2Input.disabled = true;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⌛ Đang lưu...';
  }

  // Determine winners and losers
  const team1Won = s1 > s2;
  const diff = Math.abs(s1 - s2);

  // Sync fresh database data first to prevent overwrite race conditions
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Không thể đồng bộ dữ liệu người chơi mới nhất.');
    players = await res.json();
  } catch (err) {
    showToast(err.message, 'error');
    score1Input.disabled = false;
    score2Input.disabled = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Ghi nhận';
    }
    return;
  }

  // Identify players involved
  let winners = [];
  let losers = [];

  if (!isDoubles) {
    const freshP1 = players.find(p => p.id === match.player1.id);
    const freshP2 = players.find(p => p.id === match.player2.id);
    if (!freshP1 || !freshP2) {
      showToast('Không tìm thấy thông tin cầu thủ trên hệ thống!', 'error');
      return;
    }
    if (team1Won) {
      winners.push(freshP1);
      losers.push(freshP2);
    } else {
      winners.push(freshP2);
      losers.push(freshP1);
    }
  } else {
    const freshT1P1 = players.find(p => p.id === match.team1[0].id);
    const freshT1P2 = players.find(p => p.id === match.team1[1].id);
    const freshT2P1 = players.find(p => p.id === match.team2[0].id);
    const freshT2P2 = players.find(p => p.id === match.team2[1].id);
    if (!freshT1P1 || !freshT1P2 || !freshT2P1 || !freshT2P2) {
      showToast('Không tìm thấy thông tin cầu thủ trên hệ thống!', 'error');
      return;
    }
    if (team1Won) {
      winners.push(freshT1P1, freshT1P2);
      losers.push(freshT2P1, freshT2P2);
    } else {
      winners.push(freshT2P1, freshT2P2);
      losers.push(freshT1P1, freshT1P2);
    }
  }

  // Send update requests for all involved players
  const updates = [];

  winners.forEach(player => {
    const payload = {
      wins: player.wins + 1,
      goalsDifference: player.goalsDifference + diff
    };
    updates.push(
      fetch(`${API_URL}/${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );
  });

  losers.forEach(player => {
    const payload = {
      losses: player.losses + 1,
      goalsDifference: player.goalsDifference - diff
    };
    updates.push(
      fetch(`${API_URL}/${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );
  });

  try {
    const responses = await Promise.all(updates);
    const failed = responses.find(r => !r.ok);
    if (failed) {
      const errData = await failed.json();
      throw new Error(errData.message || 'Lỗi khi cập nhật chỉ số người chơi.');
    }

    // Success! Update UI to check badge
    bar.innerHTML = `
      <div class="recorded-status">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Đã ghi nhận kết quả (${s1} : ${s2})
      </div>
    `;

    showToast('Ghi nhận tỉ số và cập nhật bảng xếp hạng thành công!', 'success');

    // Fetch players to refresh the main leaderboard table in real time
    await fetchPlayers();
  } catch (error) {
    showToast(error.message, 'error');
    // Re-enable in case of failure
    score1Input.disabled = false;
    score2Input.disabled = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Ghi nhận';
    }
  }
}

// Bind to window for global inline handlers
window.togglePlayerSelection = togglePlayerSelection;
window.clearSelection = clearSelection;
window.onPairingFormatChange = onPairingFormatChange;
window.doPairingIfResultVisible = doPairingIfResultVisible;
window.doPairing = doPairing;
window.recordMatchScore = recordMatchScore;

// Utilities
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
