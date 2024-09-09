// Definiciones y constantes globales
const API_URL = "http://localhost:3000/api/tasks/";
const columnsContainer = document.getElementById('columnsContainer');
const toggleModeBtn = document.getElementById('toggleModeBtn');

// Elementos del DOM
const addTaskButton = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const closeModalButton = document.querySelector('.modal-background');
const cancelTaskButton = document.getElementById('cancelTaskBtn');
const taskForm = document.getElementById('taskForm');
const saveTaskButton = document.getElementById('saveTaskBtn');
const deleteTaskButton = document.getElementById('deleteTaskBtn');

// Objeto con las columnas de tareas
let taskColumns = {
    backlog: document.getElementById('backlog').querySelector('.tasks'),
    todo: document.getElementById('todo').querySelector('.tasks'),
    'in-progress': document.getElementById('in-progress').querySelector('.tasks'),
    blocked: document.getElementById('blocked').querySelector('.tasks'),
    done: document.getElementById('done').querySelector('.tasks')
};

// Función para manejar las solicitudes fetch
async function fetchData(url, options = {}) {
    console.log("Realizando fetch a:", url, "con opciones:", options);
    try {
        const response = await fetch(url, options);
        console.log("Respuesta del servidor:", response);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

// CRUD de tareas (Create, Read, Update, Delete)

async function postNewTask(title, description, assigned, deadline, status, priority) {
    console.log("Agregando nueva tarea con título:", title);
    const newTask = { title, description, assignedTo: assigned, endDate: deadline, status, priority };
    const result = await fetchData(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask)
    });
    console.log("Respuesta de creación de tarea:", result);
    renderTasks();
}

async function updateTask(id, title, description, assigned, priority, deadline, status) {
    const updatedTask = { title, description, assignedTo: assigned, priority, endDate: deadline, status };
    const result = await fetchData(`${API_URL}${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask)
    });
    console.log("Tarea actualizada:", result);
    renderTasks();
}

async function deleteTask(id) {
    const result = await fetchData(`${API_URL}${id}`, { method: "DELETE" });
    console.log("Tarea eliminada:", result);
    renderTasks();
}

async function getAllTasks() {
    return await fetchData(API_URL);
}

// Renderizar tareas
async function renderTasks() {
    const taskArray = await getAllTasks();
    if (taskArray) {
        Object.values(taskColumns).forEach(column => column.innerHTML = ''); // Limpiar columnas
        taskArray.forEach(task => {
            const { title, description, assignedTo, priority, status, endDate, id } = task;

            console.log(`Estado de la tarea: ${status}`); // Verifica los valores de status

            // Verificar si la columna existe para este estado de tarea
            if (!taskColumns[status]) {
                console.error(`No se encontró una columna para el estado: ${status}`);
                return;
            }

            const taskElement = createTaskElement(title, description, assignedTo, priority, endDate, status, id);
            taskColumns[status].appendChild(taskElement);
        });
    }
}

// Crear elementos de tarea
function createTaskElement(title, description, assigned, priority, deadline, status, id) {
    const taskElement = document.createElement('div');
    taskElement.classList.add('box', 'task', `priority-${priority.toLowerCase()}`);
    taskElement.dataset.id = id;
    taskElement.draggable = true;

    const profilePics = { 'Persona1': '1.jpg', 'Persona2': '3.jpg', 'Persona3': '2.jpg' };
    const profilePic = profilePics[assigned] || '2.jpg';

    taskElement.innerHTML = `
        <div class="task-header">
            <img src="${profilePic}" alt="${assigned}" class="profile-pic">
            <div class="task-title">
                <h3>${title}</h3>
                <p class="description">${description}</p>
            </div>
        </div>
        <div class="details">
            <p><i class="fa-solid fa-user"></i><strong>Asignado:</strong> ${assigned}</p>
            <p class="priority ${priority.toLowerCase()}"><i class="fa-solid fa-tag"></i><strong>Prioridad:</strong> ${priority}</p>
        </div>
        <p class="deadline"><i class="fa-solid fa-clock"></i><strong>Fecha límite:</strong> ${deadline}</p>
    `;

    taskElement.addEventListener('dragstart', (event) => {
        console.log("Iniciando arrastre de la tarea con ID:", id);
        event.dataTransfer.setData('text/plain', id);
    });
    taskElement.addEventListener('click', () => openEditModal(id));

    return taskElement;
}

// Eventos drag and drop para mover tareas
document.querySelectorAll('.column').forEach(column => {
    column.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    column.addEventListener('drop', (event) => {
        event.preventDefault();
        const taskId = event.dataTransfer.getData('text/plain');
        const taskElement = document.querySelector(`[data-id="${taskId}"]`);
        const newStatus = column.id;  // Obtenemos el nuevo estado (la columna de destino)

        // Mover la tarea visualmente a la nueva columna
        column.querySelector('.tasks').appendChild(taskElement);
        console.log("Tarea con ID", taskId, "movida a la columna", newStatus);

        // Actualizamos el status de la tarea en el backend
        const title = taskElement.querySelector('h3').textContent;
        const description = taskElement.querySelector('.description').textContent;
        const assigned = taskElement.querySelector('.details p:first-child').textContent.split(': ')[1];
        const priority = taskElement.querySelector('.priority').textContent.split(': ')[1];
        const deadline = taskElement.querySelector('.deadline').textContent.split(': ')[1];

        // Llamar a updateTask para actualizar el status en el backend
        updateTask(taskId, title, description, assigned, priority, deadline, newStatus);
    });
});

// Modo oscuro/claro
toggleModeBtn.addEventListener('click', toggleMode);
function toggleMode() {
    const currentMode = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', currentMode === 'light' ? 'dark' : 'light');
}

// Cambiar fondo
backgroundSelector.addEventListener('change', changeBackground);
function changeBackground() {
    const selectedBackground = document.getElementById("backgroundSelector").value;
    columnsContainer.style.backgroundImage = selectedBackground === "Default" ? "" : `url('${selectedBackground}')`;
}

// Modales
let currentTaskId = null;

function openModal() {
    taskModal.classList.add('is-active');
    taskForm.reset();
}

function closeModal() {
    taskModal.classList.remove('is-active');
    taskForm.reset();
    document.querySelector('.modal-card-title').textContent = 'Tarea';
    currentTaskId = null;
}

function openEditModal(taskId) {
    currentTaskId = taskId;
    const taskElement = document.querySelector(`[data-id='${taskId}']`);
    if (taskElement) {
        taskForm['taskTitle'].value = taskElement.querySelector('h3').textContent;
        taskForm['taskDescription'].value = taskElement.querySelector('.description').textContent;
        taskForm['taskAssigned'].value = taskElement.querySelector('.details p:first-child').textContent.split(': ')[1];
        taskForm['taskPriority'].value = taskElement.querySelector('.priority').textContent.split(': ')[1];
        taskForm['taskStatus'].value = taskElement.closest('.column').id;
        taskForm['taskDeadline'].value = taskElement.querySelector('.deadline').textContent.split(': ')[1];
        document.querySelector('.modal-card-title').textContent = 'Editar Tarea';
        taskModal.classList.add('is-active');
    }
}

// Guardar o actualizar tarea
saveTaskButton.addEventListener('click', () => {
    const title = taskForm['taskTitle'].value;
    const description = taskForm['taskDescription'].value;
    const assigned = taskForm['taskAssigned'].value;
    const priority = taskForm['taskPriority'].value;
    const status = taskForm['taskStatus'].value;
    const deadline = taskForm['taskDeadline'].value;

    if (currentTaskId) {
        // Editar tarea existente
        updateTask(currentTaskId, title, description, assigned, priority, deadline, status);
    } else {
        // Crear nueva tarea
        postNewTask(title, description, assigned, deadline, status, priority);
    }

    closeModal();  // Cierra el modal después de guardar o actualizar la tarea
});

// Eliminar tarea
deleteTaskButton.addEventListener('click', () => {
    if (currentTaskId) {
        deleteTask(currentTaskId);  // Elimina la tarea si está en modo edición
        closeModal();  // Cierra el modal después de eliminar la tarea
    }
});

addTaskButton.addEventListener('click', openModal);
closeModalButton.addEventListener('click', closeModal);
cancelTaskButton.addEventListener('click', closeModal);

// Llamar al renderizado de tareas
renderTasks();
