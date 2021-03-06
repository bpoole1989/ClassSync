const router = require('express').Router()
const {Student, Session, StudentSession} = require('../db/models')
module.exports = router

router.get('/', async (req, res, next) => {
  try {
    const students = await Student.findAll({order: [['lastName', 'ASC']]})
    // const students = await Student.findAll({order: [['id', 'ASC']]})
    res.json(students)
  } catch (err) {
    next(err)
  }
})

router.get('/:studentid', async (req, res, next) => {
  try {
    const singleStudent = await Student.findOne({
      where: {
        id: req.params.studentid,
      },
    })
    res.json(singleStudent)
  } catch (error) {
    next(error)
  }
})

router.get('/allSessions/:id', async (req, res, next) => {
  try {
    const studentSess = await Student.findOne({
      where: {
        id: req.params.id,
      },
      include: {model: StudentSession},
    })
    res.json(studentSess)
  } catch (error) {
    next(error)
  }
})

router.put('/save', async (req, res, next) => {
  try {
    const studentData = req.body
    console.log('studentData', studentData)

    for (let id in studentData) {
      if (studentData.hasOwnProperty(id)) {
        // const saveObj = studentData[id].data
        console.log('id', id)
        const student = await Student.findByPk(+id)
        // await StudentSession.create(saveObj)
        const updatedObj = await student.avgData({...studentData[id].data})
        await student.update(updatedObj)
      }
    }

    res.sendStatus(200)
  } catch (error) {
    next(error)
  }
})
