import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import AIEnhanceButton from "./AIEnhanceButton";

// Utility - generate a unique id
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

/**
 * Hook for localStorage persisted state
 */
function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

// ============ COMPONENTS ============ //

/**
 * Top Navigation Bar (Bootstrap Navbar with collapsible support)
 */
function TopNav({ onNewNote, search, setSearch, navOpen, setNavOpen }) {
  // Responsive toggle for Bootstrap navbar
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3" style={{minHeight: 60}}>
      {/* Hamburger toggle */}
      <button
        className="navbar-toggler me-2"
        type="button"
        aria-label={navOpen ? "Collapse navigation menu" : "Expand navigation menu"}
        aria-expanded={navOpen}
        onClick={() => setNavOpen(prev => !prev)}
        style={{outline: "none", boxShadow: "none"}}
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <a className="navbar-brand fw-bold" style={{fontSize: "1.45rem", letterSpacing: 1}} href="#top">
        📝 Personal Notes
      </a>
      <div className={`collapse navbar-collapse justify-content-end${navOpen ? " show" : ""}`}>
        <form className="d-flex align-items-center gap-2" role="search" style={{maxWidth: 400}}>
          <input
            className="form-control me-2"
            type="search"
            placeholder="Search notes…"
            aria-label="Search notes"
            value={search}
            style={{width: 180, fontSize: "1rem"}}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-warning fw-bold text-dark" type="button" onClick={onNewNote}>+ New Note</button>
        </form>
      </div>
    </nav>
  );
}

/**
 * Sidebar for all notes list (Bootstrap List Group)
 */
function Sidebar({ notes, selectedId, onSelect, onDelete, search }) {
  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="border-end bg-light px-0 py-3" style={{minWidth: 200, maxWidth: 300, width: 240, flexShrink: 0, height: "calc(100vh - 60px)"}}>
      <ul className="list-group border-0 rounded-0">
        {filteredNotes.length === 0 && (
          <li className="list-group-item text-secondary fst-italic small border-0 bg-light">
            No notes found.
          </li>
        )}
        {filteredNotes.map(note => (
          <li
            key={note.id}
            className={`list-group-item d-flex justify-content-between align-items-center text-nowrap${note.id === selectedId ? " active" : ""}`}
            tabIndex={0}
            onClick={() => onSelect(note.id)}
            onKeyDown={e => (e.key === 'Enter' ? onSelect(note.id) : undefined)}
            aria-label={`Select note ${note.title}`}
            style={{cursor: "pointer", userSelect: "none"}}
          >
            <span className="text-truncate flex-grow-1">{note.title || <i>(Untitled)</i>}</span>
            <button
              className="btn btn-link text-danger px-2 py-0 border-0"
              title="Delete note"
              tabIndex={-1}
              style={{fontWeight: "bold", fontSize: "1.16em"}}
              onClick={e => {
                e.stopPropagation();
                onDelete(note.id);
              }}
            >🗑</button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/**
 * Note Editor (view/edit/create)
 * Form styled with Bootstrap
 */
function NoteEditor({ note, onChange, onSave, onDelete, isNew, isDirty, onCancel }) {
  const [aiWorking, setAiWorking] = useState(false);

  if (!note) {
    return (
      <main className="d-flex align-items-center justify-content-center flex-grow-1 vh-100">
        <div className="text-secondary fs-5">No note selected.</div>
      </main>
    );
  }

  const handleAIEnhance = (aiContent) => {
    // Overwrite or merge AI content into current body
    onChange("body", aiContent);
    setAiWorking(false);
  };

  return (
    <main className="flex-grow-1 d-flex align-items-start justify-content-center px-2 py-4 bg-white">
      <form
        className="bg-light rounded shadow-sm p-4 mb-5 mt-2 w-100"
        style={{maxWidth: 660, minWidth: 240}}
        onSubmit={e => {
          e.preventDefault();
          onSave();
        }}
      >
        <div className="mb-3">
          <input
            className="form-control form-control-lg fw-bold"
            type="text"
            placeholder="Title"
            value={note.title}
            maxLength={100}
            onChange={e => onChange('title', e.target.value)}
            autoFocus
          />
        </div>
        <div className="d-flex align-items-center gap-2 mb-2">
          <AIEnhanceButton
            noteTitle={note.title}
            noteBody={note.body}
            onEnhance={handleAIEnhance}
            disabled={aiWorking}
          />
        </div>
        <div className="mb-3">
          <textarea
            className="form-control"
            placeholder="Write your note here…"
            value={note.body}
            rows={10}
            onChange={e => onChange('body', e.target.value)}
            style={{resize: "vertical"}}
          />
        </div>
        <div className="d-flex align-items-center gap-2 justify-content-end">
          {isNew ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-danger"
              title="Delete note"
              onClick={onDelete}
            >
              Delete
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary fw-bold"
            disabled={!isDirty || !note.title.trim()}
            title="Save note"
          >
            {isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </form>
    </main>
  );
}

// ============ MAIN APP ============ //

/**
 * PUBLIC_INTERFACE
 * App: Main entrypoint. Manages notes state and layout.
 */
function App() {
  // Notes are persisted in localStorage
  const [notes, setNotes] = useLocalStorageState('notes-app-data', []);
  // Selected/current note id
  const [selectedId, setSelectedId] = useState(null);
  // Editor state (for create/edit)
  const [editorNote, setEditorNote] = useState(null);
  const [editorDirty, setEditorDirty] = useState(false);
  // For search
  const [search, setSearch] = useState('');
  // Collapsible Navbar open state (true=shown)
  const [navOpen, setNavOpen] = useState(false);

  // When app mounts, select most recent note
  useEffect(() => {
    if (!selectedId && notes.length > 0) {
      setSelectedId(notes[0].id);
    }
  }, [selectedId, notes.length]);

  // When selectedId changes, reset editor
  useEffect(() => {
    if (selectedId) {
      const note = notes.find(n => n.id === selectedId);
      setEditorNote(note ? { ...note } : null);
      setEditorDirty(false);
    } else {
      setEditorNote(null);
      setEditorDirty(false);
    }
  }, [selectedId, notes]);

  // Handler: create a new note, enter edit mode
  const handleNewNote = useCallback(() => {
    setEditorNote({
      id: generateId(),
      title: '',
      body: '',
      created: Date.now(),
      updated: Date.now(),
    });
    setSelectedId(null);
    setEditorDirty(true);
  }, []);

  // Handler: update fields in editor
  const handleEditorChange = (field, value) => {
    setEditorNote(prev => {
      const updated = { ...prev, [field]: value };
      // Whenever user types, mark as dirty if changed
      if (
        (!prev.title && value && field === 'title') ||
        (!prev.body && value && field === 'body') ||
        (prev[field] !== value)
      ) {
        setEditorDirty(true);
      }
      return updated;
    });
  };

  // Handler: save note (create or update)
  const handleSaveNote = useCallback(() => {
    if (!editorNote.title.trim()) return;
    if (!editorNote.id) {
      // Defensive fallback
      editorNote.id = generateId();
    }
    if (notes.find(n => n.id === editorNote.id)) {
      setNotes(notes =>
        notes
          .map(n => (n.id === editorNote.id
            ? { ...editorNote, updated: Date.now() }
            : n))
          .sort((a, b) => b.updated - a.updated)
      );
      setSelectedId(editorNote.id);
    } else {
      // New note
      setNotes(notes =>
        [
          { ...editorNote, created: Date.now(), updated: Date.now() },
          ...notes,
        ].sort((a, b) => b.updated - a.updated)
      );
      setSelectedId(editorNote.id);
    }
    setEditorDirty(false);
  }, [editorNote, setNotes, notes]);

  // Handler: delete note
  const handleDeleteNote = useCallback(
    (id) => {
      const deleteId = id || editorNote?.id;
      if (!deleteId) return;
      setNotes(notes => notes.filter(n => n.id !== deleteId));
      if (selectedId === deleteId) {
        setSelectedId(notes.length > 1 ? notes.find(n => n.id !== deleteId)?.id : null);
        setEditorNote(null);
      }
    },
    [selectedId, editorNote, setNotes, notes]
  );

  // Handler: cancel create
  const handleCancelNew = () => {
    setEditorNote(null);
    setEditorDirty(false);
    if (notes.length) {
      setSelectedId(notes[0].id);
    }
  };

  // Quick lookup - is currently editing a new note (not in notes[])
  const isNewNote = editorNote && !notes.some(n => n.id === editorNote.id);

  return (
    <div className="d-flex flex-column vh-100" style={{background: "#f8fafc"}}>
      <TopNav
        onNewNote={handleNewNote}
        search={search}
        setSearch={setSearch}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
      />
      <div className="d-flex flex-row flex-grow-1" style={{minHeight: 0}}>
        <Sidebar
          notes={notes}
          selectedId={editorNote ? editorNote.id : selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setEditorNote(null);
            setNavOpen(false); // Auto-close nav for usability on mobile
          }}
          onDelete={(id) => {
            handleDeleteNote(id);
            setNavOpen(false);
          }}
          search={search}
        />
        <NoteEditor
          note={editorNote || (selectedId && notes.find(n => n.id === selectedId))}
          onChange={handleEditorChange}
          onSave={() => {
            handleSaveNote();
            setNavOpen(false);
          }}
          onDelete={() => {
            handleDeleteNote();
            setNavOpen(false);
          }}
          isNew={isNewNote}
          isDirty={editorDirty}
          onCancel={() => {
            handleCancelNew();
            setNavOpen(false);
          }}
        />
      </div>
    </div>
  );
}

export default App;
