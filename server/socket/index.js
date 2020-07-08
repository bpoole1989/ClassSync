//the sessionData will be in this format:
// sessionData: {
//   sessionId:  {
//     studentId: {
//       socketId,
//       faceCount,
//       faceDetections,
//       wordCount,
//       keyCount,
//       clickCount
//     },
//     studentId: {
//       socketId,
//       faceCount,
//       faceDetections,
//       wordCount,
//       keyCount,
//       clickCount
//     },
//     etc...
//   }
// }
let teacher = {id: null, socket: null}
let sessionData = {}
let sessionId = null
let live = false

module.exports = io => {
  io.on('connection', socket => {
    console.log(`A socket connection to the server has been made: ${socket.id}`)

    socket.on('disconnect', () => {
      console.log('disconnect')
      // if (socket.id === teacher.socket)
      //   console.log(`The teacher disconnected from socket ${socket.id}`)
      // else {
      //   for (studentId in sessionData[sessionId]) {
      //     if (socket.id === sessionData[sessionId][studentId].socket)
      //       console.log(
      //         `Student ${studentId} disconnected from socket ${socket.id}`
      //       )
      //     io.to(teacher.socket).emit('student-disconnect', studentId)
      //     return
      //   }
      // }
    })

    socket.on('start-session', (teacherId, sessionDetails) => {
      //if there is unsaved data from an old session, save it now

      teacher = {id: null, socket: null}
      sessionData = {}
      sessionId = null

      teacher.id = teacherId
      teacher.socket = socket.id

      //create session in database here, and get its id

      sessionId = 'test'
      sessionData[sessionId] = {}
      socket.broadcast.emit('start-session')
      live = true
    })

    socket.on('end-session', () => {
      socket.broadcast.emit('end-session')
      live = false
    })

    socket.on('accept', (studentId, data) => {
      sessionData[sessionId][studentId] = {socket: socket.id, ...data}
    })

    socket.on('cancel', (studentId, first, last) => {
      io.to(teacher.socket).emit('cancel', socket.id, studentId, first, last)
    })

    socket.on('re-invite', socketId => {
      io.to(socketId).emit('start-session')
    })

    socket.on('reconnect', userId => {
      // if (live) {
      //   if (teacher.id === userId) {
      //     teacher.socket = socket.id
      //     io.to(socket.id).emit('reconnected')
      //   } else if (sessionData[sessionId][userId]) {
      //     sessionData[sessionId][userId].socket = socket.id
      //     io.to(socket.id).emit('reconnected', sessionData[sessionId][userId])
      //   }
      // }
    })

    socket.on('data', (studentId, data) => {
      if (live) {
        sessionData[sessionId][studentId] = {
          ...sessionData[sessionId][studentId],
          ...data
        }
        console.log('session data', sessionData)
        io.to(teacher.socket).emit('data', studentId, data)
      }
    })

    socket.on('logout', () => {
      console.log('logout')
      // if (socket.id === teacher.socket) {
      //   socket.disconnect(true)
      //   console.log(
      //     `The teacher logged out and disconnected from socket ${socket.id}`
      //   )
      // } else {
      //   for (studentId in sessionData[sessionId]) {
      //     if (socket.id === sessionData[sessionId][studentId].socket)
      //       console.log(
      //         `Student ${studentId} disconnected from socket ${socket.id}`
      //       )
      //     io.to(teacher.socket).emit('student-disconnect', studentId)
      //     return
      //   }
      // }
    })
  })
}
