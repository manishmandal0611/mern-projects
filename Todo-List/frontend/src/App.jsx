import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import "./styles/App.css";

const BACKEND_URL = "https://todo-app-list-cued.onrender.com";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("userEmail") || "");
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("app_theme") === "dark");

  const [authMode, setAuthMode] = useState("login");
  const [emailInput, setEmailInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [todoList, setTodoList] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [editTaskId, setEditTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  useEffect(() => {
    localStorage.setItem("app_theme", isDarkMode ? "dark" : "light");
    document.body.className = isDarkMode ? "dark-mode" : "light-mode";
  }, [isDarkMode]);

  const authHeaders = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const handleLogout = useCallback(() => {
    setToken("");
    setUserEmail("");
    setTodoList([]);
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/tasks`, authHeaders);
      setTodoList(data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  }, [authHeaders, handleLogout]);

  useEffect(() => {
    if (token) {
      loadTasks();
    }
  }, [token, loadTasks]);

  const onAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const path = authMode === "signup" ? "/auth/register" : "/auth/login";

    try {
      const res = await axios.post(`${BACKEND_URL}${path}`, {
        email: emailInput,
        password: passInput,
      });

      const authToken = res.data.token;
      const userMail = res.data.email;

      setToken(authToken);
      setUserEmail(userMail);
      localStorage.setItem("token", authToken);
      localStorage.setItem("userEmail", userMail);
      setPassInput("");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Invalid credentials, please try again.");
    }
  };

  const onAddTask = async (e) => {
    e.preventDefault();
    const cleanTitle = taskTitle.trim();
    if (!cleanTitle) return;

    try {
      const res = await axios.post(
        `${BACKEND_URL}/add`,
        { text: cleanTitle, dueDate: taskDeadline || null },
        authHeaders
      );
      setTodoList((prev) => [res.data, ...prev]);
      setTaskTitle("");
      setTaskDeadline("");
    } catch (err) {
      console.error("Task add failed:", err);
    }
  };

  const onToggleStatus = async (item) => {
    try {
      const res = await axios.put(
        `${BACKEND_URL}/tasks/${item._id}`,
        { completed: !item.completed },
        authHeaders
      );
      setTodoList((prev) => prev.map((t) => (t._id === item._id ? res.data : t)));
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const initEdit = (item) => {
    setEditTaskId(item._id);
    setEditTitle(item.text);
    setEditDeadline(item.dueDate ? item.dueDate.split("T")[0] : "");
  };

  const onUpdateTask = async (id) => {
    if (!editTitle.trim()) return;
    try {
      const res = await axios.put(
        `${BACKEND_URL}/tasks/${id}`,
        { text: editTitle.trim(), dueDate: editDeadline || null },
        authHeaders
      );
      setTodoList((prev) => prev.map((t) => (t._id === id ? res.data : t)));
      setEditTaskId(null);
      setEditTitle("");
      setEditDeadline("");
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const onRemoveTask = async (id) => {
    try {
      await axios.delete(`${BACKEND_URL}/tasks/${id}`, authHeaders);
      setTodoList((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const isTaskOverdue = (dateStr, isDone) => {
    if (!dateStr || isDone) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    return due < now;
  };

  const visibleTasks = useMemo(() => {
    return todoList.filter((item) => {
      const matches = (item.text || "").toLowerCase().includes(searchKey.toLowerCase().trim());
      if (!matches) return false;
      if (activeTab === "active") return !item.completed;
      if (activeTab === "completed") return item.completed;
      return true;
    });
  }, [todoList, searchKey, activeTab]);

  const currentTheme = isDarkMode ? "dark-theme" : "light-theme";

  if (!token) {
    return (
      <div className={`page-wrapper ${currentTheme}`}>
        <div className="main-title-section">
          <h1 className="hero-heading">
            <span className="app-icon">📝</span> To-Do App List
          </h1>
          <p className="hero-subtext">Manage your daily tasks and workflow with ease</p>
        </div>

        <div className={`app-container auth-container ${currentTheme}`}>
          <div className="app-header">
            <h2>{authMode === "signup" ? "Create Account" : "Welcome Back"}</h2>
            <button
              className="btn-theme"
              onClick={() => setIsDarkMode((prev) => !prev)}
              type="button"
            >
              {isDarkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>

          {errorMsg && <p className="error-message">{errorMsg}</p>}

          <form onSubmit={onAuthSubmit} className="auth-form">
            <input
              className="input-field"
              type="email"
              placeholder="Email address"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <input
              className="input-field"
              type="password"
              placeholder="Password"
              required
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
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
                setAuthMode((prev) => (prev === "login" ? "signup" : "login"));
                setErrorMsg("");
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
    <div className={`page-wrapper ${currentTheme}`}>
      <div className="main-title-section">
        <h1 className="hero-heading">
          <span className="app-icon">📝</span> To-Do App List
        </h1>
      </div>

      <div className={`app-container ${currentTheme}`}>
        <div className="app-header">
          <div>
            <h2>Dashboard</h2>
            <small className="sub-text">{userEmail}</small>
          </div>
          <div className="header-actions">
            <button
              className="btn-theme"
              onClick={() => setIsDarkMode((prev) => !prev)}
              type="button"
            >
              {isDarkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button className="btn-danger" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        </div>

        <form onSubmit={onAddTask} className="task-form">
          <input
            className="input-field task-input"
            type="text"
            placeholder="Enter a task..."
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />
          <input
            className="input-field date-input"
            type="date"
            value={taskDeadline}
            onChange={(e) => setTaskDeadline(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            Add Task
          </button>
        </form>

        <input
          className="input-field search-input"
          type="text"
          placeholder="Search tasks..."
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
        />

        <div className="tabs-container">
          {["all", "active", "completed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              type="button"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <ul className="task-list">
          {visibleTasks.length === 0 ? (
            <p className="sub-text empty-msg">No tasks found.</p>
          ) : (
            visibleTasks.map((item) => {
              const overdue = isTaskOverdue(item.dueDate, item.completed);
              const isCurrentEdit = editTaskId === item._id;

              return (
                <li
                  key={item._id}
                  className={`task-item ${item.completed ? "completed" : ""} ${overdue ? "overdue" : ""}`}
                >
                  <div className="task-left">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => onToggleStatus(item)}
                      disabled={isCurrentEdit}
                      className="task-checkbox"
                    />

                    {isCurrentEdit ? (
                      <div className="edit-box-row">
                        <input
                          className="input-field edit-text-input"
                          type="text"
                          value={editTitle}
                          autoFocus
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") onUpdateTask(item._id);
                            if (e.key === "Escape") setEditTaskId(null);
                          }}
                        />
                        <input
                          className="input-field edit-date-input"
                          type="date"
                          value={editDeadline}
                          onChange={(e) => setEditDeadline(e.target.value)}
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
                    {isCurrentEdit ? (
                      <>
                        <button className="btn-success" onClick={() => onUpdateTask(item._id)} type="button">
                          Save
                        </button>
                        <button className="btn-secondary" onClick={() => setEditTaskId(null)} type="button">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-edit"
                          onClick={() => initEdit(item)}
                          disabled={item.completed}
                          type="button"
                        >
                          Edit
                        </button>
                        <button className="btn-danger" onClick={() => onRemoveTask(item._id)} type="button">
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