
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './Pages/Home';
import Layouts from './Pages/Layouts';
import Dashboard from './Pages/dashboard';
import WriteArticle from './Pages/WriteArticle';
import BlogTitle from './Pages/BlogTitle';
import GenerateImages from './Pages/GenerateImages';
import Removebackground from './Pages/Removebackground';
import RemoveObjects from './Pages/RemoveObjects';
import ReviewResume from './Pages/ReviewResume';
import Community from './Pages/Community';
// import { useAuth } from '@clerk/clerk-react';
// import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast'

const App = () => {

  // const { getToken } = useAuth();
  // useEffect(() => {
  //   getToken().then((token) => console.log(token));
  // }, []);


  return (
    <>
    <Toaster/>
      <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/ai' element={<Layouts />}>  {/* Nested Routes*/}
            <Route index element={<Dashboard />}/>
            <Route path='write-article' element={<WriteArticle />} />
            <Route path='blog-titles' element={<BlogTitle />} />
            <Route path='generate-images' element={<GenerateImages />} />
            <Route path='remove-background' element={<Removebackground />} />
            <Route path='remove-object' element={<RemoveObjects />} />
            <Route path='review-resume' element={<ReviewResume />} />
            <Route path='community' element={<Community />} />
          </Route>
      </Routes>
    </>
  );
};

export default App;
