function animateCSS(element, animation, prefix = "animate__") {
  return new Promise((resolve, reject) => {
    const animationName = `${prefix}${animation}`
    element.classList.add(`${prefix}animated`, animationName)

    function handleAnimationEnd(event) {
      event.stopPropagation()
      element.classList.remove(`${prefix}animated`, animationName)
      resolve("Animation ended")
    }

    element.addEventListener("animationend", handleAnimationEnd, { once: true })
  })
}

let todos = []
let projects = ["Work", "Personal"] // Default projects
let showCompleted = true
let hiddenProjects = new Set() // Track hidden projects
let projectColors = {}

// Load data from localStorage
function loadData() {
  const savedTodos = localStorage.getItem("todos")
  const savedProjects = localStorage.getItem("projects")
  const savedHiddenProjects = localStorage.getItem("hiddenProjects")

  if (savedTodos) {
    todos = JSON.parse(savedTodos).map((todo) => ({
      ...todo,
      completedAt: todo.completedAt ? new Date(todo.completedAt) : null,
    }))
  }

  if (savedProjects) {
    projects = JSON.parse(savedProjects)
  }

  if (savedHiddenProjects) {
    hiddenProjects = new Set(JSON.parse(savedHiddenProjects))
  }

  const savedProjectColors = localStorage.getItem("projectColors")
  if (savedProjectColors) {
    projectColors = JSON.parse(savedProjectColors)
  }

  updateProjectSelect()
  renderAll()
}

// Save data to localStorage
function saveData() {
  localStorage.setItem("todos", JSON.stringify(todos))
  localStorage.setItem("projects", JSON.stringify(projects))
  localStorage.setItem("hiddenProjects", JSON.stringify(Array.from(hiddenProjects)))
  localStorage.setItem("projectColors", JSON.stringify(projectColors))
}

function toggleProjectVisibility(project) {
  if (hiddenProjects.has(project)) {
    hiddenProjects.delete(project)
  } else {
    hiddenProjects.add(project)
  }
  saveData()
  renderAll()
}

function addNewProject() {
  const projectName = prompt("Enter project name:")
  if (projectName && !projects.includes(projectName)) {
    projects.push(projectName)
    projectColors[projectName] = getRandomColor()
    saveData()
    updateProjectSelect()
    renderAll()
  }
}

function getRandomColor() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16)
}

function updateProjectSelect() {
  const select = document.getElementById("projectSelect")
  select.innerHTML = '<option value="">Select Project</option>'
  projects.forEach((project) => {
    const option = document.createElement("option")
    option.value = project
    option.textContent = project
    select.appendChild(option)
  })
}

function addTodo() {
  const input = document.getElementById("todoInput")
  const projectSelect = document.getElementById("projectSelect")
  const text = input.value.trim()
  const project = projectSelect.value

  if (!project) {
    animateCSS(projectSelect, "shakeX")
    projectSelect.focus()
    return
  }

  if (text && project) {
    const projectTodos = todos.filter((t) => !t.completed && t.project === project)
    const newTodo = {
      id: Date.now(),
      text: text,
      project: project,
      completed: false,
      completedAt: null,
      priority: projectTodos.length,
    }

    todos.push(newTodo)

    input.value = ""
    projectSelect.value = project // Keep the project selected
    saveData()
    renderAll()

    // Animate the new todo item
    setTimeout(() => {
      const newTodoElement = document.querySelector(`[data-id="${newTodo.id}"]`)
      if (newTodoElement) {
        animateCSS(newTodoElement, "fadeInDown")
      }
    }, 0)
  } else if (!text) {
    animateCSS(input, "shakeX")
    input.focus()
  }
}

// Add event listener for Enter key
document.getElementById("todoInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTodo()
  }
})

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id)
  if (todo) {
    todo.completed = !todo.completed
    todo.completedAt = todo.completed ? new Date() : null
    saveData()

    const todoElement = document.querySelector(`[data-id="${id}"]`)
    if (todoElement) {
      animateCSS(todoElement, todo.completed ? "fadeOutRight" : "fadeInLeft").then(() => {
        renderAll()
      })
    } else {
      renderAll()
    }
  }
}

function deleteTodo(id) {
  const todoElement = document.querySelector(`[data-id="${id}"]`)
  if (todoElement) {
    animateCSS(todoElement, "fadeOutUp").then(() => {
      todos = todos.filter((todo) => todo.id !== id)
      saveData()
      renderAll()
    })
  } else {
    todos = todos.filter((todo) => todo.id !== id)
    saveData()
    renderAll()
  }
}

function toggleCompletedTasks() {
  showCompleted = !showCompleted
  const completedTasks = document.getElementById("completedTasks")
  const toggle = document.getElementById("completedToggle")

  if (showCompleted) {
    completedTasks.style.display = "block"
    setTimeout(() => {
      completedTasks.style.maxHeight = completedTasks.scrollHeight + "px"
      completedTasks.style.opacity = "1"
    }, 0)
    toggle.textContent = "▼"
  } else {
    completedTasks.style.maxHeight = "0"
    completedTasks.style.opacity = "0"
    setTimeout(() => {
      completedTasks.style.display = "none"
    }, 300)
    toggle.textContent = "▶"
  }
}

function formatDate(date) {
  if (!date) return ""

  const now = new Date()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  } else {
    return "just now"
  }
}

function renderTodoItem(todo) {
  const todoDiv = document.createElement("div")
  todoDiv.className = `todo-item ${todo.project.toLowerCase()}`
  todoDiv.draggable = !todo.completed
  todoDiv.dataset.id = todo.id

  todoDiv.innerHTML = `
        <input type="checkbox" 
               class="todo-checkbox" 
               ${todo.completed ? "checked" : ""}
               onchange="toggleTodo(${todo.id})">
        <span class="todo-text ${todo.completed ? "completed" : ""}">${todo.text}</span>
        <span class="project-tag" style="background-color: ${projectColors[todo.project] || getRandomColor()}">${todo.project}</span>
        ${todo.completed ? `<span class="completion-date">${formatDate(todo.completedAt)}</span>` : ""}
        <button class="delete-btn" onclick="deleteTodo(${todo.id})">
            <i class="fas fa-trash"></i>
        </button>
    `

  if (!todo.completed) {
    todoDiv.addEventListener("dragstart", handleDragStart)
    todoDiv.addEventListener("dragend", handleDragEnd)
  }

  return todoDiv
}

function renderProjectHeader(project) {
  const header = document.createElement("div")
  header.className = "project-header"
  const projectTodos = todos.filter((todo) => !todo.completed && todo.project === project)

  header.innerHTML = `
        <h3 class="project-title">${project}</h3>
        <span class="project-counter">${projectTodos.length}</span>
        <button class="project-visibility-toggle" onclick="toggleProjectVisibility('${project}')">
            <i class="fas fa-eye-slash"></i>
        </button>
        <div class="color-picker-wrapper">
            <div class="color-picker" id="color-picker-${project}" style="background-color: ${projectColors[project] || getRandomColor()}"></div>
        </div>
    `

  let pickr

  setTimeout(() => {
    pickr = Pickr.create({
      el: `#color-picker-${project}`,
      theme: "classic",
      default: projectColors[project] || getRandomColor(),
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
          hex: true,
          rgba: true,
          hsla: true,
          hsva: true,
          cmyk: true,
          input: true,
          clear: false,
          save: true,
        },
      },
    })

    pickr.on("save", (color) => {
      projectColors[project] = color.toHEXA().toString()
      saveData()
      renderAll()
    })
  }, 0)

  return header
}

function renderAll() {
  const projectsContainer = document.getElementById("projectsContainer")
  projectsContainer.innerHTML = ""

  // Remove any existing show hidden containers
  document.querySelectorAll(".show-hidden-container").forEach((container) => container.remove())

  // Create columns for both visible and hidden projects
  projects.forEach((project) => {
    if (!hiddenProjects.has(project)) {
      // Render visible project
      const projectTodos = todos
        .filter((todo) => !todo.completed && todo.project === project)
        .sort((a, b) => a.priority - b.priority)

      const column = document.createElement("div")
      column.className = `project-column ${project.toLowerCase()}`

      const header = renderProjectHeader(project)

      const todoContainer = document.createElement("div")
      todoContainer.className = "project-todos"
      todoContainer.dataset.project = project

      // Add drag and drop event listeners to the container
      todoContainer.addEventListener("dragover", handleDragOver)
      todoContainer.addEventListener("dragenter", handleDragEnter)
      todoContainer.addEventListener("dragleave", handleDragLeave)
      todoContainer.addEventListener("drop", handleDrop)

      projectTodos.forEach((todo) => {
        todoContainer.appendChild(renderTodoItem(todo))
      })

      column.appendChild(header)
      column.appendChild(todoContainer)
      projectsContainer.appendChild(column)
    } else {
      // Render placeholder for hidden project with show button
      const placeholder = document.createElement("div")
      placeholder.className = "project-placeholder"

      const showButton = document.createElement("button")
      showButton.className = "project-visibility-toggle show-hidden"
      showButton.innerHTML = `
                <i class="fas fa-eye"></i>
                <span>Show ${project}</span>
            `
      showButton.onclick = () => {
        hiddenProjects.delete(project)
        saveData()
        renderAll()
      }

      placeholder.appendChild(showButton)
      projectsContainer.appendChild(placeholder)
    }
  })

  // Render completed tasks
  const completedContainer = document.getElementById("completedTasks")
  completedContainer.innerHTML = ""

  const completedTodos = todos.filter((todo) => todo.completed).sort((a, b) => b.completedAt - a.completedAt)

  completedTodos.forEach((todo) => {
    completedContainer.appendChild(renderTodoItem(todo))
  })

  document.getElementById("completedCounter").textContent = completedTodos.length
}

function updateTodoPriorities(project) {
  const projectTodos = todos.filter((t) => !t.completed && t.project === project)
  projectTodos.forEach((todo, index) => {
    todo.priority = index
  })
  saveData()
}

function addDragAndDropListeners() {
  const todoItems = document.querySelectorAll(".todo-item:not(.completed)")
  const containers = document.querySelectorAll(".project-todos")

  todoItems.forEach((item) => {
    item.addEventListener("dragstart", handleDragStart)
    item.addEventListener("dragend", handleDragEnd)
  })

  containers.forEach((container) => {
    container.addEventListener("dragover", handleDragOver)
    container.addEventListener("dragenter", handleDragEnter)
    container.addEventListener("dragleave", handleDragLeave)
    container.addEventListener("drop", handleDrop)
  })
}

let draggedItem = null
let originalContainer = null

function handleDragStart(e) {
  draggedItem = e.target
  originalContainer = e.target.closest(".project-todos")
  e.target.classList.add("dragging")

  // Set drag effect
  e.dataTransfer.effectAllowed = "move"
  e.dataTransfer.setData("text/plain", "") // Required for Firefox
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging")
  draggedItem = null
  originalContainer = null
  document.querySelectorAll(".project-todos").forEach((container) => {
    container.classList.remove("drag-over")
  })
}

function handleDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = "move"
}

function handleDragEnter(e) {
  e.preventDefault()
  const container = e.target.closest(".project-todos")
  if (container) {
    container.classList.add("drag-over")
  }
}

function handleDragLeave(e) {
  const container = e.target.closest(".project-todos")
  if (container) {
    container.classList.remove("drag-over")
  }
}

function handleDrop(e) {
  e.preventDefault()
  const container = e.target.closest(".project-todos")
  if (!container || !draggedItem) return

  const newProject = container.dataset.project
  const todoId = Number.parseInt(draggedItem.dataset.id)
  const todo = todos.find((t) => t.id === todoId)

  if (!todo) return

  // Get the drop target position
  const dropTarget = e.target.closest(".todo-item")
  const items = Array.from(container.querySelectorAll(".todo-item:not(.completed)"))

  // Remove the dragged item from its current position
  const projectTodos = todos.filter((t) => !t.completed && t.project === todo.project)
  projectTodos.splice(todo.priority, 1)

  // Update project if changed
  todo.project = newProject

  if (dropTarget) {
    // Get the index where to insert the dragged item
    const dropTodo = todos.find((t) => t.id === Number.parseInt(dropTarget.dataset.id))
    const dropIndex = dropTodo.priority

    // Update priorities for all todos in the project
    const targetProjectTodos = todos.filter((t) => !t.completed && t.project === newProject)
    targetProjectTodos.forEach((t) => {
      if (t.priority >= dropIndex) {
        t.priority++
      }
    })

    // Set the new priority for the dragged item
    todo.priority = dropIndex
  } else {
    // If dropped at the end of the list
    const targetProjectTodos = todos.filter((t) => !t.completed && t.project === newProject)
    todo.priority = targetProjectTodos.length
  }

  saveData()
  renderAll()
}

// Add styles for drag and drop
const style = document.createElement("style")
style.textContent = `
    .project-todos.drag-over {
        background-color: rgba(65, 105, 225, 0.1);
        border-radius: 8px;
    }
    
    .todo-item.dragging {
        opacity: 0.5;
        cursor: grabbing;
    }
`
document.head.appendChild(style)

// Add dark mode toggle functionality
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode")
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"))
}

// Initialize dark mode
function initDarkMode() {
  const darkModeEnabled = localStorage.getItem("darkMode") === "true"
  if (darkModeEnabled) {
    document.body.classList.add("dark-mode")
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  loadData()
  initDarkMode()

  // Add event listener for dark mode toggle
  document.getElementById("darkModeToggle").addEventListener("click", toggleDarkMode)

  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      document.querySelector(this.getAttribute("href")).scrollIntoView({
        behavior: "smooth",
      })
    })
  })
})

