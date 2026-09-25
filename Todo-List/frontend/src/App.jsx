import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/App.css";

const BACKEND_URL = "https://todo-app-list-cued.onrender.com";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || "");
  const [fullName, setFullName] = useState(localStorage.getItem("fullName") || "");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");

  const [authMode, setAuthMode] = useState("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editDate, setEditDate] = useState("");

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    document.body.className = darkMode ? "dark-mode" : "light-mode";
  }, [darkMode]);

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const handleLogout = () => {
    setToken("");
    setUserEmail("");
    setFullName("");
    setTasks([]);
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("fullName");
  };

  const loadTasks = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/tasks`, authHeader);
      setTasks(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  useEffect(() => {
    if (token) {
      loadTasks();
    }
  }, [token]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    const isSignup = authMode === "signup";
    const endpoint = isSignup ? "/auth/register" : "/auth/login";
    const dataToSend = isSignup
      ? { firstName, lastName, email, password }
      : { email, password };

    try {
      const res = await axios.post(`${BACKEND_URL}${endpoint}`, dataToSend);
      setToken(res.data.token);
      setUserEmail(res.data.email);
      setFullName(res.data.fullName || "");

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userEmail", res.data.email);
      localStorage.setItem("fullName", res.data.fullName || "");

      setFirstName("");
      setLastName("");
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    try {
      const res = await axios.post(
        `${BACKEND_URL}/add`,
        { text: taskText.trim(), dueDate: taskDate || null },
        authHeader
      );
      setTasks([res.data, ...tasks]);
      setTaskText("");
      setTaskDate("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (item) => {
    try {
      const res = await axios.put(
        `${BACKEND_URL}/tasks/${item._id}`,
        { completed: !item.completed },
        authHeader
      );
      setTasks(tasks.map((t) => (t._id === item._id ? res.data : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (item) => {
    setEditId(item._id);
    setEditText(item.text);
    setEditDate(item.dueDate ? item.dueDate.split("T")[0] : "");
  };

  const handleSaveEdit = async (id) => {
    if (!editText.trim()) return;

    try {
      const res = await axios.put(
        `${BACKEND_URL}/tasks/${id}`,
        { text: editText.trim(), dueDate: editDate || null },
        authHeader
      );
      setTasks(tasks.map((t) => (t._id === id ? res.data : t)));
      setEditId(null);
      setEditText("");
      setEditDate("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BACKEND_URL}/tasks/${id}`, authHeader);
      setTasks(tasks.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const isOverdue = (dateStr, completed) => {
    if (!dateStr || completed) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    return due < now;
  };

  const filteredTasks = tasks.filter((item) => {
    const matchText = (item.text || "").toLowerCase().includes(search.toLowerCase().trim());
    if (!matchText) return false;
    if (tab === "active") return !item.completed;
    if (tab === "completed") return item.completed;
    return true;
  });

  const themeClass = darkMode ? "dark-theme" : "light-theme";

  if (!token) {
    return (
      <div className={`page-wrapper ${themeClass}`}>
        <div className="main-title-section">
          <h1 className="hero-heading">
            <span className="app-icon">📝</span> To-Do App List
          </h1>
          <p className="hero-subtext">Manage your daily tasks and workflow with ease</p>
        </div>

        <div className={`app-container auth-container ${themeClass}`}>
          <div className="app-header">
            <h2>{authMode === "signup" ? "Create Account" : "Welcome Back"}</h2>
            <button
              className="btn-theme"
              onClick={() => setDarkMode(!darkMode)}
              type="button"
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}

          <form onSubmit={handleAuth} className="auth-form">
            {authMode === "signup" && (
              <div className="name-inputs-row">
                <input
                  className="input-field"
                  type="text"
                  placeholder="First name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                  className="input-field"
                  type="text"
                  placeholder="Last name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            )}

            <input
              className="input-field"
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input-field"
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="btn-primary btn-auth-submit">
              {authMode === "signup" ? "Sign Up" : "Log In"}
            </button>
          </form>

          <p className="sub-text auth-switch-text">
            {authMode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setAuthMode(authMode === "login" ? "signup" : "login");
                setError("");
              }}
            >
              {authMode === "signup" ? "Log in here" : "Sign up here"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-wrapper ${themeClass}`}>
      <div className="main-title-section">
        <h1 className="hero-heading">
          <span className="app-icon">📝</span> To-Do App List
        </h1>
      </div>

      <div className={`app-container ${themeClass}`}>
        <div className="dashboard-top-bar">
          <div className="empty-spacer"></div>
          <h2 className="dashboard-title">Dashboard</h2>
          <div className="header-actions">
            <button
              className="btn-theme"
              onClick={() => setDarkMode(!darkMode)}
              type="button"
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button className="btn-danger" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        </div>

        <div className="user-profile-info">
          <h3>{fullName || "User Profile"}</h3>
          <p>{userEmail}</p>
        </div>

        <form onSubmit={handleAddTask} className="task-form">
          <input
            className="input-field task-input"
            type="text"
            placeholder="Enter a task..."
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
          />
          <input
            className="input-field date-input"
            type="date"
            value={taskDate}
            onChange={(e) => setTaskDate(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            Add Task
          </button>
        </form>

        <input
          className="input-field search-input"
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="tabs-container">
          {["all", "active", "completed"].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`tab-btn ${tab === item ? "active" : ""}`}
              type="button"
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        <ul className="task-list">
          {filteredTasks.length === 0 ? (
            <p className="sub-text empty-msg">No tasks found.</p>
          ) : (
            filteredTasks.map((item) => {
              const overdue = isOverdue(item.dueDate, item.completed);
              const isEditing = editId === item._id;

              return (
                <li
                  key={item._id}
                  className={`task-item ${item.completed ? "completed" : ""} ${overdue ? "overdue" : ""}`}
                >
                  <div className="task-left">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggle(item)}
                      disabled={isEditing}
                      className="task-checkbox"
                    />

                    {isEditing ? (
                      <div className="edit-box-row">
                        <input
                          className="input-field edit-text-input"
                          type="text"
                          value={editText}
                          autoFocus
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(item._id);
                            if (e.key === "Escape") setEditId(null);
                          }}
                        />
                        <input
                          className="input-field edit-date-input"
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="task-detail-col">
                        <div className="task-text-row">
                          <span className={`task-text ${item.completed ? "completed-text" : ""}`}>
                            {item.text}
                          </span>
                          {overdue && <span className="overdue-badge">⚠️ Overdue</span>}
                        </div>
                        {item.dueDate && (
                          <span className={`due-date-text ${overdue ? "overdue-date" : "sub-text"}`}>
                            📅 Due: {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="task-actions">
                    {isEditing ? (
                      <>
                        <button className="btn-success" onClick={() => handleSaveEdit(item._id)} type="button">
                          Save
                        </button>
                        <button className="btn-secondary" onClick={() => setEditId(null)} type="button">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-edit"
                          onClick={() => startEdit(item)}
                          disabled={item.completed}
                          type="button"
                        >
                          Edit
                        </button>
                        <button className="btn-danger" onClick={() => handleDelete(item._id)} type="button">
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