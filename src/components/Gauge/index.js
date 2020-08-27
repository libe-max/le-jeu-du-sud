import React, { Component } from 'react'
import Paragraph from 'libe-components/lib/text-levels/Paragraph'
import JSXInterpreter from 'libe-components/lib/logic/JSXInterpreter'
import chroma from 'chroma-js'

class Gauge extends Component {
  constructor () {
    super()
    this.drawDifferenceMarker = this.drawDifferenceMarker.bind(this)
  }

  componentDidMount () {
    window.addEventListener('resize', this.drawDifferenceMarker)
    window.setInterval(this.drawDifferenceMarker, 500)
  }

  drawDifferenceMarker (e) {
    const $differenceMarkers = [...document.querySelectorAll('.jauge__marker-wrapper')]
    $differenceMarkers.forEach(marker => {
      const boundingClientRect = marker.getBoundingClientRect()
      const { width, height } = boundingClientRect
      const diago = Math.pow(Math.pow(width, 2) + Math.pow(height, 2), .5)
      const angle = 180 * Math.atan(height / width) / Math.PI
      const $upDifferenceMarker = marker.querySelector('.jauge__up-difference-marker')
      const $downDifferenceMarker = marker.querySelector('.jauge__down-difference-marker')
      if ($upDifferenceMarker) {
        $upDifferenceMarker.style.width = `${diago}px`
        $upDifferenceMarker.style.transform = `translate(0, 50%) rotate(${-1 * angle}deg)`
      }
      if ($downDifferenceMarker) {
        $downDifferenceMarker.style.width = `${diago}px`
        $downDifferenceMarker.style.transform = `translate(0, -50%) rotate(${angle}deg)`
      }
    })
  }

  render () {
    const { data } = this.props
    const mapSouthBound = 41.364524
    const mapNorthBound = 51.088957

    return <div className='jauge'>
      <div className='jauge__latitude-bar' />
      <div className='jauge__markers'>
        <div className='jauge__markers-wrapper' ref={n => this.$markersWrapper = n}>{
          data.map(city => {
            const latitudeRatio = 100 - (100 * (city.latitude - mapSouthBound) / (mapNorthBound - mapSouthBound))
            const voteRatio = (100 * city.south / (city.north + city.south)) || 0
            const topValue = Math.min(latitudeRatio, voteRatio)
            const heightValue = Math.abs(latitudeRatio - voteRatio)
            const markerWarpperStyle = { top: `${topValue}%`, height: `${heightValue}%` }
            const isUpsideDown = latitudeRatio > voteRatio
            const colorRange = chroma.scale(['#95D5F0', '#ACDEF3', '#C3E6F5', '#DAEFF8', '#F9F9F9', '#FBFAE6', '#FBF9D2', '#FBF7BE', '#FBF6A9', '#FBF495'])
            const color = colorRange(latitudeRatio / 100).hex()
            return <div
              key={city.name}
              className='jauge__marker-wrapper'
              style={markerWarpperStyle}>
              <div className={isUpsideDown ? 'jauge__up-difference-marker' : 'jauge__down-difference-marker'} />
              <div className='jauge__latitude-marker' style={{ top: `${isUpsideDown ? 100 : 0}%` }}>
                <span className='jauge__city-marker jauge__city-marker_left'><Paragraph small><JSXInterpreter content={city.name.replace(/\s/igm, ' ').replace(/-/igm, '&#8209')} /></Paragraph></span>
              </div>
              <div className='jauge__vote-marker' style={{ top: `${isUpsideDown ? 0 : 100}%`, background: `${color}` }}>
                <span className='jauge__city-marker'><Paragraph small><JSXInterpreter content={city.name.replace(/\s/igm, ' ').replace(/-/igm, '&#8209')} /></Paragraph></span>
              </div>
            </div>
          })
        // data.map(city => {
        //   const latitudeRatio = 100 - (100 * (city.latitude - mapSouthBound) / (mapNorthBound - mapSouthBound))
        //   const voteRatio = 100 * city.south / (city.north + city.south)
        //   return <div className='jauge__latitude-point' style={{ top: `${latitudeRatio}%` }} />
        // })
        }</div>
      </div>
      <div className='jauge__votes-bar' />
    </div>
  }
}

export default Gauge



// <div className='jauge__difference-marker'>{
//   latitudeRatio > voteRatio
//   ? <img src='./up-diagonal.png' />
//   : <img src='./down-diagonal.png' />
// }</div>