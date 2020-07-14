import {createStore, combineReducers, applyMiddleware} from 'redux'
import {createLogger} from 'redux-logger'
import thunkMiddleware from 'redux-thunk'
import {composeWithDevTools} from 'redux-devtools-extension'
import user from './user'
import liveStudents from './liveStudents'
import liveSession from './liveSession'
import studentReducer from './students'
import singleStudentReducer from './single-student'
import assignment from './assignment'

export const reducer = combineReducers({
  user,
  students: studentReducer,
  student: singleStudentReducer,
  liveStudents,
  liveSession,
  assignment
})

const middleware = composeWithDevTools(
  applyMiddleware(thunkMiddleware, createLogger({collapsed: true}))
)
const store = createStore(reducer, middleware)

export default store
export * from './user'
export * from './liveStudents'
export * from './liveSession'
export * from './students'
export * from './assignment'
