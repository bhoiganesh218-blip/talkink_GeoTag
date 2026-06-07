// Register Service Worker for PWA compliance
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Bhai, Service Worker registered successfully!', reg))
            .catch(err => console.error('Oops, Service Worker registration failed:', err));
    });
}







document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const mainImageInput = document.getElementById("mainImageInput");
    const mapImageInput = document.getElementById("mapImageInput");
    const canvas = document.getElementById("previewCanvas");
    const placeholder = document.getElementById("canvasPlaceholder");
    const downloadBtn = document.getElementById("downloadBtn");

    // Input Text Variables
    const inputs = {
        location: document.getElementById("varLocation"),
        plusCode: document.getElementById("varPlusCode"),
        pincode: document.getElementById("varPinCode"),
        lat: document.getElementById("varLat"),
        long: document.getElementById("varLong"),
        date: document.getElementById("varDate"),
        time: document.getElementById("varTime")
    };

    // Images State
    let mainImg = null;
    let mapImg = null;

    const ctx = canvas.getContext("2d");

    // Event Listeners for Uploads
    mainImageInput.addEventListener("change", (e) => handleImageUpload(e, 'main'));
    mapImageInput.addEventListener("change", (e) => handleImageUpload(e, 'map'));

    // Re-render canvas whenever any input text changes
    Object.values(inputs).forEach(input => {
        input.addEventListener("input", renderCanvas);
    });

    // Handle Image Loading
    function handleImageUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                if (type === 'main') {
                    mainImg = img;
                    placeholder.style.display = "none";
                    canvas.style.display = "block";
                } else if (type === 'map') {
                    mapImg = img;
                }
                renderCanvas();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Core Canvas Render Function
    function renderCanvas() {
        if (!mainImg) return;

        // Maintain Original High Quality Resolution (Supports Full-Res 16:9 natively)
        const targetWidth = mainImg.naturalWidth || 1920;
        const targetHeight = mainImg.naturalHeight || 1080;
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Clear Canvas & Draw Main Base Image
        ctx.clearRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(mainImg, 0, 0, targetWidth, targetHeight);

        // Dynamic Scale Factor based on reference width layout (1024 Baseline)
        const scale = targetWidth / 1024;

        // Strict Synchronized Sizing & Exact Proportions
        const commonHeight = 175 * scale;  // Height for both boxes is completely locked
        const mapWidth = 175 * scale;      // Sharp square map box
        const textBoxWidth = 485 * scale;   // Spacious text container
        const gapBuffer = 12 * scale;       // Gap separating the two boxes
        const paddingBottom = 35 * scale;   // Fixed padding clearance from bottom edge

        // Total Tag width combining both boxes and the gap
        const totalTagWidth = mapWidth + gapBuffer + textBoxWidth;

        // -----------------------------------------------------------------
        // EXACT HORIZONTAL CENTER CALCULATIONS (Pura Bicho-Bich)
        // -----------------------------------------------------------------
        const startX = (targetWidth - totalTagWidth) / 2;
        const startY = targetHeight - commonHeight - paddingBottom;

        const mapX = startX;
        const mapY = startY;

        const textX = startX + mapWidth + gapBuffer;
        const textY = startY;

        // Matte Transparent Dark Styling
        ctx.fillStyle = "rgba(15, 15, 15, 0.82)";

        // -----------------------------------------------------------------
        // 1. DRAW LEFT SIDE MAP BOX
        // -----------------------------------------------------------------
        ctx.beginPath();
        ctx.roundRect(mapX, mapY, mapWidth, commonHeight, 14 * scale);
        ctx.fill();

        if (mapImg) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(mapX + (4 * scale), mapY + (4 * scale), mapWidth - (8 * scale), commonHeight - (8 * scale), 10 * scale);
            ctx.clip();
            ctx.drawImage(mapImg, mapX + (4 * scale), mapY + (4 * scale), mapWidth - (8 * scale), commonHeight - (8 * scale));
            ctx.restore();
        } else {
            // Placeholder color if map is missing
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            ctx.beginPath();
            ctx.roundRect(mapX + (4 * scale), mapY + (4 * scale), mapWidth - (8 * scale), commonHeight - (8 * scale), 10 * scale);
            ctx.fill();
        }

        // Google Watermark Branding over Map
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${14 * scale}px Arial, sans-serif`;
        ctx.textAlign = "left";
        ctx.fillText("Google", mapX + (14 * scale), mapY + commonHeight - (15 * scale));

        // -----------------------------------------------------------------
        // 2. DRAW RIGHT SIDE DATA TEXT BOX
        // -----------------------------------------------------------------
        ctx.fillStyle = "rgba(15, 15, 15, 0.82)";
        ctx.beginPath();
        ctx.roundRect(textX, textY, textBoxWidth, commonHeight, 14 * scale);
        ctx.fill();

        // Top Mini Branding Label (Floating aligned to the right side of the inner card)
        ctx.fillStyle = "rgba(230, 230, 230, 0.8)";
        ctx.font = `${11 * scale}px Arial, sans-serif`;
        ctx.textAlign = "right";
        ctx.fillText("📷  GPS Map Camera", textX + textBoxWidth - (16 * scale), textY + (22 * scale));

        // -----------------------------------------------------------------
        // 3. REALTIME VARIABLES LINE TYPOGRAPHY
        // -----------------------------------------------------------------
        ctx.textAlign = "left";
        let currentY = textY + (48 * scale);

        // Line 1: Main Location Header Text + Indian Flag
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${23 * scale}px Arial, sans-serif`; 
        ctx.fillText(`${inputs.location.value} 🇮🇳`, textX + (18 * scale), currentY);

        // Line 2: Plus Code & Pincode Address Mix String
        currentY += 28 * scale;
        ctx.fillStyle = "#e2e8f0";
        ctx.font = `${14.5 * scale}px Arial, sans-serif`;
        ctx.fillText(`${inputs.plusCode.value}, ${inputs.pincode.value}`, textX + (18 * scale), currentY);

        // Line 3: Latitude & Longitude Block
        currentY += 24 * scale;
        ctx.fillText(`Lat ${inputs.lat.value} Long ${inputs.long.value}`, textX + (18 * scale), currentY);

        // Line 4: Formatted Day, Date, Time & GMT Combo Row
        currentY += 24 * scale;
        ctx.fillText(`${inputs.date.value} ${inputs.time.value}`, textX + (18 * scale), currentY);
    }

    // High-Res Jpeg Download Processor
    downloadBtn.addEventListener("click", () => {
        if (!mainImg) {
            alert("Bhai, pehle main image upload karo!");
            return;
        }
        const link = document.createElement("a");
        link.download = `GeoTagStudio_${Date.now()}.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 1.0); // Retains premium original rendering quality
        link.click();
    });
});
