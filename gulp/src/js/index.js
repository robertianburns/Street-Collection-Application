// The custom user icon is initiated before everything else loads.
const customIcons = {
    userIcon: L.icon({
        iconUrl: './images/user.png',
        iconSize: [48, 48],
        iconAnchor: [24, 24]
    })
};

window.addEventListener('load', () => {

    /* Register the ServiceWorker when the page loads. */
    navigator.serviceWorker.register('./sw.js', { 'scope': './' });

    /* Initialise the map on load.
       ------------------------------------------------------------------------------------------------*/
    const map = L.map('map').fitWorld();
    const markers = new L.LayerGroup().addTo(map);

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1
    }).addTo(map);

    map.locate({
        setView: true,
        maxZoom: 16,
        watch: false // Do not keep updating the end user's position. This caused annoyance as the screen
            //          kept resetting to the user's position every few seconds, making it hard to look 
            //          at and read markers.
    });

    /* Get the end user's current position and print a red icon at it.
       -----------------------------------------------------------------------------------------------*/
    let lat, lon;
    let currentPosition = null;
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(position => {
            lat = position.coords.latitude;
            lon = position.coords.longitude;

            if (currentPosition == null) {
                currentPosition = L.marker([lat, lon], { icon: customIcons.userIcon }).addTo(map);
            } else {
                currentPosition.setLatLng([lat, lon]);
            }
        });
    } else {
        alert('ERROR CODE CATERPILLAR: Failed to get your location. A possible fix might be to enable location access and try again.');
    }

    /* Add menu event.
       ------------------------------------------------------------------------------------------------*/
    const addButton = document.querySelector("#addButton");
    addButton.addEventListener("click", () => {
        const addMenu = document.querySelector("#addMenu");
        if (addMenu.style.display == "block") {
            addMenu.style.display = "none";
        } else {
            addMenu.style.display = "block";
        }
    });

    /* Image uploading and canvas manipulation.
       ------------------------------------------------------------------------------------------------*/
    const canvas = document.querySelector('#canvas');
    const canvasContext = canvas.getContext('2d');

    document.querySelector('#fileInput').onchange = function(e) {
        const image = new Image();
        image.onload = imageDraw;
        image.onerror = imageError;
        image.src = URL.createObjectURL(this.files[0]);
    };

    function imageDraw() {
        // Resizes the image and the canvas to fit the div and screen. Without this, images will go past
        // the popup's boundaries.
        let ratio = this.width / this.height;
        let updatedWidth = canvas.width;
        let updatedHeight = updatedWidth / ratio;
        if (updatedHeight > canvas.height) {
            updatedHeight = canvas.height;
            updatedWidth = updatedHeight * ratio;
        }
        const x = updatedWidth < canvas.width ? ((canvas.width - updatedWidth) / 2) : 0;
        const y = updatedHeight < canvas.height ? ((canvas.height - updatedHeight) / 2) : 0;

        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvasContext.drawImage(this, x, y, updatedWidth, updatedHeight);
    }

    function imageError() {
        alert("ERROR CODE CAT: The given file could not be loaded as an image. Please make sure the file is an image and try again.");
    }

    /* Add menu submit button event. Send user inputted data and the user's position into the database.
       ------------------------------------------------------------------------------------------------*/
    const submitButton = document.querySelector('#submit');
    submitButton.addEventListener('click', async event => {
        const imageURL = document.querySelector('#canvas').toDataURL();
        const objectDescription = document.querySelector('#objDescription').value;
        const objectTaken = 0; // 0 = false (boolean)
        const data = { objectTaken, lat, lon, objectDescription, imageURL };
        const method = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };
        fetch('/skip_app', method);
        document.querySelector("#addMenu").style.display = "none";
        setTimeout(getData, 500); // getData is run after half a second to update the map after submission.
    });

    /* Close add menu event.
       ------------------------------------------------------------------------------------------------*/
    document.querySelector("#closeaddMenu").addEventListener("click", function() {
        document.querySelector("#addMenu").style.display = "none";
    });

    /* Data function. This gets all data from the database and turn that into markers.
       ------------------------------------------------------------------------------------------------*/
    async function getData() {
        const response = await fetch('/skip_app');
        const data = await response.json();

        // Clear the markers before getting the markers. This is so markers don't print over themselves
        // when getData is called when the user submits their object in the 'Add menu submit button event'.
        markers.clearLayers();

        for (object of data) {
            // Print the markers in the co-ordinates stored in the database.
            const marker = L.marker([object.lat, object.lon]).addTo(markers);

            // The content which goes into the markers.
            const uid = object._id;
            const image = `<img src="${object.imageURL}" />`;
            const description = object.objectDescription;
            const button = `<br/><button type="button" class="button" id="${uid}">Object Taken?</button>`;
            const linebreak = '<br />';

            // Button event listener. Update the 'objectTaken' value to 1 so that the marker is hidden.
            document.body.addEventListener('click', async event => {
                if (event.target.id == uid) {
                    const method = {
                        method: 'PUT',
                    };
                    const endpoint = `/skip_app/${uid}`;
                    fetch(endpoint, method);
                    map.removeLayer(marker);
                };
            });

            // Binds information to the markers. If the 'objectTaken' value is 1, hide the marker, else 
            // the information can be binded to a popup.
            if (object.objectTaken === 1) {
                map.removeLayer(marker);
            } else {
                marker.bindPopup(image + linebreak + description + linebreak + button, {
                    maxWidth: "auto"
                });
            }
        }
    }

    getData(); // Run getData to initially get the markers.
});