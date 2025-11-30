'use client'

import Image from 'next/image'
// import { UploadButton } from '@/utils/uploadingthing'

// export default function Home() {
//   return (
//     <main className="flex min-h-screen flex-col items-center justify-between p-24">
//       <UploadButton
//         endpoint="imageUploader"
//         onClientUploadComplete={(res: any) => {
//           // Do something with the response
//           console.log('Files: ', res)
//           alert('Upload Completed')
//         }}
//         onUploadError={(error: Error) => {
//           // Do something with the error.
//           alert(`ERROR! ${error.message}`)
//         }}
//       />
//     </main>
//   )
// }

import React, { useState, useEffect } from 'react'
// import { Card, CardActionArea, CardContent, Button } from "@material-ui/core";

// import { useForm } from 'react-hook-form'

// import Fab from "@material-ui/core/Fab";
// import Grid from "@material-ui/core/Grid";

// import blue from "@material-ui/core/colors/blue";

// import AddPhotoAlternateIcon from "@material-ui/icons/AddPhotoAlternate";

// import { makeStyles } from "@material-ui/core/styles";
// const useStyles = makeStyles((theme) => ({
//   root: {
//     backgroundColor: theme.palette.background.paper,
//     width: "100%",
//     display: "flex",
//     flexDirection: "column",
//     justifyContent: "center"
//   },
//   icon: {
//     margin: theme.spacing(2)
//   },
//   cardContainer:{
//     width: "100px",
//     margin: "10px",
//   },
//   cardRoot: {
//     paddingBottom: "14px !important"
//   },
//   cardRootHide: {
//     paddingBottom: "14px !important",
//     margin: "-16px"
//   },
//   input: {
//     display: "none"
//   },
//   button: {
//     color: blue[900],
//     margin: 10
//   },
//   logo: {
//     width: "100px",
//     height: "100px"
//   },
//   submit: {
//     marginTop: theme.spacing(1),
//     marginRight: theme.spacing(1),
//     width: "120px",
//   }
// }));

export default function App() {
  // const classes = useStyles()
  // const { register, handleSubmit, reset } = useForm()
  const [uploadState, setUploadState] = useState('initial')
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {}, [image])

  const handleUploadClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const reader = new FileReader()
    if (file) {
      reader.readAsDataURL(file)
      reader.onloadend = function (e) {
        setImage(reader.result as string)
        setUploadState('uploaded')
      }
    }
  }

  const handleResetClick = (event: any) => {
    setImage(null)
    setUploadState('initial')
  }

  const onUpload = (data: any) => {}

  return (
    <div>
      <div>
        <div
        // className={uploadState !== 'uploaded' ? classes.cardRoot : classes.cardRootHide}
        >
          <div className="flex items-center justify-center">
            <input
              accept="image/jpeg,image/png,image/tiff,image/webp"
              // className={classes.input}
              id="contained-button-file"
              name="logo"
              // ref={register({ required: true })}
              type="file"
              onChange={handleUploadClick}
            />
            <label
              htmlFor="contained-button-file"
              // className={uploadState === 'uploaded' ? classes.input : null}
            >
              {/* <Fab component="span" className={classes.button}>
                <AddPhotoAlternateIcon />
              </Fab> */}
            </label>
          </div>
        </div>
        {uploadState === 'uploaded' && image && (
          <div onClick={handleResetClick}>
            <Image
              // className={classes.logo}
              src={image}
              alt="LOGO"
              width={100}
              height={100}
            />
          </div>
        )}
      </div>
      <button
      // variant="contained"
      // color="primary"
      // className={classes.submit}
      // onClick={handleSubmit(onUpload)}
      >
        Upload
      </button>
    </div>
  )
}
