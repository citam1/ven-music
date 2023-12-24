import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import aurorianDance from './assets/pictures/aurorian-dance.jpg';
import AddPlaylist from './components/AddPlaylist';
import "./components/Modal.css";
import "./App.css"
import { ProgressBar } from 'react-bootstrap';

import DeleteSong1 from './components/DeleteSong';
import AddSong from './components/AddSong';

interface Song {
  "name": string,
  "artist": string,
  "durationMS": number
}

interface Playlist {

}

function App() {
  const formatDuration = (duration: number) => {
    const minutes: number = Math.floor(duration / 60000);
    const seconds: string = Math.floor((duration % 60000) / 1000).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };


const [currentSong, SetCurrentSong] = useState({"name": "", "artist": "", "durationMS": 0})
const [isPlaying, SetPlaying] = useState(false)
const [currentVolume, setNewVolume] = useState(100)
const [isLoop, setNewLoop] = useState(false)
const [holding, setHolding] = useState(false)
const [allPlaylists, SetAllPlaylist] = useState([])
const [mainPage, setMainPage] = useState("playlist")
const [currentPlaylist, setCurrentPlaylist] = useState({
  name: "none",
  songs: [{ name: "", artist: "", durationMS: 0 }]
});
const [show, setShow] = useState(false);
const [shownDelete, setShownDelete] = useState(false)
const [playlistName, setPlaylistName] = useState("");

const ipcRenderer = (window as any).ipcRenderer

const [progressBarWidth, setProgressBarWidth] = useState(0);
const [currentPosSlider, setcurrentPosSlider] = useState(0);


useEffect(() => {
  async function fetchPlaylistByName(playlistName: any) {
    try {
      const data1 = await fetch("https://venshop.xyz/api/fetchPlaylists")
      const data = await data1.json()

      let selectedPlaylist: any;
      if (playlistName !== "none") {
        selectedPlaylist = data.playlists.find(
          (playlist: any) => playlist.name === playlistName
        );
      } else {
        selectedPlaylist = data.playlists[0];
      }

      if (selectedPlaylist) {
        setCurrentPlaylist((prevPlaylist) => ({
          ...prevPlaylist,
          songs: selectedPlaylist.songs || [],
        }));
      } else {
        // Handle the case where no playlist is found
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
      // Handle the error here, e.g., set a default playlist or show an error message
    }
  }

  fetchPlaylistByName(currentPlaylist.name);
}, [currentPlaylist.name]);


  function changeCurrentPlaylist(newName: string) {
    setCurrentPlaylist((prevPlaylist) => ({
      ...prevPlaylist,
      name: newName,
    }));
  }


  useEffect(() => {
    async function GetPlaylists1() {
      const data = await fetch("https://venshop.xyz/api/fetchPlaylists")
      const fetchedData = await data.json()

      
      const playlistNames:any = fetchedData.playlists.map((playlist: any) => playlist.name);
      SetAllPlaylist(playlistNames)
      
    }
    GetPlaylists1()
  }, [])
    
  function truncateNames(name: any) {
    if (name.length > 15) {
      return name.slice(0,15) + "..."
    } else {
      return name
    }
  }


    const audioTuneRef = useRef<HTMLAudioElement | null>(null);








    useEffect(() => {
        function updateProgressBar() {
            if (audioTuneRef.current) {
            const { currentTime, duration } = audioTuneRef.current;
            const percentageCompleted = (currentTime / duration) * 100;
            setProgressBarWidth(percentageCompleted);
            }
        }
        

        // Attach an event listener to the timeupdate event to update the progress bar
        if (audioTuneRef.current) {
            audioTuneRef.current.addEventListener('timeupdate', updateProgressBar);
        }

        return () => {
            // Cleanup: Remove the event listener on component unmount
            if (audioTuneRef.current) {
            audioTuneRef.current.removeEventListener('timeupdate', updateProgressBar);
            audioTuneRef.current.pause()
            }
            
        };
    }, [currentSong]);


    
    const [hasRendered, setHasRendered] = useState(1);

    useEffect(() => {
      async function setThingy() {
        if (currentSong.name !== "") {
          try {
            // Define the API endpoint for fetching the audio file
            const apiUrl = `https://venshop.xyz/api/fetchSong/${currentSong.name}`;
            
            // Fetch the audio file using the API endpoint
            const response = await fetch(apiUrl);
            const blob = await response.json();
    
            // Create a new Audio element
            const audioElement = new Audio(blob.url.publicUrl);
            audioTuneRef.current = audioElement; // Store the reference
    
            // Pause the audio if it's the first or second render
            if (hasRendered < 3) {
              audioTuneRef.current.pause();
              setHasRendered(prevRender => prevRender + 1);
            } else {
              // Start or pause the audio based on the play state
              if (isPlaying) {
                SetPlaying(true);
                audioTuneRef.current.play();
              } else {
                SetPlaying(false);
                audioTuneRef.current.pause();
              }
            }
          } catch (error) {
            console.error('Error loading audio file:', error);
          }
        } else {
          // Clear the existing audio if needed
          if (audioTuneRef.current) {
            audioTuneRef.current.pause();
            audioTuneRef.current = null;
          }
        }
      }
    
      setThingy();
    
      return () => {
        // Cleanup on component unmount
        if (audioTuneRef.current) {
          audioTuneRef.current.pause();
          audioTuneRef.current = null;
        }
      };
    }, [currentSong]);

  useEffect(() => {
    // Check if looping is disabled and the current song is playing
    if (!isLoop && isPlaying && audioTuneRef.current) {
      // Event listener for the end of the audio playback
      console.log("ended")
      const handleEnd = () => {
        // Find the index of the current song in the playlist
        const currentIndex = currentPlaylist.songs.findIndex(
          (song) => song.name === currentSong.name
        );
  
        // Check if it's the last song in the playlist
        if (currentIndex !== -1 && currentIndex === currentPlaylist.songs.length - 1) {
          // Restart the playlist by playing the first song again
          const firstSong = currentPlaylist.songs[0];
          SetCurrentSong(firstSong);
          audioTuneRef.current?.play();
          function setPlaying() {
            if (isPlaying) {
              audioTuneRef.current?.play()
              UpdateProgress()
            }
          }
          setTimeout(() => {
            setPlaying()
          }, (500));
        } else {
          // Play the next song if there is one
          if (currentIndex !== -1 && currentIndex < currentPlaylist.songs.length - 1) {
            const nextSong = currentPlaylist.songs[currentIndex + 1];
            SetCurrentSong(nextSong);
            audioTuneRef.current?.play();
            function setPlaying() {
              if (isPlaying) {
                audioTuneRef.current?.play()
                UpdateProgress()
              }
            }
            setTimeout(() => {
              setPlaying()
            }, (500));
          }
        }
      };
  
      audioTuneRef.current.addEventListener('ended', handleEnd);
  
      return () => {
        // Cleanup: Remove the event listener on component unmount or when isLoop changes
        audioTuneRef.current?.removeEventListener('ended', handleEnd);
      };
    } else if (isLoop) {
      if (audioTuneRef.current) {
        audioTuneRef.current.loop = isLoop;
      } 
    }

  }, [isLoop, isPlaying, currentSong, currentPlaylist]);
  

  function TogglePlay() {
    SetPlaying(prevIsPlaying => {
      if (audioTuneRef.current) {
        if (prevIsPlaying) {
          audioTuneRef.current.pause();
        } else {
          audioTuneRef.current.play();
        }
      }
      return !prevIsPlaying;
    });
  }

  function setVolume(event: any) {
    const newVolume = event.target.value;
    if (audioTuneRef.current) {
        audioTuneRef.current.volume = newVolume / 100;
      setNewVolume(newVolume);
    }
  }
    

  function toggleLoop() {
    if (audioTuneRef.current) {
        setNewLoop(prevLoop => !prevLoop)
        audioTuneRef.current.loop = isLoop
    }
    
  }




  

    /*const [shownDelete, setShownDelete] = useState(false) */
    const handleClose = () => {
      setShownDelete(false);
    };
  
    const handleShow = () => setShownDelete(true);
  
  
    const PlaylistDelete = (songName: any) => {
      console.log(JSON.stringify({ songName: songName, CurrentPlaylist: currentPlaylist.name }))
      ipcRenderer.send("deleteSong", JSON.stringify({ songName: songName, CurrentPlaylist: currentPlaylist.name }));
      handleClose();

    };


  const handleMouseDown = () => {
    setHolding(true);
  };

  const handleMouseUp = () => {
    setHolding(false);
  };

/*
  function setVolume(event: any) {
    const newVolume = event.target.value;
    if (audioTuneRef.current) {
        audioTuneRef.current.volume = newVolume / 100;
      setNewVolume(newVolume);
    }
  }

const [progressBarWidth, setProgressBarWidth] = useState(0);
*/





function UpdateProgress() {
  if (audioTuneRef.current) {
    const { currentTime, duration } = audioTuneRef.current;
    const percentageCompleted = (currentTime / duration) * 100;

    setProgressBarWidth(percentageCompleted)
}
}


function UpdateCurrentProgressBar(event: any) {
  const sliderPos = parseFloat(event.target.value);
  
  if (audioTuneRef.current) {
    const { duration } = audioTuneRef.current;
    const newTime = (sliderPos / 100) * duration;
    audioTuneRef.current.currentTime = newTime;
    setcurrentPosSlider(sliderPos);
  }
}

useEffect(() => {
  setProgressBarWidth(0)
}, [currentSong])

useEffect(() => {
  if (audioTuneRef.current) {
    audioTuneRef.current.addEventListener('timeupdate', UpdateProgress);
  }

  return () => {
    if (audioTuneRef.current) {
      audioTuneRef.current.removeEventListener('timeupdate', UpdateProgress);
    }
  };
}, [isPlaying, currentSong, audioTuneRef.current, audioTuneRef.current?.onplaying, audioTuneRef.current?.onplay, audioTuneRef.current?.onpause]);



function skipAhead() {
  const songs = currentPlaylist.songs;
  const currentSongIndex = songs.findIndex((song: any) => song.name === currentSong.name);

  if (currentSongIndex !== -1) {
    SetCurrentSong((prevSong) => ({
      ...prevSong,
      name: currentSongIndex === songs.length - 1 ? songs[0].name : songs[currentSongIndex + 1].name,
    }));
  }
  function setPlaying1() {
    if (isPlaying) {
      audioTuneRef.current?.play()
      UpdateProgress()
    }
  }
  setTimeout(() => {
    setPlaying1()
  }, (500));
}

function skipBack() {
  const songs = currentPlaylist.songs;
  const currentSongIndex = songs.findIndex((song: any) => song.name === currentSong.name);

  if (currentSongIndex !== -1) {
    SetCurrentSong((prevSong) => ({
      ...prevSong,
      name: currentSongIndex === 0 ? songs[songs.length - 1].name : songs[currentSongIndex - 1].name,
    }));
  }
  function setPlaying1() {
    if (isPlaying) {
      audioTuneRef.current?.play()
      UpdateProgress()
    } else {
      SetPlaying(true)
      audioTuneRef.current?.play()
      UpdateProgress()
    }
  }
  setTimeout(() => {
    setPlaying1()
  }, (500));
}




  return (
    <>
      <div className='Wrapper'>
        <div className='UpperPageWrapper'>
          <div className='sidebar'>
            <div className='Logo'>
              <h2>VEN</h2>
              <p>music</p>
            </div>
            <div className='Account'>
              <h3 className='SidebarTitles'>
                <Icon icon='mdi:account-outline' width='30' height='30' />
                Account
              </h3>
              <div className='AccountItems'></div>
            </div>
            <div className='Playlists'>
              <div className='playlistNames'>
                <h3 id='PlaylistTile' className='SidebarTitles'>
                  <Icon icon='carbon:playlist' width='30' height='30' />
                  Playlists
                </h3>
                <AddPlaylist />
              </div>
              <div className='PlaylistButtons'>
                {allPlaylists &&
                allPlaylists.map((allPlaylists) => (
                    <button className='PlaylistBut' onClick={() => changeCurrentPlaylist(allPlaylists)} >
                    <span className='playlistname'>{truncateNames(allPlaylists)}</span>
                    <span className='playlistType'>
                        <Icon icon='mdi:dot' width='15' height='15' />
                        playlist
                    </span>
                    </button>
                ))}
            </div>
            </div>
            {/*playlist sidear*/ }
          </div>
          <div className='MainPage'>
                {mainPage == "main" && (
                  <p>main page</p>
                )}
                {mainPage == "playlist" && (
                  <div className='PlaylistWrapper'>
                  <div className='PlaylistInfo'>
                    <div className='PlaylistImgContainer'>
                      <img src={aurorianDance} alt='Playlist cover' />
                    </div>
                    
                    <h2 className='PlaylistNameInfo'>{currentPlaylist.name}</h2>
                  </div>
                  <div className='SongList'>
                    <h3 className='Songs'>Songs</h3>
                    <div className='songsContainer'>
                      {currentPlaylist &&
                        currentPlaylist.songs.map((song1) => (
                          
                          <div className='song' key={song1.name} >
                            <button className='PlaySongButton' onClick={() => {
                              SetCurrentSong({name: song1.name, artist: song1.artist, durationMS: song1.durationMS})
                              audioTuneRef.current?.play()
                            }}>
                              <Icon icon={currentSong.name == song1.name && isPlaying ? 'solar:pause-broken' : 'solar:play-broken'} width='16' height='16' />
                              
                            </button>
                            <div className='songInfos'>
                              <div className='TitlesAndAuthors'>
                                <h4 className='SongXName' style={{ color: currentSong.name === song1.name ? '#bd93f9' : '#80848e' }}>{song1.name}</h4>
                                <p className='songAuthors'>{song1.artist}</p>
                              </div>
                              
                              </div>
                              <div className='songInfos'>
                                <p className='DurationInMs' style={{ color: currentSong.name === song1.name ? '#bd93f9' : '#80848e' }}>{formatDuration(song1.durationMS)}</p>
                                <DeleteSong1 songName={song1.name} currentPlaylist={currentPlaylist} />

                              </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className='AddSongButton'>
                  <AddSong currentPlaylist={currentPlaylist}/>
                  </div>
                </div>
                )}
          </div>
        </div>
            <div className='LowerPageWrapper'>
          <div className='SongBorderValue'>
            <div className="ProgressBar" style={{width: `${progressBarWidth}%`}}></div>
            <input
              type='range'
              min='1'
              max='100'
              value={progressBarWidth}
              onChange={UpdateCurrentProgressBar}
              className='ProgressBarSlider'
            />
          </div>
          <div className='SongStats'>
            <div className='SongInfo'>
              <div className='songPicture'>
                <img src={aurorianDance} alt='Song cover' />
              </div>
              <div className='SongText'>
                <h4 className='songTitle'>{truncateNames(currentSong?.name) || 'SongTitle'}</h4>
                <p className='songAuthor'>{currentSong?.artist || ''}</p>
              </div>
            </div>
            <div className='SongActions'>
            <button className='ActionButton' onClick={skipBack}>
                <Icon icon='solar:skip-previous-broken' width='22' height='22' />
              </button>
              <button className='ActionButton' onClick={TogglePlay}>
                <Icon icon={isPlaying ? 'solar:pause-broken' : 'solar:play-broken'} width='22' height='22' />
                
              </button>
              <button className='ActionButton' onClick={skipAhead}>
                <Icon icon='solar:skip-next-broken' width='22' height='22' />
              </button>
              <button className='ActionButton' onClick={toggleLoop}>
                <Icon icon='teenyicons:loop-solid' width='22' height='22' style={{color: isLoop ? "#bd93f9" : "dee7f9"}} />
              </button>
              {/* Add other song actions here */}
            </div>
            <div className='SongSettings'>
            <div className='volumeSliderDiv'>
            <input
                type='range'
                min='1'
                max='100'
                value={currentVolume}
                onChange={setVolume}
                className='volumeSlider'
            />
            </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
