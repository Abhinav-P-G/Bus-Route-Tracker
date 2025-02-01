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

// Predefined destinations
const predefinedDestinations = ["Downtown", "Airport", "Central Park"];

// Function to display buses based on the selected destinations or visible area
function displayBuses(start, end) {
    const busList = document.getElementById('bus-list');
    busList.innerHTML = ""; // Clear current list

    const filteredBuses = buses.filter(bus => {
        // If no start/end destination entered, show buses within the map bounds
        if (!start && !end) {
            const bounds = map.getBounds();
            const busLatLng = L.latLng(bus.route[0][0], bus.route[0][1]);
            return bounds.contains(busLatLng);  // Check if bus stop is within the bounds of the map
        }
        // Otherwise, filter buses that pass through both the start and end destinations
        return bus.stops.includes(start) && bus.stops.includes(end);
    });

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

// Function to filter suggestions based on input and display matching destinations
function filterDestinations(input, suggestionsDiv, destinations) {
    const query = input.value.toLowerCase();
    suggestionsDiv.innerHTML = ""; // Clear current suggestions
    if (query) {
        const filteredDestinations = destinations.filter(dest => dest.toLowerCase().includes(query));
        filteredDestinations.forEach(dest => {
            const div = document.createElement('div');
            div.textContent = dest;
            div.onclick = () => {
                input.value = dest;
                suggestionsDiv.innerHTML = "";
            };
            suggestionsDiv.appendChild(div);
        });
    }
}

// Handle input in the destination fields
const startInput = document.getElementById('start-destination');
const endInput = document.getElementById('end-destination');
const startSuggestions = document.getElementById('start-suggestions');
const endSuggestions = document.getElementById('end-suggestions');

startInput.addEventListener('input', () => filterDestinations(startInput, startSuggestions, predefinedDestinations));
endInput.addEventListener('input', () => filterDestinations(endInput, endSuggestions, predefinedDestinations));

// Handle search button click to display buses based on selected destinations
document.getElementById('search-btn').addEventListener('click', () => {
    const start = startInput.value;
    const end = endInput.value;
    if (start && end) {
        displayBuses(start, end);  // Show buses filtered by start and end destinations
    } else {
        displayBuses();  // Show all buses within the current map area if no destinations entered
    }
});

// Handle search for buses by name (with suggestions)
const busSearchInput = document.getElementById('bus-search');
const busSuggestions = document.getElementById('bus-suggestions');

busSearchInput.addEventListener('input', () => {
    const query = busSearchInput.value.toLowerCase();
    busSuggestions.innerHTML = "";
    if (query) {
        const filteredBuses = buses.filter(bus => bus.name.toLowerCase().includes(query));
        filteredBuses.forEach(bus => {
            const div = document.createElement('div');
            div.textContent = bus.name;
            div.onclick = () => {
                busSearchInput.value = bus.name;
                busSuggestions.innerHTML = "";
                showRoute(bus);
            };
            busSuggestions.appendChild(div);
        });
    }
});

// Display buses on page load
window.onload = () => {
    displayBuses();  // Show all buses within the map area
};
