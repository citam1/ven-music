
import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import aurorianDance from '../assets/pictures/aurorian-dance.jpg';
import AddPlaylist from './AddPlaylist';

const ipcRenderer = (window as any).ipcRenderer

interface Song {
    "name": string,
    "artist": string,
    "durationMS": number
}


function PlaylistSideBar() {
  const [allPlaylists, SetAllPlaylist] = useState([])
  useEffect(() => {
    async function GetPlaylists1() {
      const cRepo = await fetch("/playlists.json")
      const fetchedData = await cRepo.json()
      
      const playlistNames = fetchedData.playlists.map((playlist: any) => playlist.name);
      SetAllPlaylist(playlistNames)
      
    }
    GetPlaylists1()
  }, [])
    
  function truncateNames(name: any) {
    if (name.length > 15) {
      return name.slice(0,15)
    } else {
      return name
    }
  }



    return(
        <>
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
                  
                    <button
                    className='PlaylistBut'
                    >
                    <span className='playlistname'>{truncateNames(allPlaylists)}</span>
                    <span className='playlistType'>
                        <Icon icon='mdi:dot' width='15' height='15' />
                        playlist
                    </span>
                    </button>
                ))}
            </div>
            </div>
        </>
    )
}


/*
function PlaylistMain() {




    return (
        <>
            <div className='PlaylistWrapper'>
              <div className='PlaylistInfo'>
                <div className='PlaylistImgContainer'>
                  <img src={aurorianDance} alt='Playlist cover' />
                </div>
                <h2 className='PlaylistNameInfo'>{playlistData?.name}</h2>
              </div>
              <div className='SongList'>
                <h3 className='Songs'>Songs</h3>
                <div className='songsContainer'>
                  {playlistData &&
                    playlistData.songs.map((song) => (
                      <div className='song' key={song.title}>
                        <button className='PlaySongButton' onClick={() => playSong(song)}>
                          <Icon icon='solar:play-broken' width='16' height='16' />
                        </button>
                        <div className='TitlesAndAuthors'>
                          <h4 className='SongXName'>{song.title}</h4>
                          <p className='songAuthors'></p>
                        </div>
                        <p className='DurationInMs'>{formatDuration(song.durationMs)}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
        </>
    )
}
*/
function LowerWrapper() {

    const [currentSong, SetCurrentSong] = useState({"name": "", "artist": "", "durationMS": 0})
    const [isPlaying, SetPlaying] = useState(false)
    const [currentVolume, setNewVolume] = useState(100)
    const [isLoop, setNewLoop] = useState(false)
    const [progressBarWidth, setProgressBarWidth] = useState(0);

    const audioTuneRef = useRef<HTMLAudioElement | null>(null);

    function setLastPlayedSong(Song: Song) {
        SetCurrentSong(previousSong => {
            return {...previousSong, name: Song.name, artist: Song.artist, durationMS: Song.durationMS}
        })
        ipcRenderer.send('saveLast', Song);
    }


    useEffect( () => {

        const setDefaultSong = async() => {
            const FetchedSong = await fetch("lastSong.json")
            const returnedData = await FetchedSong.json()
            if (returnedData) {
                const songTitle = returnedData.name
                const songAuthor = returnedData.artist
                setLastPlayedSong({name: songTitle, artist: songAuthor, durationMS: returnedData.durationMS})
            }
        }
        
        setDefaultSong()
    }, [])

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
            }
        };
    }, [currentSong]);


    

    useEffect(() => {
    async function setThingy() {
      if (currentSong.name !== "") {
        try {
          const musicModule = await import(`../music/${currentSong.name}.mp3`);
          const musicPath = musicModule.default;

          const audioElement = new Audio(musicPath);
          audioTuneRef.current = audioElement; // Store the reference

          if (isPlaying) {
            audioElement.play();
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


    return (
        <>
            <div className='LowerPageWrapper'>
          <div className='SongBorderValue'>
          <div className="ProgressBar">
            <div className="ProgressBarInner" style={{ width: `${progressBarWidth}%` }}/>
          </div>
          </div>
          <div className='SongStats'>
            <div className='SongInfo'>
              <div className='songPicture'>
                <img src={aurorianDance} alt='Song cover' />
              </div>
              <div className='SongText'>
                <h4 className='songTitle'>{currentSong?.name || 'SongTitle'}</h4>
                <p className='songAuthor'>{currentSong?.artist || ''}</p>
              </div>
            </div>
            <div className='SongActions'>
              <button className='ActionButton' onClick={TogglePlay}>
                <Icon icon={isPlaying ? 'solar:pause-broken' : 'solar:play-broken'} width='22' height='22' />
                
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
        </>
    )
}

export { LowerWrapper, PlaylistSideBar };