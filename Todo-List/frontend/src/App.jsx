import { useState, useEffect } from "react";
import axios from "axios";
import "./styles/App.css";

const API_URL = "https://todo-app-list-cued.onrender.com";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userEmail, setUserEmail] = useState(
    localStorage.getItem("userEmail") || "",
  );

  // Theme State
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  // Auth states
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Task states
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Inline Edit states
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    document.body.className = darkMode ? "dark-mode" : "light-mode";
  }, [darkMode]);

  const checkIsOverdue = (taskDateStr, isCompleted) => {
    if (!taskDateStr || isCompleted) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(taskDateStr);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = isRegistering ? "/auth/register" : "/auth/login";

    try {
      const res = await axios.post(`${API_URL}${endpoint}`, {
        email: authEmail,
        password: authPassword,
      });
      setToken(res.data.token);
      setUserEmail(res.data.email);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userEmail", res.data.email);
      setAuthPassword("");
    } catch (err) {
      setAuthError(err.response?.data?.error || "Authentication failed");
    }
  };

  const handleLogout = () => {
    setToken("");
    setUserEmail("");
    setTasks([]);
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks`, getAuthHeader());
      setTasks(res.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  };

  useEffect(() => {
    if (token) fetchTasks();
  }, [token]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await axios.post(
        `${API_URL}/add`,
        { text, dueDate: dueDate || null },
        getAuthHeader(),
      );
      setTasks([res.data, ...tasks]);
      setText("");
      setDueDate("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const res = await axios.put(
        `${API_URL}/tasks/${task._id}`,
        { completed: !task.completed },
        getAuthHeader(),
      );
      setTasks(tasks.map((t) => (t._id === task._id ? res.data : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (task) => {
    setEditingId(task._id);
    setEditText(task.text);
    setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
  };

  const handleSaveEdit = async (id) => {
    if (!editText.trim()) return;
    try {
      const res = await axios.put(
        `${API_URL}/tasks/${id}`,
        { text: editText.trim(), dueDate: editDueDate || null },
        getAuthHeader(),
      );
      setTasks(tasks.map((t) => (t._id === id ? res.data : t)));
      setEditingId(null);
      setEditText("");
      setEditDueDate("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/tasks/${id}`, getAuthHeader());
      setTasks(tasks.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = (t.text || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase().trim());
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "active"
          ? !t.completed
          : t.completed;
    return matchesSearch && matchesStatus;
  });

  const ThemeToggleBtn = () => (
    <button
      className="btn-theme"
      onClick={() => setDarkMode(!darkMode)}
      type="button"
    >
      {darkMode ? "☀️ Light" : "🌙 Dark"}
    </button>
  );

  const themeClass = darkMode ? "dark-theme" : "light-theme";

  // --- Auth View ---
  if (!token) {
    return (
      <div className={`page-wrapper ${themeClass}`}>
        <div className="main-title-section">
          <h1 className="hero-heading">
            <span className="app-icon">📝</span> To-Do App List
          </h1>
          <p className="hero-subtext">
            Manage your daily tasks and workflow with ease
          </p>
        </div>

        <div className={`app-container auth-container ${themeClass}`}>
          <div className="app-header">
            <h2>{isRegistering ? "Create Account" : "Welcome Back"}</h2>
            <ThemeToggleBtn />
          </div>

          {authError && <p className="error-message">{authError}</p>}

          <form onSubmit={handleAuth} className="auth-form">
            <input
              className="input-field"
              type="email"
              placeholder="Email address"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
            />
            <input
              className="input-field"
              type="password"
              placeholder="Password"
              required
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
            />
            <button type="submit" className="btn-primary btn-auth-submit">
              {isRegistering ? "Sign Up" : "Log In"}
            </button>
          </form>

          <p className="sub-text auth-switch-text">
            {isRegistering
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError("");
              }}
            >
              {isRegistering ? "Log in here" : "Sign up here"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // --- Main Tasks View ---
  return (
    <div className={`page-wrapper ${themeClass}`}>
      <div className="main-title-section">
        <h1 className="hero-heading">
          <span className="app-icon">📝</span> To-Do App List
        </h1>
      </div>

      <div className={`app-container ${themeClass}`}>
        <div className="app-header">
          <div>
            <h2>Dashboard</h2>
            <small className="sub-text">{userEmail}</small>
          </div>
          <div className="header-actions">
            <ThemeToggleBtn />
            <button className="btn-danger" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        </div>

        <form onSubmit={handleAddTask} className="task-form">
          <input
            className="input-field task-input"
            type="text"
            placeholder="Enter a task..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            className="input-field date-input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            Add Task
          </button>
        </form>

        <input
          className="input-field search-input"
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="tabs-container">
          {["all", "active", "completed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`tab-btn ${filterStatus === tab ? "active" : ""}`}
              type="button"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <ul className="task-list">
          {filteredTasks.length === 0 ? (
            <p className="sub-text empty-msg">No tasks found.</p>
          ) : (
            filteredTasks.map((t) => {
              const isOverdue = checkIsOverdue(t.dueDate, t.completed);

              return (
                <li
                  key={t._id}
                  className={`task-item ${t.completed ? "completed" : ""} ${isOverdue ? "overdue" : ""}`}
                >
                  <div className="task-left">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => handleToggleComplete(t)}
                      disabled={editingId === t._id}
                      className="task-checkbox"
                    />

                    {editingId === t._id ? (
                      <div className="edit-box-row">
                        <input
                          className="input-field edit-text-input"
                          type="text"
                          value={editText}
                          autoFocus
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(t._id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <input
                          className="input-field edit-date-input"
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="task-detail-col">
                        <div className="task-text-row">
                          <span
                            className={`task-text ${t.completed ? "completed-text" : ""}`}
                          >
                            {t.text}
                          </span>
                          {isOverdue && (
                            <span className="overdue-badge">⚠️ Overdue</span>
                          )}
                        </div>
                        {t.dueDate && (
                          <span
                            className={`due-date-text ${isOverdue ? "overdue-date" : "sub-text"}`}
                          >
                            📅 Due: {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="task-actions">
                    {editingId === t._id ? (
                      <>
                        <button
                          className="btn-success"
                          onClick={() => handleSaveEdit(t._id)}
                          type="button"
                        >
                          Save
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => setEditingId(null)}
                          type="button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-edit"
                          onClick={() => startEdit(t)}
                          disabled={t.completed}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDeleteTask(t._id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}

export default App;
