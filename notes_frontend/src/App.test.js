import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import App from './App';

// PUBLIC_INTERFACE
// Test: "New Note" always creates a unique, blank note, and does not overwrite any previous note
describe('New Note feature', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('Clicking "New Note" resets editor, creates unique id, and leaves previous notes untouched', async () => {
    render(<App />);

    // Create first note
    fireEvent.click(screen.getByRole("button", { name: /new note/i }));
    const titleInput = screen.getByPlaceholderText(/title/i);
    // Type title and body
    fireEvent.change(titleInput, { target: { value: "First note" } });
    fireEvent.blur(titleInput);

    // Save
    const saveButton = screen.getByRole("button", { name: /create/i });
    fireEvent.click(saveButton);

    // Confirm note appears in sidebar
    expect(screen.queryByText(/first note/i)).toBeInTheDocument();

    // Click "New Note" again
    fireEvent.click(screen.getByRole("button", { name: /new note/i }));

    // Editor is blank (fresh)
    expect(screen.getByPlaceholderText(/title/i).value).toBe("");

    // Write something for second note
    fireEvent.change(screen.getByPlaceholderText(/title/i), { target: { value: "Second note" } });
    fireEvent.blur(screen.getByPlaceholderText(/title/i));
    const saveButton2 = screen.getByRole("button", { name: /create/i });
    fireEvent.click(saveButton2);

    // Both notes appear in sidebar (not overwritten)
    expect(screen.queryByText(/first note/i)).toBeInTheDocument();
    expect(screen.queryByText(/second note/i)).toBeInTheDocument();

    // Now select the first note: editor shows its original title
    fireEvent.click(screen.getAllByRole("listitem")[0]);
    expect(screen.getByDisplayValue(/first note/i)).toBeInTheDocument();

    // Select the second note: editor shows new title
    fireEvent.click(screen.getAllByRole("listitem")[1]);
    expect(screen.getByDisplayValue(/second note/i)).toBeInTheDocument();
  });

  test('Each "New Note" gets a unique id (no accidental overwrite)', () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /new note/i }));
    fireEvent.change(screen.getByPlaceholderText(/title/i), { target: { value: "A" } });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    fireEvent.click(screen.getByRole("button", { name: /new note/i }));
    fireEvent.change(screen.getByPlaceholderText(/title/i), { target: { value: "B" } });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    // Get all notes in order (most recent first)
    const notes = JSON.parse(window.localStorage.getItem('notes-app-data'));
    expect(notes.length).toBeGreaterThanOrEqual(2);
    // Assert unique IDs
    const ids = notes.map(n => n.id);
    const uniqueIds = Array.from(new Set(ids));
    expect(uniqueIds.length).toBeGreaterThanOrEqual(2);
  });

  test('Editor state is properly reset between new/edit', () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /new note/i }));
    fireEvent.change(screen.getByPlaceholderText(/title/i), { target: { value: "First" } });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    // Select the note to edit it
    fireEvent.click(screen.getAllByRole("listitem")[0]);
    expect(screen.getByDisplayValue(/First/i)).toBeInTheDocument();

    // Click "New Note", make sure it's fresh
    fireEvent.click(screen.getByRole("button", { name: /new note/i }));
    expect(screen.getByPlaceholderText(/title/i).value).toBe("");

    // Cancel new note, should return to last selected note
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByDisplayValue(/First/i)).toBeInTheDocument();
  });
});
