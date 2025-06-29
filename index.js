const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
	container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
	container.classList.remove("right-panel-active");
});

const signUpForm = document.getElementById('signUpForm');
const signInForm = document.getElementById('signInForm');

signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signUpName').value;
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    const res = await fetch('http://127.0.0.1:8000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    alert(data.message);
});

// Helper: Show map and markers
async function showMap(currentUserEmail) {
    document.getElementById('map').style.display = 'block';
    if (!window.L) return alert('Map library not loaded!');
    const map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    // Get all users' locations
    const res = await fetch('http://127.0.0.1:8000/locations');
    const users = await res.json();
    users.forEach(user => {
        if (user.location && user.location.lat && user.location.lng) {
            const marker = L.marker([user.location.lat, user.location.lng]).addTo(map);
            marker.bindPopup(`<b>${user.name}</b><br>${user.email}${user.email === currentUserEmail ? ' (You)' : ''}`);
            if (user.email === currentUserEmail) {
                map.setView([user.location.lat, user.location.lng], 13);
            }
        }
    });
}

signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;
    const res = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    alert(data.message);
    if (data.message === 'Login successful') {
        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                // Send location to backend
                await fetch('http://127.0.0.1:8000/location', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, lat, lng })
                });
                localStorage.setItem('currentUserEmail', email);
                window.location.href = 'map.html';
            }, (err) => {
                alert('Could not get your location.');
                localStorage.setItem('currentUserEmail', email);
                window.location.href = 'map.html';
            });
        } else {
            alert('Geolocation is not supported by your browser.');
            localStorage.setItem('currentUserEmail', email);
            window.location.href = 'map.html';
        }
    }
});