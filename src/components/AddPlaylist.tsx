import "./Modal.css";
import { useState } from 'react';
import { Icon } from '@iconify/react';

function AddPlaylist() {
  const ipcRenderer = (window as any).ipcRenderer;
  const [show, setShow] = useState(false);
  const [playlistName, setPlaylistName] = useState(""); // New state for the playlist name

  const handleClose = () => {
    setShow(false);
    setPlaylistName(""); // Clear the playlist name when closing the modal
  };

  const handleShow = () => setShow(true);

  const handleInputChange = (e: any) => {
    setPlaylistName(e.target.value); // Update the playlist name as the user types
  };

  const handleCreatePlaylist = () => {
    ipcRenderer.send("createAPlaylist", playlistName);
    handleClose();
    setTimeout(() => {
      location.reload();
    }, 1000);
  };

  return (
    <>
      <button className="AddPlaylistBut" onClick={handleShow}>
        <Icon icon="ic:baseline-plus" />
      </button>

      {show && (
        <div className="modal-overlay">
          <button className="modal-close" onClick={handleClose}>
            &times;
          </button>
          <div className="modal-content1" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modalHeadings">Create A Playlist</h3>
            </div>
            <div className="modal-body">
              <input
                className="modal-input-name"
                type="text"
                placeholder="Playlist Name..."
                value={playlistName} // Use the state value
                onChange={handleInputChange} // Update the state as the user types
              />
            </div>
            <div className="modal-footer">
              <button className="modal-button" onClick={handleClose}>
                Close
              </button>
              <button className="modal-button" onClick={handleCreatePlaylist}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AddPlaylist;
