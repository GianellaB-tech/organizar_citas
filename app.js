let calendar; 

function mostrarSeccion(idSeccion) {
    document.querySelectorAll('.seccion').forEach(sec => sec.classList.add('oculto'));
    document.getElementById(idSeccion).classList.remove('oculto');
    if(idSeccion === 'sec-calendario' && calendar) calendar.render();
}

document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendario-full');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        // Detectar clic en una cita
        eventClick: async function(info) {
            if (confirm(`¿Quieres cancelar la cita: "${info.event.title}"?`)) {
                try {
                    const respuesta = await fetch(`/api/citas/${info.event.id}`, { method: 'DELETE' });
                    if (respuesta.ok) {
                        cargarDatos(); // Recargar si se borró bien
                    } else {
                        alert("Error al borrar la cita en el servidor.");
                    }
                } catch (error) {
                    console.error("Error en la petición:", error);
                }
            }
        }
    });
    calendar.render();
    cargarDatos(); 
});

const formCita = document.getElementById('form-cita');
const formComida = document.getElementById('form-comida');
const listaComidas = document.getElementById('lista-comidas');
const formPelicula = document.getElementById('form-pelicula');
const listaPeliculas = document.getElementById('lista-peliculas');

async function cargarDatos() {
    try {
        const [resCitas, resComidas, resPeliculas] = await Promise.all([
            fetch('/api/citas'),
            fetch('/api/comidas'),
            fetch('/api/peliculas')
        ]);

        const citas = await resCitas.json();
        const comidas = await resComidas.json();
        const peliculas = await resPeliculas.json();

        // 1. Llenar los selectores de la pestaña del Calendario
        const selectComida = document.getElementById('select-comida-cita');
        const selectPelicula = document.getElementById('select-pelicula-cita');
        
        selectComida.innerHTML = '<option value="">-- Sin Comida --</option>' + 
            comidas.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
            
        selectPelicula.innerHTML = '<option value="">-- Sin Película --</option>' + 
            peliculas.map(p => `<option value="${p.id}">${p.titulo}</option>`).join('');

        // 2. Llenar el calendario
        calendar.removeAllEvents();
        const ahora = new Date().toISOString(); // Tomamos fecha y hora exactas
        
        citas.forEach(cita => {
            const esPasada = cita.fecha < ahora;
            
            let tituloCompleto = cita.titulo;
            if (cita.nombre_comida) tituloCompleto += ` | 🍕 ${cita.nombre_comida}`;
            if (cita.titulo_pelicula) tituloCompleto += ` | 🎬 ${cita.titulo_pelicula}`;

            calendar.addEvent({
                id: String(cita.id),
                title: tituloCompleto,
                start: cita.fecha, // Como ahora incluye la hora, FullCalendar le pondrá un puntito con la hora
                color: esPasada ? '#10ac84' : '#ff6b6b',
                cursor: 'pointer'
            });
        });

        // 3. Llenar listas de bancos
        listaComidas.innerHTML = comidas.map(c => `<li><span>🍕 ${c.nombre} (${c.modalidad})</span></li>`).join('');
        listaPeliculas.innerHTML = peliculas.map(p => `<li><span>🎬 ${p.titulo} (${p.plataforma})</span></li>`).join('');
    } catch (error) {
        console.error("Error cargando los datos:", error);
    }
}

// Evento: Agregar Cita (Con Hora)
formCita.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fecha = document.getElementById('fecha-cita').value;
    const hora = document.getElementById('hora-cita').value;
    // Juntamos la fecha y la hora con una "T" en el medio (Formato estándar ISO)
    const fechaCompleta = `${fecha}T${hora}`; 
    
    const titulo = document.getElementById('titulo-cita').value;
    
    const selectComida = document.getElementById('select-comida-cita');
    const comida_id = selectComida.value || null;
    const comidaTexto = selectComida.options[selectComida.selectedIndex].text;

    const selectPelicula = document.getElementById('select-pelicula-cita');
    const pelicula_id = selectPelicula.value || null;
    const peliculaTexto = selectPelicula.options[selectPelicula.selectedIndex].text;

    // Guardar en la base de datos enviando la fecha unida con la hora
    await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: fechaCompleta, titulo, comida_id, pelicula_id })
    });

    // DISEÑAR EL TICKET / RECIBO
    const ticketDiv = document.createElement('div');
    ticketDiv.innerHTML = `
        <div style="padding: 40px; border: 3px dashed #ff6b6b; border-radius: 15px; font-family: 'Courier New', Courier, monospace; width: 400px; background-color: #fffafb; color: #333; margin: 0 auto;">
            <h1 style="color: #ff6b6b; text-align: center; margin-bottom: 5px;">🎟️ TICKET DE CITA 🎟️</h1>
            <p style="text-align: center; font-size: 14px; color: #666; margin-top: 0;">Válido para una velada increíble</p>
            <hr style="border: 1px dashed #ff6b6b; margin: 20px 0;">
            <div style="font-size: 18px; line-height: 1.8;">
                <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> ${fecha} a las ${hora} hs</p>
                <p style="margin: 5px 0;"><strong>✨ Plan:</strong> ${titulo}</p>
                <p style="margin: 5px 0;"><strong>🍕 Comida:</strong> ${comida_id ? comidaTexto : 'Sorpresa'}</p>
                <p style="margin: 5px 0;"><strong>🎬 Peli:</strong> ${pelicula_id ? peliculaTexto : 'Sin película'}</p>
            </div>
            <hr style="border: 1px dashed #ff6b6b; margin: 20px 0;">
            <p style="text-align: center; font-size: 16px; font-weight: bold;">💖 ¡Que lo disfruten! 💖</p>
        </div>
    `;

    const opcionesPDF = {
        margin:       10,
        filename:     `Ticket_Cita_${fecha}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' } // Tamaño tipo flyer
    };

    html2pdf().set(opcionesPDF).from(ticketDiv).save();

    // 5. Limpiar formulario y recargar el calendario
    formCita.reset();
    cargarDatos();
});

// Eventos de Comidas y Películas (Quedan iguales)
formComida.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre-comida').value;
    const tipo = document.getElementById('tipo-comida').value;
    await fetch('/api/comidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, tipo })
    });
    formComida.reset();
    cargarDatos();
});

formPelicula.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('titulo-pelicula').value;
    const plataforma = document.getElementById('plataforma-pelicula').value;
    await fetch('/api/peliculas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, plataforma })
    });
    formPelicula.reset();
    cargarDatos();
});