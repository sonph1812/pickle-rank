let players = [];
let currentTab = 'leaderboard';
let selectedPlayerIds = new Set();
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
}

function updateSelectionUI() {
  const count = selectedPlayerIds.size;
  const el = document.getElementById('selected-count');
  if (el) el.textContent = count;
  const btn = document.getElementById('btn-do-pairing');
  if (btn) btn.disabled = count < 2;
}

function clearSelection() {
  selectedPlayerIds.clear();
  document.querySelectorAll('.player-check-card').forEach(c => c.classList.remove('selected'));
  updateSelectionUI();
  const result = document.getElementById('pairing-result');
  const actions = document.getElementById('pairing-actions');
  if (result) result.style.display = 'none';
  if (actions) actions.style.display = 'none';
}

function doPairing() {
  const selected = players.filter(p => selectedPlayerIds.has(p.id));
  selected.sort((a, b) => a.rank - b.rank);

  const teamA = [];
  const teamB = [];

  selected.forEach((player, i) => {
    const round = Math.floor(i / 2);
    const pos = i % 2;
    if (round % 2 === 0) {
      pos === 0 ? teamA.push(player) : teamB.push(player);
    } else {
      pos === 0 ? teamB.push(player) : teamA.push(player);
    }
  });

  renderPairingResult(teamA, teamB);
}

function renderPairingResult(teamA, teamB) {
  const resultDiv = document.getElementById('pairing-result');
  const actionsDiv = document.getElementById('pairing-actions');
  if (!resultDiv) return;

  resultDiv.style.display = 'grid';
  if (actionsDiv) actionsDiv.style.display = 'block';

  document.getElementById('team-a-count').textContent = `${teamA.length} người chơi`;
  document.getElementById('team-b-count').textContent = `${teamB.length} người chơi`;

  const renderPlayers = (list) => list.map(p => {
    const initials = p.name.split(' ').filter(w => w).map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const avatarHtml = p.logo
      ? `<img class="team-logo-img" src="${p.logo}" alt="${escapeHTML(p.name)}">`
      : `<div class="team-logo-placeholder">${initials}</div>`;
    return `
      <div class="team-player-item">
        ${avatarHtml}
        <div>
          <div class="team-player-name">${escapeHTML(p.name)}</div>
          <div class="team-player-meta">Hạng #${p.rank} · ${p.points}đ</div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('team-a-players').innerHTML = renderPlayers(teamA);
  document.getElementById('team-b-players').innerHTML = renderPlayers(teamB);

  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Utilities
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
