import { useState, useEffect, useMemo } from "react";

const API = "http://localhost:8080/api/movies";
const OMDB_KEY = "your_api_key";
const PLACEHOLDER = "https://placehold.co/300x420?text=No+Poster";
const GENRES = ["Action", "Comedy", "Drama", "Horror", "Romance", "Sci-Fi", "Thriller", "Animation", "Documentary", "Other"];

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = "Movie title is required";
  else if (form.name.trim().length > 100) errors.name = "Title must be under 100 characters";
  if (!form.director.trim()) errors.director = "Director is required";
  else if (form.director.trim().length > 100) errors.director = "Director must be under 100 characters";
  if (!form.rating) errors.rating = "Rating is required";
  else if (isNaN(form.rating)) errors.rating = "Rating must be a number";
  else if (form.rating < 0 || form.rating > 10) errors.rating = "Rating must be between 0 and 10";
  return errors;
};

const emptyForm = { name: "", director: "", rating: "", imageUrl: "", genre: "", watched: false };

export default function App() {
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [editMovie, setEditMovie] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [posterLoading, setPosterLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Search, sort, filter state
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [filterGenre, setFilterGenre] = useState("All");
  const [filterWatched, setFilterWatched] = useState("All");

  useEffect(() => { fetchMovies(); }, []);

  const fetchMovies = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setMovies(Array.isArray(data) ? data : []);
    } catch (e) {
      setMovies([]);
      setApiError("Could not connect to backend. Make sure Spring Boot is running.");
    }
  };

  // OMDB — fetch poster + auto-fill director
  const fetchFromOMDB = async (movieName, isEdit = false) => {
    if (!movieName.trim()) return;
    setPosterLoading(true);
    try {
      const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${OMDB_KEY}`);
      const data = await res.json();
      if (data.Response === "True") {
        const poster = data.Poster !== "N/A" ? data.Poster : "";
        const director = data.Director !== "N/A" ? data.Director : "";
        const genre = data.Genre ? data.Genre.split(",")[0].trim() : "";
        if (isEdit) {
          setEditMovie(prev => ({
            ...prev,
            imageUrl: poster || prev.imageUrl,
            director: director || prev.director,
            genre: genre || prev.genre,
          }));
        } else {
          setForm(prev => ({
            ...prev,
            imageUrl: poster || prev.imageUrl,
            director: director || prev.director,
            genre: genre || prev.genre,
          }));
        }
      }
    } catch (e) { console.error("OMDB fetch failed"); }
    setPosterLoading(false);
  };

  const addMovie = async () => {
    const errors = validate(form);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setLoading(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rating: parseFloat(form.rating) }),
      });
      if (!res.ok) { const err = await res.json(); setFormErrors(err); setLoading(false); return; }
      setForm(emptyForm);
      setShowForm(false);
      await fetchMovies();
    } catch (e) { setApiError("Failed to add movie."); }
    setLoading(false);
  };

  const deleteMovie = async (id) => {
    if (!window.confirm("Delete this movie?")) return;
    try {
      await fetch(`${API}/${id}`, { method: "DELETE" });
      fetchMovies();
    } catch (e) { setApiError("Failed to delete movie."); }
  };

  const saveEdit = async () => {
    const errors = validate(editMovie);
    if (Object.keys(errors).length > 0) { setEditErrors(errors); return; }
    setEditErrors({});
    try {
      const res = await fetch(`${API}/${editMovie.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editMovie, rating: parseFloat(editMovie.rating) }),
      });
      if (!res.ok) { const err = await res.json(); setEditErrors(err); return; }
      setEditMovie(null);
      fetchMovies();
    } catch (e) { setApiError("Failed to update movie."); }
  };

  const toggleWatched = async (id) => {
    try {
      await fetch(`${API}/${id}/watched`, { method: "PATCH" });
      fetchMovies();
    } catch (e) { setApiError("Failed to update watched status."); }
  };

  // Filter + Search + Sort — all in one useMemo
  const displayedMovies = useMemo(() => {
    let result = [...movies];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q)
      );
    }

    // Genre filter
    if (filterGenre !== "All") {
      result = result.filter(m => m.genre === filterGenre);
    }

    // Watched filter
    if (filterWatched === "Watched") result = result.filter(m => m.watched);
    if (filterWatched === "Unwatched") result = result.filter(m => !m.watched);

    // Sort
    if (sortBy === "rating-desc") result.sort((a, b) => b.rating - a.rating);
    if (sortBy === "rating-asc") result.sort((a, b) => a.rating - b.rating);
    if (sortBy === "name-asc") result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name-desc") result.sort((a, b) => b.name.localeCompare(a.name));

    return result;
  }, [movies, search, filterGenre, filterWatched, sortBy]);

  const stars = (rating) => {
    const filled = Math.round(rating / 2);
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < filled ? "#f5a623" : "#ddd", fontSize: 14 }}>★</span>
    ));
  };

  const genreCounts = useMemo(() => {
    const counts = {};
    movies.forEach(m => { if (m.genre) counts[m.genre] = (counts[m.genre] || 0) + 1; });
    return counts;
  }, [movies]);

  return (
    <div style={s.page}>

      {apiError && (
        <div style={s.banner}>
          ⚠ {apiError}
          <button style={s.bannerClose} onClick={() => setApiError("")}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>🎬 Movie<span style={{ color: "#e8572a" }}>DB</span></h1>
          <p style={s.sub}>
            {movies.length} films · {movies.filter(m => m.watched).length} watched · {movies.filter(m => !m.watched).length} unwatched
          </p>
        </div>
        <button style={s.btnOrange} onClick={() => { setShowForm(!showForm); setForm(emptyForm); setFormErrors({}); }}>
          {showForm ? "✕ Cancel" : "+ Add Movie"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={s.addCard}>
          <p style={s.addLabel}>ADD A FILM</p>
          <div style={s.formGrid}>
            <div style={s.fieldWrap}>
              <label style={s.label}>Title *</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input style={{ ...s.input, ...(formErrors.name ? s.inputError : {}), flex: 1 }}
                  placeholder="e.g. Inception" value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); setFormErrors({ ...formErrors, name: "" }); }} />
                <button style={s.btnSearch} onClick={() => fetchFromOMDB(form.name)}
                  title="Fetch from OMDB" disabled={posterLoading}>
                  {posterLoading ? "..." : "🔍"}
                </button>
              </div>
              {formErrors.name && <span style={s.errMsg}>{formErrors.name}</span>}
              {form.imageUrl && <span style={{ fontSize: 11, color: "#27ae60" }}>✓ Poster & details found!</span>}
            </div>

            <div style={s.fieldWrap}>
              <label style={s.label}>Director *</label>
              <input style={{ ...s.input, ...(formErrors.director ? s.inputError : {}) }}
                placeholder="Auto-filled or enter manually" value={form.director}
                onChange={e => { setForm({ ...form, director: e.target.value }); setFormErrors({ ...formErrors, director: "" }); }} />
              {formErrors.director && <span style={s.errMsg}>{formErrors.director}</span>}
            </div>

            <div style={s.fieldWrap}>
              <label style={s.label}>Rating * (0–10)</label>
              <input style={{ ...s.input, ...(formErrors.rating ? s.inputError : {}) }}
                placeholder="e.g. 8.5" type="number" min="0" max="10" step="0.1" value={form.rating}
                onChange={e => { setForm({ ...form, rating: e.target.value }); setFormErrors({ ...formErrors, rating: "" }); }} />
              {formErrors.rating && <span style={s.errMsg}>{formErrors.rating}</span>}
            </div>

            <div style={s.fieldWrap}>
              <label style={s.label}>Genre</label>
              <select style={s.input} value={form.genre}
                onChange={e => setForm({ ...form, genre: e.target.value })}>
                <option value="">Select genre</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {form.imageUrl && (
            <div style={{ marginTop: 12 }}>
              <img src={form.imageUrl} alt="poster preview"
                style={{ width: 80, height: 110, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }} />
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button style={s.btnOrange} onClick={addMovie} disabled={loading}>
              {loading ? "Adding..." : "Add Movie"}
            </button>
          </div>
        </div>
      )}

      {/* Search + Sort + Filter bar */}
      <div style={s.toolbar}>
        <input style={{ ...s.input, maxWidth: 280 }} placeholder="🔍 Search by title or director..."
          value={search} onChange={e => setSearch(e.target.value)} />

        <select style={s.select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="default">Sort: Default</option>
          <option value="rating-desc">Rating: High to Low</option>
          <option value="rating-asc">Rating: Low to High</option>
          <option value="name-asc">Name: A → Z</option>
          <option value="name-desc">Name: Z → A</option>
        </select>

        <select style={s.select} value={filterGenre} onChange={e => setFilterGenre(e.target.value)}>
          <option value="All">All Genres</option>
          {GENRES.map(g => (
            <option key={g} value={g}>{g} {genreCounts[g] ? `(${genreCounts[g]})` : ""}</option>
          ))}
        </select>

        <select style={s.select} value={filterWatched} onChange={e => setFilterWatched(e.target.value)}>
          <option value="All">All Movies</option>
          <option value="Watched">✅ Watched ({movies.filter(m => m.watched).length})</option>
          <option value="Unwatched">🕐 Unwatched ({movies.filter(m => !m.watched).length})</option>
        </select>
      </div>

      <p style={s.count}>
        Showing {displayedMovies.length} of {movies.length} films
      </p>

      {/* Cards */}
      {displayedMovies.length === 0 ? (
        <div style={s.emptyBox}>
          <p style={{ fontSize: 40 }}>🎥</p>
          <p style={{ fontSize: 16, color: "#aaa", marginTop: 8 }}>
            {movies.length === 0 ? "No movies yet" : "No movies match your search"}
          </p>
          <p style={{ fontSize: 13, color: "#ccc" }}>
            {movies.length === 0 ? "Click '+ Add Movie' to get started" : "Try a different search or filter"}
          </p>
        </div>
      ) : (
        <div style={s.grid}>
          {displayedMovies.map(m => (
            <div key={m.id} style={{ ...s.card, opacity: m.watched ? 0.85 : 1 }}>
              <div style={s.posterWrap}>
                <img src={m.imageUrl || PLACEHOLDER} alt={m.name} style={s.poster}
                  onError={e => { e.target.src = PLACEHOLDER; }} />
                <div style={s.ratingBadge}>★ {m.rating}</div>
                {m.watched && <div style={s.watchedBadge}>✅ Watched</div>}
              </div>
              <div style={s.cardBody}>
                <div style={s.cardName}>{m.name}</div>
                <div style={s.cardDir}>🎬 {m.director}</div>
                {m.genre && <div style={s.genreTag}>{m.genre}</div>}
                <div style={{ display: "flex", gap: 2, marginTop: 4 }}>{stars(m.rating)}</div>
                <button
                  style={{ ...s.watchBtn, background: m.watched ? "#e8f5e9" : "#f5f5f5", color: m.watched ? "#27ae60" : "#888" }}
                  onClick={() => toggleWatched(m.id)}>
                  {m.watched ? "✅ Watched" : "🕐 Mark as Watched"}
                </button>
                <div style={s.cardActions}>
                  <button style={s.btnEdit}
                    onMouseEnter={e => e.target.style.background = "#e8f0fe"}
                    onMouseLeave={e => e.target.style.background = "#fff"}
                    onClick={() => { setEditMovie({ ...m }); setEditErrors({}); }}>✏ Edit</button>
                  <button style={s.btnDel}
                    onMouseEnter={e => e.target.style.background = "#fff5f2"}
                    onMouseLeave={e => e.target.style.background = "#fff"}
                    onClick={() => deleteMovie(m.id)}>🗑 Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editMovie && (
        <div style={s.modalBg} onClick={() => setEditMovie(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>✏ Edit Film</h3>
            <div style={s.modalFields}>
              <div style={s.fieldWrap}>
                <label style={s.label}>Title *</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...s.input, ...(editErrors.name ? s.inputError : {}), flex: 1 }}
                    value={editMovie.name}
                    onChange={e => { setEditMovie({ ...editMovie, name: e.target.value }); setEditErrors({ ...editErrors, name: "" }); }} />
                  <button style={s.btnSearch} onClick={() => fetchFromOMDB(editMovie.name, true)}
                    disabled={posterLoading}>{posterLoading ? "..." : "🔍"}</button>
                </div>
                {editErrors.name && <span style={s.errMsg}>{editErrors.name}</span>}
              </div>
              <div style={s.fieldWrap}>
                <label style={s.label}>Director *</label>
                <input style={{ ...s.input, ...(editErrors.director ? s.inputError : {}) }}
                  value={editMovie.director}
                  onChange={e => { setEditMovie({ ...editMovie, director: e.target.value }); setEditErrors({ ...editErrors, director: "" }); }} />
                {editErrors.director && <span style={s.errMsg}>{editErrors.director}</span>}
              </div>
              <div style={s.fieldWrap}>
                <label style={s.label}>Rating * (0–10)</label>
                <input style={{ ...s.input, ...(editErrors.rating ? s.inputError : {}) }}
                  type="number" min="0" max="10" step="0.1" value={editMovie.rating}
                  onChange={e => { setEditMovie({ ...editMovie, rating: e.target.value }); setEditErrors({ ...editErrors, rating: "" }); }} />
                {editErrors.rating && <span style={s.errMsg}>{editErrors.rating}</span>}
              </div>
              <div style={s.fieldWrap}>
                <label style={s.label}>Genre</label>
                <select style={s.input} value={editMovie.genre || ""}
                  onChange={e => setEditMovie({ ...editMovie, genre: e.target.value })}>
                  <option value="">Select genre</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            {editMovie.imageUrl && (
              <img src={editMovie.imageUrl} alt="preview"
                style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8, marginBottom: 12 }}
                onError={e => { e.target.style.display = "none"; }} />
            )}
            <div style={s.modalBtns}>
              <button style={s.btnGhost} onClick={() => setEditMovie(null)}>Cancel</button>
              <button style={s.btnOrange} onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { width: "100%", minHeight: "100vh", background: "#f5f5f5", padding: "2rem 3rem", fontFamily: "'Segoe UI', sans-serif" },
  banner: { background: "#fff3cd", border: "1px solid #ffc107", color: "#856404", padding: "12px 16px", borderRadius: 8, marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 },
  bannerClose: { background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#856404" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", padding: "1.5rem 2rem", borderRadius: 12, marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  title: { fontSize: "2rem", fontWeight: 700, color: "#111", margin: 0 },
  sub: { fontSize: 13, color: "#aaa", margin: "4px 0 0" },
  addCard: { background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  addLabel: { fontSize: 11, color: "#aaa", marginBottom: 14, letterSpacing: 1.5, fontWeight: 600 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, alignItems: "start" },
  toolbar: { display: "flex", gap: 10, marginBottom: "1rem", flexWrap: "wrap", background: "#fff", padding: "1rem 1.25rem", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12, color: "#666", fontWeight: 500 },
  input: { width: "100%", fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", outline: "none", fontFamily: "inherit" },
  select: { fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", outline: "none", fontFamily: "inherit", cursor: "pointer" },
  inputError: { border: "1px solid #e8572a" },
  errMsg: { color: "#e8572a", fontSize: 11 },
  btnOrange: { background: "#e8572a", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "10px 20px", fontFamily: "inherit" },
  btnSearch: { background: "#f0f0f0", border: "1px solid #ddd", borderRadius: 8, padding: "9px 12px", cursor: "pointer", fontSize: 16 },
  count: { fontSize: 13, color: "#999", marginBottom: "1rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 },
  card: { background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  posterWrap: { position: "relative", width: "100%", height: 280 },
  poster: { width: "100%", height: "100%", objectFit: "cover" },
  ratingBadge: { position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.75)", color: "#f5a623", padding: "4px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700 },
  watchedBadge: { position: "absolute", top: 10, left: 10, background: "rgba(39,174,96,0.9)", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  cardBody: { padding: "1rem" },
  cardName: { fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 4 },
  cardDir: { fontSize: 13, color: "#888", marginBottom: 4 },
  genreTag: { display: "inline-block", background: "#f0f0f0", color: "#555", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 500, marginBottom: 4 },
  watchBtn: { width: "100%", border: "1px solid #eee", borderRadius: 8, padding: "7px 0", fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginTop: 8, fontWeight: 500 },
  cardActions: { display: "flex", gap: 8, marginTop: 8 },
  btnEdit: { flex: 1, background: "#fff", border: "1px solid #ddd", color: "#555", padding: "7px 0", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  btnDel: { flex: 1, background: "#fff", border: "1px solid #ddd", color: "#555", padding: "7px 0", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  emptyBox: { textAlign: "center", padding: "5rem", background: "#fff", borderRadius: 14 },
  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#fff", borderRadius: 14, padding: "1.5rem", width: 400, maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: 17, fontWeight: 700, marginBottom: "1rem", color: "#111" },
  modalFields: { display: "flex", flexDirection: "column", gap: 12, marginBottom: "1rem" },
  modalBtns: { display: "flex", justifyContent: "flex-end", gap: 8 },
  btnGhost: { background: "#fff", border: "1px solid #eee", color: "#888", padding: "9px 16px", borderRadius: 8, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
};
