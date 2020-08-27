import React, { Component } from 'react'
import chroma from 'chroma-js'
import Paragraph from 'libe-components/lib/text-levels/Paragraph'

class FranceMap extends Component {
  render () {
    const { data } = this.props
    const mapWestBound = -4.795264
    const mapEastBound = 9.560000
    const mapSouthBound = 41.364524
    const mapNorthBound = 51.088957
    return <div className='france-map'>
      <img alt='Map of France' src='./france-map.svg' />
      <div className='france-map__markers'>{
        data.map(city => {
          const voteRatio = (100 * city.south / (city.north + city.south)) || 0
          const latitudeRatio = 100 - (100 * (city.latitude - mapSouthBound) / (mapNorthBound - mapSouthBound))
          const latitudeRatioCorrect = latitudeRatio + 2 * Math.pow(Math.sin(Math.PI * latitudeRatio / 100), 2)
          const hPos = 100 * (city.longitude - mapWestBound) / (mapEastBound - mapWestBound)
          
          const colorRange = chroma.scale(['#95D5F0', '#ACDEF3', '#C3E6F5', '#DAEFF8', '#F9F9F9', '#FBFAE6', '#FBF9D2', '#FBF7BE', '#FBF6A9', '#FBF495']).mode('lab')
          const color = colorRange(voteRatio / 100).hex()
          
          return <div
            className='france-map__marker'
            key={city.name}
            style={{ top: `${latitudeRatioCorrect}%`, left: `${hPos}%`, background: color }}>
            <Paragraph small><span className='france-map__vote-ratio-marker'>{Math.round(voteRatio)}%</span></Paragraph>
            <Paragraph><span className='france-map__name-marker'>{city.name.replace(/\s/igm, ' ')}</span></Paragraph>
          </div>
        })
    }</div>
    </div>
  }
}

export default FranceMap
