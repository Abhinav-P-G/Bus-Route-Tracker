// Initialize map
const map = L.map('map').setView([51.505, -0.09], 13); // Default location

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Initialize Leaflet Routing Machine control
let routeControl = L.Routing.control({
    waypoints: [],
    routeWhileDragging: true
}).addTo(map);

// Placeholder for bus data
const buses = [
    { name: "Bus 101", route: [[51.505, -0.09], [51.515, -0.1]], stops: ["Downtown", "Airport"], arrivalTime: "10:30 AM" },
    { name: "Bus 102", route: [[51.505, -0.09], [51.525, -0.12]], stops: ["Downtown", "Central Park"], arrivalTime: "10:45 AM" },
    { name: "Bus 103", route: [[51.505, -0.09], [51.535, -0.14]], stops: ["Central Park", "Airport"], arrivalTime: "11:00 AM" }
];

// Function to display buses based on the selected destinations
function displayBuses(start, end) {
    const busList = document.getElementById('bus-list');
    busList.innerHTML = ""; // Clear current list

    const filteredBuses = buses.filter(bus => bus.stops.includes(start) && bus.stops.includes(end));
    filteredBuses.forEach(bus => {
        const li = document.createElement('li');
        li.textContent = `${bus.name} - Arrives at ${bus.arrivalTime}`;
        li.onclick = () => showRoute(bus);  // Trigger showRoute when bus is clicked
        busList.appendChild(li);
    });
}

// Function to show bus route on the map (following the road network)
function showRoute(bus) {
    // Clear previous routes
    routeControl.setWaypoints([]);

    // Set the waypoints for the selected bus route
    const start = L.latLng(bus.route[0][0], bus.route[0][1]);
    const end = L.latLng(bus.route[1][0], bus.route[1][1]);

    // Create a routing control and pass the OSRM URL
    L.Routing.control({
        waypoints: [start, end],
        createMarker: function() { return null; }, // Optionally remove markers
        routeWhileDragging: true
    }).addTo(map);

    // Adjust map view to fit route
    map.fitBounds([start, end]);
}

// Handle input in the destination fields
document.getElementById('start-destination').addEventListener('input', () => {
    const start = document.getElementById('start-destination').value;
    const end = document.getElementById('end-destination').value;
    if (start && end) {
        displayBuses(start, end);
    }
});

document.getElementById('end-destination').addEventListener('input', () => {
    const start = document.getElementById('start-destination').value;
    const end = document.getElementById('end-destination').value;
    if (start && end) {
        displayBuses(start, end);
    }
});

// Handle search for buses by name
document.getElementById('bus-search').addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    const busList = document.getElementById('bus-list');
    const busItems = busList.getElementsByTagName('li');
    
    for (let i = 0; i < busItems.length; i++) {
        const busName = busItems[i].textContent.toLowerCase();
        if (busName.includes(query)) {
            busItems[i].style.display = "";
        } else {
            busItems[i].style.display = "none";
        }
    }
});

// Display buses on page load
window.onload = () => {
    displayBuses("Downtown", "Airport");  // Default example
};
