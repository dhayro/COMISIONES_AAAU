const logger = require('../shared/logger');
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
    logger.error('Error en registrar:', error);
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
        'SELECT id, email, password, nombre, rol, ambito_id, debe_cambiar_password FROM users WHERE username = ?',
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
        debe_cambiar_password: !!user.debe_cambiar_password,
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
    logger.error('Error en login:', error);
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
    logger.error('Error en obtenerPerfil:', error);
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

const cambiarPassword = async (req, res) => {
  try {
    const { password_actual, password_nueva } = req.body;

    if (!password_actual || !password_nueva) {
      return res.status(400).json({ error: 'La contraseña actual y la nueva son requeridas' });
    }
    if (password_nueva.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }
    if (password_nueva === password_actual || password_nueva === 'Autoridad1') {
      return res.status(400).json({ error: 'Elige una contraseña distinta a la actual o a la por defecto' });
    }

    const [usuarios] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const actualValida = await bcrypt.compare(password_actual, usuarios[0].password);
    if (!actualValida) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    const hash = await bcrypt.hash(password_nueva, 10);
    await pool.query('UPDATE users SET password = ?, debe_cambiar_password = 0 WHERE id = ?', [hash, req.user.id]);

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    logger.error('❌ Error al cambiar contraseña:', error.message);
    res.status(500).json({ error: 'No se pudo cambiar la contraseña' });
  }
};

module.exports = { registrar, login, obtenerPerfil, cambiarPassword };
