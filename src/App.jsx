import { RouterProvider } from 'react-router-dom'
import { router } from './routes/router'

/** 애플리케이션 라우터를 렌더링한다. */
const App = () => <RouterProvider router={router} />

export default App
