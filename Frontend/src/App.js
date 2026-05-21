import { useState, useEffect } from "react";

const API = "http://localhost:8080/api/movies";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState({ name: "", director: "", rating: "" });
  const [loading, setLoading] = useState(false);
  const [editMovie, setEditMovie] = useState(null); // holds movie being edited

  useEffect(() => { fetchMovies(); }, []);

  const fetchMovies = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setMovies(data);
  };

  const addMovie = async () => {
    if (!form.name || !form.director || !form.rating) return alert("Fill all fields");
    setLoading(true);
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rating: parseFloat(form.rating) }),
    });
    setForm({ name: "", director: "", rating: "" });
    await fetchMovies();
    setLoading(false);
  };

  const deleteMovie = async (id) => {
    if (!window.confirm("Delete this movie?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchMovies();
  };

  const saveEdit = async () => {
    if (!editMovie.name || !editMovie.director || !editMovie.rating) return alert("Fill all fields");
    await fetch(`${API}/${editMovie.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editMovie, rating: parseFloat(editMovie.rating) }),
    });
    setEditMovie(null);
    fetchMovies();
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>Movie<span style={{ color: "#e8572a" }}>DB</span></h1>
        <span style={s.sub}>{movies.length} film{movies.length !== 1 ? "s" : ""} in collection</span>
      </div>

      {/* Add form */}
      <div style={s.addCard}>
        <p style={s.addLabel}>Add a film</p>
        <div style={s.formRow}>
          <input style={s.input} placeholder="Title" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <input style={s.input} placeholder="Director" value={form.director}
            onChange={e => setForm({ ...form, director: e.target.value })} />
          <input style={s.input} placeholder="Rating (0–10)" type="number"
            min="0" max="10" step="0.1" value={form.rating}
            onChange={e => setForm({ ...form, rating: e.target.value })} />
          <button style={s.btnOrange} onClick={addMovie} disabled={loading}>
            {loading ? "Adding..." : "+ Add"}
          </button>
        </div>
      </div>

      {/* Cards grid */}
      {movies.length === 0 ? (
        <p style={s.empty}>No movies yet — add your first film above.</p>
      ) : (
        <div style={s.grid}>
          {movies.map(m => (
            <div key={m.id} style={s.card}>
              <div style={s.cardName}>{m.name}</div>
              <div style={s.cardDir}>{m.director}</div>
              <div style={s.badge}>★ {m.rating}</div>
              <div style={s.cardActions}>
                <button style={s.btnEdit} onClick={() => setEditMovie({ ...m })}>✏ Edit</button>
                <button style={s.btnDel} onClick={() => deleteMovie(m.id)}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editMovie && (
        <div style={s.modalBg} onClick={() => setEditMovie(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Edit film</h3>
            <div style={s.modalFields}>
              <input style={s.input} placeholder="Title" value={editMovie.name}
                onChange={e => setEditMovie({ ...editMovie, name: e.target.value })} />
              <input style={s.input} placeholder="Director" value={editMovie.director}
                onChange={e => setEditMovie({ ...editMovie, director: e.target.value })} />
              <input style={s.input} placeholder="Rating" type="number"
                min="0" max="10" step="0.1" value={editMovie.rating}
                onChange={e => setEditMovie({ ...editMovie, rating: e.target.value })} />
            </div>
            <div style={s.modalBtns}>
              <button style={s.btnGhost} onClick={() => setEditMovie(null)}>Cancel</button>
              <button style={s.btnOrange} onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { width: "100%", minHeight: "100vh", background: "#fff", padding: "2rem 3rem", fontFamily: "'Segoe UI', sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "1.25rem", borderBottom: "1px solid #f0f0f0" },
  title: { fontSize: "2rem", fontWeight: 600, color: "#111" },
  sub: { fontSize: 13, color: "#aaa" },
  addCard: { background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: "1.25rem", marginBottom: "1.5rem" },
  addLabel: { fontSize: 12, color: "#aaa", marginBottom: 10, letterSpacing: 0.5 },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr 140px 100px", gap: 10, alignItems: "center" },
  input: { width: "100%", fontSize: 14, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", outline: "none", fontFamily: "inherit" },
  btnOrange: { background: "#e8572a", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "9px 16px", fontFamily: "inherit" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 },
  card: { background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: 8 },
  cardName: { fontSize: 15, fontWeight: 600, color: "#111" },
  cardDir: { fontSize: 13, color: "#888" },
  badge: { display: "inline-block", background: "#fff5f2", color: "#e8572a", border: "1px solid #fcd5c8", padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 600, width: "fit-content" },
  cardActions: { display: "flex", gap: 8, marginTop: 4 },
  btnEdit: { flex: 1, background: "#fff", border: "1px solid #ddd", color: "#555", padding: "6px 0", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  btnDel: { flex: 1, background: "#fff", border: "1px solid #ddd", color: "#555", padding: "6px 0", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  empty: { textAlign: "center", padding: "4rem", color: "#ccc", fontSize: 15 },
  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: "1.5rem", width: 360 },
  modalTitle: { fontSize: 16, fontWeight: 600, marginBottom: "1rem", color: "#111" },
  modalFields: { display: "flex", flexDirection: "column", gap: 10, marginBottom: "1rem" },
  modalBtns: { display: "flex", justifyContent: "flex-end", gap: 8 },
  btnGhost: { background: "#fff", border: "1px solid #eee", color: "#888", padding: "8px 16px", borderRadius: 8, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
};