document.addEventListener('DOMContentLoaded', async () => {
const supabaseUrl = 'https://kagxvpwegzudqgvtkiyb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZ3h2cHdlZ3p1ZHFndnRraXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MTcyNDIsImV4cCI6MjA1ODk5MzI0Mn0.Rm-yUrdAyo8y63T-VW4GNjvKbJW--jJzD6XpieH-6nM';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

    const botonNuevaTarea = document.getElementById('botonNuevaTarea');
    const formularioNuevaTarea = document.getElementById('formularioNuevaTarea');
    const formularioTarea = document.getElementById('formularioTarea');
    const botonCerrarFormulario = document.getElementById('botonCerrarFormulario');
    const listadoTareas = document.getElementById('listadoTareas');
    const filtroTodas = document.querySelector('input[value="todas"]');
    const filtroNoCompletadas = document.querySelector('input[value="noCompletadas"]');
    const selectCategoriaFormulario = document.getElementById('categoria');

    let tareas = [];
    let formularioVisible = false;
    let filtroActivo = 'todas';
    let categorias = [];

    async function cargarCategorias() {
        const { data, error } = await supabase.from('categorias').select('id, nombre');
        if (data) {
            categorias = data;
            categorias.forEach(categoria => {
                const opcion = document.createElement('option');
                opcion.value = categoria.id;
                opcion.textContent = categoria.nombre;
                selectCategoriaFormulario.appendChild(opcion);
            });
        }
    }

    async function cargarTareas() {
        const { data: tareasObtenidas, error } = await supabase.from('tareas').select('*').order('fecha', { ascending: false }).order('hora', { ascending: false });
        if (tareasObtenidas) {
            tareas = tareasObtenidas;
            mostrarTareas(tareas);
        }
    }

    async function guardarTarea(tarea) {
        if (tarea.hora === "") tarea.hora = null;
        if (tarea.fecha === "") tarea.fecha = null;
        await supabase.from('tareas').insert([tarea]);
        cargarTareas();
    }

    async function actualizarTarea(id, datosActualizados) {
        if (datosActualizados.hora === "") datosActualizados.hora = null;
        if (datosActualizados.fecha === "") datosActualizados.fecha = null;
        await supabase.from('tareas').update(datosActualizados).eq('id', id);
        cargarTareas();
    }

    async function borrarTarea(id) {
        await supabase.from('tareas').delete().eq('id', id);
        cargarTareas();
    }

    async function marcarComoCompletada(idTarea, completada) {
        await supabase.from('tareas').update({ completada: completada }).eq('id', idTarea);
        cargarTareas();
    }

    function mostrarFormularioTarea() {
        formularioNuevaTarea.classList.remove('oculto');
        botonNuevaTarea.textContent = '✖ Cerrar';
        formularioVisible = true;
    }

    function ocultarFormularioTarea() {
        formularioNuevaTarea.classList.add('oculto');
        botonNuevaTarea.textContent = '➕ Nuevo examen';
        formularioVisible = false;
        formularioTarea.reset();
    }

    function mostrarTareas(tareasParaMostrar) {
        listadoTareas.innerHTML = '';
        const tareasFiltradas = tareasParaMostrar.filter(tarea => filtroActivo !== 'noCompletadas' || !tarea.completada);

        if (tareasFiltradas.length === 0) {
            listadoTareas.innerHTML = '<p>No hay exámenes para mostrar con el filtro actual.</p>';
            return;
        }

        tareasFiltradas.forEach(tarea => {
            const tareaDiv = document.createElement('div');
            tareaDiv.classList.add('tarea');
            if (tarea.completada) tareaDiv.classList.add('completada');
            tareaDiv.dataset.id = tarea.id;

            const titulo = document.createElement('h3');
            titulo.classList.add('tarea-titulo');
            titulo.textContent = tarea.titulo;

            const descripcion = document.createElement('p');
            descripcion.classList.add('tarea-descripcion');
            descripcion.textContent = tarea.descripcion || '';

            const fechaHora = document.createElement('p');
            fechaHora.classList.add('tarea-fecha-hora');
            if (tarea.fecha) {
                const fecha = new Date(tarea.fecha);
                let texto = `📅 ${fecha.toLocaleDateString()}`;
                if (tarea.hora) texto += ` ⏰ ${tarea.hora}`;
                fechaHora.textContent = texto;
            } else {
                fechaHora.textContent = '📅 Sin fecha';
            }

            const prioridad = document.createElement('p');
            prioridad.classList.add('tarea-prioridad');
            prioridad.textContent = '⭐'.repeat(tarea.prioridad);

            const categoria = document.createElement('p');
            categoria.classList.add('tarea-categoria');
            const encontrada = obtenerNombreCategoria(tarea.id_categoria);
            categoria.textContent = `🏷️ ${encontrada || '(Sin categoría)'}`;

            const botones = document.createElement('div');
            botones.classList.add('tarea-botones');

            const btnCompletar = document.createElement('button');
            btnCompletar.textContent = tarea.completada ? '✅ Estudiado' : '✅ Marcar como estudiado';
            btnCompletar.addEventListener('click', () => marcarComoCompletada(tarea.id, !tarea.completada));

            const btnEditar = document.createElement('button');
            btnEditar.textContent = '✏️ Editar';
            btnEditar.addEventListener('click', () => mostrarFormularioEdicion(tarea));

            const btnBorrar = document.createElement('button');
            btnBorrar.textContent = '🗑️ Borrar';
            btnBorrar.addEventListener('click', () => borrarTarea(tarea.id));

            botones.append(btnCompletar, btnEditar, btnBorrar);

            tareaDiv.append(titulo);
            if (tarea.descripcion) tareaDiv.append(descripcion);
            tareaDiv.append(fechaHora, prioridad, categoria, botones);
            listadoTareas.appendChild(tareaDiv);
        });
    }

    function mostrarFormularioEdicion(tarea) {
        const tareaDiv = document.querySelector(`.tarea[data-id="${tarea.id}"]`);
        if (!tareaDiv) return;

        const form = document.createElement('form');
        form.classList.add('formulario-edicion');
        form.dataset.id = tarea.id;

        form.innerHTML = `
            <div><label>Asignatura:</label><input type="text" value="${tarea.titulo}" required></div>
            <div><label>Contenido:</label><textarea>${tarea.descripcion || ''}</textarea></div>
            <div><label>Fecha:</label><input type="date" value="${tarea.fecha || ''}"></div>
            <div><label>Hora:</label><input type="time" value="${tarea.hora || ''}"></div>
            <div><label>Importancia:</label>
                <select>
                    <option value="1" ${tarea.prioridad === 1 ? 'selected' : ''}>⭐</option>
                    <option value="2" ${tarea.prioridad === 2 ? 'selected' : ''}>⭐⭐</option>
                    <option value="3" ${tarea.prioridad === 3 ? 'selected' : ''}>⭐⭐⭐</option>
                </select>
            </div>
            <div><label>Curso:</label>
                <select>${obtenerOpcionesCategorias(tarea.id_categoria)}</select>
            </div>
            <button type="submit">Guardar Cambios</button>
            <button type="button" class="boton-cancelar-edicion">Cancelar</button>
        `;

        form.addEventListener('submit', async e => {
            e.preventDefault();
            const datosActualizados = {
                titulo: form.querySelector('input[type="text"]').value,
                descripcion: form.querySelector('textarea').value,
                fecha: form.querySelector('input[type="date"]').value,
                hora: form.querySelector('input[type="time"]').value,
                prioridad: parseInt(form.querySelector('select').value),
                id_categoria: form.querySelectorAll('select')[1].value || null
            };
            await actualizarTarea(tarea.id, datosActualizados);
        });

        form.querySelector('.boton-cancelar-edicion').addEventListener('click', () => tareaDiv.removeChild(form));
        tareaDiv.appendChild(form);
    }

    function obtenerOpcionesCategorias(categoriaId) {
        return categorias.map(cat => `<option value="${cat.id}" ${cat.id === categoriaId ? 'selected' : ''}>${cat.nombre}</option>`).join('');
    }

    function obtenerNombreCategoria(id) {
        const cat = categorias.find(c => c.id === id);
        return cat ? cat.nombre : null;
    }

    botonNuevaTarea.addEventListener('click', () => formularioVisible ? ocultarFormularioTarea() : mostrarFormularioTarea());
    botonCerrarFormulario.addEventListener('click', ocultarFormularioTarea);

    formularioTarea.addEventListener('submit', async e => {
        e.preventDefault();
        const nuevaTarea = {
            id: crypto.randomUUID(),
            titulo: document.getElementById('titulo').value,
            descripcion: document.getElementById('descripcion').value,
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            prioridad: parseInt(document.getElementById('prioridad').value),
            id_categoria: document.getElementById('categoria').value || null,
            completada: false
        };
        await guardarTarea(nuevaTarea);
        ocultarFormularioTarea();
    });

    filtroTodas.addEventListener('change', () => {
        filtroActivo = 'todas';
        mostrarTareas(tareas);
    });

    filtroNoCompletadas.addEventListener('change', () => {
        filtroActivo = 'noCompletadas';
        mostrarTareas(tareas);
    });

    await cargarCategorias();
    cargarTareas();
});