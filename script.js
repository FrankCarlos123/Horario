let scanner = null;
let scheduleHistory = [];

// Cargar datos guardados al iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadHistory();
    initializeApp();
});

function initializeApp() {
    document.getElementById('startScan').addEventListener('click', startScanner);
    document.getElementById('closeScanner').addEventListener('click', stopScanner);
}

function loadHistory() {
    const savedHistory = localStorage.getItem('scheduleHistory');
    if (savedHistory) {
        scheduleHistory = JSON.parse(savedHistory);
        renderHistory();
        calculateTotals();
    }
}

function saveHistory() {
    localStorage.setItem('scheduleHistory', JSON.stringify(scheduleHistory));
}

function startScanner() {
    document.getElementById('scannerView').classList.remove('hidden');
    
    if (scanner) {
        stopScanner();
    }
    
    scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    });
    
    scanner.render(handleScanSuccess, handleScanError);
}

function stopScanner() {
    if (scanner) {
        scanner.clear()
            .catch(error => console.error('Error al detener el scanner:', error))
            .finally(() => {
                scanner = null;
                document.getElementById('scannerView').classList.add('hidden');
            });
    } else {
        document.getElementById('scannerView').classList.add('hidden');
    }
}

async function handleScanSuccess(decodedText) {
    try {
        // Aquí procesaríamos el texto decodificado de la imagen
        // Por ahora usamos datos de ejemplo
        const scannedData = {
            date: new Date().toISOString(),
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
        
        // Agregar al historial
        scheduleHistory.unshift(scannedData);
        saveHistory();
        renderHistory();
        calculateTotals();
        
        stopScanner();
    } catch (error) {
        console.error('Error al procesar el código:', error);
        alert('El formato del código escaneado no es válido');
    }
}

function handleScanError(error) {
    console.error(error);
    if (error?.name === 'NotAllowedError') {
        alert('No se pudo acceder a la cámara. Por favor, permite el acceso.');
        stopScanner();
    }
}

function renderHistory() {
    const historyContainer = document.getElementById('history');
    historyContainer.innerHTML = '';
    
    scheduleHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const date = new Date(item.date).toLocaleString();
        let shiftsHtml = item.shifts.map(shift => 
            `<div>${shift.day} ${shift.date}: ${shift.time}</div>`
        ).join('');
        
        historyItem.innerHTML = `
            <div class="date">${date}</div>
            <div class="shifts">${shiftsHtml}</div>
            <button class="neon-button" onclick="deleteHistoryItem(${index})">Eliminar</button>
        `;
        
        historyContainer.appendChild(historyItem);
    });
}

function deleteHistoryItem(index) {
    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        scheduleHistory.splice(index, 1);
        saveHistory();
        renderHistory();
        calculateTotals();
    }
}

function calculateTotals() {
    let totalDay = 0;
    let totalNight = 0;
    let sundayHours = 0;
    let holidayHours = 0;

    scheduleHistory.forEach(record => {
        record.shifts.forEach(shift => {
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

    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + start
