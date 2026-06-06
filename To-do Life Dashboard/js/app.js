/**
 * app.js — To-Do Life Dashboard
 *
 * All four modules live in this single file:
 *   - Clock Module
 *   - Focus Timer Module
 *   - To-Do List Module
 *   - Quick Links Module
 *
 * Initialized on DOMContentLoaded.
 */

// ── Clock Module ─────────────────────────────────────────────────────────────
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6

/**
 * Derives the appropriate greeting string from the given hour (0–23).
 *
 * @param {number} hour - Integer hour value in the range [0, 23]
 * @returns {string} One of "Good morning", "Good afternoon", or "Good evening"
 *
 * Requirements: 2.4, 2.5, 2.6
 */
function deriveGreeting(hour) {
  if (hour >= 0 && hour < 12) {
    return 'Good morning'
  } else if (hour >= 12 && hour < 18) {
    return 'Good afternoon'
  } else {
    return 'Good evening'
  }
}

/**
 * Reads the current system time and updates the clock DOM elements.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
function updateClock() {
  const now = new Date()
  const hours   = now.getHours()
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`

  const greeting = deriveGreeting(hours)

  document.getElementById('greeting').textContent = greeting + ", let's get to work!"
  document.getElementById('time').textContent = timeStr
  document.getElementById('date').textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

/**
 * Starts the clock — calls updateClock() immediately then every 1000ms.
 * Requirements: 2.1
 */
function startClock() {
  updateClock()
  setInterval(updateClock, 1000)
}

// ─────────────────────────────────────────────────────────────────────────────
// Focus Timer Module
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
// ─────────────────────────────────────────────────────────────────────────────

const timerState = {
  remaining: 1500,    // seconds (25 minutes)
  isRunning: false,
  intervalId: null    // setInterval handle; null when stopped
}

/**
 * Formats seconds as MM:SS and writes it to #timer-display.
 * @param {number} seconds - Value in range [0, 1500]
 */
function updateTimerDisplay(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs    = (seconds % 60).toString().padStart(2, '0')
  document.getElementById('timer-display').textContent = `${minutes}:${secs}`
}

/**
 * Syncs the Start/Stop button disabled states with timerState.isRunning.
 * Stop is disabled when not running; Start is disabled when running. (Req 3.9)
 */
function updateTimerButtonStates() {
  const btnStart = document.getElementById('btn-start')
  const btnStop  = document.getElementById('btn-stop')
  if (btnStart) btnStart.disabled = timerState.isRunning
  if (btnStop)  btnStop.disabled  = !timerState.isRunning
}

/**
 * Starts the countdown. Guards against duplicate intervals when already running.
 * (Req 3.2, 3.3)
 */
function startTimer() {
  if (timerState.isRunning || timerState.remaining <= 0) return
  timerState.isRunning = true
  updateTimerButtonStates()
  timerState.intervalId = setInterval(tick, 1000)
}

/**
 * Called every second while the timer is running. Decrements remaining,
 * updates the display, and triggers completion when it reaches 0. (Req 3.2, 3.7)
 */
function tick() {
  timerState.remaining -= 1
  updateTimerDisplay(timerState.remaining)
  if (timerState.remaining === 0) {
    stopTimer()
    onTimerComplete()
  }
}

/**
 * Pauses the countdown and preserves the current remaining value. (Req 3.4)
 */
function stopTimer() {
  clearInterval(timerState.intervalId)
  timerState.intervalId = null
  timerState.isRunning = false
  updateTimerButtonStates()
}

/**
 * Stops the timer and restores the display to 25:00. (Req 3.5)
 * Also hides any visible completion message.
 */
function resetTimer() {
  stopTimer()
  timerState.remaining = 1500
  updateTimerDisplay(1500)
  // Hide completion message on reset
  const completeEl = document.getElementById('timer-complete')
  if (completeEl) completeEl.classList.add('hidden')
}

/**
 * Displays the #timer-complete element to notify the user. (Req 3.8)
 */
function onTimerComplete() {
  const completeEl = document.getElementById('timer-complete')
  if (completeEl) completeEl.classList.remove('hidden')
}

/**
 * Initializes the timer display and button states on page load. (Req 3.1)
 */
function initTimer() {
  updateTimerDisplay(timerState.remaining)
  updateTimerButtonStates()
}

// ── Todo Module ──────────────────────────────────────────────────────────────

/** @type {Array<{id: string, text: string, done: boolean, createdAt: number}>} */
let todos = []

/**
 * Creates a new Todo object from the given text.
 *
 * Precondition:  text.trim().length > 0
 * Postcondition: returns Todo where done === false and id is unique
 *
 * @param {string} text - Task description (will be trimmed)
 * @returns {{id: string, text: string, done: boolean, createdAt: number}}
 *
 * Requirements: 4.1, 4.6
 */
function createTodo(text) {
  return {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : Date.now().toString(),
    text: text.trim(),
    done: false,
    createdAt: Date.now()
  }
}

/**
 * Persists the todos array to localStorage under the key 'todos'.
 * Shows a visible error if the write fails (e.g. storage quota exceeded).
 *
 * @param {Array} todosArr - The current todos array to serialise
 *
 * Requirements: 4.7, 8.1, 8.6
 */
function saveTodos(todosArr) {
  try {
    localStorage.setItem('todos', JSON.stringify(todosArr))
  } catch (e) {
    showTodoError('Could not save tasks: storage may be full.')
  }
}

/**
 * Reads and parses the todos array from localStorage.
 * Returns [] if the key is absent, the JSON is malformed, or the result is not
 * an array — never throws and never returns null/undefined.
 *
 * Postcondition: always returns a valid array
 *
 * @returns {Array}
 *
 * Requirements: 8.2, 8.3, 8.4, 8.5
 */
function loadTodos() {
  try {
    const parsed = JSON.parse(localStorage.getItem('todos'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Displays a visible error message in the #todo-error element and hides it
 * automatically after 4 seconds.
 *
 * @param {string} msg - Error message to display
 *
 * Requirements: 4.3, 4.4
 */
function showTodoError(msg) {
  const el = document.getElementById('todo-error')
  if (!el) return
  el.textContent = msg
  el.classList.remove('hidden')
  setTimeout(() => el.classList.add('hidden'), 4000)
}

/**
 * Hides the #todo-error element immediately.
 */
function clearTodoError() {
  const el = document.getElementById('todo-error')
  if (el) el.classList.add('hidden')
}

/**
 * Validates text, creates a new Todo, appends it to the list, persists, and
 * re-renders. Clears the input field on success. Shows a visible error and
 * returns early on validation failure.
 *
 * Precondition:  text is a string (may be empty or whitespace-only)
 * Postcondition on success:   todos.length === previous + 1, input cleared
 * Postcondition on failure:   todos unchanged, error message displayed
 *
 * @param {string} text - Raw input value from the todo input field
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
function addTodo(text) {
  const trimmed = (text || '').trim()

  if (trimmed.length === 0) {
    showTodoError('Task cannot be empty.')
    return
  }

  if (trimmed.length > 500) {
    showTodoError('Task must be 500 characters or fewer.')
    return
  }

  clearTodoError()
  const todo = createTodo(trimmed)
  todos.push(todo)
  saveTodos(todos)
  renderTodos(todos)

  // Clear the input field after a successful submission (Requirement 4.5)
  const input = document.getElementById('todo-input')
  if (input) input.value = ''
}

/**
 * Flips the `done` state of a Todo identified by id, then persists and
 * re-renders. Guards against unknown ids. If the localStorage write fails,
 * the in-memory state is retained and a visible error is shown.
 *
 * Precondition:  id is a string
 * Postcondition on success:   matched todo.done === !previous_done
 * Postcondition on failure:   todo.done still flipped in memory, error shown
 *
 * @param {string} id
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 8.1, 8.6
 */
function toggleTodo(id) {
  const todo = todos.find(t => t.id === id)
  if (!todo) return
  todo.done = !todo.done
  saveTodos(todos)
  renderTodos(todos)
}

/**
 * Updates the `text` of a Todo identified by id, then persists and re-renders.
 * Rejects empty text silently (restores original). Rejects text > 500 chars
 * with a visible error. Preserves `done` and `createdAt` unchanged.
 *
 * Precondition:  id is a string, newText is a string
 * Postcondition on success:   matched todo.text === newText.trim()
 *                              todo.done and todo.createdAt are unchanged
 * Postcondition on empty:     todos unchanged, no error displayed
 * Postcondition on too-long:  todos unchanged, error displayed
 *
 * @param {string} id
 * @param {string} newText
 *
 * Requirements: 6.2, 6.3, 6.5, 8.1, 8.6
 */
function editTodo(id, newText) {
  const trimmed = (newText || '').trim()
  if (trimmed.length === 0) return  // reject empty edit, restore original
  if (trimmed.length > 500) {
    showTodoError('Task must be 500 characters or fewer.')
    return
  }
  const todo = todos.find(t => t.id === id)
  if (!todo) return
  todo.text = trimmed
  // done and createdAt are preserved by only updating .text
  saveTodos(todos)
  renderTodos(todos)
}

/**
 * Removes the Todo with the given id from the list, then persists and
 * re-renders. If the localStorage write fails, the deletion is retained in
 * memory and a visible error is shown. Shows the empty-state message when
 * the last todo is deleted (handled by renderTodos).
 *
 * Precondition:  id is a string
 * Postcondition: no item with given id remains in todos
 *                todos.length === previous_length - 1 (if id existed)
 *
 * @param {string} id
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.6
 */
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id)
  saveTodos(todos)
  renderTodos(todos)
}

// Tracks which todo is currently being inline-edited (null if none)
let currentEditId = null

/**
 * Replaces a todo's text span with an inline <input> for editing.
 * Commits or cancels any currently open edit before opening a new one.
 *
 * @param {string} id      - The todo's unique id
 * @param {HTMLSpanElement} spanEl - The span element to replace
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
function startEditingTodo(id, spanEl) {
  // If another edit is active, cancel it first (Req 6.1)
  if (currentEditId !== null && currentEditId !== id) {
    // Re-render to restore the previous span (cancel in progress edit)
    renderTodos(todos)
  }

  currentEditId = id
  const todo = todos.find(t => t.id === id)
  if (!todo) return

  const input = document.createElement('input')
  input.type = 'text'
  input.value = todo.text
  input.maxLength = 500
  input.setAttribute('aria-label', 'Edit task')

  // Replace the span with the input
  spanEl.parentNode.replaceChild(input, spanEl)
  input.focus()
  // Select all text for convenience
  input.select()

  let committed = false

  function commit() {
    if (committed) return
    committed = true
    currentEditId = null
    const newText = input.value
    // editTodo validates: empty → restores original; too long → shows error
    editTodo(id, newText)
    // editTodo calls renderTodos which rebuilds the DOM, restoring the span
  }

  function cancel() {
    if (committed) return
    committed = true
    currentEditId = null
    renderTodos(todos) // restore original span without saving
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      cancel()
    }
  })

  input.addEventListener('blur', () => {
    // blur fires after keydown, so committed flag prevents double-action
    commit()
  })
}

/**
 * Rebuilds the entire #todo-list from the current todos array.
 * Shows/hides the empty-state message when the list is empty.
 *
 * Uses .textContent exclusively for user-supplied text to prevent XSS (Req 13.1).
 *
 * @param {Array<{id: string, text: string, done: boolean, createdAt: number}>} todos
 *
 * Requirements: 5.3, 5.4, 7.4, 13.1
 */
function renderTodos(todos) {
  const list = document.getElementById('todo-list')
  list.innerHTML = ''

  // Show/hide empty state (Requirement 7.4)
  const emptyEl = document.getElementById('todo-empty')
  if (emptyEl) {
    if (todos.length === 0) {
      emptyEl.classList.remove('hidden')
    } else {
      emptyEl.classList.add('hidden')
    }
  }

  todos.forEach(todo => {
    const li = document.createElement('li')
    li.dataset.id = todo.id
    if (todo.done) li.classList.add('done')  // visual indicator (Req 5.4)

    // Checkbox — triggers toggleTodo on change (Req 5.3)
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = todo.done
    checkbox.addEventListener('change', () => toggleTodo(todo.id))

    // Text span — uses textContent, never innerHTML (Req 13.1)
    // Double-click enters edit mode (Req 6.1)
    const span = document.createElement('span')
    span.textContent = todo.text  // MUST use textContent, never innerHTML (Req 13.1)
    span.addEventListener('dblclick', () => startEditingTodo(todo.id, span))

    // Delete button — removes the todo on click (Req 7.1)
    const deleteBtn = document.createElement('button')
    deleteBtn.textContent = '✕'
    deleteBtn.setAttribute('aria-label', 'Delete task')
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id))

    li.appendChild(checkbox)
    li.appendChild(span)
    li.appendChild(deleteBtn)
    list.appendChild(li)
  })
}

// ── Quick Links Module ───────────────────────────────────────────────────────
// Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4, 12.5

/** @type {Array<{id: string, name: string, url: string}>} */
let links = []

/**
 * Persists the links array to localStorage under the key 'links'.
 * Shows a visible error if the write fails (e.g. storage quota exceeded).
 * Retains the current in-memory state regardless of write outcome.
 *
 * @param {Array} linksArr - The current links array to serialise
 *
 * Requirements: 9.2, 12.1, 12.5
 */
function saveLinks(linksArr) {
  try {
    localStorage.setItem('links', JSON.stringify(linksArr))
  } catch (e) {
    showLinkError('Could not save links: storage may be full.')
  }
}

/**
 * Reads and parses the links array from localStorage.
 * Returns [] if the key is absent, the JSON is malformed, or the result is not
 * an array — never throws and never returns null/undefined.
 *
 * Postcondition: always returns a valid array
 *
 * @returns {Array}
 *
 * Requirements: 12.2, 12.3, 12.4
 */
function loadLinks() {
  try {
    const parsed = JSON.parse(localStorage.getItem('links'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Displays a visible error message in the #link-error element and hides it
 * automatically after 4 seconds.
 *
 * @param {string} msg - Error message to display
 *
 * Requirements: 9.3, 9.4, 9.5
 */
function showLinkError(msg) {
  const el = document.getElementById('link-error')
  if (!el) return
  el.textContent = msg
  el.classList.remove('hidden')
  setTimeout(() => el.classList.add('hidden'), 4000)
}

/**
 * Hides the #link-error element immediately.
 */
function clearLinkError() {
  const el = document.getElementById('link-error')
  if (el) el.classList.add('hidden')
}

/**
 * Validates name and url, creates a new Link, appends it to the array,
 * persists, and re-renders. Shows a visible error and returns early on
 * validation failure.
 *
 * Precondition:  name and url are strings (may be empty or whitespace-only)
 * Postcondition on success:   links.length === previous + 1
 * Postcondition on failure:   links unchanged, error message displayed
 *
 * @param {string} name - Raw label value from the link name input field
 * @param {string} url  - Raw URL value from the link url input field
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
function addLink(name, url) {
  const trimmedName = (name || '').trim()
  const trimmedUrl  = (url  || '').trim()

  if (trimmedName.length === 0) {
    showLinkError('Link label cannot be empty.')
    return
  }
  if (trimmedName.length > 50) {
    showLinkError('Link label must be 50 characters or fewer.')
    return
  }
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    showLinkError('URL must start with http:// or https://')
    return
  }

  clearLinkError()
  const link = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : Date.now().toString(),
    name: trimmedName,
    url: trimmedUrl
  }
  links.push(link)
  saveLinks(links)
  renderLinks(links)
}

/**
 * Removes the link with the given id from the array, persists, and re-renders.
 * Displays an empty-state message when the last link is deleted.
 *
 * Precondition:  id is a string (may or may not match an existing link)
 * Postcondition: link with given id is absent from links array
 *
 * @param {string} id - The id of the link to remove
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
function deleteLink(id) {
  links = links.filter(l => l.id !== id)
  saveLinks(links)
  renderLinks(links)
}

/**
 * Rebuilds the #links-grid from the current links array.
 *
 * Preconditions:
 *   - links is a valid array (may be empty)
 *   - #links-grid element exists in the DOM
 *
 * Postconditions:
 *   - #links-grid is cleared and rebuilt from the links array
 *   - Each valid link renders as an <a> with href, target="_blank",
 *     rel="noopener noreferrer", and label text via .textContent (Req 10.1, 10.3, 13.2)
 *   - Labels are truncated with CSS ellipsis if > 50 chars (Req 10.4)
 *   - Each link item has a delete button attached (Req 11.4)
 *   - Links with invalid URLs (not http:// or https://) show an error indicator
 *     instead of a clickable anchor (Req 10.5, 13.3)
 *   - An empty-state message is shown when the array is empty (Req 11.4)
 *   - All anchor elements include rel="noopener noreferrer" (Req 13.4)
 *
 * @param {Array<{id: string, name: string, url: string}>} links
 *
 * Requirements: 10.1, 10.3, 10.4, 10.5, 11.4, 13.2, 13.3, 13.4
 */
function renderLinks(links) {
  const grid = document.getElementById('links-grid')
  grid.innerHTML = ''

  // Show/hide empty state (Req 11.4)
  const emptyEl = document.getElementById('links-empty')
  if (emptyEl) {
    if (links.length === 0) {
      emptyEl.classList.remove('hidden')
    } else {
      emptyEl.classList.add('hidden')
    }
  }

  links.forEach(link => {
    const item = document.createElement('div')
    item.classList.add('link-item')

    const isValidUrl = link.url && (link.url.startsWith('http://') || link.url.startsWith('https://'))

    if (isValidUrl) {
      // Valid URL — render a clickable anchor (Req 10.1, 10.3, 10.4)
      const anchor = document.createElement('a')
      anchor.href = link.url
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'           // Req 13.4
      anchor.textContent = link.name               // MUST use textContent, never innerHTML (Req 13.2)
      anchor.title = link.name                     // full label accessible on hover
      item.appendChild(anchor)
    } else {
      // Corrupt/invalid URL — show error indicator, no clickable href (Req 10.5, 13.3)
      const errorSpan = document.createElement('span')
      errorSpan.classList.add('link-error-indicator')
      errorSpan.textContent = link.name + ' (invalid URL)'
      item.appendChild(errorSpan)
    }

    // Delete button (Req 11.4)
    const deleteBtn = document.createElement('button')
    deleteBtn.classList.add('link-delete-btn')
    deleteBtn.textContent = '✕'
    deleteBtn.setAttribute('aria-label', `Delete link ${link.name}`)
    deleteBtn.addEventListener('click', () => deleteLink(link.id))
    item.appendChild(deleteBtn)

    grid.appendChild(item)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMContentLoaded — Bootstrap
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // ── 1. Load persisted data ────────────────────────────────────────────────
  todos = loadTodos()   // Req 1.1, 1.5, 1.7
  links = loadLinks()   // Req 1.2, 1.6, 1.7

  // ── 2. Render all widgets ─────────────────────────────────────────────────
  renderTodos(todos)    // Req 1.1
  renderLinks(links)    // Req 1.2
  startClock()          // Req 1.4 — calls updateClock() immediately then every 1s
  initTimer()           // Req 1.3 — sets display to 25:00

  // ── 3. Wire up timer controls ─────────────────────────────────────────────
  const btnStart = document.getElementById('btn-start')
  const btnStop  = document.getElementById('btn-stop')
  const btnReset = document.getElementById('btn-reset')
  if (btnStart) btnStart.addEventListener('click', startTimer)
  if (btnStop)  btnStop.addEventListener('click', stopTimer)
  if (btnReset) btnReset.addEventListener('click', resetTimer)

  // ── 4. Wire up todo form ──────────────────────────────────────────────────
  const todoForm  = document.getElementById('todo-form')
  const todoInput = document.getElementById('todo-input')
  if (todoForm) {
    todoForm.addEventListener('submit', e => {
      e.preventDefault()
      addTodo(todoInput ? todoInput.value : '')
      // Input is cleared by addTodo() on success (Req 4.5)
    })
  }

  // ── 5. Wire up link form ──────────────────────────────────────────────────
  const linkForm      = document.getElementById('link-form')
  const linkNameInput = document.getElementById('link-name-input')
  const linkUrlInput  = document.getElementById('link-url-input')
  if (linkForm) {
    linkForm.addEventListener('submit', e => {
      e.preventDefault()
      const nameBefore = linkNameInput ? linkNameInput.value : ''
      const urlBefore  = linkUrlInput  ? linkUrlInput.value  : ''
      const countBefore = links.length
      addLink(nameBefore, urlBefore)
      // Only clear inputs when the add actually succeeded (link was appended)
      if (links.length > countBefore) {
        if (linkNameInput) linkNameInput.value = ''
        if (linkUrlInput)  linkUrlInput.value  = ''
      }
    })
  }
})
