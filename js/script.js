const portada = document.getElementById('portada');
const juegoDiv = document.getElementById('juego');
const mensajeInicial = document.getElementById('mensajeInicial');
const nombresScreen = document.getElementById('nombresScreen');
const puntuacionesDiv = document.getElementById('puntuaciones');
const playerBtn = document.getElementById('playerBtn');
const aiBtn = document.getElementById('aiBtn');
const puntuacionesBtn = document.getElementById('puntuacionesBtn');
const comenzarBtn = document.getElementById('comenzarBtn');
const confirmarNombresBtn = document.getElementById('confirmarNombresBtn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const gameoverDiv = document.getElementById('gameover');
const winnerH2 = document.getElementById('winner');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const volverBtn = document.getElementById('volverBtn');
const borrarHistorialBtn = document.getElementById('borrarHistorialBtn');
const backgroundCanvas = document.getElementById('backgroundCanvas');
const backgroundCanvas2 = document.getElementById('backgroundCanvas2');
const bgCtx = backgroundCanvas.getContext('2d');
const bgCtx2 = backgroundCanvas2.getContext('2d');
const instruccionesJ2 = document.getElementById('instruccionesJ2');
const nombreJ1Input = document.getElementById('nombreJ1');
const nombreJ2Input = document.getElementById('nombreJ2');
const nombreJ2Group = document.getElementById('nombreJ2Group');

let nombreJugador1 = '';
let nombreJugador2 = '';

function ajustarCanvas() {
    backgroundCanvas.width = window.innerWidth;
    backgroundCanvas.height = window.innerHeight;
    backgroundCanvas2.width = window.innerWidth;
    backgroundCanvas2.height = window.innerHeight;
}
window.addEventListener('resize', ajustarCanvas);
ajustarCanvas();

//lineas
let lines = [];
let lines2 = [];//2?

function crearLineas() {
    lines = [];
    for (let i = 0; i < 60; i++) {
        lines.push({
            x: Math.random() * backgroundCanvas.width,
            y: Math.random() * backgroundCanvas.height,
            dx: (Math.random() * 10 + 1),//velocidad
            color: Math.random() > 0.5 ? '#0ff' : '#ff7f0f',//color
            length: Math.random() * 100 + 50
        });
    }
    
    lines2 = []; //para puntuacion
    for (let i = 0; i < 60; i++) {
        lines2.push({
            x: Math.random() * backgroundCanvas2.width,
            y: Math.random() * backgroundCanvas2.height,
            dx: (Math.random() * 2 + 1),
            color: Math.random() > 0.5 ? '#0ff' : '#ff7f0f',
            length: Math.random() * 100 + 50
        });
    }
}
crearLineas();

function drawBackground() {
    bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    lines.forEach(l => {
        bgCtx.strokeStyle = l.color;
        bgCtx.lineWidth = 2;
        bgCtx.beginPath();
        bgCtx.moveTo(l.x, l.y);
        bgCtx.lineTo(l.x - l.length, l.y);
        bgCtx.stroke();
        l.x += l.dx;
        if (l.x - l.length > backgroundCanvas.width) l.x = -l.length;
    });
    requestAnimationFrame(drawBackground);
}

function drawBackground2() {
    bgCtx2.clearRect(0, 0, backgroundCanvas2.width, backgroundCanvas2.height);
    lines2.forEach(l => {
        bgCtx2.strokeStyle = l.color;
        bgCtx2.lineWidth = 2;
        bgCtx2.beginPath();
        bgCtx2.moveTo(l.x, l.y);
        bgCtx2.lineTo(l.x - l.length, l.y);
        bgCtx2.stroke();
        l.x += l.dx;
        if (l.x - l.length > backgroundCanvas2.width) l.x = -l.length;
    });
    requestAnimationFrame(drawBackground2);
}

drawBackground();
drawBackground2();

const imagenFondo = new Image();
let imagenCargada = false;
imagenFondo.onload = () => { imagenCargada = true; };

const sonidoRebote = new Audio('img/hit.mp3');
const sonidoPunto = new Audio('img/point.mp3');
const sonidoGameOver = new Audio('img/vic.mp3');
const musicaJuego = new Audio('img/End of Line.mp3');

musicaJuego.loop = true;
musicaJuego.volume = 1;

function tryPlay(audio) {
    if (!audio) return;
    audio.currentTime = 0;
    const p = audio.play();
    if (p && p.catch) p.catch(() => {});
}

function stopMusic() {
    musicaJuego.pause();
    musicaJuego.currentTime = 0;
}

let mode = 'player';
let paddleWidth = 20, paddleHeight = 100;// hacerlos mas grandes
let player1 = { x: 10, y: 0, width: paddleWidth, height: paddleHeight, speed: 8, color: '#0ff' };//velocidad y color
let player2 = { x: 0, y: 0, width: paddleWidth, height: paddleHeight, speed: 8, color: '#ff7f0f' };//velocidad y color
let ball = { x: 0, y: 0, radius: 20, dx: 6, dy: 6, color: '#f0f' };
let score1 = 0, score2 = 0;
let keys = {};
let juegoActivo = false;
let ballResetTimeout = null;
let pointsToWin = 4;
let esperandoReset = false;
let esperandoInicio = false;
let tiempoInicio = 0;

//bot
const aiConfig = {
    reactionDelay: 50,
    errorMargin: 12,
    slowSpeed: 6.2,
    lazySpeed: 4.2,
    predictionErrorChance: 0.12,
    missChance: 0.03
};

let aiLastUpdate = Date.now();
let aiTargetY = 0;
let aiDistracted = false;

function initPositions() {
    player1.y = canvas.height / 2 - paddleHeight / 2;
    player2.x = canvas.width - 30;
    player2.y = canvas.height / 2 - paddleHeight / 2;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
}
initPositions();

function dibujarFondoCanvas() {
    if (imagenCargada && imagenFondo.src) {
        ctx.globalAlpha = 0.28;
        ctx.drawImage(imagenFondo, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
    } else {
        const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(1, '#001111');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function dibujarFondoNaranja() {
    ctx.fillStyle = 'rgba(255,127,0,0.08)'; //cuadro derecho dentro
    ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
}

function dibujarPaddle(p) {
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 14;
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.shadowBlur = 50;
}

function dibujarPelota() {
    ctx.fillStyle = ball.color;
    ctx.shadowColor = ball.color;
    ctx.shadowBlur = 20; 
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 50; //brillo
}

function dibujarPuntaje() {
    ctx.font = '100px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0ff';//numeros color
    ctx.fillText(score1, canvas.width / 4, 150);
    ctx.fillStyle = '#ff7f0f';
    ctx.fillText(score2, canvas.width * 3 / 4, 150);
}

//movimiento
function moverJugador1() {
    if (keys['w'] && player1.y > 0) player1.y -= player1.speed;
    if (keys['s'] && player1.y + player1.height < canvas.height) player1.y += player1.speed;
}

function moverJugador2() {
    if (mode === 'player') {
        if (keys['ArrowUp'] && player2.y > 0) player2.y -= player2.speed;
        if (keys['ArrowDown'] && player2.y + player2.height < canvas.height) player2.y += player2.speed;
    } else {
        //bot
        const now = Date.now();
        if (now - aiLastUpdate > aiConfig.reactionDelay) {
            aiLastUpdate = now;
            if (Math.random() < aiConfig.missChance) {
                aiDistracted = true;
                setTimeout(() => { aiDistracted = false; }, 250);
            }
            if (!aiDistracted) {
                let predictedY = ball.y;
                if (ball.dx !== 0) {
                    const timeToReach = (player2.x - ball.x) / ball.dx;
                    predictedY = ball.y + ball.dy * timeToReach;
                    if (predictedY < 0 || predictedY > canvas.height) {
                        const period = canvas.height * 2;
                        predictedY = ((predictedY % period) + period) % period;
                        if (predictedY > canvas.height) predictedY = period - predictedY;
                    }
                }
                if (Math.random() < aiConfig.predictionErrorChance) {
                    predictedY += (Math.random() - 0.5) * 80;
                } else {
                    predictedY += (Math.random() - 0.5) * aiConfig.errorMargin;
                }
                aiTargetY = predictedY - player2.height / 2;
            }
        }
        let speed = ball.dx > 0 ? aiConfig.slowSpeed : aiConfig.lazySpeed;
        if (aiDistracted) speed = 0;
        if (player2.y + player2.height / 2 < aiTargetY - 6) player2.y += speed;
        else if (player2.y + player2.height / 2 > aiTargetY + 6) player2.y -= speed;
        if (player2.y < 0) player2.y = 0;
        if (player2.y + player2.height > canvas.height) player2.y = canvas.height - player2.height;
    }
}

function moverPelota() {
    if (esperandoReset) return;
    ball.x += ball.dx;
    ball.y += ball.dy;
    // rebote
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        tryPlay(sonidoRebote);
        ball.dx *= 1.03; ball.dy *= 1.03;//aumente vel por rebote
    }
    // paddle 1 colisión
    if (ball.x - ball.radius < player1.x + player1.width &&
        ball.y > player1.y && ball.y < player1.y + player1.height) {
        ball.dx = Math.abs(ball.dx) * 1.05;
        const relative = (ball.y - (player1.y + player1.height / 2)) / (player1.height / 2);
        ball.dy += relative * 2;
        tryPlay(sonidoRebote);
    }
    // paddle 2 colisión
    if (ball.x + ball.radius > player2.x &&
        ball.y > player2.y && ball.y < player2.y + player2.height) {
        ball.dx = -Math.abs(ball.dx) * 1.05;
        const relative = (ball.y - (player2.y + player2.height / 2)) / (player2.height / 2);
        ball.dy += relative * 2;
        tryPlay(sonidoRebote);
    }

    //puntos
    if (ball.x - ball.radius < 0) ganarPunto(2);
    if (ball.x + ball.radius > canvas.width) ganarPunto(1);
}

//puntos
function ganarPunto(jugador) {
    if (!juegoActivo || esperandoReset) return;
    esperandoReset = true;
    if (jugador === 1) score1++;
    else score2++;
    tryPlay(sonidoPunto);
    
    if (score1 >= pointsToWin || score2 >= pointsToWin) {
        juegoActivo = false;
        esperandoReset = false;
        stopMusic();
        
        // Guardar estadísticas
        guardarPartida();
        
        // Determinar el ganador según el modo
        let textoGanador = '';
        if (score1 >= pointsToWin) {
            textoGanador = nombreJugador1 + ' Gana!';
        } else {
            textoGanador = nombreJugador2 + ' Gana!';
        }
        
        winnerH2.textContent = textoGanador;
        gameoverDiv.classList.remove('oculto');
        tryPlay(sonidoGameOver);
    } else {
        ballResetTimeout = setTimeout(() => {
            resetBall();
            esperandoReset = false;
            ballResetTimeout = null;
        }, 900);
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 2.5);//aumenta vel con reset
    ball.dy = (Math.random() * 4 - 2);
}

//reset bucle
function gameLoop() {
    if (!juegoActivo) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dibujarFondoCanvas();
    dibujarFondoNaranja();
    dibujarPaddle(player1);
    dibujarPaddle(player2);
    dibujarPelota();
    dibujarPuntaje();
    moverJugador1();
    moverJugador2();
    moverPelota();
    // línea central
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    requestAnimationFrame(gameLoop);
}

// Funciones para guardar y cargar estadísticas
function guardarPartida() {
    const tiempoFin = Date.now();
    const duracionSegundos = Math.floor((tiempoFin - tiempoInicio) / 1000);
    const minutos = Math.floor(duracionSegundos / 60);
    const segundos = duracionSegundos % 60;
    
    // Determinar ganador y perdedor
    const ganador = score1 >= pointsToWin ? nombreJugador1 : nombreJugador2;
    const perdedor = score1 >= pointsToWin ? nombreJugador2 : nombreJugador1;
    
    const partida = {
        fecha: new Date().toLocaleString('es-MX'),
        ganador: ganador,
        perdedor: perdedor,
        puntaje: `${score1} - ${score2}`,
        duracion: `${minutos}:${segundos.toString().padStart(2, '0')}`
    };
    
    let historial = JSON.parse(localStorage.getItem('pingpongHistorial') || '[]'); //guarda
    historial.unshift(partida);
    
    // Mantener solo las últimas 50 partidas
    if (historial.length > 50) historial = historial.slice(0, 50);
    
    localStorage.setItem('pingpongHistorial', JSON.stringify(historial));
}

function cargarHistorial() {
    const historial = JSON.parse(localStorage.getItem('pingpongHistorial') || '[]');
    const listaPartidas = document.getElementById('listaPartidas');
    
    if (historial.length === 0) {
        listaPartidas.innerHTML = '<p class="sin-partidas">No hay partidas registradas todavía</p>';
        return;
    }
    
    listaPartidas.innerHTML = historial.map(partida => `
        <div class="partida-item">
            <div class="partida-ganador">Ganador: ${partida.ganador}</div>
            <div class="partida-detalle">${partida.ganador} vs ${partida.perdedor}</div>
            <div class="partida-detalle">Puntaje: ${partida.puntaje}</div>
            <div class="partida-detalle">Duración: ${partida.duracion}</div>
        </div>
    `).join('');
}

function borrarHistorial() {
    if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
        localStorage.removeItem('pingpongHistorial');
        cargarHistorial();
    }
}

function volverAlMenu() {
    puntuacionesDiv.classList.add('oculto');
    portada.classList.remove('oculto');
}

playerBtn.addEventListener('click', () => {
    portada.classList.add('oculto');
    nombresScreen.classList.remove('oculto');
    nombreJ2Group.style.display = 'block';
    mode = 'player';
});

aiBtn.addEventListener('click', () => {
    portada.classList.add('oculto');
    nombresScreen.classList.remove('oculto');
    nombreJ2Group.style.display = 'none';
    mode = 'ai';
});

puntuacionesBtn.addEventListener('click', () => {
    portada.classList.add('oculto');
    puntuacionesDiv.classList.remove('oculto');
    cargarHistorial();
});

volverBtn.addEventListener('click', volverAlMenu);
borrarHistorialBtn.addEventListener('click', borrarHistorial);

confirmarNombresBtn.addEventListener('click', () => {
    // Obtener nombres
    nombreJugador1 = nombreJ1Input.value.trim() || 'Jugador 1';
    
    if (mode === 'ai') {
        nombreJugador2 = 'Bot';
    } else {
        nombreJugador2 = nombreJ2Input.value.trim() || 'Jugador 2';
    }
    
    // Limpiar inputs
    nombreJ1Input.value = '';
    nombreJ2Input.value = '';
    
    mostrarMensajeInicial();
});

comenzarBtn.addEventListener('click', () => {
    if (esperandoInicio) {
        iniciarJuegoReal();
    }
});

restartBtn.addEventListener('click', () => {
    gameoverDiv.classList.add('oculto');
    score1 = 0; 
    score2 = 0;
    esperandoReset = false;
    
    // Volver a pantalla de nombres
    juegoDiv.classList.add('oculto');
    nombresScreen.classList.remove('oculto');
    if (mode === 'ai') {
        nombreJ2Group.style.display = 'none';
    } else {
        nombreJ2Group.style.display = 'block';
    }
});

menuBtn.addEventListener('click', () => {
    gameoverDiv.classList.add('oculto');
    juegoDiv.classList.add('oculto');
    portada.classList.remove('oculto');
    score1 = 0; 
    score2 = 0;
    esperandoReset = false;
});

window.addEventListener('keydown', e => {
    keys[e.key] = true;
    
    // Iniciar juego con ESPACIO
    if (e.key === ' ' && esperandoInicio) {
        e.preventDefault();
        iniciarJuegoReal();
    }
});

window.addEventListener('keyup', e => {
    keys[e.key] = false;
});

//mensaje box
function mostrarMensajeInicial() {
    nombresScreen.classList.add('oculto');
    mensajeInicial.classList.remove('oculto');
    esperandoInicio = true;
    
    if (mode === 'ai') {
        instruccionesJ2.style.display = 'none';
    } else {
        instruccionesJ2.style.display = 'block';
    }
}

//iniciar
function iniciarJuegoReal() {
    if (!esperandoInicio) return;
    
    esperandoInicio = false;
    mensajeInicial.classList.add('oculto');
    juegoDiv.classList.remove('oculto');
    
    // Iniciar música
    tryPlay(musicaJuego);
    
    score1 = 0; 
    score2 = 0;
    esperandoReset = false;
    aiLastUpdate = Date.now();
    aiDistracted = false;
    tiempoInicio = Date.now();
    
    initPositions();
    resetBall();
    juegoActivo = true;
    requestAnimationFrame(gameLoop);
}