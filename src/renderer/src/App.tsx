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
  const videoStreamRef = useRef<MediaStream | null>(null)
  const videoCanvasStreamRef = useRef<MediaStream | null>(null)

  const [isRecording, setIsRording] = useState(false)
  const [isWebcamOpened, setIsWebcamOpened] = useState(false)

  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const [micList, setMicList] = useState<MediaDeviceInfo[]>()
  const [micSelected, setMicSelected] = useState<ConstrainDOMString>()
  const videoMediaRecorder = useRef<MediaRecorder | null>(null)
  const [videoChunks, setVideoChunks] = useState<Blob[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const { ipcRenderer } = window.electron

  const videoCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'))
  const vidRef = useRef<HTMLVideoElement>(document.createElement('video'))
  Object.assign(videoCanvasRef.current, { width: 0, height: 0 })
  const ctx = videoCanvasRef.current.getContext('2d')

  const scheduler = vidRef.current.requestVideoFrameCallback
    ? (cb): number => vidRef.current.requestVideoFrameCallback(cb)
    : requestAnimationFrame

  const mimeType = 'video/webm;codecs=vp8,opus'

  const handleDrawImageCanvaVideo = (image, width, height): void => {
    if (videoCanvasRef.current) {
      if (videoCanvasRef.current.width !== width || videoCanvasRef.current.height !== height) {
        videoCanvasRef.current.width = width
        videoCanvasRef.current.height = height
      }
    }
    if (ctx) {
      ctx.clearRect(0, 0, 300, 300)
      ctx.drawImage(image, 0, 0)
      ctx.fillStyle = 'red'
      ctx.fillRect(0, 0, 100, 100)
    }
  }

  const draw = (): void => {
    const { videoWidth, videoHeight } = vidRef.current
    handleDrawImageCanvaVideo(vidRef.current, videoWidth, videoHeight)
    scheduler(draw)
  }

  const handleAddAudioInCanvasVideo = (): void => {
    if (videoStreamRef.current && videoCanvasStreamRef.current) {
      videoCanvasStreamRef.current.addTrack(videoStreamRef.current.getAudioTracks()[0])
    }
  }

  const handleStartCanvaVideo = (): void => {
    videoCanvasStreamRef.current = videoCanvasRef.current.captureStream()
    handleAddAudioInCanvasVideo()
    setTimeout(() => {
      vidRef.current.muted = true
      vidRef.current.play().then(draw)
    }, 0)
  }

  const handleStartWebcam = useCallback(
    (micId) => {
      if (navigator && navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices) {
        navigator.mediaDevices
          .getUserMedia({
            video: { width: 1280, height: 720 },
            audio: {
              deviceId: micId ? micId : micSelected,
              autoGainControl: false,
              echoCancellation: false,
              noiseSuppression: false
            }
          })
          .then((stream) => {
            vidRef.current.srcObject = stream
            if (webcamRef.current) webcamRef.current.srcObject = videoCanvasStreamRef.current
            videoStreamRef.current = stream
            handleStartCanvaVideo()
            setVideoStream(stream)
            setIsWebcamOpened(true)
          })
      } else {
        console.error('Não Suportado')
      }
    },
    [videoStream, isWebcamOpened, micSelected]
  )

  const handleStopWebcam = useCallback(() => {
    if (videoStreamRef.current?.getVideoTracks() && videoStreamRef.current.getVideoTracks()[0]) {
      videoStreamRef.current.getVideoTracks()[0].stop()
      setIsWebcamOpened(!isWebcamOpened)
    }
    if (videoStreamRef.current?.getAudioTracks()[0]) {
      videoStreamRef.current?.getAudioTracks()[0].stop()
    }
  }, [isWebcamOpened])

  const handleVideoStartRecord = useCallback(() => {
    if (videoCanvasStreamRef.current) {
      const vdMediaRecorder = new MediaRecorder(videoCanvasStreamRef.current)
      videoMediaRecorder.current = vdMediaRecorder
      const localChunks: Blob[] = []
      videoMediaRecorder.current.ondataavailable = (event): void => {
        if (typeof event.data === 'undefined') return
        if (event.data.size === 0) return
        localChunks.push(event.data)
      }
      videoMediaRecorder.current.onstart = (event): void => {
        setIsRording(true)
        console.log('Ta on')
        console.log(videoCanvasRef)
      }

      videoMediaRecorder.current.start()

      setVideoChunks(() => localChunks)
    }
  }, [videoMediaRecorder])

  const handleVideoStopRecording = useCallback(() => {
    if (videoMediaRecorder.current) {
      videoMediaRecorder.current.stop()
      videoMediaRecorder.current.onstop = (event): void => {
        setIsRording(false)
        console.log('Ta off')
        handleSaveData()
      }
    }
  }, [videoMediaRecorder, videoChunks])

  const handleSaveData = useCallback(() => {
    const videoBlob = new Blob(videoChunks, { type: mimeType })
    const videoUrlBlob = URL.createObjectURL(videoBlob)
    console.log('Blob', videoBlob)
    console.log('Chunks', videoChunks)
    console.log(videoUrlBlob)
    setVideoUrl(videoUrlBlob)
    setVideoChunks([])
    videoBlob.arrayBuffer().then((blobBuffer) => {
      try {
        // const VBbuffer = Buffer.from(blobBuffer)
        ipcRenderer.send('save_buffer', blobBuffer)
      } catch (e) {
        console.log(e)
      }
    })
  }, [videoChunks, videoUrl])

  const handleChangeMic = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setMicSelected(() => event.target.value)
      if (isWebcamOpened) handleStartWebcam(event.target.value)
    },
    [handleStartWebcam, micSelected]
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
          style={{ width: '100%', maxWidth: 360, aspectRatio: 16 / 9, background: 'black' }}
          ref={webcamRef}
          autoPlay
          muted
          controls
        ></video>
        {videoUrl && <video src={videoUrl} controls></video>}
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
