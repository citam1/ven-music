import React, { useState } from 'react';
import { Icon } from '@iconify/react';

function DeleteSong1({ songName, currentPlaylist }: { songName: string, currentPlaylist: any }) {
  const ipcRenderer = (window as any).ipcRenderer;
  const [show, setShow] = useState(false);

  const handleClose = () => {
    setShow(false);
  };

  const handleShow = () => {
    setShow(true);
  };

  const PlaylistDelete = () => {
    ipcRenderer.send("deleteSong", JSON.stringify({ songName, CurrentPlaylist: currentPlaylist.name }));
    handleClose();
    setTimeout(() => {
      location.reload();
    }, 1000);
  };

  return (
    <>
      <button className="DeleteSongBut" onClick={handleShow}>
        <Icon icon="material-symbols:delete-outline" />
      </button>

      {show && (
        <div className="modal-overlay">
          <button className="modal-close" onClick={handleClose}>
            &times;
          </button>
          <div className="modal-content1" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modalHeadings">Delete A Song</h3>
            </div>
            <div className="modal-body">
              Are you sure you want to delete {songName}?
            </div>
            <div className="modal-footer">
              <button className="modal-button" onClick={handleClose}>
                Close
              </button>
              <button className="modal-button" onClick={PlaylistDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DeleteSong1;
