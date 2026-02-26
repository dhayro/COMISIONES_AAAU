const User = require('../models/User');

exports.listar = async (req, res) => {
  try {
    const usuarios = await User.listar();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listarActivos = async (req, res) => {
  try {
    const usuarios = await User.obtenerActivos();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await User.obtenerPorId(id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, username, email, rol, ambito_id, dni, cargo_id } = req.body;

    if (!nombre || !username || !email || !rol) {
      return res.status(400).json({ error: 'Nombre, usuario, email y rol son requeridos' });
    }

    const id = await User.crear({ nombre, username, email, rol, ambito_id, dni, cargo_id });
    const usuarioCreado = await User.obtenerPorId(id);
    
    res.status(201).json({
      mensaje: 'Usuario creado exitosamente. Contraseña por defecto: Autoridad1',
      usuario: usuarioCreado
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, username, email, rol, ambito_id, dni, cargo_id } = req.body;

    if (!nombre && !username && !email && !rol && ambito_id === undefined && !dni && cargo_id === undefined) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
    }

    const usuarioActual = await User.obtenerPorId(id);
    if (!usuarioActual) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const datosActualizados = {
      nombre: nombre !== undefined ? nombre : usuarioActual.nombre,
      username: username !== undefined ? username : usuarioActual.username,
      email: email !== undefined ? email : usuarioActual.email,
      rol: rol !== undefined ? rol : usuarioActual.rol,
      ambito_id: ambito_id !== undefined ? ambito_id : usuarioActual.ambito_id,
      dni: dni !== undefined ? dni : usuarioActual.dni,
      cargo_id: cargo_id !== undefined ? cargo_id : usuarioActual.cargo_id
    };

    await User.actualizar(id, datosActualizados);

    const usuarioActualizado = await User.obtenerPorId(id);
    res.json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.activarDesactivar = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (activo === undefined) {
      return res.status(400).json({ error: 'El campo activo es requerido' });
    }

    const usuario = await User.obtenerPorId(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await User.toggleActivo(id, activo);

    res.json({
      mensaje: activo ? 'Usuario activado exitosamente' : 'Usuario desactivado exitosamente',
      activo: activo ? 1 : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await User.obtenerPorId(id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await User.eliminar(id);

    res.json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resetearPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await User.obtenerPorId(id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const resultado = await User.resetearPassword(id);
    
    if (!resultado) {
      return res.status(500).json({ error: 'No se pudo resetear la contraseña' });
    }

    res.json({ 
      mensaje: 'Contraseña reseteada exitosamente a: Autoridad1',
      usuarioId: id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
