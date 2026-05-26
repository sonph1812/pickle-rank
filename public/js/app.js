// State management
let players = [];
const API_URL = '/api/players';

// DOM Elements
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

// Image upload DOM Elements
const logoPreview = document.getElementById('logo-preview');
const fieldLogoFile = document.getElementById('field-logo-file');
const btnUploadTrigger = document.getElementById('btn-upload-trigger');
const btnRemoveLogo = document.getElementById('btn-remove-logo');
const fieldLogoBase64 = document.getElementById('field-logo-base64');

const btnAddTeam = document.getElementById('btn-add-team');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const toastContainer = document.getElementById('toast-container');

// Event Listeners
document.addEventListener('DOMContentLoaded', init);
btnAddTeam.addEventListener('click', () => openModal());
btnCloseModal.addEventListener('click', closeModal);
btnCancelModal.addEventListener('click', closeModal);
teamForm.addEventListener('submit', handleFormSubmit);

// Trigger file selector when clicking button
btnUploadTrigger.addEventListener('click', () => fieldLogoFile.click());

// Handle file selection and nén ảnh
fieldLogoFile.addEventListener('change', handleFileSelect);

// Remove logo selection
btnRemoveLogo.addEventListener('click', clearLogoSelection);

// Realtime points calculation in modal (wins * 3)
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

// Fetch all players from REST API
async function fetchPlayers() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Không thể tải dữ liệu người chơi');
    
    players = await response.json();
    renderLeaderboard();
    updateStatsDashboard();
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

// Render Leaderboard table (excluding Draws column)
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

// Utilities
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
