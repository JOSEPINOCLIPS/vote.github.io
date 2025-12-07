// CONFIGURACIÓN
const CONFIG = {
    intervaloActualizacion: 30000, // 30 segundos
    mostrarDatosDemo: true, // Cambiar a false en producción
    apiUrl: '' // Tu URL de API aquí
};

// ELEMENTOS DOM
const elementos = {
    panelResultados: document.getElementById('panel-resultados'),
    contador: document.getElementById('contador'),
    btnActualizar: document.getElementById('btn-actualizar'),
    iconoEstado: document.getElementById('icono-estado'),
    textoEstado: document.getElementById('texto-estado'),
    horaActualizacion: document.getElementById('hora-actualizacion'),
    totalVotos: document.getElementById('total-votos')
};

// VARIABLES GLOBALES
let contadorIntervalo;
let tiempoRestante = CONFIG.intervaloActualizacion / 1000;

// DATOS DEMO (para pruebas)
const datosDemo = {
    ultimaActualizacion: new Date().toISOString(),
    totalVotos: 1245,
    candidatos: [
        { id: 1, nombre: "Opción A", votos: 450, color: "#667eea" },
        { id: 2, nombre: "Opción B", votos: 380, color: "#4CAF50" },
        { id: 3, nombre: "Opción C", votos: 285, color: "#FF9800" },
        { id: 4, nombre: "Opción D", votos: 130, color: "#F44336" }
    ]
};

// FUNCIONES PRINCIPALES
function iniciarAplicacion() {
    configurarEventListeners();
    iniciarContador();
    cargarDatos();
}

function configurarEventListeners() {
    elementos.btnActualizar.addEventListener('click', () => {
        reiniciarContador();
        cargarDatos();
    });
}

function iniciarContador() {
    // Reiniciar si ya existe un intervalo
    if (contadorIntervalo) clearInterval(contadorIntervalo);
    
    tiempoRestante = CONFIG.intervaloActualizacion / 1000;
    actualizarContadorDisplay();
    
    contadorIntervalo = setInterval(() => {
        tiempoRestante--;
        actualizarContadorDisplay();
        
        if (tiempoRestante <= 0) {
            cargarDatos();
            reiniciarContador();
        }
    }, 1000);
}

function reiniciarContador() {
    tiempoRestante = CONFIG.intervaloActualizacion / 1000;
    actualizarContadorDisplay();
}

function actualizarContadorDisplay() {
    elementos.contador.textContent = tiempoRestante;
}

async function cargarDatos() {
    mostrarEstado('cargando');
    mostrarCargando();
    
    try {
        let datos;
        
        if (CONFIG.mostrarDatosDemo && !CONFIG.apiUrl) {
            // Usar datos demo
            await simularDelay(1000);
            datos = generarDatosAleatorios();
        } else if (CONFIG.apiUrl) {
            // Cargar desde API real
            datos = await fetchDatosAPI(CONFIG.apiUrl);
        } else {
            throw new Error('No hay API configurada');
        }
        
        procesarDatos(datos);
        mostrarEstado('conectado');
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        mostrarError(error.message);
        mostrarEstado('error');
    }
}

async function fetchDatosAPI(url) {
    const respuesta = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    
    if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
    }
    
    return await respuesta.json();
}

function procesarDatos(datos) {
    // Calcular porcentajes
    const total = datos.candidatos.reduce((sum, c) => sum + c.votos, 0);
    
    datos.candidatos.forEach(candidato => {
        candidato.porcentaje = total > 0 ? (candidato.votos / total * 100).toFixed(1) : 0;
    });
    
    // Ordenar por votos (descendente)
    datos.candidatos.sort((a, b) => b.votos - a.votos);
    
    // Actualizar UI
    actualizarHora();
    actualizarTotalVotos(total);
    renderizarCandidatos(datos.candidatos);
}

function renderizarCandidatos(candidatos) {
    if (candidatos.length === 0) {
        elementos.panelResultados.innerHTML = `
            <div class="error-mensaje">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>No hay datos disponibles</h3>
                <p>No se encontraron candidatos para mostrar</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    candidatos.forEach((candidato, index) => {
        const color = candidato.color || getColorPorIndice(index);
        
        html += `
            <div class="candidato-item">
                <div class="candidato-header">
                    <div class="candidato-nombre">
                        <i class="fas fa-user-circle"></i>
                        ${candidato.nombre}
                    </div>
                    <div class="candidato-votos">
                        ${candidato.votos.toLocaleString()} votos
                    </div>
                </div>
                
                <div class="barra-contenedor">
                    <div class="barra-progreso" 
                         style="width: ${candidato.porcentaje}%;
                                background: ${color};">
                    </div>
                </div>
                
                <div class="candidato-porcentaje">
                    ${candidato.porcentaje}% del total
                </div>
            </div>
        `;
    });
    
    elementos.panelResultados.innerHTML = html;
    
    // Animar barras después de renderizar
    setTimeout(() => {
        document.querySelectorAll('.barra-progreso').forEach(barra => {
            barra.style.transition = 'width 1.5s ease-in-out';
        });
    }, 100);
}

function getColorPorIndice(index) {
    const colores = [
        '#667eea', '#764ba2', '#4CAF50', '#FF9800',
        '#F44336', '#9C27B0', '#2196F3', '#FF5722'
    ];
    return colores[index % colores.length];
}

// FUNCIONES DE UI
function mostrarEstado(estado) {
    elementos.iconoEstado.className = 'fas fa-circle';
    elementos.textoEstado.textContent = 'Conectando...';
    
    switch(estado) {
        case 'conectado':
            elementos.iconoEstado.classList.add('conectado');
            elementos.textoEstado.textContent = 'Conectado';
            break;
        case 'error':
            elementos.iconoEstado.classList.add('error');
            elementos.textoEstado.textContent = 'Error de conexión';
            break;
        case 'cargando':
            elementos.iconoEstado.style.color = '#FF9800';
            elementos.textoEstado.textContent = 'Cargando...';
            break;
    }
}

function mostrarCargando() {
    elementos.panelResultados.innerHTML = `
        <div class="cargando">
            <div class="spinner"></div>
            <p>Cargando resultados...</p>
        </div>
    `;
}

function mostrarError(mensaje) {
    elementos.panelResultados.innerHTML = `
        <div class="error-mensaje">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error al cargar datos</h3>
            <p>${mensaje}</p>
            <button onclick="cargarDatos()" class="btn-refresh" style="margin-top: 15px;">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>
    `;
}

function actualizarHora() {
    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    const segundos = ahora.getSeconds().toString().padStart(2, '0');
    
    elementos.horaActualizacion.textContent = `${hora}:${minutos}:${segundos}`;
}

function actualizarTotalVotos(total) {
    elementos.totalVotos.textContent = total.toLocaleString();
}

// FUNCIONES AUXILIARES
function simularDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generarDatosAleatorios() {
    const nombres = ["Opción A", "Opción B", "Opción C", "Opción D", "Opción E"];
    const datos = JSON.parse(JSON.stringify(datosDemo)); // Copia profunda
    
    // Actualizar votos aleatorios
    datos.candidatos.forEach(candidato => {
        candidato.votos += Math.floor(Math.random() * 50) - 25;
        if (candidato.votos < 0) candidato.votos = 0;
    });
    
    // Actualizar timestamp
    datos.ultimaActualizacion = new Date().toISOString();
    
    return datos;
}

// INICIAR APLICACIÓN CUANDO EL DOM CARGUE
document.addEventListener('DOMContentLoaded', iniciarAplicacion);

// Manejar errores no capturados
window.addEventListener('error', (e) => {
    console.error('Error no capturado:', e.error);
    mostrarError('Error interno de la aplicación');
});
