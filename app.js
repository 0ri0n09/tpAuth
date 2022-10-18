const jwt = require ('jsonwebtoken');
require('dotenv').config();
const express = require ('express');
const app = express ();
app.use(express.json ());
app.use(express.urlencoded ({ extended: true}));

//Liste des users
let users = [
  {
    "id": "777",
    "pseudo": "admin",
    "pwd": "adminpwd",
    "admin": true,
  },
  {
    "id": "123",
    "pseudo": "bob",
    "pwd": "bobpwd",
    "admin": false,
  },
  {
    "id": "321",
    "pseudo": "alice",
    "pwd": "alicepwd",
    "admin": false,
  }
]

//Liste des posts
let posts = [
  {
    "id": "456",
    "author": "123",
    "content": "contenu de Bob"
  },
  {
    "id": "654",
    "author": "321",
    "content": "contenu de Alice"
  },
  {
    "id": "555",
    "author": "777",
    "content": "contenu de Admin"
  }
]

//Génération d'un access token
function generateAccessToken (user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'});
}

//Refresh
function generateRefreshToken (user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '1d'});
}

//Login d'un user
app.post ('/api/login', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let currentUser;
  users.forEach ((user) => {
    if (req.body.pseudo == user.pseudo && req.body.pwd == user.pwd) {
      currentUser = user;
      return;
    }
  });

  if (currentUser == undefined) {
    res.status(401).send('Aucun utilisateur trouvé, identifiants invalides');
    return;
  }

  const accessToken = generateAccessToken (currentUser);
  const refreshToken = generateRefreshToken (currentUser);

  res.send ({
    accessToken,
    refreshToken,
  });
});

//Refresh du token
app.post ('/api/refreshToken', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split (' ')[1];
  if (!token) {
    return res.sendStatus (401);
  }

  jwt.verify (token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus (401);
    }
    delete user.iat;
    delete user.exp;
    const refreshedToken = generateAccessToken (user);
    res.send ({
      accessToken: refreshedToken,
    });
  });
});

//Token d'authentification
function authenticateToken (req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  const authHeader = req.headers ['authorization'];
  const token = authHeader && authHeader.split (' ')[1];

  if (!token) {
    return res.sendStatus (401);
  }

  jwt.verify (token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus (401);
    }
    req.user = user;
    next();
  });
}

//Accès aux posts
app.get ('/api/posts', authenticateToken, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.user.admin == false) {
    posts.forEach ((post) => {
      if (req.user.id == post.author) {
        res.send (post);
        return;
      }
    });
  }
  else {
      res.send (posts);
      return;
    }
});

app.listen (3000, () => {console.log ('Server running on port 3000')});