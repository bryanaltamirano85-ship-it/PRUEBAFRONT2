/*Inportaciones y constantes
use, son hooks de react
change es un tipo de envento de formulario en typescript
Api, es la url donde se consume la aip donde envia y resive datos.
*/

import { useEffect, useReducer, useState, ChangeEvent } from "react";

const API_URL = "https://jsonplaceholder.typicode.com/users";

//Tipos de datos

interface Company {
  name: string;
}

interface Address {
  city: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: Company;
  address?: Address;
}

interface TableState {
  sortKey: keyof User;
  sortOrder: "asc" | "desc";
  filters: Record<string, { type: FilterType; value: string }>;
}

type FilterType =
  | "contains"
  | "not_contains"
  | "equals"
  | "not_equals"
  | "starts_with"
  | "ends_with";

type TableAction =
  | { type: "SET_SORT"; key: keyof User }
  | { type: "SET_FILTER"; key: string; filter: { type: FilterType; value: string } }
  | { type: "RESET_FILTERS" };

const initialState: TableState = {
  sortKey: "name",
  sortOrder: "asc",
  filters: {},
};

// ✅ Reducer tipado
function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case "SET_SORT":
      const order =
        state.sortKey === action.key && state.sortOrder === "asc"
          ? "desc"
          : "asc";
      return { ...state, sortKey: action.key, sortOrder: order };
    case "SET_FILTER":
      return {
        ...state,
        filters: { ...state.filters, [action.key]: action.filter },
      };
    case "RESET_FILTERS":
      return { ...state, filters: {} };
    default:
      return state;
  }
}

// ✅ Formulario de creación/edición
interface UserFormProps {
  initial?: User;
  onCancel: () => void;
  onSubmit: (user: User) => void;
}

function UserForm({ initial, onCancel, onSubmit }: UserFormProps): JSX.Element {
  const [form, setForm] = useState({
    name: initial?.name || "",
    email: initial?.email || "",
    phone: initial?.phone || "",
    company: initial?.company?.name || "",
    city: initial?.address?.city || "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    const newUser: User = {
      id: initial?.id || Date.now(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      company: { name: form.company },
      address: { city: form.city },
    };
    onSubmit(newUser);
  };

  return (
    <div className="modal d-block" tabIndex={-1}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{initial ? "Editar Usuario" : "Usuario Nuevo"}</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            {["Nombre", "Correo", "Celular", "Empresa", "Ciudad"].map((field) => (
              <div className="mb-3" key={field}>
                <label className="form-label text-capitalize">{field}</label>
                <input
                  type="text"
                  className="form-control"
                  name={field}
                  value={form[field as keyof typeof form]}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button className="btn btn-success" onClick={handleSubmit}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principal
export default function App(): JSX.Element {
  const [state, dispatch] = useReducer(tableReducer, initialState);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const res = await fetch(API_URL);
      const data: User[] = await res.json();
      setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  // Crear
  const handleCreate = (user: User) => {
    setUsers((prev) => [...prev, user]);
    setCreating(false);
  };

  // Editar
  const handleUpdate = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setEditing(null);
  };

  // Eliminar
  const handleDelete = (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  // Aplicar filtros
  const applyFilters = (userList: User[]) => {
    const filters = state.filters;
    return userList.filter((user) => {
      return Object.entries(filters).every(([key, filter]) => {
        const value = (key === "company" ? user.company?.name :
                      key === "city" ? user.address?.city : (user as any)[key])?.toString().toLowerCase() || "";
        const filterValue = filter.value.toLowerCase();

        switch (filter.type) {
          case "contains":
            return value.includes(filterValue);
          case "not_contains":
            return !value.includes(filterValue);
          case "equals":
            return value === filterValue;
          case "not_equals":
            return value !== filterValue;
          case "starts_with":
            return value.startsWith(filterValue);
          case "ends_with":
            return value.endsWith(filterValue);
          default:
            return true;
        }
      });
    });
  };

  // Aplicar ordenamiento
  const applySorting = (userList: User[]) => {
    const { sortKey, sortOrder } = state;
    return [...userList].sort((a, b) => {
      const aVal = (sortKey === "company" ? a.company?.name :
                    sortKey === "address" ? a.address?.city : (a as any)[sortKey]) || "";
      const bVal = (sortKey === "company" ? b.company?.name :
                    sortKey === "address" ? b.address?.city : (b as any)[sortKey]) || "";

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Filtrar y ordenar
  const displayedUsers = applySorting(applyFilters(users));

  const filterTypes: { label: string; value: FilterType }[] = [
    { label: "Contiene", value: "contains" },
    { label: "No Contiene", value: "not_contains" },
    { label: "Igual", value: "equals" },
    { label: "No Igual", value: "not_equals" },
    { label: "Empieza con", value: "starts_with" },
    { label: "Termina con", value: "ends_with" },
  ];

  return (
    <div className="container mt-4">
      <h1>Lista de Usuarios</h1>

      <div className="mb-3 text-end">
        <button className="btn btn-success" onClick={() => setCreating(true)}>
          Agregar Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-3 row g-2">
        {["Nombre", "Correo", "Celular", "Empresa", "Ciudad"].map((key) => (
          <div className="col-md-2" key={key}>
            <select
              className="form-select mb-1"
              value={state.filters[key]?.type || "contains"}
              onChange={(e) =>
                dispatch({
                  type: "SET_FILTER",
                  key,
                  filter: { type: e.target.value as FilterType, value: state.filters[key]?.value || "" },
                })
              }
            >
              {filterTypes.map((ft) => (
                <option key={ft.value} value={ft.value}>{ft.label}</option>
              ))}
            </select>
            <input
              type="text"
              className="form-control"
              placeholder={`Filtrar ${key}`}
              value={state.filters[key]?.value || ""}
              onChange={(e) =>
                dispatch({
                  type: "SET_FILTER",
                  key,
                  filter: { type: state.filters[key]?.type || "contains", value: e.target.value },
                })
              }
            />
          </div>
        ))}
        <div className="col-md-2 align-self-end">
          <button className="btn btn-secondary w-100" onClick={() => dispatch({ type: "RESET_FILTERS" })}>
            Limpiar filtros
          </button>
        </div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              {["Nombre", "Correo", "Celular", "Empresa", "Ciudad"].map((col) => (
                <th key={col} style={{ cursor: "pointer" }} onClick={() => dispatch({ type: "SET_SORT", key: col as keyof User })}>
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                  {state.sortKey === col && (state.sortOrder === "asc" ? " 🔼" : " 🔽")}
                </th>
              ))}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {displayedUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{user.company?.name}</td>
                <td>{user.address?.city}</td>
                <td>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setEditing(user)}>Editar</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(user.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && <UserForm initial={editing} onCancel={() => setEditing(null)} onSubmit={handleUpdate} />}
      {creating && <UserForm onCancel={() => setCreating(false)} onSubmit={handleCreate} />}
    </div>
  );
}
