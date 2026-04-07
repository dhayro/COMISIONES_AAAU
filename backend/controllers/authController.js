const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Registrar usuario
const registrar = async (req, res) => {
  try {
    const { email, password, nombre } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const connection = await pool.getConnection();

    try {
      // Verificar si el email ya existe
      const [users] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (users.length > 0) {
        return res.status(400).json({ error: 'Email ya registrado' });
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar usuario
      const [result] = await connection.query(
        'INSERT INTO users (email, password, nombre, rol) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, nombre, 'usuario']
      );

      return res.status(201).json({
        mensaje: 'Usuario registrado exitosamente',
        usuario_id: result.insertId
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error en registrar:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// Iniciar sesión
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const connection = await pool.getConnection();

    try {
      // Buscar usuario por username (incluir ambito_id)
      const [users] = await connection.query(
        'SELECT id, email, password, nombre, rol, ambito_id FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const user = users[0];

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, user.password);

      if (!passwordValida) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Generar JWT (incluir ambito_id)
      const token = jwt.sign(
        { id: user.id, email: user.email, username: username, rol: user.rol, ambito_id: user.ambito_id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      return res.status(200).json({
        mensaje: 'Login exitoso',
        token,
        usuario: {
          id: user.id,
          email: user.email,
          username: username,
          nombre: user.nombre,
          rol: user.rol,
          ambito_id: user.ambito_id
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Obtener perfil actual
const obtenerPerfil = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.query(
        'SELECT id, email, nombre, rol, ambito_id FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      return res.status(200).json({ usuario: users[0] });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error en obtenerPerfil:', error);
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

module.exports = { registrar, login, obtenerPerfil };
