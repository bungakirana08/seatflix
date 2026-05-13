// ===== SEATFLIX APP LOGIC =====

const App = {
  currentPage: 'splash',
  selectedDate: 3,
  selectedTime: '14:00',
  selectedSeats: [],
  ticketPrice: 50000, // will be updated dynamically when user picks a time slot
  serviceFee: 4000,
  currentMovie: 'cinlock',
  currentCinema: 'semua',

  // Selected cinema name (set when user clicks a time slot)
  selectedCinemaName: '',
  selectedCinemaAddr: '',

  // User session
  user: {
    name: 'Pengguna',
    email: '',
    provider: 'guest', // 'guest' | 'facebook' | 'google' | 'email'
  },

  // Booked tickets storage
  bookedTickets: [],

  // Poin
  poin: 0,

  pages: [
    'splash','login','home',
    'movie-detail','movie-detail-pertaruhan','movie-detail-horor','movie-detail-komedi',
    'seat-select','order-summary','payment','success',
    'page-tiket','page-point','page-akun'
  ],

  navigate(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) {
      target.classList.add('active');
      this.currentPage = pageId;
      window.scrollTo(0, 0);
    }
  },

  init() {
    // Splash → Login after 2.2s
    setTimeout(() => this.navigate('login'), 2200);

    // Login form (email/password)
    document.getElementById('loginForm').addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('emailInput').value;
      const name = email.split('@')[0] || 'Pengguna';
      this.user = { name, email, provider: 'email' };
      this.renderAkunPage();
      this.navigate('home');
    });

    // Sign up link
    document.getElementById('signUpLink').addEventListener('click', e => {
      e.preventDefault();
      alert('Halaman registrasi akan segera hadir!');
    });

    // Social login buttons
    document.querySelectorAll('.social-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const provider = btn.dataset.provider || 'guest';
        const name = btn.dataset.name || 'Guest';
        const email = provider === 'google' ? 'admin@gmail.com' : provider === 'facebook' ? 'user@facebook.com' : '';
        this.user = { name, email, provider };
        this.renderAkunPage();
        this.navigate('home');
      });
    });

    // ===== Cinema filter chips (Home page) =====
    const homeFilterChips = document.querySelectorAll('#home .filter-chip');
    homeFilterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        homeFilterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentCinema = chip.dataset.cinema || 'semua';
      });
    });

    // Movie cards → correct detail page
    document.querySelectorAll('.movie-card[data-nav]').forEach(card => {
      card.addEventListener('click', () => {
        const movie = card.dataset.movie;
        // Reset cinema filter to 'semua' for detail pages
        this.currentCinema = 'semua';
        // Reset selection so user must pick fresh each time
        this.selectedTime = '';
        this.selectedCinemaName = '';
        this.selectedCinemaAddr = '';
        if (movie === 'pertaruhan') {
          this.currentMovie = 'pertaruhan';
          this.navigate('movie-detail-pertaruhan');
        } else if (movie === 'horor') {
          this.currentMovie = 'horor';
          this.navigate('movie-detail-horor');
        } else if (movie === 'komedi') {
          this.currentMovie = 'komedi';
          this.navigate('movie-detail-komedi');
        } else {
          this.currentMovie = 'cinlock';
          this.navigate('movie-detail');
        }
      });
    });

    // Tab handler scoped per page
    document.querySelectorAll('.page').forEach(page => {
      page.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          page.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          page.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          btn.classList.add('active');
          const tabId = 'tab-' + btn.dataset.tab;
          const tabContent = page.querySelector('#' + tabId);
          if (tabContent) tabContent.classList.add('active');
        });
      });
    });

    // Date chips
    document.querySelectorAll('.date-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.closest('.date-scroll').querySelectorAll('.date-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectedDate = parseInt(chip.dataset.date);
      });
    });

    // Time slots — also track which cinema block was clicked
    document.querySelectorAll('.time-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        // Deselect ALL time slots across the entire current page (not just same row)
        // so only one slot is selected at a time across all cinemas
        const currentPageEl = document.getElementById(this.currentPage) ||
                              document.querySelector('.page.active');
        if (currentPageEl) {
          currentPageEl.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        }
        slot.classList.add('selected');
        this.selectedTime = slot.textContent.trim();

        // Find parent cinema-block and show-type to get cinema name and CORRECT price
        const cinemaBlock = slot.closest('.cinema-block');
        const showType = slot.closest('.show-type');
        if (cinemaBlock) {
          const nameEl = cinemaBlock.querySelector('.cinema-name');
          const addrEl = cinemaBlock.querySelector('.cinema-addr');
          this.selectedCinemaName = nameEl ? nameEl.textContent.trim() : '';
          this.selectedCinemaAddr = addrEl ? addrEl.textContent.trim() : '';
        }
        // Read price from the specific show-type row the slot belongs to
        if (showType) {
          const priceEl = showType.querySelector('.show-type-price');
          if (priceEl) {
            const raw = priceEl.textContent.replace(/[^0-9]/g, '');
            this.ticketPrice = parseInt(raw) || 50000;
          }
        }
      });
    });

    // Beli Tiket button → seat select
    document.querySelectorAll('.btn-beli').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.movie) this.currentMovie = btn.dataset.movie;

        // Check that a time slot (and thus cinema) has been chosen
        if (!this.selectedTime || !this.selectedCinemaName) {
          alert('Pilih jadwal tayang terlebih dahulu!');
          return;
        }

        this.selectedSeats = [];
        this.renderSeatGrid();
        this.navigate('seat-select');
      });
    });

    // Seat back button — go back to correct movie detail
    document.querySelector('#seat-select .back-btn[data-back]').addEventListener('click', () => {
      const detailMap = {
        'pertaruhan': 'movie-detail-pertaruhan',
        'horor': 'movie-detail-horor',
        'komedi': 'movie-detail-komedi',
        'cinlock': 'movie-detail',
      };
      this.navigate(detailMap[this.currentMovie] || 'movie-detail');
    });

    // Seat selection → order summary
    document.getElementById('confirmSeats').addEventListener('click', () => {
      if (this.selectedSeats.length === 0) { alert('Pilih kursi terlebih dahulu!'); return; }
      this.renderOrderSummary();
      this.navigate('order-summary');
    });

    // Pay now → payment QR
    document.getElementById('bayarBtn').addEventListener('click', () => {
      this.navigate('payment');
      this.startPaymentTimer();
      this.generateQR();
    });

    // Generic back buttons (exclude seat-select's which is handled above)
    document.querySelectorAll('[data-back]').forEach(btn => {
      if (btn.closest('#seat-select')) return; // already handled
      btn.addEventListener('click', () => this.navigate(btn.dataset.back));
    });

    // ===== BOTTOM NAV — all instances =====
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page === 'home') {
          this.navigate('home');
        } else if (page === 'tiket') {
          this.renderTiketPage();
          this.navigate('page-tiket');
        } else if (page === 'point') {
          this.renderPoinPage();
          this.navigate('page-point');
        } else if (page === 'akun') {
          this.renderAkunPage();
          this.navigate('page-akun');
        }
      });
    });

    // Reward tukar buttons
    document.querySelectorAll('.reward-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cost = parseInt(btn.dataset.cost);
        const reward = btn.dataset.reward;
        if (this.poin < cost) {
          alert(`Poin kamu tidak cukup!\nKamu butuh ${cost} poin, sekarang punya ${this.poin} poin.`);
          return;
        }
        this.poin -= cost;
        alert(`✅ Berhasil menukar ${cost} poin dengan ${reward}!\nSisa poin: ${this.poin}`);
        this.renderPoinPage();
      });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
      if (confirm('Yakin mau keluar?')) {
        this.user = { name: 'Pengguna', email: '', provider: 'guest' };
        this.bookedTickets = [];
        this.poin = 0;
        this.navigate('login');
      }
    });

    // Akun menu items
    document.querySelectorAll('.akun-menu-item:not(.akun-logout)').forEach(item => {
      item.addEventListener('click', () => {
        const text = item.querySelector('.akun-menu-text').textContent;
        if (text === 'Riwayat Tiket') { this.renderTiketPage(); this.navigate('page-tiket'); }
        else if (text === 'Poin Saya') { this.renderPoinPage(); this.navigate('page-point'); }
        else { alert(`${text} — segera hadir!`); }
      });
    });

    // Search bar
    document.getElementById('searchInput').addEventListener('keypress', e => {
      if (e.key === 'Enter') { e.preventDefault(); alert(`Mencari: "${e.target.value}"`); }
    });
  },

  // ===== TIKET PAGE =====
  renderTiketPage() {
    const el = document.getElementById('tiketContent');
    if (this.bookedTickets.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎫</div>
          <div class="empty-title">Belum Ada Tiket</div>
          <div class="empty-sub">Kamu belum memesan tiket.<br>Yuk tonton film favoritmu sekarang!</div>
        </div>`;
    } else {
      const movieNames = {
        cinlock: 'CinLock – Love, Camera, Action!',
        pertaruhan: 'Pertaruhan – The Series',
        horor: 'Rumah Kita',
        komedi: 'Pak RT Naik Jabatan',
      };
      const movieIcons = { cinlock: '🎬', pertaruhan: '💥', horor: '👻', komedi: '🤣' };
      el.innerHTML = `<div class="ticket-list">${
        this.bookedTickets.map((t, i) => `
          <div class="ticket-item">
            <div class="ticket-item-top">
              <div class="ticket-item-poster">${movieIcons[t.movie] || '🎬'}</div>
              <div class="ticket-item-info">
                <div class="ticket-item-title">${movieNames[t.movie] || t.movie}</div>
                <div class="ticket-item-cinema">${t.cinema || 'Bioskop Seatflix'}</div>
                <div class="ticket-item-time">${t.date}, ${t.time}</div>
              </div>
            </div>
            <div class="ticket-item-bottom">
              <div class="ticket-item-seats">Kursi: <span>${t.seats}</span></div>
              <div class="ticket-badge">✓ AKTIF</div>
            </div>
          </div>`).join('')
      }</div>`;
    }
  },

  // ===== POIN PAGE =====
  renderPoinPage() {
    const el = document.getElementById('poinAmount');
    if (el) el.innerHTML = `${this.poin} <span>poin</span>`;
  },

  // ===== AKUN PAGE =====
  renderAkunPage() {
    const providerInfo = {
      guest:    { icon: '👤', text: 'Masuk sebagai Tamu' },
      email:    { icon: '✉️', text: 'Masuk dengan Email' },
      facebook: { icon: 'f',  text: 'Masuk dengan Facebook' },
      google:   { icon: '🔵', text: 'Masuk dengan Google' },
    };
    const info = providerInfo[this.user.provider] || providerInfo['guest'];
    const avatarEl = document.getElementById('akunAvatar');
    const nameEl   = document.getElementById('akunName');
    const emailEl  = document.getElementById('akunEmail');
    const provIconEl = document.getElementById('akunProviderIcon');
    const provTextEl = document.getElementById('akunProviderText');

    if (avatarEl) avatarEl.textContent = this.user.name.charAt(0).toUpperCase() || '👤';
    if (nameEl)   nameEl.textContent   = this.user.name;
    if (emailEl)  emailEl.textContent  = this.user.email || '–';
    if (provIconEl) provIconEl.textContent = info.icon;
    if (provTextEl) provTextEl.textContent = info.text;
  },

  renderSeatGrid() {
    const grid = document.getElementById('seatGrid');
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const cols = 10;
    const booked = ['B3','B4','C5','D2','D7','E3','E8','F1','F6'];

    grid.innerHTML = '';
    rows.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'seat-row';
      const label = document.createElement('div');
      label.className = 'row-label';
      label.textContent = row;
      rowEl.appendChild(label);
      for (let col = 1; col <= cols; col++) {
        if (col === 4) {
          const aisle = document.createElement('div');
          aisle.className = 'seat-aisle';
          rowEl.appendChild(aisle);
        }
        const seatId = row + col;
        const seat = document.createElement('div');
        seat.className = 'seat';
        seat.dataset.id = seatId;
        if (booked.includes(seatId)) {
          seat.classList.add('booked');
        } else {
          seat.addEventListener('click', () => this.toggleSeat(seat, seatId));
        }
        rowEl.appendChild(seat);
      }
      grid.appendChild(rowEl);
    });
    this.updateSeatSummary();
  },

  toggleSeat(el, id) {
    if (el.classList.contains('selected')) {
      el.classList.remove('selected');
      this.selectedSeats = this.selectedSeats.filter(s => s !== id);
    } else {
      if (this.selectedSeats.length >= 6) { alert('Maksimal 6 kursi!'); return; }
      el.classList.add('selected');
      this.selectedSeats.push(id);
    }
    this.updateSeatSummary();
  },

  updateSeatSummary() {
    const count = this.selectedSeats.length;
    const total = count * this.ticketPrice;
    document.getElementById('seatCountLabel').textContent = count + ' Kursi';
    document.getElementById('seatPriceLabel').textContent = count > 0 ? 'Rp. ' + total.toLocaleString('id-ID') : 'Pilih kursi';
    document.getElementById('confirmSeats').disabled = count === 0;
  },

  renderOrderSummary() {
    const count = this.selectedSeats.length;
    const subtotal = count * this.ticketPrice;
    const total = subtotal + this.serviceFee;
    const seats = this.selectedSeats.join(', ');
    const dates = ['1 September','2 September','3 September','4 September','5 September'];
    const days = ['Senin','Selasa','Rabu','Kamis','Jumat'];
    const idx = this.selectedDate - 1;

    document.getElementById('summarySeats').textContent = seats;
    document.getElementById('summaryCount').textContent = count + ' Tiket';
    document.getElementById('summarySubtotal').textContent = 'Rp. ' + subtotal.toLocaleString('id-ID') + ' x' + count;
    document.getElementById('summaryService').textContent = 'Rp. ' + this.serviceFee.toLocaleString('id-ID');
    document.getElementById('summaryTotal').textContent = 'Rp. ' + total.toLocaleString('id-ID');
    document.getElementById('summaryDateTime').textContent = days[idx] + ', ' + dates[idx] + ' 2025, ' + this.selectedTime;

    // Update cinema name in order summary
    const cinemaNamEl = document.getElementById('summaryCinemaName');
    if (cinemaNamEl) cinemaNamEl.textContent = this.selectedCinemaName || 'Bioskop Seatflix';

    // ✅ FIX: Update judul film dan poster sesuai film yang dipilih
    const movieTitles = {
      cinlock:    'CinLock – Love, Camera, Action!',
      pertaruhan: 'Pertaruhan – The Series',
      horor:      'Rumah Kita',
      komedi:     'Pak RT Naik Jabatan',
    };
    const moviePosters = {
      cinlock:    'assets/img/cinlock.png',
      pertaruhan: 'assets/img/pertaruhan1.png',
      horor:      'assets/img/rumahkita.png',
      komedi:     'assets/img/pakrt.png',
    };

    const summaryMovieTitleEl = document.getElementById('summaryMovieTitle');
    if (summaryMovieTitleEl) summaryMovieTitleEl.textContent = movieTitles[this.currentMovie] || this.currentMovie;

    const summaryPosterEl = document.getElementById('summaryPoster');
    if (summaryPosterEl) {
      summaryPosterEl.src = moviePosters[this.currentMovie] || 'assets/img/cinlock.png';
      summaryPosterEl.alt = movieTitles[this.currentMovie] || 'Film';
    }
  },

  startPaymentTimer() {
    let seconds = 120;
    const el = document.getElementById('payCountdown');
    const interval = setInterval(() => {
      seconds--;
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      if (el) el.textContent = m + ':' + s;
      if (seconds <= 0) { clearInterval(interval); this.navigate('home'); }
    }, 1000);

    // Simulate payment success after 4 seconds
    setTimeout(() => {
      clearInterval(interval);
      this.saveBookedTicket();
      this.navigate('success');
      this.renderSuccessTicket();
    }, 4000);
  },

  saveBookedTicket() {
    const dates = ['1 September','2 September','3 September','4 September','5 September'];
    const days = ['Senin','Selasa','Rabu','Kamis','Jumat'];
    const idx = this.selectedDate - 1;
    this.bookedTickets.push({
      movie: this.currentMovie,
      seats: this.selectedSeats.join(', '),
      date: days[idx] + ', ' + dates[idx] + ' 2025',
      time: this.selectedTime,
      total: (this.selectedSeats.length * this.ticketPrice + this.serviceFee),
      cinema: this.selectedCinemaName || 'Bioskop Seatflix',
    });
    // Tambah poin: +10 per tiket
    this.poin += this.selectedSeats.length * 10;
  },

  generateQR() {
    const canvas = document.getElementById('qrCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    const cellSize = 8;
    const cells = size / cellSize;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    const seed = 42;
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        const hash = (i * 31 + j * 17 + seed) % 3;
        if (hash === 0) ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
    }
    const drawSquare = (x, y) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y, 56, 56);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 8, y + 8, 40, 40);
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 16, y + 16, 24, 24);
    };
    drawSquare(0, 0);
    drawSquare(144, 0);
    drawSquare(0, 144);
  },

  renderSuccessTicket() {
    const movieNames = {
      cinlock: 'CinLock',
      pertaruhan: 'Pertaruhan – The Series',
      horor: 'Rumah Kita',
      komedi: 'Pak RT Naik Jabatan',
    };
    const count = this.selectedSeats.length;
    const seats = this.selectedSeats.join(', ');
    const total = (count * this.ticketPrice + this.serviceFee).toLocaleString('id-ID');
    const movieEl = document.getElementById('ticketMovie');
    if (movieEl) movieEl.textContent = movieNames[this.currentMovie] || this.currentMovie;
    document.getElementById('ticketSeats').textContent = seats;
    document.getElementById('ticketTotal').textContent = 'Rp. ' + total;

    // Update cinema name in success page
    const ticketCinemaEl = document.getElementById('ticketCinema');
    if (ticketCinemaEl) ticketCinemaEl.textContent = this.selectedCinemaName || 'Bioskop Seatflix';
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());