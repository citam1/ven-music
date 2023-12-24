import React, { useState } from 'react';
import { Icon } from '@iconify/react';



function AddSong({currentPlaylist}: {currentPlaylist: any}) {
  const [show, setShow] = useState(false);
  const [songLink, setsongLink] = useState("")
  const ipcRenderer = (window as any).ipcRenderer;




  const handleClose = () => {
    setShow(false);
    setsongLink(""); // Clear the playlist name when closing the modal
  };

  const handleShow = () => setShow(true);

  const handleInputChange = (e: any) => {
    setsongLink(e.target.value); // Update the playlist name as the user types
  };



  
  const HandleAddSong = () => {
    ipcRenderer.send("downloadSpotify", JSON.stringify({url: songLink, CurrentPlaylist: currentPlaylist.name}));
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
              <h3 className="modalHeadings">Add A Song</h3>
            </div>
            <div className="modal-body">
              <input
                className="modal-input-name"
                type="text"
                placeholder="Song Spotify Link..."
                value={songLink} // Use the state value
                onChange={handleInputChange} // Update the state as the user types
              />
            </div>
            <div className="modal-footer">
              <button className="modal-button" onClick={handleClose}>
                Close
              </button>
              <button className="modal-button" onClick={HandleAddSong}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AddSong