/*Inportaciones y constantes
use, son hooks de react
change es un tipo de envento de formulario en typescript
Api, es la url donde se consume la aip donde envia y resive datos.
*/

import { useEffect, useReducer, useState, ChangeEvent } from "react";

const API_URL = "https://jsonplaceholder.typicode.com/users";

// Tipos
interface Company { name: string; }
interface Address { city: string; }

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: Company;
  address?: Address;
}

type FilterType =
  | "contains"
  | "not_contains"
  | "equals"
  | "not_equals"
  | "starts_with"
  | "ends_with";

interface TableState {
  sortKey: keyof User | "company" | "city";
  sortOrder: "asc" | "desc";
  filters: Record<string, { type: FilterType; value: string }>;
}

type TableAction =
  | { type: "SET_SORT"; key: keyof User | "company" | "city" }
  | { type: "SET_FILTER"; key: string; filter: { type: FilterType; value: string } }
  | { type: "RESET_FILTERS" };

const initialState: TableState = {
  sortKey: "name",
  sortOrder: "asc",
  filters: {},
};

// Reducer
function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case "SET_SORT":
      return {
        ...state,
        sortKey: action.key,
        sortOrder:
          state.sortKey === action.key && state.sortOrder === "asc"
            ? "desc"
            : "asc",
      };
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

// Formulario
function UserForm({ initial, onCancel, onSubmit }: any) {
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
    const user: User = {
      id: initial?.id || Date.now(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      company: { name: form.company },
      address: { city: form.city },
    };
    onSubmit(user);
  };

  return (
    <div className="modal d-block" tabIndex={-1}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5>{initial ? "Editar Usuario" : "Nuevo Usuario"}</h5>
            <button className="btn-close" onClick={onCancel}></button>
          </div>

          <div className="modal-body">
            {[
              { key: "name", label: "Nombre" },
              { key: "email", label: "Correo" },
              { key: "phone", label: "Celular" },
              { key: "company", label: "Empresa" },
              { key: "city", label: "Ciudad" },
            ].map((f) => (
              <div className="mb-3" key={f.key}>
                <label>{f.label}</label>
                <input
                  className="form-control"
                  name={f.key}
                  value={form[f.key as keyof typeof form]}
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

// App principal
export default function App() {
  const [state, dispatch] = useReducer(tableReducer, initialState);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    };
    load();
  }, []);

  // CRUD
  const handleCreate = (user: User) => {
    setUsers((p) => [...p, user]);
    setCreating(false);
  };

  const handleUpdate = (u: User) => {
    setUsers((p) => p.map((x) => (x.id === u.id ? u : x)));
    setEditing(null);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Eliminar?")) {
      setUsers((p) => p.filter((u) => u.id !== id));
    }
  };

  // Filtros
  const applyFilters = (list: User[]) => {
    return list.filter((u) =>
      Object.entries(state.filters).every(([key, filter]) => {
        const val =
          key === "company"
            ? u.company?.name?.toLowerCase() || ""
            : key === "city"
            ? u.address?.city?.toLowerCase() || ""
            : (u as any)[key]?.toString().toLowerCase() || "";

        const f = filter.value.toLowerCase();

        switch (filter.type) {
          case "contains":
            return val.includes(f);
          case "not_contains":
            return !val.includes(f);
          case "equals":
            return val === f;
          case "not_equals":
            return val !== f;
          case "starts_with":
            return val.startsWith(f);
          case "ends_with":
            return val.endsWith(f);
          default:
            return true;
        }
      })
    );
  };

  // Ordenamiento
  const applySorting = (list: User[]) => {
    const { sortKey, sortOrder } = state;

    return [...list].sort((a, b) => {
      const get = (x: User) =>
        sortKey === "company"
          ? x.company?.name || ""
          : sortKey === "city"
          ? x.address?.city || ""
          : (x as any)[sortKey] || "";

      const A = get(a).toString().toLowerCase();
      const B = get(b).toString().toLowerCase();

      if (A < B) return sortOrder === "asc" ? -1 : 1;
      if (A > B) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const filtered = applyFilters(users);
  const sorted = applySorting(filtered);

  // Columnas reales
  const columns = [
    { key: "name", label: "Nombre" },
    { key: "email", label: "Correo" },
    { key: "phone", label: "Celular" },
    { key: "company", label: "Empresa" },
    { key: "city", label: "Ciudad" },
  ];

  return (
    <div className="container mt-4">
      <h1>Lista de Usuarios</h1>

      <button className="btn btn-success mb-3" onClick={() => setCreating(true)}>
        + Crear Usuario
      </button>

      {/* FILTROS */}
      <div className="row g-2 mb-3">
        {columns.map((col) => (
          <div className="col-md-2" key={col.key}>
            <select
              className="form-select mb-1"
              value={state.filters[col.key]?.type || "contains"}
              onChange={(e) =>
                dispatch({
                  type: "SET_FILTER",
                  key: col.key,
                  filter: {
                    type: e.target.value as FilterType,
                    value: state.filters[col.key]?.value || "",
                  },
                })
              }
            >
              <option value="contains">Contiene</option>
              <option value="not_contains">No Contiene</option>
              <option value="equals">Igual</option>
              <option value="not_equals">No Igual</option>
              <option value="starts_with">Empieza con</option>
              <option value="ends_with">Termina con</option>
            </select>

            <input
              className="form-control"
              placeholder={`Filtrar ${col.label}`}
              value={state.filters[col.key]?.value || ""}
              onChange={(e) =>
                dispatch({
                  type: "SET_FILTER",
                  key: col.key,
                  filter: {
                    type: state.filters[col.key]?.type || "contains",
                    value: e.target.value,
                  },
                })
              }
            />
          </div>
        ))}

        <div className="col-md-2 d-grid">
          <button
            className="btn btn-secondary"
            onClick={() => dispatch({ type: "RESET_FILTERS" })}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* TABLA */}
      <table className="table table-striped">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ cursor: "pointer" }}
                onClick={() => dispatch({ type: "SET_SORT", key: c.key as any })}
              >
                {c.label}{" "}
                {state.sortKey === c.key &&
                  (state.sortOrder === "asc" ? "🔼" : "🔽")}
              </th>
            ))}
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {sorted.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td>{u.company?.name}</td>
              <td>{u.address?.city}</td>
              <td>
                <button
                  className="btn btn-sm btn-primary me-2"
                  onClick={() => setEditing(u)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(u.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <UserForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSubmit={handleUpdate}
        />
      )}

      {creating && (
        <UserForm onCancel={() => setCreating(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}
