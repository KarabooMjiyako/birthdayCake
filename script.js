document.addEventListener("DOMContentLoaded", function () {
    // Prompt user for first name
    var user = prompt("Write your first name:");
    if (user === null || user === "") {
        user = prompt("Please write your first name:");
    } else if (user < 2) {
        user = prompt("Please write your first name:");
    } else if (user !== null) {
        document.title = "Happy Birthday " + user + "!";
        document.querySelector("h1").textContent = "Happy Birthday " + user + "!";
    }

    // Constant variables
    const mic = document.getElementById("mic");
    const cursor = document.getElementById("cursor");
    const flame = document.getElementById("flame");
    const cursorInstructions = document.getElementById("cursorInstructions");
    const micInstructions = document.getElementById("micInstructions");
    micInstructions.style.display = "none";
    cursorInstructions.style.display = "none";
    const instructionsContainer = document.querySelector(".instructions-container");

    // Blow detection variables
    let audioContext;
    let micStream;
    let analyser;
    let blowThreshold = 110;
    let flameOpacity = 1;

    // Function to start blow detection
    function startBlowDetection() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (stream) {
                // Create audio context
                audioContext = new AudioContext();
                micStream = stream;
                const microphone = audioContext.createMediaStreamSource(stream);

                // Initialize analyser
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                microphone.connect(analyser);

                // Execute listenForBlow()
                listenForBlow();
            })
            .catch(function (err) {
                console.error("Error accessing microphone:", err);
            });
    }

    // Function to reveal the prize
    function revealPrize() {
        const giftDiv = document.getElementById("gift");
        giftDiv.innerHTML = `
            <h4>Congratulations!</h4>
            <p>You've earned your prize!</p>
            <img src="prize.png" alt="Prize" width="150" height="150">
        `;
    }

    // Check when the flame is completely out and reveal the prize
    function checkFlameOut() {
        if (flameOpacity <= 0) {
            revealPrize();
        }
    }

    // Listen for blow function
    function listenForBlow() {
        const buffer = analyser.frequencyBinCount;
        const data = new Uint8Array(buffer);

        function detectBlow() {
            analyser.getByteFrequencyData(data);

            // Calculate the average amplitude
            let s = 0;
            for (let i = 0; i < buffer; i++) {
                s += data[i];
            }
            const averageAmplitude = s / buffer;

            // Check if averageAmplitude is greater than blowThreshold
            if (averageAmplitude > blowThreshold) {
                // Decrease flame opacity
                flameOpacity -= 0.05;
                if (flameOpacity < 0) {
                    flameOpacity = 0;
                }
                flame.style.opacity = flameOpacity;
                checkFlameOut(); // Check if prize should be revealed
            }

            // Schedule next detection loop
            requestAnimationFrame(detectBlow);
        }

        // Detection loop
        detectBlow();
    }

    // Listen for the mic button when clicked, initialize the function to handle blow detection
    mic.addEventListener("click", function () {
        micInstructions.style.display = "block";
        cursorInstructions.style.display = "none";
        instructionsContainer.style.display = "none";
        startBlowDetection();
    });

    // Listen for the cursor button when clicked, initialize the function to handle cursor movement
    cursor.addEventListener("click", function () {
        cursorInstructions.style.display = "block";
        micInstructions.style.display = "none";
        instructionsContainer.style.display = "none";

        // Variables for cursor movement
        let prevX = null;
        let prevY = null;
        let prevTime = null;

        const flameRadius = 500;

        // Track cursor movement
        document.addEventListener("mousemove", function (event) {
            const x = event.clientX;
            const y = event.clientY;

            // Check if the cursor is inside the flame radius
            const inFlameRadius =
                x >= flame.offsetLeft - flameRadius &&
                x <= flame.offsetLeft + flame.offsetWidth + flameRadius &&
                y >= flame.offsetTop - flameRadius &&
                y <= flame.offsetTop + flame.offsetHeight + flameRadius;

            // Check if the cursor is inside the flame radius
            if (inFlameRadius) {
                let speed = 0;
                if (prevX !== null && prevY !== null && prevTime !== null) {
                    const time = performance.now() - prevTime;
                    speed = Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2)) / time;
                }

                // Decrease flame opacity based on cursor speed
                flameOpacity -= speed * 0.01;
                if (flameOpacity < 0) {
                    flameOpacity = 0;
                }
                flame.style.opacity = flameOpacity;
                checkFlameOut(); // Check if prize should be revealed
            }

            // Update previous cursor position & time
            prevX = x;
            prevY = y;
            prevTime = performance.now();
        });
    });

    // Function to handle unload of the page and close the audio context
    window.addEventListener("beforeunload", function () {
        if (audioContext) {
            audioContext.close();
            micStream.getTracks().forEach((track) => track.stop());
        }
    });
});
