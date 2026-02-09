import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className='min-h-screen bg-gray-100'>
        <h1 className='text-4xl font-bold text-center py-10'>
          Textlo
        </h1>
        <p className='text-center text-gray-600'>
          실시간 채팅 애플리케이션
        </p>
      </div>
    </Router>
  )
}

export default App;