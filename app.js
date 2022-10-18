const jwt = require('jsonwebtoken');
require('dotenv').config();

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

//Liste des users
let users = [
  {
    "id": "555",
    "pseudo": "admin",
    "pwd": "root",
    "content": "contenu de l'admin",
    "admin": true,
  },
  {
    "id": "456",
    "pseudo": "bob",
    "pwd": "123",
    "content": "contenu de bob",
    "admin": false,
  },
  {
    "id": "654",
    "pseudo": "alice",
    "pwd": "321",
    "content": "contenu de alice",
    "admin": false,
  }
]

//Génération d'un access token
function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'});
}

//Refresh
function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '1d'});
}

app.post('/api/login', (req, res) => {
  let currentUser;
  users.forEach((user) => {
    if (req.body.pseudo == user.pseudo && req.body.pwd == user.pwd) {
      currentUser = user;
      return;
    }
  });

  if(currentUser == undefined) {
    res.status(401).send('invalid credentials');
    return;
  }

  const accessToken = generateAccessToken(currentUser);
  const refreshToken = generateRefreshToken(currentUser);

  res.send({
    accessToken,
    refreshToken,
  });
});

app.post('/api/refreshToken', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(401);
    }
    delete user.iat;
    delete user.exp;
    const refreshedToken = generateAccessToken(user);
    res.send({
      accessToken: refreshedToken,
    });
  });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(401);
    }
    req.user = user;
    next();
  });
}

app.get('/api/me', authenticateToken, (req, res) => {
  if(req.user.admin == false) {
    res.send(req.user);
  }
  else if(req.user.admin == false) {
      res.send(users);
    }
});

app.listen(3000, () => {console.log('Server running on port 3000')});