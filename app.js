const SUPABASE_URL = "https://olxqpibwexdpluthrqvb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9seHFwaWJ3ZXhkcGx1dGhycXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzQ5MjYsImV4cCI6MjA4Nzk1MDkyNn0.okbZVJbiE7sg4B1Jd0BmJYeGfVOQ3EoO26QVOhsfAy4";
const _supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const STRAVA_CLIENT_ID = "207086";
const STRAVA_CLIENT_SECRET = "759c953db887babbfc676ae8acab74238ae40ce5";
const STRAVA_REDIRECT_URI = "https://ljw4123.github.io/Biku-webpage/";

const app = {
    user: null,
    users: [],
    records: [],
    posts: [],
    comments: [],
    currentPostId: null,
    currentStravaToken: null,
    currentMapPolyline: null,
    currentStravaData: null,

    // Achievement Definitions
    ACHIEVEMENTS: [
        { id: 'first_ride', title: '첫 페달링', desc: '바이쿠에서 첫 번째 라이딩 인증에 성공했습니다!', icon: '🏁', req: '첫 인증 완료', check: (stats) => stats.count >= 1 },

        // Distance Achievements: "Konkuk Univ to XX"
        { id: 'dist_seongsu', title: '건대에서 성수동까지', desc: '아기 라이더의 첫걸음! 성수동 카페거리까지 왔네요.', icon: '🌱', req: '누적 5km', check: (stats) => stats.totalDist >= 5 },
        { id: 'dist_jamsil', title: '건대에서 잠실타워까지', desc: '롯데타워가 코앞에! 한강 다리 하나를 건넜습니다.', icon: '🗼', req: '누적 10km', check: (stats) => stats.totalDist >= 10 },
        { id: 'dist_namsan', title: '건대에서 남산까지', desc: '서울의 중심 남산까지! 이제 제법 장거리가 익숙해집니다.', icon: '🏯', req: '누적 20km', check: (stats) => stats.totalDist >= 20 },
        { id: 'dist_bugak', title: '건대에서 북악까지', desc: '업힐 성지 북악까지! 엔진이 점점 강력해지고 있어요.', icon: '⛰️', req: '누적 40km', check: (stats) => stats.totalDist >= 40 },
        { id: 'dist_incheon', title: '건대에서 인천앞바다까지', desc: '드디어 바다가 보입니다! 서해갑문까지의 거리 돌파.', icon: '🌊', req: '누적 60km', check: (stats) => stats.totalDist >= 60 },
        { id: 'dist_chuncheon', title: '건대에서 춘천까지', desc: '경기관계를 벗어나 강원도까지! 춘천 닭갈비 한 그릇 어떠세요?', icon: '🍗', req: '누적 100km', check: (stats) => stats.totalDist >= 100 },
        { id: 'dist_daejeon', title: '건대에서 대전까지', desc: '충청도를 지나 국토의 절반을 향해! 성심당이 머지 않았습니다.', icon: '🥖', req: '누적 200km', check: (stats) => stats.totalDist >= 200 },
        { id: 'dist_busan', title: '건대에서 부산까지', desc: '국토종주 달성! 건대에서 부산까지 이어진 위대한 여정.', icon: '⛱️', req: '누적 600km', check: (stats) => stats.totalDist >= 600 },
        { id: 'dist_grand', title: '국토종주 왕복', desc: '바이쿠의 전설. 한반도를 자전거로 왕복한 마스터입니다.', icon: '👑', req: '누적 1,200km', check: (stats) => stats.totalDist >= 1200 },

        // Elevation Achievements: Mountain Metaphors
        { id: 'elev_namsan', title: '서울의 상징 남산', desc: '서울 라이더의 성지, 남산의 높이를 정복했습니다.', icon: '🌳', req: '누적 획득고도 270m', check: (stats) => stats.totalElev >= 270 },
        { id: 'elev_achasan', title: '건대 뒷산 아차산', desc: '우리 학교 뒷산, 아차산을 가뿐히 넘었습니다.', icon: '🌿', req: '누적 획득고도 300m', check: (stats) => stats.totalElev >= 300 },
        { id: 'elev_bukhansan', title: '거대한 암벽 북한산', desc: '서울 최고봉 백운대의 높이를 돌파했습니다.', icon: '🧗', req: '누적 획득고도 836m', check: (stats) => stats.totalElev >= 836 },
        { id: 'elev_hallasan', title: '남한 최고봉 한라산', desc: '구름 위를 달리는 라이더! 백록담 높이를 돌파했습니다.', icon: '🌋', req: '누적 획득고도 1,947m', check: (stats) => stats.totalElev >= 1947 },
        { id: 'elev_fuji', title: '일본의 영산 후지산', desc: '3,776m의 고지! 이제 웬만한 오르막은 우습네요.', icon: '❄️', req: '누적 획득고도 3,776m', check: (stats) => stats.totalElev >= 3776 },
        { id: 'elev_kilimanjaro', title: '아프리카의 꽃 킬리만자로', desc: '적도의 눈, 킬리만자로 정상에 도달한 기분입니다.', icon: '🦒', req: '누적 획득고도 5,895m', check: (stats) => stats.totalElev >= 5895 },
        { id: 'elev_everest', title: '세계의 지붕 에베레스트', desc: '지구상 가장 높은 곳까지 올랐습니다. 불가능이란 없습니다.', icon: '🏔️', req: '누적 획득고도 8,848m', check: (stats) => stats.totalElev >= 8848 },

        // Special Stats & Others
        { id: 'diligent_biku', title: '성실한 바이쿠', desc: '꾸준함이 실력입니다. 총 50회의 라이딩을 인증했습니다.', icon: '🥇', req: '인증 50회', check: (stats) => stats.count >= 50 },
        { id: 'beginner_1', title: '초보 라이더의 시작', desc: '자전거와 친해지는 중! 누적 50km를 달성했습니다.', icon: '🐣', req: '누적 50km', check: (stats) => stats.totalDist >= 50 },
        { id: 'safety_first', title: '안전 제일', desc: '여유롭고 안전한 라이딩을 즐깁니다. (평속 20km/h 미만, 10km 이상)', icon: '⛑️', req: '평속 < 20km/h & 거리 > 10km', check: (stats, records) => records.some(r => r.average_speed > 0 && r.average_speed < 20 && r.distance >= 10) },
        { id: 'tt_fan', title: '따릉이 대장', desc: '공공자전거의 진정한 팬! 따릉이로 10회 인증했습니다.', icon: '🚲', req: '따릉이 인증 10회', check: (stats) => stats.ttCount >= 10 },

        // Strava-only achievements
        { id: 'strava_ilgamho', title: '일감호 라이더', desc: '건국대의 상징, 일감호를 돌았습니다. (Strava 인증 전용)', icon: 'Swan', icon: '🦢', req: '일감호 경로 포함 (Strava)', check: (stats, records) => records.some(r => r.map_polyline && r.status === 'approved') },
        { id: 'strava_master', title: 'GPS 마스터', desc: '지도로 기록을 남기는 완벽주의자. Strava 인증 10회 돌파!', icon: '🛰️', req: 'Strava 인증 10회', check: (stats) => stats.stravaCount >= 10 }
    ],

    async init() {
        // UI를 먼저 표시하여 "먹통" 현상 방지
        this.navigate('home');

        try {
            this.checkAuth();
            await this.fetchData();
            await this.handleStravaCallback();
        } catch (e) {
            console.error("Initialization error:", e);
        }
    },

    async fetchData() {
        if (!_supabase) return console.error("Supabase client is not initialized.");

        try {
            const { data: users, error: userError } = await _supabase.from('biku_users').select('*');
            if (userError) console.warn("Supabase users fetch error:", userError);

            const { data: records, error: recordError } = await _supabase.from('biku_records').select('*').order('created_at', { ascending: false });
            if (recordError) console.warn("Supabase records fetch error:", recordError);

            const { data: posts, error: postError } = await _supabase.from('biku_posts').select('*').order('created_at', { ascending: false });
            if (postError) console.warn("Supabase posts fetch error:", postError);

            const { data: comments, error: commentError } = await _supabase.from('biku_comments').select('*').order('created_at', { ascending: true });
            if (commentError) console.warn("Supabase comments fetch error:", commentError);

            this.users = users || [];
            this.records = records || [];
            this.posts = posts || [];
            this.comments = comments || [];
        } catch (e) {
            console.error("fetchData failed:", e);
        }
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
        const templateId = view.startsWith('post-') ? 'view-post-detail' : `view-${view}`;
        const template = document.getElementById(templateId);

        if (template) {
            content.innerHTML = '';
            content.appendChild(template.content.cloneNode(true));

            if (view === 'dashboard') await this.renderDashboard();
            if (view === 'activity') await this.renderActivity();
            if (view === 'community') await this.renderCommunity();
            if (view.startsWith('post-')) await this.renderPostDetail(view.slice(5));
            if (view === 'my-records') await this.renderMyRecords();
            if (view === 'rankings') await this.renderRankings();
            if (view === 'achievements') await this.renderAchievements();
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

            const dist = (activity.distance / 1000).toFixed(2);
            const elev = Math.round(activity.total_elevation_gain);
            const timeMins = Math.round(activity.moving_time / 60);
            const avgSpeed = (activity.average_speed * 3.6).toFixed(1);
            const maxSpeed = (activity.max_speed * 3.6).toFixed(1);

            // Format start_date_local for datetime-local input (YYYY-MM-DDTHH:mm)
            const startDate = activity.start_date_local ? activity.start_date_local.substring(0, 16) : '';

            // Populate and make read-only
            const fields = [
                { id: 'ride-date', val: startDate },
                { id: 'ride-distance', val: dist },
                { id: 'ride-elevation', val: elev },
                { id: 'ride-time', val: timeMins },
                { id: 'ride-avg-speed', val: avgSpeed },
                { id: 'ride-max-speed', val: maxSpeed }
            ];

            fields.forEach(f => {
                const el = document.getElementById(f.id);
                el.value = f.val;
                el.readOnly = true;
                el.style.opacity = '0.7';
                el.style.cursor = 'not-allowed';
            });

            this.currentStravaData = {
                moving_time: activity.moving_time,
                average_speed: avgSpeed,
                max_speed: maxSpeed
            };

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
        this.currentUploadImage = null;
        this.currentMapPolyline = null;
        this.currentStravaData = null;

        // Reset read-only status and values
        const ids = ['ride-date', 'ride-distance', 'ride-elevation', 'ride-time', 'ride-avg-speed', 'ride-max-speed'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = '';
                el.readOnly = false;
                el.style.opacity = '1';
                el.style.cursor = 'text';
            }
        });

        const preview = document.getElementById('image-preview');
        if (preview) preview.src = '';
        const previewCont = document.getElementById('preview-container');
        if (previewCont) previewCont.style.display = 'none';

        const mapCont = document.getElementById('map-preview');
        if (mapCont) mapCont.style.display = 'none';

        this.navigate('records');
    },

    async submitRecord() {
        if (!this.user) return alert('로그인이 필요합니다.');

        const rideDate = document.getElementById('ride-date').value;
        const distance = parseFloat(document.getElementById('ride-distance').value);
        const elevation = parseFloat(document.getElementById('ride-elevation').value);
        const movingTimeMins = parseFloat(document.getElementById('ride-time').value) || 0;
        const avgSpeed = parseFloat(document.getElementById('ride-avg-speed').value) || 0;
        const maxSpeed = parseFloat(document.getElementById('ride-max-speed').value) || 0;

        if (!rideDate || isNaN(distance) || isNaN(elevation)) return alert('일시, 거리, 고도를 입력해주세요.');

        const isStrava = !!this.currentMapPolyline;
        const status = isStrava ? 'approved' : 'pending';

        const { error } = await _supabase
            .from('biku_records')
            .insert([{
                username: this.user.username,
                distance,
                elevation: Math.round(elevation),
                image: this.currentUploadImage,
                map_polyline: this.currentMapPolyline,
                moving_time: movingTimeMins * 60,
                average_speed: Number(avgSpeed),
                max_speed: Number(maxSpeed),
                status,
                is_ttareungyi: document.getElementById('is-ttareungyi').checked,
                created_at: new Date(rideDate).toISOString()
            }]);

        if (error) return alert('기록 저장 중 오류가 발생했습니다.');

        // Success cleanup
        const ids = ['ride-date', 'ride-distance', 'ride-elevation', 'ride-time', 'ride-avg-speed', 'ride-max-speed'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.readOnly = false;
                el.style.opacity = '1';
                el.style.cursor = 'text';
            }
        });

        this.currentUploadImage = null;
        this.currentMapPolyline = null;
        this.currentStravaData = null;

        if (isStrava) {
            alert('스트라바 기록이 인증되었습니다! (자동 승인 완료)');
        } else {
            alert('기록이 제출되었습니다! 관리자 승인 후 반영됩니다.');
        }

        await this.fetchData();
        this.navigate('my-records');
    },

    async renderDashboard() {
        if (!this.user) return;

        await this.fetchData();
        const userRecords = this.records.filter(r => r.username === this.user.username);
        const approvedRecords = userRecords.filter(r => r.status === 'approved');
        const top5 = userRecords.slice(0, 5);

        const totalDist = approvedRecords.reduce((sum, r) => sum + (r.distance || 0), 0);
        const totalElev = approvedRecords.reduce((sum, r) => sum + Math.round(r.elevation || 0), 0);

        document.getElementById('stats-total-dist').innerText = totalDist.toFixed(1);
        document.getElementById('stats-total-elev').innerText = totalElev.toLocaleString();

        const list = document.getElementById('recent-records-list');
        list.innerHTML = top5.map(r => {
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
                        <span>${Math.round(r.elevation)}m</span>
                        ${statusBadge}
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${new Date(r.created_at).toLocaleDateString()}</div>
                        ${r.status === 'rejected' && r.rejection_reason ? `<div style="font-size: 0.75rem; color: #ff4444; margin-top: 4px; padding: 4px 8px; background: rgba(255,0,0,0.1); border-radius: 4px;">사유: ${r.rejection_reason}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('') || '<p style="color: var(--text-muted);">기록이 없습니다.</p>';

        top5.forEach(r => {
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

        // Achievements Summary on Dashboard
        const summaryCont = document.getElementById('dashboard-achievements-summary');
        if (summaryCont) {
            const stats = this.calculateUserStats(approvedRecords);
            const myAchIds = this.ACHIEVEMENTS.filter(a => a.check(stats, approvedRecords)).map(a => a.id);

            if (myAchIds.length > 0) {
                summaryCont.innerHTML = this.ACHIEVEMENTS
                    .filter(a => myAchIds.includes(a.id))
                    .slice(0, 5)
                    .map(a => `<span title="${a.title}" style="font-size: 1.5rem; filter: drop-shadow(0 0 5px rgba(255,255,255,0.2));">${a.icon}</span>`)
                    .join('') + (myAchIds.length > 5 ? `<span style="font-size: 0.8rem; color: var(--text-muted); align-self: center;">+${myAchIds.length - 5}</span>` : '');
            } else {
                summaryCont.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">활동을 시작하고 업적을 달성해보세요!</p>';
            }
        }
    },

    async renderActivity() {
        await this.fetchData();
        const approvedRecords = this.records.filter(r => r.status === 'approved');
        const container = document.getElementById('activity-feed-list');
        if (!container) return;

        container.innerHTML = approvedRecords.map(r => `
            <div class="glass card" onclick="app.openDetailModal('${r.id}')" style="cursor: pointer; padding: 1rem; transition: transform 0.2s;">
                <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem;">
                    <div style="width: 35px; height: 35px; background: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem;">${r.username[0].toUpperCase()}</div>
                    <div>
                        <div style="font-weight: 700; font-size: 0.9rem;">${r.username}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                </div>
                <div id="activity-map-thumb-${r.id}" style="height: 150px; border-radius: 10px; background: rgba(0,0,0,0.3); margin-bottom: 1rem; overflow: hidden; display: ${r.map_polyline && !r.image ? 'block' : 'none'}"></div>
                ${r.image ? `<img src="${r.image}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 10px; margin-bottom: 1rem;">` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 600;">
                    <span>${r.distance}km</span>
                    <span style="color: var(--secondary)">${r.elevation}m ▲</span>
                </div>
            </div>
        `).join('') || '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">아직 활동이 없습니다.</p>';

        approvedRecords.forEach(r => {
            if (r.map_polyline && !r.image) {
                setTimeout(() => {
                    const thumb = L.map(`activity-map-thumb-${r.id}`, { zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false }).setView([0, 0], 10);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(thumb);
                    const coords = this.decodePolyline(r.map_polyline);
                    const line = L.polyline(coords, { color: '#fc4c02' }).addTo(thumb);
                    thumb.fitBounds(line.getBounds());
                }, 100);
            }
        });
    },

    async renderCommunity() {
        await this.fetchData();
        const container = document.getElementById('community-post-list');
        if (!container) return;

        container.innerHTML = this.posts.map(p => `
            <div class="glass card" onclick="app.navigate('post-${p.id}')" style="cursor: pointer; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin-bottom: 0.4rem;">${p.title}</h3>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">
                        ${p.username} • ${new Date(p.created_at).toLocaleDateString()} • 댓글 ${this.comments.filter(c => c.post_id === p.id).length}
                    </div>
                </div>
                ${this.user && (this.user.is_admin || this.user.username === p.username) ? `
                    <button class="btn btn-secondary" style="border-color: rgba(255,0,0,0.2); color: #ff4444; padding: 0.5rem;" onclick="event.stopPropagation(); app.deletePost('${p.id}')">삭제</button>
                ` : ''}
            </div>
        `).join('') || '<p style="text-align: center; color: var(--text-muted); padding: 3rem;">게시글이 없습니다.</p>';
    },

    async renderPostDetail(postId) {
        this.currentPostId = postId;
        await this.fetchData();
        const post = this.posts.find(p => String(p.id) === String(postId));
        if (!post) {
            console.error("Post not found:", postId);
            return this.navigate('community');
        }

        const container = document.getElementById('post-detail-container');
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
                <div>
                    <h1 style="margin-bottom: 0.5rem;">${post.title}</h1>
                    <div style="color: var(--text-muted); font-size: 0.9rem;">작성자: ${post.username} | ${new Date(post.created_at).toLocaleString()}</div>
                </div>
                ${this.user && (this.user.is_admin || this.user.username === post.username) ? `
                    <button class="btn btn-secondary" style="border-color: rgba(255,0,0,0.2); color: #ff4444;" onclick="app.deletePost('${post.id}')">삭제</button>
                ` : ''}
            </div>
            <div style="line-height: 1.8; white-space: pre-wrap; font-size: 1.1rem;">${post.content}</div>
        `;

        const commentsContainer = document.getElementById('comments-list');
        const postComments = this.comments.filter(c => c.post_id === postId);
        commentsContainer.innerHTML = postComments.map(c => `
            <div style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 0.3rem;">${c.username}</div>
                    <div style="font-size: 1rem;">${c.content}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.3rem;">${new Date(c.created_at).toLocaleString()}</div>
                </div>
                ${this.user && (this.user.is_admin || this.user.username === c.username) ? `
                    <button class="btn btn-secondary" style="border-color: rgba(255,0,0,0.1); color: #ff4444; padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="app.deleteComment('${c.id}', '${postId}')">삭제</button>
                ` : ''}
            </div>
        `).join('') || '<p style="color: var(--text-muted); padding: 1rem;">첫 댓글을 남겨보세요!</p>';
    },

    openPostModal() {
        if (!this.user) return alert('로그인이 필요합니다.');
        document.getElementById('post-modal').style.display = 'flex';
    },

    closePostModal() {
        document.getElementById('post-modal').style.display = 'none';
        document.getElementById('post-title').value = '';
        document.getElementById('post-content').value = '';
    },

    async submitPost() {
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;

        if (!title || !content) return alert('제목과 내용을 입력해주세요.');

        const { error } = await _supabase.from('biku_posts').insert([{
            username: this.user.username,
            title,
            content
        }]);

        if (error) return alert('저장 중 오류가 발생했습니다.');
        this.closePostModal();
        await this.fetchData();
        this.navigate('community');
    },

    async deletePost(id) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const { error } = await _supabase.from('biku_posts').delete().eq('id', id);
        if (error) return alert('삭제 중 오류가 발생했습니다.');
        await this.fetchData();
        this.navigate('community');
    },

    async submitComment() {
        if (!this.user) return alert('로그인이 필요합니다.');
        const content = document.getElementById('comment-input').value;
        const postId = this.currentPostId;

        if (!content) return;

        const { error } = await _supabase.from('biku_comments').insert([{
            post_id: postId,
            username: this.user.username,
            content
        }]);

        if (error) return alert('저장 중 오류가 발생했습니다.');
        document.getElementById('comment-input').value = '';
        await this.renderPostDetail(postId);
    },

    async deleteComment(id, postId) {
        if (!confirm('댓글을 삭제하시겠습니까?')) return;
        const { error } = await _supabase.from('biku_comments').delete().eq('id', id);
        if (error) return alert('삭제 중 오류가 발생했습니다.');
        await this.renderPostDetail(postId);
    },

    calculateUserStats(approvedRecords) {
        return {
            count: approvedRecords.length,
            totalDist: approvedRecords.reduce((sum, r) => sum + (r.distance || 0), 0),
            totalElev: approvedRecords.reduce((sum, r) => sum + (r.elevation || 0), 0),
            maxSingleDist: Math.max(0, ...approvedRecords.map(r => r.distance || 0)),
            ttCount: approvedRecords.filter(r => r.is_ttareungyi).length,
            stravaCount: approvedRecords.filter(r => r.map_polyline).length
        };
    },

    async renderAchievements() {
        if (!this.user) return this.navigate('login');
        await this.fetchData();
        const userRecords = this.records.filter(r => r.username === this.user.username && r.status === 'approved');
        const stats = this.calculateUserStats(userRecords);

        const grid = document.getElementById('achievements-grid');
        if (!grid) return;

        const achsWithStatus = this.ACHIEVEMENTS.map(a => ({
            ...a,
            isAchieved: a.check(stats, userRecords)
        })).sort((a, b) => b.isAchieved - a.isAchieved);

        grid.innerHTML = achsWithStatus.map(a => `
            <div class="glass card achievement-card ${a.isAchieved ? '' : 'locked'}" onclick="app.openAchievementModal('${a.id}', ${a.isAchieved})">
                <div class="achievement-icon">${a.icon}</div>
                <div class="achievement-title">${a.title}</div>
                <div class="achievement-status">${a.isAchieved ? '달성 완료' : '미달성'}</div>
            </div>
        `).join('');
    },

    openAchievementModal(id, isAchieved) {
        const ach = this.ACHIEVEMENTS.find(a => a.id === id);
        if (!ach) return;

        document.getElementById('ach-modal-icon').innerText = ach.icon;
        document.getElementById('ach-modal-icon').style.filter = isAchieved ? 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' : 'grayscale(1) opacity(0.5)';
        document.getElementById('ach-modal-title').innerText = ach.title;
        document.getElementById('ach-modal-desc').innerText = ach.desc;
        document.getElementById('ach-modal-requirement').innerText = `달성 조건: ${ach.req}`;

        document.getElementById('achievement-modal').style.display = 'flex';
    },

    async renderMyRecords() {
        if (!this.user) return this.navigate('login');
        await this.fetchData();
        const userRecords = this.records.filter(r => r.username === this.user.username);
        const container = document.getElementById('my-records-list');

        if (container) {
            container.innerHTML = userRecords.map((r, i) => {
                let statusText = r.status === 'pending' ? '승인 대기' : (r.status === 'approved' ? '승인 완료' : '반려됨');
                let statusColor = r.status === 'pending' ? '#ffcc00' : (r.status === 'approved' ? 'var(--secondary)' : '#ff4444');

                return `
                        <div class="glass card" onclick="app.openDetailModal('${r.id}')" style="cursor: pointer; padding: 1rem; transition: transform 0.2s;">
                            <div id="my-map-thumb-${r.id}" style="height: 150px; border-radius: 10px; background: rgba(0,0,0,0.3); margin-bottom: 1rem; overflow: hidden; display: ${r.map_polyline && !r.image ? 'block' : 'none'}"></div>
                            ${r.image ? `<img src="${r.image}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 10px; margin-bottom: 1rem;">` : ''}
                            ${!r.image && !r.map_polyline ? `<div style="height: 150px; background: rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center;">No Media</div>` : ''}
                            <div style="font-weight: 700; margin-bottom: 0.5rem;">${new Date(r.created_at).toLocaleDateString()} 라이딩</div>
                            <div style="font-size: 0.9rem; color: var(--text-muted); display: flex; justify-content: space-between;">
                                <span>${r.distance}km / ${r.elevation}m</span>
                                <span style="color: ${statusColor}">${statusText}</span>
                            </div>
                        </div>
                    `;
            }).join('') || '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">아직 기록이 없습니다.</p>';

            userRecords.forEach(r => {
                if (r.map_polyline && !r.image) {
                    setTimeout(() => {
                        const thumb = L.map(`my-map-thumb-${r.id}`, { zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false }).setView([0, 0], 10);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(thumb);
                        const coords = this.decodePolyline(r.map_polyline);
                        const line = L.polyline(coords, { color: '#fc4c02' }).addTo(thumb);
                        thumb.fitBounds(line.getBounds());
                    }, 100);
                }
            });
        }
    },

    openDetailModal(id) {
        const r = this.records.find(rec => rec.id === id);
        if (!r) return;

        document.getElementById('detail-dist').innerText = r.distance;
        document.getElementById('detail-elev').innerText = r.elevation;
        document.getElementById('detail-avg-speed').innerText = r.average_speed || 0;
        document.getElementById('detail-max-speed').innerText = r.max_speed || 0;

        // Time format
        const mins = Math.floor((r.moving_time || 0) / 60);
        document.getElementById('detail-time').innerText = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;

        const statusEl = document.getElementById('detail-status');
        if (statusEl) {
            statusEl.innerText = r.status === 'pending' ? '대기' : (r.status === 'approved' ? '승인' : '반려');
            statusEl.style.color = r.status === 'pending' ? '#ffcc00' : (r.status === 'approved' ? 'var(--secondary)' : '#ff4444');
        }

        const mapDiv = document.getElementById('detail-map');
        const imgEl = document.getElementById('detail-image');

        if (mapDiv) mapDiv.style.display = 'none';
        if (imgEl) imgEl.style.display = 'none';

        if (r.image && imgEl) {
            imgEl.src = r.image;
            imgEl.style.display = 'block';
        } else if (r.map_polyline && mapDiv) {
            mapDiv.style.display = 'block';
            setTimeout(() => {
                if (this.detailMap) this.detailMap.remove();
                this.detailMap = L.map('detail-map');
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.detailMap);
                const coords = this.decodePolyline(r.map_polyline);
                const line = L.polyline(coords, { color: '#fc4c02', weight: 5 }).addTo(this.detailMap);
                this.detailMap.fitBounds(line.getBounds());
            }, 100);
        }

        const modal = document.getElementById('record-detail-modal');
        if (modal) modal.style.display = 'flex';
    },

    closeDetailModal() {
        const modal = document.getElementById('record-detail-modal');
        if (modal) modal.style.display = 'none';
    },

    async renderRankings() {
        await this.fetchData();

        // Default filter state if not exists
        if (!this.rankingFilters) {
            this.rankingFilters = {
                period: 'yearly', // 'daily', 'weekly', 'monthly', 'yearly'
                isTtareungyiOnly: false,
                selectedMonth: new Date().toISOString().slice(0, 7) // YYYY-MM
            };
        }

        const now = new Date();
        let startDate;

        if (this.rankingFilters.period === 'daily') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (this.rankingFilters.period === 'weekly') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
            startDate = new Date(now.setDate(diff));
            startDate.setHours(0, 0, 0, 0);
        } else if (this.rankingFilters.period === 'monthly') {
            const [year, month] = this.rankingFilters.selectedMonth.split('-').map(Number);
            startDate = new Date(year, month - 1, 1);
        } else { // yearly
            startDate = new Date(now.getFullYear(), 0, 1);
        }

        let endDate;
        if (this.rankingFilters.period === 'monthly') {
            const [year, month] = this.rankingFilters.selectedMonth.split('-').map(Number);
            endDate = new Date(year, month, 0, 23, 59, 59, 999);
        } else {
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
        }

        const filteredRecords = this.records.filter(r => {
            if (r.status !== 'approved') return false;

            const recordDate = new Date(r.created_at);
            const inPeriod = recordDate >= startDate && recordDate <= endDate;
            const matchTtareungyi = !this.rankingFilters.isTtareungyiOnly || r.is_ttareungyi === true;

            return inPeriod && matchTtareungyi;
        });

        const userStats = {};
        filteredRecords.forEach(r => {
            if (!userStats[r.username]) {
                userStats[r.username] = { distance: 0, elevation: 0, count: 0 };
            }
            userStats[r.username].distance += (r.distance || 0);
            userStats[r.username].elevation += Number(r.elevation || 0);
            userStats[r.username].count += 1;
        });

        const sorted = Object.entries(userStats)
            .map(([username, stats]) => ({ username, ...stats }))
            .sort((a, b) => b.distance - a.distance);

        const container = document.getElementById('app-content');
        const rankingView = document.getElementById('view-rankings').content.cloneNode(true);

        // Update Filter UI in the cloned template
        const filterBar = document.createElement('div');
        filterBar.className = 'filter-bar';

        // Period Tabs
        const tabs = document.createElement('div');
        tabs.className = 'filter-tabs';
        ['daily', 'weekly', 'monthly', 'yearly'].forEach(p => {
            const tab = document.createElement('div');
            tab.className = `filter-tab ${this.rankingFilters.period === p ? 'active' : ''}`;
            tab.innerText = p === 'daily' ? '일간' : p === 'weekly' ? '주간' : p === 'monthly' ? '월간' : '연간';
            tab.onclick = () => {
                this.rankingFilters.period = p;
                this.renderRankings();
            };
            tabs.appendChild(tab);
        });
        filterBar.appendChild(tabs);

        // Month Selector (for Monthly)
        if (this.rankingFilters.period === 'monthly') {
            const select = document.createElement('select');
            select.className = 'month-selector';
            for (let i = 0; i < 6; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const val = d.toISOString().slice(0, 7);
                const option = document.createElement('option');
                option.value = val;
                option.text = `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
                if (val === this.rankingFilters.selectedMonth) option.selected = true;
                select.appendChild(option);
            }
            select.onchange = (e) => {
                this.rankingFilters.selectedMonth = e.target.value;
                this.renderRankings();
            };
            filterBar.appendChild(select);
        }

        // Ttareungyi Toggle
        const ttToggleGroup = document.createElement('div');
        ttToggleGroup.className = 'toggle-group';
        ttToggleGroup.style.margin = '0';
        ttToggleGroup.style.padding = '8px 16px';
        ttToggleGroup.innerHTML = `
            <span style="font-size: 0.85rem; font-weight: 600; margin-right: 10px;">🚲 따릉이만</span>
            <label class="switch" style="width: 40px; height: 20px;">
                <input type="checkbox" id="rank-ttareungyi-filter" ${this.rankingFilters.isTtareungyiOnly ? 'checked' : ''}>
                <span class="slider" style="border-radius: 20px;"></span>
            </label>
        `;
        filterBar.appendChild(ttToggleGroup);

        const tbody = rankingView.querySelector('#ranking-tbody');
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
                    <td>${u.elevation.toLocaleString()} m</td>
                    <td>${u.count}회</td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">해당 기간의 기록이 없습니다.</td></tr>';

        // Add filter bar before the table
        const card = rankingView.querySelector('.glass.card');
        card.insertBefore(filterBar, card.firstChild);

        // Re-attach event listener for the rank-ttareungyi-filter
        const ttCheckbox = ttToggleGroup.querySelector('#rank-ttareungyi-filter');
        ttCheckbox.onchange = (e) => {
            this.rankingFilters.isTtareungyiOnly = e.target.checked;
            this.renderRankings();
        };

        const content = document.getElementById('app-content');
        content.innerHTML = '';
        content.appendChild(rankingView);
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
                                <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="app.viewFullImage('${r.id}')">사진/지도</button>
                                ${r.status === 'pending' ? `
                                    <button class="btn btn-secondary" style="border-color: rgba(0,255,136,0.3); color: var(--secondary); padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="app.approveRecord('${r.id}')">승인</button>
                                    <button class="btn btn-secondary" style="border-color: rgba(255,0,0,0.3); color: #ff4444; padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="app.rejectRecord('${r.id}')">반려</button>
                                ` : ''}
                                <button class="btn btn-secondary" style="border-color: rgba(255,153,0,0.3); color: #ff9900; padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="app.openEditModal('${r.id}')">수정</button>
                                <button class="btn btn-secondary" style="border-color: rgba(255,0,0,0.3); color: #ff4444; padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="app.deleteRecord('${r.id}')">삭제</button>
                            </div>
                            ${r.rejection_reason ? `<div style="font-size: 0.7rem; color: #ff4444; margin-top: 4px;">사유: ${r.rejection_reason}</div>` : ''}
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
        const reason = prompt('반려 사유를 입력해주세요:');
        if (reason === null) return; // Cancelled

        const { error } = await _supabase
            .from('biku_records')
            .update({
                status: 'rejected',
                rejection_reason: reason || '사유 없음'
            })
            .eq('id', id);

        if (error) return alert('반려 중 오류가 발생했습니다.');
        alert('기록이 반려되었습니다.');
        await this.fetchData();
        await this.renderAdmin();
    },

    viewFullImage(id) {
        const record = this.records.find(r => r.id === id);
        if (!record) return;

        const win = window.open("");
        let content = '';
        if (record.image) {
            content = `<img src="${record.image}" style="max-width:100%; height:auto; display: block; margin: 0 auto;">`;
        } else if (record.map_polyline) {
            content = `
                <div id="big-map" style="height: 100vh; width: 100vw;"></div>
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                <script>
                    window.onload = () => {
                        const map = L.map('big-map');
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                        const coords = ${JSON.stringify(this.decodePolyline(record.map_polyline))};
                        const line = L.polyline(coords, { color: '#fc4c02', weight: 5 }).addTo(map);
                        map.fitBounds(line.getBounds());
                    }
                </script>
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
