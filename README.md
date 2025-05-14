# SkillSwap API 🔄

A peer-to-peer skill exchange platform where users can:
- Teach skills they master
- Learn new skills from others
- Connect based on mutual interests

**Created by Mohammed Rerhaye**

## 🛠️ Backend Stack
| Component       | Technology                          |
|-----------------|-------------------------------------|
| Framework       | Express.js (Node.js)                |
| Database        | MongoDB (with Mongoose ODM)         |
| Authentication  | JWT (JSON Web Tokens)               |
| Search          | Fuse.js (fuzzy search)              |
| API Design      | RESTful principles                  |
| Deployment      | (Specify if deployed: e.g., Render, AWS) |

## 🌟 Key Features
- Skill-based matching algorithm
- Secure authentication
- Review system for users
- Fuzzy search for skills

## 📚 API Endpoints

### Authentication
| Endpoint          | Method | Description                     | Auth Required |
|-------------------|--------|---------------------------------|--------------|
| `/api/auth/register` | POST | Register new user               | No           |
| `/api/auth/login`    | POST | Login existing user             | No           |

### User Profiles
| Endpoint                | Method | Description                          | Auth Required |
|-------------------------|--------|--------------------------------------|--------------|
| `/api/users/me`         | GET    | Get current user profile             | Yes          |
| `/api/users/:userId`    | GET    | Get public profile by ID             | Yes          |
| `/api/users/me`         | PUT    | Update current user profile          | Yes          |

### Skill Matching
| Endpoint                | Method | Description                          | Auth Required |
|-------------------------|--------|--------------------------------------|--------------|
| `/api/users/matches`    | GET    | Find compatible skill exchange partners | Yes       |
| `/api/users/search`     | GET    | Search users by skills (`?skills=react`) | Yes      |

### Reviews
| Endpoint                     | Method | Description                     | Auth Required |
|------------------------------|--------|---------------------------------|--------------|
| `/api/users/review`          | POST   | Leave a review for another user | Yes          |
| `/api/users/reviews/:userId` | GET    | Get all reviews for a user      | No           |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas or local instance
- (Any other requirements)

### Installation
1. Clone repo:
   ```bash
   git clone https://github.com/Icarz/SkillSwap