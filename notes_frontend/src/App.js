import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import AIEnhanceButton from "./AIEnhanceButton";
import RichTextNoteEditor from "./RichTextNoteEditor";

/**
 * Utility - generate a unique id
 */
// PUBLIC_INTERFACE
function generateId() {
  /** Generates a random unique string ID */
  return '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Hook for localStorage persisted state
 */
// PUBLIC_INTERFACE
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
 * Top Navigation Bar
 * Includes hamburger for sidebar toggle, search, and new note button.
 * On small screens, hamburger opens Offcanvas sidebar.
 */
function TopNav({ onNewNote, search, setSearch, sidebarOpen, setSidebarOpen }) {
  // hamburger button manages Offcanvas sidebar
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3 shadow-sm sticky-top" style={{ minHeight: 60, transition: 'box-shadow 0.25s' }}>
      {/* Hamburger toggle for sidebar */}
      <button
        className="navbar-toggler me-2"
        type="button"
        aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        aria-controls="notesSidebarOffcanvas"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((prev) => !prev)}
        style={{ outline: "none", boxShadow: "none" }}
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <a className="navbar-brand fw-bold d-flex align-items-center gap-2" style={{ fontSize: "1.45rem", letterSpacing: 1 }} href="#top">
        <i className="bi-journal-richtext me-1"></i>
        <span>Personal Notes</span>
      </a>
      <div className="collapse navbar-collapse justify-content-end show">
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
 * Responsive Sidebar component: wraps Bootstrap Offcanvas for mobile, persistent on desktop.
 * Offcanvas ref: https://getbootstrap.com/docs/5.3/components/offcanvas/
 */
function Sidebar({
  notes,
  selectedId,
  onSelect,
  onDelete,
  search,
  open,
  setOpen,
}) {
  const offcanvasRef = useRef(null);

  // Filter notes for search
  const filteredNotes = Array.isArray(notes)
    ? notes.filter(
        n =>
          n &&
          typeof n === "object" &&
          (
            (typeof n.title === "string" &&
              n.title.toLowerCase().includes((search || "").toLowerCase()))
            ||
            (typeof n.body === "string" &&
              n.body.replace(/<[^>]+>/g, '').toLowerCase().includes((search || "").toLowerCase()))
          )
      )
    : [];

  // Close sidebar on mobile when clicking outside (i.e., on overlay or close X)
  useEffect(() => {
    if (!open) return;
    // Trap focus when Offcanvas is open (accessibility)
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, setOpen]);

  // Sidebar content
  const sidebarList = (
    <div className="card shadow-sm border-0 h-100" style={{ background: "#f7fafd", borderRadius: "1rem", padding: 0 }}>
      <div className="card-body p-2 pt-3 pb-0">
        <ul className="list-group list-group-flush border-0 rounded-0">
          {filteredNotes.length === 0 && (
            <li className="list-group-item text-secondary fst-italic small border-0 bg-transparent">
              <i className="bi bi-emoji-frown me-1"></i>No notes found.
            </li>
          )}
          {filteredNotes.map(note => {
            if (!note || typeof note !== "object") return null;
            const safeTitle =
              typeof note.title === "string" && note.title.trim().length > 0
                ? note.title
                : <i className="text-muted">(Untitled)</i>;
            const hasValidId = typeof note.id === "string" && note.id.length > 0;
            return (
              <li
                key={hasValidId ? note.id : Math.random()}
                className={`list-group-item border-0 px-2 py-2 d-flex justify-content-between align-items-center text-nowrap shadow-sm mb-2 rounded ${hasValidId && note.id === selectedId ? "bg-primary bg-opacity-25 fw-bold" : "bg-white"} note-list-item`}
                tabIndex={0}
                onClick={() => {
                  if (hasValidId && onSelect) {
                    onSelect(note.id);
                    setOpen(false); // auto close on select (mobile UX)
                  }
                }}
                onKeyDown={e => (e.key === 'Enter' && hasValidId && onSelect ? onSelect(note.id) : undefined)}
                aria-label={`Select note ${typeof note.title === "string" ? note.title : ''}`}
                style={{
                  cursor: hasValidId ? "pointer" : "not-allowed",
                  userSelect: "none",
                  boxShadow: hasValidId && note.id === selectedId ? "0 2px 14px -5px #1976d280" : "0 1px 4px -2px #aaa3",
                  transition: "background 0.14s, box-shadow 0.15s"
                }}
              >
                <span className="text-truncate flex-grow-1 d-flex align-items-center" style={{ maxWidth: 170 }}>
                  <i className={`bi bi-file-earmark-text me-2 ${hasValidId && note.id === selectedId ? "text-primary" : "text-secondary"}`} />
                  {safeTitle}
                </span>
                <span
                  className="small text-secondary d-none d-lg-inline"
                  style={{
                    maxWidth: 96,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                  // Safely render a preview of note body; fallback to empty if not available
                  dangerouslySetInnerHTML={{
                    __html:
                      typeof note.body === "string"
                        ? note.body.replace(/<[^>]+>/g, '').slice(0, 32)
                        : ""
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
                    if (hasValidId && onDelete) {
                      onDelete(note.id);
                      setOpen(false);
                    }
                  }}
                >
                  <i className="bi bi-trash3"></i>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );

  // Show Offcanvas on mobile, always sidebar on desktop
  // Use Bootstrap breakpoint detection to toggle between offcanvas and inline sidebar
  return (
    <>
      {/* Offcanvas for mobile: show if small screens */}
      <div className={`offcanvas offcanvas-start${open ? " show" : ""}`}
           id="notesSidebarOffcanvas"
           tabIndex={-1}
           ref={offcanvasRef}
           aria-labelledby="notesSidebarLabel"
           style={{
              width: 270,
              zIndex: 2002,
              minHeight: "calc(100vh - 0px)", // full height
              display: 'block', // always render, only show on mobile with .show
              background: "#f7fafd",
              borderRight: "1px solid #e0e0e0",
           }}
      >
        <div className="offcanvas-header px-3 pt-3 pb-0 border-bottom" style={{background: "#eef3fa"}}>
          <h5 className="offcanvas-title fw-bold" id="notesSidebarLabel">
            <i className="bi bi-journal-alt me-2"></i>Notes
          </h5>
          <button
            type="button"
            className="btn-close text-reset"
            aria-label="Close"
            onClick={() => setOpen(false)}
            tabIndex={0}
          ></button>
        </div>
        <div className="offcanvas-body py-3" style={{padding: 0, height: "calc(100vh - 64px)", overflowY: "auto"}}>
          {sidebarList}
        </div>
      </div>
      {/* Desktop: visible sidebar, hidden on mobile */}
      <aside
        className="d-none d-lg-block bg-light px-0 py-3 border-end position-relative"
        style={{ minWidth: 220, maxWidth: 320, width: 240, flexShrink: 0, height: "calc(100vh - 60px)", overflowY: "auto", zIndex: 10 }}
        aria-label="Sidebar with list of notes"
      >
        {sidebarList}
      </aside>
      {/* Backdrop for mobile Offcanvas */}
      {open && (
        <div
          className="offcanvas-backdrop fade show"
          style={{zIndex: 2001}}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        ></div>
      )}
    </>
  );
}

/**
 * Note Editor (view/edit/create)
 * Refactored: Bootstrap Card, icons, transitions, utility spacing
 */
function NoteEditor({ note, onChange, onSave, onDelete, isNew, isDirty, onCancel }) {
  const [aiWorking, setAiWorking] = useState(false);

  // Robust fallback: protect against any null/undefined or malformed objects for note prop
  if (!note || typeof note !== "object" || (!note.title && !note.body && !note.id)) {
    return (
      <main className="d-flex align-items-center justify-content-center flex-grow-1 vh-100 bg-white">
        <div className="text-secondary fs-5">
          <i className="bi bi-arrow-left-circle me-2"></i>No note selected.
        </div>
      </main>
    );
  }

  // Provide default values for undefined fields to prevent null errors.
  const safeTitle =
    typeof note.title === "string"
      ? note.title
      : "";

  const safeBody =
    typeof note.body === "string"
      ? note.body
      : "";

  // Defensive: For any field-changing update, ensure note object is not null.
  const handleAIEnhance = (aiContent) => {
    if (onChange) onChange("body", aiContent);
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
            if (onSave) onSave();
          }}
        >
          <div className="mb-3">
            <input
              className="form-control form-control-lg fw-semibold border-2"
              type="text"
              placeholder="Title"
              value={safeTitle}
              maxLength={100}
              onChange={e => onChange && onChange('title', e.target.value)}
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
              noteTitle={safeTitle}
              noteBody={safeBody}
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
              value={safeBody}
              onChange={val => onChange && onChange("body", val)}
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
              disabled={!isDirty || !safeTitle.trim()}
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
  // Selected/current note id (for editing/viewing existing)
  const [selectedId, setSelectedId] = useState(null);
  // Editor state (for create/edit) — strictly separate from selectedId, used for both new/edit modes!
  const [editorNote, setEditorNote] = useState(null);
  // Track if editor has unsaved changes
  const [editorDirty, setEditorDirty] = useState(false);
  // For search
  const [search, setSearch] = useState('');
  // Sidebar open state for mobile (Offcanvas)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // On mount: select most recent note
  useEffect(() => {
    if (Array.isArray(notes) && !selectedId && notes.length > 0) {
      setSelectedId(notes[0].id);
    }
  }, [selectedId, notes.length, notes]);

  // When selectedId changes (i.e., editing existing note), set editor state for that note; reset dirty state
  useEffect(() => {
    if (selectedId) {
      const note = notes.find(n => n.id === selectedId);
      setEditorNote(note ? { ...note } : null);
      setEditorDirty(false);
    } else {
      // No selection: editorNote left as is (could be "new note" mode or truly blank/none selected)
      // Do NOT reset editorNote: this allows "new note" mode to work
    }
  }, [selectedId, notes]);

  // PUBLIC_INTERFACE
  // Always use a guaranteed blank, unique note object for "New Note"
  const handleNewNote = useCallback(() => {
    const newId = generateId();
    const blankNote = {
      id: newId,
      title: '',
      body: '',
      created: Date.now(),
      updated: Date.now()
    };
    setEditorNote({ ...blankNote });
    setEditorDirty(true);
    setSelectedId(null); // "new note" mode disables any sidebar selection
    setSidebarOpen(false);
  }, []);

  // Changes to current editor note's fields (title/body); marks as dirty on actual change
  // PUBLIC_INTERFACE
  const handleEditorChange = (field, value) => {
    setEditorNote(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      if (
        (field === 'title' && prev.title !== value) ||
        (field === 'body' && prev.body !== value)
      ) {
        setEditorDirty(true);
      }
      return updated;
    });
  };

  // Save handler - adds new or updates note as appropriate
  // Crucially, when in "new note" mode, always INSERT (never overwrite); never match by id accidentally.
  // PUBLIC_INTERFACE
  const handleSaveNote = useCallback(() => {
    if (!editorNote || !editorNote.title || !editorNote.title.trim()) return;

    // Mode: New note (id not present in existing notes)
    const isTrulyNew =
      editorNote &&
      typeof editorNote.id === "string" &&
      !notes.some(n => n.id === editorNote.id);

    if (isTrulyNew) {
      // Insert new note
      const toInsert = {
        ...editorNote,
        id: editorNote.id || generateId(),
        created: Date.now(),
        updated: Date.now()
      };
      setNotes(prevNotes =>
        [
          toInsert,
          ...prevNotes
        ].sort((a, b) => b.updated - a.updated)
      );
      setSelectedId(toInsert.id);
      setEditorNote({ ...toInsert });
    } else {
      // Edit/Update existing
      const toUpdate = {
        ...editorNote,
        updated: Date.now()
      };
      setNotes(prevNotes =>
        prevNotes
          .map(n => n.id === toUpdate.id ? toUpdate : n)
          .sort((a, b) => b.updated - a.updated)
      );
      setSelectedId(toUpdate.id);
      setEditorNote({ ...toUpdate });
    }
    setEditorDirty(false);
    setSidebarOpen(false);
  }, [editorNote, setNotes, notes]);

  // Delete note by id (or whatever is in editorNote)
  // PUBLIC_INTERFACE
  const handleDeleteNote = useCallback(
    (id) => {
      const deleteId = id || editorNote?.id;
      if (!deleteId) return;
      setNotes(notes => notes.filter(n => n.id !== deleteId));
      // If deleting selected/active note, select the next most recent, else deselect
      if (selectedId === deleteId) {
        const remaining = notes.filter(n => n.id !== deleteId);
        setSelectedId(remaining.length ? remaining[0].id : null);
        setEditorNote(remaining.length ? { ...remaining[0] } : null);
      }
      setSidebarOpen(false);
    },
    [selectedId, editorNote, setNotes, notes]
  );

  // PUBLIC_INTERFACE
  // Cancel a new note creation (restore to previous selection or blank)
  const handleCancelNew = () => {
    setEditorNote(null);
    setEditorDirty(false);
    if (Array.isArray(notes) && notes.length > 0) {
      setSelectedId(notes[0].id);
    } else {
      setSelectedId(null);
    }
    setSidebarOpen(false);
  };

  // Robust "new" mode detection
  // - editorNote exists (not null)
  // - editorNote.id not found among notes
  // - selectedId is NOT set (so sidebar is not highlighting)
  const isNewNote = Boolean(
    editorNote &&
    typeof editorNote.id === "string" &&
    !notes.some(n => n && typeof n === "object" && n.id === editorNote.id) &&
    !selectedId
  );

  return (
    <div className="d-flex flex-column vh-100" style={{ background: "#f8fafc" }}>
      <TopNav
        onNewNote={handleNewNote}
        search={search}
        setSearch={setSearch}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="d-flex flex-row flex-grow-1" style={{ minHeight: 0 }}>
        <Sidebar
          notes={Array.isArray(notes) ? notes : []}
          selectedId={
            // Don't highlight anything if we are in "new note" mode
            isNewNote
              ? null
              : (editorNote && typeof editorNote.id === "string" ? editorNote.id : (typeof selectedId === "string" ? selectedId : null))
          }
          onSelect={id => {
            if (typeof id === "string") {
              setSelectedId(id);
              setEditorNote(null);
              setEditorDirty(false);
              setSidebarOpen(false);
            }
          }}
          onDelete={id => {
            if (typeof id === "string") {
              handleDeleteNote(id);
              setSidebarOpen(false);
            }
          }}
          search={search}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />
        <NoteEditor
          note={
            isNewNote
              ? editorNote
              : (typeof selectedId === "string" && Array.isArray(notes)
                  ? (notes.find(n => n && typeof n === "object" && n.id === selectedId) || null)
                  : null
                )
          }
          onChange={handleEditorChange}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
          isNew={isNewNote}
          isDirty={editorDirty}
          onCancel={handleCancelNew}
        />
      </div>
    </div>
  );
}

export default App;
