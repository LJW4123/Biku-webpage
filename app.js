const SUPABASE_URL = "https://olxqpibwexdpluthrqvb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9seHFwaWJ3ZXhkcGx1dGhycXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzQ5MjYsImV4cCI6MjA4Nzk1MDkyNn0.okbZVJbiE7sg4B1Jd0BmJYeGfVOQ3EoO26QVOhsfAy4";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const app = {
    user: null,
    users: [],
    records: [],

    async init() {
        this.checkAuth();
        await this.fetchData();
        this.navigate('home');
    },

    async fetchData() {
        const { data: users } = await _supabase.from('biku_users').select('*');
        const { data: records } = await _supabase.from('biku_records').select('*').order('created_at', { ascending: false });

        this.users = users || [];
        this.records = records || [];
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

        const existingAdmin = document.getElementById('nav-admin');
        if (existingAdmin) existingAdmin.remove();

        if (this.user) {
            authLink.innerText = `${this.user.username} (로그아웃)`;
            authLink.onclick = (e) => {
                e.preventDefault();
                this.logout();
            };

            if (this.user.is_admin) {
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

    async navigate(view) {
        const content = document.getElementById('app-content');
        const template = document.getElementById(`view-${view}`);

        if (template) {
            content.innerHTML = '';
            content.appendChild(template.content.cloneNode(true));

            if (view === 'dashboard') await this.renderDashboard();
            if (view === 'rankings') await this.renderRankings();
            if (view === 'admin') await this.renderAdmin();
        }
    },

    async signup() {
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;

        if (!username || !password) return alert('모든 필드를 입력해주세요.');

        const { data, error } = await _supabase
            .from('biku_users')
            .insert([{ username, password }])
            .select();

        if (error) {
            if (error.code === '23505') return alert('이미 존재하는 이름입니다.');
            return alert('회원가입 중 오류가 발생했습니다.');
        }

        alert('회원가입 성공!');
        await this.fetchData();
        this.navigate('login');
    },

    async login() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        const { data: user, error } = await _supabase
            .from('biku_users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

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
            const imageData = e.target.result;
            const preview = document.getElementById('image-preview');
            preview.src = imageData;
            document.getElementById('preview-container').style.display = 'block';
            document.getElementById('upload-placeholder').style.display = 'none';
            this.currentUploadImage = imageData;
            this.simulateExtraction();
        };
        reader.readAsDataURL(file);
    },

    simulateExtraction() {
        document.getElementById('upload-area').style.pointerEvents = 'none';
        document.getElementById('extraction-status').style.display = 'block';
        document.getElementById('record-form').style.display = 'none';

        const delay = 1500 + Math.random() * 2000;

        setTimeout(() => {
            const distBase = 20 + Math.random() * 40;
            const elevBase = 100 + Math.random() * 500;

            document.getElementById('ride-distance').value = distBase.toFixed(2);
            document.getElementById('ride-elevation').value = Math.round(elevBase);

            document.getElementById('extraction-status').style.display = 'none';
            document.getElementById('record-form').style.display = 'block';
            document.getElementById('upload-area').style.pointerEvents = 'auto';
        }, delay);
    },

    resetUpload() {
        this.navigate('records');
    },

    async submitRecord() {
        if (!this.user) return alert('로그인이 필요합니다.');

        const distance = parseFloat(document.getElementById('ride-distance').value);
        const elevation = parseFloat(document.getElementById('ride-elevation').value);

        if (isNaN(distance) || isNaN(elevation)) return alert('올바른 값을 입력해주세요.');

        const { error } = await _supabase
            .from('biku_records')
            .insert([{
                username: this.user.username,
                distance,
                elevation,
                image: this.currentUploadImage
            }]);

        if (error) return alert('기록 저장 중 오류가 발생했습니다.');

        this.currentUploadImage = null;
        alert('기록이 클라우드에 저장되었습니다!');
        await this.fetchData();
        this.navigate('dashboard');
    },

    async renderDashboard() {
        if (!this.user) return;

        await this.fetchData();
        const userRecords = this.records.filter(r => r.username === this.user.username);
        const totalDist = userRecords.reduce((sum, r) => sum + r.distance, 0);
        const totalElev = userRecords.reduce((sum, r) => sum + Number(r.elevation), 0);

        document.getElementById('stats-total-dist').innerText = totalDist.toFixed(1);
        document.getElementById('stats-total-elev').innerText = totalElev.toLocaleString();

        const list = document.getElementById('recent-records-list');
        list.innerHTML = userRecords.slice(0, 5).map(r => `
            <div style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 1rem;">
                ${r.image ? `<img src="${r.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid var(--glass-border);">` : '<div style="width: 50px; height: 50px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">No Pic</div>'}
                <div>
                    <span style="color: var(--secondary)">${r.distance}km</span> / 
                    <span>${r.elevation}m</span>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${new Date(r.created_at).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('') || '<p style="color: var(--text-muted);">기록이 없습니다.</p>';
    },

    async renderRankings() {
        await this.fetchData();
        const userStats = {};
        this.records.forEach(r => {
            if (!userStats[r.username]) {
                userStats[r.username] = { distance: 0, elevation: 0, count: 0 };
            }
            userStats[r.username].distance += r.distance;
            userStats[r.username].elevation += Number(r.elevation);
            userStats[r.username].count += 1;
        });

        const sorted = Object.entries(userStats)
            .map(([username, stats]) => ({ username, ...stats }))
            .sort((a, b) => b.distance - a.distance);

        const tbody = document.getElementById('ranking-table-body');
        if (!tbody) return;
        tbody.innerHTML = sorted.map((u, i) => {
            let rankClass = '';
            if (i === 0) rankClass = 'rank-badge rank-1';
            else if (i === 1) rankClass = 'rank-badge rank-2';
            else if (i === 2) rankClass = 'rank-badge rank-3';
            else rankClass = 'rank-badge';

            return `
                <tr>
                    <td><span class="${rankClass}">${i + 1}</span></td>
                    <td style="font-weight: 600;">${u.username}</td>
                    <td>${u.distance.toFixed(1)} km</td>
                    <td>${(u.elevation / u.count).toFixed(0)} m</td>
                </tr>
            `;
        }).join('');
    },

    async renderAdmin() {
        if (!this.user || !this.user.is_admin) return this.navigate('home');

        await this.fetchData();
        const userTbody = document.getElementById('admin-user-table-body');
        if (userTbody) {
            userTbody.innerHTML = this.users.filter(u => !u.is_admin).map(u => `
                <tr>
                    <td>${u.username}</td>
                    <td><button class="btn" style="background: rgba(255,0,0,0.1); color: #ff4444; padding: 0.5rem 1rem;" onclick="app.deleteUser('${u.username}')">삭제</button></td>
                </tr>
            `).join('') || '<tr><td colspan="2">유저가 없습니다.</td></tr>';
        }

        const recordTbody = document.getElementById('admin-record-table-body');
        if (recordTbody) {
            recordTbody.innerHTML = this.records.map((r, i) => `
                <tr>
                    <td>${r.username}</td>
                    <td>${r.distance}km / ${r.elevation}m</td>
                    <td>${new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn" style="background: rgba(0,255,136,0.1); color: var(--secondary); padding: 0.5rem 1rem;" onclick="app.viewFullImage(${i})">사진</button>
                        <button class="btn" style="background: rgba(255,0,0,0.1); color: #ff4444; padding: 0.5rem 1rem;" onclick="app.deleteRecord('${r.id}')">삭제</button>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="4">기록이 없습니다.</td></tr>';
        }
    },

    viewFullImage(index) {
        const record = this.records[index];
        if (!record || !record.image) return alert('이미지가 없는 기록입니다.');
        const win = window.open("");
        win.document.write(`<img src="${record.image}" style="max-width:100%; height:auto; display: block; margin: 0 auto; background: #0a0a0a;">`);
        win.document.body.style.background = "#0a0a0a";
    },

    async deleteUser(username) {
        if (!confirm(`${username} 회원을 삭제하시겠습니까?`)) return;
        await _supabase.from('biku_records').delete().eq('username', username);
        await _supabase.from('biku_users').delete().eq('username', username);
        await this.renderAdmin();
    },

    async deleteRecord(id) {
        if (!confirm('기록을 삭제하시겠습니까?')) return;
        await _supabase.from('biku_records').delete().eq('id', id);
        await this.renderAdmin();
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
