# 🎮 ChatApp - Application de Chat et Jeux en Temps Réel

Une application web moderne qui combine chat en temps réel et jeux multijoueurs, construite avec React, Node.js, Socket.IO et Docker.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D22.0.0-green)
![React](https://img.shields.io/badge/react-18.2.0-blue)
![Socket.IO](https://img.shields.io/badge/socket.io-4.7.5-black)

## ✨ Fonctionnalités

### 💬 **Chat en Temps Réel**

- Création et gestion de salles de chat
- Messages instantanés avec horodatage
- Notifications d'arrivée/départ des utilisateurs
- Interface responsive et moderne

### 🎮 **Jeux Multijoueurs**

- Système de jeu de trivia style Kahoot
- Lobby avec système "Prêt"
- Questions à choix multiples avec minuteur
- Système de score avec bonus de rapidité
- Classement en temps réel

### 🏠 **Gestion des Salles**

- Création de salles personnalisées
- Affichage du nombre d'utilisateurs en ligne
- Système de rejoindre/quitter les salles
- Noms d'utilisateurs générés automatiquement

## 🛠️ Technologies Utilisées

- **Frontend**: React 18, Vite, CSS3
- **Backend**: Node.js, Express, Socket.IO
- **Containerisation**: Docker, Docker Compose
- **Proxy**: Nginx (pour la production)

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- [Docker](https://www.docker.com/) et [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)

## 🚀 Installation et Lancement

### Option 1 : Avec Docker (Recommandé)

Cette méthode est la plus simple et garantit un fonctionnement identique sur tous les environnements.

```bash
# 1. Cloner le projet
git clone <url-du-repo>
cd fullstacker

# 2. Construire et lancer l'application
docker-compose up --build

# 3. Ouvrir votre navigateur
# Frontend : http://localhost:3000
# API Backend : http://localhost:3001/health
```

**C'est tout !** L'application sera disponible en quelques minutes.

### Option 2 : Développement Local

Pour le développement et les modifications de code :

#### Backend

```bash
# 1. Aller dans le dossier backend
cd back

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur de développement
npm run dev

# Le serveur sera disponible sur http://localhost:3001
```

#### Frontend

```bash
# 1. Ouvrir un nouveau terminal et aller dans le dossier frontend
cd front

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur de développement
npm run dev

# Le frontend sera disponible sur http://localhost:5173
```

## 🎯 Utilisation

### 1. **Accéder à l'Application**

- Ouvrez `http://localhost:3000` dans votre navigateur
- Cliquez sur "🏠 Browse Rooms"
- Ouvrez un autre `http://localhost:3000` dans un autre onglet, pour simuler un autre utilisateur et intéragissez ensemble !

### 2. **Rejoindre une Salle**

- Un nom d'utilisateur aléatoire vous sera attribué (ex: `HappyCat42`)
- Cliquez sur une salle existante ou créez-en une nouvelle
- Commencez à chatter !

### 3. **Jouer au Trivia**

- Une fois dans une salle, le panneau de jeu apparaît à droite
- Cliquez sur "⏳ Click when Ready" pour vous marquer prêt
- Quand tous les joueurs sont prêts, cliquez sur "🚀 Start Game!"
- Répondez aux questions en cliquant sur A, B, C ou D
- Consultez les résultats et le classement après chaque question

### 4. **Créer une Nouvelle Salle**

- Cliquez sur "+ Create" dans la barre latérale
- Entrez un nom et une description
- La salle sera créée et vous y rejoindrez automatiquement

## 🏗️ Structure du Projet

```
fullstacker/
├── docker-compose.yml          # Configuration Docker
├── front/                      # Application React
│   ├── src/
│   │   ├── App.jsx            # Composant principal
│   │   ├── App.css            # Styles globaux
│   │   └── components/
│   │       ├── ChatRoom.jsx   # Interface de chat
│   │       ├── ChatRoom.css   # Styles du chat
│   │       ├── GameRoom.jsx   # Interface de jeu
│   │       └── GameRoom.css   # Styles du jeu
│   ├── Dockerfile             # Image Docker frontend
│   └── nginx.conf             # Configuration Nginx
├── back/                      # Serveur Node.js
│   ├── server.js              # Point d'entrée principal
│   ├── handlers/
│   │   ├── chat.js           # Logique du chat
│   │   └── game.js           # Logique des jeux
│   ├── package.json          # Dépendances Node.js
│   └── Dockerfile            # Image Docker backend
└── README.md                 # Ce fichier que vous etre entre train de lire
```

## 🐛 Dépannage

### Problèmes Courants

**L'application ne se charge pas :**

```bash
# Vérifier que Docker fonctionne
docker --version
docker-compose --version

# Redémarrer les conteneurs
docker-compose down
docker-compose up --build
```

**Erreur de port déjà utilisé :**

```bash
# Vérifier quels ports sont utilisés
netstat -an | grep :3000
netstat -an | grep :3001

# Arrêter les conteneurs existants
docker-compose down
```

**Les messages ne s'affichent pas :**

- Vérifiez la console du navigateur (F12)
- Assurez-vous que le backend est démarré
- Testez l'API : `curl http://localhost:3001/health`

### Logs de Débogage

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Logs du backend uniquement
docker-compose logs backend

# Logs du frontend uniquement
docker-compose logs frontend
```

## 🔧 Configuration

### Variables d'Environnement

**Backend** (`.env` dans le dossier `back/`) :

```env
PORT=3001
NODE_ENV=development
```

**Frontend** (`.env` dans le dossier `front/`) :

```env
VITE_BACKEND_URL=http://localhost:3001
```

### Ports Utilisés

- **Frontend** : `3000` (production) / `5173` (développement)
- **Backend** : `3001`
- **API Health Check** : `http://localhost:3001/health`

## 🎮 Comment Jouer au Trivia

1. **Rejoignez une salle** avec d'autres joueurs
2. **Marquez-vous prêt** en cliquant sur le bouton "Ready"
3. **Attendez** que tous les joueurs soient prêts
4. **Démarrez le jeu** avec le bouton "Start Game"
5. **Répondez rapidement** aux questions (15 secondes par question)
6. **Gagnez des points** : 100 points + bonus de rapidité
7. **Consultez le classement** après chaque question
8. **Rejouez** autant que vous voulez !

## 🚀 Déploiement en Production

Pour déployer sur un serveur :

```bash
# 1. Cloner sur le serveur
git clone <url-du-repo>
cd chatapp

# 2. Lancer en mode production
docker-compose up -d --build

# 3. L'application sera disponible sur le port 3000
```

**Amusez-vous bien avec Fullstacker ! 🎉**