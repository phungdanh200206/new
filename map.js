// Get current user email from localStorage
const currentUserEmail = localStorage.getItem('currentUserEmail');

const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markerRefs = [];

// Coordinates for Ben Thanh Market and Landmark 81
const destinations = [
    {
        name: 'Ben Thanh Market',
        lat: 10.7721,
        lng: 106.6983
    },
    {
        name: 'Landmark 81',
        lat: 10.7942,
        lng: 106.7208
    }
];

let userLatLng = null;
let routeLine = null;
let routeControl = null;

// Custom icons
const userIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', // user avatar icon
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -30]
});
const currentUserIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2922/2922510.png', // smiling user
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -32]
});
const destIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // cute pin
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -30]
});

// Add destination markers
function addDestinationMarkers() {
    destinations.forEach(dest => {
        const marker = L.marker([dest.lat, dest.lng], {icon: destIcon}).addTo(map);
        marker.bindPopup(`<b>${dest.name}</b><br><button onclick="window.drawRouteTo(${dest.lat},${dest.lng})">Go here</button>`);
    });
}

// Draw route from user to destination using real roads
window.drawRouteTo = function(destLat, destLng) {
    if (!userLatLng) {
        alert('User location not available!');
        return;
    }
    if (routeControl) {
        map.removeControl(routeControl);
    }
    routeControl = L.Routing.control({
        waypoints: [
            L.latLng(userLatLng[0], userLatLng[1]),
            L.latLng(destLat, destLng)
        ],
        routeWhileDragging: false,
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true
    }).addTo(map);
};

// Watch and update user location in real time
if (navigator.geolocation && currentUserEmail) {
    navigator.geolocation.watchPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        userLatLng = [lat, lng];
        await fetch('http://127.0.0.1:8000/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUserEmail, lat, lng })
        });
        loadMarkers();
    }, (err) => {
        console.warn('Could not track your location:', err);
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 });
}

// Update table with users and destinations
async function updateLocationTable(users) {
    const tbody = document.querySelector('#locationTable tbody');
    tbody.innerHTML = '';
    // Users
    users.forEach(user => {
        if (user.location && user.location.lat && user.location.lng) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${user.name}</td><td>${user.email}${user.email === currentUserEmail ? ' (You)' : ''}</td><td>${user.location.lat.toFixed(5)}</td><td>${user.location.lng.toFixed(5)}</td>`;
            tr.style.cursor = 'pointer';
            tr.onclick = () => {
                map.setView([user.location.lat, user.location.lng], 16);
                const ref = markerRefs.find(m => m.type === 'user' && m.email === user.email);
                if (ref) ref.marker.openPopup();
            };
            tbody.appendChild(tr);
        }
    });
    // Destinations
    destinations.forEach(dest => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${dest.name}</td><td>Destination</td><td>${dest.lat.toFixed(5)}</td><td>${dest.lng.toFixed(5)}</td>`;
        tr.style.cursor = 'pointer';
        tr.onclick = () => {
            map.setView([dest.lat, dest.lng], 16);
            const ref = markerRefs.find(m => m.type === 'dest' && m.name === dest.name);
            if (ref) ref.marker.openPopup();
        };
        tbody.appendChild(tr);
    });
}

// Modified loadMarkers to store marker references
async function loadMarkers() {
    const res = await fetch('http://127.0.0.1:8000/locations');
    const users = await res.json();
    markerRefs.forEach(ref => map.removeLayer(ref.marker));
    markerRefs = [];
    users.forEach(user => {
        if (user.location && user.location.lat && user.location.lng) {
            const marker = L.marker([user.location.lat, user.location.lng], {
                icon: user.email === currentUserEmail ? currentUserIcon : userIcon
            }).addTo(map);
            marker.bindPopup(`<b>${user.name}</b><br>${user.email}${user.email === currentUserEmail ? ' (You)' : ''}`);
            markerRefs.push({type: 'user', email: user.email, marker});
            if (user.email === currentUserEmail) {
                map.setView([user.location.lat, user.location.lng], 13);
            }
        }
    });
    // Add destination markers
    destinations.forEach(dest => {
        const marker = L.marker([dest.lat, dest.lng], {icon: destIcon}).addTo(map);
        marker.bindPopup(`<b>${dest.name}</b><br><button onclick="window.drawRouteTo(${dest.lat},${dest.lng})">Go here</button>`);
        markerRefs.push({type: 'dest', name: dest.name, marker});
    });
    updateLocationTable(users);
}

// Add destination markers after map is ready
addDestinationMarkers();

loadMarkers();
