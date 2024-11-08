let scanner = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Configurar eventos para la cámara
    const startCameraButton = document.getElementById('startCamera');
    const closeButton = document.getElementById('closeScanner');
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');

    if (startCameraButton) {
        startCameraButton.addEventListener('click', () => {
            initializeScanner();
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            stopScanner();
        });
    }

    if (uploadButton && fileInput) {
        uploadButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', handleFileUpload);
    }
}

async function initializeScanner() {
    try {
        const scannerView = document.getElementById('scannerView');
        scannerView.classList.remove('hidden');

        if (scanner) {
            await stopScanner();
        }

        scanner = new Html5Qrcode("reader");
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
        };

        await scanner.start(
            { facingMode: "environment" },
            config,
            handleScanSuccess,
            handleScanError
        );

    } catch (error) {
        console.error("Error al iniciar el scanner:", error);
        alert("Error al iniciar la cámara. Por favor, verifica los permisos.");
    }
}

async function handleScanSuccess(decodedText) {
    console.log("Código escaneado:", decodedText);
    try {
        // Por ahora usaremos datos de ejemplo para probar
        const exampleData = {
            shifts: [
                { day: 'Lun', date: '4', time: '17:00-00:00' },
                { day: 'Mar', date: '5', time: '17:00-01:00' },
                { day: 'Mié', date: '6', time: '17:00-00:05' },
                { day: 'Jue', date: '7', time: '16:00-22:00' },
                { day: 'Vie', date: '8', time: '10:00-17:00' },
                { day: 'Sáb', date: '9', time: 'Día libre' },
                { day: 'Dom', date: '10', time: '17:00-00:00' }
            ]
        };
        
        processScheduleData(exampleData);
        await stopScanner();
    } catch (error) {
        console.error('Error al procesar el código:', error);
        alert('Error al procesar el código QR');
    }
}

function handleScanError(error) {
    console.error("Error en el escaneo:", error);
    // Solo mostrar alertas para errores críticos
    if (error.name === "NotAllowedError") {
        alert("No se permitió el acceso a la cámara");
        stopScanner();
    }
}

async function stopScanner() {
    if (scanner) {
        try {
            await scanner.stop();
            scanner.clear();
            scanner = null;
            document.getElementById('scannerView').classList.add('hidden');
        } catch (error) {
            console.error("Error al detener el scanner:", error);
        }
    }
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Mostrar un indicador de carga si lo deseas
    try {
        // Crear una URL para la imagen
        const imageUrl = URL.createObjectURL(file);
        console.log("Imagen cargada:", imageUrl);

        // Por ahora usaremos datos de ejemplo
        const exampleData = {
            shifts: [
                { day: 'Lun', date: '4', time: '17:00-00:00' },
                { day: 'Mar', date: '5', time: '17:00-01:00' },
                { day: 'Mié', date: '6', time: '17:00-00:05' },
                { day: 'Jue', date: '7', time: '16:00-22:00' },
                { day: 'Vie', date: '8', time: '10:00-17:00' },
                { day: 'Sáb', date: '9', time: 'Día libre' },
                { day: 'Dom', date: '10', time: '17:00-00:00' }
            ]
        };

        processScheduleData(exampleData);

        // Limpiar la selección del archivo
        event.target.value = '';
    } catch (error) {
        console.error('Error al procesar la imagen:', error);
        alert('Error al procesar la imagen');
    } finally {
        // Liberar la URL creada
        URL.revokeObjectURL(imageUrl);
    }
}

function processScheduleData(data) {
    let totalDay = 0;
    let totalNight = 0;
    let sundayHours = 0;
    let holidayHours = 0;

    data.shifts.forEach(shift => {
        if (shift.time === 'Día libre') return;

        const hours = calculateHours(shift.time, shift.day);
        
        if (shift.isHoliday) {
            holidayHours += hours.total;
        } else if (shift.day === 'Dom') {
            sundayHours += hours.total;
        } else {
            totalDay += hours.day;
            totalNight += hours.night;
        }
    });

    updateUI({
        dayHours: totalDay,
        nightHours: totalNight,
        sundayHours: sundayHours,
        holidayHours: holidayHours,
        total: totalDay + totalNight + sundayHours + holidayHours
    });
}

function calculateHours(timeRange, day) {
    if (timeRange === 'Día libre') return { day: 0, night: 0, total: 0 };

    const [startTime, endTime] = timeRange.split('-');
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);
    
    if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
        endHour += 24;
    }

    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    let dayMinutes = 0;
    let nightMinutes = 0;

    for (let minute = startHour * 60 + startMinute; minute < endHour * 60 + endMinute; minute++) {
        const hour = Math.floor((minute % 1440) / 60);
        if (hour >= 8 && hour < 22) {
            dayMinutes++;
        } else {
            nightMinutes++;
        }
    }

    return {
        day: dayMinutes / 60,
        night: nightMinutes / 60,
        total: totalMinutes / 60
    };
}

function updateUI(hours) {
    const resultsDiv = document.getElementById('results');
    
    if (resultsDiv) {
        resultsDiv.classList.remove('hidden');
        
        document.getElementById('dayHours').textContent = hours.dayHours.toFixed(2);
        document.getElementById('nightHours').textContent = hours.nightHours.toFixed(2);
        document.getElementById('sundayHours').textContent = hours.sundayHours.toFixed(2);
        document.getElementById('holidayHours').textContent = hours.holidayHours.toFixed(2);
        document.getElementById('totalHours').textContent = hours.total.toFixed(2);
    }
}

// Limpiar al cerrar
window.addEventListener('beforeunload', () => {
    if (scanner) {
        scanner.stop().catch(console.error);
    }
});
