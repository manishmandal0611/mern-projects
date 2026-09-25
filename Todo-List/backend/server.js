const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secretfallbackkey';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todoDB')
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// --- Schemas & Models ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
});

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  dueDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// --- Auth Routes ---
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- Task Routes ---
// 1. GET /tasks
app.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// 2. POST /add
app.post('/add', authMiddleware, async (req, res) => {
  try {
    const taskContent = req.body.text || req.body.title;
    if (!taskContent) return res.status(400).json({ error: 'Task text is required' });

    const newTask = new Task({
      text: taskContent,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      userId: req.userId,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add task' });
  }
});

// 3. PUT /tasks/:id
app.put('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed, dueDate } = req.body;

    const updates = {};
    if (text !== undefined) updates.text = text;
    if (completed !== undefined) updates.completed = completed;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updates,
      { new: true }
    );

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// 4. DELETE /tasks/:id
app.delete('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await Task.findOneAndDelete({ _id: id, userId: req.userId });
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));