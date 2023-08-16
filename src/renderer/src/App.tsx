import { useEffect, useRef, useState, useCallback } from 'react'
import {
  FluentProvider,
  Button,
  makeStyles,
  shorthands,
  Select,
  useId
} from '@fluentui/react-components'
import { darkTheme } from './settings/theme'

const useStyle = makeStyles({
  innerWapper: {
    display: 'flex',
    columnGap: '15px',
    ...shorthands.padding('20px', '20px', '20px', '20px')
  },

  princialContainer: {
    ...shorthands.flex(1),
    display: 'flex',
    flexDirection: 'column'
  }
})

function App(): JSX.Element {
  const styles = useStyle()
  const webcamRef = useRef<HTMLVideoElement>(null)

  const [isRecording, setIsRording] = useState(false)
  const [isWebcamOpened, setIsWebcamOpened] = useState(false)

  const [videoStream, setVideoStream] = useState<MediaStream>()
  const [micList, setMicList] = useState<MediaDeviceInfo[]>()
  const [micSelected, setMicSelected] = useState<ConstrainDOMString>()
  const [videoMediaRecorder, setVideoMediaRecorder] = useState<MediaRecorder>()
  const [videoChunks, setVideoChuncks] = useState<Blob[]>([])

  let  vChunks= []
  let vdStream

  const handleStartWebcam = useCallback(
    (micId) => {
      if (navigator && navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices) {
        navigator.mediaDevices
          .getUserMedia({
            video: { width: 1080 },
            audio: {
              deviceId: micId ? micId : micSelected,
              autoGainControl: false,
              echoCancellation: false,
              noiseSuppression: false
            }
          })
          .then((stream) => {
            if (webcamRef.current) webcamRef.current.srcObject = stream
            setVideoStream(stream)
            vdStream = stream
            setIsWebcamOpened(true)
          })
      } else {
        console.error('Não Suportado')
      }
    },
    [videoStream, isWebcamOpened, micSelected]
  )

  const handleStopWebcam = useCallback(() => {
    if (videoStream?.getVideoTracks() && videoStream.getVideoTracks()[0]) {
      videoStream.getVideoTracks()[0].stop()
      setIsWebcamOpened(!isWebcamOpened)
    }
    if (videoStream?.getAudioTracks()[0]) {
      videoStream?.getAudioTracks()[0].stop()
    }
  }, [videoStream, isWebcamOpened])

  const handleVideoStartRecord = (st) => {
    console.log(videoMediaRecorder)
    
  }

  const setRrecording = ():void => {
    setIsRording(!isRecording)
    handleStartWebcam()
  }

  const handleVideoStopRecording = useCallback(() => {
    if (videoMediaRecorder) {
      videoMediaRecorder.stop()
    }
  }, [isRecording, isWebcamOpened])

  const handleChangeMic = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setMicSelected(() => event.target.value)
      if (isWebcamOpened) handleStartWebcam(event.target.value)
    },
    [handleStartWebcam, micSelected]
  )

  const handleSaveData = (): void => {
    const videoBlob = new Blob(videoChunks)
    console.log(videoBlob)
    setVideoChuncks([])
  }

  useEffect(() => {
    if (navigator && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const audioDevices = devices.filter((device) => device.kind === 'audioinput')
        if (!micSelected) {
          setMicSelected(() => audioDevices[0].deviceId)
        }
        setMicList(audioDevices)
      })
    }
  }, [])

  console.log(vChunks)

  useEffect(() => {
    if (vdStream) {
      console.log(vdStream)
      const vdMediaRecorder = new MediaRecorder(vdStream)
      vdMediaRecorder.ondataavailable = (event): void => {
        setVideoChuncks((oldChunks) => [...oldChunks, event.data])
        console.log('gravado')
      }
      vdMediaRecorder.onstart = (event): void => {
        setIsRording(true)
        console.log('Ta on')
      }
      vdMediaRecorder.onstop = (event): void => {
        setIsRording(false)
        console.log('Ta off')
        handleSaveData()
      }
    }
  }, [vdStream])

  const selectMicId = useId()

  return (
    <FluentProvider theme={darkTheme} className={styles.princialContainer}>
      <div style={{ flex: 1 }}>
        <video
          id="videoWebcam"
          style={{ width: '100%', maxWidth: 1024, aspectRatio: 16 / 9, background: 'black' }}
          ref={webcamRef}
          autoPlay
          muted
        ></video>
      </div>
      <div className={styles.innerWapper}>
        {isWebcamOpened ? (
          !isRecording ? (
            <Button
              style={{ background: 'green' }}
              appearance="primary"
              onClick={setRrecording}
            >
              Record
            </Button>
          ) : (
            <Button
              style={{ background: 'red' }}
              appearance="primary"
              onClick={setRrecording}
            >
              Stop
            </Button>
          )
        ) : (
          <Button appearance="primary" disabled>
            Record
          </Button>
        )}
        {!isRecording ? (
          !isWebcamOpened ? (
            <Button appearance="secondary" onClick={handleStartWebcam}>
              Start Webcam
            </Button>
          ) : (
            <Button appearance="secondary" onClick={handleStopWebcam}>
              Stop Webcam
            </Button>
          )
        ) : (
          <Button appearance="secondary" disabled>
            Stop Webcam
          </Button>
        )}
        <Select id={selectMicId} onChange={handleChangeMic}>
          {micList?.map((item) => {
            return (
              <option disabled={isRecording} key={item.deviceId} value={item.deviceId}>
                {item.label}
              </option>
            )
          })}
        </Select>
      </div>
    </FluentProvider>
  )
}

export default App
