const app = {
    user: null,
    users: JSON.parse(localStorage.getItem('biku_users')) || [],
    records: JSON.parse(localStorage.getItem('biku_records')) || [],

    seedData() {
        if (this.records.length === 0) {
            const sampleUsers = [
                { username: 'GreenRider', password: '123' },
                { username: 'KonkukKing', password: '123' },
                { username: 'BikuPro', password: '123' },
                { username: 'admin', password: 'admin123', isAdmin: true }
            ];
            const sampleRecords = [
                { username: 'GreenRider', distance: 120.5, elevation: 1200, date: '2024-03-01T10:00:00Z' },
                { username: 'KonkukKing', distance: 85.2, elevation: 600, date: '2024-03-01T11:00:00Z' },
                { username: 'BikuPro', distance: 150.0, elevation: 1800, date: '2024-02-28T09:00:00Z' },
                { username: 'GreenRider', distance: 45.0, elevation: 300, date: '2024-02-27T14:00:00Z' }
            ];

            if (this.users.length === 0) {
                this.users = sampleUsers;
                localStorage.setItem('biku_users', JSON.stringify(this.users));
            }
            this.records = sampleRecords;
            localStorage.setItem('biku_records', JSON.stringify(this.records));
        }
    },

    init() {
        this.seedData();
        this.checkAuth();
        this.navigate('home');
    },

    checkAuth() {
        const savedUser = localStorage.getItem('biku_current_user');
        if (savedUser) {
            this.user = JSON.parse(savedUser);
            this.updateNav();
        }
    },

    updateNav() {
        const authLink = document.getElementById('auth-link');
        const navLinks = document.getElementById('nav-links');

        // Remove existing admin link if any
        const existingAdmin = document.getElementById('nav-admin');
        if (existingAdmin) existingAdmin.remove();

        if (this.user) {
            authLink.innerText = `${this.user.username} (로그아웃)`;
            authLink.onclick = (e) => {
                e.preventDefault();
                this.logout();
            };

            if (this.user.isAdmin) {
                const li = document.createElement('li');
                li.id = 'nav-admin';
                li.innerHTML = `<a href="#" onclick="app.navigate('admin')">관리자</a>`;
                navLinks.insertBefore(li, authLink.parentElement);
            }
        } else {
            authLink.innerText = '로그인';
            authLink.onclick = (e) => {
                e.preventDefault();
                this.navigate('login');
            };
        }
    },

    navigate(view) {
        const content = document.getElementById('app-content');
        const template = document.getElementById(`view-${view}`);

        if (template) {
            content.innerHTML = '';
            content.appendChild(template.content.cloneNode(true));

            // Post-rendering logic
            if (view === 'dashboard') this.renderDashboard();
            if (view === 'rankings') this.renderRankings();
        }
    },

    signup() {
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;

        if (!username || !password) return alert('모든 필드를 입력해주세요.');
        if (this.users.find(u => u.username === username)) return alert('이미 존재하는 이름입니다.');

        const newUser = { username, password };
        this.users.push(newUser);
        localStorage.setItem('biku_users', JSON.stringify(this.users));

        alert('회원가입 성공!');
        this.navigate('login');
    },

    login() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        const user = this.users.find(u => u.username === username && u.password === password);
        if (user) {
            this.user = user;
            localStorage.setItem('biku_current_user', JSON.stringify(user));
            this.updateNav();
            this.navigate('dashboard');
        } else {
            alert('정보가 일치하지 않습니다.');
        }
    },

    logout() {
        this.user = null;
        localStorage.removeItem('biku_current_user');
        this.updateNav();
        this.navigate('home');
    },

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('image-preview');
            preview.src = e.target.result;
            document.getElementById('preview-container').style.display = 'block';
            document.getElementById('upload-placeholder').style.display = 'none';
            this.simulateExtraction();
        };
        reader.readAsDataURL(file);
    },

    simulateExtraction() {
        document.getElementById('upload-area').style.pointerEvents = 'none';
        document.getElementById('extraction-status').style.display = 'block';

        setTimeout(() => {
            // Simulated extraction results
            const randomDist = (Math.random() * 50 + 10).toFixed(1);
            const randomElev = Math.floor(Math.random() * 800 + 100);

            document.getElementById('ride-distance').value = randomDist;
            document.getElementById('ride-elevation').value = randomElev;

            document.getElementById('extraction-status').style.display = 'none';
            document.getElementById('record-form').style.display = 'block';
        }, 2000);
    },

    resetUpload() {
        this.navigate('records');
    },

    submitRecord() {
        if (!this.user) return alert('로그인이 필요합니다.');

        const distance = parseFloat(document.getElementById('ride-distance').value);
        const elevation = parseFloat(document.getElementById('ride-elevation').value);

        if (isNaN(distance) || isNaN(elevation)) return alert('올바른 값을 입력해주세요.');

        const newRecord = {
            username: this.user.username,
            distance,
            elevation,
            date: new Date().toISOString()
        };

        this.records.push(newRecord);
        localStorage.setItem('biku_records', JSON.stringify(this.records));

        alert('기록이 저장되었습니다!');
        this.navigate('dashboard');
    },

    renderDashboard() {
        if (!this.user) return;

        const userRecords = this.records.filter(r => r.username === this.user.username);
        const totalDist = userRecords.reduce((sum, r) => sum + r.distance, 0);
        const totalElev = userRecords.reduce((sum, r) => sum + r.elevation, 0);

        document.getElementById('stats-total-dist').innerText = totalDist.toFixed(1);
        document.getElementById('stats-total-elev').innerText = totalElev.toLocaleString();

        const list = document.getElementById('recent-records-list');
        list.innerHTML = userRecords.reverse().slice(0, 5).map(r => `
            <div style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span style="color: var(--secondary)">${r.distance}km</span> / 
                <span>${r.elevation}m</span>
                <div style="font-size: 0.7rem; color: var(--text-muted);">${new Date(r.date).toLocaleDateString()}</div>
            </div>
        `).join('') || '<p style="color: var(--text-muted);">기록이 없습니다.</p>';
    },

    renderRankings() {
        // ... (existing logic)
    },

    renderAdmin() {
        if (!this.user || !this.user.isAdmin) return this.navigate('home');

        // User Management Table
        const userTbody = document.getElementById('admin-user-table-body');
        userTbody.innerHTML = this.users.filter(u => !u.isAdmin).map(u => `
            <tr>
                <td>${u.username}</td>
                <td><button class="btn" style="background: rgba(255,0,0,0.1); color: #ff4444; padding: 0.5rem 1rem;" onclick="app.deleteUser('${u.username}')">삭제</button></td>
            </tr>
        `).join('') || '<tr><td colspan="2">유저가 없습니다.</td></tr>';

        // Record Management Table
        const recordTbody = document.getElementById('admin-record-table-body');
        recordTbody.innerHTML = this.records.map((r, i) => `
            <tr>
                <td>${r.username}</td>
                <td>${r.distance}km / ${r.elevation}m</td>
                <td>${new Date(r.date).toLocaleDateString()}</td>
                <td><button class="btn" style="background: rgba(255,0,0,0.1); color: #ff4444; padding: 0.5rem 1rem;" onclick="app.deleteRecord(${i})">삭제</button></td>
            </tr>
        `).join('') || '<tr><td colspan="4">기록이 없습니다.</td></tr>';
    },

    deleteUser(username) {
        if (!confirm(`${username} 회원을 삭제하시겠습니까?`)) return;
        this.users = this.users.filter(u => u.username !== username);
        this.records = this.records.filter(r => r.username !== username);
        localStorage.setItem('biku_users', JSON.stringify(this.users));
        localStorage.setItem('biku_records', JSON.stringify(this.records));
        this.renderAdmin();
    },

    deleteRecord(index) {
        if (!confirm('기록을 삭제하시겠습니까?')) return;
        this.records.splice(index, 1);
        localStorage.setItem('biku_records', JSON.stringify(this.records));
        this.renderAdmin();
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
