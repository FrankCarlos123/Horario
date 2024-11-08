// Datos de ejemplo
let shifts = [
    { day: 'Lun', date: '4', time: 'Día libre', isHoliday: false },
    { day: 'Mar', date: '5', time: '17:00-00:00', isHoliday: false },
    { day: 'Mié', date: '6', time: '17:00-01:00', isHoliday: false },
    { day: 'Jue', date: '7', time: '17:00-00:05', isHoliday: false },
    { day: 'Vie', date: '8', time: '16:00-22:00', isHoliday: false },
    { day: 'Sáb', date: '9', time: '10:00-17:00', isHoliday: false },
    { day: 'Dom', date: '10', time: '17:00-00:00', isHoliday: false }
];

// Función para calcular horas entre dos horarios
function calculateHours(startTime, endTime) {
    if (startTime === 'Día libre') return { day: 0, night: 0, total: 0 };

    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Ajustar si el turno termina después de medianoche
    if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
        endHour += 24;
    }

    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    let dayMinutes = 0;
    let nightMinutes = 0;

    // Calcular minutos por periodo (día/noche)
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

// Función para calcular el total de horas
function calculateTotalHours() {
    let totalDay = 0;
    let totalNight = 0;
    let holidayHours = 0;
    let sundayHours = 0;

    shifts.forEach(shift => {
        if (shift.time === 'Día libre') return;

        const [start, end] = shift.time.split('-');
        const hours = calculateHours(start, end);

        if (shift.isHoliday) {
            holidayHours += hours.total;
        } else if (shift.day === 'Dom') {
            sundayHours += hours.total;
        } else {
            totalDay += hours.day;
            totalNight += hours.night;
        }
    });

    return { totalDay, totalNight, holidayHours, sundayHours };
}

// Función para renderizar los turnos
function renderShifts() {
    const shiftsList = document.getElementById('shifts-list');
    shiftsList.innerHTML = '';

    shifts.forEach((shift, index) => {
        const shiftElement = document.createElement('div');
        shiftElement.className = `shift-item ${shift.isHoliday ? 'holiday' : ''}`;
        
        shiftElement.innerHTML = `
            <span class="day-label">${shift.day} ${shift.date}</span>
            <span class="time-label">${shift.time}</span>
        `;
        
        shiftsList.appendChild(shiftElement);
    });
}

// Función para actualizar el resumen de horas
function updateHoursSummary() {
    const totals = calculateTotalHours();
    
    document.getElementById('day-hours').textContent = totals.totalDay.toFixed(2);
    document.getElementById('night-hours').textContent = totals.totalNight.toFixed(2);
    document.getElementById('sunday-hours').textContent = totals.sundayHours.toFixed(2);
    document.getElementById('holiday-hours').textContent = totals.holidayHours.toFixed(2);
    document.getElementById('total-hours').textContent = 
        (totals.totalDay + totals.totalNight + totals.sundayHours + totals.holidayHours).toFixed(2);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    renderShifts();
    updateHoursSummary();

    // Evento para la sección de cámara
    document.getElementById('camera-section').addEventListener('click', () => {
        // Aquí se implementaría la funcionalidad de la cámara
        alert('Funcionalidad de cámara no implementada');
    });
});

// Función para procesar una imagen (simulada)
function processImage(imageData) {
    // Aquí iría la lógica para procesar la imagen con Gemini
    console.log('Procesando imagen...', imageData);
}

// Función para actualizar los turnos
function updateShifts(newShifts) {
    shifts = newShifts;
    renderShifts();
    updateHoursSummary();
}