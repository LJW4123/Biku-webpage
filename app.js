const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const STRAVA_CLIENT_ID = "207086";
const STRAVA_CLIENT_SECRET = "759c953db887babbfc676ae8acab74238ae40ce5";
const STRAVA_REDIRECT_URI = "https://ljw4123.github.io/BiKU-webpages/";

const app = {
    user: null,
    users: [],
    records: [],
    currentStravaToken: null,
    currentMapPolyline: null,

    async init() {
        this.checkAuth();
        await this.fetchData();
        await this.handleStravaCallback();
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
        this.currentStravaToken = null;
        this.updateNav();
        this.navigate('home');
    },

    connectStrava() {
        const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${STRAVA_REDIRECT_URI}&response_type=code&scope=activity:read_all`;
        window.location.href = authUrl;
    },

    async handleStravaCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            // Remove code from URL for clean navigation
            window.history.replaceState({}, document.title, window.location.pathname);

            try {
                const response = await fetch('https://www.strava.com/oauth/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client_id: STRAVA_CLIENT_ID,
                        client_secret: STRAVA_CLIENT_SECRET,
                        code: code,
                        grant_type: 'authorization_code'
                    })
                });
                const data = await response.json();
                if (data.access_token) {
                    this.currentStravaToken = data.access_token;
                    this.navigate('records');
                    setTimeout(() => this.fetchStravaActivities(), 500);
                }
            } catch (error) {
                console.error('Strava token exchange failed:', error);
            }
        }
    },

    async fetchStravaActivities() {
        if (!this.currentStravaToken) return;

        const listContainer = document.getElementById('strava-activity-list');
        listContainer.style.display = 'block';
        listContainer.innerHTML = '<div style="padding: 1rem; text-align:center;"><div class="loader" style="margin: 0 auto;"></div><p>활동 불러오는 중...</p></div>';

        try {
            const response = await fetch('https://www.strava.com/api/v3/athlete/activities', {
                headers: { 'Authorization': `Bearer ${this.currentStravaToken}` }
            });
            const activities = await response.json();

            listContainer.innerHTML = activities.filter(a => a.type === 'Ride').map(a => `
                <div class="activity-item" onclick="app.selectStravaActivity('${a.id}')" style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: background 0.2s;">
                    <div style="font-weight: 600;">${a.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">
                        ${(a.distance / 1000).toFixed(2)}km | ${a.total_elevation_gain}m | ${new Date(a.start_date).toLocaleDateString()}
                    </div>
                </div>
            `).join('') || '<p style="padding: 1rem; color: var(--text-muted);">라이딩 활동이 없습니다.</p>';
        } catch (error) {
            listContainer.innerHTML = '<p style="padding: 1rem; color: #ff4444;">활동을 불러오지 못했습니다.</p>';
        }
    },

    async selectStravaActivity(activityId) {
        try {
            const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
                headers: { 'Authorization': `Bearer ${this.currentStravaToken}` }
            });
            const activity = await response.json();

            document.getElementById('ride-distance').value = (activity.distance / 1000).toFixed(2);
            document.getElementById('ride-elevation').value = Math.round(activity.total_elevation_gain);

            document.getElementById('record-form').style.display = 'block';
            document.getElementById('upload-area').style.display = 'none';
            document.getElementById('strava-sync-section').style.display = 'none';
            document.getElementById('strava-activity-list').style.display = 'none';

            if (activity.map && activity.map.summary_polyline) {
                this.currentMapPolyline = activity.map.summary_polyline;
                this.renderMapPreview(activity.map.summary_polyline);
            }
        } catch (error) {
            alert('활동 정보를 가져오지 못했습니다.');
        }
    },

    renderMapPreview(polyline) {
        const mapContainer = document.getElementById('map-preview');
        mapContainer.style.display = 'block';

        // Leaflet maps need a clean container
        if (this.previewMap) this.previewMap.remove();

        this.previewMap = L.map('map-preview');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(this.previewMap);

        const coordinates = this.decodePolyline(polyline);
        const line = L.polyline(coordinates, { color: '#fc4c02', weight: 4 }).addTo(this.previewMap);
        this.previewMap.fitBounds(line.getBounds());
    },

    decodePolyline(str, precision = 5) {
        let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, lat_change, lng_change, factor = Math.pow(10, precision);
        while (index < str.length) {
            byte = null; shift = 0; result = 0;
            do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
            lat_change = ((result & 1) ? ~(result >> 1) : (result >> 1)); lat += lat_change;
            byte = null; shift = 0; result = 0;
            do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
            lng_change = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += lng_change;
            coordinates.push([lat / factor, lng / factor]);
        }
        return coordinates;
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
                image: this.currentUploadImage,
                map_polyline: this.currentMapPolyline, // Store map data
                status: 'pending'
            }]);

        if (error) return alert('기록 저장 중 오류가 발생했습니다.');

        this.currentUploadImage = null;
        this.currentMapPolyline = null;
        alert('기록이 제출되었습니다! 스트라바 데이터가 포함되었습니다.');
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
        list.innerHTML = userRecords.slice(0, 5).map(r => {
            let statusBadge = '';
            if (r.status === 'pending') statusBadge = '<span style="font-size: 0.7rem; background: rgba(255,200,0,0.2); color: #ffcc00; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">대기 중</span>';
            else if (r.status === 'rejected') statusBadge = '<span style="font-size: 0.7rem; background: rgba(255,0,0,0.2); color: #ff4444; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">반려됨</span>';
            else statusBadge = '<span style="font-size: 0.7rem; background: rgba(0,255,136,0.2); color: var(--secondary); padding: 2px 6px; border-radius: 4px; margin-left: 8px;">승인됨</span>';

            return `
                <div style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 1rem;">
                    ${r.image ? `<img src="${r.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid var(--glass-border);">` :
                    (r.map_polyline ? `<div id="map-thumb-${r.id}" style="width: 50px; height: 50px; border-radius: 8px; background: rgba(0,0,0,0.5); overflow: hidden;"></div>` :
                        '<div style="width: 50px; height: 50px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">No Pic</div>')}
                    <div style="flex: 1;">
                        <span style="color: var(--secondary)">${r.distance}km</span> / 
                        <span>${r.elevation}m</span>
                        ${statusBadge}
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                </div>
            `;
        }).join('') || '<p style="color: var(--text-muted);">기록이 없습니다.</p>';

        // Post-render map thumbnails if any
        userRecords.slice(0, 5).forEach(r => {
            if (r.map_polyline && !r.image) {
                setTimeout(() => {
                    const thumb = L.map(`map-thumb-${r.id}`, { zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false }).setView([0, 0], 10);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(thumb);
                    const coords = this.decodePolyline(r.map_polyline);
                    const line = L.polyline(coords, { color: '#fc4c02' }).addTo(thumb);
                    thumb.fitBounds(line.getBounds());
                }, 100);
            }
        });
    },

    async renderRankings() {
        await this.fetchData();
        const approvedRecords = this.records.filter(r => r.status === 'approved');
        const userStats = {};
        approvedRecords.forEach(r => {
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

        if (recordTbody) {
            recordTbody.innerHTML = this.records.map((r, i) => {
                let statusInfo = '';
                if (r.status === 'pending') {
                    statusInfo = `<span style="color: #ffcc00; font-size: 0.8rem;">[대기]</span>`;
                } else if (r.status === 'rejected') {
                    statusInfo = `<span style="color: #ff4444; font-size: 0.8rem;">[반려]</span>`;
                } else {
                    statusInfo = `<span style="color: var(--secondary); font-size: 0.8rem;">[승인]</span>`;
                }

                return `
                    <tr>
                        <td>${r.username} ${statusInfo}</td>
                        <td>${r.distance}km / ${r.elevation}m</td>
                        <td>${new Date(r.created_at).toLocaleDateString()}</td>
                        <td>
                            <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                                <button class="btn" style="background: rgba(0,255,136,0.1); color: var(--secondary); padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="app.viewFullImage(${i})">사진/지도</button>
                                ${r.status === 'pending' ? `
                                    <button class="btn" style="background: rgba(0,255,136,0.2); color: var(--secondary); padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="app.approveRecord('${r.id}')">승인</button>
                                    <button class="btn" style="background: rgba(255,0,0,0.2); color: #ff4444; padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="app.rejectRecord('${r.id}')">반려</button>
                                ` : ''}
                                <button class="btn" style="background: rgba(255,153,0,0.1); color: #ff9900; padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="app.openEditModal('${r.id}')">수정</button>
                                <button class="btn" style="background: rgba(255,0,0,0.1); color: #ff4444; padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="app.deleteRecord('${r.id}')">삭제</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('') || '<tr><td colspan="4">기록이 없습니다.</td></tr>';
        }
    },

    async approveRecord(id) {
        const { error } = await _supabase
            .from('biku_records')
            .update({ status: 'approved' })
            .eq('id', id);

        if (error) return alert('승인 중 오류가 발생했습니다.');
        alert('기록이 승인되었습니다.');
        await this.fetchData();
        await this.renderAdmin();
    },

    async rejectRecord(id) {
        if (!confirm('이 기록을 반려하시겠습니까?')) return;
        const { error } = await _supabase
            .from('biku_records')
            .update({ status: 'rejected' })
            .eq('id', id);

        if (error) return alert('반려 중 오류가 발생했습니다.');
        alert('기록이 반려되었습니다.');
        await this.fetchData();
        await this.renderAdmin();
    },

    viewFullImage(index) {
        const record = this.records[index];
        if (!record) return;

        const win = window.open("");
        let content = '';
        if (record.image) {
            content = `<img src="${record.image}" style="max-width:100%; height:auto; display: block; margin: 0 auto;">`;
        } else if (record.map_polyline) {
            content = `
                <div id="big-map" style="height: 100vh; width: 100vw;"></div>
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
                <script>
                    window.onload = () => {
                        const map = L.map('big-map');
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                        const coords = ${JSON.stringify(this.decodePolyline(record.map_polyline))};
                        const line = L.polyline(coords, { color: '#fc4c02', weight: 5 }).addTo(map);
                        map.fitBounds(line.getBounds());
                    }
                <\/script>
            `;
        } else {
            return alert('이미지나 지도 데이터가 없습니다.');
        }

        win.document.write(`
            <html><head><title>${record.username}의 기록 확인</title></head>
            <body style="margin:0; background: #0a0a0a; color: white;">${content}</body></html>
        `);
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
    },

    openEditModal(id) {
        const record = this.records.find(r => r.id === id);
        if (!record) return;

        document.getElementById('edit-record-id').value = record.id;
        document.getElementById('edit-ride-distance').value = record.distance;
        document.getElementById('edit-ride-elevation').value = record.elevation;
        document.getElementById('edit-modal').style.display = 'flex';
    },

    closeEditModal() {
        document.getElementById('edit-modal').style.display = 'none';
    },

    async saveEdit() {
        const id = document.getElementById('edit-record-id').value;
        const distance = parseFloat(document.getElementById('edit-ride-distance').value);
        const elevation = parseInt(document.getElementById('edit-ride-elevation').value);

        if (isNaN(distance) || isNaN(elevation)) return alert('올바른 값을 입력해주세요.');

        const { error } = await _supabase
            .from('biku_records')
            .update({ distance, elevation })
            .eq('id', id);

        if (error) return alert('수정 중 오류가 발생했습니다.');

        alert('기록이 수정되었습니다.');
        this.closeEditModal();
        await this.fetchData();
        await this.renderAdmin();
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
