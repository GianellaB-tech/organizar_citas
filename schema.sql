-- Crear tabla de Comidas
CREATE TABLE comidas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT,
    modalidad TEXT
);

-- Crear tabla de Películas
CREATE TABLE peliculas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    genero TEXT,
    plataforma TEXT,
    estado TEXT DEFAULT 'Pendiente'
);

-- Crear tabla de Citas (Calendario)
CREATE TABLE citas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATE NOT NULL,
    titulo TEXT NOT NULL,
    comida_id INTEGER,
    pelicula_id INTEGER,
    FOREIGN KEY (comida_id) REFERENCES comidas(id),
    FOREIGN KEY (pelicula_id) REFERENCES peliculas(id)
);