let buses = [];

fetch('data/busData.json')
  .then(response => response.json())
  .then(data => {
    buses = data;
    displayBuses();
  })
  .catch(error => {
    console.error("Failed to load bus data:", error);
  });

let predefinedDestinations = [];

fetch('data/busData.json')
  .then(response => response.json())
  .then(data => {
    buses = data;
    const stopsSet = new Set();
    buses.forEach(bus => bus.stops.forEach(stop => stopsSet.add(stop)));
    predefinedDestinations = Array.from(stopsSet);
    displayBuses();
  })
  .catch(error => {
    console.error("Failed to load bus data:", error);
  });

const map = L.map('map').setView([10.89620, 76.42476], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let routeControl = L.Routing.control({
    waypoints: [],
    routeWhileDragging: true,
    router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
    })
}).addTo(map);

const startInput = document.getElementById('start-destination');
const endInput = document.getElementById('end-destination');
const startSuggestions = document.getElementById('start-suggestions');
const endSuggestions = document.getElementById('end-suggestions');
const busSearchInput = document.getElementById('bus-search');
const busSuggestions = document.getElementById('bus-suggestions');
const busList = document.getElementById('bus-list');

map.on('load', () => {
    displayBuses();
});

function displayBuses(start, end) {
    busList.innerHTML = "";

    let filteredBuses;

    if (!start && !end) {
        filteredBuses = buses;
    } else {
        filteredBuses = buses.filter(bus => 
            bus.stops.includes(start) && bus.stops.includes(end)
        );
    }

    const now = new Date();

    const upcomingBuses = filteredBuses
        .map(bus => {
            const arrivalStr = bus.arrivalTimes[start];
            if (!arrivalStr) return null;
            const todayStr = new Date().toDateString();
            const fullArrival = new Date(`${todayStr} ${arrivalStr}`);
            if (fullArrival < now) return null;
            return { ...bus, arrivalDate: fullArrival };
        })
        .filter(Boolean)
        .sort((a, b) => a.arrivalDate - b.arrivalDate);

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
    addStopMarkers(bus);
}

function addStopMarkers(bus) {
    if (window.stopMarkers) {
        window.stopMarkers.forEach(marker => map.removeLayer(marker));
    }
    window.stopMarkers = [];

    bus.route.forEach((coord, index) => {
        const stopName = bus.stops[index];
        const arrivalTime = bus.arrivalTimes[stopName] || 'N/A';
        const marker = L.marker(coord).addTo(map);
        const tooltipContent = `<strong>${stopName}</strong><br>Arrival Time: ${arrivalTime}`;
        marker.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top',
            offset: [0, -10],
            className: 'custom-tooltip'
        });
        window.stopMarkers.push(marker);
    });
}

function refreshMap() {
    routeControl.setWaypoints([]);
    map.setView([10.89620, 76.42476], 13);
    startInput.value = "";
    endInput.value = "";
    busSearchInput.value = "";
    startSuggestions.innerHTML = "";
    endSuggestions.innerHTML = "";
    busSuggestions.innerHTML = "";
    displayBuses();
}

document.getElementById('refresh-btn').addEventListener('click', refreshMap);

function filterDestinations(input, suggestionsDiv, destinations) {
    const query = input.value.toLowerCase();
    suggestionsDiv.innerHTML = "";
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

startInput.addEventListener('input', () => filterDestinations(startInput, startSuggestions, predefinedDestinations));
endInput.addEventListener('input', () => filterDestinations(endInput, endSuggestions, predefinedDestinations));

document.getElementById('search-btn').addEventListener('click', () => {
    const start = startInput.value;
    const end = endInput.value;
    if (start && end) {
        displayBuses(start, end);
    } else {
        displayBuses();
    }
});

window.onload = () => {
    displayBuses();
};
