let scanner = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Botones principales
    document.getElementById('startCamera').addEventListener('click', startScanner);
    document.getElementById('closeScanner')?.addEventListener('click', stopScanner);
    document.getElementById('uploadButton').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });

    // Input de archivo
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
}

function startScanner() {
    document.getElementById('scannerView').classList.remove('hidden');
    
    if (scanner) {
        stopScanner();
    }
    
    scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
    });
    
    scanner.render(handleScanSuccess, handleScanError);
}

async function handleScanSuccess(decodedText) {
    try {
        const data = JSON.parse(decodedText);
        processScheduleData(data);
        stopScanner();
    } catch (error) {
        console.error('Error al procesar el código:', error);
        alert('El código escaneado no contiene un formato válido');
    }
}

function handleScanError(error) {
    if (error?.name === 'NotAllowedError') {
        alert('No se pudo acceder a la cámara. Por favor, permite el acceso.');
        stopScanner();
    }
}

function stopScanner() {
    if (scanner) {
        scanner.clear().catch(error => {
            console.error('Error al detener el scanner:', error);
        }).finally(() => {
            scanner = null;
            document.getElementById('scannerView').classList.add('hidden');
        });
    }
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Aquí iría la lógica para procesar la imagen con OCR
        // Por ahora usamos datos de ejemplo
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
    } catch (error) {
        console.error('Error al procesar la imagen:', error);
        alert('Error al procesar la imagen');
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
    
    // Ajustar si el turno termina después de medianoche
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
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('dayHours').textContent = hours.dayHours.toFixed(2);
