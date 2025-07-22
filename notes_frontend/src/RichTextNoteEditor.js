import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

/**
 * PUBLIC_INTERFACE
 * RichTextNoteEditor: A controlled rich text editor for editing note content using react-quill.
 * 
 * Props:
 * - value: String (HTML) - the current note content.
 * - onChange: Function(newHtmlString) - called with new HTML content.
 * - className: Optional additional className(s) for Bootstrap integration.
 */
export default function RichTextNoteEditor({ value, onChange, className = "" }) {
  // Toolbar: basic formatting, lists, links (clean, lightweight, like paper notes)
  const toolbarOptions = [
    ["bold", "italic", "underline", "strike"],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    ["link"],
    ["clean"]
  ];

  // Quill theme: "snow", with color tweaked to blend with Bootstrap card
  return (
    <div className={"rich-text-editor " + className} style={{ minHeight: 164 }}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={{
          toolbar: toolbarOptions
        }}
        formats={[
          'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'indent', 'link'
        ]}
        className="border rounded border-2"
        style={{
          background: "#fcfdff",
          borderRadius: "0.58rem",
          fontSize: "1.07em",
          boxShadow: "0 0.5px 1.5px 0.5px #e9f0f9",
          transition: "box-shadow 0.18s",
        }}
      />
    </div>
  );
}
