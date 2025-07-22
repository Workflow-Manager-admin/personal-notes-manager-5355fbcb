import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import AIEnhanceButton from "./AIEnhanceButton";

// Theme colors
const COLORS = {
  primary: '#1976D2',
  accent: '#FFC107',
  secondary: '#424242',
  bg: '#FAFAFA',
  light: '#FFFFFF',
  border: '#E0E0E0',
  sidebar: '#F5F6FA',
  hover: '#E3F0FE',
};

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
 * Top Navigation Bar
 */
function TopNav({ onNewNote, search, setSearch }) {
  return (
    <header className="topnav">
      <h1 className="app-title">📝 Personal Notes</h1>
      <div className="search-wrapper">
        <input
          className="search"
          type="text"
          placeholder="Search notes…"
          value={search}
          aria-label="Search notes"
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="new-btn" onClick={onNewNote}>+ New Note</button>
      </div>
    </header>
  );
}

/**
 * Sidebar for all notes list
 */
function Sidebar({ notes, selectedId, onSelect, onDelete, search }) {
  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <nav className="sidebar">
      <ul>
        {filteredNotes.length === 0 && (
          <li className="note-list-empty">No notes found.</li>
        )}
        {filteredNotes.map(note => (
          <li
            key={note.id}
            className={`note-list-item${note.id === selectedId ? ' selected' : ''}`}
            tabIndex={0}
            onClick={() => onSelect(note.id)}
            onKeyDown={e => (e.key === 'Enter' ? onSelect(note.id) : undefined)}
            aria-label={`Select note ${note.title}`}
          >
            <span className="note-title">{note.title || <i>(Untitled)</i>}</span>
            <button
              className="delete-btn"
              title="Delete note"
              tabIndex={-1}
              onClick={e => {
                e.stopPropagation();
                onDelete(note.id);
              }}
            >🗑</button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Note Editor (view/edit/create)
 * Enhanced to support AI-powered note drafting/completion.
 */

function NoteEditor({ note, onChange, onSave, onDelete, isNew, isDirty, onCancel }) {
  const [aiWorking, setAiWorking] = useState(false);

  if (!note) {
    return (
      <main className="main-content main-content-empty">
        <div style={{ color: COLORS.secondary, fontSize: 18 }}>No note selected.</div>
      </main>
    );
  }

  const handleAIEnhance = (aiContent) => {
    // Overwrite or merge AI content into current body
    onChange("body", aiContent);
    setAiWorking(false);
  };

  return (
    <main className="main-content">
      <form
        className="note-form"
        onSubmit={e => {
          e.preventDefault();
          onSave();
        }}
      >
        <input
          className="note-title-field"
          type="text"
          placeholder="Title"
          value={note.title}
          maxLength={100}
          onChange={e => onChange('title', e.target.value)}
          autoFocus
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 0 }}>
          <AIEnhanceButton
            noteTitle={note.title}
            noteBody={note.body}
            onEnhance={handleAIEnhance}
            disabled={aiWorking}
          />
        </div>
        <textarea
          className="note-body-field"
          placeholder="Write your note here…"
          value={note.body}
          rows={12}
          onChange={e => onChange('body', e.target.value)}
        />
        <div className="note-actions">
          {isNew ? (
            <button
              type="button"
              className="secondary-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              className="delete-btn"
              title="Delete note"
              onClick={onDelete}
            >
              Delete
            </button>
          )}
          <button
            type="submit"
            className="primary-btn"
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

// PUBLIC_INTERFACE
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

  // Theming: inject CSS vars for color scheme
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', COLORS.primary);
    root.style.setProperty('--accent-color', COLORS.accent);
    root.style.setProperty('--secondary-color', COLORS.secondary);
    root.style.setProperty('--sidebar-bg', COLORS.sidebar);
    root.style.setProperty('--main-bg', COLORS.bg);
    root.style.setProperty('--note-border', COLORS.border);
  }, []);

  return (
    <div className="notes-app">
      <TopNav onNewNote={handleNewNote} search={search} setSearch={setSearch} />
      <div className="layout-row">
        <Sidebar
          notes={notes}
          selectedId={editorNote ? editorNote.id : selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setEditorNote(null);
          }}
          onDelete={handleDeleteNote}
          search={search}
        />
        <NoteEditor
          note={editorNote || (selectedId && notes.find(n => n.id === selectedId))}
          onChange={handleEditorChange}
          onSave={handleSaveNote}
          onDelete={() => handleDeleteNote()}
          isNew={isNewNote}
          isDirty={editorDirty}
          onCancel={handleCancelNew}
        />
      </div>
    </div>
  );
}

export default App;
