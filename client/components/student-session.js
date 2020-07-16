import React from 'react'
import Iframe from 'react-iframe'
import {connect} from 'react-redux'
// import {} from '@material-ui/core'
import {makeStyles} from '@material-ui/styles'

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    zeroMinWidth: true,
    backgroundColor: '#f8fcd9'
  },
  h1: {
    textAlign: 'center',
    color: '#393a34'
  }
}))

const StudentSession = ({student, status}) => (
  <div id="student-session">
    <h1 id="session-message">
      {status.live
        ? 'The class session is live!'
        : 'Please await class session start by the teacher'}
    </h1>
    {status.live && (
      <div id="is-Live">
        <Iframe
          url={
            status.url ||
            'https://docs.google.com/forms/d/e/1FAIpQLSfOzBcCZd61vHVLGe_f9BlOnWrILPx6G_dT9Ahz3fOE5ikUCQ/viewform?usp=sf_link'
          }
          SameSite="none"
          Secure
          width="600px"
          height="600px"
          id="student-assignment"
          className="myClassname"
          display="initial"
          position="relative"
        />
      </div>
    )}
  </div>
)

const mapState = state => {
  return {
    status: state.status
  }
}

export default connect(mapState)(StudentSession)
