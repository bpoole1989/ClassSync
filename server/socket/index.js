//data relevant to live sessions is declared here
let teacher = {id: null, socket: null}
let sessionData = {}
let studentData = {}
let live = false
let logouts = {}
let teacherTransmitInterval
let dataTimeout

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`A socket connection to the server has been made: ${socket.id}`)

    //check-in message sent whenever a new socket is opened for a logged-in user
    //if user is teacher => set teacher id and socket
    //if there is a live session => if student and they have data on session, socket ID is attached to that data
    //if not on session yet, send start session message to student and student join message to teacher
    socket.on('check-in', (user) => {
      if (user.isTeacher) {
        teacher.id = user.id
        teacher.socket = socket.id
        teacher.logout = false
        //this stops the timeout set to end data transmission after the teacher disconnects
        if (live) {
          clearTimeout(dataTimeout)
          io.to(socket.id).emit('rejoin')
        }
      } else if (live) {
        if (studentData[user.id]) {
          studentData[user.id].socket = socket.id
          logouts[user.id] = false
          io.to(socket.id).emit('rejoin')
          io.to(teacher.socket).emit('student-rejoin', {
            first: user.firstName,
            last: user.lastName,
            studentId: user.id,
          })
        } else if (user.id) {
          logouts[user.id] = false
          io.to(teacher.socket).emit('student-join', {
            first: user.firstName,
            last: user.lastName,
            studentId: user.id,
          })
          io.to(socket.id).emit('start-session')
        }
      }
    })

    //on user logout => if teacher, end the session; if student, inform the teacher; close socket
    socket.on('logout', (user) => {
      if (user.isTeacher && user.id === teacher.id) {
        console.log(`The teacher logged out`)
        teacher.logout = true

        if (live) {
          socket.broadcast.emit('end-session')
          live = false

          clearInterval(teacherTransmitInterval)
        }
      } else if (studentData[user.id]) {
        console.log(`Student ${user.id} logged out`)
        logouts[user.id] = true
        if (live)
          io.to(teacher.socket).emit('student-logout', {
            ...user,
            socket: socket.id,
          })
      }

      io.to(socket.id).emit('logout')
    })

    //On socket disconnect without having logged out, identify whether student or teacher =>
    //if teacher, set timeout to end session if they don't return; If student in session, inform the teacher
    socket.on('disconnect', () => {
      if (socket.id === teacher.socket && !teacher.logout) {
        console.log(`The teacher disconnected from socket ${socket.id}`)

        //if the teacher disconnects, we set a timeout that will end data transmission
        if (live)
          dataTimeout = setTimeout(() => {
            socket.broadcast.emit('end-session')
            live = false

            clearInterval(teacherTransmitInterval)
          }, 60000)
      } else if (live) {
        for (let studentId in studentData) {
          if (
            studentData.hasOwnProperty(studentId) &&
            socket.id === studentData[studentId].socket
          ) {
            if (!logouts[studentId]) {
              console.log(
                `Student ${studentId} disconnected from socket ${socket.id}`
              )
              io.to(teacher.socket).emit('student-disconnect', {
                studentId,
                first: studentData[studentId].firstName,
                last: studentData[studentId].lastName,
                socket: socket.id,
              })
              return
            } else console.log(`student disconnected from socket ${socket.id}`)
          }
        }
      }
    })

    //start message from teacher => session data is initialized, new session instance is created in database
    //Students are sent start message; Interval is set to send the teacher data pings
    socket.on('start-session', async (title, id, url) => {
      sessionData = {id}
      studentData = {}
      logouts = {}
      sessionData.attendance = 0

      socket.broadcast.emit('start-session', title, url)
      live = true

      teacherTransmitInterval = setInterval(() => {
        const time = Date.now()
        // console.log('teacherTransmitInterval -> time', time)

        const minutes = time / 60000
        // console.log('teacherTransmitInterval -> minutes', minutes)

        io.to(teacher.socket).emit(
          'session-data',
          minutes,
          sessionData,
          studentData
        )
      }, 4000)
    })

    // accept message from student => their data on the session is initialized if they are joining for the first time
    //if this is the first accept for the session, session data is also initialized
    socket.on('accept', (student, metrics) => {
      if (!studentData[student.id]) {
        studentData[student.id] = {
          id: student.id,
          socket: socket.id,
          firstName: student.firstName,
          lastName: student.lastName,
          imageUrl: student.imageUrl,
          data: {},
        }
        if (!sessionData.rawTotals) {
          sessionData.rawTotals = {...metrics}
          sessionData.averages = {...metrics}
        }
      }
    })

    //cancel message from student => their ID is sent to teacher
    socket.on('cancel', (studentId, first, last) => {
      io.to(teacher.socket).emit('cancel', {
        socket: socket.id,
        studentId,
        first,
        last,
      })
    })

    //re-invites routed to students from teacher
    socket.on('re-invite', (socketId) => {
      io.to(socketId).emit('start-session')
    })

    //data point from student => if session is live, add the data
    socket.on('student-data', (studentId, newData) => {
      if (live) {
        //if no data for this student yet, copy values, calculate faceScore, and session attendance variable
        if (!studentData[studentId].data.faceDetects) {
          studentData[studentId].data = {...newData}
          studentData[studentId].data.faceScore = Math.ceil(
            (studentData[studentId].data.faceCount /
              studentData[studentId].data.faceDetects) *
              100
          )
          sessionData.attendance++
        } else {
          //if data exists for student, add the new numbers and recalculate faceScore
          for (let metric in newData) {
            if (newData.hasOwnProperty(metric)) {
              studentData[studentId].data[metric] += newData[metric]
              studentData[studentId].data.faceScore = Math.ceil(
                (studentData[studentId].data.faceCount /
                  studentData[studentId].data.faceDetects) *
                  100
              )
            }
          }
        }

        //add new numbers to session data totals, calculate faceScore, and calculate average values for all students in attendance
        for (let metric in newData) {
          if (newData.hasOwnProperty(metric)) {
            sessionData.rawTotals[metric] += newData[metric]
            sessionData.rawTotals.faceScore = Math.ceil(
              (sessionData.rawTotals.faceCount /
                sessionData.rawTotals.faceDetects) *
                100
            )
            sessionData.averages[metric] = Math.ceil(
              sessionData.rawTotals[metric] / sessionData.attendance
            )
            sessionData.averages.faceScore = Math.ceil(
              (sessionData.averages.faceCount /
                sessionData.averages.faceDetects) *
                100
            )
          }
        }
      }
    })

    //end message from teacher => end message is sent to students, data message interval is cleared
    //session data is transmitted to the teacher client for axios save requests
    socket.on('end-session', (save) => {
      socket.broadcast.emit('end-session')
      live = false

      clearInterval(teacherTransmitInterval)

      if (save && sessionData.rawTotals && sessionData.rawTotals.faceDetects)
        io.to(socket.id).emit('save-data', sessionData, studentData)
    })

    socket.on('save-data', () => {
      io.to(socket.id).emit('save-data', sessionData, studentData)
      console.log('studentData', studentData)
    })

    socket.on('save-logout', () => {
      io.to(socket.id).emit('save-logout', sessionData, studentData)
    })
  })
}
