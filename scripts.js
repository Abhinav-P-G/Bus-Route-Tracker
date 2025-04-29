// Placeholder for bus data with arrival times based on start destination
let buses = []; // Global variable to store data from JSON

fetch('data/busData.json')
  .then(response => response.json())
  .then(data => {
    buses = data;
    displayBuses();  // Call initial display after data is loaded
  })
  .catch(error => {
    console.error("Failed to load bus data:", error);
  });


// Predefined destinations
let predefinedDestinations = [];

fetch('data/busData.json')
  .then(response => response.json())
  .then(data => {
    buses = data;

    // Generate unique destinations
    const stopsSet = new Set();
    buses.forEach(bus => bus.stops.forEach(stop => stopsSet.add(stop)));
    predefinedDestinations = Array.from(stopsSet);

    displayBuses();
  })
  .catch(error => {
    console.error("Failed to load bus data:", error);
  });


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
    routeWhileDragging: true,
    router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
    })
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
        filteredBuses = buses;
    } else {
        filteredBuses = buses.filter(bus => 
            bus.stops.includes(start) && bus.stops.includes(end)
        );
    }

    const now = new Date();

    // Filter and sort buses by arrival time at the start point
    const upcomingBuses = filteredBuses
        .map(bus => {
            const arrivalStr = bus.arrivalTimes[start];
            if (!arrivalStr) return null;

            // Convert arrival string to a Date object
            const todayStr = new Date().toDateString(); // e.g., "Tue Apr 30 2025"
            const fullArrival = new Date(`${todayStr} ${arrivalStr}`);

            if (fullArrival < now) return null; // Skip if bus has already passed

            return { ...bus, arrivalDate: fullArrival };
        })
        .filter(Boolean) // Remove nulls
        .sort((a, b) => a.arrivalDate - b.arrivalDate); // Sort by earliest arrival

    // Display the sorted and filtered buses
    upcomingBuses.forEach(bus => {
        const li = document.createElement('li');
        li.textContent = `${bus.name} - Arrives at ${start ? (bus.arrivalTimes[start] || 'N/A') : 'N/A'}`;
        li.onclick = () => showRoute(bus, start, end);
        busList.appendChild(li);
    });
}

function parseTimeToToday(timeStr) {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const now = new Date();
    const arrival = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    return arrival;
}




// Function to show bus route on the map
function showRoute(bus, start = null, end = null) {
    routeControl.setWaypoints([]);

    let waypoints;
    if (start && end) {
        let startIndex = bus.stops.indexOf(start);
        let endIndex = bus.stops.indexOf(end);
        if (startIndex > endIndex) [startIndex, endIndex] = [endIndex, startIndex];
        waypoints = bus.route.slice(startIndex, endIndex + 1);
    } else {
        waypoints = bus.route;
    }

    const leafletWaypoints = waypoints.map(stop => L.latLng(stop[0], stop[1]));
    routeControl.setWaypoints(leafletWaypoints);
    map.fitBounds(L.latLngBounds(leafletWaypoints));

    // Show stop name tooltips
    addStopMarkers(bus);
}


// Function to add stop markers with hoverable tooltips displaying stop name and arrival time
function addStopMarkers(bus) {
    // First, remove any existing markers (optional cleanup)
    if (window.stopMarkers) {
        window.stopMarkers.forEach(marker => map.removeLayer(marker));
    }
    window.stopMarkers = [];

    bus.route.forEach((coord, index) => {
        const stopName = bus.stops[index];
        const arrivalTime = bus.arrivalTimes[stopName] || 'N/A';  // Get the arrival time (default to 'N/A' if not available)

        const marker = L.marker(coord).addTo(map);

        // Create the tooltip content (stop name + arrival time)
        const tooltipContent = `<strong>${stopName}</strong><br>Arrival Time: ${arrivalTime}`;

        // Bind a tooltip (appears on hover)
        marker.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top',
            offset: [0, -10],
            className: 'custom-tooltip'
        });

        window.stopMarkers.push(marker);
    });
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
