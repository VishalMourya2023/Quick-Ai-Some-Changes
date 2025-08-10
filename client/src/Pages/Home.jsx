import React from 'react'
import Navbar from '../Components/Nabvar'
import Hero from '../Components/Hero'
import AiTool from '../Components/AiTool'
import Testimonial from '../Components/Testimonial'
import Plan from '../Components/Plan'
import Footer from '../Components/Footer'

const Home = () => {
  return (
    <>
        <Navbar/>
        <Hero/>
        <AiTool/>
        <Testimonial/>
        <Plan/>
        <Footer />
    </>
  )
}

export default Home