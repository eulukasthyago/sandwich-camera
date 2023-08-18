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
  const videoTesteRef = useRef<HTMLVideoElement>(null)

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

  const mimeType = 'video/webm;codecs=vp8,opus'

  const handleCanvaVideo = (): MediaStream => {
    Object.assign(videoCanvasRef.current, { width: 0, height: 0 })
    const ctx = videoCanvasRef.current.getContext('2d')

    const drawOnCanva = (image, width, height): void => {
      if (videoCanvasRef.current) {
        if (videoCanvasRef.current.width !== width || videoCanvasRef.current.height !== height) {
          videoCanvasRef.current.width = width
          videoCanvasRef.current.height = height
        }
      }
      if (ctx) {
        ctx.fillStyle = 'red'
        ctx.fillRect(0, 0, 100, 100)
        ctx.clearRect(0, 0, 300, 300)
        ctx.drawImage(image, 0, 0)
      }
    }

    // vidRef.current.srcObject = videoStream

    const scheduler = vidRef.current.requestVideoFrameCallback
      ? (cb): number => vidRef.current.requestVideoFrameCallback(cb)
      : requestAnimationFrame

    const draw = (): void => {
      const { videoWidth, videoHeight } = vidRef.current
      console.log('Esta Rodando')
      drawOnCanva(vidRef.current, videoWidth, videoHeight)
      scheduler(draw)
      console.log(videoCanvasRef.current.width)
      console.log(videoWidth, videoHeight)
    }
    console.log('Olár')
    setTimeout(function () {
      vidRef.current.play().then(draw)
    }, 0)

    return videoCanvasRef.current.captureStream()
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
            if (webcamRef.current) webcamRef.current.srcObject = stream
            if (videoTesteRef.current) videoTesteRef.current.srcObject = handleCanvaVideo()
            vidRef.current.srcObject = stream
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
    if (videoStream?.getVideoTracks() && videoStream.getVideoTracks()[0]) {
      videoStream.getVideoTracks()[0].stop()
      setIsWebcamOpened(!isWebcamOpened)
    }
    if (videoStream?.getAudioTracks()[0]) {
      videoStream?.getAudioTracks()[0].stop()
    }
  }, [videoStream, isWebcamOpened])

  const handleVideoStartRecord = useCallback(() => {
    if (videoStream) {
      const vdMediaRecorder = new MediaRecorder(videoStream)
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
      }

      videoMediaRecorder.current.start()

      setVideoChunks(() => localChunks)
    }
  }, [videoMediaRecorder, videoStream])

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

  useEffect(() => {
    const ctx = videoCanvasRef.current.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'red'
      ctx.fillRect(0, 0, 100, 100)
    }
    if (videoTesteRef.current)
      videoTesteRef.current.srcObject = videoCanvasRef.current.captureStream()
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
        <video
          id="videoCanva"
          style={{ width: '100%', maxWidth: 360, aspectRatio: 16 / 9, background: 'gray' }}
          ref={videoTesteRef}
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
