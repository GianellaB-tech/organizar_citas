const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname)); 

// Conexión a la base de datos con la ruta absoluta (Soluciona el error de actualización)
const dbPath = path.join(__dirname, 'citas.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error al abrir DB:", err.message);
    else console.log('✅ Conectado a SQLite en:', dbPath);
});

// --- RUTAS DE COMIDAS ---
app.get('/api/comidas', (req, res) => {
    db.all("SELECT * FROM comidas", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/comidas', (req, res) => {
    const { nombre, tipo } = req.body;
    db.run("INSERT INTO comidas (nombre, modalidad) VALUES (?, ?)", [nombre, tipo], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// --- RUTAS DE PELÍCULAS ---
app.get('/api/peliculas', (req, res) => {
    db.all("SELECT * FROM peliculas", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/peliculas', (req, res) => {
    const { titulo, plataforma } = req.body;
    db.run("INSERT INTO peliculas (titulo, plataforma) VALUES (?, ?)", [titulo, plataforma], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// --- RUTAS DE CITAS ---
app.get('/api/citas', (req, res) => {
    // Usamos JOIN para traer los nombres de la comida y película usando sus IDs
    const query = `
        SELECT citas.*, 
               comidas.nombre AS nombre_comida, 
               peliculas.titulo AS titulo_pelicula 
        FROM citas 
        LEFT JOIN comidas ON citas.comida_id = comidas.id 
        LEFT JOIN peliculas ON citas.pelicula_id = peliculas.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/citas', (req, res) => {
    const { fecha, titulo, comida_id, pelicula_id } = req.body;
    db.run("INSERT INTO citas (fecha, titulo, comida_id, pelicula_id) VALUES (?, ?, ?, ?)", 
        [fecha, titulo, comida_id, pelicula_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// --- NUEVA RUTA PARA BORRAR CITAS ---
app.delete('/api/citas/:id', (req, res) => {
    const idCita = req.params.id;
    db.run("DELETE FROM citas WHERE id = ?", [idCita], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: "Cita cancelada correctamente" });
    });
});
app.listen(3000, () => {
    console.log('🚀 Servidor corriendo en http://localhost:3000');
});