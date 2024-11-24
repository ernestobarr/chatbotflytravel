 const apiKey = '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'; // Clave API para OpenAI

        // Variables de la API de vuelos
        const flightApiKey = 'o3VEJ6PYEOnZVqVdtxDabwUJD7XaBC8z';
        const flightApiSecret = 'aCqkXWtiDotm2ZcE';
        const flightAuthUrl = 'https://test.api.amadeus.com/v1/security/oauth2/token';
        const flightOffersUrl = 'https://test.api.amadeus.com/v2/shopping/flight-offers';

        // Función para obtener token de acceso
        async function getFlightAccessToken() {
            const response = await fetch(flightAuthUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: flightApiKey,
                    client_secret: flightApiSecret,
                }),
            });
            const data = await response.json();
            return data.access_token;
        }

        // Función para convertir de euros a dólares
        function convertEurosToDollars(euros) {
            const conversionRate = 1.06; // Tasa de conversión de EUR a USD
            return euros * conversionRate;
        }

        // Función para buscar vuelos
        async function searchFlights(origin, destination, departureDate, numAdults) {
            const accessToken = await getFlightAccessToken();

            const params = new URLSearchParams({
                originLocationCode: origin,
                destinationLocationCode: destination,
                departureDate: departureDate,
                adults: numAdults,
                max: 5, // Máximo de resultados
            });

            const response = await fetch(`${flightOffersUrl}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const data = await response.json();

            if (data && data.data) {
                // Filtrar vuelos según la consulta de origen y destino
                const filteredFlights = data.data.filter(flight => {
                    const flightOrigin = flight.itineraries[0].segments[0].departure.iataCode;
                    const flightDestination = flight.itineraries[0].segments[0].arrival.iataCode;

                    return flightOrigin === origin && flightDestination === destination;
                });

                return filteredFlights;
            } else {
                console.error('No se recibieron datos válidos:', data);
                return [];
            }
        }

        // Función para convertir la fecha "día/mes/año" a "año-mes-día"
        function convertDateToAPIFormat(dateString) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month}-${day}`; // Formato "año-mes-día"
         }

        // Función para convertir el precio a dólares (por ejemplo, EUR a USD)
        function convertToUSD(priceInEUR) {
        const conversionRate = 1.1; // 1 EUR = 1.1 USD aunque esto fluctua ahorita
        return (priceInEUR * conversionRate).toFixed(2);
        }

    let isTyping = false; // Variable global para controlar el estado de "escribiendo..."

    function sendMessage() {   
    const input = document.getElementById('userInput');
    const message = input.value;

    if (message) {
        // Mostrar el mensaje del usuario en el chat
        document.getElementById('chatbox').innerHTML += `<div><strong>Yo:</strong> ${message}</div>`;
        input.value = '';

        // Verificar si ya está escribiendo antes de agregar el indicador
        if (!isTyping) {
            isTyping = true;
            const typingIndicator = document.createElement('div');
            typingIndicator.classList.add('typing');
            typingIndicator.innerHTML = '<strong>Bot:</strong> escribiendo...';
            document.getElementById('chatbox').appendChild(typingIndicator);
            document.getElementById('chatbox').scrollTop = document.getElementById('chatbox').scrollHeight;
        }

        // Verifica si el mensaje contiene la palabra 'vuelo'
        if (message.toLowerCase().includes("vuelo")) {
            // Eliminar el indicador de "escribiendo..." después de procesar el vuelo
            document.querySelector('.typing').remove();
            isTyping = false; // Resetear el estado de "escribiendo..."
            
            // Verificar si el formato de vuelo es correcto
            const flightDetails = message.match(/de (\w+) a (\w+) el (\d{2})\/(\d{2})\/(\d{4})/); // Expresión regular para "día/mes/año"
            const numAdultsMatch = message.match(/(\d+)\s*(adultos?|personas?)/i); // Buscar número de adultos o personas (ej. "2 adultos" o "3 personas")

            if (!flightDetails) {
                // Solo muestra este mensaje si no se encuentra el formato de vuelo adecuado
                document.getElementById('chatbox').innerHTML += `<div><strong>Bot:</strong> ¡Genial! Estoy aquí para ayudarte con los vuelos. Por favor, proporciona los detalles en el formato 'de ORIGEN a DESTINO el DÍA/MES/AÑO' y la cantidad de personas (1,2,3..) que tomaran el vuelo.</div>`;
                document.getElementById('chatbox').scrollTop = document.getElementById('chatbox').scrollHeight;
                return;
            }

            // Si se encuentran los detalles del vuelo, se procesa la búsqueda
            const [_, origin, destination, day, month, year] = flightDetails;
            const date = `${day}/${month}/${year}`; // Formato "día/mes/año"
            const formattedDate = convertDateToAPIFormat(date); // Convertir a "año-mes-día"
            const numAdults = numAdultsMatch ? parseInt(numAdultsMatch[1], 10) : 1; // Si no se especifica, por defecto 1 adulto

            // Mostrar el indicador de "escribiendo..." mientras se hace la búsqueda de vuelos
            const typingIndicator = document.createElement('div');
            typingIndicator.classList.add('typing');
            typingIndicator.innerHTML = '<strong>Bot:</strong> escribiendo...';
            document.getElementById('chatbox').appendChild(typingIndicator);
            document.getElementById('chatbox').scrollTop = document.getElementById('chatbox').scrollHeight;

            searchFlights(origin.toUpperCase(), destination.toUpperCase(), formattedDate, numAdults)
                .then(flights => {
                    // Eliminar el indicador de "escribiendo..." después de obtener la respuesta
                    document.querySelector('.typing').remove();
                    isTyping = false; // Resetear el estado de "escribiendo..." después de la respuesta
                    
                    let flightsText = "<strong>Vuelos disponibles:</strong><br>";
                    if (flights.length > 0) {
                        flights.forEach((flight) => {
                            const price = flight.price.total;
                            const priceInUSD = convertToUSD(price); // Convertir a dólares
                            const departure = flight.itineraries[0].segments[0].departure;
                            const arrival = flight.itineraries[0].segments[0].arrival;
                            flightsText += `
                                <strong>Precio:</strong> ${priceInUSD} USD<br>
                                <strong>Salida:</strong> ${departure.iataCode} - ${departure.at}<br>
                                <strong>Llegada:</strong> ${arrival.iataCode} - ${arrival.at}<br><br>
                            `;
                        });
                    } else {
                        flightsText = 'No se encontraron vuelos para esa fecha.';
                    }
                    document.getElementById('chatbox').innerHTML += `<div><strong>Bot:</strong> ${flightsText}</div>`;
                    document.getElementById('chatbox').scrollTop = document.getElementById('chatbox').scrollHeight;
                })
                .catch(error => {
                    console.error(error);
                    document.querySelector('.typing').remove(); // Eliminar el indicador de "escribiendo..."
                    document.getElementById('chatbox').innerHTML += `<div><strong>Bot:</strong> Hubo un error al buscar vuelos.</div>`;
                    document.getElementById('chatbox').scrollTop = document.getElementById('chatbox').scrollHeight;
                    isTyping = false; // Resetear el estado de "escribiendo..." en caso de error
                });
        } else {
            // Si no es una consulta de vuelos, consulta a OpenAI
            fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [{ role: 'user', content: message }],
                    temperature: 0.5,
                }),
            })
            .then(response => response.json())
            .then(data => {
                const reply = data.choices[0].message.content;
                document.querySelector('.typing').remove(); // Eliminar el indicador de "escribiendo..."
                document.getElementById('chatbox').innerHTML += `<div><strong>Bot:</strong> ${reply}</div>`;
                document.getElementById('chatbox').scrollTop = document.getElementById('chatbox').scrollHeight;
                isTyping = false; // Resetear el estado de "escribiendo..." después de la respuesta
            })
            .catch(error => {
                console.error('Error:', error);
                document.querySelector('.typing').remove(); // Eliminar el indicador de "escribiendo..."
                document.getElementById('chatbox').innerHTML += `<div><strong>Error:</strong> No se pudo obtener respuesta del bot.</div>`;
            });
        }
    }
}
        document.getElementById('sendBtn').addEventListener('click', sendMessage);
        document.getElementById('userInput').addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });