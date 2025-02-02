// Placeholder for bus data with arrival times based on start destination
const buses = [
    { 
        name: "Pavizham", 
        route: [
            [10.9046920, 76.40807], // Stop 1: SKP stand
            [10.906364, 76.413428],  // Stop 2: SBT Jn
            [10.899533, 76.432078], // Stop 3: GEC road
            [10.883128, 76.435828], // stop 4: VTB road
            [10.874851, 76.440390], // Stop 5: KDM
            [10.835820, 76.572958]  // Stop 6: Mundur
        ], 
        stops: ["SKP stand", "SBT Jn", "GEC road","VTB road","KDM","Mundur"],
        arrivalTimes: {
            "SKP stand": "10:30 AM",
            "SBT Jn": "10:40 AM",
            "GEC road": "10:50 AM",
            "KDM": "11:00 AM",
            "Mundur": "12:30",
        }
    },
    { 
        name: "Pavithram", 
        route: [
            [10.929019, 76.356488], // Stop 1: Muriyankanni
            [10.906364, 76.413428], // Stop 2: SBT Jn
            [10.899533, 76.432078], // Stop 3: GEC road
            [10.883128, 76.435828], // stop 4: VTB road
            [10.874851, 76.440390], // Stop 5: KDM
            [10.835820, 76.572958]  // Stop 6: Mundur
        ], 
        stops: ["Muriyankanni", "SBT Jn", "GEC road","VTB road","KDM","Mundur"],
        arrivalTimes: {
            "Muriyankannin": "10:45 AM",
            "SBT Jn": "10:55 AM",
            "GEC road": "11:05 AM",
            "VTB road": "11:15 AM",
            "KDM": "11:45 AM",
            "Mundur": "12:30"
        }
    }
];

// Predefined destinations
const predefinedDestinations = ["SKP stand","Muriyankanni", "SBT Jn", "GEC road","VTB road","KDM","Mundur"];

// Initialize map
const map = L.map('map').setView([10.89620, 76.42476], 15,
{
   animate: true,
    duration: 1.5,
    easeLinearity: 0.3
 }); // Default location

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Global variable for routeControl
let routeControl = L.Routing.control({
    waypoints: [],
    routeWhileDragging: true
}).addTo(map);

// DOM element initializations
const startInput = document.getElementById('start-destination');
const endInput = document.getElementById('end-destination');
const startSuggestions = document.getElementById('start-suggestions');
const endSuggestions = document.getElementById('end-suggestions');
const busSearchInput = document.getElementById('bus-search');
const busSuggestions = document.getElementById('bus-suggestions');
const busList = document.getElementById('bus-list');

// Function to handle map load event
map.on('load', () => {
    displayBuses();  // Show all buses within the map area
});

// Function to display buses based on the selected destinations or visible area
function displayBuses(start, end) {
    busList.innerHTML = ""; // Clear the current list

    let filteredBuses;

    if (!start && !end) {
        // If no start or end is provided, show all buses
        filteredBuses = buses;
    } else {
        // Otherwise, filter buses that pass through both the start and end destinations
        filteredBuses = buses.filter(bus => 
            bus.stops.includes(start) && bus.stops.includes(end)
        );
    }

    filteredBuses.forEach(bus => {
        const li = document.createElement('li');
        li.textContent = `${bus.name} - Arrives at ${start ? (bus.arrivalTimes[start] || 'N/A') : 'N/A'}`;
        li.onclick = () => showRoute(bus);  // Trigger showRoute when bus is clicked
        busList.appendChild(li);
    });
}


// Function to show bus route on the map
function showRoute(bus) {
    // Clear previous routes
    routeControl.setWaypoints([]); // Clear previous route

    // Set the waypoints for the selected bus route (from start to end)
    const waypoints = bus.route.map(stop => L.latLng(stop[0], stop[1]));

    // Create a routing control and pass the OSRM URL
    routeControl.setWaypoints(waypoints);

    // Get bounds for the route (using waypoints)
    const routeBounds = L.latLngBounds(waypoints);  // Get bounds from waypoints
    map.fitBounds(routeBounds);  // Fit map to the route bounds
}

// Function to refresh the map
function refreshMap() {
    // Clear previous routes
    routeControl.setWaypoints([]);

    // Reset the map view to its initial state (center and zoom level)
    map.setView([10.89620, 76.42476], 13); // Set back to the initial center and zoom

    // Clear the input fields and suggestions
    startInput.value = "";  // Clear the start destination input
    endInput.value = "";    // Clear the end destination input
    busSearchInput.value = "";  // Assuming there's a bus search input that should be cleared
    startSuggestions.innerHTML = "";  // Clear start destination suggestions
    endSuggestions.innerHTML = "";    // Clear end destination suggestions
    busSuggestions.innerHTML = "";    // Clear bus search suggestions

    // Reset available buses (show all buses based on the current map view)
    displayBuses();
}

// Attach event listener to the refresh button
document.getElementById('refresh-btn').addEventListener('click', refreshMap);

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
                suggestionsDiv.innerHTML = "";  // Clear suggestions after selection
            };
            suggestionsDiv.appendChild(div);
        });
    }
}

// Handle input in the destination fields
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

// Display buses on page load
window.onload = () => {
    displayBuses();  // Show all buses within the map area
};
