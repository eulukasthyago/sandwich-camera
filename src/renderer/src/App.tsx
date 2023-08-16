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

  const handleStartWebcam = useCallback(() => {
    if (navigator && navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices) {
      console.log('Suportado')
      navigator.mediaDevices
        .getUserMedia({
          video: { width: 1080 },
          audio: {
            deviceId: micSelected,
            autoGainControl: false
          }
        })
        .then((stream) => {
          if (webcamRef.current) webcamRef.current.srcObject = stream
          setVideoStream(stream)
          setIsWebcamOpened(true)
          console.log('Mic Start', micSelected)
        })
    } else {
      console.log('Não Suportado')
    }
  }, [videoStream, isWebcamOpened, micSelected])

  const handleStopWebcam = useCallback(() => {
    if (videoStream?.getVideoTracks() && videoStream.getVideoTracks()[0]) {
      videoStream.getVideoTracks()[0].stop()
      setIsWebcamOpened(!isWebcamOpened)
    }
    if (videoStream?.getAudioTracks()[0]) {
      videoStream?.getAudioTracks()[0].stop()
    }
  }, [videoStream, isWebcamOpened])

  const handleVideoStartRecord = useCallback(() => {
    setIsRording(!isRecording)
    console.log(isWebcamOpened)
  }, [isRecording, isWebcamOpened])

  const handleVideoStopRecording = useCallback(() => {
    setIsRording(!isRecording)
    console.log(isWebcamOpened)
  }, [isRecording, isWebcamOpened])

  const handleChangeMic = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setMicSelected(() => event.target.value)
    },
    [micSelected]
  )

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

  const selectMicId = useId()

  return (
    <FluentProvider theme={darkTheme} className={styles.princialContainer}>
      <div style={{ flex: 1 }}>
        <video
          id="videoWebcam"
          style={{ width: '100%', maxWidth: 1024, aspectRatio: 16 / 9, background: 'black' }}
          ref={webcamRef}
          autoPlay
        ></video>
      </div>
      <div className={styles.innerWapper}>
        {isWebcamOpened ? (
          !isRecording ? (
            <Button
              style={{ background: 'green' }}
              appearance="primary"
              onClick={handleVideoStartRecord}
            >
              Record
            </Button>
          ) : (
            <Button
              style={{ background: 'red' }}
              appearance="primary"
              onClick={handleVideoStopRecording}
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
              <option key={item.deviceId} value={item.deviceId}>
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
