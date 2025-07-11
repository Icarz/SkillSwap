# SkillSwap Frontend Roadmap

Welcome to the frontend roadmap for the **SkillSwap** project — a skill-sharing platform where users can offer and request skills, chat, leave reviews, and swap services securely.

This frontend will be built using **React + Vite**, styled with **Tailwind CSS**, and powered by a RESTful backend.

---

## 🚀 Tech Stack

- **React** (with Vite for fast builds)
- **React Router DOM** – for routing
- **Axios** – for API communication
- **Context API** – for authentication state
- **Tailwind CSS** – utility-first styling
- Optional:
  - `react-toastify` – toast notifications
  - `react-hook-form` or `yup` – for validation
  - Zustand or React Query – advanced state/data handling

---

## 🗺️ Pages Overview

| Route               | Description                            |
|---------------------|----------------------------------------|
| `/`                 | Landing page with CTA                  |
| `/login`            | Login form                             |
| `/register`         | Registration form                      |
| `/dashboard`        | User overview (profile + activity)     |
| `/profile`          | View/edit personal profile             |
| `/explore-users`    | Search/filter users                    |
| `/explore-skills`   | Browse/search available skills         |
| `/messages`         | Messaging page                         |
| `/transactions`     | View and filter skill swap status      |

---

## 🧩 Key Components

- `Navbar`
- `Footer`
- `PrivateRoute`
- `SkillCard`
- `UserCard`
- `TransactionItem`
- `MessageThread`
- `MessageForm`
- `SearchBar`
- `FilterDropdown`
- `CategoryBadge`
- `SkillForm`
- `ReviewForm`
- `ReviewList`
- `ProfileDetails`
- `ProfileEditForm`
- `Pagination`
- `LoadingSpinner`
- `ErrorBanner`
- `NotificationToast` (optional)

---

## 🔐 Auth State Management

Auth will be handled via `AuthContext` using React Context API:
```js
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const login = (userData) => { ... };
  const logout = () => { ... };
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
