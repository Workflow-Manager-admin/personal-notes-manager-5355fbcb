import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import AIEnhanceButton from "./AIEnhanceButton";
import RichTextNoteEditor from "./RichTextNoteEditor";

/**
 * Utility - generate a unique id
 */
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

/**
 * Top Navigation Bar (Bootstrap Navbar with collapsible support)
 * Modernized: collapse/expand, icon in brand, gap utility
 */
function TopNav({ onNewNote, search, setSearch, navOpen, setNavOpen }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3 shadow-sm sticky-top" style={{ minHeight: 60, transition: 'box-shadow 0.25s' }}>
      {/* Hamburger toggle */}
      <button
        className="navbar-toggler me-2"
        type="button"
        aria-label={navOpen ? "Collapse navigation menu" : "Expand navigation menu"}
        aria-expanded={navOpen}
        onClick={() => setNavOpen(prev => !prev)}
        style={{ outline: "none", boxShadow: "none" }}
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <a className="navbar-brand fw-bold d-flex align-items-center gap-2" style={{ fontSize: "1.45rem", letterSpacing: 1 }} href="#top">
        <i className="bi-journal-richtext me-1"></i>
        <span>Personal Notes</span>
      </a>
      <div className={`collapse navbar-collapse justify-content-end${navOpen ? " show" : ""}`}>
        <form className="d-flex align-items-center gap-2 w-100 justify-content-end" role="search" style={{ maxWidth: 400 }}>
          <input
            className="form-control me-2"
            type="search"
            placeholder="Search notes…"
            aria-label="Search notes"
            value={search}
            style={{ width: 180, fontSize: "1rem", transition: "box-shadow 0.2s" }}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-warning fw-bold text-dark d-flex align-items-center gap-1" type="button" onClick={onNewNote}>
            <i className="bi-plus-lg"></i> <span className="d-none d-sm-inline">New Note</span>
          </button>
        </form>
      </div>
    </nav>
  );
}

/**
 * Sidebar for all notes (Bootstrap List Group and Cards)
 * Modern: Card, subtle hover, icon for delete, borderless, smooth highlight
 */
function Sidebar({ notes, selectedId, onSelect, onDelete, search }) {
  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    // Strip HTML to do a plain-text search of the body
    (n.body || "").replace(/<[^>]+>/g, '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="bg-light px-0 py-3 border-end position-relative" style={{ minWidth: 220, maxWidth: 320, width: 240, flexShrink: 0, height: "calc(100vh - 60px)", overflowY: "auto", zIndex: 10 }}>
      <div className="card shadow-sm border-0 h-100" style={{ background: "#f7fafd", borderRadius: "1rem", padding: 0 }}>
        <div className="card-body p-2 pt-3 pb-0">
          <ul className="list-group list-group-flush border-0 rounded-0">
            {filteredNotes.length === 0 && (
              <li className="list-group-item text-secondary fst-italic small border-0 bg-transparent">
                <i className="bi bi-emoji-frown me-1"></i>No notes found.
              </li>
            )}
            {filteredNotes.map(note => (
              <li
                key={note.id}
                className={`list-group-item border-0 px-2 py-2 d-flex justify-content-between align-items-center text-nowrap shadow-sm mb-2 rounded ${note.id === selectedId ? "bg-primary bg-opacity-25 fw-bold" : "bg-white"} note-list-item`}
                tabIndex={0}
                onClick={() => onSelect(note.id)}
                onKeyDown={e => (e.key === 'Enter' ? onSelect(note.id) : undefined)}
                aria-label={`Select note ${note.title}`}
                style={{
                  cursor: "pointer",
                  userSelect: "none",
                  boxShadow: note.id === selectedId ? "0 2px 14px -5px #1976d280" : "0 1px 4px -2px #aaa3",
                  transition: "background 0.14s, box-shadow 0.15s"
                }}
              >
                <span className="text-truncate flex-grow-1 d-flex align-items-center" style={{maxWidth: 170}}>
                  <i className={`bi bi-file-earmark-text me-2 ${note.id === selectedId ? "text-primary" : "text-secondary"}`} />
                  {note.title || <i className="text-muted">(Untitled)</i>}
                </span>
                <span
                  className="small text-secondary d-none d-lg-inline"
                  style={{
                    maxWidth: 96,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                  dangerouslySetInnerHTML={{
                    __html: (note.body || '').replace(/<[^>]+>/g, '').slice(0, 32)
                  }}
                />
                <button
                  className="btn btn-link text-danger px-2 py-0 border-0"
                  title="Delete note"
                  tabIndex={-1}
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.18em",
                    opacity: 0.81,
                    transition: "opacity 0.14s"
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(note.id);
                  }}
                >
                  <i className="bi bi-trash3"></i>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

/**
 * Note Editor (view/edit/create)
 * Refactored: Bootstrap Card, icons, transitions, utility spacing
 */
function NoteEditor({ note, onChange, onSave, onDelete, isNew, isDirty, onCancel }) {
  const [aiWorking, setAiWorking] = useState(false);

  if (!note) {
    return (
      <main className="d-flex align-items-center justify-content-center flex-grow-1 vh-100 bg-white">
        <div className="text-secondary fs-5">
          <i className="bi bi-arrow-left-circle me-2"></i>No note selected.
        </div>
      </main>
    );
  }

  const handleAIEnhance = (aiContent) => {
    onChange("body", aiContent);
    setAiWorking(false);
  };

  return (
    <main className="flex-grow-1 d-flex align-items-start justify-content-center px-2 py-4 bg-white">
      <div
        className="card shadow-lg rounded-4 animate__animated animate__fadeInDown w-100"
        style={{ maxWidth: 700, minWidth: 240, border: "1.3px solid #eaf1fd", background: "#fafdff", transition: "box-shadow 0.14s, border-color 0.16s" }}
      >
        <form
          className="card-body p-4"
          onSubmit={e => {
            e.preventDefault();
            onSave();
          }}
        >
          <div className="mb-3">
            <input
              className="form-control form-control-lg fw-semibold border-2"
              type="text"
              placeholder="Title"
              value={note.title}
              maxLength={100}
              onChange={e => onChange('title', e.target.value)}
              style={{
                boxShadow: "0 1px 3px -2px #1976d230",
                background: "#fcfdff",
                borderRadius: "0.7rem",
                transition: "border-color 0.17s"
              }}
              autoFocus
            />
          </div>
          <div className="d-flex align-items-center gap-2 mb-3">
            <AIEnhanceButton
              noteTitle={note.title}
              noteBody={note.body}
              onEnhance={handleAIEnhance}
              disabled={aiWorking}
            />
            {/* Context: info icon */}
            <span className="text-secondary small d-md-inline d-none" title="Write or paste your note. Use the magic wand for AI help.">
              <i className="bi bi-info-circle me-1"></i>
              Enhance your note with AI!
            </span>
          </div>
          <div className="mb-3">
            <RichTextNoteEditor
              value={note.body}
              onChange={val => onChange("body", val)}
              className="bg-white"
            />
          </div>
          <div className="d-flex align-items-center gap-2 justify-content-end pt-2 mt-2 flex-wrap">
            {isNew ? (
              <button
                type="button"
                className="btn btn-secondary d-flex align-items-center gap-1"
                onClick={onCancel}
              >
                <i className="bi bi-x-lg"></i>
                <span>Cancel</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-danger d-flex align-items-center gap-1"
                title="Delete note"
                onClick={onDelete}
              >
                <i className="bi bi-trash3"></i>
                <span>Delete</span>
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary fw-bold d-flex align-items-center gap-1"
              disabled={!isDirty || !note.title.trim()}
              title="Save note"
              style={{ boxShadow: "0 3.5px 13px -7px #1976d235" }}
            >
              <i className="bi bi-save"></i>
              {isNew ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
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
