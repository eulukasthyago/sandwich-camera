import { useEffect, useRef, useState } from 'react'
import { FluentProvider, Button, makeStyles, shorthands } from '@fluentui/react-components'
import { darkTheme } from './settings/theme'

const useStyle = makeStyles({
  innerWapper: {
    display: 'flex',
    columnGap: '15px',
    ...shorthands.padding('20px', '20px', '20px', '20px')
  }
})

function App(): JSX.Element {
  const styles = useStyle()

  const webcamRef = useRef<HTMLVideoElement>(null)
  const webcamStream = useRef<MediaStream | null>(null)

  const [webcam, setWebcam] = useState<MediaStream | null>()

  const handleStopWebcam = () => {
    // webcam?.getTracks().forEach((tracks) => {
    //   console.log(tracks)
    //   tracks.stop()
    // })
    console.log(webcam?.getTracks())
  }

  const handleStartWebcam = () => {
    webcam?.getTracks().forEach((tracks) => {
      tracks
    })
    console.log(webcam)
  }

  useEffect(() => {
    if (navigator && navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices) {
      console.log('Suportado')
      navigator.mediaDevices
        .getUserMedia({ video: { width: 1080 }, audio: false })
        .then((stream) => {
          if (webcamRef.current) webcamRef.current.srcObject = stream
          setWebcam(stream)
        })
    } else {
      console.log('Não Suportado')
    }
  }, [])

  return (
    <FluentProvider theme={darkTheme} style={{ minHeight: '100%' }}>
      <video
        id="videoWebcam"
        style={{ width: '100%', maxWidth: 1024 }}
        ref={webcamRef}
        autoPlay
      ></video>
      <div className={styles.innerWapper}>
        <Button appearance="primary">Record</Button>
        <Button appearance="secondary">Stop</Button>
        <Button appearance="secondary" onClick={handleStopWebcam}>
          Stop Webcam
        </Button>
      </div>
    </FluentProvider>
  )
}

export default App
