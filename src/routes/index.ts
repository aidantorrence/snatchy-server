
   
import { Router } from 'express'
import ankis from './ankis'
import tasks from './tasks'


const router = Router()

router.use(ankis)
router.use(tasks)


export default router