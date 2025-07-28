import React, { useState, useEffect } from "react";
import "./App.css";

// PUBLIC_INTERFACE
/**
 * Main NotesApp component. Handles all state logic, API fetches,
 * sidebar layout, and CRUD operations for notes.
 */
function App() {
  // Theme toggling (preserve previous example, set to light by default)
  const [theme, setTheme] = useState("light");
  // Notes state management
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // For create/edit forms
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // Read API endpoint from environment variable
  const API_BASE =
    process.env.REACT_APP_NOTES_API_URL ||
    "http://localhost:5000"; // fallback for dev

  // Load all notes on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  /**
   * Fetches all notes from the backend.
   */
  async function fetchNotes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/notes`);
      if (!res.ok) throw new Error("Failed to load notes.");
      const data = await res.json();
      setNotes(data);
      // If nothing selected, select the first note by default
      if (!selectedNoteId && data.length > 0) {
        setSelectedNoteId(data[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Fetches a single note by ID from the backend.
   * @param {string|number} id - The note id
   */
  async function fetchNote(id) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/notes/${id}`);
      if (!res.ok) throw new Error("Note not found.");
      const data = await res.json();
      setNewTitle(data.title);
      setNewContent(data.content);
      setSelectedNoteId(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handler for selecting a note from the sidebar
  function handleSelectNote(id) {
    setSelectedNoteId(id);
    setIsEditing(false);
    setNewTitle("");
    setNewContent("");
    setError("");
  }

  // Handler for starting a new note
  function handleNewNoteClick() {
    setIsEditing(true);
    setSelectedNoteId(null);
    setNewTitle("");
    setNewContent("");
    setError("");
  }

  // Handler for editing a note
  function handleEditNote() {
    if (!selectedNoteId) return;
    const note = notes.find((n) => n.id === selectedNoteId);
    if (note) {
      setIsEditing(true);
      setNewTitle(note.title);
      setNewContent(note.content);
    }
  }

  // Handler for deleting a note
  async function handleDeleteNote() {
    if (!selectedNoteId) return;
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/notes/${selectedNoteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete note.");
      setNotes((prev) => prev.filter((n) => n.id !== selectedNoteId));
      setSelectedNoteId((prev) => {
        // Select first note or none
        const remain = notes.filter((n) => n.id !== prev);
        return remain.length > 0 ? remain[0].id : null;
      });
      setIsEditing(false);
      setNewTitle("");
      setNewContent("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handler for saving new or edited note
  async function handleSaveNote(event) {
    event.preventDefault();
    if (!newTitle.trim()) {
      setError("Title cannot be empty.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let response, note;
      if (selectedNoteId && isEditing) {
        // Edit note
        response = await fetch(`${API_BASE}/notes/${selectedNoteId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: newTitle, content: newContent }),
        });
        if (!response.ok) throw new Error("Failed to update note.");
        note = await response.json();
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? note : n))
        );
        setSelectedNoteId(note.id);
      } else {
        // Create note
        response = await fetch(`${API_BASE}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: newTitle, content: newContent }),
        });
        if (!response.ok) throw new Error("Failed to create note.");
        note = await response.json();
        setNotes((prev) => [note, ...prev]);
        setSelectedNoteId(note.id);
      }
      setIsEditing(false);
      setNewTitle("");
      setNewContent("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Toggles the application theme between 'light' and 'dark'.
   */
  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === "light" ? "dark" : "light"
    );
  };

  // Sidebar: List of notes / new note button
  function Sidebar() {
    return (
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1>Simple Notes</h1>
        </div>
        <button className="btn accent" onClick={handleNewNoteClick}>
          + New Note
        </button>
        <ul className="note-list">
          {notes.length === 0 && <li className="empty-list">No notes</li>}
          {notes.map((note) => (
            <li
              key={note.id}
              className={note.id === selectedNoteId ? "selected" : ""}
              onClick={() => handleSelectNote(note.id)}
            >
              <div className="note-title">{note.title || <em>(Untitled)</em>}</div>
              <div className="note-snippet">
                {(note.content || "").slice(0, 30)}
                {note.content && note.content.length > 30 && "..."}
              </div>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  // Main panel: View/edit/create selected note or message
  function MainPanel() {
    if (loading) {
      return <div className="panel"><div className="loading">Loading...</div></div>;
    }
    if (error) {
      return (
        <div className="panel">
          <div className="error">{error}</div>
        </div>
      );
    }
    if (isEditing) {
      return (
        <div className="panel">
          <form className="note-form" onSubmit={handleSaveNote}>
            <input
              className="input title"
              type="text"
              placeholder="Note Title"
              value={newTitle}
              maxLength={120}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              spellCheck
            />
            <textarea
              className="input content"
              placeholder="Note Content"
              rows={10}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              spellCheck
            />
            <div className="actions-row">
              <button type="submit" className="btn primary">
                {selectedNoteId ? "Save Changes" : "Create Note"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setIsEditing(false);
                  setNewTitle("");
                  setNewContent("");
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      );
    }
    // View selected note
    const selectedNote = notes.find((n) => n.id === selectedNoteId);
    if (!selectedNote) {
      return (
        <div className="panel">
          <div className="empty-state">
            <h2>Welcome!</h2>
            <p>Select a note on the left or create a new note.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="panel">
        <div className="note-view">
          <h2 className="note-view-title">{selectedNote.title}</h2>
          <pre className="note-content">{selectedNote.content || <span className="placeholder">(No content)</span>}</pre>
          <div className="actions-row">
            <button
              className="btn primary"
              onClick={handleEditNote}
            >
              Edit
            </button>
            <button
              className="btn danger"
              onClick={handleDeleteNote}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App notes-app-root">
      <header className="header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${
            theme === "light" ? "dark" : "light"
          } mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>
      <div className="layout">
        <Sidebar />
        <MainPanel />
      </div>
      <footer className="footer">
        <span>
          Simple Notes App &copy; {new Date().getFullYear()} &mdash; Minimal, fast, and yours.
        </span>
      </footer>
    </div>
  );
}

export default App;
