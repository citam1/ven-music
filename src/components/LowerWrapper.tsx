
import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import aurorianDance from '../assets/pictures/aurorian-dance.jpg';

const ipcRenderer = (window as any).ipcRenderer

interface Song {
    "name": string,
    "artist": string,
    "durationMS": number
}

function LowerWrapper() {

    const [currentSong, SetCurrentSong] = useState({"name": "", "artist": "", "durationMS": 0})
    const [isPlaying, SetPlaying] = useState(false)
    const [currentVolume, setNewVolume] = useState(100)
    const [isLoop, setNewLoop] = useState(false)
    const [progressBarWidth, setProgressBarWidth] = useState(0);

    const audioTuneRef = useRef<HTMLAudioElement | null>(null);

    function setLastPlayedSong(Song: Song) {
      console.log("wtf")
        SetCurrentSong(previousSong => {
            return {...previousSong, name: Song.name, artist: Song.artist, durationMS: Song.durationMS}
        })
        console.log(Song)
        ipcRenderer.send('saveLast', Song);
    }


    useEffect( () => {

        const setDefaultSong = async() => {
            const FetchedSong = await fetch("last.json")
            const returnedData = await FetchedSong.json()
            console.log(returnedData)
            if (FetchedSong) {
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
          const musicModule = await import(`../assets/music/${currentSong.name}.mp3`);
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

export default LowerWrapper