import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

let blueprints = [];
//GET
app.get('/api/v1/blueprints/:author', (req, res) => {
  const filtered = blueprints.filter(bp => bp.author === req.params.author);
  res.json({ data: filtered });
});

//GET
app.get('/api/v1/blueprints/:author/:name', (req, res) => {
  const bp = blueprints.find(b => b.author === req.params.author && b.name === req.params.name);
  res.json(bp ? { data: bp } : { message: 'No encontrado' });
});

//POST
app.post('/api/v1/blueprints', (req, res) => {
  const { author, name, points } = req.body;
  if (blueprints.some(b => b.author === author && b.name === name)) {
    return res.status(400).json({ message: "El plano ya existe" });
  }
  blueprints.push({ author, name, points: points || [] });
  res.status(201).json({ message: 'Creado' });
});

//DELETE
app.delete('/api/v1/blueprints/:author/:name', (req, res) => {
  blueprints = blueprints.filter(b => !(b.author === req.params.author && b.name === req.params.name));
  res.status(200).json({ message: 'Eliminado' });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('join-room', (room) => {
    socket.join(room);
  });

  socket.on('draw-event', (data) => {
    const bp = blueprints.find(b => b.author === data.author && b.name === data.name);
    if (bp) {
      bp.points.push(data.point);
    }
    socket.to(data.room).emit('blueprint-update', { points: [data.point] });
  });
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Server on: http://localhost:${PORT}`));