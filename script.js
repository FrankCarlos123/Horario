document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
    const cameraButton = document.getElementById('camera-button');
    const imagePreview = document.getElementById('image-preview');
    const preview = document.getElementById('preview');
    const processButton = document.getElementById('process-button');
    
    // Configuración de la cámara
    let stream = null;
    
    // Evento para subir archivo
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                imagePreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Evento para usar la cámara
    cameraButton.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            preview.srcObject = stream;
            imagePreview.classList.remove('hidden');
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('No se pudo acceder a la cámara');
        }
    });
    
    // Procesar imagen
    processButton.addEventListener('click', async () => {
        processButton.classList.add('processing');
        processButton.textContent = 'Procesando...';
        
        try {
            // Aquí iría la lógica para procesar la imagen con un servicio de OCR o Gemini
            const processedData = await processImage(preview.src);
            updateShifts(processedData);
        } catch (err) {
            console.error('Error processing image:', err);
            alert('Error al procesar la imagen');
        } finally {
            processButton.classList.remove('processing');
            processButton.textContent = 'Procesar Imagen';
        }
    });
    
    // Función para procesar la imagen (simulada)
    async function processImage(imageData) {
        // Aquí se implementaría la conexión con el servicio de OCR o Gemini
        return new Promise((resolve) => {
            setTimeout(() => {
                // Datos de ejemplo
                resolve([
                    { day: 'Lun', date: '4', time: '08:00-16:00', isHoliday: false },
                    { day: 'Mar', date: '5', time: '09:00-17:00', isHoliday: false },
                    // ... más turnos
                ]);
            }, 2000);
        });
    }
    
    // Función para calcular horas
    function calculateHours(startTime, endTime) {
        if (!startTime || !endTime) return { day: 0, night: 0, total: 0 };
        
        const [startHour, startMinute] = startTime.split(':').map(Number);
        let [endHour, endMinute] = endTime.split(':').map(Number);
        
        if (endHour < startHour) endHour += 24;
        
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
    
    // Función para actualizar la interfaz con nuevos datos
    function updateShifts(shifts) {
        const shiftsList = document.getElementById('shifts-list');
        shiftsList.innerHTML = '';
        
        let totalDay = 0;
        let totalNight = 0;
        let holidayHours = 0;
        let sundayHours = 0;
        
        shifts.forEach(shift => {
            // Crear elemento del turno
            const shiftElement = document.createElement('div');
            shiftElement.className = `shift-item ${shift.isHoliday ? 'holiday' : ''}`;
            shiftElement.innerHTML = `
                <span>${shift.day} ${shift.date}</span>
                <span>${shift.time}</span>
            `;
            shiftsList.appendChild(shiftElement);
            
            // Calcular horas
            if (shift.time !== 'Día libre') {
                const [start, end] = shift.time.split('-');
                const hours = calculateHours(start, end);
                
                if (shift.isHoliday) {
                    holidayHours += hours.total;
